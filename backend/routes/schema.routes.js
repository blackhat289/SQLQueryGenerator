const express = require('express');
const { uploadSchema, getSchemaStatus } = require('../controllers/schema.controller');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Apply auth protection middleware
router.use(protect);

router.post('/upload', uploadSchema);
router.get('/status', getSchemaStatus);

module.exports = router;
