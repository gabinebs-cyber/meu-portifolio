import bcrypt from "bcryptjs";
import Usuario from "./models/usuario.js";
import Categoria from "./models/categoria.js";
import Produto from "./models/produto.js";

const CATEGORIAS = ["Lanches", "Bebidas", "Doces", "Salgados", "Combos"];

const PRODUTOS = [
  {
    nome: "X-Burger",
    descricao: "Hambúrguer, queijo, alface, tomate e molho especial.",
    preco: 8.0,
    categoria: "Lanches",
    imagem: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600",
  },
  {
    nome: "Coxinha",
    descricao: "Massa crocante com recheio de frango.",
    preco: 4.0,
    categoria: "Salgados",
    imagem: "/imagens/produtos/coxinha.jpg",
  },
  {
    nome: "Pão de queijo",
    descricao: "Tradicional e delicioso.",
    preco: 3.0,
    categoria: "Salgados",
    imagem: "/imagens/produtos/pao-de-queijo.jpg",
  },
  {
    nome: "Suco de laranja",
    descricao: "Natural e refrescante.",
    preco: 4.0,
    categoria: "Bebidas",
    imagem: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=600",
  },
  {
    nome: "Refrigerante",
    descricao: "Lata 350ml.",
    preco: 4.0,
    categoria: "Bebidas",
    imagem: "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=600",
  },
  {
    nome: "Brigadeiro",
    descricao: "Doce tradicional.",
    preco: 3.0,
    categoria: "Doces",
    imagem: "https://images.unsplash.com/photo-1587668178277-295251f900ce?w=600",
  },
  {
    nome: "Combo X-Burger + Bebida",
    descricao: "X-Burger + Refrigerante 350ml.",
    preco: 12.0,
    categoria: "Combos",
    imagem: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=600",
  },
  {
    nome: "Pastel",
    descricao: "Recheio de carne ou queijo.",
    preco: 5.0,
    categoria: "Salgados",
    imagem: "https://images.unsplash.com/photo-1619740455993-9e612b1af08a?w=600",
  },
  {
    nome: "Bolo de cenoura",
    descricao: "Fatia com cobertura de chocolate.",
    preco: 5.0,
    categoria: "Doces",
    imagem: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600",
  },
  {
    nome: "Misto quente",
    descricao: "Pão de forma, presunto e queijo.",
    preco: 6.0,
    categoria: "Lanches",
    imagem: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600",
    disponivel: false,
  },
];

export default async function popularBanco() {
  const totalUsuarios = await Usuario.count();

  if (totalUsuarios === 0) {
    await Usuario.create({
      nome: "Aluno",
      email: "aluno@cantina.com",
      senha_hash: await bcrypt.hash("123456", 10),
      tipo: "COMUM",
    });

    await Usuario.create({
      nome: "Administrador",
      email: "admin@cantina.com",
      senha_hash: await bcrypt.hash("admin123", 10),
      tipo: "ADMIN",
    });

    console.log("Usuários criados: aluno@cantina.com / 123456 e admin@cantina.com / admin123");
  }

  const totalCategorias = await Categoria.count();

  if (totalCategorias === 0) {
    for (const nome of CATEGORIAS) {
      await Categoria.create({ nome });
    }

    for (const item of PRODUTOS) {
      const categoria = await Categoria.findOne({ where: { nome: item.categoria } });
      await Produto.create({
        nome: item.nome,
        descricao: item.descricao,
        preco: item.preco,
        imagem: item.imagem,
        categoria_id: categoria.id,
        disponivel: item.disponivel !== false,
      });
    }

    console.log("Categorias e produtos criados.");
  }
}
