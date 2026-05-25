const asyncHandler = require("../../middleware/asyncHandler");
const { fetchProfile, updateUserProfile, updateUserPassword } = require("./users.service");
const { sendSuccess } = require("../../utils/response");

const getProfile = asyncHandler(async (req, res) => {
  const { user, stats } = await fetchProfile(req.user._id);
  sendSuccess(res, 200, { user, stats });
});

const updateProfile = asyncHandler(async (req, res) => {
  const { displayName } = req.body;
  const user = await updateUserProfile(req.user._id, { displayName });
  sendSuccess(res, 200, { user });
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  await updateUserPassword(req.user._id, currentPassword, newPassword, confirmPassword);
  sendSuccess(res, 200, { message: "Password updated successfully." });
});

module.exports = { getProfile, updateProfile, changePassword };
