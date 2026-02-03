const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
    createTransfer,
    getTransfers,
    updateTransfer,
    deleteTransfer,
} = require("../controllers/transferController");

const router = express.Router();

router.post("/", authMiddleware, createTransfer);
router.get("/", authMiddleware, getTransfers);
router.put("/:id", authMiddleware, updateTransfer);
router.delete("/:id", authMiddleware, deleteTransfer);

module.exports = router;
