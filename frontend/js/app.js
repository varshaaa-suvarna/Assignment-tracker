const API = 'http://localhost:5000/api';

// ===== NAVIGATION =====
function showSection(name) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(name).classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(b => {
    if (b.textContent.toLowerCase().includes(name === 'dashboard' ? 'dashboard' : name === 'create' ? 'create' : 'submit')) {
      b.classList.add('active');
    }
  });
  if (name === 'dashboard') loadAssignments();
  if (name === 'submit') loadActiveAssignments();
}

// ===== LOAD ALL ASSIGNMENTS =====
async function loadAssignments() {
  const search = document.getElementById('searchInput').value;
  const status = document.getElementById('filterStatus').value;
  const sort = document.getElementById('filterSort').value;

  let url = `${API}/assignments?`;
  if (search) url += `search=${encodeURIComponent(search)}&`;
  if (status) url += `status=${status}&`;
  if (sort) url += `sort=${sort}`;

  const list = document.getElementById('assignmentList');
  list.innerHTML = '<div class="loading">Loading assignments...</div>';

  try {
    const res = await fetch(url);
    const data = await res.json();
    const assignments = data.assignments || [];

    const total = assignments.length;
    const active = assignments.filter(a => a.status === 'active').length;
    const closed = assignments.filter(a => a.status === 'closed').length;

    document.getElementById('totalCount').textContent = total;
    document.getElementById('activeCount').textContent = active;
    document.getElementById('closedCount').textContent = closed;

    if (assignments.length === 0) {
      list.innerHTML = `<div class="empty-state">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none"><rect width="48" height="48" rx="10" fill="#f1f5f9"/><path d="M14 16h20M14 24h14M14 32h10" stroke="#94a3b8" stroke-width="2.5" stroke-linecap="round"/></svg>
        <p>No assignments found.</p>
      </div>`;
      return;
    }

    list.innerHTML = assignments.map(a => renderCard(a)).join('');
  } catch (err) {
    list.innerHTML = `<div class="empty-state"><p>⚠️ Could not connect to the server. Make sure the backend is running on port 5000.</p></div>`;
  }
}

function renderCard(a) {
  const due = new Date(a.dueDate);
  const now = new Date();
  const overdue = now > due;
  const dueStr = due.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

  return `
  <div class="assignment-card" onclick="viewAssignment('${a._id}')">
    <div class="card-top">
      <div class="card-title">${escHtml(a.title)}</div>
      <span class="card-subject">${escHtml(a.subject)}</span>
    </div>
    <p class="card-desc">${escHtml(a.description)}</p>
    <div class="card-meta">
      <span>👤 <strong>${escHtml(a.instructor)}</strong></span>
      <span>📅 Due: <strong>${dueStr}</strong> ${overdue ? '<span style="color:#ef4444">(Overdue)</span>' : ''}</span>
    </div>
    <div class="card-footer">
      <div style="display:flex;align-items:center;gap:8px;">
        <span class="status-badge ${a.status}">${a.status.charAt(0).toUpperCase() + a.status.slice(1)}</span>
        <span class="submission-count">📄 ${a.submissionCount || 0} submission${a.submissionCount !== 1 ? 's' : ''}</span>
      </div>
      <div class="card-actions" onclick="event.stopPropagation()">
        <button class="btn-icon" onclick="openEdit('${a._id}', event)">✏️ Edit</button>
        <button class="btn-icon delete" onclick="deleteAssignment('${a._id}', event)">🗑️ Delete</button>
      </div>
    </div>
  </div>`;
}

// ===== VIEW ASSIGNMENT + SUBMISSIONS =====
async function viewAssignment(id) {
  const modal = document.getElementById('modal');
  const content = document.getElementById('modalContent');
  content.innerHTML = '<div style="text-align:center;padding:40px;color:#64748b">Loading...</div>';
  modal.style.display = 'flex';
  modal.classList.add('open');

  try {
    const [aRes, sRes] = await Promise.all([
      fetch(`${API}/assignments/${id}`),
      fetch(`${API}/assignments/${id}/submissions`)
    ]);
    const { assignment } = await aRes.json();
    const { submissions } = await sRes.json();

    const due = new Date(assignment.dueDate);
    const dueStr = due.toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' });

    content.innerHTML = `
      <span class="modal-subject">${escHtml(assignment.subject)}</span>
      <div class="modal-title">${escHtml(assignment.title)}</div>
      <span class="status-badge ${assignment.status}" style="margin-bottom:16px;display:inline-flex">${assignment.status}</span>
      <p style="color:#64748b;font-size:0.9rem;margin-bottom:12px;">${escHtml(assignment.description)}</p>
      <p style="font-size:0.85rem;color:#64748b;">👤 ${escHtml(assignment.instructor)} &nbsp;|&nbsp; 📅 Due: ${dueStr}</p>

      <div class="modal-section-title">Submissions (${submissions.length})</div>
      ${submissions.length === 0
        ? '<div class="no-submissions">No submissions yet.</div>'
        : submissions.map(s => `
          <div class="submission-item">
            <div class="s-header">
              <span class="s-name">👤 ${escHtml(s.studentName)}</span>
              <span class="s-time">${new Date(s.submittedAt).toLocaleString('en-IN')}</span>
            </div>
            <div class="s-email">${escHtml(s.studentEmail)}</div>
            <div class="s-content">${escHtml(s.content)}</div>
          </div>`).join('')
      }`;
  } catch (err) {
    content.innerHTML = '<p style="color:red">Failed to load assignment details.</p>';
  }
}

function closeModal(e) {
  if (e.target === document.getElementById('modal')) {
    document.getElementById('modal').style.display = 'none';
  }
}

// ===== CREATE ASSIGNMENT =====
async function createAssignment() {
  const msg = document.getElementById('createMsg');
  const body = {
    title: document.getElementById('title').value.trim(),
    subject: document.getElementById('subject').value.trim(),
    instructor: document.getElementById('instructor').value.trim(),
    description: document.getElementById('description').value.trim(),
    dueDate: document.getElementById('dueDate').value,
  };

  if (!body.title || !body.subject || !body.instructor || !body.description || !body.dueDate) {
    showMsg(msg, 'error', 'All fields are required.');
    return;
  }

  try {
    const res = await fetch(`${API}/assignments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (res.ok) {
      showMsg(msg, 'success', `✅ Assignment "${data.assignment.title}" created successfully!`);
      ['title', 'subject', 'instructor', 'description', 'dueDate'].forEach(id => document.getElementById(id).value = '');
    } else {
      showMsg(msg, 'error', data.message || data.error || 'Failed to create assignment.');
    }
  } catch (err) {
    showMsg(msg, 'error', 'Server connection error. Is the backend running?');
  }
}

// ===== LOAD ACTIVE ASSIGNMENTS FOR SUBMIT DROPDOWN =====
async function loadActiveAssignments() {
  const sel = document.getElementById('assignmentSelect');
  sel.innerHTML = '<option value="">Loading...</option>';

  try {
    const res = await fetch(`${API}/assignments?status=active`);
    const data = await res.json();
    const assignments = data.assignments || [];

    sel.innerHTML = '<option value="">-- Choose an active assignment --</option>';
    assignments.forEach(a => {
      const due = new Date(a.dueDate).toLocaleDateString('en-IN');
      const opt = document.createElement('option');
      opt.value = a._id;
      opt.textContent = `${a.title} (${a.subject}) — Due: ${due}`;
      sel.appendChild(opt);
    });

    if (assignments.length === 0) {
      sel.innerHTML = '<option value="">No active assignments available</option>';
    }
  } catch (err) {
    sel.innerHTML = '<option value="">Could not load assignments</option>';
  }
}

async function onAssignmentSelect() {
  const id = document.getElementById('assignmentSelect').value;
  const infoBox = document.getElementById('assignmentInfo');
  if (!id) { infoBox.style.display = 'none'; return; }

  try {
    const res = await fetch(`${API}/assignments/${id}`);
    const { assignment } = await res.json();
    const due = new Date(assignment.dueDate).toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' });
    infoBox.style.display = 'block';
    infoBox.innerHTML = `<strong>${escHtml(assignment.title)}</strong> &nbsp;|&nbsp; ${escHtml(assignment.subject)}<br>
      📅 Due: ${due} &nbsp;|&nbsp; 👤 ${escHtml(assignment.instructor)}<br>
      <span style="font-size:0.82rem;margin-top:4px;display:block">${escHtml(assignment.description)}</span>`;
  } catch (_) {
    infoBox.style.display = 'none';
  }
}

// ===== SUBMIT ASSIGNMENT =====
async function submitAssignment() {
  const msg = document.getElementById('submitMsg');
  const assignmentId = document.getElementById('assignmentSelect').value;
  const body = {
    studentName: document.getElementById('studentName').value.trim(),
    studentEmail: document.getElementById('studentEmail').value.trim(),
    content: document.getElementById('submissionContent').value.trim(),
  };

  if (!assignmentId) { showMsg(msg, 'error', 'Please select an assignment.'); return; }
  if (!body.studentName || !body.studentEmail || !body.content) {
    showMsg(msg, 'error', 'All fields are required.');
    return;
  }

  try {
    const res = await fetch(`${API}/assignments/${assignmentId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (res.ok) {
      showMsg(msg, 'success', `✅ Submission successful! Your work has been recorded.`);
      ['studentName', 'studentEmail', 'submissionContent'].forEach(id => document.getElementById(id).value = '');
      document.getElementById('assignmentSelect').value = '';
      document.getElementById('assignmentInfo').style.display = 'none';
    } else {
      showMsg(msg, 'error', data.message || data.error || 'Submission failed.');
    }
  } catch (err) {
    showMsg(msg, 'error', 'Server connection error. Is the backend running?');
  }
}

// ===== DELETE ASSIGNMENT =====
async function deleteAssignment(id, event) {
  event.stopPropagation();
  if (!confirm('Delete this assignment and all its submissions?')) return;

  try {
    const res = await fetch(`${API}/assignments/${id}`, { method: 'DELETE' });
    if (res.ok) loadAssignments();
    else alert('Failed to delete assignment.');
  } catch (err) {
    alert('Server connection error.');
  }
}

// ===== EDIT ASSIGNMENT (inline modal) =====
async function openEdit(id, event) {
  event.stopPropagation();

  try {
    const res = await fetch(`${API}/assignments/${id}`);
    const { assignment: a } = await res.json();

    const modal = document.getElementById('modal');
    const content = document.getElementById('modalContent');
    const dueDateLocal = new Date(a.dueDate).toISOString().slice(0, 16);

    content.innerHTML = `
      <div class="modal-title">✏️ Edit Assignment</div>
      <div class="form-grid" style="margin-top:16px">
        <div class="form-group">
          <label>Title</label>
          <input id="e_title" value="${escHtml(a.title)}" />
        </div>
        <div class="form-group">
          <label>Subject</label>
          <input id="e_subject" value="${escHtml(a.subject)}" />
        </div>
        <div class="form-group">
          <label>Instructor</label>
          <input id="e_instructor" value="${escHtml(a.instructor)}" />
        </div>
        <div class="form-group">
          <label>Due Date</label>
          <input type="datetime-local" id="e_dueDate" value="${dueDateLocal}" />
        </div>
        <div class="form-group full-width">
          <label>Description</label>
          <textarea id="e_description" rows="4">${escHtml(a.description)}</textarea>
        </div>
      </div>
      <div id="editMsg" class="msg-box" style="display:none"></div>
      <div style="display:flex;gap:12px;margin-top:8px">
        <button class="btn btn-primary" onclick="saveEdit('${a._id}')">Save Changes</button>
        <button class="btn" style="background:#f1f5f9;color:#64748b" onclick="document.getElementById('modal').style.display='none'">Cancel</button>
      </div>`;

    modal.style.display = 'flex';
  } catch (err) {
    alert('Could not load assignment for editing.');
  }
}

async function saveEdit(id) {
  const msg = document.getElementById('editMsg');
  const body = {
    title: document.getElementById('e_title').value.trim(),
    subject: document.getElementById('e_subject').value.trim(),
    instructor: document.getElementById('e_instructor').value.trim(),
    description: document.getElementById('e_description').value.trim(),
    dueDate: document.getElementById('e_dueDate').value,
  };

  try {
    const res = await fetch(`${API}/assignments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (res.ok) {
      showMsg(msg, 'success', '✅ Assignment updated!');
      setTimeout(() => {
        document.getElementById('modal').style.display = 'none';
        loadAssignments();
      }, 1000);
    } else {
      showMsg(msg, 'error', data.message || 'Update failed.');
    }
  } catch (err) {
    showMsg(msg, 'error', 'Server error.');
  }
}

// ===== HELPERS =====
function showMsg(el, type, text) {
  el.className = `msg-box ${type}`;
  el.textContent = text;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 5000);
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ===== INIT =====
loadAssignments();
