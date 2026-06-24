const Query = require('../models/Query');
const SchemaCatalog = require('../models/Schema');
const geminiService = require('../services/ai/gemini.service');
const promptService = require('../services/ai/prompt.service');
const explanationService = require('../services/ai/explanation.service');
const retrievalService = require('../services/rag/retrieval.service');
const sqlValidatorService = require('../services/validation/sqlValidator.service');
const sqlOptimizerService = require('../services/optimization/sqlOptimizer.service');

// Utility to extract column keys and construct a basic SQL string based on NLP queries
const generateSqlFromPrompt = (prompt, schemaTables) => {
  const promptLower = prompt.toLowerCase();
  const tables = Object.keys(schemaTables);

  // Detect which tables are mentioned in the text
  let mentionedTables = tables.filter((t) => promptLower.includes(t.toLowerCase()));
  if (mentionedTables.length === 0) {
    mentionedTables = [tables[0] || 'users']; // fallback
  }

  const primaryTable = mentionedTables[0];
  const columns = schemaTables[primaryTable] || ['*'];

  let sql = '';

  // Specific multi-table scenarios
  if (mentionedTables.length > 1) {
    if (mentionedTables.includes('users') && mentionedTables.includes('orders')) {
      sql = `SELECT u.name, o.total_amount, o.status\nFROM users u\nJOIN orders o ON u.id = o.user_id`;
      if (promptLower.includes('active') || promptLower.includes('complete')) {
        sql += `\nWHERE o.status = 'completed'`;
      }
      sql += `\nORDER BY o.total_amount DESC;`;
      return sql;
    } else if (mentionedTables.includes('orders') && mentionedTables.includes('order_items')) {
      sql = `SELECT o.id AS order_id, SUM(oi.quantity * oi.price) AS calculated_total\nFROM orders o\nJOIN order_items oi ON o.id = oi.order_id\nGROUP BY o.id;`;
      return sql;
    }
  }

  // Aggregate operations checks
  if (promptLower.includes('count') || promptLower.includes('how many')) {
    sql = `SELECT COUNT(*) AS total_count\nFROM ${primaryTable}`;
  } else if (promptLower.includes('average') || promptLower.includes('avg')) {
    const valCol = columns.includes('price')
      ? 'price'
      : columns.includes('total_amount')
      ? 'total_amount'
      : columns[0];
    sql = `SELECT AVG(${valCol}) AS average_value\nFROM ${primaryTable}`;
  } else if (promptLower.includes('sum') || promptLower.includes('total')) {
    const valCol = columns.includes('total_amount')
      ? 'total_amount'
      : columns.includes('price')
      ? 'price'
      : columns[0];
    sql = `SELECT SUM(${valCol}) AS total_sum\nFROM ${primaryTable}`;
  } else {
    // Standard projection (up to first 3 columns)
    const cols = columns.slice(0, 3).join(', ');
    sql = `SELECT ${cols}\nFROM ${primaryTable}`;
  }

  // Filter clauses
  if (promptLower.includes('active') && columns.includes('status')) {
    sql += `\nWHERE status = 'active'`;
  } else if (promptLower.includes('electronics') && columns.includes('category')) {
    sql += `\nWHERE category = 'electronics'`;
  } else if (promptLower.includes('more than') || promptLower.includes('greater than')) {
    const nums = promptLower.match(/\d+/g);
    const num = nums ? nums[0] : '100';
    const valCol = columns.includes('price')
      ? 'price'
      : columns.includes('total_amount')
      ? 'total_amount'
      : 'amount';
    sql += `\nWHERE ${valCol} > ${num}`;
  }

  // Sorting overrides
  if (promptLower.includes('recent') || promptLower.includes('latest')) {
    const dateCol = columns.includes('created_at') ? 'created_at' : 'id';
    sql += `\nORDER BY ${dateCol} DESC`;
  } else if (promptLower.includes('highest') || promptLower.includes('most expensive')) {
    const valCol = columns.includes('price')
      ? 'price'
      : columns.includes('total_amount')
      ? 'total_amount'
      : 'id';
    sql += `\nORDER BY ${valCol} DESC`;
  }

  // Limits
  if (promptLower.includes('top') || promptLower.includes('limit')) {
    const nums = promptLower.match(/\d+/g);
    const limitNum = nums ? nums[0] : '5';
    sql += `\nLIMIT ${limitNum}`;
  }

  sql += ';';
  return sql;
};

// Complexity analysis evaluator
const estimateComplexity = (sql) => {
  const sqlUpper = sql.toUpperCase();
  const joins = (sqlUpper.match(/JOIN/g) || []).length;
  const groupBys = (sqlUpper.match(/GROUP BY/g) || []).length;
  const subqueries = Math.max(0, (sqlUpper.match(/SELECT/g) || []).length - 1);

  let score = 0;
  const reasons = [];

  if (joins > 0) {
    score += joins * 2;
    reasons.push(`Includes ${joins} table JOIN(s)`);
  }
  if (groupBys > 0) {
    score += 2;
    reasons.push('Aggregates values via GROUP BY');
  }
  if (subqueries > 0) {
    score += subqueries * 3;
    reasons.push(`Contains ${subqueries} nested subqueries`);
  }
  if (sqlUpper.includes('HAVING')) {
    score += 2;
    reasons.push('Filters aggregated rows using HAVING clause');
  }

  let level = 'Easy';
  if (score >= 6) {
    level = 'Hard';
  } else if (score >= 3) {
    level = 'Medium';
  }

  return {
    level,
    details: {
      joins_count: joins,
      has_group_by: groupBys > 0,
      subqueries_count: subqueries,
      indicators: reasons.length > 0 ? reasons : ['Direct projection query targeting filter parameters'],
    },
  };
};

// SQL Optimizer feedback generator
const analyzeOptimization = (sql, schemaTables) => {
  const sqlUpper = sql.toUpperCase();
  let score = 100;
  const suggestions = [];

  if (sqlUpper.includes('SELECT *')) {
    score -= 15;
    suggestions.push('Avoid projecting all fields with SELECT *. Explicitly declare columns to minimize IO workload.');
  }

  if (sqlUpper.includes('JOIN') && !sqlUpper.includes('ON')) {
    score -= 20;
    suggestions.push('Explicit JOIN calls without matching ON conditions trigger slow Cartesian calculations. Add JOIN keys.');
  }

  if (sqlUpper.includes("LIKE '%")) {
    score -= 10;
    suggestions.push('Leading wildcard text searches (e.g. LIKE \'%text\') disable database index scans. Consider Full-Text indexing.');
  }

  if (sqlUpper.includes('IN (SELECT')) {
    score -= 10;
    suggestions.push('Nested IN subqueries are slow on some database engines. Optimize via INNER JOIN or EXISTS constraints.');
  }

  if (suggestions.length === 0) {
    suggestions.push('Excellent SQL structure. Satisfies typical relational optimization practices.');
  }

  return {
    score: Math.max(50, score),
    suggestions,
  };
};

// Step by step query evaluation path builder
const explainQueryMechanics = (sql, schemaTables = {}) => {
  const sqlUpper = sql.toUpperCase();
  const steps = [];
  let stepNum = 1;
  const tables = Object.keys(schemaTables);

  const matchedTables = tables.filter((t) => sqlUpper.includes(t.toUpperCase()));

  if (sqlUpper.includes('FROM')) {
    steps.push({
      step: `Step ${stepNum}`,
      action: 'Data Source Selection',
      description: `Targeting base tables: ${matchedTables.join(', ') || 'specified entities'}.`,
    });
    stepNum++;
  }

  if (sqlUpper.includes('JOIN')) {
    steps.push({
      step: `Step ${stepNum}`,
      action: 'Row Merging Operations',
      description: 'Aligning and combining columns from matching keys across tables.',
    });
    stepNum++;
  }

  if (sqlUpper.includes('WHERE')) {
    steps.push({
      step: `Step ${stepNum}`,
      action: 'Filtering Records',
      description: 'Applying Boolean conditional filters (WHERE clause) to refine matched rows.',
    });
    stepNum++;
  }

  if (sqlUpper.includes('GROUP BY')) {
    steps.push({
      step: `Step ${stepNum}`,
      action: 'Aggregation & Binning',
      description: 'Grouping dataset outputs by specified classification parameters and computing sums or counts.',
    });
    stepNum++;
  }

  if (sqlUpper.includes('SELECT')) {
    steps.push({
      step: `Step ${stepNum}`,
      action: 'Column Projection',
      description: 'Formatting final response reports by selecting requested values and labels.',
    });
    stepNum++;
  }

  if (sqlUpper.includes('ORDER BY')) {
    steps.push({
      step: `Step ${stepNum}`,
      action: 'Sorting Result Set',
      description: 'Sorting response fields in ascending or descending sequence.',
    });
    stepNum++;
  }

  return steps;
};

// @desc    Generate SQL query from Natural Language Prompt
// @route   POST /api/query/generate
// @access  Private
exports.generateSql = async (req, res, next) => {
  try {
    const { prompt, chatHistory = [] } = req.body;

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid query prompt description.',
      });
    }

    // Load active user schema or fall back to default
    let schema = await SchemaCatalog.findOne({ user: req.user.id });
    if (!schema) {
      // Create a default schema catalog for the user
      schema = await SchemaCatalog.create({ user: req.user.id });
    }

    // 1. RAG Schema Retrieval
    const { relevantTables, logStatus } = await retrievalService.retrieveRelevantSchema(prompt, req.user.id);

    let sql = '';
    let usedAi = false;

    // 2. LLM-Based Text-to-SQL Generation using Gemini
    if (process.env.GEMINI_API_KEY && process.env.ENABLE_AI_SQL_GENERATION !== 'false') {
      try {
        const systemInstruction = promptService.getSqlSystemInstruction();
        const userPrompt = promptService.buildSqlPrompt(prompt, relevantTables, schema.relationships, chatHistory);
        
        let aiGeneratedSql = await geminiService.generateText(userPrompt, systemInstruction);
        // Clean markdown code blocks from the generated response
        aiGeneratedSql = aiGeneratedSql.replace(/```sql/gi, '').replace(/```/gi, '').trim();

        if (aiGeneratedSql && !aiGeneratedSql.startsWith('ERROR:')) {
          sql = aiGeneratedSql;
          usedAi = true;
        }
      } catch (aiError) {
        console.error('Gemini query generation failed, falling back to rule-based parser:', aiError.message);
      }
    }

    // Fallback to rule-based query parser if AI is offline or key is missing
    if (!sql) {
      sql = generateSqlFromPrompt(prompt, schema.tables);
    }

    // 3. Query Validation Engine
    const validation = await sqlValidatorService.validateSql(sql, schema.tables);

    // 4. AI SQL Optimization Assistant
    let optimization;
    if (process.env.ENABLE_QUERY_OPTIMIZATION !== 'false') {
      optimization = await sqlOptimizerService.analyzeAndOptimize(sql, schema.tables);
    } else {
      optimization = {
        score: 95,
        rating: 'Good',
        suggestions: ['Check primary keys index coverage.'],
        complexity: 'Easy'
      };
    }

    // 5. AI Query Explanation
    let explanationText = '';
    if (usedAi && process.env.GEMINI_API_KEY && process.env.ENABLE_QUERY_EXPLANATION !== 'false') {
      explanationText = await explanationService.explainSqlQuery(sql, schema.tables);
    } else {
      const stepMechanics = explainQueryMechanics(sql, schema.tables);
      explanationText = stepMechanics.map((s) => s.description).join(' ');
    }

    const explanation = [
      {
        step: 'Execution Plan',
        action: 'AI Query Explanation',
        description: explanationText,
      },
    ];

    const tablesUsed = Object.keys(schema.tables).filter((t) =>
      sql.toUpperCase().includes(t.toUpperCase())
    );

    // Save record to DB history
    const queryLog = await Query.create({
      user: req.user.id,
      nlQuery: prompt,
      sqlQuery: sql,
      explanation: explanationText,
      complexity: optimization.complexity,
      optimizationScore: optimization.score,
      tablesUsed: tablesUsed.length > 0 ? tablesUsed : ['general'],
    });

    res.status(200).json({
      id: queryLog._id,
      sql,
      complexity: {
        level: optimization.complexity,
        details: {
          indicators: optimization.suggestions,
        },
      },
      optimization: {
        score: optimization.score,
        suggestions: optimization.suggestions,
        rating: optimization.rating,
      },
      explanation,
      validation: {
        isValid: validation.isValid,
        errorReason: validation.errorReason,
      },
      rag_status: `${logStatus} ${usedAi ? '(Powered by Gemini AI)' : '(Rule-Based Fallback)'}`,
      tables_used: tablesUsed.length > 0 ? tablesUsed : ['general'],
      isSaved: queryLog.isSaved,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Explain any manual SQL Query input
// @route   POST /api/query/explain
// @access  Private
exports.explainSql = async (req, res, next) => {
  try {
    const { sql } = req.body;

    if (!sql || !sql.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Provide SQL query syntax.',
      });
    }

    const schema = await SchemaCatalog.findOne({ user: req.user.id }) || { tables: {} };
    const explanation = explainQueryMechanics(sql, schema.tables);
    const complexity = estimateComplexity(sql);

    res.status(200).json({
      success: true,
      explanation,
      complexity,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Analyze & Optimize SQL Query
// @route   POST /api/query/optimize
// @access  Private
exports.optimizeSql = async (req, res, next) => {
  try {
    const { sql } = req.body;

    if (!sql || !sql.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Provide SQL query syntax.',
      });
    }

    const schema = await SchemaCatalog.findOne({ user: req.user.id }) || { tables: {} };
    const optimization = analyzeOptimization(sql, schema.tables);

    // Minor rewrite helper
    let optimizedSql = sql;
    if (sql.toUpperCase().includes('SELECT *')) {
      const matchedTables = Object.keys(schema.tables).filter((t) =>
        sql.toUpperCase().includes(t.toUpperCase())
      );
      if (matchedTables.length > 0) {
        const columns = schema.tables[matchedTables[0]] || [];
        if (columns.length > 0) {
          optimizedSql = sql.replace(/SELECT\s+\*/gi, `SELECT ${columns.slice(0, 4).join(', ')}`);
        }
      }
    }

    res.status(200).json({
      success: true,
      original_sql: sql,
      optimized_sql: optimizedSql,
      optimization_score: optimization.score,
      suggestions: optimization.suggestions,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Fetch query search history
// @route   GET /api/query/history
// @access  Private
exports.getHistory = async (req, res, next) => {
  try {
    const history = await Query.find({ user: req.user.id }).sort({ createdAt: -1 });
    
    // Map items to match frontend props structure
    const formattedHistory = history.map((h) => ({
      id: h._id,
      timestamp: h.createdAt.toISOString(),
      nl_query: h.nlQuery,
      sql_query: h.sqlQuery,
      explanation: h.explanation,
      complexity: h.complexity,
      optimization_score: h.optimizationScore,
      tables_used: h.tablesUsed,
      isSaved: h.isSaved,
    }));

    res.status(200).json(formattedHistory);
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle Save on a history item
// @route   PUT /api/query/history/:id/save
// @access  Private
exports.toggleSaveQuery = async (req, res, next) => {
  try {
    const query = await Query.findOne({ _id: req.params.id, user: req.user.id });

    if (!query) {
      return res.status(404).json({
        success: false,
        message: 'Query log entry not found.',
      });
    }

    query.isSaved = !query.isSaved;
    await query.save();

    res.status(200).json({
      success: true,
      isSaved: query.isSaved,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove an item from history logs
// @route   DELETE /api/query/history/:id
// @access  Private
exports.deleteQuery = async (req, res, next) => {
  try {
    const query = await Query.findOneAndDelete({ _id: req.params.id, user: req.user.id });

    if (!query) {
      return res.status(404).json({
        success: false,
        message: 'Query record not found.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Successfully removed item from history.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Clear entire user history logs
// @route   DELETE /api/query/history
// @access  Private
exports.clearHistory = async (req, res, next) => {
  try {
    await Query.deleteMany({ user: req.user.id });

    res.status(200).json({
      success: true,
      message: 'Successfully cleared query search history logs.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Fetch analytics metrics
// @route   GET /api/query/analytics
// @access  Private
exports.getAnalytics = async (req, res, next) => {
  try {
    const queries = await Query.find({ user: req.user.id });
    
    const total = queries.length;
    const executed = queries.filter(q => q.optimizationScore > 60).length; // mock executed ratio
    
    // Average optimization score
    const avgOptScore = total > 0 
      ? Math.round(queries.reduce((acc, curr) => acc + curr.optimizationScore, 0) / total)
      : 92;

    // Calculate level counts
    const levelCounts = { Easy: 0, Medium: 0, Hard: 0 };
    queries.forEach((q) => {
      if (levelCounts[q.complexity] !== undefined) {
        levelCounts[q.complexity]++;
      }
    });

    // Chart: usage trends (last 7 days)
    const usageTrend = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      // Count queries matching date
      const count = queries.filter((q) => {
        const qDate = new Date(q.createdAt);
        return qDate.toDateString() === date.toDateString();
      }).length;

      usageTrend.push({ date: dateString, queries: count || (i === 1 ? 2 : i === 3 ? 4 : i === 6 ? 1 : 0) }); // add mockup fallbacks if empty
    }

    // Chart: table usage distribution
    const tableCounts = {};
    queries.forEach((q) => {
      q.tablesUsed.forEach((t) => {
        tableCounts[t] = (tableCounts[t] || 0) + 1;
      });
    });

    // Mock tables if empty
    if (Object.keys(tableCounts).length === 0) {
      tableCounts['users'] = 4;
      tableCounts['orders'] = 3;
      tableCounts['products'] = 1;
    }

    const tableUsage = Object.entries(tableCounts).map(([name, value]) => ({
      name,
      value,
    }));

    res.status(200).json({
      success: true,
      data: {
        widgets: {
          totalQueries: total || 18,
          executedQueries: executed || 16,
          successRate: total > 0 ? Math.round((executed / total) * 100) : 98,
          avgResponseTimeMs: 235,
        },
        usageTrend,
        tableUsage,
        complexityDistribution: [
          { name: 'Easy', value: levelCounts.Easy || 12 },
          { name: 'Medium', value: levelCounts.Medium || 4 },
          { name: 'Hard', value: levelCounts.Hard || 2 },
        ],
      },
    });
  } catch (error) {
    next(error);
  }
};
