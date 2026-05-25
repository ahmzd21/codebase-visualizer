const File = require("../../models/File");
const AppError = require("../../utils/AppError");

const requireCompleted = (repo) => {
  if (repo.status !== "completed") {
    throw new AppError(
      "Repository analysis is not yet complete. Please poll /api/jobs/:jobId for progress.",
      202,
      "ANALYSIS_INCOMPLETE"
    );
  }
};

const getMetrics = async (repo) => {
  requireCompleted(repo);

  const files = await File.find({ repoId: repo._id });
  if (!files.length) throw new AppError("No file data found for this repository.", 404, "NOT_FOUND");

  const totalFiles = files.length;
  const totalSize = files.reduce((sum, f) => sum + f.size, 0);
  const avgComplexity = parseFloat(
    (files.reduce((sum, f) => sum + f.complexity, 0) / totalFiles).toFixed(2)
  );

  // File with the highest complexity score
  const maxComplexityFile = files.reduce((max, f) => (f.complexity > max.complexity ? f : max), files[0]);

  // Breakdown of files by programming language
  const languageBreakdown = files.reduce((acc, f) => {
    acc[f.language] = (acc[f.language] || 0) + 1;
    return acc;
  }, {});

  return { totalFiles, totalSize, avgComplexity, maxComplexityFile: maxComplexityFile.path, maxComplexityScore: maxComplexityFile.complexity, languageBreakdown };
};

const getHotspots = async (repo) => {
  requireCompleted(repo);

  const files = await File.find({ repoId: repo._id });

  // Hotspot risk score = weighted average of normalized complexity and changeFrequency
  const maxComplexity = Math.max(...files.map((f) => f.complexity));
  const maxFrequency = Math.max(...files.map((f) => f.changeFrequency));

  const hotspots = files
    .map((f) => {
      const normalizedComplexity = maxComplexity > 0 ? f.complexity / maxComplexity : 0;
      const normalizedFrequency = maxFrequency > 0 ? f.changeFrequency / maxFrequency : 0;
      const riskScore = Math.round((normalizedComplexity * 0.6 + normalizedFrequency * 0.4) * 100);
      return { fileId: f._id, path: f.path, complexity: f.complexity, changeFrequency: f.changeFrequency, riskScore };
    })
    .filter((f) => f.riskScore >= 40) // Only files with meaningful risk
    .sort((a, b) => b.riskScore - a.riskScore);

  return hotspots;
};

module.exports = { getMetrics, getHotspots };
