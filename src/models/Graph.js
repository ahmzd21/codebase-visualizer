const mongoose = require("mongoose");

const graphSchema = new mongoose.Schema(
  {
    repoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Repository",
      required: true,
      unique: true,
    },
    nodes: [
      {
        id: { type: String, required: true },
        label: { type: String },
        language: { type: String },
      },
    ],
    edges: [
      {
        from: { type: String, required: true },
        to: { type: String, required: true },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Graph", graphSchema);
