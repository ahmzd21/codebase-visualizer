const asyncHandler = require("../../middleware/asyncHandler");
const { getGraph } = require("./graph.service");
const { sendSuccess } = require("../../utils/response");

const getRepoGraph = asyncHandler(async (req, res) => {
  const graph = await getGraph(req.repo);
  sendSuccess(res, 200, { graph });
});

module.exports = { getRepoGraph };
