const mongoose = require("mongoose");

const WaChatSchema = new mongoose.Schema(
  {
    waId: { type: String, required: true, unique: true, index: true },
    userPhone: { type: String, default: "" },
    userName: { type: String, default: "" },

    status: { type: String, default: "ACTIVE", enum: ["ACTIVE", "INACTIVE", "CLOSED"] },
    minimized: { type: Boolean, default: false },

    lastMessageAt: { type: Date, default: Date.now },
    lastMessageText: { type: String, default: "" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("WaChat", WaChatSchema);
