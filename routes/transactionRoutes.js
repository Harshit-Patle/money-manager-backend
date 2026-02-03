const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { createTransfer } = require("../controllers/transferController");
const {
    addTransaction,
    getTransactions,
    updateTransaction,
    deleteTransaction,
    getCategorySummary,
} = require("../controllers/transactionController");

const router = express.Router();

// SUMMARY
router.get("/summary/categories", authMiddleware, getCategorySummary);

// TRANSACTIONS
router.post("/", authMiddleware, addTransaction);
router.get("/", authMiddleware, getTransactions);
router.put("/:id", authMiddleware, updateTransaction);
router.delete("/:id", authMiddleware, deleteTransaction);

// ACCOUNT TRANSFER
// Backward-compatible alias: transfers are stored as a dedicated document.
router.post("/transfer", authMiddleware, createTransfer);

module.exports = router;
