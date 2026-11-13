import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import Usuario from "./usuario.js";

const Pedido = sequelize.define(
  "Pedido",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    data: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    valor_total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("RECEBIDO", "EM_PREPARO", "PRONTO", "RETIRADO"),
      defaultValue: "RECEBIDO",
    },
  },
  { tableName: "pedido", timestamps: false }
);

Pedido.belongsTo(Usuario, { foreignKey: "usuario_id", as: "usuario" });
Usuario.hasMany(Pedido, { foreignKey: "usuario_id" });

export default Pedido;
