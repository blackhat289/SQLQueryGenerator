const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const fileUpload = require('express-fileupload');
const mongoSanitize = require('express-mongo-sanitize');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/error');

// Load environment variables
dotenv.config();

// Connect to MongoDB Database
connectDB();

// Initialize express app
const app = express();

// Security Middleware setup
app.use(helmet()); // Set secure HTTP response headers
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl) or matching localhost
      if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1')) {
        callback(null, true);
      } else {
        callback(new Error('Blocked by CORS policy'));
      }
    },
    credentials: true,
  })
);
app.use(mongoSanitize()); // Prevent NoSQL Query injection attacks

// Rate Limiting Security Middleware
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
});
app.use('/api/', limiter);
if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
  app.use(morgan('dev'));
}

const session = require('express-session');
const passport = require('passport');

// Require Passport configuration
require('./config/passport');

// Request parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(fileUpload());

// Express Session
app.use(
  session({
    secret: process.env.JWT_SECRET || 'fallback_session_secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production' },
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Mount router endpoints
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api', require('./routes/query.routes'));
app.use('/api/schema', require('./routes/schema.routes'));

const { protect } = require('./middleware/auth');
const { getSchemaStatus } = require('./controllers/schema.controller');

// Fallback status checker route (maps to user schema catalog)
app.get('/api/status', protect, getSchemaStatus);

// Centralized error handler interceptor
app.use(errorHandler);

// Set server listener
const PORT = process.env.PORT || 8000;
const server = app.listen(PORT, () => {
  console.log(`Server launched in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Catch unhandled database rejection errors
process.on('unhandledRejection', (err, promise) => {
  console.error(`Unhandled Rejection Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
