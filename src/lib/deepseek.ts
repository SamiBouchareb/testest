'use client'

const DEEPSEEK_API_KEY = 'sk-7349a0d509cf401680bb045036e34ae0';
const API_URL = 'https://api.deepseek.com/v1/chat/completions';

interface Topic {
  title: string;
  description?: string;
  subtopics: Subtopic[];
}

interface Subtopic {
  title: string;
  description?: string;
  points: Point[];
}

interface Point {
  title: string;
  description?: string;
  subpoints?: string[];
}

export interface DeepseekResponse {
  topics: Topic[];
}

export async function generateMindMapContent(prompt: string): Promise<DeepseekResponse> {
  const systemPrompt = `You are a mind map generation expert. Create a detailed hierarchical structure for the following topic. 
  Return ONLY a valid JSON object with the following structure, and nothing else:
  {
    "topics": [
      {
        "title": "Main Topic Area",
        "description": "Brief overview of this main topic area",
        "subtopics": [
          {
            "title": "Key Subtopic",
            "description": "Brief explanation of this subtopic",
            "points": [
              {
                "title": "Important Point",
                "description": "Specific detail or example",
                "subpoints": [
                  "Additional detail 1",
                  "Additional detail 2"
                ]
              }
            ]
          }
        ]
      }
    ]
  }
  
  Important Guidelines:
  1. Create 3-5 main topics that cover different aspects
  2. Each main topic should have 2-4 subtopics
  3. Each subtopic should have 2-3 key points
  4. Points can have 0-2 subpoints for extra detail
  5. Keep descriptions concise but informative
  6. Ensure logical flow and connections between levels
  7. Use clear, action-oriented language
  8. Return ONLY the JSON object, no other text
  9. Ensure the JSON is properly formatted`;

  try {
    console.log('Sending request to Deepseek API...');
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Generate a comprehensive mind map about: ${prompt}` }
        ],
        temperature: 0.7,
        max_tokens: 2500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API Error Response:', errorData);
      throw new Error(errorData.error?.message || 'Failed to generate mind map content');
    }

    const data = await response.json();
    console.log('API Response:', data);

    if (!data.choices?.[0]?.message?.content) {
      console.error('Invalid API response format:', data);
      throw new Error('Invalid response format from API');
    }

    let content = data.choices[0].message.content;
    console.log('Raw content:', content);

    // Clean up the content if it contains markdown or extra text
    if (content.includes('```json')) {
      content = content.split('```json')[1].split('```')[0].trim();
    } else if (content.includes('```')) {
      content = content.split('```')[1].split('```')[0].trim();
    }

    console.log('Cleaned content:', content);

    try {
      const parsedContent = JSON.parse(content) as DeepseekResponse;
      console.log('Parsed content:', parsedContent);

      // Validate the structure
      if (!parsedContent.topics || !Array.isArray(parsedContent.topics)) {
        throw new Error('Invalid mind map structure: missing or invalid topics array');
      }

      parsedContent.topics.forEach((topic, index) => {
        if (!topic.title || !topic.subtopics || !Array.isArray(topic.subtopics)) {
          throw new Error(`Invalid topic structure at index ${index}`);
        }

        topic.subtopics.forEach((subtopic, subIndex) => {
          if (!subtopic.title || !subtopic.points || !Array.isArray(subtopic.points)) {
            throw new Error(`Invalid subtopic structure at topic ${index}, subtopic ${subIndex}`);
          }

          subtopic.points.forEach((point, pointIndex) => {
            if (!point.title) {
              throw new Error(`Invalid point structure at topic ${index}, subtopic ${subIndex}, point ${pointIndex}`);
            }
          });
        });
      });

      return parsedContent;
    } catch (error) {
      console.error('Failed to parse mind map content:', error);
      throw new Error('Failed to parse mind map content. Please try again.');
    }
  } catch (error) {
    console.error('Failed to generate mind map:', error);
    throw error;
  }
}
