const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        transferId: { type: mongoose.Schema.Types.ObjectId, index: true },
        type: { type: String, enum: ["income", "expense"], required: true },
        amount: { type: Number, required: true, min: 0 },
        category: { type: String, required: true, trim: true },
        division: { type: String, enum: ["Personal", "Office"], required: true },
        account: { type: String, enum: ["Cash", "Bank", "Wallet"], required: true },
        description: { type: String, trim: true, default: "" },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Transaction", transactionSchema);
