// =============================================
//   MELLOW UP — notifications.js
//   Real-time Notification System
//   • Polling every 30s
//   • 1-hour booking reminders
//   • Badge counter
//   • Cross-tab via storage event
// =============================================

const NOTIF_TYPES = {
  REMINDER:   'reminder',
  CONFIRMED:  'booking_confirmed',
  STATUS:     'status_change',
  PAYMENT:    'payment',
  PROMO:      'promo',
  ADMIN:      'admin',
};

const NOTIF_ICONS = {
  reminder:          '⏰',
  booking_confirmed: '🎉',
  status_change:     '🔄',
  payment:           '💳',
  promo:             '⭐',
  admin:             '🔐',
};

// ── Create a notification for a specific user ──────────────────────────
function createNotification(userId, type, title, body, bookingId = null) {
  const notifs = DB.getArr('notifications');
  // Deduplicate reminders
  if (type === NOTIF_TYPES.REMINDER && bookingId) {
    if (notifs.find(n => n.type === type && n.bookingId === bookingId)) return;
  }
  const notif = {
    id:        'n' + Date.now() + Math.random().toString(36).slice(2, 6),
    userId,
    type,
    title,
    body,
    bookingId,
    icon:      NOTIF_ICONS[type] || '📢',
    read:      false,
    timestamp: new Date().toISOString(),
  };
  notifs.unshift(notif);
  if (notifs.length > 200) notifs.splice(200); // keep max 200
  DB.set('notifications', notifs);
  updateNotificationBadge();
  return notif;
}

// ── Admin notification (separate store) ──────────────────────────────
function createAdminNotification(type, title, body, bookingId = null) {
  const notifs = DB.getArr('adminNotifications');
  notifs.unshift({
    id:        'an' + Date.now(),
    type,
    title,
    body,
    bookingId,
    icon:      NOTIF_ICONS[type] || '📢',
    read:      false,
    timestamp: new Date().toISOString(),
  });
  if (notifs.length > 100) notifs.splice(100);
  DB.set('adminNotifications', notifs);
  updateAdminNotifBadge();
}

// ── Badge counters ────────────────────────────────────────────────────
function updateNotificationBadge() {
  const badge = el('notif-badge');
  if (!badge) return;
  const count = currentUser
    ? DB.getArr('notifications').filter(n => n.userId === currentUser.id && !n.read).length
    : 0;
  if (count > 0) {
    badge.textContent = count > 99 ? '99+' : count;
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }
}

function updateAdminNotifBadge() {
  const badge = el('admin-notif-badge');
  if (!badge) return;
  const count = DB.getArr('adminNotifications').filter(n => !n.read).length;
  if (count > 0) {
    badge.textContent = count > 99 ? '99+' : count;
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }
}

// ── Mark notifications read ───────────────────────────────────────────
function markAllRead(userId) {
  const notifs = DB.getArr('notifications').map(n => {
    if (n.userId === userId) n.read = true;
    return n;
  });
  DB.set('notifications', notifs);
  updateNotificationBadge();
}

function markAdminAllRead() {
  const notifs = DB.getArr('adminNotifications').map(n => ({ ...n, read: true }));
  DB.set('adminNotifications', notifs);
  updateAdminNotifBadge();
}

function markOneRead(notifId) {
  const notifs = DB.getArr('notifications').map(n => {
    if (n.id === notifId) n.read = true;
    return n;
  });
  DB.set('notifications', notifs);
  updateNotificationBadge();
  renderNotificationsPage();
}

// ── Booking reminder check (1 hour before) ───────────────────────────
function checkBookingReminders() {
  if (!currentUser) return;
  const now = new Date();
  const bookings = DB.getArr('bookings').filter(
    b => b.userId === currentUser.id && b.status === 'upcoming'
  );

  bookings.forEach(b => {
    if (!b.date || !b.time) return;
    const bookingDT = new Date(b.date + 'T' + b.time + ':00');
    const diffMin = (bookingDT - now) / 60000;

    // Window: 55–65 minutes before → fire once
    if (diffMin >= 55 && diffMin <= 65) {
      const existingReminder = DB.getArr('notifications').find(
        n => n.type === NOTIF_TYPES.REMINDER && n.bookingId === b.id
      );
      if (!existingReminder) {
        createNotification(
          currentUser.id,
          NOTIF_TYPES.REMINDER,
          '⏰ เตือนการจองใกล้ถึงเวลาแล้ว!',
          `โต๊ะ ${b.tableName} (${b.section}) ของคุณจะเริ่มในอีก 1 ชั่วโมง — เวลา ${b.time} น. วันที่ ${fmtDateTH(b.date)}`,
          b.id
        );
        showToast('⏰ เตือน: โต๊ะ ' + b.tableName + ' จะเริ่มในอีก 1 ชั่วโมง!', 6000);
      }
    }

    // Also check 15-minute reminder
    if (diffMin >= 12 && diffMin <= 18) {
      const key15 = '15min_' + b.id;
      const existing15 = DB.getArr('notifications').find(
        n => n.type === NOTIF_TYPES.REMINDER && n.bookingId === b.id && n.body.includes('15 นาที')
      );
      if (!existing15) {
        createNotification(
          currentUser.id,
          NOTIF_TYPES.REMINDER,
          '🚨 ใกล้ถึงเวลาจองแล้ว!',
          `โต๊ะ ${b.tableName} จะเริ่มในอีก 15 นาที — เวลา ${b.time} น. กรุณามาถึงสถานที่เร็วๆ นี้!`,
          b.id
        );
        showToast('🚨 ด่วน: โต๊ะ ' + b.tableName + ' เริ่มในอีก 15 นาที!', 8000);
      }
    }
  });
}

// ── Render notification page ──────────────────────────────────────────
function renderNotificationsPage() {
  const container = el('notifications-list'); if (!container) return;
  const filterEl  = el('notif-filter');
  const filter    = filterEl ? filterEl.value : 'all';

  let notifs = currentUser
    ? DB.getArr('notifications').filter(n => n.userId === currentUser.id)
    : [];

  if (filter === 'unread') notifs = notifs.filter(n => !n.read);
  if (filter === 'reminder') notifs = notifs.filter(n => n.type === NOTIF_TYPES.REMINDER);

  if (!notifs.length) {
    container.innerHTML = `
      <div class="notif-empty">
        <div class="notif-empty-icon">🔔</div>
        <p>ไม่มีการแจ้งเตือน</p>
      </div>`;
    return;
  }

  container.innerHTML = notifs.map(n => `
    <div class="notif-item ${n.read ? '' : 'unread'}" onclick="markOneRead('${n.id}')">
      <div class="notif-icon ${n.type}">${n.icon}</div>
      <div class="notif-content">
        <div class="notif-title">${n.title}</div>
        <div class="notif-body">${n.body}</div>
        ${n.type === NOTIF_TYPES.REMINDER && n.bookingId ? renderCountdown(n.bookingId) : ''}
        <div class="notif-time">${fmtTimeAgo(n.timestamp)}</div>
      </div>
    </div>`).join('');
}

function renderCountdown(bookingId) {
  const b = DB.getArr('bookings').find(x => x.id === bookingId);
  if (!b) return '';
  const now = new Date();
  const bookingDT = new Date(b.date + 'T' + b.time + ':00');
  const diffMin = Math.round((bookingDT - now) / 60000);
  if (diffMin <= 0) return '<span class="countdown-chip">⏱ ถึงเวลาแล้ว!</span>';
  if (diffMin < 120) return `<span class="countdown-chip">⏱ อีก ${diffMin} นาที</span>`;
  const diffH = Math.floor(diffMin / 60);
  return `<span class="countdown-chip">⏱ อีก ${diffH} ชั่วโมง ${diffMin % 60} นาที</span>`;
}

function initNotificationsPage() {
  if (currentUser) markAllRead(currentUser.id);
  renderNotificationsPage();
}

// ── Real-time polling engine ──────────────────────────────────────────
let _notifInterval = null;

function startNotificationPolling() {
  stopNotificationPolling(); // clear any existing interval
  checkBookingReminders();   // check immediately
  updateNotificationBadge();

  _notifInterval = setInterval(() => {
    checkBookingReminders();
    updateNotificationBadge();
    // If notification page is open, refresh it
    const notifPage = el('page-notifications');
    if (notifPage && notifPage.classList.contains('active')) {
      renderNotificationsPage();
    }
  }, 30000); // every 30 seconds
}

function stopNotificationPolling() {
  if (_notifInterval) { clearInterval(_notifInterval); _notifInterval = null; }
}

// ── Cross-tab sync via storage event ─────────────────────────────────
window.addEventListener('storage', (e) => {
  if (e.key === 'mu_notifications') {
    updateNotificationBadge();
    const notifPage = el('page-notifications');
    if (notifPage && notifPage.classList.contains('active')) renderNotificationsPage();
  }
  if (e.key === 'mu_adminNotifications') {
    updateAdminNotifBadge();
  }
});

// ── Helper: send notification when admin changes booking status ───────
function notifyStatusChange(booking, newStatus) {
  if (!booking.userId || booking.userId === 'admin_manual') return;
  const messages = {
    'checked-in':    `การจองโต๊ะ ${booking.tableName} ของคุณได้รับการเช็คอินแล้ว ✓`,
    'cancelled':     `การจองโต๊ะ ${booking.tableName} ถูกยกเลิก`,
    'no-show':       `การจองโต๊ะ ${booking.tableName} ถูกบันทึกว่า "ไม่มา"`,
    'upcoming':      `การจองโต๊ะ ${booking.tableName} ได้รับการยืนยันอีกครั้ง`,
  };
  const body = messages[newStatus];
  if (body) {
    createNotification(booking.userId, NOTIF_TYPES.STATUS, '🔄 สถานะการจองเปลี่ยนแปลง', body, booking.id);
  }
}

// ── Default promo notifications (static) ─────────────────────────────
function seedPromoNotifications(userId) {
  const existing = DB.getArr('notifications').filter(n => n.userId === userId && n.type === 'promo');
  if (existing.length) return; // already seeded
  const promos = [
    { title: '⭐ โปรโมชั่นพิเศษ!', body: 'จองโต๊ะ VIP สุดสัปดาห์นี้ รับเครื่องดื่มฟรี 1 รอบ' },
    { title: '💳 ชำระเงินได้แล้ว', body: 'ระบบได้รับมัดจำการจองของคุณเรียบร้อยแล้ว' },
  ];
  promos.forEach(p => {
    createNotification(userId, 'promo', p.title, p.body);
  });
}
