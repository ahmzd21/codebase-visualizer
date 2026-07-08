const { Worker } = require("bullmq");
const { redisConnection } = require("./redisConnection");

// Import the core analysis function and models
// We import directly from the service to avoid circular deps
const { runRealAnalysis } = require("../modules/repository/repository.service");
const Job = require("../models/Job");
const Repository = require("../models/Repository");

/**
 * The BullMQ Worker listens to the "analysis-queue" and processes jobs.
 *
 * Each job payload: { repoId, owner, repo }
 *
 * Concurrency = 3: At most 3 analyses run simultaneously,
 * preventing GitHub API rate limit exhaustion.
 */
const analysisWorker = new Worker(
  "analysis-queue",
  async (bullJob) => {
    const { repoId, owner, repo } = bullJob.data;

    console.log(`[Worker] Starting analysis for repoId=${repoId} (${owner}/${repo})`);

    // Store BullMQ job ID on our MongoDB Job document for traceability
    await Job.findOneAndUpdate({ repoId }, { bullJobId: bullJob.id });

    // Delegate to the existing analysis pipeline
    await runRealAnalysis(repoId, owner, repo);

    console.log(`[Worker] Completed analysis for repoId=${repoId}`);
  },
  {
    connection: redisConnection,
    concurrency: 3,
  }
);

// ─── Worker Event Handlers ────────────────────────────────────────────────────

analysisWorker.on("completed", (job) => {
  console.log(`[Worker] Job ${job.id} completed successfully.`);
});

analysisWorker.on("failed", (job, err) => {
  const attemptsLeft = job.opts.attempts - job.attemptsMade;
  if (attemptsLeft > 0) {
    console.warn(`[Worker] Job ${job.id} failed (attempt ${job.attemptsMade}/${job.opts.attempts}). Retrying... Error: ${err.message}`);
  } else {
    console.error(`[Worker] Job ${job.id} exhausted all retries. Final error: ${err.message}`);
    // Mark repo as permanently failed in MongoDB
    Repository.findByIdAndUpdate(job.data.repoId, { status: "failed" }).catch(() => {});
    Job.findOneAndUpdate(
      { repoId: job.data.repoId },
      { status: "failed", error: err.message }
    ).catch(() => {});
  }
});

analysisWorker.on("error", (err) => {
  console.error("[Worker] Worker error:", err.message);
});

analysisWorker.on("stalled", (jobId) => {
  console.warn(`[Worker] Job ${jobId} stalled — will be retried automatically.`);
});

// Prevent unhandled promise rejection from taking down the process
process.on("unhandledRejection", (reason) => {
  if (reason?.code === "ECONNREFUSED" || reason?.message?.includes("Redis")) {
    console.error("[Worker] Redis connection lost:", reason.message);
  }
});

console.log("[Worker] Analysis worker started — listening on 'analysis-queue' (concurrency: 3)");

module.exports = { analysisWorker };
