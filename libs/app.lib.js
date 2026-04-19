import express from "express";
import cors from "cors";
import apiRoutes from "../routes/index.js";
import setupSwagger from "./swagger.lib.js";
import { errorResponse } from "../utils/response.util.js";
import { STATUS_CODES, RESPONSE_MESSAGES } from "../constants/response.js";
import { envConfig } from "../config/env.config.js";

const app = express();

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  envConfig.FRONTEND_SERVICE_LOCAL_URL,
  envConfig.FRONTEND_SERVICE_PROD_URL,
  envConfig.BACKEND_SERVICE_LOCAL_URL,
  envConfig.BACKEND_SERVICE_PROD_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ── Swagger UI ─────────────────────────────────────────────────────────────────
setupSwagger(app);

// ── Root health check ──────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ service: "MeetFlow API", status: "running" });
});

// ── Request logger (dev only) ──────────────────────────────────────────────────
if (envConfig.NODE_ENV !== "production") {
  app.use((req, res, next) => {
    console.log(`[${req.method}] ${req.url}`);
    next();
  });
}

// ── API Routes ─────────────────────────────────────────────────────────────────
app.use("/api/v1", apiRoutes);

// ── 404 handler — catches any route not matched above ──────────────────────────
app.use((req, res) => {
  return errorResponse(
    res,
    STATUS_CODES.NOT_FOUND,
    RESPONSE_MESSAGES.NOT_FOUND,
    `Route ${req.method} ${req.originalUrl} not found`,
    null,
  );
});

// ── Global error handler — last line of defense ────────────────────────────────
// Catches any error thrown inside route handlers that wasn't caught locally
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error("[GlobalErrorHandler]", err);
  return errorResponse(
    res,
    STATUS_CODES.SERVER_ERROR,
    RESPONSE_MESSAGES.SERVER_ERROR,
    "An unexpected error occurred",
    envConfig.NODE_ENV !== "production" ? err : null,
  );
});

export default app;
