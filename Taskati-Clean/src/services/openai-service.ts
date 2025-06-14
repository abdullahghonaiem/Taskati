import OpenAI from 'openai';

// Initialize the OpenAI client with the API key from environment variables
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // This is needed for client-side usage
});

/**
 * Generate content using OpenAI
 * @param prompt The prompt to send to OpenAI
 * @returns The generated content
 */
export async function generateContent(prompt: string): Promise<string> {
  try {
    // Check if API key is available
    if (!import.meta.env.VITE_OPENAI_API_KEY) {
      throw new Error('OpenAI API key is not set. Please add it to your environment variables.');
    }

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    return response.choices[0]?.message?.content || 'No response generated';
  } catch (error) {
    console.error('Error generating content with OpenAI:', error);
    throw error;
  }
}

export default openai; 