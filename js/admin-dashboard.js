// =============================================
//   MELLOW UP — admin-dashboard.js
//   Admin init · Tab routing · Stats · Mini floor
// =============================================

function initAdmin() { showAdminTab('dashboard'); }

function showAdminTab(tabId) {
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.sn-item').forEach(i => i.classList.remove('active'));
  const tab = el('admin-tab-' + tabId); if (tab) tab.classList.add('active');
  document.querySelectorAll('.sn-item').forEach(i => {
    if (i.getAttribute('onclick')?.includes(`'${tabId}'`)) i.classList.add('active');
  });
  const actions = {
    dashboard: () => { refreshAdminStats(); renderMiniFloorPlan(); renderRecentActivity(); },
    tables:    renderAdminFloorPlan,
    bookings:  renderAdminBookings,
    customers: renderAdminCustomers,
    admins:    renderAdminManagement,
    log:       () => { renderAdminLog(); populateLogFilter(); },
    reports:   renderAdminReports,
    settings:  () => {},
  };
  if (actions[tabId]) actions[tabId]();
}

/* ── Stats ─────────────────────────────────── */
function refreshAdminStats() {
  const bookings = DB.getArr('bookings');
  const today    = new Date().toISOString().split('T')[0];
  const todayBk  = bookings.filter(b => b.createdAt?.startsWith(today));
  const occupied    = bookings.filter(b => b.status === 'checked-in').length;
  const pendingSlip = bookings.filter(b => b.status === 'pending-slip').length;
  const revenue  = bookings.filter(b => !['cancelled','no-show'].includes(b.status))
    .reduce((s, b) => s + (b.total || 0), 0);
  el('stat-total').textContent        = bookings.length;
  el('stat-total-change').textContent = '+' + todayBk.length + ' วันนี้';
  el('stat-occupied').textContent     = occupied;
  el('stat-pending').textContent      = pendingSlip;
  el('stat-revenue').textContent      = '฿' + revenue.toLocaleString();
}

/* ── Mini Floor Plan ───────────────────────── */
function renderMiniFloorPlan() {
  const container = el('mini-floor-plan'); if (!container) return;
  container.innerHTML = getAllTables().map(t => {
    const s = getTableStatus(t.id);
    return `<div class="mini-table-cell ${s}" title="${t.id}: ${statusTH(s)}"
      onclick="showToast('${t.id}: ${statusTH(s)}')">${t.id.replace('VIP-','V').replace('T-','T').replace('B-','B')}</div>`;
  }).join('');
}

/* ── Recent Activity ───────────────────────── */
function renderRecentActivity() {
  const tbody = el('recent-activity-body'); if (!tbody) return;
  const bookings = [...DB.getArr('bookings')].reverse().slice(0, 5);
  const users    = DB.getArr('users');
  tbody.innerHTML = bookings.map(b => {
    const user = users.find(u => u.id === b.userId);
    const name = user?.fullName || b.name || 'แขก';
    return `<tr>
      <td>${name}</td><td>${b.tableName}</td><td>${b.time}</td>
      <td><span class="status-badge ${b.status}">${statusTH(b.status)}</span></td>
      <td><button class="btn-outline small" onclick="changeBookingStatus('${b.id}','checked-in')">✓</button></td></tr>`;
  }).join('');
}
