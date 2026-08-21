const serverless = require("serverless-http");
const app = require("./app");
const connectDB = require("./config/db");

const serverlessHandler = serverless(app);

module.exports.handler = async (event, context) => {
    // Prevent Lambda from waiting for MongoDB connection event loops to drain
    context.callbackWaitsForEmptyEventLoop = false;

    // Ensure database connection is initialized and reused
    await connectDB();

    // Strip stage prefix if present (e.g. /default/api/... -> /api/...)
    if (event.rawPath && event.rawPath.startsWith("/default")) {
        event.rawPath = event.rawPath.replace(/^\/default/, "") || "/";
    }
    if (event.path && event.path.startsWith("/default")) {
        event.path = event.path.replace(/^\/default/, "") || "/";
    }
    if (event.requestContext?.http?.path && event.requestContext.http.path.startsWith("/default")) {
        event.requestContext.http.path = event.requestContext.http.path.replace(/^\/default/, "") || "/";
    }

    return await serverlessHandler(event, context);
};
