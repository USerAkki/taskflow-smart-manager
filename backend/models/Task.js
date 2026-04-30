const mongoose = require('mongoose');

const subtaskSchema = new mongoose.Schema({
  title: String,
  estimatedHours: Number,
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  done: { type: Boolean, default: false }
});

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['todo', 'in-progress', 'done'], default: 'todo' },
  deadline: { type: Date },
  priorityScore: { type: Number, default: 0 },
  priorityLabel: { type: String, enum: ['critical', 'high', 'medium', 'low'], default: 'medium' },
  subtasks: [subtaskSchema],
  tags: [String],
  aiGenerated: { type: Boolean, default: false }
}, { timestamps: true });

// Auto-calculate priority score before save
taskSchema.pre('save', function (next) {
  this.priorityScore = computePriority(this);
  this.priorityLabel = scoreToPriorityLabel(this.priorityScore);
  next();
});

function computePriority(task) {
  let score = 0;
  const now = new Date();

  if (task.deadline) {
    const daysLeft = (new Date(task.deadline) - now) / (1000 * 60 * 60 * 24);
    if (daysLeft < 0) score += 50;         // Overdue: massive penalty
    else if (daysLeft < 1) score += 30;    // Due today
    else if (daysLeft < 3) score += 20;    // Due in 3 days
    else if (daysLeft < 7) score += 10;    // Due this week
    else score -= Math.min(daysLeft * 0.5, 10); // Far deadline: slight de-priority
  }

  if (task.status === 'todo') score += 5;
  if (task.status === 'in-progress') score += 3;
  if (task.aiGenerated) score += 2;

  return Math.max(0, Math.round(score));
}

function scoreToPriorityLabel(score) {
  if (score >= 40) return 'critical';
  if (score >= 20) return 'high';
  if (score >= 8) return 'medium';
  return 'low';
}

module.exports = mongoose.model('Task', taskSchema);
