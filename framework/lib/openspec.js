/**
 * OpenSpec Integration Module
 *
 * Calls the OpenSpec CLI (--json) to read changes, then creates/updates
 * framework features via upsert keyed on (openspec_change_id, openspec_task_group).
 *
 * OpenSpec is optional. All functions check for the CLI first and return
 * a clear error if it's not installed.
 */

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const features = require('./features');
const db = require('./db');

function isInstalled() {
  var result = spawnSync('openspec', ['--version'], { encoding: 'utf8' });
  return result.status === 0;
}

function getVersion() {
  var result = spawnSync('openspec', ['--version'], { encoding: 'utf8' });
  if (result.status !== 0) return null;
  return (result.stdout || '').trim();
}

// Run an openspec CLI command with --json and return parsed output
function run(args, cwd) {
  var result = spawnSync('openspec', args, { cwd: cwd, encoding: 'utf8' });
  if (result.status !== 0) {
    return { ok: false, error: (result.stderr || result.stdout || 'openspec command failed').trim() };
  }
  try {
    return { ok: true, data: JSON.parse(result.stdout) };
  } catch (e) {
    return { ok: true, data: null, raw: (result.stdout || '').trim() };
  }
}

// List all active changes
function listChanges(projectRoot) {
  return run(['list', '--changes', '--json'], projectRoot);
}

// Get full details of a change
function showChange(changeName, projectRoot) {
  return run(['show', changeName, '--type', 'change', '--json', '--no-interactive'], projectRoot);
}

// Get implementation instructions for a change
function getInstructions(changeName, projectRoot) {
  return run(['instructions', 'apply', '--change', changeName, '--json'], projectRoot);
}

// Get artifact status for a change
function getStatus(changeName, projectRoot) {
  return run(['status', '--change', changeName, '--json'], projectRoot);
}

// Archive a completed change
function archiveChange(changeName, projectRoot) {
  var result = spawnSync('openspec', ['archive', changeName, '--yes'], {
    cwd: projectRoot, encoding: 'utf8', stdio: 'inherit'
  });
  return result.status === 0;
}

/**
 * Parse tasks.md content into task groups.
 * Each top-level numbered item becomes a group.
 * Sub-items become steps within that group.
 *
 * Example tasks.md:
 *   1. Set up auth provider
 *      - Configure OAuth endpoints
 *      - Add token refresh logic
 *   2. Create login UI
 *      - Build login form component
 *      - Add error handling
 *
 * Returns: [
 *   { title: "Set up auth provider", steps: ["Configure OAuth endpoints", "Add token refresh logic"] },
 *   { title: "Create login UI", steps: ["Build login form component", "Add error handling"] }
 * ]
 */
function parseTaskGroups(tasksContent) {
  if (!tasksContent) return [];

  var lines = tasksContent.split('\n');
  var groups = [];
  var current = null;

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];

    // Top-level numbered item: "1. Title" or "1) Title"
    var topMatch = line.match(/^\d+[.)]\s+(.+)/);
    if (topMatch) {
      if (current) groups.push(current);
      current = { title: topMatch[1].trim(), steps: [] };
      continue;
    }

    // Sub-item under current group: "  - Step" or "  * Step" or "    - Step"
    if (current) {
      var subMatch = line.match(/^\s+[-*]\s+(.+)/);
      if (subMatch) {
        // Strip checkbox syntax
        var text = subMatch[1].replace(/^\[[ x]\]\s*/i, '').trim();
        if (text) current.steps.push(text);
      }
    }
  }
  if (current) groups.push(current);

  return groups;
}

/**
 * Import one OpenSpec change into framework features.
 * Uses upsert keyed on (openspec_change_id, openspec_task_group).
 * Idempotent — safe to run multiple times.
 */
/**
 * Read change artifacts directly from filesystem.
 * Fallback when OpenSpec CLI --json fails (validation errors, etc.)
 */
function readChangeFromDisk(changeName, projectRoot) {
  var changeDir = path.join(projectRoot, 'openspec', 'changes', changeName);
  if (!fs.existsSync(changeDir)) return null;

  var result = { proposal: '', specs: '', design: '', tasks: '' };

  // Read top-level artifacts
  var proposalPath = path.join(changeDir, 'proposal.md');
  if (fs.existsSync(proposalPath)) result.proposal = fs.readFileSync(proposalPath, 'utf8');

  var designPath = path.join(changeDir, 'design.md');
  if (fs.existsSync(designPath)) result.design = fs.readFileSync(designPath, 'utf8');

  var tasksPath = path.join(changeDir, 'tasks.md');
  if (fs.existsSync(tasksPath)) result.tasks = fs.readFileSync(tasksPath, 'utf8');

  // Read all spec.md files under specs/
  var specsDir = path.join(changeDir, 'specs');
  if (fs.existsSync(specsDir)) {
    var specContents = [];
    function walkSpecs(dir) {
      var entries = fs.readdirSync(dir, { withFileTypes: true });
      for (var i = 0; i < entries.length; i++) {
        var entry = entries[i];
        var fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walkSpecs(fullPath);
        } else if (entry.name === 'spec.md') {
          specContents.push(fs.readFileSync(fullPath, 'utf8'));
        }
      }
    }
    walkSpecs(specsDir);
    result.specs = specContents.join('\n\n');
  }

  return result;
}

function importChange(changeName, projectRoot) {
  // Try OpenSpec CLI first, fall back to filesystem
  var proposal = '', specs = '', design = '', tasks = '';

  if (isInstalled()) {
    var changeResult = showChange(changeName, projectRoot);
    if (changeResult.ok && changeResult.data) {
      var changeData = changeResult.data;
      proposal = changeData.proposal || '';
      specs = changeData.specs || '';
      design = changeData.design || '';
      tasks = changeData.tasks || '';

      // If fields are objects with content, extract
      if (typeof tasks === 'object' && tasks !== null) tasks = tasks.content || '';
      if (typeof proposal === 'object' && proposal !== null) proposal = proposal.content || '';
      if (typeof specs === 'object' && specs !== null) specs = specs.content || '';
      if (typeof design === 'object' && design !== null) design = design.content || '';
    }
  }

  // Fallback: read from filesystem if CLI returned nothing useful
  if (!tasks && !specs) {
    var diskData = readChangeFromDisk(changeName, projectRoot);
    if (!diskData) {
      return { ok: false, error: 'Change "' + changeName + '" not found (checked CLI + openspec/changes/' + changeName + '/)' };
    }
    proposal = diskData.proposal;
    specs = diskData.specs;
    design = diskData.design;
    tasks = diskData.tasks;
  }

  // Parse task groups
  var taskGroups = parseTaskGroups(tasks);

  // If no parseable task groups, create a single feature for the whole change
  if (taskGroups.length === 0) {
    taskGroups = [{ title: changeName, steps: [] }];
  }

  // Extract requirements from specs (lines matching GIVEN/WHEN/THEN or requirement patterns)
  var specRequirements = [];
  var specScenarios = [];
  if (specs) {
    var specLines = specs.split('\n');
    for (var i = 0; i < specLines.length; i++) {
      var sline = specLines[i].trim();
      if (sline.match(/^###?\s+Requirement:/i)) {
        specRequirements.push(sline.replace(/^###?\s+Requirement:\s*/i, '').trim());
      }
      if (sline.match(/^-\s+(GIVEN|WHEN|THEN|AND)\b/i)) {
        specScenarios.push(sline.replace(/^-\s+/, '').trim());
      }
    }
  }

  db.open(projectRoot);

  var created = [];
  var updated = [];

  for (var g = 0; g < taskGroups.length; g++) {
    var group = taskGroups[g];
    var changeId = changeName;
    var taskGroup = g + 1;

    // Check if feature already exists for this (changeId, taskGroup)
    var existing = findByOpenspecKey(projectRoot, changeId, taskGroup);

    var featureData = {
      category: changeName,
      description: group.title,
      openspec_reference: 'openspec/changes/' + changeName,
      openspec_change_id: changeId,
      openspec_task_group: taskGroup,
      requirements: specRequirements.length > 0 ? specRequirements : group.steps,
      verification_steps: specScenarios.length > 0
        ? specScenarios.map(function(s) { return s + ' verified'; })
        : group.steps.map(function(s) { return s + ' works correctly'; }),
      notes: 'Imported from OpenSpec change: ' + changeName
    };

    if (existing) {
      // Update existing feature (preserve status, passes, id)
      features.update(projectRoot, existing.id, featureData);
      updated.push(existing.id);
    } else {
      // Create new feature
      var id = features.nextId(projectRoot);
      featureData.id = id;
      featureData.status = 'pending';
      featureData.depends_on = [];
      featureData.assigned_to = 'dev-agent';
      featureData.reviewed_by = 'code-reviewer';
      featureData.tested_by = 'qa-agent';
      featureData.passes = false;
      features.create(projectRoot, featureData);
      created.push(id);
    }
  }

  // Set up sequential dependencies within the same change
  var allIds = [];
  for (var g = 0; g < taskGroups.length; g++) {
    var feat = findByOpenspecKey(projectRoot, changeName, g + 1);
    if (feat) allIds.push(feat.id);
  }
  for (var i = 1; i < allIds.length; i++) {
    var feat = features.get(projectRoot, allIds[i]);
    if (feat && !feat.depends_on.includes(allIds[i - 1])) {
      var deps = feat.depends_on.concat([allIds[i - 1]]);
      features.update(projectRoot, allIds[i], { depends_on: deps });
    }
  }

  return { ok: true, created: created, updated: updated, total: taskGroups.length };
}

/**
 * Import all active changes.
 */
function importAll(projectRoot) {
  if (!isInstalled()) {
    return { ok: false, error: 'OpenSpec CLI not installed. Run: npm install -g @fission-ai/openspec@latest' };
  }

  // Check OpenSpec project exists before calling CLI
  var changesDir = path.join(projectRoot, 'openspec', 'changes');
  if (!fs.existsSync(changesDir)) {
    return { ok: false, error: 'No OpenSpec project found. Run "openspec init" first.' };
  }

  // Read active changes from filesystem (skip archived)
  var entries = fs.readdirSync(changesDir, { withFileTypes: true });
  var changes = entries
    .filter(function(e) { return e.isDirectory() && e.name !== 'archive'; })
    .map(function(e) { return e.name; });

  if (changes.length === 0) {
    return { ok: true, results: [], message: 'No active changes to import.' };
  }

  var results = [];
  for (var i = 0; i < changes.length; i++) {
    var r = importChange(changes[i], projectRoot);
    results.push({ change: changes[i], result: r });
  }

  return { ok: true, results: results };
}

/**
 * Check if all features from a change are complete, and archive if so.
 */
function maybeArchive(projectRoot, completedFeatureId) {
  var feature = features.get(projectRoot, completedFeatureId);
  if (!feature || !feature.openspec_change_id) return false;

  var changeId = feature.openspec_change_id;

  // Find ALL features from this change
  var all = features.list(projectRoot);
  var siblings = all.filter(function(f) { return f.openspec_change_id === changeId; });

  // Only archive if ALL siblings are complete
  if (!siblings.every(function(f) { return f.status === 'complete'; })) return false;

  return archiveChange(changeId, projectRoot);
}

// Find a feature by OpenSpec upsert key
function findByOpenspecKey(projectRoot, changeId, taskGroup) {
  var d = db.get(projectRoot);
  var row = d.prepare(
    'SELECT * FROM features WHERE openspec_change_id = ? AND openspec_task_group = ?'
  ).get(changeId, taskGroup);
  if (!row) return null;
  // Use the features module deserialize via get
  return features.get(projectRoot, row.id);
}

module.exports = {
  isInstalled,
  getVersion,
  listChanges,
  showChange,
  getInstructions,
  getStatus,
  archiveChange,
  importChange,
  importAll,
  maybeArchive,
  parseTaskGroups
};
