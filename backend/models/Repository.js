const mongoose = require("mongoose");

const repositorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    repoUrl: {
      type: String,
      required: [true, "Repository URL is required"],
      trim: true,
    },
    repoName: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Index to efficiently query repos by user
repositorySchema.index({ userId: 1 });
// Prevent a user from analyzing the same repo URL twice
repositorySchema.index({ userId: 1, repoUrl: 1 }, { unique: true });

module.exports = mongoose.model("Repository", repositorySchema);
