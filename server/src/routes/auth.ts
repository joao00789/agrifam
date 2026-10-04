import { Router } from "express";
import { deleteMyAccount, login, loginWithGoogle, logout, me, refreshSession, register, requestPasswordReset, resetPassword, startGoogleLogin, updateMe } from "../controllers/authController.js";
import { requireAuth } from "../middlewares/auth.js";
import { createRateLimit } from "../middlewares/rateLimit.js";

export const authRouter = Router();
const authRateLimit = createRateLimit(10, 15 * 60 * 1000, "autenticacao");
const loginEmailRateLimit = createRateLimit(10, 15 * 60 * 1000, "login-email", (req) => String(req.body?.email || "sem-email"), true);
const recoveryIpRateLimit = createRateLimit(10, 60 * 60 * 1000, "recuperacao-ip");
const recoveryEmailRateLimit = createRateLimit(3, 60 * 60 * 1000, "recuperacao-email", (req) => String(req.body?.email || "sem-email"), true);
const refreshRateLimit = createRateLimit(30, 15 * 60 * 1000, "refresh-sessao");
const accountDeleteRateLimit = createRateLimit(3, 60 * 60 * 1000, "exclusao-conta");

// Eu explico: POST /api/auth/register — cadastro de comprador ou produtor.
authRouter.post("/register", authRateLimit, register);
authRouter.get("/google", startGoogleLogin);
authRouter.get("/google/config", (_req, res) => {
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
  res.json({
    enabled: Boolean(process.env.SUPABASE_URL && publishableKey),
    url: process.env.SUPABASE_URL || null,
    publishableKey: publishableKey || null,
  });
});
authRouter.post("/google/callback", authRateLimit, loginWithGoogle);
authRouter.post("/refresh", refreshRateLimit, refreshSession);
authRouter.post("/password/forgot", recoveryIpRateLimit, recoveryEmailRateLimit, requestPasswordReset);
authRouter.post("/password/reset", authRateLimit, resetPassword);
// Eu explico: POST /api/auth — login, conforme contrato documentado no README.
authRouter.post("/", authRateLimit, loginEmailRateLimit, login);
authRouter.post("/logout", logout);
authRouter.get("/me", requireAuth, me);
authRouter.patch("/me", requireAuth, updateMe);
authRouter.delete("/me", requireAuth, accountDeleteRateLimit, deleteMyAccount);
