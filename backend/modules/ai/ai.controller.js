const asyncHandler = require("../../middleware/asyncHandler");
const { getCachedInsight, generateInsight, chatAboutCodebase, generateChatTitle } = require("./ai.service");
const { sendSuccess } = require("../../utils/response");
const AppError = require("../../utils/AppError");
const Repository = require("../../models/Repository");
const Chat = require("../../models/Chat");

// GET /api/ai/insights/:repoId — return cached insight or 404
const getInsight = asyncHandler(async (req, res) => {
  const insight = await getCachedInsight(req.params.repoId);
  if (!insight) {
    throw new AppError("No AI insight found for this repository.", 404, "NOT_FOUND");
  }
  sendSuccess(res, 200, { insight });
});

// POST /api/ai/insights/:repoId — generate (or regenerate) an insight
const createInsight = asyncHandler(async (req, res) => {
  // Verify repo exists and belongs to the user
  const repo = await Repository.findById(req.params.repoId);
  if (!repo) {
    throw new AppError("Repository not found.", 404, "REPO_NOT_FOUND");
  }
  if (repo.userId.toString() !== req.user._id.toString()) {
    throw new AppError("Forbidden.", 403, "FORBIDDEN");
  }

  const insight = await generateInsight(repo);
  sendSuccess(res, 201, { insight });
});

// POST /api/ai/chat/:repoId — chat with the codebase
const chatWithCodebase = asyncHandler(async (req, res) => {
  const repo = await Repository.findById(req.params.repoId);
  if (!repo || repo.userId.toString() !== req.user._id.toString()) {
    throw new AppError("Repository not found or forbidden.", 404, "NOT_FOUND");
  }

  const { message, chatId } = req.body;
  if (!message) throw new AppError("Message is required.", 400, "BAD_REQUEST");

  let chat;
  let history = [];
  
  if (chatId) {
    chat = await Chat.findOne({ _id: chatId, userId: req.user._id });
    if (!chat) throw new AppError("Chat not found.", 404, "NOT_FOUND");
    history = chat.messages.map(m => ({ role: m.role, text: m.text }));
  }

  // Get AI response
  const responseText = await chatAboutCodebase(repo, message, history);

  if (!chat) {
    const title = await generateChatTitle(message);
    chat = await Chat.create({
      repoId: repo._id,
      userId: req.user._id,
      title,
      messages: [
        { role: "user", text: message },
        { role: "model", text: responseText }
      ]
    });
  } else {
    chat.messages.push({ role: "user", text: message });
    chat.messages.push({ role: "model", text: responseText });
    await chat.save();
  }

  sendSuccess(res, 200, { response: responseText, chatId: chat._id, chatTitle: chat.title });
});

// GET /api/ai/chats/:repoId
const getChats = asyncHandler(async (req, res) => {
  const chats = await Chat.find({ repoId: req.params.repoId, userId: req.user._id })
    .sort({ updatedAt: -1 });
  sendSuccess(res, 200, { chats });
});

// DELETE /api/ai/chats/:chatId
const deleteChat = asyncHandler(async (req, res) => {
  const chat = await Chat.findOneAndDelete({ _id: req.params.chatId, userId: req.user._id });
  if (!chat) throw new AppError("Chat not found.", 404, "NOT_FOUND");
  sendSuccess(res, 200, { message: "Chat deleted." });
});

module.exports = { getInsight, createInsight, chatWithCodebase, getChats, deleteChat };
