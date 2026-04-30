const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function aiBreakdown(taskTitle, taskDescription = '') {
  if (!process.env.ANTHROPIC_API_KEY) {
    return ruleBasedBreakdown(taskTitle);
  }

  try {
    const prompt = `You are a senior software project manager. Break down the following task into 3-6 actionable subtasks with time estimates and priority levels.

Task: "${taskTitle}"
${taskDescription ? `Description: "${taskDescription}"` : ''}

Respond ONLY with valid JSON (no markdown, no explanation):
{
  "subtasks": [
    { "title": "string", "estimatedHours": number, "priority": "low|medium|high" }
  ],
  "totalEstimatedHours": number,
  "riskLevel": "low|medium|high",
  "suggestion": "one-line expert tip for this task"
}`;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }]
    });

    const text = response.content[0].text.trim();
    return JSON.parse(text);
  } catch (err) {
    console.error('AI breakdown error, using fallback:', err.message);
    return ruleBasedBreakdown(taskTitle);
  }
}

function ruleBasedBreakdown(title) {
  const lower = title.toLowerCase();
  let subtasks = [];

  if (lower.includes('auth') || lower.includes('login') || lower.includes('signup')) {
    subtasks = [
      { title: 'Design UI wireframe', estimatedHours: 1, priority: 'medium' },
      { title: 'Build frontend form with validation', estimatedHours: 2, priority: 'high' },
      { title: 'Implement backend API endpoint', estimatedHours: 2, priority: 'high' },
      { title: 'Add JWT token handling', estimatedHours: 1, priority: 'high' },
      { title: 'Write unit tests', estimatedHours: 1, priority: 'medium' },
      { title: 'QA and edge case testing', estimatedHours: 1, priority: 'medium' }
    ];
  } else if (lower.includes('api') || lower.includes('endpoint') || lower.includes('rest')) {
    subtasks = [
      { title: 'Define API contract and schema', estimatedHours: 1, priority: 'high' },
      { title: 'Implement route handler', estimatedHours: 2, priority: 'high' },
      { title: 'Add input validation and error handling', estimatedHours: 1, priority: 'high' },
      { title: 'Write integration tests', estimatedHours: 1, priority: 'medium' },
      { title: 'Document API endpoints', estimatedHours: 0.5, priority: 'low' }
    ];
  } else if (lower.includes('ui') || lower.includes('dashboard') || lower.includes('page') || lower.includes('design')) {
    subtasks = [
      { title: 'Create wireframe / mockup', estimatedHours: 1, priority: 'medium' },
      { title: 'Build component structure', estimatedHours: 2, priority: 'high' },
      { title: 'Add responsive styling', estimatedHours: 1, priority: 'medium' },
      { title: 'Connect to API / state', estimatedHours: 1, priority: 'high' },
      { title: 'Cross-browser testing', estimatedHours: 0.5, priority: 'low' }
    ];
  } else if (lower.includes('database') || lower.includes('db') || lower.includes('schema') || lower.includes('model')) {
    subtasks = [
      { title: 'Design schema and relationships', estimatedHours: 1, priority: 'high' },
      { title: 'Write migration scripts', estimatedHours: 1, priority: 'high' },
      { title: 'Add indexes for performance', estimatedHours: 0.5, priority: 'medium' },
      { title: 'Seed test data', estimatedHours: 0.5, priority: 'low' },
      { title: 'Validate with queries', estimatedHours: 0.5, priority: 'medium' }
    ];
  } else if (lower.includes('deploy') || lower.includes('ci') || lower.includes('devops')) {
    subtasks = [
      { title: 'Set up environment variables', estimatedHours: 0.5, priority: 'high' },
      { title: 'Configure build pipeline', estimatedHours: 1, priority: 'high' },
      { title: 'Write Dockerfile / config', estimatedHours: 1, priority: 'medium' },
      { title: 'Run smoke tests post-deploy', estimatedHours: 0.5, priority: 'high' },
      { title: 'Monitor logs and errors', estimatedHours: 0.5, priority: 'medium' }
    ];
  } else {
    subtasks = [
      { title: 'Research and plan approach', estimatedHours: 1, priority: 'medium' },
      { title: 'Implement core logic', estimatedHours: 2, priority: 'high' },
      { title: 'Handle edge cases and errors', estimatedHours: 1, priority: 'high' },
      { title: 'Test and verify', estimatedHours: 1, priority: 'medium' },
      { title: 'Code review and cleanup', estimatedHours: 0.5, priority: 'low' }
    ];
  }

  const totalEstimatedHours = subtasks.reduce((sum, s) => sum + s.estimatedHours, 0);

  return {
    subtasks,
    totalEstimatedHours,
    riskLevel: totalEstimatedHours > 6 ? 'high' : totalEstimatedHours > 3 ? 'medium' : 'low',
    suggestion: `Break this into focused work sessions. Tackle high-priority subtasks first to reduce risk early.`
  };
}

module.exports = { aiBreakdown };
