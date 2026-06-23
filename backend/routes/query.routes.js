const express = require('express');
const {
  generateSql,
  explainSql,
  optimizeSql,
  getHistory,
  toggleSaveQuery,
  deleteQuery,
  clearHistory,
  getAnalytics,
} = require('../controllers/query.controller');
const { protect } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Apply query rate limiter and JWT protector middleware
router.use(protect);
router.use(apiLimiter);

router.post('/generate', generateSql);
router.post('/explain', explainSql);
router.post('/optimize', optimizeSql);
router.get('/analytics', getAnalytics);

// History operations
router.route('/history')
  .get(getHistory)
  .delete(clearHistory);

router.route('/history/:id')
  .delete(deleteQuery);

router.put('/history/:id/save', toggleSaveQuery);

module.exports = router;
