const SchemaCatalog = require('../models/Schema');
const geminiService = require('../services/ai/gemini.service');

// Regex utility to scan CREATE TABLE SQL syntaxes and extract table keys and column arrays
const parseTablesFromDdl = (ddlText) => {
  const tables = {};
  
  // 1. Remove comments
  let cleaned = ddlText;
  cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, ' ');
  cleaned = cleaned.split('\n').map(line => {
    const idxDoubleDash = line.indexOf('--');
    let cl = line;
    if (idxDoubleDash !== -1) {
      cl = cl.substring(0, idxDoubleDash);
    }
    const idxHash = cl.indexOf('#');
    if (idxHash !== -1) {
      cl = cl.substring(0, idxHash);
    }
    return cl;
  }).join('\n');

  // Replace all whitespace with single spaces to make matching easier
  cleaned = cleaned.replace(/\s+/g, ' ');

  // 2. Sequentially find all "CREATE TABLE" statements
  const createTableRegex = /CREATE\s+TABLE\s+/gi;
  let match;
  
  while ((match = createTableRegex.exec(cleaned)) !== null) {
    const startIndex = match.index;
    
    // Grab a substring starting from "CREATE TABLE" to parse table name and body
    const sub = cleaned.substring(startIndex);
    
    // Parse table name
    const nameMatch = sub.match(/^CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:[`"'\w]+\.)?[`"']?([\w-]+)[`"']?/i);
    if (!nameMatch) continue;
    const tableName = nameMatch[1];
    
    // Find the opening parenthesis of the body
    const openParenIdx = sub.indexOf('(');
    if (openParenIdx === -1) continue;
    
    // Find matching closing parenthesis
    let bracketCount = 1;
    let closeParenIdx = -1;
    for (let i = openParenIdx + 1; i < sub.length; i++) {
      if (sub[i] === '(') {
        bracketCount++;
      } else if (sub[i] === ')') {
        bracketCount--;
        if (bracketCount === 0) {
          closeParenIdx = i;
          break;
        }
      }
    }
    
    if (closeParenIdx === -1) continue;
    
    const innerContent = sub.substring(openParenIdx + 1, closeParenIdx).trim();
    
    // Split columns by comma, ignoring nested commas inside parentheses
    const parts = [];
    let currentPart = '';
    let parenDepth = 0;
    for (let i = 0; i < innerContent.length; i++) {
      const char = innerContent[i];
      if (char === '(') {
        parenDepth++;
        currentPart += char;
      } else if (char === ')') {
        parenDepth--;
        currentPart += char;
      } else if (char === ',' && parenDepth === 0) {
        parts.push(currentPart.trim());
        currentPart = '';
      } else {
        currentPart += char;
      }
    }
    if (currentPart.trim()) {
      parts.push(currentPart.trim());
    }
    
    const columns = [];
    const constraintKeywords = ['PRIMARY', 'FOREIGN', 'KEY', 'CONSTRAINT', 'UNIQUE', 'INDEX', 'CHECK'];
    
    for (const part of parts) {
      if (!part) continue;
      const tokens = part.trim().split(/\s+/);
      const firstToken = tokens[0].toUpperCase();
      
      if (constraintKeywords.includes(firstToken)) {
        continue;
      }
      
      const columnName = tokens[0].replace(/[`"'\s\[\]]/g, '');
      if (columnName && !columnName.includes('(')) {
        columns.push(columnName);
      }
    }
    
    if (tableName && columns.length > 0) {
      tables[tableName] = columns;
    }
    
    // Move regex index forward to avoid infinite loops and find other tables
    createTableRegex.lastIndex = startIndex + closeParenIdx + 1;
  }
  
  return Object.keys(tables).length > 0 ? tables : null;
};

// Use Gemini to infer schema metadata, relationships, and descriptions
const inferSchemaMetadata = async (schemaTables, rawSql = '') => {
  try {
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key') {
      return { descriptions: {}, relationships: [] };
    }

    const schemaStr = JSON.stringify(schemaTables, null, 2);
    const prompt = `Below is a database schema:
${schemaStr}

Raw SQL source (if available):
${rawSql}

Analyze this schema to:
1. Generate a brief 1-sentence description for each table.
2. Infer primary/foreign key connections and relationships between tables.

Output ONLY a JSON payload with this structure:
{
  "descriptions": {
    "tableName1": "description here",
    "tableName2": "description here"
  },
  "relationships": [
    { "fromTable": "orders", "fromColumn": "user_id", "toTable": "users", "toColumn": "id" }
  ]
}`;

    const systemInstruction = 'You are a database structure analyzer. You only output valid JSON with keys "descriptions" and "relationships". Do not write markdown blocks or text wrapper outside the JSON.';
    const responseText = await geminiService.generateText(prompt, systemInstruction);
    const cleaned = responseText.replace(/```json/gi, '').replace(/```/gi, '').trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error('Error inferring schema metadata:', error.message);
    return { descriptions: {}, relationships: [] };
  }
};

// @desc    Register a new schema structure
// @route   POST /api/schema/upload
// @access  Private
exports.uploadSchema = async (req, res, next) => {
  try {
    let text = '';
    let filename = 'pasted_text.sql';
    let parsedTables = null;
    let relationships = [];
    let descriptions = {};

    // 1. Support direct JSON schema payloads (from frontend CSV/XLSX processing)
    if (req.body.tables && typeof req.body.tables === 'object') {
      parsedTables = req.body.tables;
      relationships = req.body.relationships || [];
      descriptions = req.body.descriptions || {};
      filename = req.body.filename || 'uploaded_spreadsheet.json';
      text = JSON.stringify(parsedTables, null, 2);
    } else {
      // 2. Standard DDL Text/File upload
      if (req.files && req.files.file) {
        const file = req.files.file;
        filename = file.name;
        text = file.data.toString('utf8');
      } else if (req.body.schema_text) {
        text = req.body.schema_text;
        filename = 'pasted_text.sql';
      } else {
        return res.status(400).json({
          success: false,
          message: 'Provide schema script, upload a file, or send structured JSON.',
        });
      }

      // Check if uploaded script is structured JSON metadata
      try {
        const parsedJson = JSON.parse(text);
        if (parsedJson && parsedJson.tables) {
          parsedTables = parsedJson.tables;
          relationships = parsedJson.relationships || [];
          descriptions = parsedJson.descriptions || {};
        }
      } catch (jsonErr) {
        // Not JSON, parse DDL
        parsedTables = parseTablesFromDdl(text);
      }
    }

    if (!parsedTables) {
      return res.status(400).json({
        success: false,
        message: 'Could not detect database table definitions in input schema.',
      });
    }

    // Skip AI schema inference to conserve Gemini API quota.
    // The table/column structure is sufficient for query generation.
    relationships = [];
    descriptions = {};

    let schema = await SchemaCatalog.findOne({ user: req.user.id });
    if (schema) {
      schema.filename = filename;
      schema.tables = parsedTables;
      schema.relationships = relationships;
      schema.descriptions = descriptions;
      schema.rawSql = text;
      // Invalidate existing embeddings cache
      schema.embeddings = {};
      await schema.save();
    } else {
      schema = await SchemaCatalog.create({
        user: req.user.id,
        filename,
        tables: parsedTables,
        relationships,
        descriptions,
        rawSql: text,
      });
    }

    res.status(200).json({
      success: true,
      message: `Successfully parsed database schema catalog from '${filename}'.`,
      tables_found: Object.keys(parsedTables),
      relationships_found: relationships.length,
      details: parsedTables,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Retrieve status and structure of registered schemas
// @route   GET /api/schema/status
// @access  Private
exports.getSchemaStatus = async (req, res, next) => {
  try {
    let schema = await SchemaCatalog.findOne({ user: req.user.id });
    if (!schema) {
      schema = await SchemaCatalog.create({ user: req.user.id });
    }

    res.status(200).json({
      success: true,
      rag_status: schema.filename ? 'Loaded' : 'Pending',
      filename: schema.filename,
      tables_count: schema.tables ? Object.keys(schema.tables).length : 0,
      tables: schema.tables,
      relationships: schema.relationships || [],
      descriptions: schema.descriptions || {},
      raw_sql: schema.rawSql,
    });
  } catch (error) {
    next(error);
  }
};
