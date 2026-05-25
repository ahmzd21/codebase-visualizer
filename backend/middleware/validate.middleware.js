const { validationResult } = require("express-validator");
const { sendError } = require("../utils/response");

// Reads validation results set by express-validator chains
// and returns a 400 if any field failed validation
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 400, "INVALID_INPUT", errors.array()[0].msg);
  }
  next();
};

module.exports = validate;
