const express = require('express');
const { body } = require('express-validator');
const seoController = require('../controllers/seoController');
const { auth, checkQuota } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const generateValidation = [
  body('keyword')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Keyword must be between 1 and 100 characters')
    .notEmpty()
    .withMessage('Keyword is required'),
  
  body('topic')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Topic must be between 1 and 200 characters')
    .notEmpty()
    .withMessage('Topic is required'),
  
  body('targetUrl')
    .optional()
    .isURL()
    .withMessage('Target URL must be a valid URL')
    .trim()
];

// All SEO routes require authentication
router.use(auth);

// Routes
router.post('/generate', generateValidation, checkQuota, seoController.generate);
router.get('/history', seoController.getHistory);
router.get('/usage', seoController.getUsage);
router.get('/:id', seoController.getGeneration);
router.delete('/:id', seoController.deleteGeneration);

module.exports = router;
