import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Categoria = sequelize.define(
  "Categoria",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nome: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
  },
  { tableName: "categoria", timestamps: false }
);

export default Categoria;
