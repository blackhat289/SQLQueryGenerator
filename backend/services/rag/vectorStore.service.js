/**
 * Calculates the cosine similarity between two vectors.
 * @param {number[]} vecA 
 * @param {number[]} vecB 
 * @returns {number} Cosine similarity score (-1 to 1)
 */
const cosineSimilarity = (vecA, vecB) => {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

/**
 * Searches the schema's cached embeddings to find the most relevant tables for a user query.
 * @param {number[]} queryEmbedding 
 * @param {Object} schemaEmbeddingsMap Map of tableName -> embedding vector
 * @param {number} topK Number of results to return
 * @returns {string[]} List of relevant table names
 */
exports.searchRelevantTables = (queryEmbedding, schemaEmbeddingsMap, topK = 2) => {
  if (!schemaEmbeddingsMap || Object.keys(schemaEmbeddingsMap).length === 0) {
    return [];
  }

  const scores = [];
  for (const [tableName, tableEmbedding] of Object.entries(schemaEmbeddingsMap)) {
    const score = cosineSimilarity(queryEmbedding, tableEmbedding);
    scores.push({ tableName, score });
  }

  // Sort descending by score
  scores.sort((a, b) => b.score - a.score);

  // Return the topK table names
  return scores.slice(0, topK).map(item => item.tableName);
};
