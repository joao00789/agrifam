import { createHash } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

type Bucket = { count: number; resetAt: number };
type UpstashResult = { result?: number | [number, number]; error?: string };

// Eu explico: O script incrementa o contador e define sua expiração na mesma operação Redis.
const INCREMENT_SCRIPT =
  "local count = redis.call('INCR', KEYS[1]); if count == 1 then redis.call('PEXPIRE', KEYS[1], ARGV[1]); end; return {count, redis.call('PTTL', KEYS[1])}";

const getClientKey = (req: Request, identity?: (request: Request) => string, identityOnly = false) => {
  // Eu explico: Não guardamos o IP em texto puro no serviço de rate limit.
  const address = req.ip || req.socket.remoteAddress || "unknown";
  const identityPart = identity ? identity(req).slice(0, 254).toLowerCase() : "";
  return createHash("sha256").update(identityOnly && identityPart ? identityPart : `${address}|${identityPart}`).digest("hex");
};

const incrementSharedCounter = async (key: string, windowMs: number) => {
  const url = process.env.UPSTASH_REDIS_REST_URL?.replace(/\/$/, "");
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(["EVAL", INCREMENT_SCRIPT, "1", key, String(windowMs)]),
    signal: AbortSignal.timeout(2500),
  });

  if (!response.ok) throw new Error(`Upstash respondeu HTTP ${response.status}`);
  const payload = (await response.json()) as UpstashResult;
  if (payload.error) throw new Error(payload.error);
  if (!Array.isArray(payload.result) || payload.result.length !== 2) {
    throw new Error("Resposta inválida do Upstash Redis");
  }
  const [count, ttlMs] = payload.result;
  if (!Number.isFinite(count) || !Number.isFinite(ttlMs)) {
    throw new Error("Contador inválido retornado pelo Upstash Redis");
  }
  return { count, resetAt: Date.now() + Math.max(0, ttlMs) };
};

/* Eu explico: * Usa contador Redis compartilhado na hospedagem e memória apenas em desenvolvimento local. */
export const createRateLimit = (max: number, windowMs: number, scope = "geral", identity?: (request: Request) => string, identityOnly = false) => {
  const localBuckets = new Map<string, Bucket>();

  return async (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const key = `agrifam:rate-limit:${scope}:${getClientKey(req, identity, identityOnly)}`;
    let bucket: Bucket;

    try {
      const sharedBucket = await incrementSharedCounter(key, windowMs);
      if (sharedBucket) {
        bucket = sharedBucket;
      } else if (process.env.NODE_ENV === "production") {
        // Eu explico: Em produção, falhar fechado impede que uma variável ausente desative a proteção.
        res.status(503).json({ error: "Proteção temporariamente indisponível. Tente novamente." });
        return;
      } else {
        let localBucket = localBuckets.get(key);
        if (!localBucket || localBucket.resetAt <= now) {
          if (localBuckets.size >= 5000) {
            for (const [entryKey, entry] of localBuckets) {
              if (entry.resetAt <= now) localBuckets.delete(entryKey);
            }
            if (localBuckets.size >= 5000) {
              const oldestKey = localBuckets.keys().next().value;
              if (oldestKey !== undefined) localBuckets.delete(oldestKey);
            }
          }
          localBucket = { count: 0, resetAt: now + windowMs };
          localBuckets.set(key, localBucket);
        }
        localBucket.count += 1;
        bucket = localBucket;
      }
    } catch (error) {
      console.error("Falha no serviço compartilhado de rate limit:", error);
      // Eu explico: Não permita tentativas sem limite se o Redis falhar em produção.
      if (process.env.NODE_ENV === "production") {
        res.status(503).json({ error: "Proteção temporariamente indisponível. Tente novamente." });
        return;
      }
      next(error);
      return;
    }

    res.setHeader("RateLimit-Limit", String(max));
    res.setHeader("RateLimit-Remaining", String(Math.max(0, max - bucket.count)));
    res.setHeader("RateLimit-Reset", String(Math.ceil(bucket.resetAt / 1000)));
    if (bucket.count > max) {
      res.setHeader("Retry-After", String(Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))));
      res.status(429).json({ error: "Muitas tentativas. Aguarde alguns minutos e tente novamente." });
      return;
    }
    next();
  };
};
