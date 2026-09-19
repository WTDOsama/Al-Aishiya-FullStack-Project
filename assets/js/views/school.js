/* =====================================================================
   إدارة المدرسة: معلومات المدرسة + الهيئة الإدارية
   ===================================================================== */
'use strict';
window.Views = window.Views || {};

Views.school = function (container) {
  let tab = 'info';

  /* ---------- تعديل معلومات المدرسة ---------- */
  function editSchoolInfo() {
    const st = S.settings();
    UI.formDialog({
      title: 'تعديل معلومات المدرسة', icon: 'school', size: 'lg',
      submitLabel: 'حفظ المعلومات',
      initial: st,
      fields: [
        { name: 'schoolName', label: 'اسم المدرسة', type: 'text', required: true },
        { name: 'directorate', label: 'المديرية التابعة لها', type: 'text', required: true },
        { name: 'principal', label: 'اسم مدير(ة) المدرسة', type: 'text', required: true },
        { name: 'established', label: 'سنة التأسيس', type: 'number', min: 1900, max: 2100 },
        { name: 'phone', label: 'هاتف المدرسة', type: 'tel', placeholder: '08xxxxxxx' },
        { name: 'email', label: 'البريد الإلكتروني', type: 'email', placeholder: 'info@school.edu.ps' },
        { name: 'address', label: 'العنوان', type: 'textarea', span: 2, placeholder: 'العنوان التفصيلي للمدرسة' },
      ],
      onSubmit(v) {
        S.saveSettings({ schoolName: v.schoolName, directorate: v.directorate, principal: v.principal, established: v.established, phone: v.phone, email: v.email, address: v.address });
        S.log('تحديث معلومات المدرسة', 'تحديث بيانات المدرسة الأساسية من صفحة إدارة المدرسة');
        UI.ok('تم حفظ معلومات المدرسة بنجاح');
        render();
      },
    });
  }

  /* ---------- ملف موظف إداري ---------- */
  function empProfile(e) {
    UI.dialog({
      title: 'ملف الموظف الإداري', sub: e.name, icon: 'school', size: 'sm',
      body: `
        <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1rem">
          ${UI.avatar(e.name, 'a-user', 'lg')}
          <div><h3 style="font-size:1.1rem">${U.esc(e.name)}</h3>
          <div class="flex mt-1">${UI.badge(e.jobTitle, 'blue')}${UI.badge(e.status, U.badgeTone(e.status))}</div></div>
        </div>
        ${[['رقم الهوية', e.nationalId || '—'], ['رقم الجوال', e.phone || '—'], ['القسم', e.dept || '—'], ['تاريخ التعيين', U.fmtDate(e.hireDate)], ['الراتب الشهري', e.salary ? `${U.fn(e.salary)} شيكل` : '—'], ['ملاحظات', e.notes || '—']]
          .map(([k, v]) => `<div class="kv"><span class="k">${k}</span><span class="v">${U.esc(v)}</span></div>`).join('')}`,
      foot: `<button class="btn o" data-close>إغلاق</button>`,
    });
  }

  function render() {
    const st = S.settings();
    const deptCounts = CONFIG.empDepartments.map(d => ({ d, c: S.db.employees.filter(e => e.dept === d).length })).filter(x => x.c);

    const ph = UI.pageHead({
      title: 'إدارة المدرسة',
      sub: 'معلومات المدرسة والهيئة الإدارية العاملة',
      actions: [
        { label: 'تعديل معلومات المدرسة', icon: 'edit', kind: 'o', onClick: editSchoolInfo },
        { label: 'طباعة البيانات', icon: 'print', kind: 'o', onClick: printInfo },
      ],
    });

    function printInfo() {
      U.printDoc({
        title: 'بيانات المدرسة والهيئة الإدارية',
        body: `
          <div class="psec">معلومات المدرسة</div>
          <table class="ptbl"><tbody>
            ${[['اسم المدرسة', st.schoolName], ['المديرية', st.directorate], ['مدير(ة) المدرسة', st.principal], ['سنة التأسيس', U.fn(st.established)], ['العنوان', st.address], ['الهاتف', st.phone], ['البريد الإلكتروني', st.email], ['العام الدراسي', st.academicYear], ['الفصل الدراسي', st.semester]]
              .map(([k, v]) => `<tr><td style="width:28%;background:#f3f8f5;font-weight:800">${U.esc(k)}</td><td>${U.esc(v || '—')}</td></tr>`).join('')}
          </tbody></table>
          <div class="psec">الهيئة الإدارية (${U.fn(S.db.employees.length)})</div>
          ${U.printTable(empCols, S.db.employees)}`,
      });
      S.log('طباعة تقرير', 'طباعة بيانات المدرسة والهيئة الإدارية');
    }

    const empCols = [
      { label: 'الاسم', get: e => e.name },
      { label: 'المسمى الوظيفي', get: e => e.jobTitle },
      { label: 'القسم', get: e => e.dept },
      { label: 'رقم الجوال', get: e => e.phone || '—' },
      { label: 'تاريخ التعيين', get: e => U.fmtDate(e.hireDate) },
      { label: 'الحالة', get: e => e.status },
    ];

    container.innerHTML = `
      ${ph.html}
      <div class="card"><div class="card-body flush" style="padding:0 1.25rem"><div class="tabs">
        <button class="tab ${tab === 'info' ? 'active' : ''}" data-t="info">معلومات المدرسة</button>
        <button class="tab ${tab === 'emps' ? 'active' : ''}" data-t="emps">الهيئة الإدارية <span class="chip">${U.fn(S.db.employees.length)}</span></button>
      </div></div></div>
      <div id="schoolTab"></div>`;
    ph.bind(container);

    const target = container.querySelector('#schoolTab');

    if (tab === 'info') {
      target.innerHTML = `
        <div class="grid-2">
          <div class="card">
            <div class="card-head"><div class="card-title">${UI.icon('school')} البيانات الرسمية</div>
              <button class="btn o sm" id="editSchool">${UI.icon('edit')} تعديل</button></div>
            <div class="card-body">
              <div style="display:flex;gap:1.1rem;align-items:center;margin-bottom:1.1rem">
                <div style="width:78px;flex:none">${LOGO_SVG}</div>
                <div>
                  <h3 style="font-size:1.2rem">${U.esc(st.schoolName)}</h3>
                  <div class="muted small">${U.esc(st.directorate)}</div>
                  <div class="flex mt-1">${UI.badge(`تأسست عام ${U.fn(st.established)}`, 'teal')}${UI.badge(st.academicYear, 'blue', false)}</div>
                </div>
              </div>
              ${[['مدير(ة) المدرسة', st.principal, 'user'], ['العنوان', st.address, 'mapPin'], ['الهاتف', st.phone, 'phone'], ['البريد الإلكتروني', st.email, 'mail'], ['العام الدراسي الحالي', st.academicYear, 'calendar'], ['الفصل الدراسي الحالي', st.semester, 'bookOpen']]
          .map(([k, v, ic]) => `<div class="kv"><span class="k">${UI.icon(ic)} ${k}</span><span class="v">${U.esc(v || '—')}</span></div>`).join('')}
              <div class="k small muted bold mt-2 mb-1">المراحل الدراسية في المدرسة</div>
              <div class="flex">${CONFIG.stages.map(s2 => `<span class="chip" style="border-color:${s2.color}55;color:${s2.color};font-weight:800">${U.esc(s2.name)} (${U.fn(s2.grades.length)} صفوف)</span>`).join('')}</div>
            </div>
          </div>
          <div class="stack">
            <div class="card">
              <div class="card-head"><div class="card-title">${UI.icon('trend')} مؤشرات سريعة</div></div>
              <div class="card-body flush">
                ${[['إجمالي الطلبة', S.activeStudents().length, 'students', 'teal'], ['الهيئة الإدارية', S.db.employees.length, 'school', 'blue'], ['العاملون', S.db.workers.length, 'workers', 'amber'], ['الشعب الدراسية', S.db.classes.length, 'classes', 'purple']]
          .map(([l, v, ic, t]) => `<div class="gs-item" style="border-bottom:1px solid var(--border);cursor:default"><span class="n-ic tone-${t}" style="width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center">${UI.icon(ic)}</span><div style="flex:1"><div class="n-t">${l}</div></div><div class="sc-val num" style="font-size:1.25rem">${U.fn(v)}</div></div>`).join('')}
              </div>
            </div>
            <div class="card">
              <div class="card-head"><div class="card-title">${UI.icon('social')} التواجد الرقمي</div>
                <button class="btn g sm" data-go="#/social">إدارة الروابط ${UI.icon('chevronLeft')}</button></div>
              <div class="card-body"><div class="flex">
                ${st.social.facebook ? `<a class="chip" href="${U.esc(st.social.facebook)}" target="_blank">${UI.icon('facebook')} فيسبوك</a>` : ''}
                ${st.social.whatsapp ? `<a class="chip" href="${U.waLink('السلام عليكم', st.social.whatsapp)}" target="_blank">${UI.icon('whatsapp')} واتساب</a>` : ''}
                ${st.social.telegram ? `<a class="chip" href="${U.esc(st.social.telegram)}" target="_blank">${UI.icon('telegram')} تيليجرام</a>` : ''}
                ${st.social.youtube ? `<a class="chip" href="${U.esc(st.social.youtube)}" target="_blank">${UI.icon('youtube')} يوتيوب</a>` : ''}
                ${st.social.website ? `<a class="chip" href="${U.esc(st.social.website)}" target="_blank">${UI.icon('globe')} الموقع الإلكتروني</a>` : ''}
                ${!Object.values(st.social).some(Boolean) ? '<span class="muted small">لم تُضف روابط بعد — أضفها من الإعدادات</span>' : ''}
              </div></div>
            </div>
          </div>
        </div>`;
      target.querySelector('#editSchool').addEventListener('click', editSchoolInfo);
      UI.bindGo(target);
    } else {
      /* الهيئة الإدارية */
      const wrap = document.createElement('div');
      target.innerHTML = `<div class="stats-grid" style="margin-bottom:1.1rem">
        ${UI.statCard({ label: 'عدد الإداريين', value: S.db.employees.length, icon: 'school', tone: 'blue' })}
        ${UI.statCard({ label: 'الأقسام المشمولة', value: deptCounts.length, icon: 'classes', tone: 'purple' })}
        ${UI.statCard({ label: 'في حالة نشطة', value: S.db.employees.filter(e => e.status === 'نشط').length, icon: 'checkCircle', tone: 'green' })}
        ${UI.statCard({ label: 'أقدم تعيين', value: U.fmtDate(S.db.employees.map(e => e.hireDate).sort()[0]), icon: 'calendar', tone: 'gold' })}
      </div>`;
      target.appendChild(wrap);
      crudPage(wrap, {
        collection: 'employees',
        entityName: 'موظف إداري',
        title: 'الهيئة الإدارية',
        noPageHead: true,
        icon: 'school',
        fileSlug: 'الهيئة-الادارية',
        printTitle: 'تقرير الإدارة',
        searchPlaceholder: 'ابحث بالاسم، المسمى الوظيفي، القسم…',
        searchKeys: ['name', 'jobTitle', 'dept', 'nationalId', 'phone'],
        filters: () => [
          { key: 'dept', label: 'القسم', options: CONFIG.empDepartments, match: (r, v) => r.dept === v },
          { key: 'status', label: 'الحالة', options: CONFIG.empStatuses, match: (r, v) => r.status === v },
        ],
        columns: [
          { label: 'الاسم', render: e => UI.personCell(e.name, e.nationalId ? `هوية: <span class="ltr">${U.esc(e.nationalId)}</span>` : '', '') },
          { label: 'المسمى الوظيفي', render: e => `<div class="t-main small">${U.esc(e.jobTitle)}</div>` },
          { label: 'القسم', render: e => UI.badge(e.dept || '—', 'blue', false) },
          { label: 'رقم الجوال', render: e => `<span class="ltr nowrap">${U.esc(e.phone || '—')}</span>` },
          { label: 'تاريخ التعيين', render: e => `<span class="small nowrap">${U.fmtDate(e.hireDate)}</span>` },
          { label: 'الحالة', render: e => UI.badge(e.status, U.badgeTone(e.status)) },
        ],
        formFields: () => [
          { type: 'section', label: 'البيانات الشخصية', icon: 'idCard' },
          { name: 'name', label: 'اسم الموظف', type: 'text', required: true, placeholder: 'الاسم الرباعي' },
          { name: 'nationalId', label: 'رقم الهوية', type: 'tel', placeholder: '9xxxxxxxx', attrs: 'maxlength="9"' },
          { name: 'phone', label: 'رقم الجوال', type: 'tel', placeholder: '059xxxxxxx' },
          { type: 'section', label: 'بيانات العمل', icon: 'school' },
          { name: 'jobTitle', label: 'المسمى الوظيفي', type: 'text', required: true, placeholder: 'مثال: مرشدة تربوية' },
          { name: 'dept', label: 'القسم', type: 'select', options: CONFIG.empDepartments, required: true },
          { name: 'hireDate', label: 'تاريخ التعيين', type: 'date', required: true },
          { name: 'salary', label: 'الراتب الشهري (شيكل)', type: 'number', min: 0, placeholder: 'مثال: 2500' },
          { name: 'status', label: 'الحالة', type: 'select', options: CONFIG.empStatuses, required: true },
          { name: 'notes', label: 'ملاحظات', type: 'textarea', span: 2, placeholder: 'ملاحظات إضافية…' },
        ],
        initialNew: () => ({ status: 'نشط', hireDate: U.today(), dept: 'الإدارة العامة' }),
        mapSubmit: (v) => ({ name: v.name, nationalId: v.nationalId || '', phone: v.phone || '', jobTitle: v.jobTitle, dept: v.dept, hireDate: v.hireDate, salary: v.salary || '', status: v.status, notes: v.notes || '' }),
        profile: empProfile,
        printColumns: empCols,
        landscape: true,
        share(rows) {
          const text = [
            `🏫 *الهيئة الإدارية — ${S.settings().schoolName}*`,
            `📅 ${U.fmtDateFull(U.today())}`, '',
            `العدد: ${U.fn(rows.length)} موظف إداري`,
            ...rows.slice(0, 8).map(e => `• ${e.name} — ${e.jobTitle}`),
            rows.length > 8 ? `…و ${U.fn(rows.length - 8)} آخرين` : '', '',
            `_صادر عن ${CONFIG.systemName}_`,
          ].filter(Boolean).join('\n');
          U.waShare(text);
          S.log('مشاركة عبر واتساب', 'مشاركة بيانات الهيئة الإدارية');
        },
      });
    }

    container.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => { tab = t.dataset.t; render(); }));
  }

  render();
};
