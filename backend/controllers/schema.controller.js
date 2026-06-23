const SchemaCatalog = require('../models/Schema');

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

// @desc    Register a new schema DDL structure
// @route   POST /api/schema/upload
// @access  Private
exports.uploadSchema = async (req, res, next) => {
  try {
    console.log('Schema upload request received:', {
      url: req.originalUrl,
      method: req.method,
      contentType: req.headers['content-type'],
      hasFile: !!(req.files && req.files.file),
      hasText: !!req.body.schema_text,
      userId: req.user ? req.user.id : 'anonymous',
    });

    let text = '';
    let filename = 'pasted_text.sql';

    if (req.files && req.files.file) {
      const file = req.files.file;
      filename = file.name;
      text = file.data.toString('utf8');
    } else if (req.body.schema_text) {
      text = req.body.schema_text;
      filename = 'pasted_text.sql';
    } else {
      console.log('Schema upload missing file/text:', {
        body: req.body,
        files: req.files,
      });
      return res.status(400).json({
        success: false,
        message: 'Provide schema script text or upload a SQL DDL file.',
      });
    }

    const parsedTables = parseTablesFromDdl(text);
    if (!parsedTables) {
      return res.status(400).json({
        success: false,
        message: 'Could not detect standard CREATE TABLE SQL statements in input script.',
      });
    }

    let schema = await SchemaCatalog.findOne({ user: req.user.id });
    if (schema) {
      schema.filename = filename;
      schema.tables = parsedTables;
      schema.rawSql = text;
      await schema.save();
    } else {
      schema = await SchemaCatalog.create({
        user: req.user.id,
        filename,
        tables: parsedTables,
        rawSql: text,
      });
    }

    res.status(200).json({
      success: true,
      message: `Successfully parsed database schema from '${filename}'.`,
      tables_found: Object.keys(parsedTables),
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
      // Lazy load standard template database
      schema = await SchemaCatalog.create({ user: req.user.id });
    }

    res.status(200).json({
      success: true,
      rag_status: schema.filename ? 'Loaded' : 'Pending',
      filename: schema.filename,
      tables_count: schema.tables ? Object.keys(schema.tables).length : 0,
      tables: schema.tables,
      raw_sql: schema.rawSql,
    });
  } catch (error) {
    next(error);
  }
};
