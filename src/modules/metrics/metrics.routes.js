const express = require("express");
const router = express.Router({ mergeParams: true });
const { getRepoMetrics, getRepoHotspots } = require("./metrics.controller");

// GET /api/repos/:repoId/metrics
router.get("/", getRepoMetrics);

// GET /api/repos/:repoId/hotspots
router.get("/hotspots", getRepoHotspots);

module.exports = router;
