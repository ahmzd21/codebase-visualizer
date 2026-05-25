const { body } = require("express-validator");

const updateProfileValidation = [
  body("displayName")
    .optional()
    .trim()
    .notEmpty().withMessage("Display name cannot be empty.")
    .isLength({ max: 50 }).withMessage("Display name cannot exceed 50 characters."),
];

const changePasswordValidation = [
  body("currentPassword")
    .notEmpty().withMessage("Current password is required."),
  body("newPassword")
    .notEmpty().withMessage("New password is required.")
    .isLength({ min: 6 }).withMessage("New password must be at least 6 characters long."),
  body("confirmPassword")
    .notEmpty().withMessage("Confirm password is required."),
];

module.exports = { updateProfileValidation, changePasswordValidation };
