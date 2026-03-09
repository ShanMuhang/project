// =============================================
//   MELLOW UP — payment.js
//   Payment · Slip upload · Confirm booking
// =============================================

function goToPayment() {
  if (!selectedTable) return;
  bookingDraft.tableId   = selectedTable.id;
  bookingDraft.tableName = selectedTable.id;
  bookingDraft.deposit   = selectedTable.deposit;
  bookingDraft.section   = selectedTable.id.startsWith('VIP') ? 'โซน VIP'
    : selectedTable.id.startsWith('B') ? 'โซนบาร์' : 'โซนทั่วไป';
  slipDataUrl = null;
  showPage('payment');
}

function initPaymentPage() {
  const dep   = bookingDraft.deposit || 500;
  const svc   = Math.round(dep * 0.1);
  const total = dep + svc;
  bookingDraft.serviceCharge = svc;
  bookingDraft.total         = total;

  el('pay-date').textContent          = fmtDateTH(bookingDraft.date) + ' • ' + bookingDraft.time;
  el('pay-table').textContent         = bookingDraft.tableName;
  el('pay-guests').textContent        = bookingDraft.guests + ' คน';
  el('pay-total').textContent         = '฿' + total.toLocaleString();
  el('pay-amount-display').textContent = '฿' + total.toLocaleString();

  // Generate payment QR
  const qrEl = el('payment-qr-display');
  if (qrEl) {
    qrEl.innerHTML = '';
    generateQRSvg(qrEl, 'PROMPTPAY:' + total, 180);
  }

  // Reset slip
  el('slip-placeholder').classList.remove('hidden');
  el('slip-preview').classList.add('hidden');
  el('payment-error').classList.add('hidden');
  switchPayTab('promptpay', document.querySelector('.pay-tab'));
}

function switchPayTab(tab, btn) {
  currentPayTab = tab;
  document.querySelectorAll('.pay-tab').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  document.querySelectorAll('.pay-panel').forEach(p => p.classList.add('hidden'));
  el('pay-panel-' + tab).classList.remove('hidden');
}

function handleSlipUpload(input) {
  const file = input.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    slipDataUrl = e.target.result;
    el('slip-preview-img').src = slipDataUrl;
    el('slip-placeholder').classList.add('hidden');
    el('slip-preview').classList.remove('hidden');
    showToast('อัปโหลดสลิปเรียบร้อย ✓');
  };
  reader.readAsDataURL(file);
}

function clearSlip(ev) {
  ev.stopPropagation(); slipDataUrl = null;
  el('slip-file-input').value = '';
  el('slip-preview').classList.add('hidden');
  el('slip-placeholder').classList.remove('hidden');
}

function savePaymentDraft() {
  const user = currentUser || { id: 'guest' };
  const bookingId = 'b' + Date.now();
  const b = {
    id: bookingId, userId: user.id, venueName: 'Mellow UP',
    date: bookingDraft.date, time: bookingDraft.time,
    tableId: bookingDraft.tableId, tableName: bookingDraft.tableName,
    section: bookingDraft.section, guests: bookingDraft.guests,
    status: 'pending-slip',
    deposit: bookingDraft.deposit, serviceCharge: bookingDraft.serviceCharge,
    total: bookingDraft.total, paymentMethod: currentPayTab,
    qrData: 'MU-' + bookingId.toUpperCase().slice(-10),
    name: bookingDraft.name, phone: bookingDraft.phone,
    slipUrl: slipDataUrl, createdAt: new Date().toISOString(),
  };
  // Auto-generate QR and save into booking
  b.qrSvg = buildQRSvgString(b.qrData, 200);

  const bookings = DB.getArr('bookings'); bookings.push(b); DB.set('bookings', bookings);
  showToast('บันทึกการจองแล้ว! กรุณาชำระเงินก่อนวันจอง 💾');
  showPage('home');
}

function confirmPayment() {
  if (!slipDataUrl) {
    showErr(el('payment-error'), 'กรุณาแนบสลิปการโอนเงินก่อนยืนยันการจอง');
    return;
  }
  el('payment-error').classList.add('hidden');

  const user = currentUser || { id: 'guest' };
  const bookingId = 'b' + Date.now();
  const b = {
    id: bookingId, userId: user.id, venueName: 'Mellow UP',
    date: bookingDraft.date, time: bookingDraft.time,
    tableId: bookingDraft.tableId, tableName: bookingDraft.tableName,
    section: bookingDraft.section, guests: bookingDraft.guests,
    status: 'upcoming',
    deposit: bookingDraft.deposit, serviceCharge: bookingDraft.serviceCharge,
    total: bookingDraft.total, paymentMethod: currentPayTab,
    qrData: 'MU-' + bookingId.toUpperCase().slice(-10),
    name: bookingDraft.name, phone: bookingDraft.phone,
    slipUrl: slipDataUrl, createdAt: new Date().toISOString(),
  };

  // Auto-generate QR
  b.qrSvg = buildQRSvgString(b.qrData, 200);

  const bookings = DB.getArr('bookings'); bookings.push(b); DB.set('bookings', bookings);
  bookingDraft.confirmedBooking = b;

  // Reserve table in layout
  const layout = DB.get('tableLayout') || { vip: [], regular: [], bar: [] };
  ['vip', 'regular', 'bar'].forEach(sec => {
    const tbl = (layout[sec] || []).find(t => t.id === b.tableId);
    if (tbl) tbl.reserved = true;
  });
  DB.set('tableLayout', layout);

  // Create confirmation notification for user
  if (user.id !== 'guest') {
    createNotification(user.id, NOTIF_TYPES.CONFIRMED,
      '🎉 การจองสำเร็จ!',
      `โต๊ะ ${b.tableName} (${b.section}) วันที่ ${fmtDateTH(b.date)} เวลา ${b.time} น. ฿${b.total.toLocaleString()}`,
      b.id
    );
  }

  // Notify admin about new booking
  createAdminNotification(NOTIF_TYPES.CONFIRMED,
    '📋 การจองใหม่เข้ามา',
    `${b.name} จองโต๊ะ ${b.tableName} วันที่ ${b.date} เวลา ${b.time} (${b.guests} คน)`,
    b.id
  );

  showPage('confirmed');
}
