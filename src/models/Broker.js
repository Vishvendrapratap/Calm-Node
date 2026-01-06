const mongoose = require("mongoose");

const brokerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },

    officeType: { type: String, default: null },
    services: { type: [String], default: [] },
  },
  { timestamps: true } // gives createdAt & updatedAt
);

module.exports = mongoose.model("Broker", brokerSchema);