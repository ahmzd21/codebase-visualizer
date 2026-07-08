const express = require("express");
const router = express.Router();
const { analyze, getAllRepos, getRepo, deleteRepoAnalysis } = require("./repository.controller");
const { analyzeValidation } = require("./repository.validation");
const validate = require("../../middleware/validate.middleware");
const { protect } = require("../../middleware/auth.middleware");
const { checkRepoOwnership } = require("../../middleware/ownership.middleware");

// All repo routes require authentication
router.use(protect);

// POST /api/repos/analyze
router.post("/analyze", analyzeValidation, validate, analyze);

// GET /api/repos
router.get("/", getAllRepos);

// GET /api/repos/:repoId
router.get("/:repoId", checkRepoOwnership, getRepo);

// DELETE /api/repos/:repoId
router.delete("/:repoId", checkRepoOwnership, deleteRepoAnalysis);

module.exports = router;
