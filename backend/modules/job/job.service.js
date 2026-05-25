const Job = require("../../models/Job");
const AppError = require("../../utils/AppError");

const getJobById = async (jobId) => {
  const job = await Job.findById(jobId).populate("repoId", "repoUrl repoName status");
  if (!job) throw new AppError("No job found with that ID.", 404, "JOB_NOT_FOUND");
  return job;
};

module.exports = { getJobById };
