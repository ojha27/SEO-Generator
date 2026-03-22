const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Access denied. No token provided.' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        error: 'Token is valid but user not found.' 
      });
    }

    if (!user.isActive) {
      return res.status(401).json({ 
        error: 'Account has been deactivated.' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Invalid token.' 
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired.' 
      });
    }
    
    console.error('Auth middleware error:', error);
    res.status(500).json({ 
      error: 'Server error during authentication.' 
    });
  }
};

// Middleware to check if user has quota available
const checkQuota = async (req, res, next) => {
  try {
    if (!req.user.hasQuotaAvailable()) {
      return res.status(429).json({ 
        error: 'Quota exceeded. Upgrade your plan or wait for quota reset.',
        remainingQuota: req.user.getRemainingQuota(),
        maxQuota: req.user.usageQuota
      });
    }
    next();
  } catch (error) {
    console.error('Quota check error:', error);
    res.status(500).json({ 
      error: 'Server error during quota check.' 
    });
  }
};

module.exports = { auth, checkQuota };
