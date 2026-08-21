const mongoose = require("mongoose");
const dns = require("dns");

try {
    dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {
    // Ignore if system restricts dns.setServers
}

let connPromise = null;

const connectDB = async () => {
    if (mongoose.connection.readyState >= 1) {
        return mongoose.connection;
    }

    if (!connPromise) {
        connPromise = mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000,
        }).then((m) => {
            console.log("MongoDB connected");
            return m;
        }).catch((err) => {
            connPromise = null;
            console.error("MongoDB connection error:", err.message);
            throw err;
        });
    }

    return await connPromise;
};

module.exports = connectDB;
