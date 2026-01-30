const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        type: { type: String, enum: ["income", "expense"] },
        amount: Number,
        category: String,
        division: { type: String, enum: ["Personal", "Office"] },
        description: String,
    },
    { timestamps: true }
);

module.exports = mongoose.model("Transaction", transactionSchema);
