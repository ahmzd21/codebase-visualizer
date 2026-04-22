const { body } = require("express-validator");

const analyzeValidation = [
  body("repoUrl")
    .trim()
    .notEmpty().withMessage("Repository URL is required.")
    .isURL({ protocols: ["https"], require_protocol: true })
    .withMessage("Please provide a valid URL.")
    .custom((value) => {
      if (!value.startsWith("https://github.com/")) {
        throw new Error("Only GitHub repository URLs are supported (https://github.com/...).");
      }
      // Basic check: must have at least /owner/repo after the domain
      const parts = value.replace("https://github.com/", "").split("/").filter(Boolean);
      if (parts.length < 2) {
        throw new Error("URL must point to a specific repository (e.g. https://github.com/owner/repo).");
      }
      return true;
    }),
];

module.exports = { analyzeValidation };
