import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { Router } from "express";
import { db } from "../db/client.js";
import { producers } from "../db/schema.js";
import { ApiError } from "../middlewares/errorHandler.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { createRateLimit } from "../middlewares/rateLimit.js";
import { decodeImageDataUrl } from "../utils/decodeImageDataUrl.js";

export const uploadRouter = Router();
const uploadRateLimit = createRateLimit(20, 15 * 60 * 1000, "uploads");

// Eu explico: As chaves sb_secret do Supabase são chaves de API, não JWTs: envie-as apenas em `apikey`.
// Eu explico: O bucket é público porque o app usa URLs públicas nas fotos de perfil e de produtos.
const storageHeaders = (apiKey: string, contentType: string): Record<string, string> => ({
  apikey: apiKey,
  "Content-Type": contentType,
  "x-upsert": "false",
});

uploadRouter.post("/perfil/imagem", uploadRateLimit, requireAuth, async (req, res) => {
  const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "agrifam-images";
  if (!supabaseUrl || !serviceKey) {
    throw new ApiError(503, "Configure SUPABASE_URL e SUPABASE_SECRET_KEY para habilitar uploads.");
  }

  const { contentType, extension, file } = decodeImageDataUrl(req.body?.dataUrl);
  // Eu explico: Cada envio ganha um caminho novo para nunca substituir uma foto sem aviso.
  const path = `${req.user!.sub}/profile/${randomUUID()}.${extension}`;
  const uploadResponse = await fetch(`${supabaseUrl}/storage/v1/object/${encodeURIComponent(bucket)}/${path}`, {
    method: "POST",
    headers: storageHeaders(serviceKey, contentType),
    body: file,
  });
  if (!uploadResponse.ok) {
    const detail = await uploadResponse.text();
    console.error("Supabase Storage profile image upload failed:", uploadResponse.status, detail);
    throw new ApiError(502, "O Supabase não conseguiu salvar sua foto. Confira o bucket de Storage.");
  }

  const image = `${supabaseUrl}/storage/v1/object/public/${encodeURIComponent(bucket)}/${path}`;
  res.status(201).json({ image });
});

uploadRouter.post("/produtor/imagens", uploadRateLimit, requireAuth, requireRole("producer"), async (req, res) => {
  const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "agrifam-images";
  if (!supabaseUrl || !serviceKey) {
    throw new ApiError(503, "Configure SUPABASE_URL e SUPABASE_SECRET_KEY para habilitar uploads.");
  }

  const kind = req.body?.kind === "store" ? "store" : "products";
  const { contentType, extension, file } = decodeImageDataUrl(req.body?.dataUrl);
  const producer = await db.query.producers.findFirst({ where: eq(producers.userId, req.user!.sub) });
  if (!producer) throw new ApiError(404, "Perfil de produtor não encontrado.");

  const path = `${producer.id}/${kind}/${randomUUID()}.${extension}`;
  const uploadResponse = await fetch(`${supabaseUrl}/storage/v1/object/${encodeURIComponent(bucket)}/${path}`, {
    method: "POST",
    headers: storageHeaders(serviceKey, contentType),
    body: file,
  });
  if (!uploadResponse.ok) {
    const detail = await uploadResponse.text();
    console.error("Supabase Storage upload failed:", uploadResponse.status, detail);
    throw new ApiError(502, "O Supabase não conseguiu salvar a imagem. Confira o bucket de Storage.");
  }

  const image = `${supabaseUrl}/storage/v1/object/public/${encodeURIComponent(bucket)}/${path}`;
  res.status(201).json({ image });
});
