const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes middleware
const protect = async (req, res, next) => {
  let token;

  // Read token from authorization header or cookie
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  // Make sure token exists
  if (!token) {
    console.warn('Protect middleware rejected request without token', {
      url: req.originalUrl,
      method: req.method,
      cookies: req.cookies,
      authorization: req.headers.authorization,
    });

    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this resource. Please sign in.',
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find and attach user to request (excluding password)
    req.user = await User.findById(decoded.id);
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'No user associated with this token.',
      });
    }

    next();
  } catch (error) {
    console.error('JWT verification error:', error.message);
    
    // Explicitly handle token expiration vs invalid token
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        code: 'TOKEN_EXPIRED',
        message: 'Session expired. Requesting refresh.',
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Session invalid. Please login again.',
    });
  }
};

// Grant access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user ? req.user.role : 'guest'}' is not authorized to access this route.`,
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
