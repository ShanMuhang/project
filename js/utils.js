// =============================================
//   MELLOW UP — utils.js
//   Shared helper functions
// =============================================

function el(id) { return document.getElementById(id); }

function showErr(elem, msg) {
  if (elem) { elem.textContent = msg; elem.classList.remove('hidden'); }
}

function showToast(msg, duration = 3000) {
  const t = el('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.remove('hidden');
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => t.classList.add('hidden'), duration);
}

function fmtDateTH(str) {
  if (!str) return '—';
  const d = new Date(str + 'T00:00:00');
  return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
}

function fmtDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' })
    + ' ' + d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function fmtTimeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)   return 'เพิ่งเกิดขึ้น';
  if (m < 60)  return m + ' นาทีที่แล้ว';
  const h = Math.floor(m / 60);
  if (h < 24)  return h + ' ชั่วโมงที่แล้ว';
  const day = Math.floor(h / 24);
  if (day < 7) return day + ' วันที่แล้ว';
  return fmtDateTH(iso.split('T')[0]);
}

function statusTH(s) {
  const m = {
    upcoming: 'กำลังจะมา', 'checked-in': 'เช็คอินแล้ว',
    'no-show': 'ไม่มา', cancelled: 'ยกเลิก', completed: 'เสร็จสิ้น',
    pending: 'รอดำเนินการ', 'pending-slip': 'รอสลิป',
    available: 'ว่าง', reserved: 'จองแล้ว', occupied: 'มีลูกค้า'
  };
  return m[s] || s;
}

function logTypeTH(t) {
  const m = { login: 'เข้าสู่ระบบ', booking: 'การจอง', customer: 'ลูกค้า', table: 'โต๊ะ', admin: 'แอดมิน', system: 'ระบบ' };
  return m[t] || t;
}

function getTableStatus(tableId) {
  const bookings = DB.getArr('bookings');
  if (bookings.find(b => b.tableId === tableId && b.status === 'checked-in')) return 'occupied';
  if (bookings.find(b => b.tableId === tableId && ['upcoming', 'pending-slip'].includes(b.status))) return 'reserved';
  const layout = DB.get('tableLayout') || {};
  const all = [...(layout.vip || []), ...(layout.regular || []), ...(layout.bar || [])];
  const tbl = all.find(t => t.id === tableId);
  return tbl?.reserved ? 'reserved' : 'available';
}

function getAllTables() {
  const l = DB.get('tableLayout') || { vip: [], regular: [], bar: [] };
  return [...(l.vip || []), ...(l.regular || []), ...(l.bar || [])];
}

function populateTableSelect(selectId) {
  const sel = el(selectId); if (!sel) return;
  sel.innerHTML = getAllTables().map(t => `<option value="${t.id}">${t.id} (${t.seats} ที่นั่ง)</option>`).join('');
}

/* MODALS */
function showModal(id) {
  el('modal-overlay').classList.remove('hidden');
  el(id).classList.remove('hidden');
  if (id === 'manual-booking-modal') populateTableSelect('mb-table');
}
function closeModal() {
  el('modal-overlay').classList.add('hidden');
  document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
}

function togglePwVisible(inputId, btn) {
  const input = el(inputId); if (!input) return;
  input.type = input.type === 'password' ? 'text' : 'password';
  btn.textContent = input.type === 'password' ? '👁' : '🙈';
}
