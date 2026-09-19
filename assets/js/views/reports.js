/* =====================================================================
   مركز التقارير: تقارير جاهزة بالتصفية والطباعة والمشاركة
   ===================================================================== */
'use strict';
window.Views = window.Views || {};

Views.reports = function (container) {
  let selected = null;
  let built = null;

  const stageOpts = CONFIG.stages.map(s => ({ v: s.id, l: s.name }));
  const pctOf = (r) => Math.round(r.score / (r.maxScore || 100) * 100);

  /* ================= تعريف التقارير ================= */
  const REPORTS = [
    {
      id: 'students', title: 'تقرير الطلبة', icon: 'students', tone: 'teal', landscape: true,
      desc: 'كشف شامل بأسماء الطلبة مع بيانات المرحلة والصف والسكن وحالة النزوح',
      filters: [
        { key: 'stage', label: 'المرحلة الدراسية', type: 'select', options: [{ v: '', l: 'الكل' }, ...stageOpts] },
        { key: 'status', label: 'حالة الطالب', type: 'select', options: [{ v: '', l: 'الكل' }, ...CONFIG.studentStatuses] },
        { key: 'disp', label: 'حالة النزوح', type: 'select', options: [{ v: '', l: 'الكل' }, ...CONFIG.displacementStatuses] },
      ],
      build(f) {
        const rows = S.db.students.filter(s => (!f.stage || s.stage === f.stage) && (!f.status || s.status === f.status) && (!f.disp || s.displacement === f.disp));
        return {
          kpis: [['إجمالي الطلبة', rows.length], ['إناث', rows.filter(s => s.gender === 'أنثى').length], ['ذكور', rows.filter(s => s.gender === 'ذكر').length], ['نازحون', rows.filter(s => s.displacement === 'نازح').length]],
          columns: [
            { label: 'رقم الملف', get: r => r.fileNo }, { label: 'اسم الطالب', get: r => r.name }, { label: 'الجنس', get: r => r.gender },
            { label: 'المرحلة', get: r => U.stageName(r.stage) }, { label: 'الصف', get: r => r.grade }, { label: 'الشعبة', get: r => r.section },
            { label: 'ولي الأمر', get: r => (S.guardianOf(r) || {}).name || '—' }, { label: 'جوال ولي الأمر', get: r => r.guardianPhone || '—' },
            { label: 'مكان السكن', get: r => U.fullAddress(r) }, { label: 'حالة النزوح', get: r => r.displacement }, { label: 'الحالة', get: r => r.status },
          ], rows,
          text: [`📋 *تقرير الطلبة — ${S.settings().schoolName}*`, `👥 الإجمالي: ${U.fn(rows.length)}`, `👧 إناث: ${U.fn(rows.filter(s => s.gender === 'أنثى').length)} • 👦 ذكور: ${U.fn(rows.filter(s => s.gender === 'ذكر').length)}`, `🏠 نازحون: ${U.fn(rows.filter(s => s.displacement === 'نازح').length)}`],
        };
      },
    },
    {
      id: 'guardians', title: 'تقرير أولياء الأمور', icon: 'guardians', tone: 'gold', landscape: true,
      desc: 'بيانات أولياء الأمور وصلات القرابة والأبناء المرتبطين بهم',
      filters: [
        { key: 'rel', label: 'صلة القرابة', type: 'select', options: [{ v: '', l: 'الكل' }, ...CONFIG.relations] },
        { key: 'city', label: 'المدينة', type: 'select', options: [{ v: '', l: 'الكل' }, ...CONFIG.cities] },
      ],
      build(f) {
        const rows = S.db.guardians.filter(g => (!f.rel || g.relation === f.rel) && (!f.city || g.city === f.city));
        return {
          kpis: [['إجمالي أولياء الأمور', rows.length], ['آباء', rows.filter(g => g.relation === 'الأب').length], ['أمهات', rows.filter(g => g.relation === 'الأم').length], ['أبناء مرتبطون', S.db.students.filter(s => s.guardianId).length]],
          columns: [
            { label: 'اسم ولي الأمر', get: r => r.name }, { label: 'رقم الهوية', get: r => r.nationalId || '—' }, { label: 'الجوال', get: r => r.phone },
            { label: 'صلة القرابة', get: r => r.relation }, { label: 'مكان السكن', get: r => U.fullAddress(r) },
            { label: 'الأبناء المرتبطون', get: r => S.childrenOf(r.id).map(k => k.name).join('، ') || '—' },
          ], rows,
          text: [`👨‍👩‍👧 *تقرير أولياء الأمور*`, `الإجمالي: ${U.fn(rows.length)}`, `آباء: ${U.fn(rows.filter(g => g.relation === 'الأب').length)} • أمهات: ${U.fn(rows.filter(g => g.relation === 'الأم').length)}`],
        };
      },
    },
    {
      id: 'attendance', title: 'تقرير الحضور والغياب', icon: 'attendance', tone: 'red', landscape: true,
      desc: 'تقرير مفصل بسجلات الحضور والغياب والتأخر خلال فترة محددة',
      filters: [
        { key: 'from', label: 'من تاريخ', type: 'date', default: U.addDays(U.today(), -7) },
        { key: 'to', label: 'إلى تاريخ', type: 'date', default: U.today() },
        { key: 'status', label: 'الحالة', type: 'select', options: [{ v: '', l: 'الكل' }, ...CONFIG.attendanceStatuses.map(a => ({ v: a.id, l: a.name }))] },
      ],
      build(f) {
        const rows = S.db.attendance.filter(a => a.date >= f.from && a.date <= f.to && (!f.status || a.status === f.status))
          .map(a => ({ ...a, stu: S.student(a.studentId) })).filter(a => a.stu)
          .sort((a, b) => a.date.localeCompare(b.date) || a.stu.name.localeCompare(b.stu.name, 'ar'));
        const c = (s) => rows.filter(a => a.status === s).length;
        return {
          kpis: [['حاضر', c('present')], ['غائب', c('absent')], ['متأخر', c('late')], ['بعذر', c('excused')], ['نسبة الحضور', (rows.length ? Math.round(c('present') / rows.length * 100) : 0) + '٪']],
          columns: [
            { label: 'التاريخ', get: r => U.fmtDate(r.date) }, { label: 'اليوم', get: r => CONFIG.weekdays[U.parseISO(r.date).getDay()] },
            { label: 'اسم الطالب', get: r => r.stu.name }, { label: 'المرحلة', get: r => U.stageName(r.stu.stage) },
            { label: 'الصف', get: r => r.stu.grade }, { label: 'الشعبة', get: r => r.stu.section }, { label: 'الحالة', get: r => U.attStatus(r.status).name },
          ], rows,
          text: [`🗓 *تقرير الحضور (${U.fmtDate(f.from)} — ${U.fmtDate(f.to)})*`, `✅ حاضر: ${U.fn(c('present'))} • ❌ غائب: ${U.fn(c('absent'))} • ⏰ متأخر: ${U.fn(c('late'))}`, `📊 نسبة الحضور: ${rows.length ? U.fn(Math.round(c('present') / rows.length * 100)) : 0}٪`],
        };
      },
    },
    {
      id: 'performance', title: 'تقرير الأداء الأكاديمي', icon: 'performance', tone: 'blue', landscape: true,
      desc: 'سجلات الدرجات والنسب ومستويات الأداء حسب المادة والفصل الدراسي',
      filters: [
        { key: 'semester', label: 'الفصل الدراسي', type: 'select', options: [{ v: '', l: 'الكل' }, ...CONFIG.semesters] },
        { key: 'year', label: 'العام الدراسي', type: 'select', options: [{ v: '', l: 'الكل' }, ...CONFIG.academicYears] },
        { key: 'subject', label: 'المادة', type: 'select', options: [{ v: '', l: 'الكل' }, ...CONFIG.subjects] },
      ],
      build(f) {
        const rows = S.db.grades.filter(g => (!f.semester || g.semester === f.semester) && (!f.year || g.year === f.year) && (!f.subject || g.subject === f.subject))
          .map(g => ({ ...g, stu: S.student(g.studentId) })).filter(g => g.stu)
          .sort((a, b) => pctOf(b) - pctOf(a));
        const avg = rows.length ? Math.round(rows.reduce((t, r) => t + pctOf(r), 0) / rows.length * 10) / 10 : 0;
        return {
          kpis: [['عدد السجلات', rows.length], ['المتوسط العام', avg + '٪'], ['ممتاز', rows.filter(r => pctOf(r) >= 90).length], ['ضعيف', rows.filter(r => pctOf(r) < 60).length]],
          columns: [
            { label: 'اسم الطالب', get: r => r.stu.name }, { label: 'الصف', get: r => r.stu.grade }, { label: 'المادة', get: r => r.subject },
            { label: 'الاختبار', get: r => r.exam }, { label: 'الدرجة', get: r => `${r.score} / ${r.maxScore}` }, { label: 'النسبة', get: r => pctOf(r) + '٪' },
            { label: 'مستوى الأداء', get: r => U.perfLevel(pctOf(r)).name }, { label: 'الفصل / العام', get: r => `${r.semester} — ${r.year}` },
          ], rows,
          text: [`🎓 *تقرير الأداء الأكاديمي*`, `السجلات: ${U.fn(rows.length)} • المتوسط: ${U.fn(avg)}٪`, `ممتاز: ${U.fn(rows.filter(r => pctOf(r) >= 90).length)} • ضعيف: ${U.fn(rows.filter(r => pctOf(r) < 60).length)}`],
        };
      },
    },
    {
      id: 'tops', title: 'تقرير المتفوقين', icon: 'award', tone: 'gold',
      desc: 'قائمة الطلبة المتفوقين بمتوسط ٩٠٪ فأكثر مرتبة تنازلياً',
      filters: [
        { key: 'stage', label: 'المرحلة الدراسية', type: 'select', options: [{ v: '', l: 'الكل' }, ...stageOpts] },
        { key: 'min', label: 'الحد الأدنى للمتوسط', type: 'select', options: [{ v: '90', l: '٩٠٪ فأكثر' }, { v: '85', l: '٨٥٪ فأكثر' }, { v: '95', l: '٩٥٪ فأكثر' }] },
      ],
      build(f) {
        const rows = S.topStudents(null, null, +(f.min || 90)).filter(t => !f.stage || t.student.stage === f.stage);
        return {
          kpis: [['عدد المتفوقين', rows.length], ['أعلى متوسط', rows.length ? rows[0].avg + '٪' : '—'], ['المرحلة الابتدائية', rows.filter(t => t.student.stage === 'primary').length], ['الإعدادية والثانوية', rows.filter(t => t.student.stage !== 'primary').length]],
          columns: [
            { label: '#', get: r => U.fn(rows.indexOf(r) + 1) }, { label: 'اسم الطالب', get: r => r.student.name },
            { label: 'المرحلة', get: r => U.stageName(r.student.stage) }, { label: 'الصف', get: r => r.student.grade },
            { label: 'الشعبة', get: r => r.student.section }, { label: 'المتوسط', get: r => U.fn(r.avg) + '٪' }, { label: 'المستوى', get: r => U.perfLevel(r.avg).name },
          ], rows,
          text: [`🏆 *تقرير المتفوقين (${U.fn(+(f.min || 90))}٪ فأكثر)*`, ...rows.slice(0, 10).map((t, i) => `${U.fn(i + 1)}. ${t.student.name} — ${U.fn(t.avg)}٪`)],
        };
      },
    },
    {
      id: 'biscuits', title: 'تقرير توزيع البسكويت', icon: 'biscuit', tone: 'amber', landscape: true,
      desc: 'حركة مخزون البسكويت: الوارد والموزع والمتبقي وسجل التوزيع',
      filters: [
        { key: 'from', label: 'من تاريخ', type: 'date', default: '2026-08-01' },
        { key: 'to', label: 'إلى تاريخ', type: 'date', default: U.today() },
      ],
      build(f) {
        const dist = S.db.biscuitDist.filter(d => d.date >= f.from && d.date <= f.to).sort((a, b) => a.date.localeCompare(b.date));
        const moves = S.db.biscuitMoves.filter(m => m.date >= f.from && m.date <= f.to).sort((a, b) => a.date.localeCompare(b.date));
        const bs = S.biscuitStats();
        return {
          kpis: [['الوارد بالفترة', `${U.fn(moves.reduce((t, m) => t + m.cartons, 0))} كرتونة`], ['الموزع بالفترة', U.fmtPieces(dist.reduce((t, d) => t + d.pieces, 0))], ['المتبقي الحالي', U.fmtPieces(bs.remaining)], ['مرات التوزيع', dist.length]],
          sections: [
            { title: 'سجل الوارد', columns: [{ label: 'التاريخ', get: r => U.fmtDate(r.date) }, { label: 'الكراتين', get: r => U.fn(r.cartons) }, { label: 'القطع', get: r => U.fn(r.cartons * (r.piecesPerCarton || 50)) }, { label: 'الجهة', get: r => r.source || '—' }], rows: moves },
            { title: 'سجل التوزيع', columns: [{ label: 'التاريخ', get: r => U.fmtDate(r.date) }, { label: 'الجهة الموزع لها', get: r => r.label }, { label: 'المستفيدون', get: r => U.fn(r.studentsCount) }, { label: 'لكل طالب', get: r => U.fn(r.perStudent) }, { label: 'القطع', get: r => U.fn(r.pieces) }], rows: dist },
          ],
          text: [`🍪 *تقرير توزيع البسكويت*`, `الموزع بالفترة: ${U.fmtPieces(dist.reduce((t, d) => t + d.pieces, 0))}`, `المتبقي: ${U.fmtPieces(bs.remaining)}`],
        };
      },
    },
    {
      id: 'employees', title: 'تقرير الإدارة', icon: 'school', tone: 'blue', landscape: true,
      desc: 'كشف بالهيئة الإدارية ومسمياتهم الوظيفية وأقسامهم',
      filters: [{ key: 'dept', label: 'القسم', type: 'select', options: [{ v: '', l: 'الكل' }, ...CONFIG.empDepartments] }],
      build(f) {
        const rows = S.db.employees.filter(e => !f.dept || e.dept === f.dept);
        return {
          kpis: [['عدد الإداريين', rows.length], ['نشطون', rows.filter(e => e.status === 'نشط').length], ['الأقسام', new Set(rows.map(e => e.dept)).size]],
          columns: [
            { label: 'الاسم', get: r => r.name }, { label: 'المسمى الوظيفي', get: r => r.jobTitle }, { label: 'القسم', get: r => r.dept },
            { label: 'الجوال', get: r => r.phone || '—' }, { label: 'تاريخ التعيين', get: r => U.fmtDate(r.hireDate) }, { label: 'الحالة', get: r => r.status },
          ], rows,
          text: [`🏫 *تقرير الإدارة*`, `العدد: ${U.fn(rows.length)} موظف إداري`, ...rows.slice(0, 6).map(e => `• ${e.name} — ${e.jobTitle}`)],
        };
      },
    },
    {
      id: 'workers', title: 'تقرير العاملين', icon: 'workers', tone: 'amber',
      desc: 'كشف بالعاملين ووظائفهم وفترات عملهم',
      filters: [{ key: 'job', label: 'المسمى الوظيفي', type: 'select', options: [{ v: '', l: 'الكل' }, ...CONFIG.workerJobs] }],
      build(f) {
        const rows = S.db.workers.filter(w => !f.job || w.jobTitle === f.job);
        return {
          kpis: [['عدد العاملين', rows.length], ['الفترة الصباحية', rows.filter(w => w.shift === 'الفترة الصباحية').length], ['الفترة المسائية', rows.filter(w => w.shift === 'الفترة المسائية').length]],
          columns: [
            { label: 'الاسم', get: r => r.name }, { label: 'المسمى الوظيفي', get: r => r.jobTitle }, { label: 'الفترة', get: r => r.shift },
            { label: 'الجوال', get: r => r.phone || '—' }, { label: 'تاريخ التعيين', get: r => U.fmtDate(r.hireDate) }, { label: 'الحالة', get: r => r.status },
          ], rows,
          text: [`🧰 *تقرير العاملين*`, `العدد: ${U.fn(rows.length)} عامل`],
        };
      },
    },
    {
      id: 'full', title: 'التقرير الشامل', icon: 'reports', tone: 'purple', landscape: true, isFull: true,
      desc: 'تقرير إداري موجز يجمع مؤشرات الطلبة والحضور والأداء والمخزون والكوادر',
      filters: [],
      build() {
        const active = S.activeStudents();
        const tops = S.topStudents().slice(0, 10);
        const bs = S.biscuitStats();
        const att7 = S.db.attendance.filter(a => U.schoolDaysBack(7, U.today()).includes(a.date));
        const attC = (s) => att7.filter(a => a.status === s).length;
        return {
          sections: [
            { title: 'مؤشرات عامة', kpis: [['إجمالي الطلبة', active.length], ['أولياء الأمور', S.db.guardians.length], ['الهيئة الإدارية', S.db.employees.length], ['العاملون', S.db.workers.length], ['الشعب الدراسية', S.db.classes.length]] },
            { title: 'توزيع الطلبة حسب المرحلة', table: { columns: [{ label: 'المرحلة', get: r => r.name }, { label: 'إناث', get: r => U.fn(r.g) }, { label: 'ذكور', get: r => U.fn(r.b) }, { label: 'الإجمالي', get: r => U.fn(r.n) }], rows: CONFIG.stages.map(st2 => { const l = active.filter(s => s.stage === st2.id); return { name: st2.name, g: l.filter(s => s.gender === 'أنثى').length, b: l.filter(s => s.gender === 'ذكر').length, n: l.length }; }) } },
            { title: 'ملخص الحضور — آخر ٧ أيام دراسية', kpis: [['حاضر', attC('present')], ['غائب', attC('absent')], ['متأخر', attC('late')], ['بعذر', attC('excused')], ['نسبة الحضور', (att7.length ? Math.round(attC('present') / att7.length * 100) : 0) + '٪']] },
            { title: 'أوائل المتفوقين', table: { columns: [{ label: '#', get: r => U.fn(tops.indexOf(r) + 1) }, { label: 'اسم الطالب', get: r => r.student.name }, { label: 'الصف', get: r => r.student.grade }, { label: 'المتوسط', get: r => U.fn(r.avg) + '٪' }], rows: tops } },
            { title: 'مخزون البسكويت', kpis: [['الوارد', `${U.fn(bs.inCartons)} كرتونة`], ['الموزع', U.fmtPieces(bs.outPieces)], ['المتبقي', U.fmtPieces(bs.remaining)]] },
          ],
          text: [`📊 *التقرير الشامل — ${S.settings().schoolName}*`, `👥 الطلبة: ${U.fn(active.length)}`, `📈 نسبة الحضور الأسبوعية: ${att7.length ? U.fn(Math.round(attC('present') / att7.length * 100)) : 0}٪`, `🏆 المتفوقون: ${U.fn(tops.length)}`, `🍪 مخزون البسكويت: ${U.fmtPieces(bs.remaining)}`],
        };
      },
    },
  ];

  /* ================= العرض ================= */
  function previewTable(sec) {
    return `
      ${sec.title ? `<div class="section-title mt-2 mb-1">${sec.title}</div>` : ''}
      ${sec.kpis ? `<div class="flex mt-1 mb-1">${sec.kpis.map(([l, v]) => `<span class="chip" style="padding:.5rem .9rem"><span class="muted">${l}:</span> <b>${typeof v === 'number' ? U.fn(v) : U.esc(v)}</b></span>`).join('')}</div>` : ''}
      ${sec.table ? `<div class="table-wrap" style="border:1px solid var(--border);border-radius:12px;max-height:420px"><table class="tbl compact">
        <thead><tr>${sec.table.columns.map(c => `<th>${U.esc(c.label)}</th>`).join('')}</tr></thead>
        <tbody>${sec.table.rows.slice(0, 60).map(r => `<tr>${sec.table.columns.map(c => `<td>${U.esc(c.get(r))}</td>`).join('')}</tr>`).join('') ||
      `<tr><td colspan="9">${UI.empty({ title: 'لا توجد بيانات ضمن هذه التصفية', icon: 'reports' })}</td></tr>`}</tbody>
      </table></div>
      ${(sec.table.rows.length > 60) ? `<div class="small muted center mt-1">يُعرض أول ${U.fn(60)} سجل من ${U.fn(sec.table.rows.length)} — النسخة المطبوعة والمصدرة تشمل الكل</div>` : ''}` : ''}`;
  }

  function buildPrintBody(data) {
    let body = '';
    if (data.kpis) body += U.printKPIs(data.kpis);
    if (data.columns) body += U.printTable(data.columns, data.rows);
    if (data.sections) {
      for (const sec of data.sections) {
        body += `<div class="psec">${U.esc(sec.title)}</div>`;
        if (sec.kpis) body += U.printKPIs(sec.kpis);
        if (sec.table) body += U.printTable(sec.table.columns, sec.table.rows);
      }
    }
    return body;
  }

  function buildPreviewHTML(data) {
    let html = '';
    if (data.kpis) html += `<div class="flex">${data.kpis.map(([l, v]) => `<span class="chip" style="padding:.55rem 1rem"><span class="muted">${l}:</span> <b style="font-size:1rem">${typeof v === 'number' ? U.fn(v) : U.esc(v)}</b></span>`).join('')}</div>`;
    if (data.columns) html += previewTable({ table: { columns: data.columns, rows: data.rows } });
    if (data.sections) html += data.sections.map(sec => previewTable(sec)).join('');
    return html;
  }

  function renderFiltersCard(rep) {
    const fvals = {};
    rep.filters.forEach(f => fvals[f.key] = f.default ?? (f.type === 'select' ? f.options[0].v : ''));
    return `
      <div class="card">
        <div class="card-head"><div class="card-title">${UI.icon('filter')} خيارات التقرير — ${U.esc(rep.title)}</div></div>
        <div class="card-body">
          <div class="form-grid cols-4">
            ${rep.filters.map(f => f.type === 'select'
        ? `<div class="field"><label>${U.esc(f.label)}</label><select class="select" data-fk="${f.key}">${UI.opt(f.options, fvals[f.key], undefined)}</select></div>`
        : `<div class="field"><label>${U.esc(f.label)}</label><input type="date" class="input ltr" style="text-align:right" data-fk="${f.key}" value="${fvals[f.key]}"></div>`).join('') || `<div class="muted small">هذا التقرير لا يحتاج إلى خيارات تصفية — اضغط «إنشاء التقرير» مباشرة.</div>`}
          </div>
          <div class="flex mt-2">
            <button class="btn p" id="genReport">${UI.icon('reports')} إنشاء التقرير</button>
            <button class="btn o hidden" id="printReport">${UI.icon('print')} طباعة</button>
            <button class="btn o hidden" id="exportReport">${UI.icon('download')} تصدير CSV</button>
            <button class="btn wa hidden" id="shareReport">${UI.icon('whatsapp')} مشاركة عبر واتساب</button>
          </div>
        </div>
      </div>
      <div id="reportOut"></div>`;
  }

  function bindReport(rep) {
    const fvals = {};
    container.querySelectorAll('[data-fk]').forEach(el => fvals[el.dataset.fk] = el.value);
    container.querySelector('#genReport')?.addEventListener('click', () => {
      container.querySelectorAll('[data-fk]').forEach(el => fvals[el.dataset.fk] = el.value);
      built = { rep, data: rep.build(fvals) };
      const out = container.querySelector('#reportOut');
      out.innerHTML = `
        <div class="card">
          <div class="card-head"><div class="card-title">${UI.icon('eye')} معاينة — ${U.esc(rep.title)}</div>
            <span class="card-sub">${U.fmtDateFull(U.today())}</span></div>
          <div class="card-body">${buildPreviewHTML(built.data)}</div>
        </div>`;
      ['printReport', 'exportReport', 'shareReport'].forEach(id => container.querySelector('#' + id)?.classList.remove('hidden'));
      out.scrollIntoView({ behavior: 'smooth', block: 'start' });
      S.log('إنشاء تقرير', `إنشاء ${rep.title} من مركز التقارير`);
    });

    container.querySelector('#printReport')?.addEventListener('click', () => {
      if (!built) return UI.warn('أنشئ التقرير أولاً');
      U.printDoc({
        title: rep.title, landscape: rep.landscape,
        meta: `أُنشئ من مركز التقارير — ${U.fmtDateFull(U.today())}`,
        body: buildPrintBody(built.data),
      });
      S.log('طباعة تقرير', `طباعة ${rep.title}`);
    });

    container.querySelector('#exportReport')?.addEventListener('click', () => {
      if (!built) return UI.warn('أنشئ التقرير أولاً');
      const d = built.data;
      const csvParts = [];
      const dump = (title, cols, rows) => {
        if (title) csvParts.push([title]);
        csvParts.push(cols.map(c => c.label));
        rows.forEach(r => csvParts.push(cols.map(c => c.get(r))));
        csvParts.push([]);
      };
      if (d.columns) dump(null, d.columns, d.rows);
      else (d.sections || []).forEach(sec => sec.table && dump(sec.title, sec.table.columns, sec.table.rows));
      U.download(`${rep.title}-${U.today()}.csv`, '﻿' + csvParts.map(row => row.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n'));
      S.log('تصدير تقرير', `تصدير ${rep.title} بصيغة CSV`);
      UI.ok('تم تصدير التقرير بصيغة CSV');
    });

    container.querySelector('#shareReport')?.addEventListener('click', () => {
      if (!built) return UI.warn('أنشئ التقرير أولاً');
      const lines = [...built.data.text, '', `_صادر عن ${CONFIG.systemName} — ${U.fmtDate(U.today())}_`];
      U.waShare(lines.join('\n'));
      S.log('مشاركة تقرير', `مشاركة ${rep.title} عبر واتساب`);
    });
  }

  function render() {
    const ph = UI.pageHead({ title: 'مركز التقارير', sub: 'تقارير رسمية جاهزة للعرض والطباعة والتصدير والمشاركة عبر واتساب' });
    container.innerHTML = `
      ${ph.html}
      <div class="report-grid">
        ${REPORTS.map(r => `
          <div class="report-card ${selected === r.id ? 'selected' : ''}" data-rep="${r.id}">
            <span class="rc-ic tone-${r.tone}">${UI.icon(r.icon)}</span>
            <div><div class="rc-t">${U.esc(r.title)}</div><div class="rc-s">${U.esc(r.desc)}</div></div>
          </div>`).join('')}
      </div>
      <div id="reportBody">
        ${selected ? '' : `<div class="card"><div class="card-body">${UI.empty({ title: 'اختر تقريراً من القائمة أعلاه للبدء', sub: 'يمكنك تصفية البيانات ثم طباعتها أو تصديرها أو مشاركتها', icon: 'reports' })}</div></div>`}
      </div>`;
    ph.bind(container);
    container.querySelectorAll('[data-rep]').forEach(c => c.addEventListener('click', () => {
      selected = c.dataset.rep;
      render();
    }));
    if (selected) {
      const rep = REPORTS.find(r => r.id === selected);
      const body = container.querySelector('#reportBody');
      body.innerHTML = renderFiltersCard(rep);
      bindReport(rep);
      /* إنشاء تلقائي عند الاختيار */
      container.querySelector('#genReport')?.click();
    }
  }

  render();
};
