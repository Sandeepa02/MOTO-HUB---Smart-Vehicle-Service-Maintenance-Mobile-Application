const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorHandler = (err, _req, res, _next) => {
  // Default to 500 unless a route/middleware already set a status.
  // Allow middleware to signal an HTTP status via err.statusCode.
  const statusFromError =
    typeof err?.statusCode === 'number' && err.statusCode >= 400 ? err.statusCode : undefined;

  // Common cases (multer/validation) should be 4xx, not 500.
  const isMulter = err?.name === 'MulterError';
  const isMongooseValidation = err?.name === 'ValidationError';
  const isMongooseCast = err?.name === 'CastError';
  const statusCode =
    res.statusCode !== 200
      ? res.statusCode
      : statusFromError ?? (isMulter || isMongooseValidation || isMongooseCast ? 400 : 500);

  // Always log server-side so you can see the real reason in the backend terminal.
  // eslint-disable-next-line no-console
  console.error(err);

  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
};

module.exports = { notFound, errorHandler };
