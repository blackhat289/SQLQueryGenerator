const User = require('../models/User');
const sendEmail = require('../services/email.service');
const crypto = require('crypto');

// @desc    Forgot Password - Send OTP Email
// @route   POST /api/auth/forgotpassword
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a registered email address.',
      });
    }

    const user = await User.findOne({ email });

    // For security reasons, don't reveal if user exists or not, but respond with success
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If the email matches an active account, an OTP code will be sent.',
      });
    }

    // Generate random 6-digit numeric OTP code
    const otp = Math.floor(100000 + crypto.randomInt(900000)).toString();

    // Set OTP and Expiry (+10 minutes)
    user.otp = otp;
    user.otpExpiry = Date.now() + 10 * 60 * 1000;
    user.otpRetries = 0;
    await user.save({ validateBeforeSave: false });

    // Send email containing OTP
    const messageText = `Hello,\n\nYou requested a password reset for your SQLGenie account. Your one-time verification OTP is:\n\n${otp}\n\nThis OTP is valid for 10 minutes. If you did not request this code, you can safely ignore this email.`;
    const messageHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <h2 style="color: #6366f1; text-align: center; font-weight: bold;">SQLGenie AI</h2>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-bottom: 20px;">
        <p>Hello,</p>
        <p>You requested a password reset. Please copy and paste the OTP code below into the reset panel:</p>
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 4px; padding: 15px; text-align: center; margin: 20px 0; color: #1e293b;">
          ${otp}
        </div>
        <p style="font-size: 13px; color: #64748b;">This OTP code expires in 10 minutes. If you did not initiate this request, you can secure your account by changing your login settings.</p>
      </div>
    `;

    try {
      await sendEmail({
        to: user.email,
        subject: 'SQLGenie Reset Password OTP Code',
        text: messageText,
        html: messageHtml,
      });

      res.status(200).json({
        success: true,
        message: 'OTP verification code has been dispatched successfully.',
      });
    } catch (err) {
      console.error(err);
      user.otp = undefined;
      user.otpExpiry = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        success: false,
        message: 'Email dispatcher failed. Try again later.',
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Verify OTP Code
// @route   POST /api/auth/verifyotp
// @access  Public
exports.verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Provide email and verification OTP.',
      });
    }

    const user = await User.findOne({ email });
    if (!user || !user.otp) {
      return res.status(400).json({
        success: false,
        message: 'OTP session not found or invalid.',
      });
    }

    // Check expiry
    if (Date.now() > user.otpExpiry) {
      return res.status(400).json({
        success: false,
        message: 'OTP code has expired. Please request a new one.',
      });
    }

    // Check retries limit (max 3 retries)
    if (user.otpRetries >= 3) {
      return res.status(400).json({
        success: false,
        message: 'Maximum verification retries exceeded. Please request a new OTP.',
      });
    }

    if (user.otp !== otp) {
      user.otpRetries += 1;
      await user.save({ validateBeforeSave: false });
      return res.status(400).json({
        success: false,
        message: `Incorrect OTP. ${3 - user.otpRetries} attempts remaining.`,
      });
    }

    res.status(200).json({
      success: true,
      message: 'OTP Code verified successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset Password with verified OTP
// @route   POST /api/auth/resetpassword
// @access  Public
exports.resetPassword = async (req, res, next) => {
  try {
    const { email, otp, password } = req.body;

    if (!email || !otp || !password) {
      return res.status(400).json({
        success: false,
        message: 'Provide email, OTP verification code, and new password.',
      });
    }

    const user = await User.findOne({ email });
    if (!user || !user.otp) {
      return res.status(400).json({
        success: false,
        message: 'OTP session invalid or not found.',
      });
    }

    // Double check OTP validity
    if (Date.now() > user.otpExpiry) {
      return res.status(400).json({
        success: false,
        message: 'OTP validation session expired.',
      });
    }

    if (user.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect OTP code token.',
      });
    }

    // Change Password
    user.password = password;
    user.otp = undefined;
    user.otpExpiry = undefined;
    user.otpRetries = 0;
    
    // Automatically verify email during password resets
    user.isVerified = true;
    
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful! You can now log in.',
    });
  } catch (error) {
    next(error);
  }
};
