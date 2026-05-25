const Repository = require("../models/Repository");
const AppError = require("../utils/AppError");
const asyncHandler = require("./asyncHandler");

// Ensures the authenticated user owns the requested repository
// Also attaches repo to req.repo to avoid duplicate DB calls in controllers
const checkRepoOwnership = asyncHandler(async (req, res, next) => {
  const repo = await Repository.findById(req.params.repoId);

  if (!repo) {
    return next(new AppError("No repository found with that ID.", 404, "REPO_NOT_FOUND"));
  }

  if (repo.userId.toString() !== req.user._id.toString()) {
    return next(new AppError("You do not have permission to access this repository.", 403, "FORBIDDEN"));
  }

  req.repo = repo;
  next();
});

module.exports = { checkRepoOwnership };
