import { Router } from "express";
import { tokenValidado, ehAdmin } from "../middlewares/auth.js";
import ProdutoController from "../controllers/ProdutoController.js";
import PedidoController from "../controllers/PedidoController.js";

const router = Router();

// Todas as rotas abaixo exigem um token JWT válido.
router.use(tokenValidado);

router.get("/categorias", ProdutoController.listarCategorias);
router.get("/categorias/:id", ProdutoController.buscarCategoriaPorId);
router.post("/categorias", ehAdmin, ProdutoController.criarCategoria);

router.get("/produtos", ProdutoController.listar);
router.get("/produtos/:id", ProdutoController.buscarPorId);
router.post("/produtos", ehAdmin, ProdutoController.criar);
router.put("/produtos/:id", ehAdmin, ProdutoController.atualizar);
router.delete("/produtos/:id", ehAdmin, ProdutoController.remover);

router.get("/pedidos", PedidoController.listar);
router.get("/pedidos/:id", PedidoController.buscarPorId);
router.post("/pedidos", PedidoController.criar);
router.put("/pedidos/:id/status", ehAdmin, PedidoController.alterarStatus);

export default router;
