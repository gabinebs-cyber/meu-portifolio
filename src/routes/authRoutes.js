import { Router } from "express";
import AuthController from "../controllers/AuthController.js";

const router = Router();

// Autenticação local
router.post("/registro", AuthController.registrar);
router.post("/login", AuthController.login);

// Autenticação via OAuth (fluxo Authorization Code do GitHub)
router.get("/github", AuthController.githubRedirecionar);
router.get("/github/callback", AuthController.githubCallback);

export default router;
