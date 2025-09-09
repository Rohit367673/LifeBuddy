const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middlewares/authMiddleware');
const scheduleController = require('../controllers/scheduleController');

// POST /api/schedule - Generate new schedule
router.post('/', authenticateUser, scheduleController.generateScheduleForUser);

// GET /api/schedule - Get user's active schedules
router.get('/', authenticateUser, scheduleController.getUserSchedules);

// PUT /api/schedule/:id/complete-day - Mark current day as completed
router.put('/:id/complete-day', authenticateUser, scheduleController.completeScheduleDay);

module.exports = router;
