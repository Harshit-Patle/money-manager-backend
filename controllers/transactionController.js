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

        if (category === "Transfer") {
            return res.status(400).json({
                message: "Use the transfers feature for account transfers",
            });
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
        const { type, category, division, from, to, includeTransfers } = req.query;

        const shouldIncludeTransfers =
            includeTransfers === "1" ||
            includeTransfers === "true" ||
            includeTransfers === true;

        const filter = { userId: req.user.id };

        if (type) filter.type = type;

        // Transfers are stored separately and should not appear in standard transaction views.
        // Allow opt-in for internal calculations (e.g., balance derivation) via includeTransfers.
        if (!shouldIncludeTransfers) {
            if (category) {
                if (category === "Transfer") {
                    return res.json([]);
                }
                filter.category = category;
            } else {
                filter.category = { $ne: "Transfer" };
            }
        } else {
            if (category) filter.category = category;
        }
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

        if (req.body?.category === "Transfer") {
            return res.status(400).json({
                message: "Use the transfers feature for account transfers",
            });
        }

        // If this is a transfer pair, update both sides together to avoid inconsistency
        if (transaction.transferId) {
            const updates = {};

            if (req.body.amount !== undefined) {
                const amount = Number(req.body.amount);
                if (isNaN(amount) || amount <= 0) {
                    return res.status(400).json({ message: "Invalid amount" });
                }
                updates.amount = amount;
            }

            if (req.body.description !== undefined) {
                updates.description = req.body.description;
            }

            // Nothing to update
            if (Object.keys(updates).length === 0) {
                const pair = await Transaction.find({
                    userId: req.user.id,
                    transferId: transaction.transferId,
                }).sort({ createdAt: -1 });

                return res.json(pair);
            }

            await Transaction.updateMany(
                { userId: req.user.id, transferId: transaction.transferId },
                { $set: updates }
            );

            const updatedPair = await Transaction.find({
                userId: req.user.id,
                transferId: transaction.transferId,
            }).sort({ createdAt: -1 });

            return res.json(updatedPair);
        }

        const updates = {};

        if (req.body.amount !== undefined) {
            const amount = Number(req.body.amount);
            if (isNaN(amount) || amount <= 0) {
                return res.status(400).json({ message: "Invalid amount" });
            }
            updates.amount = amount;
        }

        if (req.body.type !== undefined) {
            if (!["income", "expense"].includes(req.body.type)) {
                return res.status(400).json({ message: "Invalid transaction type" });
            }
            updates.type = req.body.type;
        }

        if (req.body.category !== undefined) {
            updates.category = String(req.body.category).trim();
        }

        if (req.body.division !== undefined) {
            if (!["Personal", "Office"].includes(req.body.division)) {
                return res.status(400).json({ message: "Invalid division" });
            }
            updates.division = req.body.division;
        }

        if (req.body.account !== undefined) {
            if (!["Cash", "Bank", "Wallet"].includes(req.body.account)) {
                return res.status(400).json({ message: "Invalid account" });
            }
            updates.account = req.body.account;
        }

        if (req.body.description !== undefined) {
            updates.description = String(req.body.description).trim();
        }

        const updatedTransaction = await Transaction.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            { $set: updates },
            { new: true, runValidators: true }
        );

        res.json(updatedTransaction);
    } catch (error) {
        console.error("Update transaction error:", error);
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

        // If this is a transfer pair, delete both sides together
        if (transaction.transferId) {
            const result = await Transaction.deleteMany({
                userId: req.user.id,
                transferId: transaction.transferId,
            });

            return res.json({
                message: "Transfer deleted successfully",
                deletedCount: result.deletedCount,
            });
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

        const matchStage = { userId: req.user.id, category: { $ne: "Transfer" } };

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
