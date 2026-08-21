const serverless = require("serverless-http");
const app = require("./app");
const connectDB = require("./config/db");

const serverlessHandler = serverless(app, {
    basePath: "/default/moneymanager-backend",
});

module.exports.handler = async (event, context) => {
    // Prevent Lambda from waiting for MongoDB connection event loops to drain
    context.callbackWaitsForEmptyEventLoop = false;

    // Ensure database connection is initialized and reused
    await connectDB();

    return await serverlessHandler(event, context);
};
