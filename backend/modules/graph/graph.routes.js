const express = require("express");
// mergeParams allows access to :repoId from the parent router
const router = express.Router({ mergeParams: true });
const { getRepoGraph } = require("./graph.controller");

// GET /api/repos/:repoId/graph
router.get("/", getRepoGraph);

module.exports = router;
