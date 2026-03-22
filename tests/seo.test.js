const request = require('supertest');
const app = require('../src/server');
const User = require('../src/models/User');
const SeoContent = require('../src/models/SeoContent');

// Mock the Gemini service
jest.mock('../src/services/geminiService', () => ({
  generateSEOContent: jest.fn().mockImplementation(async (keyword, topic, targetUrl) => {
    return {
      success: true,
      content: {
        metaTitle: `Ultimate Guide to ${keyword}`,
        metaDescription: `Learn everything about ${keyword} in this comprehensive guide covering ${topic}`,
        blogOutline: `# Introduction\n## What is ${keyword}?\n## Why ${keyword} Matters\n## Key Benefits\n## Best Practices\n## Conclusion`,
        internalLinks: [
          { url: '/blog/related-topic', anchorText: 'Related Topic' },
          { url: '/resources/guide', anchorText: 'Complete Guide' }
        ],
        targetKeywords: [keyword, `${keyword} guide`, `${keyword} tutorial`, 'best practices'],
        contentLength: 'medium',
        tone: 'professional'
      },
      processingTime: 1500,
      tokensUsed: 250
    };
  })
}));

describe('SEO Content Generation Endpoints', () => {
  let token;
  let userId;

  beforeEach(async () => {
    await User.deleteMany({});
    await SeoContent.deleteMany({});

    // Create and login user
    const userData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'Password123'
    };
    
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send(userData);
    
    token = registerResponse.body.token;
    userId = registerResponse.body.user.id;
  });

  describe('POST /api/seo/generate', () => {
    it('should generate SEO content successfully', async () => {
      const generateData = {
        keyword: 'digital marketing',
        topic: 'comprehensive guide to digital marketing strategies',
        targetUrl: 'https://example.com/digital-marketing'
      };

      const response = await request(app)
        .post('/api/seo/generate')
        .set('Authorization', `Bearer ${token}`)
        .send(generateData)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'SEO content generated successfully');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('keyword', generateData.keyword);
      expect(response.body.data).toHaveProperty('topic', generateData.topic);
      expect(response.body.data).toHaveProperty('generatedContent');
      expect(response.body.data.generatedContent).toHaveProperty('metaTitle');
      expect(response.body.data.generatedContent).toHaveProperty('metaDescription');
      expect(response.body.data.generatedContent).toHaveProperty('blogOutline');
      expect(response.body.data.generatedContent).toHaveProperty('internalLinks');
      expect(response.body.data.generatedContent).toHaveProperty('targetKeywords');
      expect(response.body).toHaveProperty('userQuota');
      expect(response.body.userQuota.used).toBe(1);
    });

    it('should return validation error for invalid data', async () => {
      const invalidData = {
        keyword: '', // empty keyword
        topic: 'a'.repeat(201), // too long
        targetUrl: 'invalid-url'
      };

      const response = await request(app)
        .post('/api/seo/generate')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Validation failed');
      expect(response.body).toHaveProperty('details');
    });

    it('should return error without authentication', async () => {
      const generateData = {
        keyword: 'digital marketing',
        topic: 'comprehensive guide to digital marketing strategies'
      };

      const response = await request(app)
        .post('/api/seo/generate')
        .send(generateData)
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Access denied. No token provided.');
    });

    it('should return error when quota is exceeded', async () => {
      // Use up all quota
      const user = await User.findById(userId);
      user.usedQuota = user.usageQuota;
      await user.save();

      const generateData = {
        keyword: 'digital marketing',
        topic: 'comprehensive guide to digital marketing strategies'
      };

      const response = await request(app)
        .post('/api/seo/generate')
        .set('Authorization', `Bearer ${token}`)
        .send(generateData)
        .expect(429);

      expect(response.body).toHaveProperty('error', 'Quota exceeded');
    });
  });

  describe('GET /api/seo/history', () => {
    beforeEach(async () => {
      // Create some test content
      await request(app)
        .post('/api/seo/generate')
        .set('Authorization', `Bearer ${token}`)
        .send({
          keyword: 'test keyword 1',
          topic: 'test topic 1'
        });

      await request(app)
        .post('/api/seo/generate')
        .set('Authorization', `Bearer ${token}`)
        .send({
          keyword: 'test keyword 2',
          topic: 'test topic 2'
        });
    });

    it('should get user generation history', async () => {
      const response = await request(app)
        .get('/api/seo/history')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('history');
      expect(response.body.history).toHaveLength(2);
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.pagination).toHaveProperty('currentPage', 1);
      expect(response.body.pagination).toHaveProperty('totalItems', 2);
    });

    it('should return error without authentication', async () => {
      const response = await request(app)
        .get('/api/seo/history')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Access denied. No token provided.');
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/seo/history?page=1&limit=1')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.history).toHaveLength(1);
      expect(response.body.pagination.currentPage).toBe(1);
      expect(response.body.pagination.itemsPerPage).toBe(1);
    });
  });

  describe('GET /api/seo/usage', () => {
    beforeEach(async () => {
      // Create some test content
      await request(app)
        .post('/api/seo/generate')
        .set('Authorization', `Bearer ${token}`)
        .send({
          keyword: 'test keyword',
          topic: 'test topic'
        });
    });

    it('should get user usage statistics', async () => {
      const response = await request(app)
        .get('/api/seo/usage')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('usage');
      expect(response.body.usage).toHaveProperty('totalGenerations', 1);
      expect(response.body.usage).toHaveProperty('successfulGenerations', 1);
      expect(response.body.usage).toHaveProperty('currentQuota');
      expect(response.body.usage.currentQuota).toHaveProperty('used', 1);
      expect(response.body.usage.currentQuota).toHaveProperty('max', 5);
      expect(response.body.usage.currentQuota).toHaveProperty('remaining', 4);
    });

    it('should return error without authentication', async () => {
      const response = await request(app)
        .get('/api/seo/usage')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Access denied. No token provided.');
    });
  });

  describe('DELETE /api/seo/:id', () => {
    let contentId;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/seo/generate')
        .set('Authorization', `Bearer ${token}`)
        .send({
          keyword: 'test keyword',
          topic: 'test topic'
        });
      
      contentId = response.body.data.id;
    });

    it('should delete generation successfully', async () => {
      const response = await request(app)
        .delete(`/api/seo/${contentId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Generation deleted successfully');

      // Verify it's deleted
      await request(app)
        .get(`/api/seo/${contentId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });

    it('should return error for non-existent generation', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      
      const response = await request(app)
        .delete(`/api/seo/${fakeId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Generation not found');
    });

    it('should return error without authentication', async () => {
      const response = await request(app)
        .delete(`/api/seo/${contentId}`)
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Access denied. No token provided.');
    });
  });
});
