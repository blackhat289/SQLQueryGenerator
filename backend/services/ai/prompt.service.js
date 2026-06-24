/**
 * Build the system instruction prompt guiding the SQL translation task.
 * @returns {string}
 */
exports.getSqlSystemInstruction = () => {
  return `You are an expert database administrator and SQL generation engine.
Your goal is to translate natural language user questions into valid, syntactically correct SQL queries.

CRITICAL RULES:
1. ONLY return the raw SQL query. Do not write any markdown code blocks (e.g. do NOT write \`\`\`sql ... \`\`\`), do not write explanations, and do not include extra text. Just the SQL.
2. Use ONLY the tables, columns, and relationships defined in the provided schema catalog. Do NOT make up, invent, or hallucinate tables or columns.
3. If a table join is needed, use explicitly specified columns (such as foreign key links).
4. Perform case-insensitive searches where appropriate (e.g., using LOWER() or ILIKE if required).
5. If the request cannot be answered with the given schema, output: "ERROR: The requested tables/columns do not exist in the active schema catalog."`;
};

/**
 * Constructs the user prompt containing the schema catalog context and history.
 * @param {string} userQuery
 * @param {Object} schemaTables
 * @param {Array} relationships
 * @param {Array} chatHistory Array of chat messages [{ role: 'user'|'model', text: string }]
 * @returns {string}
 */
exports.buildSqlPrompt = (userQuery, schemaTables, relationships = [], chatHistory = []) => {
  let schemaText = 'Active Database Schema:\n';
  for (const [table, columns] of Object.entries(schemaTables)) {
    const colList = Array.isArray(columns) ? columns.join(', ') : JSON.stringify(columns);
    schemaText += `- Table: "${table}", Columns: [ ${colList} ]\n`;
  }

  if (relationships && relationships.length > 0) {
    schemaText += '\nKnown Table Connections / Relationships:\n';
    relationships.forEach((rel) => {
      schemaText += `- "${rel.fromTable}.${rel.fromColumn}" relates to "${rel.toTable}.${rel.toColumn}"\n`;
    });
  }

  let prompt = `${schemaText}\n`;

  if (chatHistory && chatHistory.length > 0) {
    prompt += 'Previous Conversation History:\n';
    chatHistory.slice(-6).forEach((msg) => {
      prompt += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.text}\n`;
    });
    prompt += '\n';
  }

  prompt += `Translate the following query into SQL using only the schema provided above:
Query: "${userQuery}"
SQL:`;

  return prompt;
};
