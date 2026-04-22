const express = require("express");
const router = express.Router();
const { getJob } = require("./job.controller");
const { protect } = require("../../middleware/auth.middleware");

router.use(protect);

// GET /api/jobs/:jobId
router.get("/:jobId", getJob);

module.exports = router;
