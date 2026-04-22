const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const mongoSanitize = require("express-mongo-sanitize");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./modules/auth/auth.routes");
const repoRoutes = require("./modules/repository/repository.routes");
const jobRoutes = require("./modules/job/job.routes");
const graphRoutes = require("./modules/graph/graph.routes");
const fileRoutes = require("./modules/file/file.routes");
const metricsRoutes = require("./modules/metrics/metrics.routes");

const globalErrorHandler = require("./middleware/error.middleware");
const { protect } = require("./middleware/auth.middleware");
const { checkRepoOwnership } = require("./middleware/ownership.middleware");
const AppError = require("./utils/AppError");

const app = express();

// ─── Global Middleware ────────────────────────────────────────────────────────

// CORS
app.use(cors());

// HTTP request logger (skip in test env)
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// Parse JSON bodies with a size limit
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Sanitize request data to prevent MongoDB operator injection
// e.g. { "email": { "$gt": "" } } -> stripped to {}
app.use(mongoSanitize());

// ─── Rate Limiting ────────────────────────────────────────────────────────────

// Global limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: "RATE_LIMIT_EXCEEDED", message: "Too many requests. Please try again later." } },
});

// Stricter limiter for auth routes (prevents brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: "RATE_LIMIT_EXCEEDED", message: "Too many login attempts. Please try again in 15 minutes." } },
});

app.use(globalLimiter);

// ─── Health Check ─────────────────────────────────────────────────────────────

app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true, message: "Codebase Visualizer API is running.", timestamp: new Date() });
});

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/repos", repoRoutes);
app.use("/api/jobs", jobRoutes);

// Nested routes under /api/repos/:repoId — ownership is verified once here
// and then passed down to all sub-routers via req.repo
app.use(
  "/api/repos/:repoId/graph",
  protect,
  checkRepoOwnership,
  graphRoutes
);
app.use(
  "/api/repos/:repoId/files",
  protect,
  checkRepoOwnership,
  fileRoutes
);
app.use(
  "/api/repos/:repoId/metrics",
  protect,
  checkRepoOwnership,
  metricsRoutes
);

// ─── 404 Handler ─────────────────────────────────────────────────────────────

app.all("*", (req, res, next) => {
  next(new AppError(`Route ${req.method} ${req.originalUrl} not found.`, 404, "NOT_FOUND"));
});

// ─── Global Error Handler ─────────────────────────────────────────────────────

app.use(globalErrorHandler);

module.exports = app;
