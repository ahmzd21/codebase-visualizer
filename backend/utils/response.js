const sendSuccess = (res, statusCode, data) => {
  return res.status(statusCode).json({ success: true, ...data });
};

const sendError = (res, statusCode, code, message) => {
  return res.status(statusCode).json({
    success: false,
    error: { code, message },
  });
};

module.exports = { sendSuccess, sendError };
