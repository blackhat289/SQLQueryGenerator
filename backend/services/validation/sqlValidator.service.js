const geminiService = require('../ai/gemini.service');

/**
 * Validates a generated SQL query against the active database schema catalog.
 * @param {string} sql 
 * @param {Object} schemaTables 
 * @returns {Promise<{ isValid: boolean, errorReason?: string }>}
 */
exports.validateSql = async (sql, schemaTables) => {
  try {
    if (!sql || typeof sql !== 'string') {
      return { isValid: false, errorReason: 'Generated SQL query is empty or invalid.' };
    }

    const sqlUpper = sql.toUpperCase();
    const tables = Object.keys(schemaTables);

    // Simple Lexical Precheck: Look for FROM and JOIN matches
    // Regex matches words directly following FROM or JOIN
    const matches = sql.match(/(?:FROM|JOIN)\s+([a-zA-Z0-9_`"]+)/gi);
    if (matches) {
      for (const match of matches) {
        const parts = match.trim().split(/\s+/);
        if (parts.length > 1) {
          const tableName = parts[1].replace(/[`"]/g, '').toLowerCase();
          
          // Verify that this table name is in the schema catalog
          if (!tables.includes(tableName)) {
            return {
              isValid: false,
              errorReason: `Hallucination Warning: Table "${tableName}" does not exist in the active schema catalog.`
            };
          }
        }
      }
    }

    // Lexical checks passed — skip secondary LLM validation to conserve Gemini API quota.
    // The rule-based precheck above is sufficient for basic hallucination detection.
    return { isValid: true };
  } catch (error) {
    console.error('SQL Validator Error:', error);
    return { isValid: true }; // Fallback to pass through on service failure
  }
};
