const express = require('express');
const {
  listProjects,
  createProject,
  getProject,
  getProjectMembers,
  updateProject,
  addMember,
  removeMember,
  deleteProject
} = require('../controllers/projectController');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, listProjects);
router.post('/', protect, adminOnly, createProject);
router.get('/:id/members', protect, getProjectMembers);
router.post('/:id/members', protect, adminOnly, addMember);
router.delete('/:id/members/:userId', protect, adminOnly, removeMember);
router.get('/:id', protect, getProject);
router.patch('/:id', protect, adminOnly, updateProject);
router.delete('/:id', protect, adminOnly, deleteProject);

module.exports = router;
