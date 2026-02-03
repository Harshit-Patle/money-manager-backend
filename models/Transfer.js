const mongoose = require("mongoose");

const transferSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        fromAccount: { type: String, enum: ["Cash", "Bank", "Wallet"], required: true },
        toAccount: { type: String, enum: ["Cash", "Bank", "Wallet"], required: true },
        amount: { type: Number, required: true, min: 0 },
        division: { type: String, enum: ["Personal", "Office"], default: "Personal" },
        description: { type: String },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Transfer", transferSchema);
