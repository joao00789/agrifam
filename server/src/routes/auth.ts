import { Router } from "express";
import { login, logout, me, register } from "../controllers/authController.js";
import { requireAuth } from "../middlewares/auth.js";

export const authRouter = Router();

// POST /api/auth/register — cadastro de comprador ou produtor.
authRouter.post("/register", register);
// POST /api/auth — login, conforme contrato documentado no README.
authRouter.post("/", login);
authRouter.post("/logout", logout);
authRouter.get("/me", requireAuth, me);
