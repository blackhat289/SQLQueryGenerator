const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log trace for developer debugging
  if (process.env.NODE_ENV !== 'production') {
    console.error(err);
  }

  // Mongoose Bad ObjectId (Cast Error)
  if (err.name === 'CastError') {
    const message = `Resource not found with id of ${err.value}`;
    error = new Error(message);
    error.statusCode = 404;
  }

  // Mongoose Duplicate Key Error
  if (err.code === 11000) {
    const message = 'Duplicate field value entered. A record already exists with these details.';
    error = new Error(message);
    error.statusCode = 400;
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((val) => val.message).join(', ');
    error = new Error(message);
    error.statusCode = 400;
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server error occurred.',
  });
};

module.exports = errorHandler;
