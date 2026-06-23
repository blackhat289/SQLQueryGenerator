const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Helper function to sign JWTs and return structured response
const sendTokenResponse = async (user, statusCode, res) => {
  // Create Access Token
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '15m',
  });

  // Create Refresh Token
  const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d',
  });

  // Save refresh token on database
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  // Cookie options
  const isProduction = process.env.NODE_ENV === 'production';
  const cookieOptions = {
    path: '/',
    expires: new Date(
      Date.now() + (parseInt(process.env.JWT_REFRESH_EXPIRE) || 7) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
  };

  res
    .status(statusCode)
    .cookie('token', token, { ...cookieOptions, expires: new Date(Date.now() + 15 * 60 * 1000) }) // 15 mins
    .cookie('refreshToken', refreshToken, cookieOptions)
    .json({
      success: true,
      token,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
      },
    });
};

// @desc    Register a user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'An account is already registered with this email address.',
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
    });

    // Send register response
    sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password.',
      });
    }

    // Check for user (include password field)
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid login credentials.',
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid login credentials.',
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Log user out / clear cookies
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  try {
    // Invalidate refresh token on db
    if (req.user) {
      req.user.refreshToken = '';
      await req.user.save({ validateBeforeSave: false });
    }

    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
    });
    res.cookie('refreshToken', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Refresh session tokens
// @route   POST /api/auth/refresh
// @access  Public
exports.refreshToken = async (req, res, next) => {
  try {
    let refToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!refToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token not found. Please log in.',
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(refToken, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token invalid or expired. Please sign in.',
      });
    }

    // Check if user has this token
    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== refToken) {
      return res.status(401).json({
        success: false,
        message: 'Session revoked. Please log in again.',
      });
    }

    // Generate new pair
    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user details
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user details
// @route   PUT /api/auth/updatedetails
// @access  Private
exports.updateDetails = async (req, res, next) => {
  try {
    const { name, email } = req.body;
    const fieldsToUpdate = { name };

    if (email) {
      fieldsToUpdate.email = email;
    }

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
exports.updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current password and new password.',
      });
    }

    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    if (!(await user.matchPassword(currentPassword))) {
      return res.status(401).json({
        success: false,
        message: 'Current password details are incorrect.',
      });
    }

    user.password = newPassword;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    OAuth Callback Handler
// @route   GET /api/auth/oauth/redirect
// @access  Public
exports.oauthCallback = async (req, res, next) => {
  const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

  try {
    if (!req.user) {
      return res.redirect(`${FRONTEND_URL}/login?error=OAuthFailed`);
    }
    
    // Create Access Token
    const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || '15m',
    });

    // Create Refresh Token
    const refreshToken = jwt.sign({ id: req.user._id }, process.env.JWT_REFRESH_SECRET, {
      expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d',
    });

    req.user.refreshToken = refreshToken;
    await req.user.save({ validateBeforeSave: false });

    // Cookie options
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = {
      path: '/',
      expires: new Date(
        Date.now() + (parseInt(process.env.JWT_REFRESH_EXPIRE) || 7) * 24 * 60 * 60 * 1000
      ),
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
    };

    res.cookie('token', token, { ...cookieOptions, expires: new Date(Date.now() + 15 * 60 * 1000) });
    res.cookie('refreshToken', refreshToken, cookieOptions);

    // Redirect to frontend dashboard
    res.redirect(`${FRONTEND_URL}/`);
  } catch (error) {
    console.error('OAuth Callback Error:', error);
    res.redirect(`${FRONTEND_URL}/login?error=ServerSideError`);
  }
};
