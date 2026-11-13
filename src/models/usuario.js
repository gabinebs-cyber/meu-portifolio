import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Usuario = sequelize.define(
  "Usuario",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nome: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
    },
    // Usuários que entram pelo GitHub não possuem senha local.
    senha_hash: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    // Identificador devolvido pelo GitHub no login OAuth. Sem UNIQUE no banco
    // porque o SQLite não aceita adicionar coluna única em tabela já existente;
    // a checagem de duplicidade é feita no AuthController.
    github_id: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    tipo: {
      type: DataTypes.ENUM("COMUM", "ADMIN"),
      defaultValue: "COMUM",
    },
  },
  { tableName: "usuario", timestamps: false }
);

export default Usuario;
