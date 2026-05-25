const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema(
  {
    repoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Repository",
      required: true,
    },
    path: {
      type: String,
      required: true,
      trim: true,
    },
    language: {
      type: String,
      default: "Unknown",
    },
    imports: {
      type: [String],
      default: [],
    },
    complexity: {
      type: Number,
      default: 0,
    },
    size: {
      type: Number, // in bytes
      default: 0,
    },
    changeFrequency: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

fileSchema.index({ repoId: 1 });

module.exports = mongoose.model("File", fileSchema);
