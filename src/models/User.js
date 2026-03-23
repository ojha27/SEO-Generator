const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long'],
    maxlength: [30, 'Username cannot exceed 30 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  usageQuota: {
    type: Number,
    default: 50, // Free user gets 50 generations
    min: 0
  },
  usedQuota: {
    type: Number,
    default: 0,
    min: 0
  },
  subscriptionTier: {
    type: String,
    enum: ['free', 'pro'],
    default: 'free'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Get remaining quota
userSchema.methods.getRemainingQuota = function() {
  return Math.max(0, this.usageQuota - this.usedQuota);
};

// Check if user has quota available
userSchema.methods.hasQuotaAvailable = function() {
  return this.getRemainingQuota() > 0;
};

// Use quota
userSchema.methods.useQuota = function(amount = 1) {
  if (this.getRemainingQuota() >= amount) {
    this.usedQuota += amount;
    return true;
  }
  return false;
};

// Reset quota (for monthly reset or admin action)
userSchema.methods.resetQuota = function() {
  this.usedQuota = 0;
};

module.exports = mongoose.model('User', userSchema);
