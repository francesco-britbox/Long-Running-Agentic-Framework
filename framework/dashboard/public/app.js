// Agentic Framework Dashboard — Client

var STATUSES = [
  'pending', 'in-dev', 'ready-for-review', 'approved',
  'needs-revision', 'qa-testing', 'pr-open', 'complete'
];

var allFeatures = [];

// Initial load
fetch('/api/features')
  .then(function(r) { return r.json(); })
  .then(function(data) {
    allFeatures = data;
    render(data);
  });

// SSE live updates
var events = new EventSource('/api/events');
events.addEventListener('features', function(e) {
  allFeatures = JSON.parse(e.data);
  render(allFeatures);
});

events.addEventListener('feature-updated', function(e) {
  var updated = JSON.parse(e.data);
  var idx = allFeatures.findIndex(function(f) { return f.id === updated.id; });
  if (idx !== -1) {
    allFeatures[idx] = updated;
  } else {
    allFeatures.push(updated);
  }
  render(allFeatures);
});

function render(featureList) {
  // Clear all columns
  STATUSES.forEach(function(status) {
    var container = document.getElementById('cards-' + status);
    if (container) container.textContent = '';
  });

  var counts = {};
  STATUSES.forEach(function(s) { counts[s] = 0; });

  featureList.forEach(function(f) {
    var status = f.status;
    counts[status] = (counts[status] || 0) + 1;

    var container = document.getElementById('cards-' + status);
    if (!container) return;

    var card = document.createElement('div');
    card.className = 'card';
    card.onclick = function() { showDetail(f); };

    var idDiv = document.createElement('div');
    idDiv.className = 'card-id';
    idDiv.textContent = f.id;

    var titleDiv = document.createElement('div');
    titleDiv.className = 'card-title';
    titleDiv.textContent = f.description;

    card.appendChild(idDiv);
    card.appendChild(titleDiv);

    // Tags
    var meta = document.createElement('div');
    meta.className = 'card-meta';

    if (f.architecture_compliance && f.architecture_compliance.length > 0) {
      f.architecture_compliance.forEach(function(c) {
        var tag = document.createElement('span');
        tag.className = 'tag tag-compliance';
        tag.textContent = c;
        meta.appendChild(tag);
      });
    }

    if (f.openspec_change_id) {
      var osTag = document.createElement('span');
      osTag.className = 'tag tag-openspec';
      osTag.textContent = f.openspec_change_id;
      meta.appendChild(osTag);
    }

    if (f.depends_on && f.depends_on.length > 0) {
      f.depends_on.forEach(function(d) {
        var tag = document.createElement('span');
        tag.className = 'tag tag-dep';
        tag.textContent = 'needs ' + d;
        meta.appendChild(tag);
      });
    }

    card.appendChild(meta);
    container.appendChild(card);
  });

  // Update counts
  STATUSES.forEach(function(s) {
    var el = document.getElementById('count-' + s);
    if (el) el.textContent = counts[s] || 0;
  });

  var complete = counts.complete || 0;
  var total = featureList.length;
  document.getElementById('stat-complete').textContent = complete;
  document.getElementById('stat-total').textContent = total;
}

function showDetail(f) {
  document.getElementById('modal-title').textContent = f.id + ': ' + f.description;

  var body = document.getElementById('modal-body');
  body.textContent = '';

  var table = document.createElement('table');
  addRow(table, 'Status', f.status);
  addRow(table, 'Category', f.category || '-');
  addRow(table, 'Assigned to', f.assigned_to);
  addRow(table, 'Reviewed by', f.reviewed_by);
  addRow(table, 'Tested by', f.tested_by);
  addRow(table, 'Passes', f.passes ? 'Yes' : 'No');
  addRow(table, 'OpenSpec', f.openspec_reference || '-');
  if (f.depends_on && f.depends_on.length > 0) {
    addRow(table, 'Depends on', f.depends_on.join(', '));
  }
  body.appendChild(table);

  if (f.requirements && f.requirements.length > 0) {
    body.appendChild(makeSection('Requirements', f.requirements));
  }
  if (f.architecture_compliance && f.architecture_compliance.length > 0) {
    body.appendChild(makeSection('Architecture Compliance', f.architecture_compliance));
  }
  if (f.verification_steps && f.verification_steps.length > 0) {
    body.appendChild(makeSection('Verification Steps', f.verification_steps));
  }
  if (f.notes) {
    var h = document.createElement('h3');
    h.textContent = 'Notes';
    h.style.cssText = 'margin-top:16px;font-size:14px;color:#f0f6fc';
    body.appendChild(h);
    var p = document.createElement('p');
    p.textContent = f.notes;
    p.style.cssText = 'font-size:13px;white-space:pre-wrap';
    body.appendChild(p);
  }

  document.getElementById('detail-modal').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('detail-modal').classList.add('hidden');
}

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') closeModal();
});

function addRow(table, label, value) {
  var tr = document.createElement('tr');
  var tdLabel = document.createElement('td');
  tdLabel.textContent = label;
  var tdValue = document.createElement('td');
  tdValue.textContent = value || '-';
  tr.appendChild(tdLabel);
  tr.appendChild(tdValue);
  table.appendChild(tr);
}

// OpenSpec Changes summary panel
function loadOpenspecChanges() {
  fetch('/api/openspec/changes')
    .then(function(r) { return r.json(); })
    .then(function(changes) {
      renderOpenspecPanel(changes);
    });
}

function renderOpenspecPanel(changes) {
  var panel = document.getElementById('openspec-panel');
  if (!panel) return;

  if (changes.length === 0) {
    panel.classList.add('hidden');
    return;
  }

  panel.classList.remove('hidden');
  var container = document.getElementById('openspec-changes');
  container.textContent = '';

  for (var i = 0; i < changes.length; i++) {
    var c = changes[i];
    var item = document.createElement('div');
    item.className = 'openspec-change';

    var name = document.createElement('span');
    name.className = 'openspec-change-name';
    name.textContent = c.name;

    var progress = document.createElement('span');
    progress.className = 'openspec-change-progress';
    var allDone = c.complete === c.total;
    progress.textContent = c.complete + '/' + c.total;
    if (allDone) progress.classList.add('openspec-done');

    item.appendChild(name);
    item.appendChild(progress);
    container.appendChild(item);
  }
}

// Load on start and refresh with SSE
loadOpenspecChanges();
events.addEventListener('features', function() { loadOpenspecChanges(); });
events.addEventListener('feature-updated', function() { loadOpenspecChanges(); });

function makeSection(title, items) {
  var frag = document.createDocumentFragment();
  var h = document.createElement('h3');
  h.textContent = title;
  h.style.cssText = 'margin-top:16px;font-size:14px;color:#f0f6fc';
  frag.appendChild(h);
  var ul = document.createElement('ul');
  items.forEach(function(item) {
    var li = document.createElement('li');
    li.textContent = item;
    ul.appendChild(li);
  });
  frag.appendChild(ul);
  return frag;
}
