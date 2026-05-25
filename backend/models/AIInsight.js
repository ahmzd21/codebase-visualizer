const mongoose = require("mongoose");

const aiInsightSchema = new mongoose.Schema(
  {
    repoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Repository",
      required: true,
      unique: true,
    },
    summary: {
      type: String,
      default: "",
    },
    architecturePatterns: {
      type: [String],
      default: [],
    },
    risks: {
      type: [String],
      default: [],
    },
    refactoringSuggestions: {
      type: [String],
      default: [],
    },
    overallScore: {
      type: Number,
      default: null,
    },
  },
  { timestamps: true }
);

aiInsightSchema.index({ repoId: 1 });

module.exports = mongoose.model("AIInsight", aiInsightSchema);
