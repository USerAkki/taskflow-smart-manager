const Task = require('../models/Task');
const Project = require('../models/Project');
const { aiBreakdown } = require('../utils/aiBreakdown');

exports.listTasks = async (req, res) => {
  try {
    const { projectId, status, assignedTo } = req.query;
    const filter = {};
    if (projectId) filter.projectId = projectId;
    if (status) filter.status = status;
    if (assignedTo) filter.assignedTo = assignedTo;

    if (req.user.role !== 'admin') {
      const myProjects = await Project.find({
        $or: [{ createdBy: req.user._id }, { members: req.user._id }]
      }).select('_id');
      filter.projectId = { $in: myProjects.map(project => project._id) };
    }

    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('projectId', 'name')
      .sort({ priorityScore: -1, createdAt: -1 });

    return res.json(tasks);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.createTask = async (req, res) => {
  try {
    const { title, description, projectId, assignedTo, deadline, tags, subtasks } = req.body;
    if (!title || !projectId) return res.status(400).json({ message: 'Title and projectId required' });

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const task = await Task.create({
      title,
      description,
      projectId,
      assignedTo: assignedTo || undefined,
      deadline: deadline || undefined,
      tags,
      subtasks: Array.isArray(subtasks) ? subtasks : [],
      aiGenerated: Array.isArray(subtasks) && subtasks.length > 0,
      createdBy: req.user._id
    });

    await task.populate('assignedTo', 'name email');
    await task.populate('projectId', 'name');
    return res.status(201).json(task);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('projectId', 'name members');

    if (!task) return res.status(404).json({ message: 'Task not found' });
    return res.json(task);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['todo', 'in-progress', 'done'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    if (req.user.role !== 'admin' && task.assignedTo?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Can only update your own tasks' });
    }

    task.status = status;
    await task.save();
    await task.populate('assignedTo', 'name email');
    return res.json(task);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    Object.assign(task, req.body);
    await task.save();
    await task.populate('assignedTo', 'name email');
    return res.json(task);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.toggleSubtask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const subtask = task.subtasks.id(req.params.subtaskId);
    if (!subtask) return res.status(404).json({ message: 'Subtask not found' });

    subtask.done = !subtask.done;
    await task.save();
    return res.json(task);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    return res.json({ message: 'Task deleted' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.generateAIBreakdown = async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title) return res.status(400).json({ message: 'Task title required' });

    const result = await aiBreakdown(title, description);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
