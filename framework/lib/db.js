const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

let _db = null;

function dbPath(projectRoot) {
  return path.join(projectRoot, '.framework', 'framework.db');
}

function open(projectRoot) {
  if (_db) return _db;

  const dbFile = dbPath(projectRoot);
  const dir = path.dirname(dbFile);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  _db = new Database(dbFile);
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');

  // Migrate existing DBs first (adds columns schema.sql index depends on)
  const tableExists = _db.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='features'"
  ).get();
  if (tableExists) migrate(_db);

  // Run schema (creates tables + indexes for fresh DBs, no-op for existing)
  const schemaPath = path.join(__dirname, '..', 'schema.sql');
  if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, 'utf8');
    _db.exec(schema);
  }

  return _db;
}

function migrate(database) {
  // Check if openspec columns exist, add them if not
  const cols = database.prepare("PRAGMA table_info(features)").all().map(c => c.name);
  if (!cols.includes('openspec_change_id')) {
    database.exec("ALTER TABLE features ADD COLUMN openspec_change_id TEXT NOT NULL DEFAULT ''");
  }
  if (!cols.includes('openspec_task_group')) {
    database.exec("ALTER TABLE features ADD COLUMN openspec_task_group INTEGER NOT NULL DEFAULT 0");
  }
  // Ensure partial unique index exists (safe to re-run, CREATE IF NOT EXISTS)
  database.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_openspec_upsert
      ON features(openspec_change_id, openspec_task_group)
      WHERE openspec_change_id != ''
  `);
  // Ensure OpenSpec config defaults exist
  database.exec("INSERT OR IGNORE INTO config (key, value) VALUES ('openspec_auto_archive', 'false')");
  database.exec("INSERT OR IGNORE INTO config (key, value) VALUES ('openspec_auto_import', 'false')");
}

function close() {
  if (_db) {
    _db.close();
    _db = null;
  }
}

function get(projectRoot) {
  return open(projectRoot);
}

// Export features to JSON file (portability)
function exportFeatures(projectRoot, outputPath) {
  const db = get(projectRoot);
  const rows = db.prepare('SELECT * FROM features ORDER BY id').all();

  const features = rows.map(r => ({
    id: r.id,
    category: r.category,
    description: r.description,
    status: r.status,
    depends_on: JSON.parse(r.depends_on),
    openspec_reference: r.openspec_reference,
    requirements: JSON.parse(r.requirements),
    architecture_compliance: JSON.parse(r.architecture_compliance),
    verification_steps: JSON.parse(r.verification_steps),
    assigned_to: r.assigned_to,
    reviewed_by: r.reviewed_by,
    tested_by: r.tested_by,
    passes: r.passes === 1,
    openspec_change_id: r.openspec_change_id || '',
    openspec_task_group: r.openspec_task_group || 0,
    notes: r.notes
  }));

  const out = outputPath || path.join(projectRoot, 'architecture', 'feature-requirements.json');
  fs.writeFileSync(out, JSON.stringify({ features }, null, 2), 'utf8');
  return features;
}

// Import features from JSON file
function importFeatures(projectRoot, inputPath) {
  const db = get(projectRoot);
  const filePath = inputPath || path.join(projectRoot, 'architecture', 'feature-requirements.json');
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const features = data.features || [];

  const upsert = db.prepare(`
    INSERT INTO features (id, category, description, status, depends_on, openspec_reference,
      requirements, architecture_compliance, verification_steps, assigned_to, reviewed_by,
      tested_by, passes, openspec_change_id, openspec_task_group, notes)
    VALUES (@id, @category, @description, @status, @depends_on, @openspec_reference,
      @requirements, @architecture_compliance, @verification_steps, @assigned_to, @reviewed_by,
      @tested_by, @passes, @openspec_change_id, @openspec_task_group, @notes)
    ON CONFLICT(id) DO UPDATE SET
      category=@category, description=@description, status=@status, depends_on=@depends_on,
      openspec_reference=@openspec_reference, requirements=@requirements,
      architecture_compliance=@architecture_compliance, verification_steps=@verification_steps,
      assigned_to=@assigned_to, reviewed_by=@reviewed_by, tested_by=@tested_by,
      passes=@passes, openspec_change_id=@openspec_change_id,
      openspec_task_group=@openspec_task_group, notes=@notes
  `);

  const insertMany = db.transaction((items) => {
    for (const f of items) {
      upsert.run({
        id: f.id,
        category: f.category || '',
        description: f.description || '',
        status: f.status || 'pending',
        depends_on: JSON.stringify(f.depends_on || []),
        openspec_reference: f.openspec_reference || '',
        openspec_change_id: f.openspec_change_id || '',
        openspec_task_group: f.openspec_task_group || 0,
        requirements: JSON.stringify(f.requirements || []),
        architecture_compliance: JSON.stringify(f.architecture_compliance || []),
        verification_steps: JSON.stringify(f.verification_steps || []),
        assigned_to: f.assigned_to || 'dev-agent',
        reviewed_by: f.reviewed_by || 'code-reviewer',
        tested_by: f.tested_by || 'qa-agent',
        passes: f.passes ? 1 : 0,
        notes: f.notes || ''
      });
    }
  });

  insertMany(features);
  return features.length;
}

module.exports = { open, close, get, dbPath, exportFeatures, importFeatures };
