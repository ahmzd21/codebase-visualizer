const { createClient } = require("ioredis");

// Shared Redis connection config — used by both the Queue and Worker
const redisConnection = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null, // required by BullMQ
};

module.exports = { redisConnection };
