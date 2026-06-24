const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Standard text generation helper using Gemini API.
 * @param {string} prompt Complete constructed prompt string
 * @param {string} systemInstruction Optional system instruction/persona constraints
 * @returns {Promise<string>} Generated text response
 */
exports.generateText = async (prompt, systemInstruction = '') => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not defined. Returning mock fallback response.');
      return '';
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Use gemini-2.5-flash for balanced cost, latency, and quality
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: systemInstruction || undefined,
    });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1, // low temperature to reduce hallucination and ensure deterministic SQL
      }
    });

    if (result && result.response && result.response.text) {
      return result.response.text().trim();
    }
    throw new Error('Empty response from Gemini API');
  } catch (error) {
    console.error('Gemini generateText error:', error);
    throw error;
  }
};
