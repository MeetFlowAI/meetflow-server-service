import dotenv from "dotenv";
dotenv.config();

import app from "./libs/app.lib.js";
import { initializeDatabase } from "./models/index.js";
import { envConfig } from "./config/env.config.js";

/**
 * Start server
 */
const startServer = async () => {
  const PORT = envConfig.BACKEND_SERVICE_PORT || 8000;
  try {
    console.log("🚀 MeetFlow Backend Server Starting...");
    console.log(`📚 Environment: ${envConfig.NODE_ENV}`);

    // Initialize database
    console.log("🔌 Initializing database...");
    await initializeDatabase();

    // Start listening
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🌐 API: http://localhost:${PORT}/api/v1`);
      console.log(`💚 Health: http://localhost:${PORT}/api/v1/health`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT signal received: closing HTTP server");
  process.exit(0);
});

// Start the server
startServer();
