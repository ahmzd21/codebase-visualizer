const jwt = require("jsonwebtoken");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const asyncHandler = require("./asyncHandler");

// Verifies JWT and attaches req.user
const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(new AppError("You must be logged in to access this resource.", 401, "AUTH_REQUIRED"));
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return next(new AppError("Your session has expired. Please log in again.", 401, "TOKEN_EXPIRED"));
    }
    return next(new AppError("Invalid token. Please log in again.", 401, "INVALID_TOKEN"));
  }

  const user = await User.findById(decoded.id).select("-password");
  if (!user) {
    return next(new AppError("The user belonging to this token no longer exists.", 401, "AUTH_REQUIRED"));
  }

  req.user = user;
  next();
});

module.exports = { protect };
