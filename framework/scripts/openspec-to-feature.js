#!/usr/bin/env node

/**
 * DEPRECATED — Use the framework CLI instead:
 *   node .framework/bin/framework.js -p . openspec import <change-name>
 *   node .framework/bin/framework.js -p . openspec import --all
 *
 * This shim forwards to the new command for backwards compatibility.
 * It will be removed in v2.
 */

console.warn('DEPRECATED: Use "node .framework/bin/framework.js -p . openspec import <change>" instead.');
console.warn('This script will be removed in v2.\n');

const { spawnSync } = require('child_process');
const path = require('path');

const args = process.argv.slice(2);
if (args.length === 0 || args[0] === '--help') {
  console.log('Usage (new):');
  console.log('  node .framework/bin/framework.js -p . openspec import <change-name>');
  console.log('  node .framework/bin/framework.js -p . openspec import --all');
  console.log('');
  console.log('Usage (legacy, this script):');
  console.log('  node scripts/openspec-to-feature.js <change-name>');
  process.exit(0);
}

// Forward: treat first arg as change name
var changeName = args[0];
var projectIdx = args.indexOf('--project');
var projectRoot = projectIdx !== -1 && args[projectIdx + 1]
  ? path.resolve(args[projectIdx + 1])
  : process.cwd();

var fwCli = path.join(projectRoot, '.framework', 'bin', 'framework.js');
spawnSync('node', [fwCli, '-p', projectRoot, 'openspec', 'import', changeName], {
  stdio: 'inherit'
});
