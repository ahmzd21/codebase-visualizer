const asyncHandler = require("../../middleware/asyncHandler");
const { getCachedInsight, generateInsight } = require("./ai.service");
const { sendSuccess } = require("../../utils/response");
const AppError = require("../../utils/AppError");
const Repository = require("../../models/Repository");

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

module.exports = { getInsight, createInsight };
