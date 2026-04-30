const express = require('express');
const {
  listTasks,
  createTask,
  getTask,
  updateTaskStatus,
  updateTask,
  toggleSubtask,
  deleteTask,
  generateAIBreakdown
} = require('../controllers/taskController');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, listTasks);
router.post('/', protect, adminOnly, createTask);
router.post('/ai-breakdown', protect, adminOnly, generateAIBreakdown);
router.get('/:id', protect, getTask);
router.patch('/:id/status', protect, updateTaskStatus);
router.patch('/:id/subtasks/:subtaskId', protect, toggleSubtask);
router.patch('/:id', protect, adminOnly, updateTask);
router.delete('/:id', protect, adminOnly, deleteTask);

module.exports = router;
