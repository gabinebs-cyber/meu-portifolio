import jsonwebtoken from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export const JWT_SECRET = process.env.JWT_SECRET;

export function tokenValidado(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Acesso negado. Nenhum token fornecido." });
  }

  try {
    const payload = jsonwebtoken.verify(token, JWT_SECRET);
    req.usuario = JSON.parse(payload.usuario);
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Token inválido" });
  }
}

export function ehAdmin(req, res, next) {
  if (!req.usuario) {
    return res.status(401).json({ message: "Usuário não autenticado" });
  }

  if (req.usuario.tipo !== "ADMIN") {
    return res.status(403).json({ message: "Acesso negado. Requer privilégios de administrador." });
  }

  return next();
}
