const express = require("express");
const router = express.Router();
const { getInsight, createInsight } = require("./ai.controller");
const { protect } = require("../../middleware/auth.middleware");

// GET  /api/ai/insights/:repoId — fetch cached insight
router.get("/insights/:repoId", protect, getInsight);

// POST /api/ai/insights/:repoId — generate new insight
router.post("/insights/:repoId", protect, createInsight);

module.exports = router;
