const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {

        phone: {type: String, required: true, unique: true},
        
        name: {type: String, trim: true},

        role: {type: String, enum: ["USER", "BROKER", "ADMIN"], default: "USER"},
    },

    {timestamps: true}
);

module.exports = mongoose.model("User", userSchema);