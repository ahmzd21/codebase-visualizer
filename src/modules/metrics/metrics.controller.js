const asyncHandler = require("../../middleware/asyncHandler");
const { getMetrics, getHotspots } = require("./metrics.service");
const { sendSuccess } = require("../../utils/response");

const getRepoMetrics = asyncHandler(async (req, res) => {
  const metrics = await getMetrics(req.repo);
  sendSuccess(res, 200, { metrics });
});

const getRepoHotspots = asyncHandler(async (req, res) => {
  const hotspots = await getHotspots(req.repo);
  sendSuccess(res, 200, { count: hotspots.length, hotspots });
});

module.exports = { getRepoMetrics, getRepoHotspots };
