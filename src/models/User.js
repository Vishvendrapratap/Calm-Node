const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {

        phone: {type: String, required: true, unique: true},
        
        name: {type: String, trim: true},

        role: {type: String, enum: ["user", "broker", "admin"], default: "user"},
    },

    {timestamps: true}
);

module.exports = mongoose.model("User", userSchema);