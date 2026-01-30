const Transaction = require("../models/Transaction");

// ADD income / expense
exports.addTransaction = async (req, res) => {
    try {
        const { type, amount, category, division, description } = req.body;

        if (!type || !amount || !category || !division) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const transaction = await Transaction.create({
            userId: req.user.id,
            type,
            amount,
            category,
            division,
            description,
        });

        res.status(201).json(transaction);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};


exports.getTransactions = async (req, res) => {
    try {
        const { type, category, division, from, to } = req.query;

        // Base filter: user-specific (SECURITY)
        const filter = { userId: req.user.id };

        // Optional filters
        if (type) filter.type = type;
        if (category) filter.category = category;
        if (division) filter.division = division;

        // Date range filter
        if (from || to) {
            filter.createdAt = {};
            if (from) filter.createdAt.$gte = new Date(from);
            if (to) filter.createdAt.$lte = new Date(to);
        }

        const transactions = await Transaction.find(filter)
            .sort({ createdAt: -1 });

        res.json(transactions);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

// UPDATE transaction with 12-hour restriction
exports.updateTransaction = async (req, res) => {
    try {
        const transaction = await Transaction.findOne({
            _id: req.params.id,
            userId: req.user.id,
        });

        if (!transaction) {
            return res.status(404).json({ message: "Transaction not found" });
        }

        // ⏱️ 12-hour edit restriction logic
        const createdTime = new Date(transaction.createdAt).getTime();
        const currentTime = new Date().getTime();

        const TWELVE_HOURS = 12 * 60 * 60 * 1000; // milliseconds

        if (currentTime - createdTime > TWELVE_HOURS) {
            return res.status(403).json({
                message: "Editing is allowed only within 12 hours",
            });
        }

        // Update allowed
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

// DELETE transaction
exports.deleteTransaction = async (req, res) => {
    try {
        const transaction = await Transaction.findOneAndDelete({
            _id: req.params.id,
            userId: req.user.id, // SECURITY
        });

        if (!transaction) {
            return res.status(404).json({ message: "Transaction not found" });
        }

        res.json({ message: "Transaction deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

exports.getCategorySummary = async (req, res) => {
    try {
        const { from, to } = req.query;

        const matchStage = {
            userId: req.user.id,
        };

        // Date range filter (if provided)
        if (from || to) {
            matchStage.createdAt = {};
            if (from) matchStage.createdAt.$gte = new Date(from);
            if (to) matchStage.createdAt.$lte = new Date(to);
        }

        const summary = await Transaction.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: {
                        category: "$category",
                        type: "$type",
                    },
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

// ACCOUNT TRANSFER
exports.transferAmount = async (req, res) => {
    try {
        const { fromAccount, toAccount, amount, description } = req.body;

        if (!fromAccount || !toAccount || !amount) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        if (fromAccount === toAccount) {
            return res
                .status(400)
                .json({ message: "From and To accounts must be different" });
        }

        const transferId = new mongoose.Types.ObjectId();

        const expenseTransaction = {
            userId: req.user.id,
            type: "expense",
            amount,
            category: "Transfer",
            division: "Personal",
            description: description || "Account transfer",
            account: fromAccount,
            transferId,
        };

        const incomeTransaction = {
            userId: req.user.id,
            type: "income",
            amount,
            category: "Transfer",
            division: "Personal",
            description: description || "Account transfer",
            account: toAccount,
            transferId,
        };

        await Transaction.create([expenseTransaction, incomeTransaction]);

        res.status(201).json({
            message: "Amount transferred successfully",
            transferId,
        });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};
