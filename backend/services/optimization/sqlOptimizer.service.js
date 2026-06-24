const geminiService = require('../ai/gemini.service');

/**
 * Analyzes SQL queries for inefficiencies and generates optimization insights and complexity.
 * @param {string} sql 
 * @param {Object} schemaTables 
 * @returns {Promise<{ score: number, rating: string, suggestions: string[], complexity: string }>}
 */
exports.analyzeAndOptimize = async (sql, schemaTables) => {
  try {
    const sqlUpper = sql.toUpperCase();
    const suggestions = [];
    let score = 100;

    // --- HEURISTIC CHECKS ---
    if (sqlUpper.includes('SELECT *')) {
      score -= 15;
      suggestions.push('Avoid using SELECT *. Explicitly list only the columns you need to optimize database read performance and network transport.');
    }

    if (sqlUpper.includes('JOIN') && !sqlUpper.includes('ON')) {
      score -= 20;
      suggestions.push('Detected potential Cartesian product (cross join) without ON join keys. Always specify key equality mappings.');
    }

    if (sqlUpper.includes("LIKE '%")) {
      score -= 10;
      suggestions.push('Leading wildcards (e.g., LIKE \'%term\') prevent databases from utilizing standard indices, resulting in slow table scans.');
    }

    if (sqlUpper.includes('IN (SELECT')) {
      score -= 10;
      suggestions.push('Subqueries with IN clauses can lead to poor execution paths. Consider refactoring with INNER JOIN or EXISTS.');
    }

    // --- AI-DRIVEN METRIC ANALYSIS ---
    const schemaText = JSON.stringify(schemaTables);
    const systemInstruction = `You are a database tuning advisor. Analyze the user's SQL query based on the database schema.
Suggest concrete improvements (e.g. indexing columns, refactoring nested queries) and estimate its complexity (Easy, Medium, Hard).
Output ONLY a JSON payload matching this structure:
{
  "complexity": "Easy" | "Medium" | "Hard",
  "suggestions": ["suggestion 1", "suggestion 2"],
  "rating": "Excellent" | "Good" | "Needs Attention"
}`;

    const prompt = `Schema: ${schemaText}\nQuery: ${sql}`;
    const responseText = await geminiService.generateText(prompt, systemInstruction);

    let complexity = 'Easy';
    let aiRating = 'Excellent';

    try {
      const cleaned = responseText.replace(/```json/gi, '').replace(/```/gi, '').trim();
      const parsed = JSON.parse(cleaned);
      
      if (parsed.suggestions && Array.isArray(parsed.suggestions)) {
        parsed.suggestions.forEach((s) => {
          if (!suggestions.includes(s) && suggestions.length < 5) {
            suggestions.push(s);
          }
        });
      }
      
      complexity = parsed.complexity || 'Easy';
      aiRating = parsed.rating || 'Excellent';
    } catch (e) {
      // Fallback complexity score if parsing failed
      const joins = (sqlUpper.match(/JOIN/g) || []).length;
      const groupBys = (sqlUpper.match(/GROUP BY/g) || []).length;
      complexity = (joins > 1 || groupBys > 1) ? 'Hard' : (joins > 0 || groupBys > 0) ? 'Medium' : 'Easy';
    }

    if (suggestions.length === 0) {
      suggestions.push('Excellent SQL structure. Satisfies typical relational optimization practices.');
    }

    let finalRating = 'Excellent';
    if (score < 70) {
      finalRating = 'Needs Attention';
    } else if (score < 90) {
      finalRating = 'Good';
    }

    return {
      score: Math.max(40, score),
      rating: finalRating,
      suggestions,
      complexity,
    };
  } catch (error) {
    console.error('SQL Optimizer Error:', error);
    return {
      score: 90,
      rating: 'Good',
      suggestions: ['Check indexes on join keys for optimal performance.'],
      complexity: 'Easy',
    };
  }
};
