/**
 * Embedding service — uses Gemini REST API via fetch, with deterministic fallback if unavailable.
 */

/**
 * Simple deterministic hash to produce a pseudo-embedding vector when API is unavailable.
 * This ensures consistent table retrieval even without a working embedding API.
 * @param {string} text
 * @param {number} dimensions
 * @returns {number[]}
 */
const deterministicEmbedding = (text, dimensions = 768) => {
  const vec = new Array(dimensions).fill(0);
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    const idx = (charCode * 31 + i * 7) % dimensions;
    vec[idx] += Math.sin(charCode * 0.1) * 0.5;
  }
  // Normalize the vector
  const magnitude = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0)) || 1;
  return vec.map(v => v / magnitude);
};

/**
 * Generates an embedding vector for a given text query/schema description.
 * @param {string} text 
 * @returns {Promise<number[]>} Array of floats representing the embedding vector
 */
exports.generateEmbedding = async (text) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key') {
      console.warn('GEMINI_API_KEY not defined. Using deterministic fallback embedding.');
      return deterministicEmbedding(text);
    }

    // Try text-embedding-004 via v1beta
    const model = 'text-embedding-004';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent?key=${apiKey}`;

    const body = {
      model: `models/${model}`,
      content: {
        parts: [{ text }],
      },
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      const errMsg = data?.error?.message || JSON.stringify(data);
      console.warn(`Gemini Embedding API unavailable (${response.status}): ${errMsg}. Using deterministic fallback.`);
      return deterministicEmbedding(text);
    }

    const values = data?.embedding?.values;
    if (values && Array.isArray(values)) {
      return values;
    }

    console.warn('Unexpected embedding response structure. Using deterministic fallback.');
    return deterministicEmbedding(text);
  } catch (error) {
    console.error('Error generating embedding:', error.message);
    return deterministicEmbedding(text);
  }
};
