import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import sequelize from "./config/database.js";
import authRoutes from "./routes/authRoutes.js";
import privateRoutes from "./routes/privateRoutes.js";
import popularBanco from "./seed.js";

import "./models/usuario.js";
import "./models/categoria.js";
import "./models/produto.js";
import "./models/pedido.js";
import "./models/itemPedido.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Imagens servidas pela própria API. Alguns bancos de imagem recusam requisições
// que não vêm de um navegador, e no celular a foto não carregava; guardando o
// arquivo aqui, a imagem chega do mesmo lugar que os dados.
const diretorioAtual = path.dirname(fileURLToPath(import.meta.url));
app.use("/imagens", express.static(path.join(diretorioAtual, "publico")));

app.get("/", (_, res) => res.status(200).json({ message: "API da Cantina Fácil disponível" }));
app.use("/auth", authRoutes);
app.use(privateRoutes);

(async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    await popularBanco();
    console.log("Banco sincronizado com sucesso.");
  } catch (error) {
    console.error("Erro ao conectar ao banco:", error);
  }
})();

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
