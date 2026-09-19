/* =====================================================================
   المصادقة وإدارة الجلسات
   ===================================================================== */
'use strict';

const Auth = (() => {
  let _user = null;

  function user() {
    if (_user) return _user;
    const sess = S.getSession();
    if (sess && sess.userId) {
      _user = S.find('users', sess.userId);
      if (!_user) S.setSession(null);
    }
    return _user;
  }

  function login(email, password, remember = true) {
    const u = S.db.users.find(x => x.email.trim().toLowerCase() === String(email).trim().toLowerCase());
    if (!u) return { ok: false, error: 'لا يوجد حساب بهذا البريد الإلكتروني' };
    if (u.pass !== U.hash(password)) return { ok: false, error: 'كلمة المرور غير صحيحة، يرجى المحاولة مرة أخرى' };
    _user = u;
    S.setSession({ userId: u.id, ts: U.nowISO(), remember });
    S.log('تسجيل الدخول', `تسجيل دخول المستخدم «${u.name}» إلى النظام`);
    return { ok: true, user: u };
  }

  function register({ name, email, password, role }) {
    name = String(name).trim(); email = String(email).trim().toLowerCase();
    if (S.db.users.some(x => x.email.toLowerCase() === email))
      return { ok: false, error: 'هذا البريد الإلكتروني مسجل مسبقاً، يمكنك تسجيل الدخول مباشرة' };
    const u = S.add('users', { name, email, pass: U.hash(password), role: role || 'مستخدم', createdAt: U.nowISO() });
    S.log('إنشاء حساب', `إنشاء حساب جديد باسم «${name}» (${email})`);
    _user = u;
    S.setSession({ userId: u.id, ts: U.nowISO(), remember: true });
    return { ok: true, user: u };
  }

  function changePassword(oldPass, newPass) {
    const u = user(); if (!u) return { ok: false, error: 'لا توجد جلسة نشطة' };
    if (u.pass !== U.hash(oldPass)) return { ok: false, error: 'كلمة المرور الحالية غير صحيحة' };
    S.update('users', u.id, { pass: U.hash(newPass) });
    S.log('تغيير كلمة المرور', 'تم تغيير كلمة مرور الحساب');
    return { ok: true };
  }

  function logout() {
    const u = user();
    if (u) S.log('تسجيل الخروج', `تسجيل خروج المستخدم «${u.name}» من النظام`);
    _user = null;
    S.setSession(null);
  }

  return { user, login, register, logout, changePassword };
})();
