// =============================================
//   MELLOW UP — booking.js
//   Booking flow · Floor map · Confirmed
// =============================================

/* ── Home ──────────────────────────────────── */
function initHome() {}

/* ── Book Details ──────────────────────────── */
function changeGuests(d) {
  guestCount = Math.max(1, Math.min(20, guestCount + d));
  el('guest-count').textContent = guestCount;
}

function goToTableSelect() {
  const name  = el('res-name').value.trim();
  const date  = el('res-date').value;
  const time  = el('res-time').value;
  const phone = el('res-phone').value.trim();
  const errEl = el('book-details-error');
  if (!name)  { showErr(errEl, 'กรุณากรอกชื่อผู้จอง'); return; }
  if (!date)  { showErr(errEl, 'กรุณาเลือกวันที่'); return; }
  if (!time)  { showErr(errEl, 'กรุณาเลือกเวลา'); return; }
  if (!phone) { showErr(errEl, 'กรุณากรอกเบอร์โทรศัพท์'); return; }
  bookingDraft = { name, date, time, phone, guests: guestCount };
  errEl.classList.add('hidden');
  selectedTable = null;
  showPage('book-table');
}

/* ── Floor Map (User) ──────────────────────── */
function initFloorMapUser() {
  selectedTable = null;
  updateSelectedUI();
  el('confirm-table-btn').disabled = true;
  renderFloorPlanUser();
}

function renderFloorPlanUser() {
  const layout = DB.get('tableLayout') || { vip: [], regular: [], bar: [] };
  el('floor-plan-user').innerHTML = `
    <div class="fp-stage">เวที / STAGE</div>
    <span class="fp-section-label">โซน VIP</span>
    <div class="fp-row">${(layout.vip || []).map(userTableBtn).join('')}</div>
    <hr class="fp-separator">
    <span class="fp-section-label">โซนทั่วไป</span>
    <div class="fp-row">${(layout.regular || []).map(userTableBtn).join('')}</div>
    <hr class="fp-separator">
    <div class="fp-entrance">ทางเข้า ENTRANCE →</div>
    <span class="fp-section-label">โซนบาร์</span>
    <div class="fp-row">${(layout.bar || []).map(userTableBtn).join('')}</div>`;
}

function userTableBtn(t) {
  const status = getTableStatus(t.id);
  const taken  = status === 'reserved' || status === 'occupied';
  const vip    = t.id.startsWith('VIP') ? 'vip' : '';
  return `<button class="table-btn ${taken ? 'reserved' : 'available'} ${vip}"
    id="ubtn-${t.id}" ${taken ? 'disabled' : `onclick="selectUserTable('${t.id}')"`}>
    <span>${t.id}</span><span class="seat-count">${t.seats} ที่</span></button>`;
}

function selectUserTable(tableId) {
  const tbl = getAllTables().find(t => t.id === tableId);
  if (!tbl) return;
  document.querySelectorAll('.table-btn.selected').forEach(b => {
    b.classList.remove('selected'); b.classList.add('available');
  });
  const btn = el('ubtn-' + tableId);
  if (btn) { btn.classList.remove('available'); btn.classList.add('selected'); }
  selectedTable = tbl;
  updateSelectedUI();
  el('confirm-table-btn').disabled = false;
}

function updateSelectedUI() {
  if (selectedTable) {
    el('selected-table-name').textContent  = selectedTable.id;
    el('selected-table-price').textContent = '฿' + selectedTable.deposit.toLocaleString() + ' มัดจำ';
    el('selected-table-size').textContent  = selectedTable.seats + ' ที่นั่ง';
  } else {
    el('selected-table-name').textContent  = '—';
    el('selected-table-price').textContent = '';
    el('selected-table-size').textContent  = '—';
  }
}

/* ── Confirmed Page ────────────────────────── */
function initConfirmed() {
  const b = bookingDraft.confirmedBooking; if (!b) return;
  el('conf-table').textContent = b.tableName;
  el('conf-date').textContent  = fmtDateTH(b.date);
  el('conf-time').textContent  = b.time;
  el('conf-name').textContent  = b.name;

  // Auto-generate and render QR
  autoGenerateQR(b.id);
  const qrEl = el('qr-code-display');
  if (qrEl) qrEl.innerHTML = buildQRSvgString(b.qrData || b.id, 200);

  // Update confirmed booking id for download button
  const dlBtn = el('qr-download-btn');
  if (dlBtn) dlBtn.setAttribute('data-booking', b.id);
}

function saveQRToPhone() {
  const b = bookingDraft.confirmedBooking;
  if (b) downloadQR(b.id);
  else showToast('บันทึก QR Code เรียบร้อยแล้ว!');
}

/* ── My Bookings ───────────────────────────── */
function initBookings() {
  const container = el('my-bookings-list'); if (!container) return;
  const bookings = DB.getArr('bookings').filter(b => b.userId === currentUser?.id);
  if (!bookings.length) {
    container.innerHTML = `<p style="color:var(--text-muted);text-align:center;padding:40px">
      ยังไม่มีการจอง <a href="#" onclick="showPage('book-details')" style="color:var(--primary-light)">จองโต๊ะ</a></p>`;
    return;
  }
  container.innerHTML = [...bookings].reverse().map(b => `
    <div class="booking-night-card"><div class="bnc-row">
      <img class="bnc-img" src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=300&q=80" alt="โต๊ะ">
      <div class="bnc-info">
        <div class="bnc-title">${b.tableName} — ${b.section || ''}</div>
        <div class="bnc-sub">${fmtDateTH(b.date)} • ${b.time}</div>
        <div class="bnc-sub">${b.guests} คน • ฿${(b.total || 0).toLocaleString()}</div>
        <span class="bnc-status ${b.status}">${statusTH(b.status)}</span>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;align-items:flex-end">
        ${b.slipUrl ? `<button class="btn-outline small" onclick="viewSlip('${b.id}')">🧾 สลิป</button>` : ''}
        ${b.status === 'upcoming' ? `<button class="btn-primary small" onclick="viewBookingQR('${b.id}')">🎫 QR</button>` : ''}
      </div>
    </div></div>`).join('');
}

function viewBookingQR(bookingId) {
  const b = DB.getArr('bookings').find(x => x.id === bookingId); if (!b) return;
  bookingDraft.confirmedBooking = b;
  showPage('confirmed');
}

function viewSlip(bookingId) {
  const b = DB.getArr('bookings').find(x => x.id === bookingId);
  if (!b || !b.slipUrl) { showToast('ไม่มีสลิป'); return; }
  el('slip-view-img').src = b.slipUrl;
  showModal('slip-view-modal');
}
