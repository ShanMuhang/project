// =============================================
//   MELLOW UP — init.js
//   DB seed & application startup
// =============================================

function initDB() {
  // Seed admins
  if (!DB.getArr('admins').length) {
    DB.set('admins', [{
      id: 'adm001', name: 'Alex Yellow',
      email: 'admin@mellowup.com', password: 'admin123',
      role: 'superadmin', createdAt: '2024-01-01',
    }]);
  }

  // Seed demo user + bookings
  if (!DB.getArr('users').length) {
    DB.set('users', [{
      id: 'u001', email: 'demo@mellowup.com', username: 'demo',
      fullName: 'สมชาย ใจดี', password: 'demo123',
      phone: '+66 81 234 5678', dob: '1995-03-15', avatar: '',
      createdAt: '2024-01-10',
    }]);

    // Seed a booking 61 minutes from now so the reminder triggers immediately for demo
    const soon = new Date(Date.now() + 61 * 60000);
    const soonDate = soon.toISOString().split('T')[0];
    const soonTime = soon.toTimeString().slice(0,5);

    DB.set('bookings', [
      {
        id: 'b001', userId: 'u001', venueName: 'Mellow UP',
        date: soonDate, time: soonTime,
        tableId: 'T-03', tableName: 'T-03', section: 'โซนทั่วไป',
        guests: 4, status: 'upcoming', deposit: 500, serviceCharge: 50, total: 550,
        paymentMethod: 'promptpay', qrData: 'MU-B001DEMO',
        qrSvg: null,                       // will be generated on view
        name: 'สมชาย ใจดี', phone: '+66 81 234 5678',
        slipUrl: null, createdAt: new Date().toISOString(),
      },
      {
        id: 'b002', userId: 'u001', venueName: 'Mellow UP',
        date: '2024-06-15', time: '21:00',
        tableId: 'T-11', tableName: 'T-11', section: 'โซนทั่วไป',
        guests: 6, status: 'checked-in', deposit: 500, serviceCharge: 50, total: 550,
        paymentMethod: 'credit', qrData: 'MU-B002DEMO', qrSvg: null,
        name: 'สมชาย ใจดี', phone: '+66 81 234 5678',
        slipUrl: null, createdAt: new Date().toISOString(),
      },
    ]);
  }

  // Seed table layout (calls getTableLayout which auto-seeds if missing)
  getTableLayout();

  // Backfill QR SVGs for any bookings missing them
  const bookings = DB.getArr('bookings');
  let changed = false;
  bookings.forEach(b => {
    if (!b.qrSvg) {
      b.qrSvg = buildQRSvgString(b.qrData || b.id, 200);
      changed = true;
    }
  });
  if (changed) DB.set('bookings', bookings);
}

// ── DOMContentLoaded ─────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initDB();

  // Restore logged-in user session
  const savedId = DB.get('currentUserId');
  if (savedId) {
    const user = DB.getArr('users').find(u => u.id === savedId);
    if (user) {
      currentUser = user;
      pageHistory = [];
      seedPromoNotifications(user.id);
      startNotificationPolling();
      showPage('home');
      return;
    }
  }

  showPage('login');
});
