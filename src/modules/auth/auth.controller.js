const asyncHandler = require("../../middleware/asyncHandler");
const { registerUser, loginUser } = require("./auth.service");
const { sendSuccess } = require("../../utils/response");

const register = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { token, userId } = await registerUser(email, password);
  sendSuccess(res, 201, { token, userId });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { token, userId } = await loginUser(email, password);
  sendSuccess(res, 200, { token, userId });
});

module.exports = { register, login };
