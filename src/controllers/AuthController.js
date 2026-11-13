import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import Usuario from "../models/usuario.js";
import { JWT_SECRET } from "../middlewares/auth.js";

dotenv.config();

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const GITHUB_CALLBACK_URL = process.env.GITHUB_CALLBACK_URL;

// Monta o payload público do usuário e assina o JWT.
// É usado tanto pelo login local quanto pelo login via GitHub, de modo que o
// resto da API não precisa saber de onde veio a autenticação.
function gerarSessao(usuario) {
  const payload = {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    tipo: usuario.tipo,
  };

  const token = jwt.sign({ usuario: JSON.stringify(payload) }, JWT_SECRET, {
    expiresIn: "7d",
  });

  return { usuario: payload, token };
}

export default {
  async registrar(req, res) {
    try {
      const { nome, email, senha } = req.body;

      if (!nome || !email || !senha) {
        return res.status(400).json({ message: "Nome, e-mail e senha são obrigatórios" });
      }
      if (senha.length < 6) {
        return res.status(400).json({ message: "A senha precisa ter ao menos 6 caracteres" });
      }

      const jaExiste = await Usuario.findOne({ where: { email } });
      if (jaExiste) {
        return res.status(409).json({ message: "Já existe uma conta com esse e-mail" });
      }

      const usuario = await Usuario.create({
        nome,
        email,
        senha_hash: await bcrypt.hash(senha, 10),
        tipo: "COMUM",
      });

      return res.status(201).json({ data: gerarSessao(usuario) });
    } catch (error) {
      return res.status(500).json({ message: "Erro ao cadastrar usuário" });
    }
  },

  async login(req, res) {
    try {
      const { email, senha } = req.body;

      if (!email || !senha) {
        return res.status(400).json({ message: "E-mail e senha são obrigatórios" });
      }

      const usuario = await Usuario.findOne({ where: { email } });
      if (!usuario || !usuario.senha_hash) {
        return res.status(401).json({ message: "Credenciais inválidas" });
      }

      const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
      if (!senhaValida) {
        return res.status(401).json({ message: "Credenciais inválidas" });
      }

      return res.status(200).json({ data: gerarSessao(usuario) });
    } catch (error) {
      return res.status(500).json({ message: "Erro no login" });
    }
  },

  // Etapa 1 do fluxo Authorization Code: manda o navegador para o GitHub.
  githubRedirecionar(_, res) {
    if (!GITHUB_CLIENT_ID) {
      return res.status(500).json({ message: "OAuth do GitHub não configurado na API" });
    }

    const parametros = new URLSearchParams({
      client_id: GITHUB_CLIENT_ID,
      redirect_uri: GITHUB_CALLBACK_URL,
      scope: "read:user user:email",
    });

    return res.redirect(`https://github.com/login/oauth/authorize?${parametros}`);
  },

  // Etapa 2: o GitHub devolve um "code", que trocamos por um access_token,
  // usamos esse token para ler o perfil e, no fim, emitimos o NOSSO JWT.
  async githubCallback(req, res) {
    try {
      const { code } = req.query;

      if (!code) {
        return res.status(400).json({ message: "Código de autorização não informado" });
      }
      if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
        return res.status(500).json({ message: "OAuth do GitHub não configurado na API" });
      }

      const respostaToken = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          client_id: GITHUB_CLIENT_ID,
          client_secret: GITHUB_CLIENT_SECRET,
          code,
          redirect_uri: GITHUB_CALLBACK_URL,
        }),
      });

      const dadosToken = await respostaToken.json();
      if (!dadosToken.access_token) {
        return res.status(401).json({ message: "Não foi possível autenticar no GitHub" });
      }

      const cabecalhos = {
        Authorization: `Bearer ${dadosToken.access_token}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "cantina-facil",
      };

      const perfil = await (await fetch("https://api.github.com/user", { headers: cabecalhos })).json();

      // O e-mail do perfil pode ser privado; nesse caso buscamos na rota de e-mails.
      let email = perfil.email;
      if (!email) {
        const emails = await (
          await fetch("https://api.github.com/user/emails", { headers: cabecalhos })
        ).json();
        const principal = Array.isArray(emails) ? emails.find((item) => item.primary) : null;
        email = principal ? principal.email : `${perfil.login}@users.noreply.github.com`;
      }

      // Reaproveita a conta se o GitHub já foi usado antes ou se o e-mail já existe.
      let usuario = await Usuario.findOne({ where: { github_id: String(perfil.id) } });
      if (!usuario) {
        usuario = await Usuario.findOne({ where: { email } });
      }

      if (usuario) {
        usuario.github_id = String(perfil.id);
        await usuario.save();
      } else {
        usuario = await Usuario.create({
          nome: perfil.name || perfil.login,
          email,
          github_id: String(perfil.id),
          tipo: "COMUM",
        });
      }

      const sessao = gerarSessao(usuario);

      // Página simples para a demonstração: mostra o JWT emitido a partir do OAuth.
      return res.status(200).send(`<!doctype html>
<html lang="pt-br"><head><meta charset="utf-8"><title>Cantina Fácil — login GitHub</title></head>
<body style="font-family:sans-serif;max-width:640px;margin:40px auto;line-height:1.5">
  <h1>Login via GitHub concluído</h1>
  <p>Usuário: <strong>${sessao.usuario.nome}</strong> (${sessao.usuario.email})</p>
  <p>Token JWT emitido pela própria API:</p>
  <textarea rows="6" style="width:100%">${sessao.token}</textarea>
</body></html>`);
    } catch (error) {
      return res.status(500).json({ message: "Erro na autenticação via GitHub" });
    }
  },
};
