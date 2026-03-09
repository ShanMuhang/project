// =============================================
//   MELLOW UP — profile.js
//   Profile · Account · History
// =============================================

function initProfile() {
  if (!currentUser) return;
  el('profile-name').textContent = currentUser.fullName || currentUser.username || 'ผู้ใช้';
}

function initMyAccount() {
  if (!currentUser) return;
  el('acc-fullname').value = currentUser.fullName || '';
  el('acc-username').value = currentUser.username  || '';
  el('acc-email').value    = currentUser.email     || '';
  el('acc-phone').value    = currentUser.phone     || '';
  el('acc-dob').value      = currentUser.dob       || '';
}

function togglePasswordChange() {
  el('password-change-fields').classList.toggle('hidden', !el('change-pw-toggle').checked);
}

function saveAccountDetails() {
  if (!currentUser) return;
  currentUser.fullName = el('acc-fullname').value.trim();
  currentUser.username = el('acc-username').value.trim();
  currentUser.email    = el('acc-email').value.trim();
  currentUser.phone    = el('acc-phone').value.trim();
  currentUser.dob      = el('acc-dob').value;

  if (el('change-pw-toggle').checked) {
    const np = el('acc-new-pw').value, cp = el('acc-confirm-pw').value;
    if (np !== cp)     { showToast('รหัสผ่านไม่ตรงกัน!'); return; }
    if (np.length < 6) { showToast('รหัสผ่านสั้นเกินไป!'); return; }
    currentUser.password = np;
  }

  const users = DB.getArr('users');
  const idx = users.findIndex(u => u.id === currentUser.id);
  if (idx >= 0) users[idx] = currentUser;
  DB.set('users', users);

  const s = el('acc-success');
  s.classList.remove('hidden');
  setTimeout(() => s.classList.add('hidden'), 3000);
}

/* ── Booking History ───────────────────────── */
const vImgs = [
  'https://images.unsplash.com/photo-1571204829887-3b8d69e4094d?w=300&q=80',
  'https://images.unsplash.com/photo-1546622891-02c72c1537b6?w=300&q=80',
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&q=80',
];

function initBookingHistory() {
  const container = el('booking-history-list'); if (!container) return;
  const bookings = DB.getArr('bookings').filter(b => b.userId === currentUser?.id);
  if (!bookings.length) {
    container.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:40px">ไม่มีประวัติการจอง</p>';
    return;
  }
  container.innerHTML = bookings.map((b, i) => `
    <div class="bh-item">
      <div class="bh-info">
        <div class="bh-status-label">${statusTH(b.status)}</div>
        <div class="bh-date">${fmtDateTH(b.date)} • ${b.time}</div>
        <div class="bh-details">${b.tableName} · ${b.guests} คน · ฿${(b.total || 0).toLocaleString()}</div>
        ${b.status === 'upcoming' ? `
          <button class="btn-outline small" style="margin-top:10px" onclick="viewBookingQR('${b.id}')">🎫 ดู QR Ticket</button>
          <button class="qr-download-btn" onclick="downloadQR('${b.id}')">⬇ ดาวน์โหลด QR</button>` : ''}
        ${b.slipUrl ? `<button class="btn-outline small" style="margin-top:6px" onclick="viewSlip('${b.id}')">🧾 ดูสลิป</button>` : ''}
      </div>
      <img class="bh-image" src="${vImgs[i % 3]}" alt="สถานที่">
    </div>`).join('');
}
