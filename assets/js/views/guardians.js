/* =====================================================================
   صفحة أولياء الأمور
   ===================================================================== */
'use strict';
window.Views = window.Views || {};

Views.guardians = function (container) {
  const childrenOptions = () => S.db.students.map(s => ({ v: String(s.id), l: `${s.name} — ${s.grade} ${s.section}` }));

  function childrenBadges(g) {
    const kids = S.childrenOf(g.id);
    if (!kids.length) return '<span class="faint small">لا يوجد أبناء مرتبطون</span>';
    return `<div style="display:flex;gap:.3rem;flex-wrap:wrap">${kids.slice(0, 3).map(k => `<span class="chip" style="cursor:pointer" data-go="#/students/${k.id}" title="${U.esc(k.grade)}">${U.esc(k.name.split(' ').slice(0, 2).join(' '))}</span>`).join('')}${kids.length > 3 ? `<span class="chip">+${U.fn(kids.length - 3)}</span>` : ''}</div>`;
  }

  function profileDialog(g, reload) {
    const kids = S.childrenOf(g.id);
    UI.dialog({
      title: 'ملف ولي الأمر', sub: g.name, icon: 'guardians', size: 'lg',
      body: `
        <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1.1rem">
          ${UI.avatar(g.name, 'a-user', 'lg')}
          <div style="flex:1">
            <h3 style="font-size:1.15rem">${U.esc(g.name)}</h3>
            <div class="flex mt-1">${UI.badge(g.relation, 'teal')}<span class="chip">${UI.icon('users')} ${U.fn(kids.length)} ${kids.length === 1 ? 'ابن' : 'أبناء'} في المدرسة</span></div>
          </div>
          <a class="btn wa sm" href="${U.waLink(`السلام عليكم، معكم إدارة ${S.settings().schoolName}.`, g.phone)}" target="_blank">${UI.icon('whatsapp')} تواصل</a>
        </div>
        <div class="info-grid" style="border:1px solid var(--border);border-radius:12px;overflow:hidden">
          ${[['رقم الهوية', g.nationalId || '—'], ['رقم الجوال', g.phone, 'ltr'], ['مكان السكن', U.fullAddress(g)], ['صلة القرابة', g.relation]].map(([k, v, dir]) =>
        `<div class="ig"><span class="k">${k}</span><span class="v ${dir || ''}">${U.esc(v)}</span></div>`).join('')}
        </div>
        ${g.notes ? `<div class="mt-2 chip" style="width:100%;justify-content:flex-start;padding:.6rem .9rem">${UI.icon('info')} ${U.esc(g.notes)}</div>` : ''}
        <div class="section-title mt-2">${UI.icon('users')} الأبناء المرتبطون</div>
        <div class="table-wrap" style="border:1px solid var(--border);border-radius:12px"><table class="tbl compact">
          <thead><tr><th>اسم الطالب</th><th>الصف</th><th>الحالة</th><th></th></tr></thead>
          <tbody>${kids.map(k => `<tr>
            <td>${UI.personCell(k.name, U.stageName(k.stage), k.gender)}</td>
            <td class="small">${U.esc(k.grade)} — ${U.esc(k.section)}</td>
            <td>${UI.badge(k.status, U.badgeTone(k.status))}</td>
            <td><button class="btn g sm" data-kid="${k.id}">عرض الملف ${UI.icon('chevronLeft')}</button></td></tr>`).join('') ||
        `<tr><td colspan="4">${UI.empty({ title: 'لا يوجد أبناء مرتبطون', sub: 'اربط الأبناء من شاشة التعديل', icon: 'users' })}</td></tr>`}</tbody>
        </table></div>`,
      foot: `<button class="btn o" data-close>إغلاق</button>`,
      onMount(el, close) {
        el.querySelectorAll('[data-kid]').forEach(b => b.addEventListener('click', () => { close(); App.go(`#/students/${b.dataset.kid}`); }));
      },
    });
  }

  crudPage(container, {
    collection: 'guardians',
    entityName: 'ولي أمر',
    title: 'أولياء الأمور',
    sub: () => `إدارة بيانات أولياء الأمور وربطهم بالأبناء — الإجمالي: ${U.fn(S.db.guardians.length)} ولي أمر`,
    icon: 'guardians',
    fileSlug: 'اولياء-الامور',
    printTitle: 'تقرير أولياء الأمور',
    searchPlaceholder: 'ابحث بالاسم، رقم الهوية، الجوال…',
    searchKeys: ['name', 'nationalId', 'phone'],
    filters: () => [
      { key: 'rel', label: 'صلة القرابة', options: CONFIG.relations, match: (r, v) => r.relation === v },
      { key: 'city', label: 'المدينة', options: CONFIG.cities, match: (r, v) => r.city === v },
    ],
    columns: [
      { label: 'اسم ولي الأمر', render: g => UI.personCell(g.name, g.nationalId ? `هوية: <span class="ltr">${U.esc(g.nationalId)}</span>` : '', '') },
      { label: 'رقم الجوال', render: g => `<span class="ltr nowrap">${U.esc(g.phone)}</span>` },
      { label: 'صلة القرابة', render: g => UI.badge(g.relation, g.relation === 'الأب' ? 'blue' : g.relation === 'الأم' ? 'purple' : 'teal') },
      { label: 'مكان السكن', render: g => `<div class="small">${U.esc(g.city || '')}</div><div class="t-sub">${U.esc(g.area || '')}</div>` },
      { label: 'الأبناء المرتبطون', render: childrenBadges },
      { label: 'ملاحظات', render: g => g.notes ? `<span class="small muted" title="${U.esc(g.notes)}">${U.esc(g.notes.slice(0, 30))}${g.notes.length > 30 ? '…' : ''}</span>` : '<span class="faint">—</span>' },
    ],
    formFields: (g) => [
      { type: 'section', label: 'البيانات الأساسية', icon: 'idCard' },
      { name: 'name', label: 'اسم ولي الأمر', type: 'text', required: true, placeholder: 'الاسم الثلاثي' },
      { name: 'nationalId', label: 'رقم الهوية', type: 'tel', placeholder: '9xxxxxxxx', attrs: 'maxlength="9"' },
      { name: 'phone', label: 'رقم الجوال', type: 'tel', required: true, placeholder: '059xxxxxxx' },
      { name: 'relation', label: 'صلة القرابة', type: 'select', options: CONFIG.relations, required: true },
      { type: 'section', label: 'مكان السكن', icon: 'home' },
      { name: 'governorate', label: 'المحافظة', type: 'select', options: CONFIG.governorates, required: true },
      { name: 'city', label: 'المدينة', type: 'select', options: CONFIG.cities, required: true },
      { name: 'area', label: 'المنطقة / العنوان', type: 'text', span: 2, placeholder: 'مثال: شارع صلاح الدين' },
      { type: 'section', label: 'الأبناء المرتبطون', icon: 'users' },
      { name: 'childrenIds', label: 'ربط الأبناء بالطلبة المسجلين', type: 'checkboxes', span: 2, options: childrenOptions(), hint: 'اختر الطلبة الأبناء ليتم ربطهم بولي الأمر' },
      { name: 'notes', label: 'ملاحظات', type: 'textarea', span: 2, placeholder: 'ملاحظات التواصل أو الحالة الاجتماعية…' },
    ],
    initial: (g) => ({ ...g, childrenIds: (S.childrenOf(g.id).map(c => String(c.id))) }),
    initialNew: () => ({ governorate: 'دير البلح', relation: 'الأب', childrenIds: [] }),
    mapSubmit: (v) => ({
      name: v.name, nationalId: v.nationalId || '', phone: v.phone,
      relation: v.relation, governorate: v.governorate, city: v.city, area: v.area || '',
      notes: v.notes || '', childrenIds: (v.childrenIds || []).map(Number),
    }),
    afterSave(saved, values, isEdit) {
      const ids = (values.childrenIds || []).map(Number);
      /* مزامنة الربط من جهة الطلبة */
      S.db.students.forEach(s => {
        if (ids.includes(s.id)) { if (s.guardianId !== saved.id) { s.guardianId = saved.id; s.guardianPhone = saved.phone; } }
        else if (s.guardianId === saved.id) { s.guardianId = null; s.guardianPhone = ''; }
      });
      S.save();
    },
    profile: profileDialog,
    printColumns: [
      { label: 'اسم ولي الأمر', get: g => g.name },
      { label: 'رقم الهوية', get: g => g.nationalId || '—' },
      { label: 'رقم الجوال', get: g => g.phone },
      { label: 'صلة القرابة', get: g => g.relation },
      { label: 'مكان السكن', get: g => U.fullAddress(g) },
      { label: 'الأبناء المرتبطون', get: g => S.childrenOf(g.id).map(k => k.name).join('، ') || '—' },
      { label: 'ملاحظات', get: g => g.notes || '—' },
    ],
    landscape: true,
    share(rows) {
      const text = [
        `👨‍👩‍👧 *أولياء أمور ${S.settings().schoolName}*`,
        `📅 ${U.fmtDateFull(U.today())}`, '',
        `العدد الإجمالي: ${U.fn(rows.length)} ولي أمر`,
        `إجمالي الأبناء المرتبطون: ${U.fn(S.db.students.filter(s => s.guardianId).length)} طالب`, '',
        `_صادر عن ${CONFIG.systemName}_`,
      ].join('\n');
      U.waShare(text);
      S.log('مشاركة عبر واتساب', 'مشاركة ملخص أولياء الأمور');
    },
  });

  UI.bindGo(container);
};
