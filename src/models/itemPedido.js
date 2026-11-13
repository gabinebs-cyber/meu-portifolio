import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import Pedido from "./pedido.js";
import Produto from "./produto.js";

const ItemPedido = sequelize.define(
  "ItemPedido",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    quantidade: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    preco_unitario: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
  },
  { tableName: "item_pedido", timestamps: false }
);

ItemPedido.belongsTo(Pedido, { foreignKey: "pedido_id" });
Pedido.hasMany(ItemPedido, { foreignKey: "pedido_id", as: "itens" });

ItemPedido.belongsTo(Produto, { foreignKey: "produto_id", as: "produto" });
Produto.hasMany(ItemPedido, { foreignKey: "produto_id" });

export default ItemPedido;
