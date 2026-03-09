// =============================================
//   MELLOW UP — router.js
//   Page routing & navigation
// =============================================

function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active', 'has-navbar'));
  const page = el('page-' + id);
  if (!page) return;
  page.classList.add('active');

  const noNav = ['login', 'signup', 'admin-login'];
  if (noNav.includes(id)) {
    el('navbar').classList.add('hidden');
    el('admin-navbar').classList.add('hidden');
  } else if (id === 'admin') {
    el('navbar').classList.add('hidden');
    el('admin-navbar').classList.remove('hidden');
    page.classList.add('has-navbar');
  } else {
    el('navbar').classList.remove('hidden');
    el('admin-navbar').classList.add('hidden');
    page.classList.add('has-navbar');
  }

  if (pageHistory[pageHistory.length - 1] !== id) pageHistory.push(id);

  const inits = {
    home:             initHome,
    profile:          initProfile,
    'my-account':     initMyAccount,
    'booking-history':initBookingHistory,
    bookings:         initBookings,
    notifications:    initNotificationsPage,
    admin:            initAdmin,
    'book-table':     initFloorMapUser,
    payment:          initPaymentPage,
    confirmed:        initConfirmed,
  };
  if (inits[id]) inits[id]();

  // always refresh badge after page change
  updateNotificationBadge();
  window.scrollTo(0, 0);
}

function goBack() {
  pageHistory.pop();
  const prev = pageHistory.pop();
  showPage(prev || 'home');
}
