const mongoose = require('mongoose');

const QuerySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  nlQuery: {
    type: String,
    required: [true, 'Please add natural language query text'],
    trim: true,
  },
  sqlQuery: {
    type: String,
    required: [true, 'Please add generated SQL query'],
    trim: true,
  },
  explanation: {
    type: String,
    required: true,
  },
  complexity: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Easy',
  },
  optimizationScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 100,
  },
  tablesUsed: {
    type: [String],
    default: [],
  },
  isSaved: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Query', QuerySchema);
