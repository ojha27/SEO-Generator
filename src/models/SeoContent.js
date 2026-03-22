const mongoose = require('mongoose');

const seoContentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  keyword: {
    type: String,
    required: [true, 'Keyword is required'],
    trim: true,
    maxlength: [100, 'Keyword cannot exceed 100 characters']
  },
  topic: {
    type: String,
    required: [true, 'Topic is required'],
    trim: true,
    maxlength: [200, 'Topic cannot exceed 200 characters']
  },
  targetUrl: {
    type: String,
    trim: true,
    match: [/^https?:\/\/.+/, 'Please enter a valid URL']
  },
  generatedContent: {
    metaTitle: {
      type: String
    },
    metaDescription: {
      type: String
    },
    blogOutline: {
      type: String
    },
    internalLinks: [{
      url: String,
      anchorText: String
    }],
    targetKeywords: [String],
    contentLength: {
      type: String,
      default: 'medium'
    },
    tone: {
      type: String,
      default: 'professional'
    }
  },
  generationStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  errorMessage: {
    type: String,
    default: null
  },
  aiModel: {
    type: String,
    default: 'gemini-1.5-flash'
  },
  processingTime: {
    type: Number, // in milliseconds
    default: 0
  },
  tokensUsed: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for efficient queries
seoContentSchema.index({ user: 1, createdAt: -1 });
seoContentSchema.index({ keyword: 1 });

// Static method to get user's content history
seoContentSchema.statics.getUserHistory = function(userId, page = 1, limit = 10) {
  return this.find({ user: userId })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('user', 'username email');
};

// Static method to get user's usage statistics
seoContentSchema.statics.getUserStats = function(userId) {
  return this.aggregate([
    { $match: { user: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalGenerations: { $sum: 1 },
        successfulGenerations: {
          $sum: { $cond: [{ $eq: ['$generationStatus', 'completed'] }, 1, 0] }
        },
        failedGenerations: {
          $sum: { $cond: [{ $eq: ['$generationStatus', 'failed'] }, 1, 0] }
        },
        averageProcessingTime: { $avg: '$processingTime' },
        totalTokensUsed: { $sum: '$tokensUsed' }
      }
    }
  ]);
};

module.exports = mongoose.model('SeoContent', seoContentSchema);
