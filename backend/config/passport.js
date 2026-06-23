const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/User');

// Serialize user for the session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// Google OAuth Strategy
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || 'mock_google_id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'mock_google_secret',
      callbackURL: `${BACKEND_URL}/api/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists in our db with the given googleId
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          return done(null, user);
        }

        // Check if user exists with the same email
        const email = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null;
        if (email) {
          user = await User.findOne({ email });
          if (user) {
            // Link google profile to existing user
            user.googleId = profile.id;
            user.isVerified = true; // Auto-verify if they login with Google
            if (!user.avatar && profile.photos && profile.photos.length > 0) {
              user.avatar = profile.photos[0].value;
            }
            await user.save();
            return done(null, user);
          }
        }

        // If not, create a new user
        user = await User.create({
          googleId: profile.id,
          name: profile.displayName || 'Google User',
          email: email || `${profile.id}@google.oauth`,
          isVerified: true, // Google emails are pre-verified
          avatar: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : '',
        });

        done(null, user);
      } catch (err) {
        console.error(err);
        done(err, null);
      }
    }
  )
);

// GitHub OAuth Strategy
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID || 'mock_github_id',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || 'mock_github_secret',
      callbackURL: `${BACKEND_URL}/api/auth/github/callback`,
      scope: ['user:email'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ githubId: profile.id });

        if (user) {
          return done(null, user);
        }

        const email = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null;
        if (email) {
          user = await User.findOne({ email });
          if (user) {
            user.githubId = profile.id;
            user.isVerified = true;
            if (!user.avatar && profile.photos && profile.photos.length > 0) {
              user.avatar = profile.photos[0].value;
            }
            await user.save();
            return done(null, user);
          }
        }

        user = await User.create({
          githubId: profile.id,
          name: profile.displayName || profile.username || 'GitHub User',
          email: email || `${profile.id}@github.oauth`,
          isVerified: true,
          avatar: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : '',
        });

        done(null, user);
      } catch (err) {
        console.error(err);
        done(err, null);
      }
    }
  )
);
