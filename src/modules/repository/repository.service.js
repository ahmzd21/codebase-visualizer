const Repository = require("../../models/Repository");
const Job = require("../../models/Job");
const File = require("../../models/File");
const Graph = require("../../models/Graph");
const AppError = require("../../utils/AppError");

// Extract repo name from URL e.g. https://github.com/owner/repo -> repo
const extractRepoName = (url) => {
  const parts = url.replace("https://github.com/", "").split("/").filter(Boolean);
  return parts[1] || parts[0];
};

// Simulate async repo processing by populating mock data after a delay
// In production this would be replaced by a real job queue (e.g. BullMQ)
const simulateAnalysis = async (repoId) => {
  await Job.findOneAndUpdate({ repoId }, { status: "running", progress: 10 });
  await Repository.findByIdAndUpdate(repoId, { status: "processing" });

  // Simulate progress ticks
  const delays = [
    { progress: 30, ms: 1500 },
    { progress: 60, ms: 1500 },
    { progress: 85, ms: 1500 },
  ];

  for (const tick of delays) {
    await new Promise((r) => setTimeout(r, tick.ms));
    await Job.findOneAndUpdate({ repoId }, { progress: tick.progress });
  }

  // Seed mock file data
  const mockFiles = [
    { repoId, path: "src/app.js",        language: "JavaScript", imports: ["src/utils.js", "src/config.js"], complexity: 12, size: 3450, changeFrequency: 18 },
    { repoId, path: "src/utils.js",      language: "JavaScript", imports: [],                                complexity: 5,  size: 1200, changeFrequency: 6  },
    { repoId, path: "src/config.js",     language: "JavaScript", imports: [],                                complexity: 3,  size: 800,  changeFrequency: 4  },
    { repoId, path: "src/auth/index.js", language: "JavaScript", imports: ["src/utils.js"],                  complexity: 38, size: 8900, changeFrequency: 47 },
    { repoId, path: "src/core/parser.js",language: "JavaScript", imports: ["src/utils.js", "src/config.js"], complexity: 42, size: 11000,changeFrequency: 31 },
    { repoId, path: "styles/main.css",   language: "CSS",        imports: [],                                complexity: 1,  size: 2100, changeFrequency: 2  },
    { repoId, path: "package.json",      language: "JSON",       imports: [],                                complexity: 1,  size: 600,  changeFrequency: 8  },
  ];
  await File.insertMany(mockFiles);

  // Seed mock graph data
  await Graph.create({
    repoId,
    nodes: mockFiles.map((f) => ({ id: f.path, label: f.path.split("/").pop(), language: f.language })),
    edges: [
      { from: "src/app.js",         to: "src/utils.js"   },
      { from: "src/app.js",         to: "src/config.js"  },
      { from: "src/auth/index.js",  to: "src/utils.js"   },
      { from: "src/core/parser.js", to: "src/utils.js"   },
      { from: "src/core/parser.js", to: "src/config.js"  },
    ],
  });

  // Mark as done
  await Job.findOneAndUpdate({ repoId }, { status: "done", progress: 100 });
  await Repository.findByIdAndUpdate(repoId, { status: "completed", completedAt: new Date() });
};

const analyzeRepo = async (userId, repoUrl) => {
  // Check if user already submitted this URL — return cached result
  const existing = await Repository.findOne({ userId, repoUrl });
  if (existing) {
    const job = await Job.findOne({ repoId: existing._id });
    return { repo: existing, job, cached: true };
  }

  const repoName = extractRepoName(repoUrl);
  const repo = await Repository.create({ userId, repoUrl, repoName, status: "pending" });
  const job = await Job.create({ repoId: repo._id, status: "queued", progress: 0 });

  // Kick off simulation in the background (non-blocking)
  simulateAnalysis(repo._id).catch(async (err) => {
    await Job.findOneAndUpdate({ repoId: repo._id }, { status: "failed", error: err.message });
    await Repository.findByIdAndUpdate(repo._id, { status: "failed" });
  });

  return { repo, job, cached: false };
};

const getUserRepos = async (userId) => {
  return await Repository.find({ userId }).sort({ createdAt: -1 });
};

const getRepoById = async (repoId) => {
  const repo = await Repository.findById(repoId);
  if (!repo) throw new AppError("No repository found with that ID.", 404, "REPO_NOT_FOUND");
  return repo;
};

module.exports = { analyzeRepo, getUserRepos, getRepoById };
