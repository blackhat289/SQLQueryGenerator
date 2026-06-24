/**
 * AI Text Generation Service — uses OpenRouter API (openrouter.ai)
 * Compatible with Gemini and many other models via a single API.
 * 
 * OpenRouter key is stored as GEMINI_API_KEY in .env (starts with sk-or-v1-...)
 */

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Models to try in order (all available on OpenRouter free tier)
const MODELS_TO_TRY = [
  'google/gemini-2.5-flash',
  'google/gemini-2.0-flash',
  'google/gemini-2.5-flash-preview-05-20',
  'google/gemini-flash-1.5',
];

/**
 * Sleep helper
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Standard text generation helper using OpenRouter API.
 * @param {string} prompt Complete constructed prompt string
 * @param {string} systemInstruction Optional system instruction/persona constraints
 * @returns {Promise<string>} Generated text response
 */
exports.generateText = async (prompt, systemInstruction = '') => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key') {
    console.warn('GEMINI_API_KEY (OpenRouter key) is not defined. Returning empty fallback response.');
    return '';
  }

  const messages = [];

  // Add system instruction if provided
  if (systemInstruction) {
    messages.push({ role: 'system', content: systemInstruction });
  }

  messages.push({ role: 'user', content: prompt });

  let lastError = null;

  for (const model of MODELS_TO_TRY) {
    try {
      const response = await fetch(OPENROUTER_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'http://localhost:5173',
          'X-Title': 'SQLGenie',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.1,
          max_tokens: 2048,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const text = data?.choices?.[0]?.message?.content;
        if (text) {
          console.log(`OpenRouter: Query generated successfully using ${model}`);
          return text.trim();
        }
        console.warn(`OpenRouter: Empty response from ${model}. Response: ${JSON.stringify(data)}`);
        lastError = new Error(`Empty response from ${model}`);
        continue;
      }

      const errMsg = data?.error?.message || JSON.stringify(data);
      const status = response.status;

      // 429 = rate limited — wait briefly and try next model
      if (status === 429) {
        console.warn(`OpenRouter: Rate limited on ${model} (${status}). Trying next model...`);
        lastError = new Error(`Rate limited: ${errMsg}`);
        await sleep(1000);
        continue;
      }

      // 402 = no credits
      if (status === 402) {
        console.error(`OpenRouter: No credits remaining. Add credits at openrouter.ai`);
        throw new Error(`OpenRouter: No credits remaining (402). Add credits at https://openrouter.ai`);
      }

      // Model not available — try next
      if (status === 404 || status === 400) {
        console.warn(`OpenRouter: Model ${model} unavailable (${status}): ${errMsg}. Trying next...`);
        lastError = new Error(`Model ${model} failed: ${errMsg}`);
        continue;
      }

      // Auth error — throw immediately (won't help retrying)
      if (status === 401 || status === 403) {
        throw new Error(`OpenRouter: Authentication failed (${status}). Check your API key in .env: ${errMsg}`);
      }

      // Other error — try next model
      console.warn(`OpenRouter: ${model} failed (${status}): ${errMsg}`);
      lastError = new Error(`${model} error (${status}): ${errMsg}`);
      continue;

    } catch (error) {
      if (error.message.includes('Authentication failed') || error.message.includes('No credits')) {
        throw error; // Don't retry on auth/credit errors
      }
      lastError = error;
      console.warn(`OpenRouter: Error with ${model}: ${error.message}`);
    }
  }

  console.error('OpenRouter: All models exhausted.');
  throw lastError || new Error('OpenRouter: All models failed');
};
