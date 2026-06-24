const mongoose = require('mongoose');

const SchemaCatalogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  filename: {
    type: String,
    required: true,
    default: 'default_retail_schema.sql',
  },
  tables: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
    default: {
      "users": ["id", "name", "email", "created_at", "role"],
      "orders": ["id", "user_id", "total_amount", "status", "created_at"],
      "products": ["id", "name", "price", "category", "stock"],
      "order_items": ["id", "order_id", "product_id", "quantity", "price"]
    }
  },
  embeddings: {
    type: Map,
    of: [Number],
    default: {}
  },
  relationships: {
    type: [mongoose.Schema.Types.Mixed],
    default: [
      { fromTable: "orders", fromColumn: "user_id", toTable: "users", toColumn: "id" },
      { fromTable: "order_items", fromColumn: "order_id", toTable: "orders", toColumn: "id" },
      { fromTable: "order_items", fromColumn: "product_id", toTable: "products", toColumn: "id" }
    ]
  },
  descriptions: {
    type: Map,
    of: String,
    default: {}
  },
  rawSql: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('SchemaCatalog', SchemaCatalogSchema);
