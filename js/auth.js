// =============================================
//   MELLOW UP — auth.js
//   Authentication flow
// =============================================

function handleLogin() {
  const email = el('login-email').value.trim();
  const pw    = el('login-password').value;
  const errEl = el('login-error');
  if (!email || !pw) { showErr(errEl, 'กรุณากรอกอีเมลและรหัสผ่าน'); return; }
  const user = DB.getArr('users').find(u => (u.email === email || u.username === email) && u.password === pw);
  if (!user) { showErr(errEl, 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'); return; }
  currentUser = user; isAdmin = false;
  DB.set('currentUserId', user.id);
  pageHistory = [];
  seedPromoNotifications(user.id);
  startNotificationPolling();
  showPage('home');
  showToast('ยินดีต้อนรับ ' + (user.fullName || user.username) + '! 🎉');
}

function handleSignup() {
  const name    = el('signup-name').value.trim();
  const email   = el('signup-email').value.trim();
  const pw      = el('signup-password').value;
  const confirm = el('signup-confirm').value;
  const agreed  = el('signup-agree').checked;
  const errEl   = el('signup-error');
  if (!name || !email || !pw) { showErr(errEl, 'กรุณากรอกข้อมูลให้ครบ'); return; }
  if (pw !== confirm)          { showErr(errEl, 'รหัสผ่านไม่ตรงกัน'); return; }
  if (pw.length < 6)           { showErr(errEl, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'); return; }
  if (!agreed)                 { showErr(errEl, 'กรุณายอมรับเงื่อนไขการใช้งาน'); return; }
  const users = DB.getArr('users');
  if (users.find(u => u.email === email)) { showErr(errEl, 'อีเมลนี้ถูกใช้งานแล้ว'); return; }
  const newUser = {
    id: 'u' + Date.now(), email,
    username: email.split('@')[0],
    fullName: name, password: pw,
    phone: '', dob: '', avatar: '',
    createdAt: new Date().toISOString().split('T')[0],
  };
  users.push(newUser); DB.set('users', users);
  currentUser = newUser; isAdmin = false;
  DB.set('currentUserId', newUser.id);
  pageHistory = [];
  seedPromoNotifications(newUser.id);
  startNotificationPolling();
  showPage('home');
  showToast('สมัครสมาชิกสำเร็จ! ยินดีต้อนรับ 🎊');
}

function handleSocialLogin(provider) {
  const fakeUser = {
    id: 'u_' + Date.now(),
    email: provider.toLowerCase() + '_' + Date.now() + '@social.com',
    username: provider.toLowerCase() + '_user',
    fullName: 'ผู้ใช้ ' + provider,
    password: '', phone: '', dob: '', avatar: '',
    createdAt: new Date().toISOString().split('T')[0],
  };
  const users = DB.getArr('users'); users.push(fakeUser); DB.set('users', users);
  currentUser = fakeUser; isAdmin = false;
  DB.set('currentUserId', fakeUser.id);
  pageHistory = [];
  seedPromoNotifications(fakeUser.id);
  startNotificationPolling();
  showPage('home');
  showToast('เข้าสู่ระบบด้วย ' + provider + ' สำเร็จ!');
}

function handleAdminLogin() {
  const email = el('admin-email').value.trim();
  const pw    = el('admin-password').value;
  const admin = DB.getArr('admins').find(a => a.email === email && a.password === pw);
  if (admin) {
    isAdmin = true; currentUser = null; currentAdmin = admin;
    pageHistory = [];
    el('admin-username').textContent   = admin.name;
    el('admin-role-label').textContent = admin.role === 'superadmin' ? 'ซูเปอร์แอดมิน' : 'แอดมิน';
    el('admin-avatar-letter').textContent = admin.name.charAt(0).toUpperCase();
    addAdminLog('login', 'เข้าสู่ระบบ', 'อีเมล: ' + admin.email);
    showPage('admin');
  } else {
    showErr(el('admin-error'), 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
  }
}

function handleLogout() {
  stopNotificationPolling();
  currentUser = null; isAdmin = false;
  DB.set('currentUserId', null);
  pageHistory = [];
  showPage('login');
  showToast('ออกจากระบบเรียบร้อยแล้ว');
}

function handleAdminLogout() {
  if (currentAdmin) addAdminLog('login', 'ออกจากระบบ', '');
  isAdmin = false; currentAdmin = null;
  pageHistory = [];
  showPage('login');
}
