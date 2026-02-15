const db = require('./db');

function list(projectRoot, { status, assignedTo } = {}) {
  const d = db.get(projectRoot);
  let sql = 'SELECT * FROM features';
  const conditions = [];
  const params = {};

  if (status) {
    conditions.push('status = @status');
    params.status = status;
  }
  if (assignedTo) {
    conditions.push('assigned_to = @assignedTo');
    params.assignedTo = assignedTo;
  }

  if (conditions.length > 0) sql += ' WHERE ' + conditions.join(' AND ');
  sql += ' ORDER BY id';

  return d.prepare(sql).all(params).map(deserialize);
}

function getFeature(projectRoot, featureId) {
  const d = db.get(projectRoot);
  const row = d.prepare('SELECT * FROM features WHERE id = ?').get(featureId);
  return row ? deserialize(row) : null;
}

function create(projectRoot, feature) {
  const d = db.get(projectRoot);
  d.prepare(`
    INSERT INTO features (id, category, description, status, depends_on, openspec_reference,
      requirements, architecture_compliance, verification_steps, assigned_to, reviewed_by,
      tested_by, passes, openspec_change_id, openspec_task_group, notes)
    VALUES (@id, @category, @description, @status, @depends_on, @openspec_reference,
      @requirements, @architecture_compliance, @verification_steps, @assigned_to, @reviewed_by,
      @tested_by, @passes, @openspec_change_id, @openspec_task_group, @notes)
  `).run(serialize(feature));
  return getFeature(projectRoot, feature.id);
}

function update(projectRoot, featureId, fields) {
  const d = db.get(projectRoot);
  const allowed = ['category', 'description', 'status', 'depends_on', 'openspec_reference',
    'requirements', 'architecture_compliance', 'verification_steps', 'assigned_to',
    'reviewed_by', 'tested_by', 'passes', 'notes', 'openspec_change_id', 'openspec_task_group'];

  const sets = [];
  const params = { id: featureId };

  for (const [key, value] of Object.entries(fields)) {
    if (!allowed.includes(key)) continue;
    if (['depends_on', 'requirements', 'architecture_compliance', 'verification_steps'].includes(key)) {
      params[key] = JSON.stringify(value);
    } else if (key === 'openspec_task_group') {
      params[key] = parseInt(value, 10) || 0;
    } else if (key === 'passes') {
      params[key] = value ? 1 : 0;
    } else {
      params[key] = value;
    }
    sets.push(`${key} = @${key}`);
  }

  if (sets.length === 0) return getFeature(projectRoot, featureId);

  d.prepare(`UPDATE features SET ${sets.join(', ')} WHERE id = @id`).run(params);
  return getFeature(projectRoot, featureId);
}

function remove(projectRoot, featureId) {
  const d = db.get(projectRoot);
  d.prepare('DELETE FROM features WHERE id = ?').run(featureId);
}

function nextId(projectRoot) {
  const d = db.get(projectRoot);
  const row = d.prepare('SELECT id FROM features ORDER BY id DESC LIMIT 1').get();
  if (!row) return 'FEAT-001';
  const num = parseInt(row.id.replace('FEAT-', ''), 10);
  return 'FEAT-' + String(num + 1).padStart(3, '0');
}

// Dependency resolution — topological sort
function resolveOrder(projectRoot) {
  const all = list(projectRoot);
  const map = new Map(all.map(f => [f.id, f]));
  const sorted = [];
  const visited = new Set();
  const visiting = new Set();

  function visit(id) {
    if (visited.has(id)) return;
    if (visiting.has(id)) throw new Error('Circular dependency: ' + id);
    visiting.add(id);
    const f = map.get(id);
    if (f && f.depends_on) {
      for (const dep of f.depends_on) visit(dep);
    }
    visiting.delete(id);
    visited.add(id);
    if (f) sorted.push(f);
  }

  all.forEach(f => visit(f.id));
  return sorted;
}

function depsAreMet(projectRoot, featureId) {
  const feature = getFeature(projectRoot, featureId);
  if (!feature || !feature.depends_on || feature.depends_on.length === 0) return true;
  return feature.depends_on.every(depId => {
    const dep = getFeature(projectRoot, depId);
    return dep && dep.passes === true;
  });
}

// Helpers
function serialize(f) {
  return {
    id: f.id,
    category: f.category || '',
    description: f.description || '',
    status: f.status || 'pending',
    depends_on: JSON.stringify(f.depends_on || []),
    openspec_reference: f.openspec_reference || '',
    requirements: JSON.stringify(f.requirements || []),
    architecture_compliance: JSON.stringify(f.architecture_compliance || []),
    verification_steps: JSON.stringify(f.verification_steps || []),
    assigned_to: f.assigned_to || 'dev-agent',
    reviewed_by: f.reviewed_by || 'code-reviewer',
    tested_by: f.tested_by || 'qa-agent',
    passes: f.passes ? 1 : 0,
    openspec_change_id: f.openspec_change_id || '',
    openspec_task_group: f.openspec_task_group || 0,
    notes: f.notes || ''
  };
}

function deserialize(row) {
  return {
    id: row.id,
    category: row.category,
    description: row.description,
    status: row.status,
    depends_on: JSON.parse(row.depends_on),
    openspec_reference: row.openspec_reference,
    requirements: JSON.parse(row.requirements),
    architecture_compliance: JSON.parse(row.architecture_compliance),
    verification_steps: JSON.parse(row.verification_steps),
    assigned_to: row.assigned_to,
    reviewed_by: row.reviewed_by,
    tested_by: row.tested_by,
    passes: row.passes === 1,
    openspec_change_id: row.openspec_change_id || '',
    openspec_task_group: row.openspec_task_group || 0,
    notes: row.notes,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

module.exports = { list, get: getFeature, create, update, remove, nextId, resolveOrder, depsAreMet };
