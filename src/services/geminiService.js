const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }
    
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  }

  async generateSEOContent(keyword, topic, targetUrl = null) {
    const startTime = Date.now();
    
    try {
      const prompt = this.createSEOPrompt(keyword, topic, targetUrl);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const processingTime = Date.now() - startTime;
      
      // Parse the structured response
      const structuredContent = this.parseAIResponse(text);
      
      return {
        success: true,
        content: structuredContent,
        processingTime,
        tokensUsed: response.usageMetadata?.totalTokenCount || 0
      };
    } catch (error) {
      console.error('Gemini API Error:', error);
      
      let errorMessage = 'Failed to generate SEO content';
      
      if (error.status === 429) {
        errorMessage = 'API rate limit exceeded. Please try again later.';
      } else if (error.status === 403) {
        errorMessage = 'API key invalid or expired.';
      } else if (error.message?.includes('quota')) {
        errorMessage = 'API quota exceeded.';
      }
      
      return {
        success: false,
        error: errorMessage,
        processingTime: Date.now() - startTime
      };
    }
  }

  createSEOPrompt(keyword, topic, targetUrl) {
    const baseUrl = targetUrl || 'your website';
    
    return `As an expert SEO content strategist, create comprehensive SEO-optimized content for the following:

Keyword: "${keyword}"
Topic: "${topic}"
Target URL: "${baseUrl}"

Please generate a complete SEO content package with the following EXACT format:

=== META TITLE ===
[Create a compelling, SEO-optimized meta title under 60 characters that includes the keyword]

=== META DESCRIPTION ===
[Write an engaging meta description under 160 characters that includes the keyword and encourages clicks]

=== BLOG OUTLINE ===
[Create a detailed blog post outline with:
- Introduction section with hook
- 5-7 main sections with H2/H3 headings
- Each section should include 2-3 bullet points covering key topics
- Conclusion section with call-to-action]

=== INTERNAL LINKS ===
[Provide 3-5 relevant internal linking opportunities:
- URL: [suggested internal page URL]
- Anchor Text: [recommended anchor text]
- Repeat for each link]

=== TARGET KEYWORDS ===
[List 5-8 related keywords including the main keyword]

=== CONTENT LENGTH ===
[Recommended content length: short/medium/long]

=== TONE ===
[Recommended content tone: professional/casual/technical/friendly]

Important guidelines:
- Focus on search intent and user value
- Include the main keyword naturally throughout
- Ensure all meta content stays within character limits
- Make the outline actionable and comprehensive
- Provide realistic internal linking suggestions`;
  }

  parseAIResponse(text) {
    const sections = {};
    
    // Split by section headers
    const sectionHeaders = [
      '=== META TITLE ===',
      '=== META DESCRIPTION ===',
      '=== BLOG OUTLINE ===',
      '=== INTERNAL LINKS ===',
      '=== TARGET KEYWORDS ===',
      '=== CONTENT LENGTH ===',
      '=== TONE ==='
    ];
    
    let currentSection = null;
    const lines = text.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check if this is a section header
      const headerIndex = sectionHeaders.indexOf(line);
      if (headerIndex !== -1) {
        currentSection = line.replace(/=== /g, '').replace(' ===', '').toLowerCase();
        sections[currentSection] = '';
        continue;
      }
      
      // Add content to current section
      if (currentSection && line) {
        sections[currentSection] += (sections[currentSection] ? '\n' : '') + line;
      }
    }
    
    // Parse internal links into structured format
    if (sections['internal links']) {
      sections['internal links'] = this.parseInternalLinks(sections['internal links']);
    }
    
    // Parse target keywords into array
    if (sections['target keywords']) {
      sections['target keywords'] = sections['target keywords']
        .split('\n')
        .map(k => k.replace(/^[-*•]\s*/, '').trim())
        .filter(k => k);
    }
    
    return {
      metaTitle: sections['meta title'] || '',
      metaDescription: sections['meta description'] || '',
      blogOutline: sections['blog outline'] || '',
      internalLinks: sections['internal links'] || [],
      targetKeywords: sections['target keywords'] || [],
      contentLength: sections['content length'] || 'medium',
      tone: sections['tone'] || 'professional'
    };
  }

  parseInternalLinks(text) {
    const links = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
      const urlMatch = line.match(/URL:\s*(.+)/i);
      const anchorMatch = line.match(/Anchor Text:\s*(.+)/i);
      
      if (urlMatch && anchorMatch) {
        links.push({
          url: urlMatch[1].trim(),
          anchorText: anchorMatch[1].trim()
        });
      }
    }
    
    return links;
  }
}

module.exports = new GeminiService();
