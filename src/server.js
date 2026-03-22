const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env'), override: true });

const authRoutes = require('./routes/auth');
const seoRoutes = require('./routes/seo');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// ✅ Security middleware
app.use(helmet());

// ✅ CORS FIX (IMPORTANT 🔥)
app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://seo-generator-frontend.vercel.app",
    "https://seo-generator-frontend-3kdozln5w-amritaojha914-7712s-projects.vercel.app"
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

// ✅ Preflight fix (VERY IMPORTANT)
app.options("*", cors());

// ✅ Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    error: 'Too many requests, please try again later.'
  }
});
app.use('/api/', limiter);

// ✅ Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ✅ Routes
app.use('/api/auth', authRoutes);
app.use('/api/seo', seoRoutes);

// ✅ Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

// ❌ REMOVE old NODE_ENV based cors (important)

// ✅ Error handler
app.use(errorHandler);

// ✅ MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
  })
  .catch((error) => {
    console.error('❌ MongoDB error:', error);
    process.exit(1);
  });

// ✅ Server start
const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = app;