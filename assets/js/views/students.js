/* =====================================================================
   الطلبة: القائمة + نماذج الإضافة والتعديل والحذف (مشتركة مع الملف الشخصي)
   ===================================================================== */
'use strict';
window.Views = window.Views || {};

/* ================= نموذج إضافة/تعديل طالب (مشترك) ================= */
function studentForm(stu = null, onDone = null) {
  const isEdit = !!stu;
  const guardOpts = S.db.guardians.map(g => ({ v: String(g.id), l: `${g.name} — ${g.phone}` }));

  UI.formDialog({
    title: isEdit ? 'تعديل بيانات الطالب' : 'إضافة طالب جديد',
    sub: isEdit ? `رقم الملف: ${stu.fileNo}` : 'أدخل بيانات الطالب الجديد',
    icon: 'students', size: 'xl', cols: 3,
    submitLabel: isEdit ? 'حفظ التعديلات' : 'إضافة الطالب',
    initial: stu ? {
      ...stu, guardianId: stu.guardianId ? String(stu.guardianId) : '',
      guardianName: '', guardianPhone: '',
    } : { status: 'نشط', regDate: U.today(), governorate: 'دير البلح', displacement: 'مقيم' },
    fields: [
      { type: 'section', label: 'البيانات الأساسية', icon: 'idCard' },
      { name: 'name', label: 'اسم الطالب', type: 'text', required: true, placeholder: 'الاسم الرباعي كاملاً' },
      ...(isEdit ? [{ name: 'fileNo', label: 'رقم الملف', type: 'static', value: stu.fileNo }] : []),
      { name: 'nationalId', label: 'رقم الهوية', type: 'tel', required: true, placeholder: '9xxxxxxxx', attrs: 'maxlength="9"' },
      { name: 'gender', label: 'الجنس', type: 'select', options: CONFIG.genders, required: true },
      { name: 'birthDate', label: 'تاريخ الميلاد', type: 'date', required: true },
      { name: 'phone', label: 'رقم الجوال', type: 'tel', placeholder: '059xxxxxxx' },
      { type: 'section', label: 'البيانات الدراسية', icon: 'classes' },
      { name: 'stage', label: 'المرحلة الدراسية', type: 'select', options: CONFIG.stages.map(s => ({ v: s.id, l: s.name })), required: true },
      { name: 'grade', label: 'الصف', type: 'select', options: [], required: true, placeholder: '— اختر المرحلة أولاً —' },
      { name: 'section', label: 'الشعبة', type: 'select', options: CONFIG.sections, required: true },
      { type: 'section', label: 'بيانات ولي الأمر', icon: 'guardians' },
      { name: 'guardianId', label: 'ولي الأمر', type: 'select', span: 3, options: [{ v: '', l: '— بدون ربط —' }, { v: '__new__', l: '➕ تسجيل ولي أمر جديد…' }, ...guardOpts], placeholder: undefined },
      { name: 'guardianName', label: 'اسم ولي الأمر الجديد', type: 'text', placeholder: 'الاسم الثلاثي' },
      { name: 'guardianPhone', label: 'جوال ولي الأمر الجديد', type: 'tel', placeholder: '059xxxxxxx', required: true },
      { name: 'guardianRelation', label: 'صلة القرابة', type: 'select', options: CONFIG.relations },
      { type: 'section', label: 'بيانات السكن والنزوح', icon: 'home' },
      { name: 'governorate', label: 'المحافظة', type: 'select', options: CONFIG.governorates, required: true },
      { name: 'city', label: 'المدينة', type: 'select', options: CONFIG.cities, required: true },
      { name: 'area', label: 'المنطقة / العنوان التفصيلي', type: 'text', placeholder: 'مثال: شارع صلاح الدين' },
      { name: 'housingType', label: 'نوع السكن', type: 'select', options: CONFIG.housingTypes },
      { name: 'displacement', label: 'حالة النزوح', type: 'select', options: CONFIG.displacementStatuses },
      { type: 'section', label: 'بيانات التسجيل', icon: 'calendar' },
      { name: 'regDate', label: 'تاريخ التسجيل', type: 'date', required: true },
      { name: 'status', label: 'حالة الطالب', type: 'select', options: CONFIG.studentStatuses, required: true },
      { name: 'notes', label: 'ملاحظات', type: 'textarea', span: 3, placeholder: 'ملاحظات إدارية أو صحية أو اجتماعية…' },
    ],
    onMount(api) {
      const fillGrades = (stageId, keep) => {
        const st2 = CONFIG.stages.find(x => x.id === stageId);
        api.setOptions('grade', st2 ? st2.grades : [], '— اختر الصف —');
        if (keep) api.setValue('grade', keep);
      };
      api.onChange('stage', () => fillGrades(api.value('stage')));
      if (stu) fillGrades(stu.stage, stu.grade);

      /* إظهار حقول ولي الأمر الجديد عند الحاجة فقط */
      const wrap = (name) => api.form.querySelector(`[name="${name}"]`)?.closest('.field');
      const toggleNew = () => {
        const isNew = api.value('guardianId') === '__new__';
        ['guardianName', 'guardianPhone', 'guardianRelation'].forEach(n => { const w = wrap(n); if (w) w.style.display = isNew ? '' : 'none'; });
      };
      toggleNew();
      api.onChange('guardianId', toggleNew);
    },
    onSubmit(v) {
      let guardianId = v.guardianId && v.guardianId !== '__new__' ? +v.guardianId : null;
      if (v.guardianId === '__new__') {
        if (!v.guardianName || !v.guardianPhone) { UI.err('يرجى إدخال اسم وجوال ولي الأمر الجديد'); return false; }
        const g = S.add('guardians', {
          name: v.guardianName, nationalId: '', phone: v.guardianPhone,
          governorate: v.governorate, city: v.city, area: v.area,
          relation: v.guardianRelation || 'الأب', childrenIds: [], notes: '',
        });
        guardianId = g.id;
        S.log('إضافة ولي أمر', `تسجيل ولي الأمر «${g.name}»`);
      }
      const guardianObj = guardianId ? S.find('guardians', guardianId) : null;
      const data = {
        name: v.name, nationalId: v.nationalId, phone: v.phone || '',
        birthDate: v.birthDate, gender: v.gender,
        stage: v.stage, grade: v.grade, section: v.section,
        guardianId, guardianPhone: guardianObj ? guardianObj.phone : '',
        governorate: v.governorate, city: v.city, area: v.area,
        housingType: v.housingType || '', displacement: v.displacement || 'مقيم',
        regDate: v.regDate, status: v.status, notes: v.notes || '',
      };
      if (isEdit) {
        S.update('students', stu.id, data);
        if (guardianId) { const g = S.find('guardians', guardianId); if (g && !(g.childrenIds || []).includes(stu.id)) { g.childrenIds = g.childrenIds || []; g.childrenIds.push(stu.id); S.save(); } }
        S.log('تعديل بيانات طالب', `تحديث بيانات الطالب «${v.name}» (${stu.fileNo})`);
        UI.ok(`تم حفظ تعديلات الطالب «${v.name}» بنجاح`);
      } else {
        const nid = S.nextId('students');
        const created = S.add('students', { ...data, fileNo: String(1000 + nid) });
        if (guardianId) { const g = S.find('guardians', guardianId); g.childrenIds = g.childrenIds || []; g.childrenIds.push(created.id); S.save(); }
        S.log('إضافة طالب جديد', `تسجيل الطالب «${v.name}» في ${U.stageName(v.stage)} — ${v.grade} شعبة ${v.section} (ملف رقم ${created.fileNo})`);
        UI.ok(`تم تسجيل الطالب «${v.name}» برقم ملف ${U.fn(created.fileNo)}`, 'تمت الإضافة بنجاح');
      }
      if (onDone) onDone();
      return true;
    },
  });
}

/* ================= حذف طالب (مشترك) ================= */
async function studentDelete(stu, onDone = null) {
  const yes = await UI.confirm({
    title: 'حذف الطالب', danger: true, icon: 'trash',
    message: `هل أنت متأكد من حذف الطالب <b>«${U.esc(stu.name)}»</b> (رقم الملف ${U.esc(stu.fileNo)})؟<br><span class="small muted">سيتم حذف سجلات الحضور والأداء المرتبطة به نهائياً، ولا يمكن التراجع عن هذا الإجراء.</span>`,
    okLabel: 'حذف نهائي',
  });
  if (!yes) return;
  S.remove('students', stu.id);
  S.log('حذف طالب', `حذف الطالب «${stu.name}» (${stu.fileNo}) من النظام`);
  UI.ok('تم حذف الطالب من النظام', 'تم الحذف');
  if (onDone) onDone();
}

/* إتاحتهما لجميع الصفحات */
window.StudentForm = studentForm;
window.StudentDelete = studentDelete;

/* ================= صفحة قائمة الطلبة ================= */
Views.students = function (container, params = {}) {
  const stageOptions = CONFIG.stages.map(s => ({ v: s.id, l: s.name }));
  const allGrades = CONFIG.stages.flatMap(s => s.grades);

  /* ---------- طباعة وتصدير ومشاركة ---------- */
  const listColumns = [
    { label: 'رقم الملف', get: r => r.fileNo },
    { label: 'اسم الطالب', get: r => r.name },
    { label: 'الجنس', get: r => r.gender },
    { label: 'المرحلة الدراسية', get: r => U.stageName(r.stage) },
    { label: 'الصف', get: r => r.grade },
    { label: 'الشعبة', get: r => r.section },
    { label: 'ولي الأمر', get: r => (S.guardianOf(r) || {}).name || '—' },
    { label: 'جوال ولي الأمر', get: r => r.guardianPhone || (S.guardianOf(r) || {}).phone || '—' },
    { label: 'حالة النزوح', get: r => r.displacement },
    { label: 'حالة الطالب', get: r => r.status },
  ];

  function exportCSV(rows) {
    const headers = ['رقم الملف', 'اسم الطالب', 'رقم الهوية', 'رقم الجوال', 'تاريخ الميلاد', 'الجنس', 'المرحلة الدراسية', 'الصف', 'الشعبة', 'اسم ولي الأمر', 'رقم جوال ولي الأمر', 'المحافظة', 'المدينة', 'المنطقة', 'نوع السكن', 'حالة النزوح', 'تاريخ التسجيل', 'حالة الطالب', 'ملاحظات'];
    const data = rows.map(s => [s.fileNo, s.name, s.nationalId, s.phone, s.birthDate, s.gender, U.stageName(s.stage), s.grade, s.section, (S.guardianOf(s) || {}).name || '', s.guardianPhone, s.governorate, s.city, s.area, s.housingType, s.displacement, s.regDate, s.status, s.notes]);
    U.download(`قائمة-الطلبة-${U.today()}.csv`, U.toCSV(headers, data));
    S.log('تصدير بيانات', `تصدير قائمة الطلبة بصيغة CSV (${rows.length} سجل)`);
    UI.ok('تم تصدير قائمة الطلبة بصيغة CSV');
  }

  function printList(rows) {
    U.printDoc({
      title: 'كشف بأسماء الطلبة', landscape: true,
      meta: `عدد السجلات: ${U.fn(rows.length)} — ${U.fmtDateFull(U.today())}`,
      body: U.printTable(listColumns, rows),
    });
    S.log('طباعة تقرير', `طباعة كشف بأسماء الطلبة (${rows.length} سجل)`);
  }

  function shareList(rows) {
    const c = (id) => rows.filter(s => s.stage === id).length;
    const text = [
      `📋 *كشف طلبة ${S.settings().schoolName}*`,
      `📅 التاريخ: ${U.fmtDateFull(U.today())}`, '',
      `👥 إجمالي الطلبة: ${U.fn(rows.length)}`,
      `🟢 ${CONFIG.stages[0].name}: ${U.fn(c('primary'))}`,
      `🔵 ${CONFIG.stages[1].name}: ${U.fn(c('prep'))}`,
      `🟣 ${CONFIG.stages[2].name}: ${U.fn(c('secondary'))}`, '',
      `_صادر عن ${CONFIG.systemName}_`,
    ].join('\n');
    U.waShare(text);
    S.log('مشاركة عبر واتساب', 'مشاركة ملخص كشف الطلبة عبر واتساب');
  }

  /* ---------- بناء الصفحة ---------- */
  const ph = UI.pageHead({
    title: 'الطلبة',
    sub: `إدارة سجلات الطلبة — الإجمالي: ${U.fn(S.db.students.length)} طالب وطالبة`,
    actions: [
      { label: 'إضافة طالب', icon: 'plus', kind: 'p', onClick: () => studentForm(null, () => renderList()) },
      { label: 'طباعة', icon: 'print', kind: 'o', onClick: () => printList(dt ? dt.getFiltered() : S.db.students) },
      { label: 'تصدير', icon: 'download', kind: 'o', onClick: () => exportCSV(dt ? dt.getFiltered() : S.db.students) },
      { label: 'مشاركة عبر واتساب', icon: 'whatsapp', kind: 'wa', onClick: () => shareList(dt ? dt.getFiltered() : S.db.students) },
    ],
  });

  const tableMount = document.createElement('div');
  container.innerHTML = ph.html;
  container.appendChild(tableMount);
  ph.bind(container);

  let dt = null;
  function renderList() {
    const rows = [...S.db.students].sort((a, b) => a.id - b.id);
    if (!dt) {
      dt = UI.dataTable(tableMount, {
        rows,
        searchPlaceholder: 'ابحث بالاسم، رقم الملف، رقم الهوية…',
        searchKeys: ['name', 'fileNo', 'nationalId', 'phone', r => (S.guardianOf(r) || {}).name || ''],
        filters: [
          { key: 'stage', label: 'المرحلة الدراسية', options: stageOptions, match: (r, v) => r.stage === v },
          { key: 'grade', label: 'الصف', options: allGrades, match: (r, v) => r.grade === v },
          { key: 'section', label: 'الشعبة', options: CONFIG.sections, match: (r, v) => r.section === v },
          { key: 'gender', label: 'الجنس', options: CONFIG.genders, match: (r, v) => r.gender === v },
          { key: 'disp', label: 'حالة النزوح', options: CONFIG.displacementStatuses, match: (r, v) => r.displacement === v },
          { key: 'status', label: 'حالة الطالب', options: CONFIG.studentStatuses, match: (r, v) => r.status === v },
        ],
        columns: [
          { label: 'رقم الملف', render: r => `<span class="chip num">${U.esc(r.fileNo)}</span>` },
          { label: 'اسم الطالب', render: r => UI.personCell(r.name, `${r.gender} • العمر ${U.age(r.birthDate) !== null ? U.fn(U.age(r.birthDate)) + ' سنوات' : '—'}`, r.gender) },
          { label: 'المرحلة / الصف', render: r => `<div class="t-main small">${U.stageName(r.stage)}</div><div class="t-sub">${U.esc(r.grade)} — شعبة ${U.esc(r.section)}</div>` },
          { label: 'ولي الأمر', render: r => { const g = S.guardianOf(r); return g ? `<div class="t-main small">${U.esc(g.name)}</div><div class="t-sub ltr" style="text-align:right">${U.esc(g.phone)}</div>` : '<span class="faint">—</span>'; } },
          { label: 'مكان السكن', render: r => `<div class="small">${U.esc(r.city)}</div><div class="t-sub">${U.esc(r.area || '')}</div>` },
          { label: 'حالة النزوح', render: r => UI.badge(r.displacement, U.badgeTone(r.displacement)) },
          { label: 'الحالة', render: r => UI.badge(r.status, U.badgeTone(r.status)) },
        ],
        actions: (r) => [
          { icon: 'eye', title: 'عرض ملف الطالب', onClick: () => App.go(`#/students/${r.id}`) },
          { icon: 'qr', title: 'إنشاء رمز QR', onClick: () => QRU.showStudentQR(r) },
          { icon: 'edit', title: 'تعديل', tone: 'edit', onClick: () => studentForm(r, () => renderList()) },
          { icon: 'trash', title: 'حذف', tone: 'del', onClick: () => studentDelete(r, () => renderList()) },
        ],
        onRowClick: (r) => App.go(`#/students/${r.id}`),
        pageSize: 10,
        emptyTitle: 'لا يوجد طلبة مطابقون',
        emptySub: 'يمكنك إضافة طالب جديد من زر «إضافة طالب» أعلى الصفحة',
        emptyIcon: 'students',
      });
    } else dt.setRows(rows);

    /* تطبيق مرشح قادم من الرابط */
    ['stage', 'grade', 'section'].forEach(k => {
      if (!params[k]) return;
      const sel = tableMount.querySelector(`select[data-fkey="${k}"]`);
      if (sel && sel.value !== params[k]) { sel.value = params[k]; sel.dispatchEvent(new Event('change')); }
      params[k] = null;
    });
  }

  renderList();
};
