const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
    addTransaction,
    getTransactions,
    updateTransaction,
    deleteTransaction,
    getCategorySummary,
    transferAmount,
} = require("../controllers/transactionController");

const router = express.Router();

// Protected routes
router.get("/summary/categories", authMiddleware, getCategorySummary);
router.post("/", authMiddleware, addTransaction);
router.get("/", authMiddleware, getTransactions);
router.put("/:id", authMiddleware, updateTransaction);
router.delete("/:id", authMiddleware, deleteTransaction);
router.post("/transfer", authMiddleware, transferAmount);

module.exports = router;
