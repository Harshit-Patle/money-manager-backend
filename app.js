const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// STRIP STAGE AND FUNCTION PREFIX IF PRESENT (FOR AWS API GATEWAY)
app.use((req, res, next) => {
    req.url = req.url
        .replace(/^\/default\/moneymanager-backend/, "")
        .replace(/^\/moneymanager-backend/, "")
        .replace(/^\/default/, "") || "/";
    next();
});

// ROOT HEALTH ROUTE
app.get("/", (req, res) => {
    res.json({ message: "Money Manager API is running" });
});

// API ROUTES
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/transactions", require("./routes/transactionRoutes"));
app.use("/api/transfers", require("./routes/transferRoutes"));

// 404 CATCH-ALL HANDLER
app.use((req, res) => {
    res.status(404).json({ message: "Route not found" });
});

// CENTRALIZED ERROR HANDLER
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    res.status(err.status || 500).json({
        message: err.message || "Internal server error",
    });
});

module.exports = app;
