/* =====================================================================
   صفحة العاملون
   ===================================================================== */
'use strict';
window.Views = window.Views || {};

Views.workers = function (container) {

  function profileDialog(w) {
    UI.dialog({
      title: 'ملف العامل', sub: w.name, icon: 'workers', size: 'sm',
      body: `
        <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1rem">
          ${UI.avatar(w.name, 'a-user', 'lg')}
          <div><h3 style="font-size:1.1rem">${U.esc(w.name)}</h3>
          <div class="flex mt-1">${UI.badge(w.jobTitle, 'amber')}${UI.badge(w.status, U.badgeTone(w.status))}</div></div>
        </div>
        ${[['رقم الهوية', w.nationalId || '—'], ['رقم الجوال', w.phone], ['المسمى الوظيفي', w.jobTitle], ['الفترة', w.shift || '—'], ['تاريخ التعيين', U.fmtDate(w.hireDate)], ['الراتب الشهري', w.salary ? `${U.fn(w.salary)} شيكل` : '—'], ['ملاحظات', w.notes || '—']]
          .map(([k, v]) => `<div class="kv"><span class="k">${k}</span><span class="v">${U.esc(v)}</span></div>`).join('')}`,
      foot: `<button class="btn o" data-close>إغلاق</button>`,
    });
  }

  crudPage(container, {
    collection: 'workers',
    entityName: 'عامل',
    title: 'العاملون',
    sub: () => `إدارة عمال النظافة والحراسة والصيانة والخدمات — الإجمالي: ${U.fn(S.db.workers.length)} عامل`,
    icon: 'workers',
    fileSlug: 'العاملون',
    printTitle: 'تقرير العاملين',
    searchPlaceholder: 'ابحث بالاسم، المسمى الوظيفي…',
    searchKeys: ['name', 'jobTitle', 'nationalId', 'phone'],
    filters: () => [
      { key: 'job', label: 'المسمى الوظيفي', options: CONFIG.workerJobs, match: (r, v) => r.jobTitle === v },
      { key: 'shift', label: 'الفترة', options: CONFIG.shifts, match: (r, v) => r.shift === v },
      { key: 'status', label: 'الحالة', options: CONFIG.empStatuses, match: (r, v) => r.status === v },
    ],
    columns: [
      { label: 'اسم العامل', render: w => UI.personCell(w.name, w.hireDate ? `منذ ${U.fmtDate(w.hireDate)}` : '', '') },
      { label: 'المسمى الوظيفي', render: w => UI.badge(w.jobTitle, 'amber', false) },
      { label: 'الفترة', render: w => `<span class="chip">${UI.icon('clock')} ${U.esc(w.shift || '—')}</span>` },
      { label: 'رقم الجوال', render: w => `<span class="ltr nowrap">${U.esc(w.phone || '—')}</span>` },
      { label: 'الحالة', render: w => UI.badge(w.status, U.badgeTone(w.status)) },
    ],
    formFields: () => [
      { type: 'section', label: 'البيانات الشخصية', icon: 'idCard' },
      { name: 'name', label: 'اسم العامل', type: 'text', required: true, placeholder: 'الاسم الثلاثي' },
      { name: 'nationalId', label: 'رقم الهوية', type: 'tel', placeholder: '9xxxxxxxx', attrs: 'maxlength="9"' },
      { name: 'phone', label: 'رقم الجوال', type: 'tel', placeholder: '059xxxxxxx' },
      { type: 'section', label: 'بيانات العمل', icon: 'workers' },
      { name: 'jobTitle', label: 'المسمى الوظيفي', type: 'select', options: CONFIG.workerJobs, required: true },
      { name: 'shift', label: 'الفترة', type: 'select', options: CONFIG.shifts, required: true },
      { name: 'hireDate', label: 'تاريخ التعيين', type: 'date', required: true },
      { name: 'salary', label: 'الراتب الشهري (شيكل)', type: 'number', min: 0, placeholder: 'مثال: 1800' },
      { name: 'status', label: 'الحالة', type: 'select', options: CONFIG.empStatuses, required: true },
      { name: 'notes', label: 'ملاحظات', type: 'textarea', span: 2, placeholder: 'ملاحظات إضافية…' },
    ],
    initialNew: () => ({ status: 'نشط', hireDate: U.today(), shift: 'الفترة الصباحية' }),
    mapSubmit: (v) => ({ name: v.name, nationalId: v.nationalId || '', phone: v.phone || '', jobTitle: v.jobTitle, shift: v.shift, hireDate: v.hireDate, salary: v.salary || '', status: v.status, notes: v.notes || '' }),
    profile: profileDialog,
    printColumns: [
      { label: 'اسم العامل', get: w => w.name },
      { label: 'رقم الهوية', get: w => w.nationalId || '—' },
      { label: 'المسمى الوظيفي', get: w => w.jobTitle },
      { label: 'الفترة', get: w => w.shift || '—' },
      { label: 'رقم الجوال', get: w => w.phone || '—' },
      { label: 'تاريخ التعيين', get: w => U.fmtDate(w.hireDate) },
      { label: 'الحالة', get: w => w.status },
    ],
    share(rows) {
      const text = [
        `🧰 *العاملون في ${S.settings().schoolName}*`,
        `📅 ${U.fmtDateFull(U.today())}`, '',
        `العدد: ${U.fn(rows.length)} عامل`,
        ...CONFIG.workerJobs.map(j => { const c = rows.filter(w => w.jobTitle === j).length; return c ? `• ${j}: ${U.fn(c)}` : ''; }).filter(Boolean), '',
        `_صادر عن ${CONFIG.systemName}_`,
      ].join('\n');
      U.waShare(text);
      S.log('مشاركة عبر واتساب', 'مشاركة ملخص العاملين');
    },
  });
};
