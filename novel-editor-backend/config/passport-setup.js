// config/passport-setup.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const mongoose = require('mongoose');
const User = require('../models/User'); // Adjust path if your User model is elsewhere
require('dotenv').config(); // Ensure environment variables are loaded

// --- Serialization and Deserialization ---
// Determines what user information should be stored in the session/cookie/token
// We store only the user ID to keep it lightweight
passport.serializeUser((user, done) => {
  // 'user' here is the user object found or created in the verify callback
  done(null, user.id); // Store user's MongoDB _id
});

// Retrieves the full user object based on the ID stored in the session/cookie/token
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user); // Attaches the user object to req.user
  } catch (error) {
    done(error, null);
  }
});


// --- Google OAuth 2.0 Strategy Configuration ---
passport.use(
  new GoogleStrategy(
    {
      // Options for the Google strategy
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL, // The route Google redirects to AFTER successful login
      // It's generally recommended to use absolute URLs for callbackURL
    },
    async (accessToken, refreshToken, profile, done) => {
      // --- Verify Callback ---
      // This function runs after Google successfully authenticates the user.
      // 'profile' contains the user's Google profile information.
      // 'done' is a callback function Passport uses to proceed.

      console.log('Google Profile Received:', profile); // Log profile for debugging

      const googleId = profile.id;
      const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null; // Get primary email
      const name = profile.displayName;
      // const photo = profile.photos && profile.photos[0] ? profile.photos[0].value : null; // Optional: get photo

      if (!email) {
         // Cannot proceed without an email from Google
         return done(new Error('Email not provided by Google profile'), null);
      }

      try {
        // 1. Find user by Google ID
        let user = await User.findOne({ googleId: googleId });

        if (user) {
          // User already exists with this Google ID
          console.log('User found by Google ID:', user.email);
          return done(null, user); // Log in this user
        } else {
          // 2. No user with this Google ID, check if email exists
          user = await User.findOne({ email: email });

          if (user) {
            // User exists with this email but hasn't linked Google ID yet
            // Link Google ID to existing account
            console.log('User found by Email, linking Google ID:', user.email);
            user.googleId = googleId;
            // Optionally mark email as verified if it wasn't already
            user.isVerified = true;
            // Clear any pending email verification tokens if they existed
            user.emailVerificationToken = undefined;
            user.emailVerificationTokenExpires = undefined;
            await user.save();
            return done(null, user); // Log in this user
          } else {
            // 3. No user found by Google ID or Email - Create a new user
            console.log('Creating new user from Google profile:', email);
            const newUser = new User({
              googleId: googleId,
              email: email,
              name: name, // Use display name from Google
              isVerified: true, // Assume email from Google is verified
              // Password is not required for OAuth users
            });
            await newUser.save();
            return done(null, newUser); // Log in the new user
          }
        }
      } catch (error) {
        console.error('Error in Google Strategy verify callback:', error);
        return done(error, null);
      }
    }
  )
);