require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const app = require("./backend/app");
const connectDB = require("./backend/config/db");
const { setIO } = require("./backend/socket/socketManager");

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  // Start the BullMQ analysis worker — requires Redis to be running
  try {
    require("./backend/queue");
    console.log("[Queue] BullMQ worker started successfully.");
  } catch (err) {
    console.error("[Queue] Failed to start worker — is Redis running?", err.message);
    console.warn("[Queue] Continuing without queue. Repository analysis will be unavailable.");
  }

  // ─── HTTP + Socket.IO Server ────────────────────────────────────────────────
  const httpServer = http.createServer(app);

  const io = new Server(httpServer, {
    cors: {
      origin: ["http://localhost:3000", "http://localhost:5173"],
      methods: ["GET", "POST"],
    },
  });

  // Register the io instance so the worker can emit events
  setIO(io);

  io.on("connection", (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Client requests to track a specific job
    socket.on("join-job", ({ jobId }) => {
      if (!jobId) return;
      socket.join(`job:${jobId}`);
      console.log(`[Socket] ${socket.id} joined room job:${jobId}`);
    });

    // Client stops tracking (job done or component unmounted)
    socket.on("leave-job", ({ jobId }) => {
      if (!jobId) return;
      socket.leave(`job:${jobId}`);
      console.log(`[Socket] ${socket.id} left room job:${jobId}`);
    });

    socket.on("disconnect", (reason) => {
      console.log(`[Socket] Client disconnected: ${socket.id} (${reason})`);
    });
  });

  httpServer.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    console.log(`[Socket] Socket.IO listening on port ${PORT}`);
  });
});

