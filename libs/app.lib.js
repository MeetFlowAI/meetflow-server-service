import express from "express";
import cors from "cors";
import apiRoutes from "../routes/index.js";
import setupSwagger from "./swagger.lib.js";

const app = express();

app.use(cors());
app.use(express.json());

// ── Swagger UI (mounted outside /api/v1 so it doesn't need the prefix) ────────
setupSwagger(app);

app.get("/", async (req, res) => {
  res.send("Welcome to MeetFlow API");
});

app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  next();
});

app.use("/api/v1", apiRoutes);

export default app;
