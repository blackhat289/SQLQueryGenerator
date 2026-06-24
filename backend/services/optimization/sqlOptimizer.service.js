/**
 * SQL Optimizer service — rule-based analysis (no LLM call to conserve API quota).
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

    if (sqlUpper.includes('JOIN') && !sqlUpper.includes(' ON ')) {
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

    // --- RULE-BASED COMPLEXITY ---
    const joins = (sqlUpper.match(/JOIN/g) || []).length;
    const groupBys = (sqlUpper.match(/GROUP BY/g) || []).length;
    const subqueries = Math.max(0, (sqlUpper.match(/SELECT/g) || []).length - 1);

    let complexity = 'Easy';
    if (joins > 2 || groupBys > 1 || subqueries > 1) {
      complexity = 'Hard';
    } else if (joins > 0 || groupBys > 0 || subqueries > 0) {
      complexity = 'Medium';
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
