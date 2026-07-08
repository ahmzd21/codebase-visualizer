const { createBullBoard } = require("@bull-board/api");
const { BullMQAdapter } = require("@bull-board/api/bullMQAdapter");
const { ExpressAdapter } = require("@bull-board/express");
const { analysisQueue } = require("./analysisQueue");

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/admin/queues");

createBullBoard({
  queues: [new BullMQAdapter(analysisQueue)],
  serverAdapter,
});

/**
 * Simple API key middleware to protect the Bull Board admin UI.
 * Set BULL_BOARD_PASSWORD in your .env to enable authentication.
 */
const bullBoardAuth = (req, res, next) => {
  const password = process.env.BULL_BOARD_PASSWORD;
  if (!password) return next(); // No password set — open in dev

  const provided = req.headers["x-admin-key"] || req.query.key;
  if (provided !== password) {
    return res.status(401).json({ error: "Unauthorized. Provide ?key=<BULL_BOARD_PASSWORD> or x-admin-key header." });
  }
  next();
};

module.exports = { serverAdapter, bullBoardAuth };
