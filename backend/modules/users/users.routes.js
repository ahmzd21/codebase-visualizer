const express = require("express");
const router = express.Router();
const { getProfile, updateProfile, changePassword } = require("./users.controller");
const { updateProfileValidation, changePasswordValidation } = require("./users.validation");
const validate = require("../../middleware/validate.middleware");

// GET /api/users/profile
router.get("/profile", getProfile);

// PATCH /api/users/profile
router.patch("/profile", updateProfileValidation, validate, updateProfile);

// PATCH /api/users/profile/password
router.patch("/profile/password", changePasswordValidation, validate, changePassword);

module.exports = router;
