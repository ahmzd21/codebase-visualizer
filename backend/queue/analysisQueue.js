const { Queue } = require("bullmq");
const { redisConnection } = require("./redisConnection");

// The analysis queue — jobs are produced here and consumed by the worker
const analysisQueue = new Queue("analysis-queue", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 30_000, // 30s base, doubles on each retry
    },
    removeOnComplete: { count: 100 }, // keep last 100 completed jobs in Redis
    removeOnFail: { count: 200 },     // keep last 200 failed jobs for inspection
  },
});

module.exports = { analysisQueue };
