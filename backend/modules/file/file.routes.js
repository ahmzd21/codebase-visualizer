const express = require("express");
const router = express.Router({ mergeParams: true });
const { getFiles, getFile } = require("./file.controller");

// GET /api/repos/:repoId/files
router.get("/", getFiles);

// GET /api/repos/:repoId/files/:fileId
router.get("/:fileId", getFile);

module.exports = router;
