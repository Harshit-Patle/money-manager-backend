const Transfer = require("../models/Transfer");

const TWELVE_HOURS = 12 * 60 * 60 * 1000;

exports.createTransfer = async (req, res) => {
    try {
        let { fromAccount, toAccount, amount, description, division } = req.body;
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

        const transfer = await Transfer.create({
            userId: req.user.id,
            fromAccount,
            toAccount,
            amount,
            division: division || "Personal",
            description: description || "Account transfer",
        });

        res.status(201).json(transfer);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

exports.getTransfers = async (req, res) => {
    try {
        const { from, to } = req.query;

        const filter = { userId: req.user.id };

        if (from || to) {
            filter.createdAt = {};
            if (from) filter.createdAt.$gte = new Date(from);
            if (to) filter.createdAt.$lte = new Date(to);
        }

        const transfers = await Transfer.find(filter).sort({ createdAt: -1 });
        res.json(transfers);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

exports.updateTransfer = async (req, res) => {
    try {
        const transfer = await Transfer.findOne({
            _id: req.params.id,
            userId: req.user.id,
        });

        if (!transfer) {
            return res.status(404).json({ message: "Transfer not found" });
        }

        const createdTime = new Date(transfer.createdAt).getTime();
        const currentTime = Date.now();

        if (currentTime - createdTime > TWELVE_HOURS) {
            return res
                .status(403)
                .json({ message: "Editing allowed only within 12 hours" });
        }

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

        if (req.body.fromAccount !== undefined) updates.fromAccount = req.body.fromAccount;
        if (req.body.toAccount !== undefined) updates.toAccount = req.body.toAccount;
        if (req.body.division !== undefined) updates.division = req.body.division;

        if (updates.fromAccount && updates.toAccount && updates.fromAccount === updates.toAccount) {
            return res
                .status(400)
                .json({ message: "From and To accounts must be different" });
        }

        const updatedTransfer = await Transfer.findByIdAndUpdate(
            req.params.id,
            { $set: updates },
            { new: true }
        );

        res.json(updatedTransfer);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

exports.deleteTransfer = async (req, res) => {
    try {
        const transfer = await Transfer.findOne({
            _id: req.params.id,
            userId: req.user.id,
        });

        if (!transfer) {
            return res.status(404).json({ message: "Transfer not found" });
        }

        const createdTime = new Date(transfer.createdAt).getTime();
        const currentTime = Date.now();

        if (currentTime - createdTime > TWELVE_HOURS) {
            return res
                .status(403)
                .json({ message: "Deletion allowed only within 12 hours" });
        }

        await Transfer.findByIdAndDelete(req.params.id);
        res.json({ message: "Transfer deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};
