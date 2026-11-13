import sequelize from "../config/database.js";
import Pedido from "../models/pedido.js";
import ItemPedido from "../models/itemPedido.js";
import Produto from "../models/produto.js";

const SEQUENCIA_STATUS = ["RECEBIDO", "EM_PREPARO", "PRONTO", "RETIRADO"];

export default {
  async listar(req, res) {
    try {
      const filtro = req.usuario.tipo === "ADMIN" ? {} : { usuario_id: req.usuario.id };

      const pedidos = await Pedido.findAll({
        where: filtro,
        include: [
          {
            model: ItemPedido,
            as: "itens",
            include: [{ model: Produto, as: "produto" }],
          },
        ],
        order: [["id", "DESC"]],
      });

      return res.status(200).json({ data: pedidos });
    } catch (error) {
      return res.status(500).json({ message: "Erro ao listar pedidos" });
    }
  },

  async buscarPorId(req, res) {
    try {
      const pedido = await Pedido.findByPk(req.params.id, {
        include: [{ model: ItemPedido, as: "itens", include: [{ model: Produto, as: "produto" }] }],
      });

      if (!pedido) {
        return res.status(404).json({ message: "Pedido não encontrado" });
      }

      // Aluno só enxerga o próprio pedido; a cantina (ADMIN) enxerga todos.
      if (req.usuario.tipo !== "ADMIN" && pedido.usuario_id !== req.usuario.id) {
        return res.status(403).json({ message: "Este pedido não pertence a você" });
      }

      return res.status(200).json({ data: pedido });
    } catch (error) {
      return res.status(500).json({ message: "Erro ao buscar pedido" });
    }
  },

  async criar(req, res) {
    const transacao = await sequelize.transaction();
    try {
      const { itens } = req.body;

      if (!itens || itens.length === 0) {
        await transacao.rollback();
        return res.status(400).json({ message: "O pedido precisa ter ao menos um item" });
      }

      let valorTotal = 0;
      const itensValidados = [];

      for (const item of itens) {
        const produto = await Produto.findByPk(item.produto_id, { transaction: transacao });

        if (!produto) {
          await transacao.rollback();
          return res.status(400).json({ message: `Produto ${item.produto_id} não encontrado` });
        }
        if (!produto.disponivel) {
          await transacao.rollback();
          return res.status(400).json({ message: `${produto.nome} não está disponível` });
        }
        if (!item.quantidade || item.quantidade < 1) {
          await transacao.rollback();
          return res.status(400).json({ message: `Quantidade inválida para ${produto.nome}` });
        }

        const precoUnitario = Number(produto.preco);
        valorTotal += precoUnitario * item.quantidade;
        itensValidados.push({
          produto_id: produto.id,
          quantidade: item.quantidade,
          preco_unitario: precoUnitario,
        });
      }

      const pedido = await Pedido.create(
        {
          usuario_id: req.usuario.id,
          valor_total: valorTotal,
          status: "RECEBIDO",
        },
        { transaction: transacao }
      );

      for (const item of itensValidados) {
        await ItemPedido.create({ ...item, pedido_id: pedido.id }, { transaction: transacao });
      }

      await transacao.commit();

      const pedidoCriado = await Pedido.findByPk(pedido.id, {
        include: [{ model: ItemPedido, as: "itens", include: [{ model: Produto, as: "produto" }] }],
      });

      return res.status(201).json({ data: pedidoCriado });
    } catch (error) {
      await transacao.rollback();
      return res.status(500).json({ message: "Erro ao criar pedido" });
    }
  },

  // Aceita duas formas: sem corpo, avança para o próximo status da sequência;
  // com { status: "PRONTO" }, define diretamente o status informado.
  async alterarStatus(req, res) {
    try {
      const pedido = await Pedido.findByPk(req.params.id);

      if (!pedido) {
        return res.status(404).json({ message: "Pedido não encontrado" });
      }

      const { status } = req.body || {};

      if (status) {
        if (!SEQUENCIA_STATUS.includes(status)) {
          return res.status(400).json({
            message: `Status inválido. Use um destes: ${SEQUENCIA_STATUS.join(", ")}`,
          });
        }
        pedido.status = status;
      } else {
        const posicaoAtual = SEQUENCIA_STATUS.indexOf(pedido.status);
        if (posicaoAtual === SEQUENCIA_STATUS.length - 1) {
          return res.status(400).json({ message: "O pedido já foi retirado" });
        }
        pedido.status = SEQUENCIA_STATUS[posicaoAtual + 1];
      }

      await pedido.save();

      return res.status(200).json({ data: pedido });
    } catch (error) {
      return res.status(500).json({ message: "Erro ao avançar status" });
    }
  },
};
