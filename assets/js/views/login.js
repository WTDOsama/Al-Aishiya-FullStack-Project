/* =====================================================================
   صفحة تسجيل الدخول وإنشاء حساب جديد
   ===================================================================== */
'use strict';
window.Views = window.Views || {};

Views.login = function (container) {
  let mode = 'login';

  const feats = [
    ['students', 'إدارة شاملة لبيانات الطلبة وأولياء الأمور'],
    ['attendance', 'متابعة الحضور والغياب اليومي بسهولة'],
    ['performance', 'رصد الأداء الأكاديمي وتقارير المتفوقين'],
    ['biscuit', 'نظام متكامل لتوزيع وجبات البسكويت ومخزونها'],
    ['qr', 'إنشاء ومسح رموز QR الخاصة بالطلبة'],
    ['reports', 'تقارير رسمية جاهزة للطباعة والمشاركة'],
  ];

  function render() {
    container.innerHTML = `
    <div class="login-wrap">
      <div class="login-side">
        <div class="logo-big">${LOGO_SVG}</div>
        <h1>${CONFIG.systemName}</h1>
        <p class="ls-sub">منظومة مدرسية متكاملة لإدارة شؤون الطلبة والحضور والأداء الأكاديمي والتوزيع الغذائي، صُممت خصيصاً لبيئة العمل في ${CONFIG.schoolName}.</p>
        <div class="login-feats">
          ${feats.slice(0, 5).map(([ic, t]) => `<div class="lf"><span class="lf-ic">${UI.icon(ic)}</span>${t}</div>`).join('')}
        </div>
        <div class="login-foot">${CONFIG.country} — ${CONFIG.ministry} • ${CONFIG.directorate}</div>
      </div>
      <div class="login-main">
        <div class="login-card">
          <div class="lc-head">
            <div class="logo" style="margin:0 auto .7rem;width:64px">${LOGO_SVG}</div>
            <h2>${mode === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}</h2>
            <div class="lc-sub">${mode === 'login' ? 'مرحباً بعودتك، أدخل بياناتك للمتابعة' : 'أنشئ حسابك للبدء في استخدام النظام'}</div>
          </div>
          <div class="card"><div class="card-body">
            <div class="login-tabs">
              <button class="${mode === 'login' ? 'active' : ''}" data-mode="login">تسجيل الدخول</button>
              <button class="${mode === 'register' ? 'active' : ''}" data-mode="register">إنشاء حساب جديد</button>
            </div>
            <form class="login-form" id="authForm" novalidate>
              ${mode === 'register' ? `
                <div class="field"><label>الاسم الكامل <span class="req">*</span></label>
                  <input class="input" name="name" placeholder="مثال: أ. أحمد محمد" required></div>
              ` : ''}
              <div class="field"><label>البريد الإلكتروني <span class="req">*</span></label>
                <input class="input ltr" style="text-align:left" type="email" name="email" placeholder="name@school.edu.ps" required></div>
              ${mode === 'register' ? `
                <div class="field"><label>الدور الوظيفي</label>
                  <select class="select" name="role">${UI.opt(['مدير النظام', 'إداري', 'معلم', 'سكرتارية'], 'معلم', undefined)}</select></div>
              ` : ''}
              <div class="field"><label>كلمة المرور <span class="req">*</span></label>
                <input class="input ltr" style="text-align:left" type="password" name="password" placeholder="••••••••" required minlength="6"></div>
              ${mode === 'register' ? `
                <div class="field"><label>تأكيد كلمة المرور <span class="req">*</span></label>
                  <input class="input ltr" style="text-align:left" type="password" name="confirm" placeholder="••••••••" required></div>
              ` : `
                <div class="login-row">
                  <label class="check-line"><input type="checkbox" name="remember" checked> تذكرني</label>
                  <a href="javascript:void(0)" id="forgotLink">نسيت كلمة المرور؟</a>
                </div>
              `}
              <div class="err-msg hidden" id="authErr">${UI.icon('xCircle')}<span></span></div>
              <button class="btn p lg full" type="submit">${UI.icon(mode === 'login' ? 'logout' : 'user')} ${mode === 'login' ? 'تسجيل الدخول' : 'إنشاء الحساب'}</button>
            </form>
            ${mode === 'login' ? `
              <div class="demo-box">
                <b>بيانات تجريبية للدخول:</b><br>
                البريد الإلكتروني: <span class="ltr bold">admin@alaishiya.edu.ps</span><br>
                كلمة المرور: <span class="ltr bold">admin123</span>
              </div>` : ''}
          </div></div>
        </div>
      </div>
    </div>`;

    container.querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', () => { mode = b.dataset.mode; render(); }));

    const form = container.querySelector('#authForm');
    const errBox = container.querySelector('#authErr');
    const showErr = (m) => { errBox.classList.remove('hidden'); errBox.querySelector('span').textContent = m; };

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      errBox.classList.add('hidden');
      const fd = new FormData(form);
      const email = (fd.get('email') || '').trim();
      const pass = fd.get('password') || '';
      if (!email || !pass) return showErr('يرجى إدخال البريد الإلكتروني وكلمة المرور');
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return showErr('صيغة البريد الإلكتروني غير صحيحة');
      if (mode === 'register') {
        const name = (fd.get('name') || '').trim();
        const confirmP = fd.get('confirm') || '';
        if (name.length < 5) return showErr('يرجى إدخال الاسم الكامل');
        if (pass.length < 6) return showErr('كلمة المرور يجب ألا تقل عن ٦ أحرف');
        if (pass !== confirmP) return showErr('كلمتا المرور غير متطابقتين');
        const res = Auth.register({ name, email, password: pass, role: fd.get('role') });
        if (!res.ok) return showErr(res.error);
        UI.ok(`أهلاً بك ${name}، تم إنشاء حسابك بنجاح`, 'تم إنشاء الحساب');
        App.go('#/dashboard');
      } else {
        const res = Auth.login(email, pass, !!fd.get('remember'));
        if (!res.ok) return showErr(res.error);
        UI.ok(`مرحباً بك ${res.user.name}`, 'تم تسجيل الدخول');
        App.go('#/dashboard');
      }
    });

    const forgot = container.querySelector('#forgotLink');
    if (forgot) forgot.addEventListener('click', () => {
      UI.dialog({
        title: 'استعادة كلمة المرور', icon: 'mail', size: 'sm',
        sub: 'أدخل بريدك الإلكتروني لإرسال رابط الاستعادة',
        body: `<div class="field"><label>البريد الإلكتروني</label><input class="input ltr" style="text-align:left" type="email" id="fpEmail" placeholder="name@school.edu.ps"></div>`,
        foot: `<button class="btn p" id="fpSend">${UI.icon('send')} إرسال رابط الاستعادة</button><button class="btn o" data-close>إلغاء</button>`,
        onMount(el, close) {
          el.querySelector('#fpSend').addEventListener('click', () => {
            const v = el.querySelector('#fpEmail').value.trim();
            if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) return UI.err('يرجى إدخال بريد إلكتروني صحيح');
            close();
            UI.ok('تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني (وضع تجريبي)', 'تم الإرسال');
            S.log('استعادة كلمة المرور', `طلب استعادة كلمة مرور للبريد ${v}`);
          });
        },
      });
    });
  }

  render();
};
