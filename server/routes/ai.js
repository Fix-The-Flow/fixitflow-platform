const express = require('express');
const OpenAI = require('openai');
const { body, validationResult } = require('express-validator');
const { Guide, Ebook, Category } = require('../models');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Generate eBook outline based on topic and guides
router.post('/generate-outline', authenticate, requireAdmin, [
  body('topic').notEmpty().withMessage('Topic is required'),
  body('category').optional().isMongoId(),
  body('targetAudience').optional().isString(),
  body('includeGuides').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { topic, category, targetAudience, includeGuides } = req.body;

    // Get relevant guides if category is specified
    let relatedGuides = [];
    if (category) {
      relatedGuides = await Guide.find({ 
        category, 
        isPublished: true 
      }).select('title description steps');
    } else if (includeGuides && includeGuides.length > 0) {
      relatedGuides = await Guide.find({ 
        _id: { $in: includeGuides },
        isPublished: true 
      }).select('title description steps');
    }

    // Create prompt for AI
    const prompt = `
Create a comprehensive eBook outline for the topic: "${topic}"
${targetAudience ? `Target audience: ${targetAudience}` : ''}

${relatedGuides.length > 0 ? `
Available guides to potentially include:
${relatedGuides.map(guide => `- ${guide.title}: ${guide.description}`).join('\n')}
` : ''}

Please generate:
1. A compelling eBook title
2. A detailed table of contents with chapter titles and descriptions
3. An introduction outline
4. Chapter-by-chapter breakdown with key points
5. A conclusion outline
6. Suggested word count and reading time

Format the response as JSON with the following structure:
{
  "title": "eBook Title",
  "description": "Brief description",
  "introduction": "Introduction outline",
  "chapters": [
    {
      "title": "Chapter Title",
      "description": "What this chapter covers",
      "keyPoints": ["point 1", "point 2"],
      "suggestedGuides": ["guide IDs if applicable"]
    }
  ],
  "conclusion": "Conclusion outline",
  "metadata": {
    "estimatedWordCount": 5000,
    "estimatedReadingTime": "25 minutes"
  }
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert eBook creator specializing in practical troubleshooting and how-to content. Create detailed, actionable outlines that would help users solve real problems."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    try {
      const outline = JSON.parse(completion.choices[0].message.content);
      res.json({ 
        outline,
        relatedGuides: relatedGuides.map(g => ({
          id: g._id,
          title: g.title,
          description: g.description
        }))
      });
    } catch (parseError) {
      console.error('AI response parsing error:', parseError);
      res.status(500).json({ 
        message: 'Error parsing AI response',
        rawResponse: completion.choices[0].message.content
      });
    }
  } catch (error) {
    console.error('AI outline generation error:', error);
    res.status(500).json({ message: 'Error generating outline' });
  }
});

// Generate chapter content
router.post('/generate-chapter', authenticate, requireAdmin, [
  body('chapterTitle').notEmpty().withMessage('Chapter title is required'),
  body('chapterDescription').notEmpty().withMessage('Chapter description is required'),
  body('ebookTitle').optional().isString(),
  body('includeGuides').optional().isArray(),
  body('tone').optional().isIn(['friendly', 'professional', 'casual', 'expert']),
  body('length').optional().isIn(['short', 'medium', 'long'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { 
      chapterTitle, 
      chapterDescription, 
      ebookTitle,
      includeGuides = [],
      tone = 'friendly',
      length = 'medium'
    } = req.body;

    // Get guide content if specified
    let guideContent = '';
    if (includeGuides.length > 0) {
      const guides = await Guide.find({ 
        _id: { $in: includeGuides },
        isPublished: true 
      });
      
      guideContent = guides.map(guide => `
        Guide: ${guide.title}
        Description: ${guide.description}
        Steps: ${guide.steps.map(step => `${step.stepNumber}. ${step.title}: ${step.description}`).join('\n')}
      `).join('\n\n');
    }

    const wordTargets = {
      short: '800-1200 words',
      medium: '1500-2500 words',
      long: '2500-4000 words'
    };

    const prompt = `
Write a comprehensive chapter for an eBook titled "${ebookTitle || 'Troubleshooting Guide'}"

Chapter Title: ${chapterTitle}
Chapter Description: ${chapterDescription}
Target Length: ${wordTargets[length]}
Tone: ${tone}

${guideContent ? `
Use the following guide content as reference and integrate relevant information:
${guideContent}
` : ''}

Write in a ${tone} tone that is engaging, practical, and helpful. Include:
- Clear explanations and step-by-step instructions
- Real-world examples and scenarios
- Tips and best practices
- Common pitfalls to avoid
- Actionable takeaways

Format the content in markdown with proper headings, lists, and emphasis where appropriate.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert technical writer creating practical, actionable content for troubleshooting guides. Write in a clear, engaging style that helps readers solve real problems."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 4000
    });

    const content = completion.choices[0].message.content;
    const wordCount = content.split(/\s+/).length;

    res.json({ 
      content,
      metadata: {
        wordCount,
        estimatedReadingTime: Math.ceil(wordCount / 200) + ' minutes'
      }
    });
  } catch (error) {
    console.error('AI chapter generation error:', error);
    res.status(500).json({ message: 'Error generating chapter content' });
  }
});

// Improve/edit existing content
router.post('/improve-content', authenticate, requireAdmin, [
  body('content').notEmpty().withMessage('Content is required'),
  body('instructions').notEmpty().withMessage('Improvement instructions are required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { content, instructions } = req.body;

    const prompt = `
Please improve the following content based on these instructions: ${instructions}

Original content:
${content}

Please provide the improved version, maintaining the same general structure and format but implementing the requested improvements.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert editor specializing in technical and instructional content. Improve content while maintaining clarity and practical value."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.5,
      max_tokens: 4000
    });

    const improvedContent = completion.choices[0].message.content;
    const wordCount = improvedContent.split(/\s+/).length;

    res.json({ 
      content: improvedContent,
      metadata: {
        wordCount,
        estimatedReadingTime: Math.ceil(wordCount / 200) + ' minutes'
      }
    });
  } catch (error) {
    console.error('AI content improvement error:', error);
    res.status(500).json({ message: 'Error improving content' });
  }
});

// Generate eBook from existing guides
router.post('/generate-from-guides', authenticate, requireAdmin, [
  body('guideIds').isArray({ min: 1 }).withMessage('At least one guide is required'),
  body('title').notEmpty().withMessage('eBook title is required'),
  body('description').optional().isString(),
  body('tone').optional().isIn(['friendly', 'professional', 'casual', 'expert'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { guideIds, title, description, tone = 'friendly' } = req.body;

    // Get guides with full content
    const guides = await Guide.find({ 
      _id: { $in: guideIds },
      isPublished: true 
    }).populate('category', 'name');

    if (guides.length === 0) {
      return res.status(400).json({ message: 'No valid guides found' });
    }

    // Group guides by category
    const guidesByCategory = guides.reduce((acc, guide) => {
      const categoryName = guide.category.name;
      if (!acc[categoryName]) {
        acc[categoryName] = [];
      }
      acc[categoryName].push(guide);
      return acc;
    }, {});

    // Generate eBook structure
    const chapters = Object.entries(guidesByCategory).map(([categoryName, categoryGuides]) => ({
      title: `${categoryName} Solutions`,
      guides: categoryGuides.map(guide => ({
        id: guide._id,
        title: guide.title,
        description: guide.description,
        steps: guide.steps,
        difficulty: guide.difficulty,
        estimatedTime: guide.estimatedTime
      }))
    }));

    const prompt = `
Create a cohesive eBook from the following troubleshooting guides:

Title: ${title}
${description ? `Description: ${description}` : ''}
Tone: ${tone}

Guides organized by category:
${JSON.stringify(chapters, null, 2)}

Create:
1. An engaging introduction that ties all the guides together
2. Well-structured chapters that group related guides logically
3. Smooth transitions between guides within chapters
4. A conclusion that summarizes key takeaways

Format as JSON:
{
  "introduction": "Introduction content in markdown",
  "chapters": [
    {
      "title": "Chapter Title",
      "content": "Chapter content in markdown, integrating the guides naturally",
      "guides": ["guide-id-1", "guide-id-2"]
    }
  ],
  "conclusion": "Conclusion content in markdown"
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert technical writer who creates cohesive eBooks from individual guides. Make the content flow naturally while preserving the practical value of each guide."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.6,
      max_tokens: 4000
    });

    try {
      const ebookContent = JSON.parse(completion.choices[0].message.content);
      
      const totalWordCount = [
        ebookContent.introduction,
        ...ebookContent.chapters.map(ch => ch.content),
        ebookContent.conclusion
      ].join(' ').split(/\s+/).length;

      res.json({ 
        content: ebookContent,
        sourceGuides: guides.map(g => ({
          id: g._id,
          title: g.title,
          category: g.category.name
        })),
        metadata: {
          wordCount: totalWordCount,
          estimatedReadingTime: Math.ceil(totalWordCount / 200) + ' minutes',
          chapterCount: ebookContent.chapters.length
        }
      });
    } catch (parseError) {
      console.error('AI response parsing error:', parseError);
      res.status(500).json({ 
        message: 'Error parsing AI response',
        rawResponse: completion.choices[0].message.content
      });
    }
  } catch (error) {
    console.error('AI eBook generation error:', error);
    res.status(500).json({ message: 'Error generating eBook from guides' });
  }
});

// Generate title suggestions
router.post('/suggest-titles', authenticate, requireAdmin, [
  body('topic').notEmpty().withMessage('Topic is required'),
  body('description').optional().isString(),
  body('targetAudience').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { topic, description, targetAudience } = req.body;

    const prompt = `
Generate 10 creative, engaging titles for an eBook about: ${topic}

${description ? `Description: ${description}` : ''}
${targetAudience ? `Target audience: ${targetAudience}` : ''}

The titles should be:
- Clear and descriptive
- Engaging and clickable
- Professional but approachable
- SEO-friendly
- Between 5-15 words

Return as a JSON array of strings: ["Title 1", "Title 2", ...]`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a creative copywriter specializing in educational and practical content titles."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 500
    });

    try {
      const titles = JSON.parse(completion.choices[0].message.content);
      res.json({ titles });
    } catch (parseError) {
      // Fallback if JSON parsing fails
      const rawTitles = completion.choices[0].message.content
        .split('\n')
        .filter(line => line.trim())
        .map(line => line.replace(/^\d+\.\s*/, '').replace(/^["-]?\s*/, '').replace(/["-]?\s*$/, ''));
      
      res.json({ titles: rawTitles });
    }
  } catch (error) {
    console.error('AI title generation error:', error);
    res.status(500).json({ message: 'Error generating title suggestions' });
  }
});

// Generate SEO metadata
router.post('/generate-seo', authenticate, requireAdmin, [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').optional().isString(),
  body('content').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { title, description, content } = req.body;

    const prompt = `
Generate SEO-optimized metadata for an eBook:

Title: ${title}
${description ? `Description: ${description}` : ''}
${content ? `Content sample: ${content.substring(0, 1000)}...` : ''}

Please generate:
1. SEO-friendly slug (URL-safe)
2. Meta description (150-160 characters)
3. Keywords/tags (10-15 relevant keywords)
4. Social media description (more engaging, 100-125 characters)

Format as JSON:
{
  "slug": "seo-friendly-slug",
  "metaDescription": "SEO meta description",
  "keywords": ["keyword1", "keyword2"],
  "socialDescription": "Engaging social media description"
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an SEO expert who creates optimized metadata for educational content."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 500
    });

    try {
      const seoData = JSON.parse(completion.choices[0].message.content);
      res.json({ seoData });
    } catch (parseError) {
      console.error('AI response parsing error:', parseError);
      res.status(500).json({ 
        message: 'Error parsing AI response',
        rawResponse: completion.choices[0].message.content
      });
    }
  } catch (error) {
    console.error('AI SEO generation error:', error);
    res.status(500).json({ message: 'Error generating SEO metadata' });
  }
});

// Brainstorm eBook ideas based on popular guides
router.post('/brainstorm-ideas', authenticate, requireAdmin, async (req, res) => {
  try {
    const { category } = req.body;

    // Get popular guides, optionally filtered by category
    let query = { isPublished: true };
    if (category) {
      query.category = category;
    }

    const popularGuides = await Guide.find(query)
      .populate('category', 'name')
      .sort({ views: -1, completions: -1 })
      .limit(20)
      .select('title description category views completions tags');

    const guideData = popularGuides.map(guide => ({
      title: guide.title,
      description: guide.description,
      category: guide.category.name,
      popularity: guide.views + guide.completions * 2,
      tags: guide.tags
    }));

    const prompt = `
Based on these popular troubleshooting guides, suggest 8-10 eBook ideas that would combine related guides into comprehensive resources:

Popular Guides:
${JSON.stringify(guideData, null, 2)}

Generate eBook ideas that:
- Combine 3-5 related guides
- Address comprehensive topics
- Would appeal to users
- Have clear value propositions

Format as JSON:
{
  "ideas": [
    {
      "title": "eBook Title",
      "description": "What the eBook covers",
      "targetAudience": "Who would benefit",
      "suggestedGuides": ["guide titles to include"],
      "estimatedValue": "Why users would buy this",
      "suggestedPrice": "price in USD"
    }
  ]
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a product strategist who creates compelling eBook concepts from existing content."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 2000
    });

    try {
      const ideas = JSON.parse(completion.choices[0].message.content);
      res.json({ 
        ideas: ideas.ideas,
        sourceData: {
          totalGuides: popularGuides.length,
          categories: [...new Set(popularGuides.map(g => g.category.name))]
        }
      });
    } catch (parseError) {
      console.error('AI response parsing error:', parseError);
      res.status(500).json({ 
        message: 'Error parsing AI response',
        rawResponse: completion.choices[0].message.content
      });
    }
  } catch (error) {
    console.error('AI brainstorming error:', error);
    res.status(500).json({ message: 'Error brainstorming eBook ideas' });
  }
});

module.exports = router;
