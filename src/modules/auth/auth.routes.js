const express = require("express");
const router = express.Router();
const { register, login } = require("./auth.controller");
const { registerValidation, loginValidation } = require("./auth.validation");
const validate = require("../../middleware/validate.middleware");

// POST /api/auth/register
router.post("/register", registerValidation, validate, register);

// POST /api/auth/login
router.post("/login", loginValidation, validate, login);

module.exports = router;
