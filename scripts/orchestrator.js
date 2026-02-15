#!/usr/bin/env node

/**
 * Long-Running Agentic Framework — Orchestrator
 *
 * Human creates specs with OpenSpec. This script drives the agent team
 * through every feature autonomously: dev → review → QA, with retry
 * loops on rejection, progress compaction, and dependency ordering.
 *
 * Modes:
 *   auto      Fully autonomous. Spawns agent sessions until all features pass.
 *   guided    Shows what to do next. Human runs each session manually.
 *   status    Prints pipeline state and exits.
 *
 * Usage:
 *   node scripts/orchestrator.js auto    [--project <path>] [--model <model>]
 *   node scripts/orchestrator.js guided  [--project <path>]
 *   node scripts/orchestrator.js status  [--project <path>]
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// ──────────────────────────────────────────────
// Configuration
// ──────────────────────────────────────────────

const DEFAULTS = {
  maxRetries: 3,
  maxAgentTurns: 50,
  progressCompactThreshold: 100,
  progressKeepRecent: 20,
  model: 'claude-sonnet-4-5-20250929',
  agents: {
    dev: 'dev-agent-prompt.md',
    reviewer: 'code-reviewer-prompt.md',
    qa: 'qa-agent-prompt.md',
    teamLead: 'team-lead-prompt.md'
  }
};

function loadConfig(projectRoot) {
  const configPath = path.join(projectRoot, 'scripts', 'orchestrator-config.json');
  let userConfig = {};
  if (fs.existsSync(configPath)) {
    userConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
  return { ...DEFAULTS, ...userConfig, projectRoot };
}

// ──────────────────────────────────────────────
// Project Validation
// ──────────────────────────────────────────────

function validateProject(config) {
  const required = [
    ['architecture/feature-requirements.json', 'Feature requirements file'],
    ['agent-prompts/' + config.agents.dev, 'Dev agent prompt'],
    ['agent-prompts/' + config.agents.reviewer, 'Code reviewer prompt'],
    ['agent-prompts/' + config.agents.qa, 'QA agent prompt']
  ];

  const missing = required.filter(([p]) => !fs.existsSync(path.join(config.projectRoot, p)));

  if (missing.length > 0) {
    console.error('Missing required files:');
    missing.forEach(([p, label]) => console.error(`  ${label}: ${p}`));
    console.error(`\nProject root: ${config.projectRoot}`);
    console.error('Make sure you built the framework before running the orchestrator.');
    process.exit(1);
  }
}

// ──────────────────────────────────────────────
// State Management
// ──────────────────────────────────────────────

function featurePath(config) {
  return path.join(config.projectRoot, 'architecture', 'feature-requirements.json');
}

function progressPath(config) {
  return path.join(config.projectRoot, 'claude-progress.txt');
}

function loadFeatures(config) {
  const data = JSON.parse(fs.readFileSync(featurePath(config), 'utf8'));
  return data.features || [];
}

function statusOf(feature) {
  if (feature.passes === true) return 'complete';
  return feature.status || 'pending';
}

// ──────────────────────────────────────────────
// Dependency Resolution (topological sort)
// ──────────────────────────────────────────────

function resolveOrder(features) {
  const map = new Map(features.map(f => [f.id, f]));
  const sorted = [];
  const visited = new Set();
  const visiting = new Set();

  function visit(id) {
    if (visited.has(id)) return;
    if (visiting.has(id)) throw new Error(`Circular dependency: ${id}`);
    visiting.add(id);
    const f = map.get(id);
    if (f && f.depends_on) {
      for (const dep of f.depends_on) visit(dep);
    }
    visiting.delete(id);
    visited.add(id);
    if (f) sorted.push(f);
  }

  features.forEach(f => visit(f.id));
  return sorted;
}

function depsAreMet(feature, features) {
  if (!feature.depends_on || feature.depends_on.length === 0) return true;
  return feature.depends_on.every(depId => {
    const dep = features.find(f => f.id === depId);
    return dep && dep.passes === true;
  });
}

// ──────────────────────────────────────────────
// Next Action Determination
// ──────────────────────────────────────────────

function getNextAction(features, escalated) {
  const ordered = resolveOrder(features);

  for (const feature of ordered) {
    if (statusOf(feature) === 'complete') continue;
    if (escalated.has(feature.id)) continue;
    if (!depsAreMet(feature, features)) continue;

    const status = statusOf(feature);
    if (status === 'pending' || status === 'needs-revision') return { action: 'dev', feature };
    if (status === 'ready-for-review') return { action: 'review', feature };
    if (status === 'approved') return { action: 'qa', feature };
    return { action: 'dev', feature };
  }

  return null;
}

// ──────────────────────────────────────────────
// Agent Prompt Builder
// ──────────────────────────────────────────────

function buildTaskPrompt(action, feature, config) {
  // Load the agent's system prompt
  const agentFile = { dev: config.agents.dev, review: config.agents.reviewer, qa: config.agents.qa }[action];
  const agentPrompt = fs.readFileSync(path.join(config.projectRoot, 'agent-prompts', agentFile), 'utf8');

  // Build the task-specific instruction
  const tasks = {
    dev: [
      `Your assigned feature is ${feature.id}: "${feature.description}"`,
      feature.status === 'needs-revision'
        ? 'This feature was REJECTED. Read rejection feedback in git notes and claude-progress.txt. Fix the issues.'
        : '',
      'Implement with full architecture compliance.',
      'When done: update feature-requirements.json status to "ready-for-review", update claude-progress.txt, commit.'
    ],
    review: [
      `Review feature ${feature.id}: "${feature.description}" (status: ready-for-review).`,
      'Execute ALL verification_steps for ALL principles in architecture_compliance.',
      'Approve or reject with specific evidence.',
      'Update feature-requirements.json and claude-progress.txt.'
    ],
    qa: [
      `Test feature ${feature.id}: "${feature.description}" (status: approved by code review).`,
      'Execute ALL verification_steps. Test end-to-end functionality.',
      'If all pass: set passes: true. If any fail: set status to needs-revision.',
      'Update feature-requirements.json and claude-progress.txt.'
    ]
  };

  const task = tasks[action].filter(Boolean).join('\n');

  // Combine: agent role instructions + specific task
  return `${agentPrompt}\n\n` +
    `=== YOUR TASK THIS SESSION ===\n\n` +
    `Begin your session. Follow your initialization checklist exactly.\n\n${task}`;
}

// ──────────────────────────────────────────────
// Agent Runner
// ──────────────────────────────────────────────

function runAgent(action, feature, config) {
  const prompt = buildTaskPrompt(action, feature, config);
  const label = { dev: 'Dev Agent', review: 'Code Reviewer', qa: 'QA Agent' }[action];

  console.log(`\n${'─'.repeat(50)}`);
  console.log(`Spawning: ${label} for ${feature.id}`);
  console.log(`${'─'.repeat(50)}\n`);

  return new Promise((resolve, reject) => {
    const proc = spawn('claude', [
      '-p', prompt,
      '--max-turns', String(config.maxAgentTurns),
      '--model', config.model,
      '--output-format', 'text'
    ], {
      cwd: config.projectRoot,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env }
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      const text = data.toString();
      stdout += text;
      process.stdout.write(text);
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      resolve({ code, stdout, stderr });
    });

    proc.on('error', (err) => {
      reject(new Error(`Failed to spawn claude CLI: ${err.message}\nIs 'claude' installed and in PATH?`));
    });
  });
}

// ──────────────────────────────────────────────
// Progress Compaction
// ──────────────────────────────────────────────

function compactProgress(config) {
  const filePath = progressPath(config);
  if (!fs.existsSync(filePath)) return;

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  if (lines.length < config.progressCompactThreshold) return;

  // Split into session blocks
  const sessions = [];
  let current = [];
  for (const line of lines) {
    if (line.match(/^Session \d+/) && current.length > 0) {
      sessions.push(current.join('\n'));
      current = [line];
    } else {
      current.push(line);
    }
  }
  if (current.length > 0) sessions.push(current.join('\n'));
  if (sessions.length <= config.progressKeepRecent) return;

  const old = sessions.slice(0, -config.progressKeepRecent);
  const recent = sessions.slice(-config.progressKeepRecent);

  // Extract feature mentions from old sessions
  const mentions = old.join('\n').match(/FEAT-\d+/g) || [];
  const unique = [...new Set(mentions)];

  const summary =
    `=== COMPACTED HISTORY ===\n` +
    `Sessions 1-${old.length}: ${unique.length} features worked on (${unique.join(', ')})\n` +
    `Compacted: ${new Date().toISOString()}\n` +
    `=== END COMPACTED HISTORY ===\n\n`;

  fs.writeFileSync(filePath, summary + recent.join('\n\n'), 'utf8');
  console.log(`Progress compacted: ${lines.length} → ${(summary + recent.join('\n\n')).split('\n').length} lines`);
}

// ──────────────────────────────────────────────
// Status Display
// ──────────────────────────────────────────────

function printStatus(features, escalated) {
  const ordered = resolveOrder(features);
  const counts = {};

  console.log('\n=== PIPELINE STATUS ===\n');

  for (const f of ordered) {
    const s = statusOf(f);
    counts[s] = (counts[s] || 0) + 1;

    const icon = { complete: '\u2713', pending: '\u25CB', 'ready-for-review': '\u25D0', approved: '\u25D1', 'needs-revision': '\u2717' }[s] || '?';
    const esc = escalated.has(f.id) ? ' [ESCALATED]' : '';
    const dep = f.depends_on && f.depends_on.length > 0 ? ` [needs: ${f.depends_on.join(', ')}]` : '';

    console.log(`  ${icon} ${f.id}: ${f.description} \u2014 ${s}${esc}${dep}`);
  }

  const total = features.length;
  const done = counts.complete || 0;
  console.log(`\n  ${done}/${total} complete\n`);
}

// ──────────────────────────────────────────────
// Guided Mode
// ──────────────────────────────────────────────

function runGuidedMode(config) {
  const features = loadFeatures(config);
  const escalated = new Set();
  printStatus(features, escalated);

  const next = getNextAction(features, escalated);
  if (!next) {
    const allDone = features.every(f => f.passes === true);
    console.log(allDone ? 'All features complete.' : 'All remaining features are blocked.');
    return;
  }

  const { action, feature } = next;
  const label = { dev: 'Dev Agent', review: 'Code Reviewer', qa: 'QA Agent' }[action];
  const agentFile = { dev: config.agents.dev, review: config.agents.reviewer, qa: config.agents.qa }[action];

  console.log('=== NEXT STEP ===\n');
  console.log(`  Feature:  ${feature.id} \u2014 ${feature.description}`);
  console.log(`  Action:   Run ${label}`);
  console.log(`  Prompt:   agent-prompts/${agentFile}`);

  if (feature.status === 'needs-revision') {
    console.log('  Note:     Was rejected. Agent should read git notes for feedback.');
  }

  console.log('\n  Open a new Claude session, load that agent prompt, and tell it:');
  console.log(`  "Begin your session. Your assigned feature is ${feature.id}."\n`);
}

// ──────────────────────────────────────────────
// Auto Mode (main loop)
// ──────────────────────────────────────────────

async function runAutoMode(config) {
  console.log('=== ORCHESTRATOR: AUTO MODE ===');
  console.log(`Project:     ${config.projectRoot}`);
  console.log(`Model:       ${config.model}`);
  console.log(`Max retries: ${config.maxRetries}`);
  console.log(`Max turns:   ${config.maxAgentTurns}`);

  const retries = {};      // featureId -> number of rejection cycles
  const escalated = new Set();  // features that exceeded retries

  while (true) {
    compactProgress(config);

    let features;
    try {
      features = loadFeatures(config);
    } catch (err) {
      console.error(`Cannot load features: ${err.message}`);
      break;
    }

    // Done?
    const allComplete = features.every(f => f.passes === true);
    if (allComplete) {
      console.log('\n=== ALL FEATURES COMPLETE ===');
      printStatus(features, escalated);
      break;
    }

    // Next action
    const next = getNextAction(features, escalated);
    if (!next) {
      console.log('\nNo actionable features remaining.');
      printStatus(features, escalated);

      if (escalated.size > 0) {
        console.log('Escalated features (need human intervention):');
        escalated.forEach(id => console.log(`  - ${id}`));
      }
      break;
    }

    const { action, feature } = next;
    const featureId = feature.id;

    // Check retry limit on rejection cycles
    if (action === 'dev' && feature.status === 'needs-revision') {
      retries[featureId] = (retries[featureId] || 0) + 1;
      if (retries[featureId] > config.maxRetries) {
        console.log(`\n!! ${featureId} rejected ${retries[featureId]} times. Escalating to human. Skipping.`);
        escalated.add(featureId);
        continue;
      }
      console.log(`\n${featureId}: retry ${retries[featureId]}/${config.maxRetries}`);
    }

    printStatus(features, escalated);

    // Run agent
    const statusBefore = statusOf(feature);
    try {
      await runAgent(action, feature, config);
    } catch (err) {
      console.error(`Agent error: ${err.message}`);
      // Don't break — mark as retry and continue
      retries[featureId] = (retries[featureId] || 0) + 1;
      continue;
    }

    // Verify agent updated state
    const updated = loadFeatures(config);
    const updatedFeature = updated.find(f => f.id === featureId);
    const statusAfter = updatedFeature ? statusOf(updatedFeature) : 'unknown';

    if (statusAfter === statusBefore) {
      console.log(`\n!! ${featureId}: status unchanged after ${action} agent (${statusBefore}). Agent may have stalled.`);
      retries[featureId] = (retries[featureId] || 0) + 1;
      if (retries[featureId] > config.maxRetries) {
        console.log(`   Escalating ${featureId} to human.`);
        escalated.add(featureId);
      }
    } else {
      console.log(`\n${featureId}: ${statusBefore} -> ${statusAfter}`);
    }
  }

  // Final report
  if (escalated.size > 0) {
    console.log(`\n${escalated.size} feature(s) need human attention: ${[...escalated].join(', ')}`);
    process.exit(1);
  }
}

// ──────────────────────────────────────────────
// Entry Point
// ──────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const mode = args[0] || 'status';

  // Resolve project root
  let projectRoot = process.cwd();
  const projIdx = args.indexOf('--project');
  if (projIdx !== -1 && args[projIdx + 1]) {
    projectRoot = path.resolve(args[projIdx + 1]);
  }

  const config = loadConfig(projectRoot);

  // CLI overrides
  const modelIdx = args.indexOf('--model');
  if (modelIdx !== -1 && args[modelIdx + 1]) {
    config.model = args[modelIdx + 1];
  }

  const turnsIdx = args.indexOf('--max-turns');
  if (turnsIdx !== -1 && args[turnsIdx + 1]) {
    config.maxAgentTurns = parseInt(args[turnsIdx + 1], 10);
  }

  switch (mode) {
    case 'auto':
      validateProject(config);
      await runAutoMode(config);
      break;
    case 'guided':
      validateProject(config);
      runGuidedMode(config);
      break;
    case 'status':
      validateProject(config);
      printStatus(loadFeatures(config), new Set());
      break;
    default:
      console.log('Usage: node scripts/orchestrator.js <mode> [options]\n');
      console.log('Modes:');
      console.log('  auto      Fully autonomous');
      console.log('  guided    Human-in-the-loop');
      console.log('  status    Show pipeline state\n');
      console.log('Options:');
      console.log('  --project <path>     Project root directory');
      console.log('  --model <model>      Model for agent sessions');
      console.log('  --max-turns <n>      Max turns per agent session');
      process.exit(1);
  }
}

main().catch(err => {
  console.error(err.message);
  process.exit(1);
});
