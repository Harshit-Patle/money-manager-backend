const Transaction = require("../models/Transaction");
const mongoose = require("mongoose");

/* =========================
   ADD INCOME / EXPENSE
========================= */
exports.addTransaction = async (req, res) => {
    try {
        let { type, amount, category, division, description, account } = req.body;
        amount = Number(amount);

        if (!type || !amount || !category || !division || !account) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        if (isNaN(amount) || amount <= 0) {
            return res.status(400).json({ message: "Invalid amount" });
        }

        const transaction = await Transaction.create({
            userId: req.user.id,
            type,
            amount,
            category,
            division,
            account,
            description,
        });

        res.status(201).json(transaction);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

/* =========================
   GET TRANSACTIONS (FILTERS)
========================= */
exports.getTransactions = async (req, res) => {
    try {
        const { type, category, division, from, to } = req.query;

        const filter = { userId: req.user.id };

        if (type) filter.type = type;
        if (category) filter.category = category;
        if (division) filter.division = division;

        if (from || to) {
            filter.createdAt = {};
            if (from) filter.createdAt.$gte = new Date(from);
            if (to) filter.createdAt.$lte = new Date(to);
        }

        const transactions = await Transaction.find(filter).sort({
            createdAt: -1,
        });

        res.json(transactions);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

/* =========================
   UPDATE (12-HOUR RULE)
========================= */
exports.updateTransaction = async (req, res) => {
    try {
        const transaction = await Transaction.findOne({
            _id: req.params.id,
            userId: req.user.id,
        });

        if (!transaction) {
            return res.status(404).json({ message: "Transaction not found" });
        }

        const createdTime = new Date(transaction.createdAt).getTime();
        const currentTime = Date.now();
        const TWELVE_HOURS = 12 * 60 * 60 * 1000;

        if (currentTime - createdTime > TWELVE_HOURS) {
            return res
                .status(403)
                .json({ message: "Editing allowed only within 12 hours" });
        }

        const updatedTransaction = await Transaction.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        res.json(updatedTransaction);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

/* =========================
   DELETE TRANSACTION
========================= */
exports.deleteTransaction = async (req, res) => {
    try {
        const transaction = await Transaction.findOne({
            _id: req.params.id,
            userId: req.user.id,
        });

        if (!transaction) {
            return res.status(404).json({ message: "Transaction not found" });
        }

        const createdTime = new Date(transaction.createdAt).getTime();
        const currentTime = Date.now();
        const TWELVE_HOURS = 12 * 60 * 60 * 1000;

        if (currentTime - createdTime > TWELVE_HOURS) {
            return res
                .status(403)
                .json({ message: "Deletion allowed only within 12 hours" });
        }

        await Transaction.findByIdAndDelete(req.params.id);

        res.json({ message: "Transaction deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

/* =========================
   CATEGORY SUMMARY
========================= */
exports.getCategorySummary = async (req, res) => {
    try {
        const { from, to } = req.query;

        const matchStage = { userId: req.user.id };

        if (from || to) {
            matchStage.createdAt = {};
            if (from) matchStage.createdAt.$gte = new Date(from);
            if (to) matchStage.createdAt.$lte = new Date(to);
        }

        const summary = await Transaction.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: { category: "$category", type: "$type" },
                    totalAmount: { $sum: "$amount" },
                },
            },
            {
                $group: {
                    _id: "$_id.category",
                    totals: {
                        $push: {
                            type: "$_id.type",
                            amount: "$totalAmount",
                        },
                    },
                },
            },
            {
                $project: {
                    _id: 0,
                    category: "$_id",
                    totalIncome: {
                        $sum: {
                            $map: {
                                input: "$totals",
                                as: "t",
                                in: {
                                    $cond: [
                                        { $eq: ["$$t.type", "income"] },
                                        "$$t.amount",
                                        0,
                                    ],
                                },
                            },
                        },
                    },
                    totalExpense: {
                        $sum: {
                            $map: {
                                input: "$totals",
                                as: "t",
                                in: {
                                    $cond: [
                                        { $eq: ["$$t.type", "expense"] },
                                        "$$t.amount",
                                        0,
                                    ],
                                },
                            },
                        },
                    },
                },
            },
            { $sort: { category: 1 } },
        ]);

        res.json(summary);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

/* =========================
   ACCOUNT TRANSFER (FIXED)
========================= */
exports.transferAmount = async (req, res) => {
    try {
        let { fromAccount, toAccount, amount, description } = req.body;
        amount = Number(amount);

        if (!fromAccount || !toAccount || !amount) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        if (fromAccount === toAccount) {
            return res
                .status(400)
                .json({ message: "From and To accounts must be different" });
        }

        if (isNaN(amount) || amount <= 0) {
            return res.status(400).json({ message: "Invalid amount" });
        }

        const transferId = new mongoose.Types.ObjectId();

        await Transaction.create([
            {
                userId: req.user.id,
                type: "expense",
                amount,
                category: "Transfer",
                division: "Personal",
                account: fromAccount,
                description: description || "Account transfer",
                transferId,
            },
            {
                userId: req.user.id,
                type: "income",
                amount,
                category: "Transfer",
                division: "Personal",
                account: toAccount,
                description: description || "Account transfer",
                transferId,
            },
        ]);

        res.status(201).json({
            message: "Amount transferred successfully",
            transferId,
        });
    } catch (error) {
        console.error("Transfer error:", error);
        res.status(500).json({ message: "Server error" });
    }
};
