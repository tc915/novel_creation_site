// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email',
      ],
    },
    password: {
      type: String,
      // Password not required if user signed up with OAuth
      // Consider making it conditionally required based on googleId presence
      required: function() { return !this.googleId; },
      minlength: 6,
      select: false,
    },
    googleId: { // Field from passport setup
        type: String,
        select: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
       type: String,
       select: false,
    },
    emailVerificationTokenExpires: {
       type: Date,
       select: false,
    },
    // --- Add Password Reset Fields ---
    passwordResetToken: {
        type: String,
        select: false,
    },
    passwordResetTokenExpires: {
        type: Date,
        select: false,
    },
    // --- End Added Fields ---
  },
  {
    timestamps: true,
  }
);

// Hash password BEFORE saving (only if password modified)
userSchema.pre('save', async function (next) {
  // Only run if password was actually modified
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Keep password matching method
userSchema.methods.matchPassword = async function (enteredPassword) {
  // Need to handle users created via OAuth who won't have a password
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

// Keep email verification token method
userSchema.methods.getEmailVerificationToken = function() {
    const verificationToken = crypto.randomBytes(32).toString('hex');
    this.emailVerificationToken = crypto
        .createHash('sha256')
        .update(verificationToken)
        .digest('hex');
    this.emailVerificationTokenExpires = Date.now() + 15 * 60 * 1000; // 15 mins
    return verificationToken; // Return raw token
};

// --- Add method to generate password reset token ---
userSchema.methods.getPasswordResetToken = function() {
    const resetToken = crypto.randomBytes(32).toString('hex');
    // Hash token and set to passwordResetToken field
    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
    // Set expiry (e.g., 10 minutes)
    this.passwordResetTokenExpires = Date.now() + 10 * 60 * 1000; // 10 mins
    return resetToken; // Return the RAW token
};
// --- End added method ---


const User = mongoose.model('User', userSchema);
module.exports = User;