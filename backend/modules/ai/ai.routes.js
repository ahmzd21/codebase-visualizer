const express = require("express");
const router = express.Router();
const { getInsight, createInsight, chatWithCodebase, getChats, deleteChat } = require("./ai.controller");
const { protect } = require("../../middleware/auth.middleware");

// GET  /api/ai/insights/:repoId — fetch cached insight
router.get("/insights/:repoId", protect, getInsight);

// POST /api/ai/insights/:repoId — generate new insight
router.post("/insights/:repoId", protect, createInsight);

// GET /api/ai/chats/:repoId — get all chats for a repo
router.get("/chats/:repoId", protect, getChats);

// POST /api/ai/chat/:repoId — chat with codebase
router.post("/chat/:repoId", protect, chatWithCodebase);

// DELETE /api/ai/chats/:chatId — delete a chat
router.delete("/chats/:chatId", protect, deleteChat);

module.exports = router;
