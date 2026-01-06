const mongoose = require("mongoose");

const inquirySchema = new mongoose.Schema(
  {
    inquiryId: { type: String, required: true, unique: true, index: true },

    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true, index: true },
    email: { type: String, required: true, trim: true, lowercase: true },

    documentType: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },


    eta:{type: String, default: "24 hrs", trim:true },
    fees: {type: Number, default: 0, min: 0},

    status: { type: String, default: "START", trim: true },
    nextActivity: { type: String, default: "START", trim: true },

    notes: { type: String, default: "", trim: true },

    metadata: {
      source: { type: String, default: "website" },
      remarks: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Inquiry", inquirySchema);
