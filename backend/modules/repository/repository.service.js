const Repository = require("../../models/Repository");
const Job = require("../../models/Job");
const File = require("../../models/File");
const Graph = require("../../models/Graph");
const AppError = require("../../utils/AppError");

// Lazy-loaded to avoid circular dependency at module init time
const getAnalysisQueue = () => require("../../queue/analysisQueue").analysisQueue;
// Lazy-loaded for the same reason — io is set after server boots
const getIO = () => require("../../socket/socketManager").getIO();

const { parseImports, calculateComplexity } = require("../parser");

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Extract owner and repo name from a GitHub URL
// e.g. https://github.com/expressjs/express -> { owner: "expressjs", repo: "express" }
const parseGitHubUrl = (url) => {
  const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) throw new AppError("Invalid GitHub repository URL.", 422, "INVALID_INPUT");
  return { owner: match[1], repo: match[2].replace(/\.git$/, "") };
};

// Build headers for GitHub API requests
const githubHeaders = () => {
  const headers = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (process.env.GITHUB_TOKEN) {
    headers["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
};

const mime = require('mime-types');
const langMap = require('lang-map');

// Detect programming language from file extension or name
const detectLanguage = (filePath) => {
  const fileName = filePath.split("/").pop();
  if (fileName === "CMakeLists.txt") return "CMake";
  if (fileName === "Dockerfile") return "Dockerfile";
  if (fileName === "Makefile") return "Makefile";
  if (fileName.toLowerCase() === "license") return "Text";

  const ext = fileName.split(".").pop().toLowerCase();
  const map = {
    js: "JavaScript",
    jsx: "JavaScript",
    mjs: "JavaScript",
    cjs: "JavaScript",
    ts: "TypeScript",
    tsx: "TypeScript",
    py: "Python",
    css: "CSS",
    scss: "CSS",
    sass: "CSS",
    less: "CSS",
    json: "JSON",
    md: "Markdown",
    html: "HTML",
    htm: "HTML",
    java: "Java",
    go: "Go",
    rb: "Ruby",
    php: "PHP",
    rs: "Rust",
    cpp: "C++",
    cc: "C++",
    c: "C",
    h: "C",
    cs: "C#",
    swift: "Swift",
    kt: "Kotlin",
    sh: "Shell",
    bash: "Shell",
    yml: "YAML",
    yaml: "YAML",
    toml: "TOML",
    xml: "XML",
    sql: "SQL",
    qml: "QML",
    qsb: "QSB",
    frag: "GLSL",
    vert: "GLSL",
    envrc: "Shell",
    txt: "Text",
    nix: "Nix",
    svelte: "Svelte",
    vue: "Vue"
  };
  
  if (map[ext]) return map[ext];

  // Fallback to lang-map by checking if the extension is explicitly mapped
  const dict = langMap();
  if (dict.languages[ext] && dict.languages[ext].length > 0) {
    const lang = dict.languages[ext][0];
    return lang.charAt(0).toUpperCase() + lang.slice(1);
  }

  // Check if filename itself is explicitly mapped in lang-map
  if (dict.languages[fileName.toLowerCase()] && dict.languages[fileName.toLowerCase()].length > 0) {
    const lang = dict.languages[fileName.toLowerCase()][0];
    return lang.charAt(0).toUpperCase() + lang.slice(1);
  }

  // Fallback to mime-types for broad categorization (Image, Video, Audio, Font, etc.)
  const mimeType = mime.lookup(fileName);
  if (mimeType) {
    if (mimeType.startsWith("image/")) return "Image";
    if (mimeType.startsWith("video/")) return "Video";
    if (mimeType.startsWith("audio/")) return "Audio";
    if (mimeType.startsWith("font/")) return "Font";
    if (mimeType === "application/json") return "JSON";
    if (mimeType === "application/pdf") return "PDF";
    if (mimeType === "text/html") return "HTML";
    if (mimeType === "text/plain") return "Text";
    if (mimeType === "text/markdown") return "Markdown";
    if (mimeType === "application/xml" || mimeType === "text/xml") return "XML";
    if (mimeType === "application/zip" || mimeType === "application/x-gzip") return "Archive";
    
    // Attempt to extract something readable from the mime subtype
    const subtype = mimeType.split("/")[1];
    if (subtype) {
       // Format "x-yaml" -> "YAML", "csv" -> "CSV"
       let formatted = subtype.replace(/^x-/, '').toUpperCase();
       if (formatted.length > 10) {
           formatted = formatted.slice(0, 1) + formatted.slice(1).toLowerCase();
       }
       return formatted;
    }
  }

  // Fallback for files with no extension (e.g. 'Dockerfile.dev') or dotfiles (e.g. '.gitignore')
  if (fileName.startsWith('.') || fileName.indexOf('.') === -1) {
    return "Configuration";
  }

  return "Unknown";
};

// Extensions we skip (binaries, images, lock files etc.)
const SKIP_EXTENSIONS = new Set([
  "png", "jpg", "jpeg", "gif", "svg", "ico", "webp", "bmp",
  "ttf", "woff", "woff2", "eot", "otf",
  "mp4", "mp3", "wav", "ogg",
  "zip", "tar", "gz", "tgz", "rar",
  "lock", "sum",
  "pdf", "doc", "docx",
  "pyc", "pyo", "class", "o", "a", "so", "dylib", "dll", "exe",
]);

const shouldSkipFile = (path) => {
  const ext = path.split(".").pop().toLowerCase();
  if (SKIP_EXTENSIONS.has(ext)) return true;
  // Skip very long paths (generated files) or hidden system dirs
  if (path.startsWith(".git/")) return true;
  if (path.includes("node_modules/")) return true;
  if (path.includes("__pycache__/")) return true;
  if (path.includes(".next/")) return true;
  if (path.includes("dist/") || path.includes("build/")) return true;
  return false;
};

// Removed inline parseImports and calculateComplexity; using AST parsers from ../parser

// Resolve a relative import path to a likely file path
const resolveImport = (fromPath, importPath, allFilePaths) => {
  if (!importPath.startsWith(".")) return null; // external package

  const dir = fromPath.split("/").slice(0, -1).join("/");
  const extensions = ["", ".js", ".ts", ".jsx", ".tsx", ".py"];

  // Normalize the base path
  const parts = (dir + "/" + importPath).split("/");
  const resolved = [];
  for (const part of parts) {
    if (part === "..") resolved.pop();
    else if (part !== ".") resolved.push(part);
  }
  const base = resolved.join("/");

  // Try exact match first, then with extensions
  for (const ext of extensions) {
    const candidate = base + ext;
    if (allFilePaths.has(candidate)) return candidate;
    // Also try index file
    const indexCandidate = base + "/index" + ext;
    if (allFilePaths.has(indexCandidate)) return indexCandidate;
  }
  return null;
};

// ─── Core Analysis Pipeline ───────────────────────────────────────────────────

const runRealAnalysis = async (repoId, owner, repo) => {
  const jobDoc = await Job.findOne({ repoId });
  const jobId = jobDoc?._id?.toString();

  const emitProgress = (progress, status = "running") => {
    const io = getIO();
    if (io && jobId) {
      io.to(`job:${jobId}`).emit("job:progress", { jobId, progress, status });
    }
  };

  const updateJob = async (progress, status = "running") => {
    await Job.findOneAndUpdate({ repoId }, { status, progress });
    emitProgress(progress, status);
  };

  const updateRepo = (status) =>
    Repository.findByIdAndUpdate(repoId, { status });

  try {
    await updateJob(10);
    await updateRepo("processing");

    // ── Step 1: Fetch repo default branch SHA ────────────────────────────────
    const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: githubHeaders(),
    });

    if (repoRes.status === 404) {
      throw new AppError("Repository not found or is private. Check your GITHUB_TOKEN or the repository URL.", 422, "REPO_NOT_ACCESSIBLE");
    }
    if (repoRes.status === 403 || repoRes.status === 429) {
      throw new AppError("GitHub API rate limit exceeded or access forbidden. Try again later.", 429, "GITHUB_RATE_LIMIT");
    }
    if (repoRes.status === 401) {
      throw new AppError("GitHub API unauthorized. Check your GITHUB_TOKEN in the backend .env file.", 401, "GITHUB_UNAUTHORIZED");
    }
    if (!repoRes.ok) {
      const errorText = await repoRes.text().catch(() => "Unknown error text");
      throw new AppError(`Failed to fetch repository from GitHub (Status: ${repoRes.status}). Details: ${errorText}`, 502, "GITHUB_API_ERROR");
    }

    const repoData = await repoRes.json();
    const defaultBranch = repoData.default_branch || "main";

    // ── Step 2: Fetch file tree recursively ──────────────────────────────────
    await updateJob(20);

    const treeRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`,
      { headers: githubHeaders() }
    );

    if (treeRes.status === 403 || treeRes.status === 429) {
      throw new AppError("GitHub API rate limit exceeded. Try again later.", 429, "GITHUB_RATE_LIMIT");
    }
    if (!treeRes.ok) {
      throw new AppError("Failed to fetch file tree from GitHub.", 502, "GITHUB_API_ERROR");
    }

    const treeData = await treeRes.json();
    const allTreeItems = treeData.tree || [];

    // Filter to source files only (blobs, skip binaries and generated dirs)
    const sourceFiles = allTreeItems.filter(
      (item) => item.type === "blob" && !shouldSkipFile(item.path)
    );

    await updateJob(30);

    // ── Step 3: Fetch file content and analyse each file ─────────────────────
    // Limit to first 200 files to avoid rate limits on very large repos
    const filesToProcess = sourceFiles.slice(0, 200);
    const allFilePaths = new Set(sourceFiles.map((f) => f.path));

    const processedFiles = [];
    const batchSize = 10;

    for (let i = 0; i < filesToProcess.length; i += batchSize) {
      const batch = filesToProcess.slice(i, i + batchSize);

      const batchResults = await Promise.all(
        batch.map(async (item) => {
          try {
            const contentRes = await fetch(
              `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(item.path)}`,
              { headers: githubHeaders() }
            );

            if (!contentRes.ok) return null;

            const contentData = await contentRes.json();
            // GitHub returns content as base64
            const rawContent = Buffer.from(contentData.content || "", "base64").toString("utf-8");
            const language = detectLanguage(item.path);
            const imports = parseImports(rawContent, language);
            const complexity = calculateComplexity(rawContent, language);
            const size = item.size || rawContent.length;

            return { path: item.path, language, imports, complexity, size, content: rawContent };
          } catch {
            return null;
          }
        })
      );

      processedFiles.push(...batchResults.filter(Boolean));

      // Update progress proportionally through 30-80 range
      const progressPct = 30 + Math.round((i / filesToProcess.length) * 50);
      await updateJob(Math.min(progressPct, 80));
    }

    // ── Step 4: Store files in DB ─────────────────────────────────────────────
    await updateJob(82);

    // Remove any previously stored files for this repo (re-analysis case)
    await File.deleteMany({ repoId });

    const fileDocs = processedFiles.map((f) => ({ repoId, ...f, changeFrequency: 0 }));
    const savedFiles = await File.insertMany(fileDocs);

    // ── Step 5: Build dependency graph ────────────────────────────────────────
    await updateJob(90);

    const nodes = savedFiles.map((f) => ({
      id: f.path,
      label: f.path.split("/").pop(),
      language: f.language,
    }));

    const edges = [];
    const pathToFile = new Map(processedFiles.map((f) => [f.path, f]));

    for (const file of processedFiles) {
      for (const importPath of file.imports) {
        const resolved = resolveImport(file.path, importPath, allFilePaths);
        if (resolved && pathToFile.has(resolved)) {
          edges.push({ from: file.path, to: resolved });
        }
      }
    }

    // Upsert graph (may exist from a previous analysis run)
    await Graph.findOneAndUpdate(
      { repoId },
      { repoId, nodes, edges },
      { upsert: true, new: true }
    );

    // ── Step 6: Mark complete ─────────────────────────────────────────────────
    await updateJob(100, "done");
    await Repository.findByIdAndUpdate(repoId, { status: "completed", completedAt: new Date() });
    // Emit final completion event so client can redirect/refresh
    const io = getIO();
    if (io && jobId) io.to(`job:${jobId}`).emit("job:done", { jobId });
  } catch (err) {
    await Job.findOneAndUpdate(
      { repoId },
      { status: "failed", error: err.message, progress: 0 }
    );
    await Repository.findByIdAndUpdate(repoId, { status: "failed" });
    // Emit failure so client stops waiting
    const io = getIO();
    if (io && jobId) io.to(`job:${jobId}`).emit("job:failed", { jobId, error: err.message });
    // Re-throw so the caller's .catch() can log it
    throw err;
  }
};

const AIInsight = require("../../models/AIInsight");
const Chat = require("../../models/Chat");

const deleteRepo = async (repoId, userId) => {
  const repo = await Repository.findOne({ _id: repoId, userId });
  if (!repo) throw new AppError("Repository not found.", 404, "REPO_NOT_FOUND");
  
  await Job.deleteMany({ repoId });
  await File.deleteMany({ repoId });
  await Graph.deleteMany({ repoId });
  await AIInsight.deleteMany({ repoId });
  await Chat.deleteMany({ repoId });
  await Repository.deleteOne({ _id: repoId });
  
  return true;
};

const analyzeRepo = async (userId, repoUrl, force = false) => {
  // Check if user already submitted this URL — return cached result
  const existing = await Repository.findOne({ userId, repoUrl });
  if (existing && !force) {
    const job = await Job.findOne({ repoId: existing._id });
    return { repo: existing, job, cached: true };
  }
  
  if (existing && force) {
    await deleteRepo(existing._id, userId);
  }

  const { owner, repo } = parseGitHubUrl(repoUrl);
  const repoName = repo;

  const newRepo = await Repository.create({ userId, repoUrl, repoName, status: "pending" });
  const job = await Job.create({ repoId: newRepo._id, status: "queued", progress: 0 });

  // Enqueue the analysis job — BullMQ worker will pick it up
  const queue = getAnalysisQueue();
  const bullJob = await queue.add(
    "analyze-repo",
    { repoId: newRepo._id.toString(), owner, repo },
    { jobId: job._id.toString() } // use our MongoDB ID as BullMQ job ID for traceability
  );

  // Persist BullMQ job ID back onto our Job document
  await Job.findByIdAndUpdate(job._id, { bullJobId: bullJob.id });

  return { repo: newRepo, job, cached: false };
};

const getUserRepos = async (userId) => {
  return await Repository.find({ userId }).sort({ createdAt: -1 });
};

const getRepoById = async (repoId) => {
  const repo = await Repository.findById(repoId);
  if (!repo) throw new AppError("No repository found with that ID.", 404, "REPO_NOT_FOUND");
  return repo;
};

module.exports = { analyzeRepo, getUserRepos, getRepoById, deleteRepo, runRealAnalysis };
