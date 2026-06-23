const express = require('express');
const {
  register,
  login,
  logout,
  refreshToken,
  getMe,
  updateDetails,
  updatePassword,
} = require('../controllers/auth.controller');
const {
  forgotPassword,
  verifyOtp,
  resetPassword,
} = require('../controllers/forgotPassword.controller');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const oauthClients = {
  google: { clientID: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET, name: 'Google' },
  github: { clientID: process.env.GITHUB_CLIENT_ID, clientSecret: process.env.GITHUB_CLIENT_SECRET, name: 'GitHub' },
};

const ensureOAuthConfigured = (provider) => (req, res, next) => {
  const client = oauthClients[provider];
  if (!client.clientID || !client.clientSecret) {
    return res.redirect(`${FRONTEND_URL}/login?error=${client.name}OAuthNotConfigured`);
  }
  next();
};

// Apply auth rate limiter for user onboarding and login paths
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/logout', protect, logout);
router.post('/refresh', refreshToken);
router.get('/me', protect, getMe);
router.put('/updatedetails', protect, updateDetails);
router.put('/updatepassword', protect, updatePassword);

const passport = require('passport');

// Password recovery flows
router.post('/forgotpassword', authLimiter, forgotPassword);
router.post('/verifyotp', authLimiter, verifyOtp);
router.post('/resetpassword', authLimiter, resetPassword);

// OAuth flows
router.get('/google', ensureOAuthConfigured('google'), passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: `${FRONTEND_URL}/login?error=GoogleAuthFailed` }),
  require('../controllers/auth.controller').oauthCallback
);

router.get('/github', ensureOAuthConfigured('github'), passport.authenticate('github', { scope: ['user:email'] }));
router.get(
  '/github/callback',
  passport.authenticate('github', { failureRedirect: `${FRONTEND_URL}/login?error=GithubAuthFailed` }),
  require('../controllers/auth.controller').oauthCallback
);

module.exports = router;
