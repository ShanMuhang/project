// =============================================
//   MELLOW UP — admin-tables.js
//   Admin Floor Plan & Table Management
// =============================================

function getTableLayout() {
  const saved = DB.get('tableLayout');
  if (saved) return saved;
  const defaults = {
    vip: [
      { id: 'VIP-01', seats: 6, deposit: 2000, reserved: false },
      { id: 'VIP-02', seats: 8, deposit: 3000, reserved: false },
      { id: 'VIP-03', seats: 6, deposit: 2000, reserved: true  },
      { id: 'VIP-04', seats: 10,deposit: 4000, reserved: false },
      { id: 'VIP-05', seats: 6, deposit: 2000, reserved: true  },
    ],
    regular: [
      { id:'T-01',seats:4,deposit:500,reserved:false },
      { id:'T-02',seats:4,deposit:500,reserved:true  },
      { id:'T-03',seats:4,deposit:500,reserved:false },
      { id:'T-04',seats:4,deposit:500,reserved:false },
      { id:'T-05',seats:4,deposit:500,reserved:true  },
      { id:'T-06',seats:4,deposit:500,reserved:false },
      { id:'T-07',seats:4,deposit:500,reserved:false },
      { id:'T-08',seats:4,deposit:500,reserved:true  },
      { id:'T-09',seats:4,deposit:500,reserved:false },
      { id:'T-10',seats:6,deposit:800,reserved:false },
      { id:'T-11',seats:4,deposit:500,reserved:true  },
      { id:'T-12',seats:4,deposit:500,reserved:false },
    ],
    bar: [
      { id:'B-01',seats:2,deposit:300,reserved:false },
      { id:'B-02',seats:2,deposit:300,reserved:true  },
      { id:'B-03',seats:2,deposit:300,reserved:false },
      { id:'B-04',seats:2,deposit:300,reserved:false },
      { id:'B-05',seats:2,deposit:300,reserved:false },
      { id:'B-06',seats:2,deposit:300,reserved:true  },
    ],
  };
  DB.set('tableLayout', defaults);
  return defaults;
}

function renderAdminFloorPlan() {
  const container = el('admin-floor-plan'); if (!container) return;
  const layout = getTableLayout();
  container.innerHTML = `
    <div class="afp-stage">เวที / STAGE</div>
    ${afpSection('โซน VIP', layout.vip)}
    ${afpSection('โซนทั่วไป', layout.regular)}
    ${afpSection('โซนบาร์', layout.bar)}`;
}

function afpSection(title, tables) {
  return `<div class="afp-section"><div class="afp-section-title">${title}</div><div class="afp-tables">
    ${tables.map(t => {
      const s = getTableStatus(t.id);
      return `<div class="afp-table-card ${s}" onclick="adminTableDetail('${t.id}')">
        <span>${t.id}</span>
        <span class="afp-seat-info">${t.seats} ที่นั่ง</span>
        <span class="afp-seat-info">฿${t.deposit.toLocaleString()}</span></div>`;
    }).join('')}
  </div></div>`;
}

function adminTableDetail(tableId) {
  const layout = getTableLayout();
  const all    = [...layout.vip, ...layout.regular, ...layout.bar];
  const tbl    = all.find(t => t.id === tableId); if (!tbl) return;
  const s      = getTableStatus(tableId);
  const bk     = DB.getArr('bookings').find(b =>
    b.tableId === tableId && ['upcoming','checked-in','pending-slip'].includes(b.status));

  el('table-admin-modal').querySelector('h3').textContent = 'โต๊ะ: ' + tableId;
  el('tmodal-body').innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px">
      <div><div class="form-label">รหัสโต๊ะ</div><div style="font-weight:600">${tbl.id}</div></div>
      <div><div class="form-label">สถานะ</div><span class="status-badge ${s}">${statusTH(s)}</span></div>
      <div><div class="form-label">ที่นั่ง</div><div style="font-weight:600">${tbl.seats} ที่</div></div>
      <div><div class="form-label">มัดจำ</div><div style="font-weight:600">฿${tbl.deposit.toLocaleString()}</div></div>
    </div>
    ${bk ? `<div style="background:var(--bg3);border-radius:8px;padding:16px;border:1px solid var(--border)">
      <div style="font-size:12px;color:var(--text-muted);margin-bottom:8px">การจองปัจจุบัน</div>
      <div style="font-weight:600">${bk.name} • ${bk.date} ${bk.time}</div>
      <div style="color:var(--text-muted);font-size:13px;margin-top:4px">${bk.guests} คน •
        <span class="status-badge ${bk.status}">${statusTH(bk.status)}</span></div>
      <div style="display:flex;gap:8px;margin-top:12px">
        <button class="btn-outline small" onclick="changeBookingStatus('${bk.id}','checked-in')">เช็คอิน</button>
        <button class="btn-outline small" onclick="changeBookingStatus('${bk.id}','no-show')">ไม่มา</button>
        <button class="btn-danger" onclick="deleteBooking('${bk.id}',true)">ยกเลิกการจอง</button>
      </div></div>`
    : '<p style="color:var(--text-muted);font-size:13px">ไม่มีการจองสำหรับโต๊ะนี้</p>'}`;
  el('tmodal-delete-btn').onclick = () => deleteTable(tableId);
  showModal('table-admin-modal');
}

function deleteTable(tableId) {
  if (!confirm('ลบโต๊ะ ' + tableId + '?')) return;
  const layout = getTableLayout();
  ['vip','regular','bar'].forEach(sec => { layout[sec] = layout[sec].filter(t => t.id !== tableId); });
  DB.set('tableLayout', layout);
  addAdminLog('table','ลบโต๊ะ','รหัส: ' + tableId);
  closeModal(); renderAdminFloorPlan();
  showToast('ลบโต๊ะ ' + tableId + ' เรียบร้อยแล้ว');
}

function addTable() {
  const id      = el('nt-id').value.trim().toUpperCase();
  const section = el('nt-section').value;
  const seats   = parseInt(el('nt-seats').value) || 4;
  const deposit = parseInt(el('nt-deposit').value) || 500;
  if (!id) { showToast('กรุณากรอกรหัสโต๊ะ'); return; }
  const layout = getTableLayout();
  const all    = [...layout.vip, ...layout.regular, ...layout.bar];
  if (all.find(t => t.id === id)) { showToast('รหัสโต๊ะนี้มีอยู่แล้ว!'); return; }
  layout[section].push({ id, seats, deposit, reserved: false });
  DB.set('tableLayout', layout);
  addAdminLog('table','เพิ่มโต๊ะ',`รหัส: ${id} | โซน: ${section} | ที่นั่ง: ${seats}`);
  closeModal(); el('nt-id').value = '';
  renderAdminFloorPlan(); renderMiniFloorPlan();
  showToast('เพิ่มโต๊ะ ' + id + ' เรียบร้อยแล้ว!');
}

// =============================================
//   admin-bookings.js — Booking management
// =============================================

function renderAdminBookings() {
  const tbody    = el('admin-bookings-body'); if (!tbody) return;
  const bookings = DB.getArr('bookings');
  const users    = DB.getArr('users');
  if (!bookings.length) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:var(--text-muted);padding:32px">ไม่มีการจอง</td></tr>';
    return;
  }
  tbody.innerHTML = [...bookings].reverse().map(b => {
    const user = users.find(u => u.id === b.userId);
    const name = user?.fullName || b.name || 'แขก';
    return `<tr>
      <td style="font-family:monospace;font-size:11px">${b.id.slice(-8)}</td>
      <td>${name}</td><td>${b.tableName}</td><td>${b.date}</td><td>${b.time}</td><td>${b.guests}</td>
      <td><span class="status-badge ${b.status}">${statusTH(b.status)}</span></td>
      <td>${b.slipUrl ? `<button class="btn-outline small" onclick="adminViewSlip('${b.id}')">🧾 ดู</button>` : '<span style="color:var(--text-dim)">—</span>'}</td>
      <td><div style="display:flex;gap:4px">
        <select class="form-input" style="padding:4px 8px;font-size:11px;height:32px"
          onchange="changeBookingStatus('${b.id}',this.value);this.value='${b.status}'">
          <option value="${b.status}" selected disabled>${statusTH(b.status)}</option>
          <option value="upcoming">กำลังจะมา</option>
          <option value="checked-in">เช็คอินแล้ว</option>
          <option value="no-show">ไม่มา</option>
          <option value="cancelled">ยกเลิก</option>
        </select>
        <button class="btn-danger" onclick="deleteBooking('${b.id}',false)" style="padding:4px 8px;font-size:11px">🗑</button>
      </div></td></tr>`;
  }).join('');
}

function changeBookingStatus(bookingId, newStatus) {
  const bookings = DB.getArr('bookings');
  const b = bookings.find(x => x.id === bookingId); if (!b) return;
  const old = b.status;
  b.status = newStatus;
  DB.set('bookings', bookings);
  addAdminLog('booking','เปลี่ยนสถานะ',`ID:${bookingId.slice(-6)} "${statusTH(old)}"→"${statusTH(newStatus)}"`);
  notifyStatusChange(b, newStatus);
  renderAdminBookings(); renderMiniFloorPlan();
  if (el('admin-tab-tables')?.classList.contains('active')) renderAdminFloorPlan();
  closeModal(); showToast('อัปเดตสถานะเป็น ' + statusTH(newStatus));
}

function deleteBooking(bookingId, fromModal) {
  if (!confirm('ลบการจองนี้?')) return;
  DB.set('bookings', DB.getArr('bookings').filter(b => b.id !== bookingId));
  addAdminLog('booking','ลบการจอง','ID: ' + bookingId.slice(-8));
  if (fromModal) closeModal();
  renderAdminBookings(); refreshAdminStats(); renderMiniFloorPlan();
  showToast('ลบการจองเรียบร้อยแล้ว');
}

function adminViewSlip(bookingId) {
  const b = DB.getArr('bookings').find(x => x.id === bookingId);
  if (!b || !b.slipUrl) return;
  el('slip-view-img').src = b.slipUrl; showModal('slip-view-modal');
}

function addManualBooking() {
  const name    = el('mb-name').value.trim();
  const tableId = el('mb-table').value;
  const date    = el('mb-date').value;
  const time    = el('mb-time').value;
  const guests  = parseInt(el('mb-guests').value) || 2;
  const status  = el('mb-status').value;
  if (!name || !date || !tableId) { showToast('กรุณากรอกข้อมูลให้ครบ'); return; }
  const bookingId = 'b' + Date.now();
  const b = {
    id: bookingId, userId: 'admin_manual', venueName: 'Mellow UP',
    date, time, tableId, tableName: tableId,
    section: tableId.startsWith('VIP') ? 'โซน VIP' : 'โซนทั่วไป',
    guests, status, deposit: 500, serviceCharge: 50, total: 550,
    paymentMethod: 'เงินสด', qrData: 'MU-MAN-' + bookingId.slice(-6).toUpperCase(),
    name, phone: '', slipUrl: null, createdAt: new Date().toISOString(),
  };
  b.qrSvg = buildQRSvgString(b.qrData, 200);
  const bookings = DB.getArr('bookings'); bookings.push(b); DB.set('bookings', bookings);
  addAdminLog('booking','เพิ่มการจองด้วยตนเอง',`${name} | โต๊ะ: ${tableId} | ${date} ${time}`);
  closeModal(); renderAdminBookings(); refreshAdminStats(); renderMiniFloorPlan();
  showToast('เพิ่มการจองสำหรับ ' + name + ' เรียบร้อยแล้ว!');
}

// =============================================
//   admin-customers.js — Customer management
// =============================================

function renderAdminCustomers() {
  const tbody    = el('admin-customers-body'); if (!tbody) return;
  const users    = DB.getArr('users');
  const bookings = DB.getArr('bookings');
  tbody.innerHTML = users.map(u => {
    const bCount = bookings.filter(b => b.userId === u.id).length;
    return `<tr>
      <td>${u.fullName || u.username}</td>
      <td>${u.email}</td>
      <td>${u.phone || '—'}</td>
      <td>${bCount}</td>
      <td>${u.createdAt || '—'}</td>
      <td><button class="btn-danger" onclick="deleteCustomer('${u.id}')">🗑 ลบ</button></td></tr>`;
  }).join('');
}

function addCustomer() {
  const name = el('nc-name').value.trim();
  const email = el('nc-email').value.trim();
  const phone = el('nc-phone').value.trim();
  const pw    = el('nc-password').value;
  if (!name || !email || !pw) { showToast('กรุณากรอกข้อมูลให้ครบ'); return; }
  const users = DB.getArr('users');
  if (users.find(u => u.email === email)) { showToast('อีเมลนี้ถูกใช้แล้ว!'); return; }
  const newUser = {
    id: 'u' + Date.now(), email, username: email.split('@')[0],
    fullName: name, password: pw, phone, dob: '', avatar: '',
    createdAt: new Date().toISOString().split('T')[0],
  };
  users.push(newUser); DB.set('users', users);
  addAdminLog('customer','เพิ่มลูกค้า',`${name} | ${email}`);
  closeModal();
  el('nc-name').value = ''; el('nc-email').value = ''; el('nc-phone').value = ''; el('nc-password').value = '';
  renderAdminCustomers(); refreshAdminStats();
  showToast('เพิ่มลูกค้า ' + name + ' เรียบร้อยแล้ว!');
}

function deleteCustomer(userId) {
  const users = DB.getArr('users');
  const user  = users.find(u => u.id === userId);
  if (!confirm('ลบลูกค้า "' + (user?.fullName || user?.email) + '"?')) return;
  DB.set('users', users.filter(u => u.id !== userId));
  addAdminLog('customer','ลบลูกค้า',(user?.fullName || '') + ' | ' + (user?.email || userId));
  renderAdminCustomers(); refreshAdminStats();
  showToast('ลบลูกค้าเรียบร้อยแล้ว');
}
