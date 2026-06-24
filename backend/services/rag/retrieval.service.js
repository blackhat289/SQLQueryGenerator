const embeddingService = require('./embedding.service');
const vectorStoreService = require('./vectorStore.service');
const SchemaCatalog = require('../../models/Schema');

/**
 * Retrieves the most relevant schema context (tables, columns, descriptions) for a natural language prompt.
 * @param {string} prompt The user's query
 * @param {string} userId The current user's ID
 * @returns {Promise<{relevantTables: Object, logStatus: string}>}
 */
exports.retrieveRelevantSchema = async (prompt, userId) => {
  try {
    const schema = await SchemaCatalog.findOne({ user: userId });
    if (!schema || !schema.tables || Object.keys(schema.tables).length === 0) {
      return { relevantTables: {}, logStatus: 'No schema found, using system default.' };
    }

    const tableNames = Object.keys(schema.tables);

    // If RAG is explicitly disabled, bypass embedding search and send full schema catalog
    if (process.env.ENABLE_RAG === 'false') {
      return {
        relevantTables: schema.tables,
        logStatus: 'RAG bypassed: Full schema catalog context loaded.'
      };
    }

    // If there are 3 or fewer tables, RAG is trivial (use all tables to avoid unnecessary embedding latency)
    if (tableNames.length <= 3) {
      return {
        relevantTables: schema.tables,
        logStatus: 'Database is small (< 4 tables); all tables sent for full context.'
      };
    }

    // Ensure embeddings exist in the schema for all tables
    if (!schema.embeddings) {
      schema.embeddings = {};
    }

    let updated = false;
    for (const tableName of tableNames) {
      if (!schema.embeddings.get || !schema.embeddings.get(tableName)) {
        // Construct description for embedding
        const cols = Array.isArray(schema.tables[tableName]) 
          ? schema.tables[tableName].join(', ') 
          : JSON.stringify(schema.tables[tableName]);
        
        const description = `Table: ${tableName}. Columns: ${cols}. Contains information relating to ${tableName}.`;
        const embedding = await embeddingService.generateEmbedding(description);
        
        if (!schema.embeddings.set) {
          schema.embeddings = new Map();
        }
        schema.embeddings.set(tableName, embedding);
        updated = true;
      }
    }

    if (updated) {
      await schema.save();
    }

    // Convert map to plain object for vector store search
    const embeddingsMap = {};
    schema.embeddings.forEach((val, key) => {
      embeddingsMap[key] = val;
    });

    // Generate query embedding
    const queryEmbedding = await embeddingService.generateEmbedding(prompt);

    // Retrieve Top relevant tables based on TOP_K_RETRIEVAL or fallback
    const envTopK = parseInt(process.env.TOP_K_RETRIEVAL, 10);
    const topK = !isNaN(envTopK) ? Math.min(envTopK, tableNames.length) : Math.min(3, Math.ceil(tableNames.length / 2));
    const matchedTableNames = vectorStoreService.searchRelevantTables(queryEmbedding, embeddingsMap, topK);

    // Construct the sliced tables schema containing only matched tables
    const relevantTables = {};
    matchedTableNames.forEach((name) => {
      relevantTables[name] = schema.tables[name];
    });

    return {
      relevantTables,
      logStatus: `RAG: Retrieved ${matchedTableNames.join(', ')} (matched ${topK}/${tableNames.length} tables)`
    };
  } catch (error) {
    console.error('RAG Retrieval Error:', error);
    // Safe fallback to all tables on error
    const schema = await SchemaCatalog.findOne({ user: userId });
    return {
      relevantTables: schema ? schema.tables : {},
      logStatus: 'Fallback applied: full schema loaded due to processing error.'
    };
  }
};
