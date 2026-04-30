const express = require('express');
const { getInsights, getMembers } = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/insights', protect, getInsights);
router.get('/members', protect, getMembers);

module.exports = router;
