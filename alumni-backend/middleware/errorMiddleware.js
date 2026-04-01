const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

const errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  const statusCode = err.statusCode || res.statusCode || 500;
  const safeStatus = statusCode >= 400 ? statusCode : 500;

  const payload = {
    message: err.message || "Internal server error",
  };

  if (process.env.NODE_ENV !== "production" && err.stack) {
    payload.stack = err.stack;
  }

  res.status(safeStatus).json(payload);
};

module.exports = {
  notFound,
  errorHandler,
};