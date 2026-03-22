const { validationResult } = require('express-validator');
const SeoContent = require('../models/SeoContent');
const User = require('../models/User');
const geminiService = require('../services/geminiService');

const seoController = {
  // Generate SEO content
  generate: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { keyword, topic, targetUrl } = req.body;
      const userId = req.user._id;

      // Check user quota
      if (!req.user.hasQuotaAvailable()) {
        return res.status(429).json({
          error: 'Quota exceeded. Upgrade your plan or wait for quota reset.',
          remainingQuota: req.user.getRemainingQuota(),
          maxQuota: req.user.usageQuota
        });
      }

      // Create SEO content record
      const seoContent = new SeoContent({
        user: userId,
        keyword,
        topic,
        targetUrl,
        generationStatus: 'pending'
      });

      await seoContent.save();

      try {
        // Generate content using Gemini AI
        const aiResult = await geminiService.generateSEOContent(keyword, topic, targetUrl);

        if (aiResult.success) {
          // Update record with generated content
          seoContent.generatedContent = aiResult.content;
          seoContent.generationStatus = 'completed';
          seoContent.processingTime = aiResult.processingTime;
          seoContent.tokensUsed = aiResult.tokensUsed;
          seoContent.aiModel = 'gemini-1.5-flash';

          // Update user quota
          req.user.useQuota(1);
          await req.user.save();
        } else {
          seoContent.generationStatus = 'failed';
          seoContent.errorMessage = aiResult.error;
          seoContent.processingTime = aiResult.processingTime;
        }

        await seoContent.save();

        if (aiResult.success) {
          res.status(201).json({
            message: 'SEO content generated successfully',
            data: {
              id: seoContent._id,
              keyword: seoContent.keyword,
              topic: seoContent.topic,
              targetUrl: seoContent.targetUrl,
              generatedContent: seoContent.generatedContent,
              processingTime: seoContent.processingTime,
              tokensUsed: seoContent.tokensUsed,
              createdAt: seoContent.createdAt
            },
            userQuota: {
              used: req.user.usedQuota,
              max: req.user.usageQuota,
              remaining: req.user.getRemainingQuota()
            }
          });
        } else {
          res.status(500).json({
            error: aiResult.error || 'Failed to generate SEO content',
            data: {
              id: seoContent._id,
              generationStatus: seoContent.generationStatus,
              errorMessage: seoContent.errorMessage
            }
          });
        }
      } catch (aiError) {
        // Handle AI service errors
        seoContent.generationStatus = 'failed';
        seoContent.errorMessage = aiError.message;
        await seoContent.save();

        res.status(500).json({
          error: 'AI service error. Please try again later.',
          data: {
            id: seoContent._id,
            generationStatus: seoContent.generationStatus,
            errorMessage: seoContent.errorMessage
          }
        });
      }
    } catch (error) {
      console.error('SEO generation error:', error);
      res.status(500).json({
        error: 'Server error during SEO content generation'
      });
    }
  },

  // Get user's generation history
  getHistory: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const userId = req.user._id;

      const history = await SeoContent.find({ user: userId })
        .select('keyword topic targetUrl generationStatus createdAt processingTime tokensUsed')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      const total = await SeoContent.countDocuments({ user: userId });

      res.json({
        history,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        }
      });
    } catch (error) {
      console.error('Get history error:', error);
      res.status(500).json({
        error: 'Server error while fetching history'
      });
    }
  },

  // Get specific generation details
  getGeneration: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user._id;

      const seoContent = await SeoContent.findOne({ 
        _id: id, 
        user: userId 
      });

      if (!seoContent) {
        return res.status(404).json({
          error: 'Generation not found'
        });
      }

      res.json({
        data: {
          id: seoContent._id,
          keyword: seoContent.keyword,
          topic: seoContent.topic,
          targetUrl: seoContent.targetUrl,
          generatedContent: seoContent.generatedContent,
          generationStatus: seoContent.generationStatus,
          errorMessage: seoContent.errorMessage,
          processingTime: seoContent.processingTime,
          tokensUsed: seoContent.tokensUsed,
          aiModel: seoContent.aiModel,
          createdAt: seoContent.createdAt,
          updatedAt: seoContent.updatedAt
        }
      });
    } catch (error) {
      console.error('Get generation error:', error);
      res.status(500).json({
        error: 'Server error while fetching generation'
      });
    }
  },

  // Get user usage statistics
  getUsage: async (req, res) => {
    try {
      const userId = req.user._id;

      const stats = await SeoContent.getUserStats(userId);
      const userStats = stats[0] || {
        totalGenerations: 0,
        successfulGenerations: 0,
        failedGenerations: 0,
        averageProcessingTime: 0,
        totalTokensUsed: 0
      };

      res.json({
        usage: {
          ...userStats,
          currentQuota: {
            used: req.user.usedQuota,
            max: req.user.usageQuota,
            remaining: req.user.getRemainingQuota()
          }
        }
      });
    } catch (error) {
      console.error('Get usage error:', error);
      res.status(500).json({
        error: 'Server error while fetching usage statistics'
      });
    }
  },

  // Delete generation
  deleteGeneration: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user._id;

      const seoContent = await SeoContent.findOne({ 
        _id: id, 
        user: userId 
      });

      if (!seoContent) {
        return res.status(404).json({
          error: 'Generation not found'
        });
      }

      await SeoContent.deleteOne({ _id: id });

      res.json({
        message: 'Generation deleted successfully'
      });
    } catch (error) {
      console.error('Delete generation error:', error);
      res.status(500).json({
        error: 'Server error while deleting generation'
      });
    }
  }
};

module.exports = seoController;
