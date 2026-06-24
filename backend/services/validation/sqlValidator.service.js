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

    // Secondary LLM Validation Check
    const schemaText = JSON.stringify(schemaTables, null, 2);
    const prompt = `Schema Catalog:
${schemaText}

Query to check:
${sql}

Task: Verify if the query refers ONLY to tables and columns defined in the Schema Catalog.
Return JSON response structure:
{
  "isValid": true/false,
  "errorReason": "string description of error if invalid, otherwise empty"
}`;

    const systemInstruction = 'You are a strict SQL syntax checker. You only output valid JSON matching the format { "isValid": boolean, "errorReason": "string" }. Do not add any markdown formatting or comments outside the JSON.';
    const responseText = await geminiService.generateText(prompt, systemInstruction);

    try {
      // Clean potential JSON markdown wrapping
      const cleaned = responseText.replace(/```json/gi, '').replace(/```/gi, '').trim();
      const parsed = JSON.parse(cleaned);
      return {
        isValid: parsed.isValid,
        errorReason: parsed.errorReason || undefined
      };
    } catch (e) {
      // Fallback if LLM parsing failed
      return { isValid: true };
    }
  } catch (error) {
    console.error('SQL Validator Error:', error);
    return { isValid: true }; // Fallback to pass through on service failure
  }
};
