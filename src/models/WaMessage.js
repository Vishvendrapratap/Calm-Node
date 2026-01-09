const mongoose = require("mongoose");

const WaMessageSchema = new mongoose.Schema(
  {
    chatId: { type: mongoose.Schema.Types.ObjectId, ref: "WaChat", required: true, index: true },
    waId: { type: String, required: true, index: true },

    waMessageId: {
      type: String,
      index: true,
      unique: true,
      sparse: true
    },

    direction: { type: String, required: true, enum: ["IN", "OUT"] },
    type: { type: String, default: "text", enum: ["text", "image", "document", "audio", "video", "unknown"] },

    text: { type: String, default: "" },

    media: {
      id: { type: String, default: "" },
      mimeType: { type: String, default: "" },
      filename: { type: String, default: "" },
      sha256: { type: String, default: "" },
      caption: { type: String, default: "" },
      url: { type: String, default: "" }
    },
        status: {
      type: String,
      default: "",
      enum: ["", "SENT", "DELIVERED", "READ", "FAILED", "UNKNOWN"]
    },
    statusAt: { type: Date, default: null },

    statusRaw: { type: Object, default: {} },

    raw: { type: Object, default: {} }
  },
  { timestamps: true }
);

module.exports = mongoose.model("WaMessage", WaMessageSchema);
