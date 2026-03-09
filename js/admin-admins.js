// =============================================
//   MELLOW UP — admin-admins.js
//   Admin Account Management
// =============================================

function renderAdminManagement() {
  const container = el('admin-management-list'); if (!container) return;
  const admins = DB.getArr('admins');
  if (!admins.length) {
    container.innerHTML = '<p style="color:var(--text-muted);font-size:13px">ไม่มีข้อมูล</p>';
    return;
  }
  container.innerHTML = admins.map((a, idx) => {
    const isSelf  = currentAdmin && currentAdmin.id === a.id;
    const roleTH  = a.role === 'superadmin' ? 'ซูเปอร์แอดมิน' : 'แอดมิน';
    const roleClr = a.role === 'superadmin' ? 'upcoming' : 'checked-in';
    return `
      <div class="amc-item" id="amc-${a.id}">
        <div class="amc-avatar">${a.name.charAt(0).toUpperCase()}</div>
        <div class="amc-info">
          <div class="amc-name">
            ${a.name}
            ${isSelf ? '<span class="amc-you">คุณ</span>' : ''}
            <span class="status-badge ${roleClr}" style="font-size:10px;padding:2px 8px">${roleTH}</span>
          </div>
          <div class="amc-email">${a.email}</div>
        </div>
        <div class="amc-actions">
          <button class="btn-outline small" onclick="toggleEditAdminPw('${a.id}')">🔑</button>
          ${!isSelf ? `<button class="btn-danger" onclick="deleteAdmin('${a.id}')">🗑</button>` : ''}
        </div>
      </div>
      <div id="editpw-${a.id}" class="edit-pw-panel hidden">
        <div>
          <label class="form-label" style="font-size:11px">รหัสผ่านใหม่</label>
          <input type="password" class="form-input" id="npw-${a.id}" placeholder="อย่างน้อย 6 ตัวอักษร">
        </div>
        <button class="btn-primary small" onclick="saveAdminPw('${a.id}')">บันทึก</button>
        <button class="btn-outline small" onclick="toggleEditAdminPw('${a.id}')">ยกเลิก</button>
      </div>`;
  }).join('');
}

function toggleEditAdminPw(adminId) {
  const panel = el('editpw-' + adminId);
  if (!panel) return;
  const isHidden = panel.classList.contains('hidden');
  document.querySelectorAll('.edit-pw-panel').forEach(p => p.classList.add('hidden'));
  if (isHidden) { panel.classList.remove('hidden'); el('npw-' + adminId)?.focus(); }
}

function saveAdminPw(adminId) {
  const newPw = el('npw-' + adminId)?.value.trim();
  if (!newPw || newPw.length < 6) { showToast('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'); return; }
  const admins = DB.getArr('admins');
  const adm    = admins.find(a => a.id === adminId);
  if (adm) {
    adm.password = newPw;
    DB.set('admins', admins);
    if (currentAdmin?.id === adminId) currentAdmin.password = newPw;
    addAdminLog('admin', 'เปลี่ยนรหัสผ่าน', 'แอดมิน: ' + adm.name);
    toggleEditAdminPw(adminId);
    showToast('เปลี่ยนรหัสผ่านของ ' + adm.name + ' แล้ว ✓');
  }
}

function addAdmin() {
  const name  = el('na-name').value.trim();
  const email = el('na-email').value.trim();
  const pw    = el('na-password').value;
  const role  = el('na-role').value;
  if (!name || !email || !pw) { showToast('กรุณากรอกข้อมูลให้ครบ'); return; }
  if (pw.length < 6)          { showToast('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'); return; }
  const admins = DB.getArr('admins');
  if (admins.find(a => a.email === email)) { showToast('อีเมลนี้ถูกใช้โดยแอดมินอื่นแล้ว'); return; }
  const newAdmin = {
    id: 'adm' + Date.now(), name, email, password: pw, role,
    createdAt: new Date().toISOString().split('T')[0],
  };
  admins.push(newAdmin);
  DB.set('admins', admins);
  addAdminLog('admin', 'เพิ่มแอดมินใหม่', `${name} | ${email} | ${role === 'superadmin' ? 'ซูเปอร์แอดมิน' : 'แอดมิน'}`);
  el('na-name').value = ''; el('na-email').value = ''; el('na-password').value = '';
  renderAdminManagement();
  showToast('เพิ่มแอดมิน "' + name + '" เรียบร้อยแล้ว! ✓');
}

function deleteAdmin(adminId) {
  const admins = DB.getArr('admins');
  if (admins.length <= 1) { showToast('ไม่สามารถลบแอดมินคนสุดท้ายได้!'); return; }
  const adm = admins.find(a => a.id === adminId);
  if (!adm || adm.id === currentAdmin?.id) { showToast('ไม่สามารถลบบัญชีของตัวเองได้'); return; }
  if (!confirm('ลบแอดมิน "' + adm.name + '"?')) return;
  DB.set('admins', admins.filter(a => a.id !== adminId));
  addAdminLog('admin', 'ลบแอดมิน', adm.name + ' | ' + adm.email);
  renderAdminManagement();
  showToast('ลบแอดมินเรียบร้อยแล้ว');
}

// =============================================
//   Admin Log
// =============================================

function addAdminLog(type, action, detail = '') {
  const logs = DB.getArr('adminLog');
  logs.unshift({
    id:        'log' + Date.now() + Math.random().toString(36).slice(2,5),
    timestamp: new Date().toISOString(),
    adminName: currentAdmin?.name || 'ระบบ',
    adminId:   currentAdmin?.id   || 'system',
    type, action, detail,
  });
  if (logs.length > 500) logs.splice(500);
  DB.set('adminLog', logs);
}

function populateLogFilter() {
  const sel = el('log-filter-admin'); if (!sel) return;
  const admins = DB.getArr('admins');
  const curr   = sel.value;
  sel.innerHTML = '<option value="">— แอดมินทั้งหมด —</option>'
    + admins.map(a => `<option value="${a.id}" ${curr === a.id ? 'selected' : ''}>${a.name}</option>`).join('');
}

function renderAdminLog() {
  const tbody       = el('admin-log-body'); if (!tbody) return;
  const filterAdmin = el('log-filter-admin')?.value || '';
  const filterType  = el('log-filter-type')?.value  || '';
  let logs = DB.getArr('adminLog');
  if (filterAdmin) logs = logs.filter(l => l.adminId === filterAdmin);
  if (filterType)  logs = logs.filter(l => l.type === filterType);
  if (!logs.length) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--text-muted);padding:32px">ไม่มีประวัติการใช้งาน</td></tr>';
    return;
  }
  tbody.innerHTML = logs.map(l => `<tr>
    <td style="font-size:12px;white-space:nowrap;color:var(--text-muted)">${fmtDateTime(l.timestamp)}</td>
    <td style="font-weight:500">${l.adminName}</td>
    <td><span class="log-type-badge ${l.type}">${logTypeTH(l.type)}</span>
      <span style="margin-left:6px">${l.action}</span></td>
    <td style="color:var(--text-muted);font-size:12px">${l.detail}</td>
  </tr>`).join('');
}

function clearAdminLog() {
  if (!confirm('ล้างประวัติการใช้งานทั้งหมด?')) return;
  DB.set('adminLog', []);
  renderAdminLog();
  showToast('ล้างประวัติเรียบร้อยแล้ว');
}

// =============================================
//   Reports
// =============================================

function renderAdminReports() {
  const bookings = DB.getArr('bookings');
  const users    = DB.getArr('users');
  const revenue  = bookings
    .filter(b => !['cancelled','no-show'].includes(b.status))
    .reduce((s, b) => s + (b.total || 0), 0);
  const avg = bookings.length ? Math.round(revenue / bookings.length) : 0;
  el('rep-revenue').textContent   = '฿' + revenue.toLocaleString();
  el('rep-bookings').textContent  = bookings.length;
  el('rep-customers').textContent = users.length;
  el('rep-avg').textContent       = '฿' + avg.toLocaleString();
}
