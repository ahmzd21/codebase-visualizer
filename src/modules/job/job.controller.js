const asyncHandler = require("../../middleware/asyncHandler");
const { getJobById } = require("./job.service");
const { sendSuccess } = require("../../utils/response");

const getJob = asyncHandler(async (req, res) => {
  const job = await getJobById(req.params.jobId);
  sendSuccess(res, 200, { job });
});

module.exports = { getJob };
