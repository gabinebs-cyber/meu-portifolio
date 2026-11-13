import { Op } from "sequelize";
import Produto from "../models/produto.js";
import Categoria from "../models/categoria.js";
import ItemPedido from "../models/itemPedido.js";

export default {
  async listarCategorias(_, res) {
    try {
      const categorias = await Categoria.findAll({ order: [["id", "ASC"]] });
      return res.status(200).json({ data: categorias });
    } catch (error) {
      return res.status(500).json({ message: "Erro ao listar categorias" });
    }
  },

  async listar(req, res) {
    try {
      const { categoria_id, busca } = req.query;
      const where = {};

      if (categoria_id) {
        where.categoria_id = categoria_id;
      }
      if (busca) {
        where.nome = { [Op.like]: `%${busca}%` };
      }

      const produtos = await Produto.findAll({
        where,
        include: [{ model: Categoria, as: "categoria" }],
        order: [["id", "ASC"]],
      });

      return res.status(200).json({ data: produtos });
    } catch (error) {
      return res.status(500).json({ message: "Erro ao listar produtos" });
    }
  },

  async criarCategoria(req, res) {
    try {
      const { nome } = req.body;

      if (!nome) {
        return res.status(400).json({ message: "O nome da categoria é obrigatório" });
      }

      const categoria = await Categoria.create({ nome });
      return res.status(201).json({ data: categoria });
    } catch (error) {
      return res.status(500).json({ message: "Erro ao criar categoria" });
    }
  },

  async buscarCategoriaPorId(req, res) {
    try {
      const categoria = await Categoria.findByPk(req.params.id);

      if (!categoria) {
        return res.status(404).json({ message: "Categoria não encontrada" });
      }

      return res.status(200).json({ data: categoria });
    } catch (error) {
      return res.status(500).json({ message: "Erro ao buscar categoria" });
    }
  },

  async buscarPorId(req, res) {
    try {
      const produto = await Produto.findByPk(req.params.id, {
        include: [{ model: Categoria, as: "categoria" }],
      });

      if (!produto) {
        return res.status(404).json({ message: "Produto não encontrado" });
      }

      return res.status(200).json({ data: produto });
    } catch (error) {
      return res.status(500).json({ message: "Erro ao buscar produto" });
    }
  },

  async criar(req, res) {
    try {
      const { nome, descricao, preco, imagem, categoria_id, disponivel } = req.body;

      if (!nome || preco === undefined || !categoria_id) {
        return res
          .status(400)
          .json({ message: "Nome, preço e categoria são obrigatórios" });
      }
      if (Number(preco) <= 0) {
        return res.status(400).json({ message: "O preço precisa ser maior que zero" });
      }

      const categoria = await Categoria.findByPk(categoria_id);
      if (!categoria) {
        return res.status(400).json({ message: "Categoria não encontrada" });
      }

      const produto = await Produto.create({
        nome,
        descricao,
        preco,
        imagem,
        categoria_id,
        disponivel: disponivel !== false,
      });

      const criado = await Produto.findByPk(produto.id, {
        include: [{ model: Categoria, as: "categoria" }],
      });

      return res.status(201).json({ data: criado });
    } catch (error) {
      return res.status(500).json({ message: "Erro ao criar produto" });
    }
  },

  async atualizar(req, res) {
    try {
      const produto = await Produto.findByPk(req.params.id);

      if (!produto) {
        return res.status(404).json({ message: "Produto não encontrado" });
      }

      const { nome, descricao, preco, imagem, categoria_id, disponivel } = req.body;

      if (preco !== undefined && Number(preco) <= 0) {
        return res.status(400).json({ message: "O preço precisa ser maior que zero" });
      }
      if (categoria_id !== undefined) {
        const categoria = await Categoria.findByPk(categoria_id);
        if (!categoria) {
          return res.status(400).json({ message: "Categoria não encontrada" });
        }
      }

      // Só sobrescreve os campos que vieram no corpo da requisição.
      if (nome !== undefined) produto.nome = nome;
      if (descricao !== undefined) produto.descricao = descricao;
      if (preco !== undefined) produto.preco = preco;
      if (imagem !== undefined) produto.imagem = imagem;
      if (categoria_id !== undefined) produto.categoria_id = categoria_id;
      if (disponivel !== undefined) produto.disponivel = disponivel;

      await produto.save();

      const atualizado = await Produto.findByPk(produto.id, {
        include: [{ model: Categoria, as: "categoria" }],
      });

      return res.status(200).json({ data: atualizado });
    } catch (error) {
      return res.status(500).json({ message: "Erro ao atualizar produto" });
    }
  },

  async remover(req, res) {
    try {
      const produto = await Produto.findByPk(req.params.id);

      if (!produto) {
        return res.status(404).json({ message: "Produto não encontrado" });
      }

      // Produto já vendido não pode sumir: os pedidos antigos apontam para ele.
      const vendas = await ItemPedido.count({ where: { produto_id: produto.id } });
      if (vendas > 0) {
        return res.status(409).json({
          message: "Produto já usado em pedidos. Marque como indisponível em vez de excluir.",
        });
      }

      await produto.destroy();
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ message: "Erro ao remover produto" });
    }
  },
};
