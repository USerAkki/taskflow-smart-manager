const Project = require('../models/Project');
const Task = require('../models/Task');

const normalizeMemberIds = (members = [], createdBy) => {
  const ids = [createdBy, ...members]
    .filter(Boolean)
    .map(member => (typeof member === 'object' && member._id ? member._id : member).toString());

  return [...new Set(ids)];
};

const canAccessProject = (user, project) =>
  user.role === 'admin' ||
  project.members.some(member => member._id.toString() === user._id.toString());

exports.listProjects = async (req, res) => {
  try {
    const query = req.user.role === 'admin'
      ? {}
      : { $or: [{ createdBy: req.user._id }, { members: req.user._id }] };

    const projects = await Project.find(query)
      .populate('createdBy', 'name email')
      .populate('members', 'name email role')
      .sort({ createdAt: -1 });

    const enriched = await Promise.all(projects.map(async (project) => {
      const taskCount = await Task.countDocuments({ projectId: project._id });
      const doneCount = await Task.countDocuments({ projectId: project._id, status: 'done' });
      return { ...project.toObject(), taskCount, doneCount };
    }));

    return res.json(enriched);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.createProject = async (req, res) => {
  try {
    const { name, description, deadline, members = [] } = req.body;
    if (!name) return res.status(400).json({ message: 'Project name required' });

    const project = await Project.create({
      name,
      description,
      deadline,
      createdBy: req.user._id,
      members: normalizeMemberIds(members, req.user._id)
    });

    await project.populate('createdBy', 'name email');
    await project.populate('members', 'name email role');
    return res.status(201).json(project);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('members', 'name email role');

    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!canAccessProject(req.user, project)) return res.status(403).json({ message: 'Access denied' });

    return res.json(project);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.getProjectMembers = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('members', 'name email role _id');

    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!canAccessProject(req.user, project)) return res.status(403).json({ message: 'Access denied' });

    return res.json(project.members);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const { name, description, status, deadline, members } = req.body;
    if (name !== undefined) project.name = name;
    if (description !== undefined) project.description = description;
    if (status !== undefined) project.status = status;
    if (deadline !== undefined) project.deadline = deadline;
    if (members !== undefined) project.members = normalizeMemberIds(members, project.createdBy);

    await project.save();
    await project.populate('createdBy', 'name email');
    await project.populate('members', 'name email role');
    return res.json(project);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.addMember = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: 'User ID required' });

    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (project.members.some(member => member.toString() === userId)) {
      return res.status(400).json({ message: 'User already a member' });
    }

    project.members.push(userId);
    await project.save();
    await project.populate('createdBy', 'name email');
    await project.populate('members', 'name email role');
    return res.json(project);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.removeMember = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    project.members = project.members.filter(member => member.toString() !== req.params.userId);
    await project.save();
    return res.json({ message: 'Member removed' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    await Task.deleteMany({ projectId: req.params.id });
    await Project.findByIdAndDelete(req.params.id);
    return res.json({ message: 'Project deleted' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
