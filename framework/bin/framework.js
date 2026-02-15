#!/usr/bin/env node

const { Command } = require('commander');
const path = require('path');
const chalk = require('chalk');
const features = require('../lib/features');
const db = require('../lib/db');

const program = new Command();
const pkg = require('../package.json');

function resolveRoot(opts) {
  return path.resolve(opts.project || process.cwd());
}

program
  .name('framework')
  .description('Long-Running Agentic Framework CLI')
  .version(pkg.version)
  .option('-p, --project <path>', 'Project root directory', process.cwd());

// ── feature commands ──

const feat = program.command('feature').description('Manage features');

feat.command('list')
  .description('List all features')
  .option('-s, --status <status>', 'Filter by status')
  .option('-a, --assigned <agent>', 'Filter by assigned agent')
  .action((opts) => {
    const root = resolveRoot(program.opts());
    db.open(root);
    const items = features.list(root, { status: opts.status, assignedTo: opts.assigned });

    if (items.length === 0) {
      console.log('No features found.');
      db.close();
      return;
    }

    const statusIcon = {
      'pending': chalk.gray('o'),
      'in-dev': chalk.blue('>'),
      'ready-for-review': chalk.yellow('R'),
      'approved': chalk.cyan('A'),
      'needs-revision': chalk.red('x'),
      'qa-testing': chalk.magenta('T'),
      'pr-open': chalk.yellow('P'),
      'complete': chalk.green('*')
    };

    for (const f of items) {
      const icon = statusIcon[f.status] || '?';
      const deps = f.depends_on.length > 0 ? chalk.dim(' [needs: ' + f.depends_on.join(', ') + ']') : '';
      console.log('  ' + icon + ' ' + chalk.bold(f.id) + ': ' + f.description + ' - ' + f.status + deps);
    }
    console.log('\n  ' + items.filter(f => f.status === 'complete').length + '/' + items.length + ' complete');
    db.close();
  });

feat.command('get <id>')
  .description('Get feature details')
  .action((id) => {
    const root = resolveRoot(program.opts());
    db.open(root);
    const f = features.get(root, id);
    if (!f) {
      console.error('Feature ' + id + ' not found.');
      process.exit(1);
    }
    console.log(JSON.stringify(f, null, 2));
    db.close();
  });

feat.command('create')
  .description('Create a new feature')
  .requiredOption('-d, --description <text>', 'Feature description')
  .option('-c, --category <cat>', 'Category', '')
  .option('--depends <ids>', 'Comma-separated dependency IDs', '')
  .option('--openspec <path>', 'OpenSpec reference path', '')
  .option('--compliance <ids>', 'Comma-separated principle IDs', '')
  .action((opts) => {
    const root = resolveRoot(program.opts());
    db.open(root);
    const id = features.nextId(root);
    const f = features.create(root, {
      id,
      category: opts.category,
      description: opts.description,
      depends_on: opts.depends ? opts.depends.split(',').map(s => s.trim()) : [],
      openspec_reference: opts.openspec,
      architecture_compliance: opts.compliance ? opts.compliance.split(',').map(s => s.trim()) : []
    });
    console.log('Created ' + chalk.bold(f.id) + ': ' + f.description);
    db.close();
  });

feat.command('update <id>')
  .description('Update a feature')
  .option('-s, --status <status>', 'New status')
  .option('--passes <bool>', 'Set passes (true/false)')
  .option('-n, --notes <text>', 'Update notes')
  .action((id, opts) => {
    const root = resolveRoot(program.opts());
    db.open(root);
    const fields = {};
    if (opts.status) fields.status = opts.status;
    if (opts.passes !== undefined) fields.passes = opts.passes === 'true';
    if (opts.notes) fields.notes = opts.notes;
    const f = features.update(root, id, fields);
    if (!f) {
      console.error('Feature ' + id + ' not found.');
      process.exit(1);
    }
    console.log('Updated ' + chalk.bold(f.id) + ': status=' + f.status + ', passes=' + f.passes);
    db.close();
  });

feat.command('export')
  .description('Export features to JSON file')
  .option('-o, --output <path>', 'Output file path')
  .action((opts) => {
    const root = resolveRoot(program.opts());
    db.open(root);
    const exported = db.exportFeatures(root, opts.output);
    console.log('Exported ' + exported.length + ' features.');
    db.close();
  });

feat.command('import')
  .description('Import features from JSON file')
  .option('-i, --input <path>', 'Input file path')
  .action((opts) => {
    const root = resolveRoot(program.opts());
    db.open(root);
    const count = db.importFeatures(root, opts.input);
    console.log('Imported ' + count + ' features.');
    db.close();
  });

// ── status command ──

program.command('status')
  .description('Show pipeline status')
  .action(() => {
    const root = resolveRoot(program.opts());
    db.open(root);
    const ordered = features.resolveOrder(root);

    const counts = {};
    console.log(chalk.bold('\n=== PIPELINE STATUS ===\n'));

    const statusIcon = {
      'pending': chalk.gray('o'),
      'in-dev': chalk.blue('>'),
      'ready-for-review': chalk.yellow('R'),
      'approved': chalk.cyan('A'),
      'needs-revision': chalk.red('x'),
      'qa-testing': chalk.magenta('T'),
      'pr-open': chalk.yellow('P'),
      'complete': chalk.green('*')
    };

    for (const f of ordered) {
      counts[f.status] = (counts[f.status] || 0) + 1;
      const icon = statusIcon[f.status] || '?';
      const deps = f.depends_on.length > 0 ? chalk.dim(' [needs: ' + f.depends_on.join(', ') + ']') : '';
      console.log('  ' + icon + ' ' + chalk.bold(f.id) + ': ' + f.description + ' - ' + f.status + deps);
    }

    const total = ordered.length;
    const done = counts.complete || 0;
    console.log('\n  ' + done + '/' + total + ' complete');

    if (total > 0) {
      console.log('\n  By status:');
      for (const [s, c] of Object.entries(counts).sort()) {
        console.log('    ' + s + ': ' + c);
      }
    }
    console.log();
    db.close();
  });

// ── guided command ──

program.command('guided')
  .description('Show next step for human-in-the-loop mode')
  .action(() => {
    const root = resolveRoot(program.opts());
    db.open(root);
    const autoplay = require('../lib/autoplay');
    autoplay.runGuidedMode(root);
    db.close();
  });

// ── autoplay command ──

program.command('autoplay')
  .description('Run the full pipeline autonomously')
  .option('--mode <mode>', 'Execution mode: team or orchestrator (default: from config)')
  .option('--auto-merge', 'Auto-merge PRs (default: safe mode, stop at PR)')
  .action(async (opts) => {
    const root = resolveRoot(program.opts());
    db.open(root);
    const autoplay = require('../lib/autoplay');
    const config = autoplay.loadConfig(root);
    const mode = opts.mode || config.executionMode;

    if (mode === 'team') {
      const result = autoplay.generateTeamInstructions(root, config);
      if (result.done) {
        console.log(result.message);
      } else {
        console.log(chalk.bold('\n=== AGENT TEAM INSTRUCTIONS ===\n'));
        console.log(result.instructions);
        console.log(chalk.dim('\nCopy the above into a Claude Code session with Agent Teams enabled.'));
      }
    } else {
      if (opts.autoMerge) {
        const d = db.get(root);
        d.prepare("UPDATE config SET value = 'true' WHERE key = 'auto_merge'").run();
      }
      await autoplay.runOrchestratorMode(root);
    }
    db.close();
  });

// ── architecture commands ──

const arch = program.command('arch').description('Manage architecture files in DB');

arch.command('import')
  .description('Import architecture JSON files into DB')
  .action(() => {
    const root = resolveRoot(program.opts());
    const d = db.open(root);
    const archDir = path.join(root, 'architecture');
    const files = {
      principles: 'architecture-principles.json',
      patterns: 'architecture-patterns.json',
      standards: 'code-standards.json'
    };
    let count = 0;
    for (const [id, filename] of Object.entries(files)) {
      const filePath = path.join(archDir, filename);
      if (require('fs').existsSync(filePath)) {
        const data = require('fs').readFileSync(filePath, 'utf8');
        d.prepare('INSERT INTO architecture (id, data) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET data = ?, updated_at = datetime(\'now\')').run(id, data, data);
        console.log('  Imported ' + chalk.bold(id) + ' from ' + filename);
        count++;
      }
    }
    console.log(count + ' architecture files imported to DB.');
    db.close();
  });

arch.command('export')
  .description('Export architecture from DB to JSON files')
  .action(() => {
    const root = resolveRoot(program.opts());
    const d = db.open(root);
    const archDir = path.join(root, 'architecture');
    const mapping = {
      principles: 'architecture-principles.json',
      patterns: 'architecture-patterns.json',
      standards: 'code-standards.json'
    };
    let count = 0;
    for (const [id, filename] of Object.entries(mapping)) {
      const row = d.prepare('SELECT data FROM architecture WHERE id = ?').get(id);
      if (row) {
        require('fs').writeFileSync(path.join(archDir, filename), row.data, 'utf8');
        console.log('  Exported ' + chalk.bold(id) + ' to ' + filename);
        count++;
      }
    }
    console.log(count + ' architecture files exported.');
    db.close();
  });

// ── dashboard command ──

program.command('dashboard')
  .description('Start the Kanban dashboard')
  .option('--port <port>', 'Port number', '3333')
  .action((opts) => {
    const root = resolveRoot(program.opts());
    process.env.FRAMEWORK_PROJECT_ROOT = root;
    process.env.FRAMEWORK_PORT = opts.port;
    require('../dashboard/server');
  });

// ── openspec commands ──

const ospec = program.command('openspec').description('OpenSpec integration');

ospec.command('install')
  .description('Install or update OpenSpec CLI globally')
  .action(() => {
    const { spawnSync } = require('child_process');
    console.log(chalk.blue('Installing @fission-ai/openspec@latest...'));
    const result = spawnSync('npm', ['install', '-g', '@fission-ai/openspec@latest'], {
      stdio: 'inherit', encoding: 'utf8'
    });
    if (result.status === 0) {
      console.log(chalk.green('OpenSpec installed successfully.'));
    } else {
      console.error(chalk.red('Installation failed. Try: npm install -g @fission-ai/openspec@latest'));
    }
  });

ospec.command('refresh')
  .description('Regenerate OpenSpec tool configs in this project (runs openspec update)')
  .action(() => {
    const root = resolveRoot(program.opts());
    const openspec = require('../lib/openspec');
    if (!openspec.isInstalled()) {
      console.error(chalk.red('OpenSpec CLI not installed. Run: framework openspec install'));
      process.exit(1);
    }
    const { spawnSync } = require('child_process');
    const result = spawnSync('openspec', ['update'], { cwd: root, stdio: 'inherit', encoding: 'utf8' });
    if (result.status === 0) {
      console.log(chalk.green('OpenSpec configs refreshed.'));
    } else {
      console.error(chalk.red('openspec update failed.'));
    }
  });

ospec.command('status')
  .description('Show OpenSpec version and project status')
  .action(() => {
    const root = resolveRoot(program.opts());
    const openspec = require('../lib/openspec');
    if (!openspec.isInstalled()) {
      console.log(chalk.red('OpenSpec CLI not installed.'));
      console.log('  Install: ' + chalk.blue('framework openspec install'));
      return;
    }
    console.log(chalk.green('[OK]') + ' OpenSpec ' + openspec.getVersion());
    const changes = openspec.listChanges(root);
    if (changes.ok && changes.data) {
      var list = Array.isArray(changes.data) ? changes.data : (changes.data.changes || []);
      if (list.length > 0) {
        console.log('\nActive changes:');
        for (var i = 0; i < list.length; i++) {
          var name = typeof list[i] === 'string' ? list[i] : (list[i].name || list[i].id || '');
          if (name) {
            var st = openspec.getStatus(name, root);
            var artifacts = (st.ok && st.data && st.data.artifacts) ? st.data.artifacts : [];
            var done = artifacts.filter(function(a) { return a.status === 'complete'; }).length;
            console.log('  ' + chalk.bold(name) + ' (' + done + '/' + artifacts.length + ' artifacts)');
          }
        }
      } else {
        console.log('\nNo active changes.');
      }
    } else {
      console.log(chalk.dim('\nNo OpenSpec project found (run openspec init first).'));
    }
  });

ospec.command('import [change]')
  .description('Import OpenSpec change(s) as framework features')
  .option('--all', 'Import all active changes')
  .action((change, opts) => {
    const root = resolveRoot(program.opts());
    db.open(root);
    const openspec = require('../lib/openspec');

    if (opts.all) {
      const result = openspec.importAll(root);
      if (!result.ok) {
        console.error(chalk.red(result.error));
        db.close();
        process.exit(1);
      }
      if (result.message) {
        console.log(result.message);
        db.close();
        return;
      }
      for (var i = 0; i < result.results.length; i++) {
        var r = result.results[i];
        if (r.result.ok) {
          console.log(chalk.green('[OK]') + ' ' + r.change + ': ' + r.result.created.length + ' created, ' + r.result.updated.length + ' updated');
        } else {
          console.log(chalk.red('[ERR]') + ' ' + r.change + ': ' + r.result.error);
        }
      }
    } else if (change) {
      const result = openspec.importChange(change, root);
      if (!result.ok) {
        console.error(chalk.red(result.error));
        db.close();
        process.exit(1);
      }
      console.log('Imported ' + chalk.bold(change) + ': ' + result.created.length + ' created, ' + result.updated.length + ' updated (' + result.total + ' task groups)');
      if (result.created.length > 0) console.log('  Created: ' + result.created.join(', '));
      if (result.updated.length > 0) console.log('  Updated: ' + result.updated.join(', '));
    } else {
      console.error('Specify a change name or use --all');
      process.exit(1);
    }
    db.close();
  });

ospec.command('archive <feature-id>')
  .description('Archive the OpenSpec change for a completed feature (if all siblings complete)')
  .action((featureId) => {
    const root = resolveRoot(program.opts());
    db.open(root);
    const openspec = require('../lib/openspec');
    const f = features.get(root, featureId);
    if (!f) {
      console.error(chalk.red('Feature ' + featureId + ' not found.'));
      db.close();
      process.exit(1);
    }
    if (!f.openspec_change_id) {
      console.error(chalk.red(featureId + ' has no OpenSpec change association.'));
      db.close();
      process.exit(1);
    }
    if (openspec.maybeArchive(root, featureId)) {
      console.log(chalk.green('Archived OpenSpec change: ' + f.openspec_change_id));
    } else {
      var all = features.list(root);
      var siblings = all.filter(function(s) { return s.openspec_change_id === f.openspec_change_id; });
      var incomplete = siblings.filter(function(s) { return s.status !== 'complete'; });
      if (incomplete.length > 0) {
        console.log('Not all features from change "' + f.openspec_change_id + '" are complete:');
        for (var i = 0; i < incomplete.length; i++) {
          console.log('  ' + chalk.bold(incomplete[i].id) + ': ' + incomplete[i].status);
        }
      }
    }
    db.close();
  });

// ── config command ──

const conf = program.command('config').description('Manage configuration');

conf.command('get <key>')
  .action((key) => {
    const root = resolveRoot(program.opts());
    const d = db.open(root);
    const row = d.prepare('SELECT value FROM config WHERE key = ?').get(key);
    console.log(row ? row.value : 'Key "' + key + '" not found.');
    db.close();
  });

conf.command('set <key> <value>')
  .action((key, value) => {
    const root = resolveRoot(program.opts());
    const d = db.open(root);
    d.prepare('INSERT INTO config (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?').run(key, value, value);
    console.log(key + ' = ' + value);
    db.close();
  });

program.parse();
