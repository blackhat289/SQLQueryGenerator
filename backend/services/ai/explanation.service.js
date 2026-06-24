const geminiService = require('./gemini.service');

/**
 * Generates a beginner-friendly, step-by-step explanation of a SQL query.
 * @param {string} sqlQuery 
 * @param {Object} schemaTables 
 * @returns {Promise<string>} Human-readable explanation
 */
exports.explainSqlQuery = async (sqlQuery, schemaTables) => {
  try {
    let schemaContext = 'Schema context:\n';
    if (schemaTables) {
      for (const [table, columns] of Object.entries(schemaTables)) {
        schemaContext += `- Table "${table}" has columns [${columns.join(', ')}]\n`;
      }
    }

    const systemInstruction = `You are a supportive database tutor. Your job is to explain SQL queries in simple, clear, beginner-friendly terms.
Break down what the query does step-by-step:
1. What tables/sources it gets data from.
2. How it filters, joins, aggregates, or groups the records.
3. What columns are returned.
Format the output as a clean, concise paragraph or short bullet points without markdown formatting outside of bolding and code blocks.`;

    const prompt = `${schemaContext}
Explain this SQL query step by step:
\`\`\`sql
${sqlQuery}
\`\`\`

Explanation:`;

    const explanation = await geminiService.generateText(prompt, systemInstruction);
    return explanation || 'Performs columns selection and filter conditions on active tables.';
  } catch (error) {
    console.error('Error generating AI SQL explanation:', error.message);
    return 'Parses target table fields and processes filtering conditions on active catalog rows.';
  }
};
