/* =====================================================================
   نواة التطبيق: التوجيه (Router) + الهيكل العام (شريط جانبي وعلوي)
   ===================================================================== */
'use strict';

const App = (() => {
  const ROUTES = {
    'dashboard': { view: 'dashboard', title: 'لوحة التحكم' },
    'students': { view: 'students', title: 'الطلبة' },
    'students/:id': { view: 'studentProfile', title: 'ملف الطالب' },
    'guardians': { view: 'guardians', title: 'أولياء الأمور' },
    'classes': { view: 'classes', title: 'الصفوف الدراسية' },
    'attendance': { view: 'attendance', title: 'الحضور والغياب' },
    'performance': { view: 'performance', title: 'الأداء الأكاديمي' },
    'biscuits': { view: 'biscuits', title: 'توزيع البسكويت' },
    'school': { view: 'school', title: 'إدارة المدرسة' },
    'workers': { view: 'workers', title: 'العاملون' },
    'qr-reader': { view: 'qrReader', title: 'قارئ رمز QR' },
    'import-export': { view: 'importExport', title: 'استيراد وتصدير البيانات' },
    'reports': { view: 'reports', title: 'مركز التقارير' },
    'notifications': { view: 'notifications', title: 'التنبيهات' },
    'activity-log': { view: 'activity', title: 'سجل النشاطات' },
    'social': { view: 'social', title: 'مواقع التواصل الاجتماعي' },
    'settings': { view: 'settings', title: 'الإعدادات' },
  };

  /* ---------- تحليل الرابط ---------- */
  function parseHash() {
    let raw = location.hash || '#/dashboard';
    raw = raw.replace(/^#\/?/, '');
    let anchor = '';
    const ai = raw.indexOf('#');
    if (ai >= 0) { anchor = raw.slice(ai + 1); raw = raw.slice(0, ai); }
    let query = {};
    const qi = raw.indexOf('?');
    if (qi >= 0) {
      const sp = new URLSearchParams(raw.slice(qi + 1));
      sp.forEach((v, k) => query[k] = v);
      raw = raw.slice(0, qi);
    }
    const parts = raw.split('/').filter(Boolean);
    return { parts, query, anchor };
  }

  function matchRoute(parts) {
    const path = parts.join('/');
    if (ROUTES[path]) return { key: path, route: ROUTES[path], params: {} };
    if (parts[0] === 'students' && parts[1]) {
      return { key: 'students/:id', route: ROUTES['students/:id'], params: { id: parts[1] } };
    }
    return null;
  }

  const go = (hash) => {
    if (location.hash === hash) render();
    else location.hash = hash;
  };

  /* ---------- القائمة الجانبية ---------- */
  function sidebarHTML(activeBase) {
    const unread = S.unreadCount();
    const st = S.settings();
    return `
      <aside class="sidebar" id="sidebar">
        <div class="side-brand">
          <div class="logo">${LOGO_SVG}</div>
          <div><div class="t1">${U.esc(st.schoolName)}</div><div class="t2">نظام إدارة الطلبة</div></div>
        </div>
        <nav class="side-nav">
          ${NAV_ITEMS.map(item => item.group
      ? `<div class="nav-group-label">${item.group}</div>`
      : `<button class="nav-item ${activeBase === item.hash.slice(2) || (activeBase === 'students/' && item.id === 'students') ? 'active' : ''}" data-nav="${item.hash}">
                  ${UI.icon(item.icon)}<span>${item.label}</span>
                  ${item.badge && unread ? `<span class="n-badge">${U.fn(unread)}</span>` : ''}
                </button>`).join('')}
        </nav>
        <div class="side-foot">${CONFIG.directorate}<br>الإصدار ${CONFIG.version} — ${CONFIG.systemName}</div>
      </aside>
      <div class="side-overlay hidden" id="sideOverlay"></div>`;
  }

  /* ---------- الشريط العلوي ---------- */
  function topbarHTML(title) {
    const user = Auth.user();
    return `
      <div class="topbar">
        <button class="icon-btn tb-menu" id="tbMenu" title="القائمة">${UI.icon('menu')}</button>
        <div class="tb-title">${U.esc(title)}</div>
        <div class="tb-search" id="gsBox">
          ${UI.icon('search')}
          <input id="gsInput" type="search" placeholder="بحث سريع: اسم طالب، رقم ملف، ولي أمر…" autocomplete="off">
          <div id="gsResults" class="hidden"></div>
        </div>
        <div class="tb-actions">
          <button class="icon-btn" id="themeBtn" title="تبديل السمة (فاتح/داكن)">${UI.icon(S.settings().theme === 'dark' ? 'sun' : 'moon')}</button>
          <div class="dd" id="bellDD">
            <button class="icon-btn" id="bellBtn" title="التنبيهات">${UI.icon('bell')}${S.unreadCount() ? `<span class="dot">${U.fn(S.unreadCount())}</span>` : ''}</button>
          </div>
          <div class="dd" id="userDD">
            <div class="user-chip" id="userBtn">
              ${UI.avatar(user ? user.name : '؟', 'a-user')}
              <div class="u-meta"><div class="u-name">${U.esc(user ? user.name : '')}</div><div class="u-role">${U.esc(user ? user.role : '')}</div></div>
              ${UI.icon('chevronDown', 'faint')}
            </div>
          </div>
        </div>
      </div>`;
  }

  /* ---------- قائمة التنبيهات المنسدلة ---------- */
  function bellMenu() {
    const dd = container().querySelector('#bellDD');
    closeMenus();
    const menu = document.createElement('div');
    menu.className = 'dd-menu notif-menu';
    const list = S.db.notifications.slice(0, 6);
    menu.innerHTML = `
      <div class="dd-head"><b>التنبيهات</b><button class="btn g sm" id="markAllRead">تعيين الكل كمقروء</button></div>
      ${list.length ? list.map(n => `
        <div class="notif-item ${n.read ? '' : 'unread'}" data-nid="${n.id}">
          <span class="n-ic tone-${({ warning: 'amber', danger: 'red', success: 'green', info: 'blue' })[n.type] || 'blue'}">${UI.icon(({ warning: 'alert', danger: 'xCircle', success: 'checkCircle', info: 'info' })[n.type] || 'info')}</span>
          <div style="flex:1"><div class="n-t">${U.esc(n.title)}</div><div class="n-b">${U.esc(n.body)}</div><div class="n-time">${U.timeAgo(n.ts)}</div></div>
        </div>`).join('') : `<div class="empty" style="padding:1.6rem"><div class="e-s">لا توجد تنبيهات — كل شيء على ما يرام</div></div>`}
      <button class="dd-item" style="justify-content:center;color:var(--primary-600);font-weight:800" data-go-all>عرض جميع التنبيهات ${UI.icon('chevronLeft')}</button>`;
    dd.appendChild(menu);
    menu.querySelector('#markAllRead')?.addEventListener('click', (e) => {
      e.stopPropagation();
      S.db.notifications.forEach(n => n.read = true);
      S.save(); closeMenus(); render();
    });
    menu.querySelector('[data-go-all]').addEventListener('click', () => { closeMenus(); go('#/notifications'); });
    menu.querySelectorAll('[data-nid]').forEach(el => el.addEventListener('click', () => {
      const n = S.find('notifications', el.dataset.nid);
      if (n) S.update('notifications', n.id, { read: true });
      closeMenus(); go('#/notifications');
    }));
    menu.addEventListener('click', e => e.stopPropagation());
  }

  /* ---------- قائمة المستخدم المنسدلة ---------- */
  function userMenu() {
    const dd = container().querySelector('#userDD');
    closeMenus();
    const user = Auth.user();
    const menu = document.createElement('div');
    menu.className = 'dd-menu';
    menu.style.minWidth = '230px';
    menu.innerHTML = `
      <div class="dd-head" style="gap:.7rem;justify-content:flex-start">
        ${UI.avatar(user ? user.name : '؟', 'a-user')}
        <div><div class="n-t">${U.esc(user ? user.name : '')}</div><div class="t-sub ltr">${U.esc(user ? user.email : '')}</div></div>
      </div>
      <button class="dd-item" data-go-set>${UI.icon('settings')} الإعدادات والحساب</button>
      <div class="dd-sep"></div>
      <button class="dd-item danger" data-logout>${UI.icon('logout')} تسجيل الخروج</button>`;
    dd.appendChild(menu);
    menu.querySelector('[data-go-set]').addEventListener('click', () => { closeMenus(); go('#/settings#account'); });
    menu.querySelector('[data-logout]').addEventListener('click', async () => {
      closeMenus();
      const yes = await UI.confirm({ title: 'تسجيل الخروج', message: 'هل تريد تسجيل الخروج من النظام؟', okLabel: 'تسجيل الخروج', icon: 'logout' });
      if (!yes) return;
      Auth.logout();
      UI.toast('تم تسجيل خروجك بأمان', 'info', 'إلى اللقاء');
      go('#/login');
    });
    menu.addEventListener('click', e => e.stopPropagation());
  }

  function closeMenus() {
    document.querySelectorAll('.dd-menu').forEach(m => m.remove());
  }
  document.addEventListener('click', closeMenus);

  /* ---------- البحث الشامل ---------- */
  function globalSearch(q) {
    const nq = UI.normAr(q);
    if (nq.length < 2) return [];
    const out = [];
    for (const s of S.db.students) {
      if (out.length >= 9) break;
      if (UI.normAr(`${s.name} ${s.fileNo} ${s.nationalId}`).includes(nq))
        out.push({ type: 'طالب', tone: 'teal', icon: 'students', title: s.name, sub: `${s.grade} — شعبة ${s.section} • ملف ${s.fileNo}`, go: `#/students/${s.id}`, gender: s.gender });
    }
    for (const g of S.db.guardians) {
      if (out.length >= 9) break;
      if (UI.normAr(`${g.name} ${g.phone}`).includes(nq))
        out.push({ type: 'ولي أمر', tone: 'gold', icon: 'guardians', title: g.name, sub: g.phone, go: '#/guardians' });
    }
    [...S.db.employees, ...S.db.workers].forEach(e => {
      if (out.length >= 9) return;
      if (UI.normAr(`${e.name} ${e.jobTitle}`).includes(nq))
        out.push({ type: 'كادر', tone: 'blue', icon: 'user', title: e.name, sub: e.jobTitle, go: S.db.employees.includes(e) ? '#/school' : '#/workers' });
    });
    return out;
  }

  function bindGlobalSearch() {
    const input = container().querySelector('#gsInput');
    const box = container().querySelector('#gsResults');
    if (!input) return;
    input.addEventListener('input', U.debounce(() => {
      const res = globalSearch(input.value);
      if (!input.value.trim()) { box.classList.add('hidden'); return; }
      box.classList.remove('hidden');
      box.innerHTML = res.length ? res.map((r, i) => `
        <div class="gs-item" data-i="${i}">
          ${UI.avatar(r.title, r.gender === 'أنثى' ? 'a-girl' : r.gender === 'ذكر' ? 'a-boy' : 'a-user')}
          <div style="flex:1"><div class="t-main small">${U.esc(r.title)}</div><div class="t-sub">${U.esc(r.sub)}</div></div>
          ${UI.badge(r.type, r.tone, false)}
        </div>`).join('') : `<div class="empty" style="padding:1.4rem"><div class="e-s">لا توجد نتائج مطابقة لـ «${U.esc(input.value)}»</div></div>`;
      box.querySelectorAll('.gs-item').forEach(el => el.addEventListener('click', () => {
        const r = res[+el.dataset.i];
        box.classList.add('hidden'); input.value = '';
        go(r.go);
      }));
    }, 200));
    input.addEventListener('focus', () => { if (input.value.trim()) box.classList.remove('hidden'); });
    input.addEventListener('blur', () => setTimeout(() => box.classList.add('hidden'), 180));
  }

  const container = () => document.getElementById('app');

  /* ---------- العرض الرئيسي ---------- */
  function render() {
    /* تنظيف العرض السابق */
    if (typeof window.__viewCleanup === 'function') { try { window.__viewCleanup(); } catch (e) { } window.__viewCleanup = null; }
    if (typeof CH !== 'undefined') CH.reset();
    closeMenus();

    const { parts, query, anchor } = parseHash();
    const app = container();

    /* صفحة الدخول */
    const user = Auth.user();
    if (parts[0] === 'login') {
      if (user) { go('#/dashboard'); return; }
      app.innerHTML = '';
      document.title = `تسجيل الدخول — ${CONFIG.systemName}`;
      Views.login(app, {});
      return;
    }

    /* حماية المسارات */
    if (!user) { go('#/login'); return; }

    const m = matchRoute(parts);
    if (!m) { go('#/dashboard'); return; }
    const viewFn = Views[m.route.view];
    if (!viewFn) { app.innerHTML = UI.empty({ title: 'الصفحة غير متوفرة', icon: 'alert' }); return; }

    const activeBase = parts[0];
    const title = m.route.title;

    document.title = `${title} — ${CONFIG.systemName}`;
    S.applyAppearance();
    S.checkAlerts();

    app.innerHTML = `
      <div class="app">
        ${sidebarHTML(activeBase)}
        <div class="main">
          ${topbarHTML(title)}
          <div class="content" id="viewContent"></div>
        </div>
      </div>`;

    /* ربط عناصر الهيكل */
    const sb = app.querySelector('#sidebar');
    const overlay = app.querySelector('#sideOverlay');
    app.querySelectorAll('[data-nav]').forEach(b => b.addEventListener('click', () => {
      go(b.dataset.nav);
      sb.classList.remove('open'); overlay.classList.add('hidden');
    }));
    app.querySelector('#tbMenu').addEventListener('click', () => { sb.classList.toggle('open'); overlay.classList.toggle('hidden'); });
    overlay.addEventListener('click', () => { sb.classList.remove('open'); overlay.classList.add('hidden'); });
    app.querySelector('#themeBtn').addEventListener('click', () => {
      const cur = S.settings().theme === 'dark' ? 'light' : 'dark';
      S.saveSettings({ theme: cur });
      S.applyAppearance();
      render();
      UI.toast(cur === 'dark' ? 'تم تفعيل الوضع الداكن' : 'تم تفعيل الوضع الفاتح', 'info');
    });
    app.querySelector('#bellBtn').addEventListener('click', (e) => { e.stopPropagation(); bellMenu(); });
    app.querySelector('#userBtn').addEventListener('click', (e) => { e.stopPropagation(); userMenu(); });
    bindGlobalSearch();

    viewFn(app.querySelector('#viewContent'), { ...query, ...m.params });

    if (anchor) {
      setTimeout(() => { const el = document.getElementById(anchor); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 120);
    }
    window.scrollTo({ top: 0 });
  }

  const refreshShell = () => render();

  function boot() {
    window.addEventListener('hashchange', render);
    if (!location.hash) location.hash = Auth.user() ? '#/dashboard' : '#/login';
    render();
  }

  return { go, render, refreshShell, boot };
})();

document.addEventListener('DOMContentLoaded', App.boot);
