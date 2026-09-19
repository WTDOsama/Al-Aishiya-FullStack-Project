/* =====================================================================
   إعدادات النظام: المدرسة، العام الدراسي، المظهر، الروابط، الحساب، البيانات
   ===================================================================== */
'use strict';
window.Views = window.Views || {};

Views.settings = function (container) {

  function card(title, icon, innerHTML, saveHandler, saveLabel = 'حفظ التغييرات', anchor = '') {
    return `
      <div class="card" ${anchor ? `id="${anchor}"` : ''}>
        <div class="card-head"><div class="card-title">${UI.icon(icon)} ${title}</div></div>
        <div class="card-body">
          ${innerHTML}
          <div class="flex mt-2"><button class="btn p" data-save>${UI.icon('save')} ${saveLabel}</button></div>
        </div>
      </div>`;
  }

  function render() {
    const st = S.settings();
    const user = Auth.user();

    const ph = UI.pageHead({
      title: 'الإعدادات',
      sub: 'تهيئة النظام والمدرسة والحساب والبيانات — تُحفظ التغييرات فور اعتمادها',
    });

    container.innerHTML = `
      ${ph.html}
      <div class="grid-2eq">

        <div class="stack">
          ${card('معلومات المدرسة', 'school', `
            <div class="form-grid">
              <div class="field"><label>اسم المدرسة <span class="req">*</span></label><input class="input" name="schoolName" value="${U.esc(st.schoolName)}"></div>
              <div class="field"><label>المديرية التابعة لها</label><input class="input" name="directorate" value="${U.esc(st.directorate)}"></div>
              <div class="field"><label>اسم مدير(ة) المدرسة</label><input class="input" name="principal" value="${U.esc(st.principal)}"></div>
              <div class="field"><label>سنة التأسيس</label><input class="input" type="number" name="established" value="${U.esc(st.established)}"></div>
              <div class="field"><label>هاتف المدرسة</label><input class="input ltr" style="text-align:left" name="phone" value="${U.esc(st.phone)}"></div>
              <div class="field"><label>البريد الإلكتروني</label><input class="input ltr" style="text-align:left" type="email" name="email" value="${U.esc(st.email)}"></div>
              <div class="field span-2"><label>العنوان التفصيلي</label><textarea class="textarea" name="address">${U.esc(st.address)}</textarea></div>
            </div>`)}

          ${card('روابط التواصل الاجتماعي', 'social', `
            <div class="form-grid">
              <div class="field"><label>رابط صفحة فيسبوك</label><input class="input ltr" style="text-align:left" name="facebook" value="${U.esc(st.social.facebook)}" placeholder="https://facebook.com/..."></div>
              <div class="field"><label>رقم واتساب المدرسة</label><input class="input ltr" style="text-align:left" name="whatsapp" value="${U.esc(st.social.whatsapp)}" placeholder="059xxxxxxx"></div>
              <div class="field"><label>رابط قناة تيليجرام</label><input class="input ltr" style="text-align:left" name="telegram" value="${U.esc(st.social.telegram)}" placeholder="https://t.me/..."></div>
              <div class="field"><label>رابط قناة يوتيوب</label><input class="input ltr" style="text-align:left" name="youtube" value="${U.esc(st.social.youtube)}" placeholder="https://youtube.com/..."></div>
              <div class="field span-2"><label>الموقع الإلكتروني</label><input class="input ltr" style="text-align:left" name="website" value="${U.esc(st.social.website)}" placeholder="https://..."></div>
            </div>`, null, 'حفظ الروابط', 'social')}
        </div>

        <div class="stack">
          ${card('العام الدراسي وثوابت النظام', 'calendar', `
            <div class="form-grid">
              <div class="field"><label>العام الدراسي الحالي</label><select class="select" name="academicYear">${UI.opt(CONFIG.academicYears, st.academicYear, undefined)}</select></div>
              <div class="field"><label>الفصل الدراسي الحالي</label><select class="select" name="semester">${UI.opt(CONFIG.semesters, st.semester, undefined)}</select></div>
              <div class="field"><label>عدد قطع البسكويت في الكرتونة</label><input class="input" type="number" min="1" name="piecesPerCarton" value="${st.piecesPerCarton}"><div class="hint">يُستخدم لتحويل القطع إلى كراتين في التقارير</div></div>
              <div class="field"><label>حد تنبيه انخفاض المخزون (كرتونة)</label><input class="input" type="number" min="0" name="lowStockThreshold" value="${st.lowStockThreshold}"></div>
              <div class="field span-2"><label>أيام الغياب المتتالية قبل التنبيه</label><input class="input" type="number" min="1" max="10" name="absenceAlert" value="${st.absenceAlert}"><div class="hint">يُنشأ تنبيه تلقائي عند تجاوز الطالب هذا العدد من أيام الغياب المتتالية</div></div>
            </div>`)}

          ${card('المظهر وطريقة العرض', 'sun', `
            <div class="form-grid">
              <div class="field"><label>سمة النظام</label><select class="select" name="theme">${UI.opt([{ v: 'light', l: 'فاتح' }, { v: 'dark', l: 'داكن' }], st.theme, undefined)}</select></div>
              <div class="field"><label>حجم الخط</label><select class="select" name="fontSize">${UI.opt([{ v: 'small', l: 'صغير' }, { v: 'medium', l: 'متوسط' }, { v: 'large', l: 'كبير' }], st.fontSize, undefined)}</select></div>
              <div class="field span-2"><label>نمط الأرقام</label><select class="select" name="numerals">${UI.opt([{ v: 'arabic', l: 'أرقام عربية مشرقية (٠١٢٣)' }, { v: 'western', l: 'أرقام غربية (0123)' }], st.numerals, undefined)}</select><div class="hint">ينطبق على الأرقام المعروضة في الإحصائيات والتواريخ والجداول</div></div>
            </div>`)}

          ${card('حساب المستخدم', 'user', `
            <div class="form-grid">
              <div class="field"><label>الاسم المعروض</label><input class="input" name="accName" value="${U.esc(user ? user.name : '')}"></div>
              <div class="field"><label>البريد الإلكتروني</label><input class="input ltr" style="text-align:left" type="email" name="accEmail" value="${U.esc(user ? user.email : '')}"></div>
            </div>
            <hr class="divider">
            <div class="small bold muted mb-1">تغيير كلمة المرور (اتركها فارغة إن لم ترغب بالتغيير)</div>
            <div class="form-grid cols-3">
              <div class="field"><label>كلمة المرور الحالية</label><input class="input ltr" style="text-align:left" type="password" name="oldPass" autocomplete="current-password"></div>
              <div class="field"><label>كلمة المرور الجديدة</label><input class="input ltr" style="text-align:left" type="password" name="newPass" autocomplete="new-password"></div>
              <div class="field"><label>تأكيد الجديدة</label><input class="input ltr" style="text-align:left" type="password" name="newPass2" autocomplete="new-password"></div>
            </div>`, null, 'حفظ الحساب', 'account')}

          <div class="card" id="data">
            <div class="card-head"><div class="card-title" style="color:var(--danger)">${UI.icon('database')} إدارة البيانات</div></div>
            <div class="card-body stack" style="display:flex;flex-direction:column;gap:.7rem">
              <div class="flex-between"><div><div class="bold">نسخة احتياطية كاملة</div><div class="small muted">تصدير كل بيانات النظام كملف JSON قابل للاستعادة</div></div>
                <button class="btn o" id="stBackup">${UI.icon('download')} تصدير النسخة</button></div>
              <hr class="divider" style="margin:0">
              <div class="flex-between"><div><div class="bold">مركز الاستيراد والتصدير</div><div class="small muted">نقل بيانات CSV و Excel واستعادة النسخ الاحتياطية</div></div>
                <button class="btn o" data-go="#/import-export">${UI.icon('importExport')} فتح المركز</button></div>
              <hr class="divider" style="margin:0">
              <div class="flex-between"><div><div class="bold">إعادة تعيين البيانات التجريبية</div><div class="small muted">استبدال كل البيانات بالنموذج التجريبي الأصلي</div></div>
                <button class="btn danger-o" id="stReset">${UI.icon('refreshCCW')} إعادة تعيين</button></div>
              <hr class="divider" style="margin:0">
              <div class="flex-between"><div><div class="bold danger-text">مسح جميع البيانات</div><div class="small muted">تفريغ النظام من سجلات الطلبة والحضور والأداء والمخزون (مع الإبقاء على الحسابات والإعدادات)</div></div>
                <button class="btn danger" id="stWipe">${UI.icon('trash')} مسح البيانات</button></div>
            </div>
          </div>
        </div>
      </div>
      <div class="center small faint" style="padding-top:.5rem">${CONFIG.systemName} — الإصدار ${CONFIG.version} • يعمل بالكامل دون اتصال بالإنترنت</div>`;

    ph.bind(container);
    UI.bindGo(container);

    /* ربط أزرار الحفظ لكل بطاقة */
    const cards = container.querySelectorAll('.card');
    /* معلومات المدرسة */
    const bindSave = (cardEl, handler) => { cardEl.querySelector('[data-save]')?.addEventListener('click', () => handler(cardEl)); };
    const val = (el, name) => el.querySelector(`[name="${name}"]`)?.value.trim();

    bindSave(cards[0], (el) => {
      const schoolName = val(el, 'schoolName');
      if (!schoolName) return UI.err('اسم المدرسة مطلوب');
      S.saveSettings({ schoolName, directorate: val(el, 'directorate'), principal: val(el, 'principal'), established: val(el, 'established'), phone: val(el, 'phone'), email: val(el, 'email'), address: val(el, 'address') });
      S.log('تحديث الإعدادات', 'تحديث معلومات المدرسة من صفحة الإعدادات');
      UI.ok('تم حفظ معلومات المدرسة');
      App.refreshShell();
    });

    bindSave(cards[1], (el) => {
      S.saveSettings({ social: { facebook: val(el, 'facebook'), whatsapp: val(el, 'whatsapp'), telegram: val(el, 'telegram'), youtube: val(el, 'youtube'), website: val(el, 'website') } });
      S.log('تحديث الإعدادات', 'تحديث روابط التواصل الاجتماعي');
      UI.ok('تم حفظ روابط التواصل الاجتماعي');
    });

    bindSave(cards[2], (el) => {
      S.saveSettings({
        academicYear: val(el, 'academicYear'), semester: val(el, 'semester'),
        piecesPerCarton: Math.max(1, +val(el, 'piecesPerCarton') || 50),
        lowStockThreshold: Math.max(0, +val(el, 'lowStockThreshold') || 15),
        absenceAlert: Math.min(10, Math.max(1, +val(el, 'absenceAlert') || 3)),
      });
      S.log('تحديث الإعدادات', `تحديث العام الدراسي إلى ${val(el, 'academicYear')} — ${val(el, 'semester')}`);
      S.checkAlerts();
      UI.ok('تم حفظ إعدادات العام الدراسي');
      App.refreshShell();
    });

    bindSave(cards[3], (el) => {
      S.saveSettings({ theme: val(el, 'theme'), fontSize: val(el, 'fontSize'), numerals: val(el, 'numerals') });
      S.applyAppearance();
      S.log('تحديث الإعدادات', 'تغيير إعدادات المظهر وطريقة العرض');
      UI.ok('تم تطبيق إعدادات المظهر');
      App.render();
    });

    bindSave(cards[4], (el) => {
      const name = val(el, 'accName'), email = val(el, 'accEmail');
      if (!name || !email) return UI.err('الاسم والبريد الإلكتروني مطلوبان');
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return UI.err('صيغة البريد الإلكتروني غير صحيحة');
      if (S.db.users.some(u => u.email.toLowerCase() === email.toLowerCase() && u.id !== user.id)) return UI.err('هذا البريد مسجل لحساب آخر');
      const oldP = val(el, 'oldPass'), newP = val(el, 'newPass'), newP2 = val(el, 'newPass2');
      if (newP || newP2 || oldP) {
        if (newP.length < 6) return UI.err('كلمة المرور الجديدة يجب ألا تقل عن ٦ أحرف');
        if (newP !== newP2) return UI.err('تأكيد كلمة المرور الجديدة غير متطابق');
        const r = Auth.changePassword(oldP, newP);
        if (!r.ok) return UI.err(r.error);
      }
      S.update('users', user.id, { name, email });
      S.log('تحديث الحساب', 'تحديث بيانات حساب المستخدم الحالي');
      UI.ok('تم حفظ بيانات الحساب');
      App.refreshShell();
    });

    /* إدارة البيانات */
    container.querySelector('#stBackup').addEventListener('click', () => {
      const payload = JSON.stringify({ app: CONFIG.systemName, version: CONFIG.version, exportedAt: U.nowISO(), data: S.db }, null, 1);
      U.download(`نسخة-احتياطية-كاملة-${U.today()}.json`, payload, 'application/json;charset=utf-8');
      S.log('نسخ احتياطي', 'تصدير نسخة احتياطية كاملة من الإعدادات');
      UI.ok('تم تصدير النسخة الاحتياطية');
    });
    container.querySelector('#stReset').addEventListener('click', async () => {
      const yes = await UI.confirm({ title: 'إعادة تعيين البيانات', danger: true, message: 'سيتم استبدال كل البيانات الحالية بالبيانات التجريبية الأصلية. متابعة؟', okLabel: 'إعادة التعيين' });
      if (!yes) return;
      S.reset();
      S.log('إعادة تعيين النظام', 'استعادة البيانات التجريبية الأصلية من الإعدادات');
      UI.ok('تمت إعادة تعيين البيانات');
      App.render();
    });
    container.querySelector('#stWipe').addEventListener('click', async () => {
      const yes = await UI.confirm({ title: 'مسح جميع البيانات', danger: true, icon: 'trash', message: '<b class="danger-text">تحذير:</b> سيتم حذف جميع سجلات الطلبة والحضور والأداء والبسكويت والكوادر نهائياً (تبقى حسابات المستخدمين والإعدادات). هل أنت متأكد تماماً؟', okLabel: 'نعم، امسح كل شيء' });
      if (!yes) return;
      ['students', 'guardians', 'employees', 'workers', 'attendance', 'grades', 'biscuitMoves', 'biscuitDist', 'notifications', 'activity'].forEach(c => { S.db[c] = []; });
      S.save();
      S.log('إدارة النظام', 'مسح جميع بيانات النظام التشغيلية');
      UI.ok('تم مسح جميع البيانات التشغيلية');
      App.render();
    });
  }

  render();
};
