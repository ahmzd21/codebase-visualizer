/**
 * socketManager.js
 *
 * A singleton that holds the Socket.IO Server instance.
 * The server boots and calls setIO(io) once.
 * The BullMQ worker calls getIO() to emit progress events.
 */

let _io = null;

const setIO = (io) => {
  _io = io;
};

const getIO = () => _io;

module.exports = { setIO, getIO };
