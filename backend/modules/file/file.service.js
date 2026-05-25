const File = require("../../models/File");
const AppError = require("../../utils/AppError");

const requireCompleted = (repo) => {
  if (repo.status !== "completed") {
    throw new AppError(
      "Repository analysis is not yet complete. Please poll /api/jobs/:jobId for progress.",
      202,
      "ANALYSIS_INCOMPLETE",
    );
  }
};

const getAllFiles = async (repo) => {
  requireCompleted(repo);
  return await File.find({ repoId: repo._id }).select("-__v");
};

const getFileById = async (repo, fileId) => {
  requireCompleted(repo);
  const file = await File.findOne({ _id: fileId, repoId: repo._id });
  if (!file)
    throw new AppError(
      "No file found with that ID in this repository.",
      404,
      "FILE_NOT_FOUND",
    );
  return file;
};

module.exports = { getAllFiles, getFileById };
