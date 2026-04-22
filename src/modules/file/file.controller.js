const asyncHandler = require("../../middleware/asyncHandler");
const { getAllFiles, getFileById } = require("./file.service");
const { sendSuccess } = require("../../utils/response");

const getFiles = asyncHandler(async (req, res) => {
  const files = await getAllFiles(req.repo);
  sendSuccess(res, 200, { count: files.length, files });
});

const getFile = asyncHandler(async (req, res) => {
  const file = await getFileById(req.repo, req.params.fileId);
  sendSuccess(res, 200, { file });
});

module.exports = { getFiles, getFile };
