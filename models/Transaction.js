const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        transferId: { type: mongoose.Schema.Types.ObjectId, index: true },
        type: { type: String, enum: ["income", "expense"] },
        amount: Number,
        category: String,
        division: { type: String, enum: ["Personal", "Office"] },
        account: { type: String, enum: ["Cash", "Bank", "Wallet"] },
        description: String,
    },
    { timestamps: true }
);

module.exports = mongoose.model("Transaction", transactionSchema);
