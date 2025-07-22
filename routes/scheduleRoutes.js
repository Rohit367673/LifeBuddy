const express = require('express');
const router = express.Router();
const { generateScheduleForUser } = require('../controllers/scheduleController');
const { authMiddleware } = require('../middlewares/authMiddleware');

// POST /api/schedule - Generate and store a schedule for the user
router.post('/', authMiddleware, generateScheduleForUser);

// GET /api/schedule - Debug route to confirm registration
router.get('/', (req, res) => res.json({ message: 'Schedule route is working!' }));

module.exports = router; 