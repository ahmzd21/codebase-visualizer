const Graph = require("../../models/Graph");
const AppError = require("../../utils/AppError");

const getGraph = async (repo) => {
  if (repo.status !== "completed") {
    throw new AppError(
      "Repository analysis is not yet complete. Please poll /api/jobs/:jobId for progress.",
      202,
      "ANALYSIS_INCOMPLETE"
    );
  }

  const graph = await Graph.findOne({ repoId: repo._id });
  if (!graph) throw new AppError("Graph data not found for this repository.", 404, "GRAPH_NOT_FOUND");

  return graph;
};

module.exports = { getGraph };
