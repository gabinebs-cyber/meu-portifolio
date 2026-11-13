import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import Categoria from "./categoria.js";

const Produto = sequelize.define(
  "Produto",
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
    descricao: DataTypes.TEXT,
    preco: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    imagem: DataTypes.STRING(255),
    disponivel: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  { tableName: "produto", timestamps: false }
);

Produto.belongsTo(Categoria, { foreignKey: "categoria_id", as: "categoria" });
Categoria.hasMany(Produto, { foreignKey: "categoria_id" });

export default Produto;
