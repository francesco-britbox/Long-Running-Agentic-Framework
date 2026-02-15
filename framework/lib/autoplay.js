/**
 * Autoplay Pipeline Controller
 *
 * Drives the full pipeline: dev -> review -> QA -> PR -> merge -> complete
 * Supports three execution modes:
 *   - team:         Uses Claude Code Agent Teams (native)
 *   - orchestrator:  Falls back to spawning individual claude -p sessions
 *   - guided:       Shows next step for human-in-the-loop
 *
 * Safe mode (default): stops at PR creation, human merges
 * Auto-merge mode:     merges automatically (--auto-merge flag)
 */

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const features = require('./features');
const db = require('./db');
const openspec = require('./openspec');

function loadConfig(projectRoot) {
  const d = db.get(projectRoot);
  const rows = d.prepare('SELECT key, value FROM config').all();
  const config = {};
  for (const r of rows) config[r.key] = r.value;
  return {
    executionMode: config.execution_mode || 'team',
    model: config.model || 'claude-sonnet-4-5-20250929',
    maxRetries: parseInt(config.max_retries || '3', 10),
    maxAgentTurns: parseInt(config.max_agent_turns || '50', 10),
    featuresPerSession: parseInt(config.features_per_lead_session || '5', 10),
    autoMerge: config.auto_merge === 'true',
    safeMode: config.safe_mode !== 'false',
    openspecAutoArchive: config.openspec_auto_archive === 'true',
    openspecAutoImport: config.openspec_auto_import === 'true',
    projectRoot
  };
}

function getNextAction(projectRoot, escalated) {
  const ordered = features.resolveOrder(projectRoot);

  for (const feature of ordered) {
    // status: complete is authoritative — skip regardless of passes field
    if (feature.status === 'complete') continue;
    if (escalated.has(feature.id)) continue;
    if (!features.depsAreMet(projectRoot, feature.id)) continue;

    // QA passed but not yet PR'd/merged — route to PR creation
    if (feature.passes) return { action: 'pr', feature };

    const status = feature.status;
    if (status === 'pending' || status === 'needs-revision') return { action: 'dev', feature };
    if (status === 'ready-for-review') return { action: 'review', feature };
    if (status === 'approved' || status === 'qa-testing') return { action: 'qa', feature };
    if (status === 'pr-open') return { action: 'merge', feature };
    return { action: 'dev', feature };
  }

  return null;
}

function buildAgentPrompt(action, feature, config) {
  const promptFile = {
    dev: 'dev-agent-prompt.md',
    review: 'code-reviewer-prompt.md',
    qa: 'qa-agent-prompt.md'
  }[action];

  if (!promptFile) return null;

  const promptPath = path.join(config.projectRoot, 'agent-prompts', promptFile);
  if (!fs.existsSync(promptPath)) {
    throw new Error('Agent prompt not found: ' + promptPath);
  }

  const agentPrompt = fs.readFileSync(promptPath, 'utf8');
  const featureJson = JSON.stringify(feature, null, 2);

  const tasks = {
    dev: [
      'Your assigned feature is ' + feature.id + ': "' + feature.description + '"',
      feature.status === 'needs-revision'
        ? 'This feature was REJECTED. Read git notes and claude-progress.txt for feedback. Fix the issues.'
        : '',
      'Feature details:\n' + featureJson,
      'Implement with full architecture compliance. When done, set status to ready-for-review.'
    ],
    review: [
      'Review feature ' + feature.id + ': "' + feature.description + '"',
      'Feature details:\n' + featureJson,
      'Execute ALL verification_steps for ALL principles. Approve or reject with specific evidence.'
    ],
    qa: [
      'Test feature ' + feature.id + ': "' + feature.description + '"',
      'Feature details:\n' + featureJson,
      'Execute ALL verification_steps. If all pass: set passes true (do NOT set status to complete — the orchestrator handles that). If any fail: set status to needs-revision.'
    ]
  };

  const task = tasks[action].filter(Boolean).join('\n');
  return agentPrompt + '\n\n=== YOUR TASK THIS SESSION ===\n\n' + task;
}

// Run a git command and return stdout
function git(args, cwd) {
  var result = spawnSync('git', args, { cwd: cwd, encoding: 'utf8' });
  return { code: result.status, stdout: (result.stdout || '').trim(), stderr: (result.stderr || '').trim() };
}

// Create PR for a feature (orchestrator handles this since no agent does it)
function createPR(feature, config) {
  var cwd = config.projectRoot;
  var branch = 'feature/' + feature.id.toLowerCase();

  console.log('\n' + '-'.repeat(50));
  console.log('Creating PR for ' + feature.id);
  console.log('-'.repeat(50) + '\n');

  // Check that origin remote exists before attempting push
  var remoteCheck = git(['remote', 'get-url', 'origin'], cwd);
  var hasOrigin = remoteCheck.code === 0;

  // Create feature branch if not on one
  var currentBranch = git(['rev-parse', '--abbrev-ref', 'HEAD'], cwd).stdout;
  if (currentBranch !== branch) {
    git(['checkout', '-b', branch], cwd);
    if (hasOrigin) {
      git(['push', '-u', 'origin', branch], cwd);
    } else {
      console.log('  No origin remote configured — branch created locally only.');
    }
  }

  // Create PR using gh if available
  var ghCheck = spawnSync('gh', ['--version'], { encoding: 'utf8' });
  if (ghCheck.status === 0) {
    var prResult = spawnSync('gh', [
      'pr', 'create',
      '--title', feature.id + ': ' + feature.description,
      '--body', 'Feature ' + feature.id + ' — QA passed, ready for merge.\n\nArchitecture compliance verified.\nAll verification steps passed.'
    ], { cwd: cwd, encoding: 'utf8', stdio: 'inherit' });

    if (prResult.status === 0) {
      features.update(config.projectRoot, feature.id, { status: 'pr-open' });
      console.log(feature.id + ': PR created, status -> pr-open');
      return true;
    }
  }

  // Fallback: just update status, user creates PR manually
  features.update(config.projectRoot, feature.id, { status: 'pr-open' });
  console.log(feature.id + ': status -> pr-open (create PR manually, gh CLI not available)');
  return true;
}

// Merge PR for a feature
function mergePR(feature, config) {
  var cwd = config.projectRoot;

  if (!config.autoMerge) {
    console.log(feature.id + ': PR open. Safe mode — waiting for human to merge.');
    return false;
  }

  console.log('\n' + '-'.repeat(50));
  console.log('Merging PR for ' + feature.id);
  console.log('-'.repeat(50) + '\n');

  var ghCheck = spawnSync('gh', ['--version'], { encoding: 'utf8' });
  if (ghCheck.status === 0) {
    var mergeResult = spawnSync('gh', ['pr', 'merge', '--merge', '--delete-branch'], {
      cwd: cwd, encoding: 'utf8', stdio: 'inherit'
    });

    if (mergeResult.status === 0) {
      features.update(config.projectRoot, feature.id, { status: 'complete' });
      console.log(feature.id + ': merged, status -> complete');
      maybeAutoArchive(feature, config);
      return true;
    }
  }

  // Fallback: merge locally
  var mainBranch = git(['symbolic-ref', 'refs/remotes/origin/HEAD'], cwd).stdout.replace('refs/remotes/origin/', '') || 'main';
  git(['checkout', mainBranch], cwd);
  var branch = 'feature/' + feature.id.toLowerCase();
  var mergeGit = git(['merge', '--no-ff', branch], cwd);
  if (mergeGit.code === 0) {
    features.update(config.projectRoot, feature.id, { status: 'complete' });
    console.log(feature.id + ': merged to ' + mainBranch + ', status -> complete');
    maybeAutoArchive(feature, config);
    return true;
  }

  console.log(feature.id + ': merge failed. Needs human intervention.');
  return false;
}

// Auto-archive: after a feature is marked complete, check if all siblings from the same
// OpenSpec change are also complete — if so, archive the change.
function maybeAutoArchive(feature, config) {
  if (!config.openspecAutoArchive) return;
  if (!feature.openspec_change_id) return;
  var archived = openspec.maybeArchive(config.projectRoot, feature.id);
  if (archived) {
    console.log('  OpenSpec change "' + feature.openspec_change_id + '" archived (all features complete).');
  }
}

// Auto-import: at autoplay start, import any new OpenSpec changes into the pipeline.
function runAutoImport(config) {
  if (!config.openspecAutoImport) return;
  if (!openspec.isInstalled()) return;
  console.log('Auto-importing OpenSpec changes...');
  var result = openspec.importAll(config.projectRoot);
  if (!result.ok) {
    console.log('  ' + result.error);
    return;
  }
  if (result.message) {
    console.log('  ' + result.message);
    return;
  }
  for (var i = 0; i < result.results.length; i++) {
    var r = result.results[i];
    if (r.result.ok) {
      console.log('  ' + r.change + ': ' + r.result.created.length + ' created, ' + r.result.updated.length + ' updated');
    } else {
      console.log('  ' + r.change + ': ' + r.result.error);
    }
  }
  console.log('');
}

// Orchestrator fallback: spawn individual claude -p sessions
function runAgentSession(action, feature, config) {
  var prompt = buildAgentPrompt(action, feature, config);
  if (!prompt) return { code: 1 };

  var label = { dev: 'Dev Agent', review: 'Code Reviewer', qa: 'QA Agent' }[action];

  console.log('\n' + '-'.repeat(50));
  console.log('Spawning: ' + label + ' for ' + feature.id);
  console.log('-'.repeat(50) + '\n');

  var result = spawnSync('claude', [
    '-p', prompt,
    '--max-turns', String(config.maxAgentTurns),
    '--model', config.model,
    '--output-format', 'text'
  ], {
    cwd: config.projectRoot,
    stdio: 'inherit',
    env: process.env
  });

  return { code: result.status, signal: result.signal };
}

// Team mode: generate instructions for Claude Code Agent Teams
function generateTeamInstructions(projectRoot, config) {
  runAutoImport(config);
  var ordered = features.resolveOrder(projectRoot);
  // Filter: not complete AND deps met
  var actionable = ordered.filter(function(f) {
    if (f.status === 'complete') return false;
    return features.depsAreMet(projectRoot, f.id);
  });

  if (actionable.length === 0) {
    var all = features.list(projectRoot);
    var blocked = all.filter(function(f) { return f.status !== 'complete'; });
    if (blocked.length > 0) {
      return { done: false, message: 'All remaining features are blocked by unmet dependencies.', blocked: blocked };
    }
    return { done: true, message: 'All features complete.' };
  }

  var batch = actionable.slice(0, config.featuresPerSession);

  var instructions = [
    'Create an agent team to implement the following features.',
    'Use delegate mode (Shift+Tab) so you only coordinate, not code.',
    '',
    'For each feature in order:',
    '1. Spawn a dev teammate to implement it',
    '2. When dev is done, spawn a code-reviewer teammate to review',
    '3. If rejected, have dev fix and reviewer re-check (max ' + config.maxRetries + ' retries)',
    '4. When approved, spawn a QA teammate to test end-to-end',
    '5. If QA passes, create a feature branch and open a PR',
    config.autoMerge ? '6. Merge the PR automatically' : '6. Leave PR open for human review',
    '',
    'Features to implement (in order):',
    ''
  ];

  for (var i = 0; i < batch.length; i++) {
    var f = batch[i];
    instructions.push('  ' + f.id + ': ' + f.description + ' (status: ' + f.status + ')');
    if (f.depends_on.length > 0) {
      instructions.push('    depends on: ' + f.depends_on.join(', '));
    }
  }

  instructions.push('');
  instructions.push('Each teammate should read CLAUDE.md and all architecture files before starting.');
  instructions.push('Agent prompts are in agent-prompts/ directory.');

  return { done: false, instructions: instructions.join('\n'), batch: batch };
}

// Guided mode: show the human what to do next
function runGuidedMode(projectRoot) {
  var config = loadConfig(projectRoot);
  var escalated = new Set();
  var all = features.list(projectRoot);

  // Print status
  var counts = {};
  console.log('\n=== PIPELINE STATUS ===\n');
  var ordered = features.resolveOrder(projectRoot);
  for (var i = 0; i < ordered.length; i++) {
    var f = ordered[i];
    var s = f.status;
    counts[s] = (counts[s] || 0) + 1;
    var icon = { complete: '*', pending: 'o', 'in-dev': '>', 'ready-for-review': 'R', approved: 'A', 'needs-revision': 'x', 'qa-testing': 'T', 'pr-open': 'P' }[s] || '?';
    var deps = f.depends_on.length > 0 ? ' [needs: ' + f.depends_on.join(', ') + ']' : '';
    console.log('  ' + icon + ' ' + f.id + ': ' + f.description + ' - ' + s + deps);
  }
  var done = counts.complete || 0;
  console.log('\n  ' + done + '/' + all.length + ' complete\n');

  // Next action
  var next = getNextAction(projectRoot, escalated);
  if (!next) {
    var allDone = all.every(function(f) { return f.status === 'complete'; });
    console.log(allDone ? 'All features complete.' : 'All remaining features are blocked or escalated.');
    return;
  }

  var action = next.action;
  var feature = next.feature;
  var labels = { dev: 'Dev Agent', review: 'Code Reviewer', qa: 'QA Agent', pr: 'Create PR', merge: 'Merge PR' };
  var promptFiles = { dev: 'dev-agent-prompt.md', review: 'code-reviewer-prompt.md', qa: 'qa-agent-prompt.md' };

  console.log('=== NEXT STEP ===\n');
  console.log('  Feature:  ' + feature.id + ' - ' + feature.description);
  console.log('  Status:   ' + feature.status);
  console.log('  Action:   ' + (labels[action] || action));

  if (promptFiles[action]) {
    console.log('  Prompt:   agent-prompts/' + promptFiles[action]);
  }

  if (feature.status === 'needs-revision') {
    console.log('  Note:     Was rejected. Check git notes for feedback.');
  }

  console.log('');

  if (action === 'pr') {
    console.log('  Create a feature branch and open a PR for ' + feature.id + '.');
    console.log('  Then run: node .framework/bin/framework.js -p . feature update ' + feature.id + ' --status pr-open');
  } else if (action === 'merge') {
    if (config.safeMode) {
      console.log('  Review and merge the PR for ' + feature.id + '.');
      console.log('  Then run: node .framework/bin/framework.js -p . feature update ' + feature.id + ' --status complete');
    } else {
      console.log('  Auto-merge is enabled. Run: node .framework/bin/framework.js -p . autoplay');
    }
  } else {
    console.log('  Open a Claude Code session and tell it:');
    console.log('  "Read agent-prompts/' + promptFiles[action] + ' for your instructions.');
    console.log('   Your assigned feature is ' + feature.id + '."\n');
  }
}

// Orchestrator fallback auto mode — full pipeline including PR/merge
function runOrchestratorMode(projectRoot) {
  var config = loadConfig(projectRoot);
  var retries = {};
  var escalated = new Set();

  console.log('=== AUTOPLAY: ORCHESTRATOR MODE ===');
  console.log('Model: ' + config.model);
  console.log('Max retries: ' + config.maxRetries);
  console.log('Safe mode: ' + config.safeMode);
  console.log('');

  runAutoImport(config);

  while (true) {
    var next = getNextAction(projectRoot, escalated);
    if (!next) {
      var all = features.list(projectRoot);
      var complete = all.filter(function(f) { return f.status === 'complete'; }).length;
      console.log('\nNo actionable features. ' + complete + '/' + all.length + ' complete.');
      if (escalated.size > 0) {
        console.log('Escalated (need human): ' + Array.from(escalated).join(', '));
      }
      break;
    }

    var action = next.action;
    var feature = next.feature;

    // PR step — orchestrator handles this directly
    if (action === 'pr') {
      createPR(feature, config);
      continue;
    }

    // Merge step — orchestrator handles this directly
    if (action === 'merge') {
      if (!mergePR(feature, config)) {
        // Safe mode or merge failed — stop pipeline for this feature
        if (config.safeMode) {
          console.log(feature.id + ': safe mode — skipping merge, moving to next feature.');
          escalated.add(feature.id);
        }
      }
      continue;
    }

    // Retry tracking for dev on rejection
    if (action === 'dev' && feature.status === 'needs-revision') {
      retries[feature.id] = (retries[feature.id] || 0) + 1;
      if (retries[feature.id] > config.maxRetries) {
        console.log(feature.id + ' rejected ' + retries[feature.id] + ' times. Escalating.');
        escalated.add(feature.id);
        continue;
      }
      console.log(feature.id + ': retry ' + retries[feature.id] + '/' + config.maxRetries);
    }

    var statusBefore = feature.status;
    runAgentSession(action, feature, config);

    // Reload and check
    var updated = features.get(projectRoot, feature.id);
    if (updated && updated.status === statusBefore) {
      console.log(feature.id + ': status unchanged after ' + action + '. Agent may have stalled.');
      retries[feature.id] = (retries[feature.id] || 0) + 1;
      if (retries[feature.id] > config.maxRetries) {
        escalated.add(feature.id);
      }
    }
  }
}

module.exports = {
  loadConfig,
  getNextAction,
  generateTeamInstructions,
  runOrchestratorMode,
  runGuidedMode,
  buildAgentPrompt,
  createPR,
  mergePR,
  runAutoImport
};
