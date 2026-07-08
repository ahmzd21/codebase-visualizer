/**
 * Queue entry point — importing this module:
 * 1. Creates the analysis queue (producer)
 * 2. Starts the analysis worker (consumer)
 *
 * Import once in server.js to boot everything up.
 */

const { analysisQueue } = require("./analysisQueue");
const { analysisWorker } = require("./analysisWorker");

module.exports = { analysisQueue, analysisWorker };
