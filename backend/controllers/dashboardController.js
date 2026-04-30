const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');

exports.getInsights = async (req, res) => {
  try {
    const now = new Date();
    const taskFilter = {};

    if (req.user.role !== 'admin') {
      const myProjects = await Project.find({
        $or: [{ createdBy: req.user._id }, { members: req.user._id }]
      }).select('_id');
      taskFilter.projectId = { $in: myProjects.map(project => project._id) };
    }

    const allTasks = await Task.find(taskFilter)
      .populate('assignedTo', 'name')
      .populate('projectId', 'name');

    const totalTasks = allTasks.length;
    const doneTasks = allTasks.filter(task => task.status === 'done').length;
    const inProgressTasks = allTasks.filter(task => task.status === 'in-progress').length;
    const todoTasks = allTasks.filter(task => task.status === 'todo').length;
    const overdueTasks = allTasks.filter(task => task.deadline && new Date(task.deadline) < now && task.status !== 'done');
    const criticalTasks = allTasks.filter(task => task.priorityLabel === 'critical' && task.status !== 'done');
    const highPriorityTasks = allTasks.filter(task =>
      (task.priorityLabel === 'high' || task.priorityLabel === 'critical') && task.status !== 'done'
    );
    const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

    const workloadMap = {};
    allTasks.filter(task => task.assignedTo && task.status !== 'done').forEach(task => {
      const key = task.assignedTo._id.toString();
      if (!workloadMap[key]) workloadMap[key] = { name: task.assignedTo.name, count: 0 };
      workloadMap[key].count += 1;
    });

    const upcoming48h = allTasks.filter(task => {
      if (!task.deadline || task.status === 'done') return false;
      const hours = (new Date(task.deadline) - now) / (1000 * 60 * 60);
      return hours >= 0 && hours <= 48;
    });

    const statusBreakdown = [
      { label: 'Todo', count: todoTasks, color: '#6366f1' },
      { label: 'In Progress', count: inProgressTasks, color: '#f59e0b' },
      { label: 'Done', count: doneTasks, color: '#10b981' }
    ];

    const priorityBreakdown = {
      critical: allTasks.filter(task => task.priorityLabel === 'critical').length,
      high: allTasks.filter(task => task.priorityLabel === 'high').length,
      medium: allTasks.filter(task => task.priorityLabel === 'medium').length,
      low: allTasks.filter(task => task.priorityLabel === 'low').length
    };

    const projectIds = [...new Set(allTasks.map(task => task.projectId?._id?.toString()).filter(Boolean))];
    const projectHealth = projectIds.map(projectId => {
      const projectTasks = allTasks.filter(task => task.projectId?._id?.toString() === projectId);
      const projectDone = projectTasks.filter(task => task.status === 'done').length;
      const projectOverdue = projectTasks.filter(task =>
        task.deadline && new Date(task.deadline) < now && task.status !== 'done'
      ).length;

      return {
        name: projectTasks[0]?.projectId?.name || 'Unknown',
        total: projectTasks.length,
        done: projectDone,
        overdue: projectOverdue,
        completion: projectTasks.length > 0 ? Math.round((projectDone / projectTasks.length) * 100) : 0
      };
    });

    const totalProjects = req.user.role === 'admin' ? await Project.countDocuments() : null;
    const totalUsers = req.user.role === 'admin' ? await User.countDocuments() : null;

    const velocity = (doneTasks * 10) + (doneTasks * 5); // simplified onTimeTasks to doneTasks
    const overduePenalty = overdueTasks.length * 15;
    const criticalPenalty = criticalTasks.length * 20;
    const productivityScore = Math.max(0, velocity - overduePenalty - criticalPenalty);

    return res.json({
      summary: {
        totalTasks,
        doneTasks,
        inProgressTasks,
        todoTasks,
        completionRate,
        totalProjects,
        totalUsers,
        overdueCount: overdueTasks.length,
        criticalCount: criticalTasks.length,
        score: productivityScore,
        breakdown: {
          velocity,
          overduePenalty,
          criticalPenalty
        }
      },
      overdueTasks: overdueTasks.slice(0, 10),
      criticalTasks: criticalTasks.slice(0, 10),
      highPriorityTasks: highPriorityTasks.slice(0, 5),
      upcoming48h: upcoming48h.slice(0, 5),
      statusBreakdown,
      priorityBreakdown,
      workloadByMember: Object.values(workloadMap).sort((a, b) => b.count - a.count).slice(0, 8),
      projectHealth: projectHealth.slice(0, 6)
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.getMembers = async (req, res) => {
  try {
    const projectFilter = req.user.role === 'admin'
      ? {}
      : { $or: [{ createdBy: req.user._id }, { members: req.user._id }] };

    const projects = await Project.find(projectFilter)
      .populate('members', 'name email role')
      .populate('createdBy', 'name email role');

    const membersMap = new Map();

    projects.forEach(project => {
      if (project.createdBy) {
        membersMap.set(project.createdBy._id.toString(), project.createdBy);
      }

      project.members.forEach(member => {
        membersMap.set(member._id.toString(), member);
      });
    });

    return res.json(Array.from(membersMap.values()).map(member => ({
      _id: member._id,
      name: member.name,
      email: member.email,
      role: member.role
    })));
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
