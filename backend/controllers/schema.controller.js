const SchemaCatalog = require('../models/Schema');
const geminiService = require('../services/ai/gemini.service');

// Regex utility to scan CREATE TABLE SQL syntaxes and extract table keys and column arrays
const parseTablesFromDdl = (ddlText) => {
  const tables = {};
  
  // Basic regex to find table blocks e.g. CREATE TABLE users ( ... );
  const tableBlocks = ddlText.match(/CREATE\s+TABLE\s+(\w+)\s*\(([\s\S]*?)\);/gi);
  if (!tableBlocks) return null;

  tableBlocks.forEach((block) => {
    // Extract table name
    const nameMatch = block.match(/CREATE\s+TABLE\s+(\w+)/i);
    if (!nameMatch) return;
    const tableName = nameMatch[1];
    
    // Extract columns
    const bodyMatch = block.match(/\(([\s\S]*?)\);/i);
    if (!bodyMatch) return;
    const body = bodyMatch[1];
    
    const lines = body.split(',');
    const columns = [];
    
    lines.forEach((line) => {
      const trimmed = line.trim();
      const tokens = trimmed.split(/\s+/);
      if (tokens.length > 0 && tokens[0]) {
        const tokenUpper = tokens[0].toUpperCase();
        // Ignore keywords/constraints
        if (!['CONSTRAINT', 'PRIMARY', 'FOREIGN', 'KEY', 'UNIQUE', 'INDEX', 'CHECK'].includes(tokenUpper)) {
          const colName = tokens[0].replace(/[`"']/g, '').trim();
          if (colName && !colName.includes('(')) {
            columns.push(colName);
          }
        }
      }
    });
    
    if (tableName && columns.length > 0) {
      tables[tableName] = columns;
    }
  });

  return Object.keys(tables).length > 0 ? tables : null;
};

// Use Gemini to infer schema metadata, relationships, and descriptions
const inferSchemaMetadata = async (schemaTables, rawSql = '') => {
  try {
    if (!process.env.GEMINI_API_KEY) {
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

    // Call Gemini to enrich schema descriptions and relations if not already provided
    if (relationships.length === 0 && Object.keys(descriptions).length === 0) {
      const metadata = await inferSchemaMetadata(parsedTables, text);
      relationships = metadata.relationships || [];
      descriptions = metadata.descriptions || {};
    }

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
