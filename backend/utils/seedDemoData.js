const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');

async function upsertDemoUser({ name, email, password, role }) {
  const existing = await User.findOne({ email });
  if (existing) {
    existing.name = name;
    existing.role = role;
    existing.password = password;
    await existing.save();
    return existing;
  }

  return User.create({ name, email, password, role });
}

async function seedDemoData() {
  if (process.env.SEED_DEMO_DATA === 'false') return;

  const admin = await upsertDemoUser({
    name: 'Admin Demo',
    email: 'admin@demo.com',
    password: '123456',
    role: 'admin'
  });

  const member = await upsertDemoUser({
    name: 'Member Demo',
    email: 'member@demo.com',
    password: '123456',
    role: 'member'
  });

  let project = await Project.findOne({ name: 'Launch Readiness Sprint', createdBy: admin._id });
  if (!project) {
    project = await Project.create({
      name: 'Launch Readiness Sprint',
      description: 'Demo workspace for showing assignments, priorities, and delivery flow.',
      createdBy: admin._id,
      members: [admin._id, member._id],
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });
  } else {
    const memberIds = project.members.map(id => id.toString());
    if (!memberIds.includes(admin._id.toString())) project.members.push(admin._id);
    if (!memberIds.includes(member._id.toString())) project.members.push(member._id);
    await project.save();
  }

  const taskCount = await Task.countDocuments({ projectId: project._id });
  if (taskCount === 0) {
    await Task.create([
      {
        title: 'Finalize onboarding flow',
        description: 'Polish sign-in, demo access, and first-run guidance.',
        projectId: project._id,
        assignedTo: member._id,
        createdBy: admin._id,
        status: 'in-progress',
        deadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
        tags: ['demo', 'ux']
      },
      {
        title: 'Review launch blockers',
        description: 'Confirm overdue risks, ownership, and next actions.',
        projectId: project._id,
        assignedTo: admin._id,
        createdBy: admin._id,
        status: 'todo',
        deadline: new Date(Date.now() - 24 * 60 * 60 * 1000),
        tags: ['risk']
      },
      {
        title: 'Publish status snapshot',
        description: 'Prepare a short update for stakeholders.',
        projectId: project._id,
        assignedTo: member._id,
        createdBy: admin._id,
        status: 'done',
        deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        tags: ['ops']
      }
    ]);
  }
}

module.exports = seedDemoData;
