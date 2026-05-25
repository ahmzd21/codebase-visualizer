const jwt = require("jsonwebtoken");
const User = require("../../models/User");
const AppError = require("../../utils/AppError");

const signToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const registerUser = async (email, password) => {
  // Check for existing user explicitly for a cleaner error message
  const existing = await User.findOne({ email });
  if (existing) {
    throw new AppError("An account with this email already exists.", 409, "EMAIL_ALREADY_EXISTS");
  }

  const user = await User.create({ email, password });
  const token = signToken(user._id);
  return { token, userId: user._id };
};

const loginUser = async (email, password) => {
  // Must explicitly select password since it's excluded by default
  const user = await User.findOne({ email }).select("+password");

  // Use a single generic error message for both cases to prevent user enumeration
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError("Invalid email or password.", 401, "INVALID_CREDENTIALS");
  }

  const token = signToken(user._id);
  return { token, userId: user._id };
};

module.exports = { registerUser, loginUser };
