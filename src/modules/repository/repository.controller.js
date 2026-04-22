const asyncHandler = require("../../middleware/asyncHandler");
const { analyzeRepo, getUserRepos, getRepoById } = require("./repository.service");
const { sendSuccess } = require("../../utils/response");

const analyze = asyncHandler(async (req, res) => {
  const { repoUrl } = req.body;
  const { repo, job, cached } = await analyzeRepo(req.user._id, repoUrl);

  sendSuccess(res, 202, {
    cached,
    repoId: repo._id,
    jobId: job._id,
    status: job.status,
    message: cached
      ? "This repository was already analyzed. Returning cached result."
      : "Analysis job has been queued.",
  });
});

const getAllRepos = asyncHandler(async (req, res) => {
  const repos = await getUserRepos(req.user._id);
  sendSuccess(res, 200, { count: repos.length, repos });
});

const getRepo = asyncHandler(async (req, res) => {
  // req.repo is already attached by ownership middleware
  sendSuccess(res, 200, { repo: req.repo });
});

module.exports = { analyze, getAllRepos, getRepo };
