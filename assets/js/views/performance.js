/* =====================================================================
   الأداء الأكاديمي: السجلات، المتفوقون، التحليلات
   ===================================================================== */
'use strict';
window.Views = window.Views || {};

Views.performance = function (container) {
  const st = S.settings();

  const pctOf = (r) => Math.round(r.score / (r.maxScore || 100) * 100);
  const withStudent = (rows) => rows.map(r => ({ ...r, stu: S.student(r.studentId) })).filter(r => r.stu);

  /* ---------- نموذج سجل درجة ---------- */
  function recordForm(rec = null) {
    const isEdit = !!rec;
    const stu = rec ? S.student(rec.studentId) : null;
    UI.formDialog({
      title: isEdit ? 'تعديل سجل درجة' : 'إضافة سجل أداء جديد',
      sub: isEdit && stu ? stu.name : 'اختر الطالب وأدخل بيانات الدرجة',
      icon: 'performance', size: 'lg',
      submitLabel: isEdit ? 'حفظ التعديلات' : 'إضافة السجل',
      initial: rec ? { ...rec, studentId: String(rec.studentId), stage: stu.stage, grade: stu.grade, section: stu.section } : { semester: st.semester, year: st.academicYear === '2026/2027' ? '2025/2026' : st.academicYear, maxScore: 100, date: U.today() },
      fields: [
        { type: 'section', label: 'اختيار الطالب', icon: 'students' },
        { name: 'stage', label: 'المرحلة الدراسية', type: 'select', options: CONFIG.stages.map(s => ({ v: s.id, l: s.name })), required: true },
        { name: 'grade', label: 'الصف', type: 'select', options: [], required: true },
        { name: 'section', label: 'الشعبة', type: 'select', options: CONFIG.sections, required: true },
        { name: 'studentId', label: 'اسم الطالب', type: 'select', span: 3, options: [], required: true, placeholder: '— اختر الصف والشعبة أولاً —' },
        { type: 'section', label: 'بيانات الدرجة', icon: 'performance' },
        { name: 'subject', label: 'المادة', type: 'select', options: CONFIG.subjects, required: true },
        { name: 'exam', label: 'الاختبار', type: 'select', options: CONFIG.examTypes, required: true },
        { name: 'score', label: 'الدرجة', type: 'number', min: 0, required: true, placeholder: 'مثال: 85' },
        { name: 'maxScore', label: 'الدرجة الكلية', type: 'number', min: 1, required: true },
        { name: 'semester', label: 'الفصل الدراسي', type: 'select', options: CONFIG.semesters, required: true },
        { name: 'year', label: 'العام الدراسي', type: 'select', options: CONFIG.academicYears, required: true },
        { name: 'date', label: 'تاريخ الرصد', type: 'date', required: true },
      ],
      onMount(api) {
        const fillGrades = (stageId, keep) => {
          const st = CONFIG.stages.find(x => x.id === stageId);
          api.setOptions('grade', st ? st.grades : [], '— اختر الصف —');
          if (keep) api.setValue('grade', keep);
        };
        const fillStudents = (keep) => {
          const list = S.roster(api.value('stage'), api.value('grade'), api.value('section'));
          api.setOptions('studentId', list.map(s => ({ v: String(s.id), l: `${s.name} — ملف ${s.fileNo}` })), list.length ? '— اختر الطالب —' : '— لا يوجد طلبة في هذه الشعبة —');
          if (keep) api.setValue('studentId', keep);
        };
        api.onChange('stage', () => { fillGrades(api.value('stage')); fillStudents(); });
        api.onChange('grade', () => fillStudents());
        api.onChange('section', () => fillStudents());
        if (rec) { fillGrades(stu.stage, stu.grade); fillStudents(String(rec.studentId)); }
        else if (S.roster('primary', 'الصف الأول', 'أ').length) { api.setValue('stage', 'primary'); fillGrades('primary', 'الصف الأول'); fillStudents(); }
      },
      onSubmit(v) {
        if (v.score > v.maxScore) { UI.err(`الدرجة (${U.fn(v.score)}) أكبر من الدرجة الكلية (${U.fn(v.maxScore)})`); return false; }
        const data = { studentId: +v.studentId, subject: v.subject, exam: v.exam, score: v.score, maxScore: v.maxScore, semester: v.semester, year: v.year, date: v.date };
        const s = S.student(data.studentId);
        if (isEdit) {
          S.update('grades', rec.id, data);
          S.log('تعديل سجل أداء', `تعديل درجة ${v.subject} للطالب «${s ? s.name : ''}»`);
          UI.ok('تم حفظ التعديلات');
        } else {
          S.add('grades', data);
          S.log('إضافة سجل أداء', `رصد درجة ${v.subject} (${U.fn(v.score)}/${U.fn(v.maxScore)}) للطالب «${s ? s.name : ''}»`);
          UI.ok('تم رصد الدرجة بنجاح', 'تمت الإضافة');
        }
        renderAll();
      },
    });
  }

  async function deleteRecord(rec) {
    const s = S.student(rec.studentId);
    const yes = await UI.confirm({ title: 'حذف سجل الدرجة', danger: true, message: `حذف درجة <b>${U.esc(rec.subject)} — ${U.esc(rec.exam)}</b> للطالب «${U.esc(s ? s.name : '')}»؟`, okLabel: 'حذف' });
    if (!yes) return;
    S.remove('grades', rec.id);
    S.log('حذف سجل أداء', `حذف درجة ${rec.subject} للطالب «${s ? s.name : ''}»`);
    UI.ok('تم حذف السجل');
    renderAll();
  }

  /* ---------- طباعة تقرير المتفوقين ---------- */
  function printTops() {
    const tops = S.topStudents();
    U.printDoc({
      title: 'تقرير المتفوقين', landscape: true,
      meta: `الطلبة الحاصلون على متوسط ${U.fn(90)}٪ فأكثر — ${U.fmtDateFull(U.today())}`,
      body: U.printTable([
        { label: '#', get: (r) => U.fn(tops.indexOf(r) + 1) },
        { label: 'اسم الطالب', get: r => r.student.name },
        { label: 'المرحلة', get: r => U.stageName(r.student.stage) },
        { label: 'الصف', get: r => r.student.grade },
        { label: 'الشعبة', get: r => r.student.section },
        { label: 'المتوسط العام', get: r => U.fn(r.avg) + '٪' },
        { label: 'مستوى الأداء', get: r => U.perfLevel(r.avg).name },
      ], tops),
    });
    S.log('طباعة تقرير', `طباعة تقرير المتفوقين (${tops.length} طالب)`);
  }

  function shareTops() {
    const tops = S.topStudents().slice(0, 10);
    const text = [
      `🏆 *لوحة المتفوقين — ${S.settings().schoolName}*`,
      `📅 ${U.fmtDateFull(U.today())}`, '',
      ...tops.map((t, i) => `${U.fn(i + 1)}. ${t.student.name} — ${t.student.grade} (${U.fn(t.avg)}٪)`), '',
      `_صادر عن ${CONFIG.systemName}_`,
    ].join('\n');
    U.waShare(text);
    S.log('مشاركة عبر واتساب', 'مشاركة لوحة المتفوقين عبر واتساب');
  }

  /* ---------- العرض ---------- */
  function renderAll() {
    const rows = withStudent([...S.db.grades].sort((a, b) => b.id - a.id));
    const generalAvg = rows.length ? Math.round(rows.reduce((t, r) => t + pctOf(r), 0) / rows.length * 10) / 10 : null;
    const tops = S.topStudents();
    const subjAvg = CONFIG.subjects.map(sub => {
      const rs = rows.filter(r => r.subject === sub);
      return { sub, avg: rs.length ? Math.round(rs.reduce((t, r) => t + pctOf(r), 0) / rs.length) : null, n: rs.length };
    }).filter(x => x.avg !== null);

    const ph = UI.pageHead({
      title: 'الأداء الأكاديمي',
      sub: `رصد الدرجات ومتابعة مستوى الأداء — ${U.fn(rows.length)} سجل درجات`,
      actions: [
        { label: 'إضافة سجل درجة', icon: 'plus', kind: 'p', onClick: () => recordForm() },
        { label: 'طباعة تقرير المتفوقين', icon: 'print', kind: 'o', onClick: printTops },
        { label: 'مشاركة المتفوقين', icon: 'whatsapp', kind: 'wa', onClick: shareTops },
      ],
    });

    container.innerHTML = `
      ${ph.html}
      <div class="stats-grid" style="grid-template-columns:repeat(auto-fill,minmax(185px,1fr))">
        ${UI.statCard({ label: 'المتوسط العام للمدرسة', value: generalAvg !== null ? U.fn(generalAvg) + '٪' : '—', icon: 'trend', tone: 'teal' })}
        ${UI.statCard({ label: 'سجلات الدرجات', value: rows.length, icon: 'reports', tone: 'blue' })}
        ${UI.statCard({ label: 'المتفوقون (٩٠٪ فأكثر)', value: tops.length, icon: 'award', tone: 'gold' })}
        ${UI.statCard({ label: 'أعلى متوسط', value: tops.length ? U.fn(tops[0].avg) + '٪' : '—', icon: 'sparkles', tone: 'green', sub: tops.length ? tops[0].student.name : '' })}
        ${UI.statCard({ label: 'يحتاجون دعماً (أقل من ٦٠٪)', value: S.activeStudents().filter(s => { const a = S.avgForStudent(s.id); return a !== null && a < 60; }).length, icon: 'alert', tone: 'red' })}
      </div>

      <div class="grid-2eq">
        <div class="card">
          <div class="card-head"><div class="card-title">${UI.icon('performance')} متوسط الدرجات حسب المادة</div></div>
          <div class="card-body"><div class="mini-chart"><canvas id="chSubj"></canvas></div></div>
        </div>
        <div class="card">
          <div class="card-head"><div class="card-title">${UI.icon('award')} لوحة المتفوقين</div></div>
          <div class="card-body flush"><div class="table-wrap" style="max-height:290px;overflow-y:auto"><table class="tbl compact">
            <thead><tr><th>#</th><th>اسم الطالب</th><th>الصف</th><th>المتوسط</th></tr></thead>
            <tbody>${tops.slice(0, 12).map((t, i) => `<tr class="clickable" data-go="#/students/${t.student.id}">
              <td class="num bold" style="color:${i < 3 ? '#b45309' : 'var(--faint)'}">${U.fn(i + 1)}</td>
              <td>${U.esc(t.student.name)}</td><td class="small">${U.esc(t.student.grade)} — ${U.esc(t.student.section)}</td>
              <td>${UI.badge(U.fn(t.avg) + '٪', 'green', false)}</td></tr>`).join('') ||
      `<tr><td colspan="4">${UI.empty({ title: 'لا توجد بيانات متفوقين بعد', icon: 'award' })}</td></tr>`}</tbody>
          </table></div></div>
        </div>
      </div>

      <div id="recordsBox"></div>`;

    ph.bind(container);
    UI.bindGo(container);

    if (CH.available() && subjAvg.length) {
      CH.bar(container.querySelector('#chSubj'),
        subjAvg.map(x => x.sub), subjAvg.map(x => x.avg),
        { label: 'المتوسط ٪', horizontal: true, singleColor: '#0ea36f' });
      const c = container.querySelector('#chSubj').closest('.mini-chart');
      c.style.height = Math.max(220, subjAvg.length * 34) + 'px';
    } else if (!subjAvg.length) {
      CH.fallbackMsg(container.querySelector('#chSubj')?.parentElement);
    }

    /* جدول السجلات */
    const perFilter = { stage: null, grade: null, section: null };
    const tableDT = UI.dataTable(container.querySelector('#recordsBox'), {
      rows,
      searchPlaceholder: 'ابحث باسم الطالب أو المادة…',
      searchKeys: [r => r.stu.name, 'subject', 'exam'],
      filters: [
        { key: 'stage', label: 'المرحلة', options: CONFIG.stages.map(s => ({ v: s.id, l: s.name })), match: (r, v) => r.stu.stage === v },
        { key: 'subject', label: 'المادة', options: CONFIG.subjects, match: (r, v) => r.subject === v },
        { key: 'sem', label: 'الفصل الدراسي', options: CONFIG.semesters, match: (r, v) => r.semester === v },
        { key: 'year', label: 'العام الدراسي', options: CONFIG.academicYears, match: (r, v) => r.year === v },
        { key: 'level', label: 'مستوى الأداء', options: CONFIG.perfLevels.map(l => l.name), match: (r, v) => U.perfLevel(pctOf(r)).name === v },
      ],
      toolbar: `<button class="btn o sm" id="expPerf">${UI.icon('download')} تصدير</button>
                <button class="btn o sm" id="printPerf">${UI.icon('print')} طباعة</button>`,
      columns: [
        { label: 'اسم الطالب', render: r => UI.personCell(r.stu.name, `${r.stu.grade} — ${r.stu.section}`, r.stu.gender) },
        { label: 'المادة', render: r => `<span class="t-main">${U.esc(r.subject)}</span>` },
        { label: 'الاختبار', render: r => `<span class="small">${U.esc(r.exam)}</span>` },
        { label: 'الدرجة', render: r => `<span class="num bold">${U.fn(r.score)}</span><span class="faint small"> / ${U.fn(r.maxScore)}</span>` },
        { label: 'النسبة المئوية', render: r => `<span class="num bold">${U.fn(pctOf(r))}٪</span>` },
        { label: 'مستوى الأداء', render: r => { const lv = U.perfLevel(pctOf(r)); return UI.badge(lv.name, lv.tone); } },
        { label: 'الفصل / العام', render: r => `<span class="small muted nowrap">${U.esc(r.semester)}<br>${U.esc(r.year)}</span>` },
      ],
      actions: (r) => [
        { icon: 'edit', title: 'تعديل', tone: 'edit', onClick: () => recordForm(r) },
        { icon: 'trash', title: 'حذف', tone: 'del', onClick: () => deleteRecord(r) },
      ],
      onRowClick: (r) => App.go(`#/students/${r.studentId}`),
      pageSize: 12,
      emptyTitle: 'لا توجد سجلات درجات مطابقة',
      emptySub: 'ابدأ برصد الدرجات من زر «إضافة سجل درجة»',
      emptyIcon: 'performance',
    });

    container.querySelector('#expPerf').addEventListener('click', () => {
      const list = tableDT.getFiltered();
      const data = list.map(r => [r.stu.name, r.stu.fileNo, U.stageName(r.stu.stage), r.stu.grade, r.stu.section, r.subject, r.exam, r.score, r.maxScore, pctOf(r) + '%', U.perfLevel(pctOf(r)).name, r.semester, r.year, r.date]);
      U.download(`الاداء-الاكاديمي-${U.today()}.csv`, U.toCSV(['اسم الطالب', 'رقم الملف', 'المرحلة', 'الصف', 'الشعبة', 'المادة', 'الاختبار', 'الدرجة', 'الدرجة الكلية', 'النسبة المئوية', 'مستوى الأداء', 'الفصل الدراسي', 'العام الدراسي', 'تاريخ الرصد'], data));
      UI.ok('تم تصدير سجلات الأداء بصيغة CSV');
      S.log('تصدير بيانات', 'تصدير سجلات الأداء الأكاديمي');
    });
    container.querySelector('#printPerf').addEventListener('click', () => {
      const list = tableDT.getFiltered();
      U.printDoc({
        title: 'تقرير الأداء الأكاديمي', landscape: true,
        meta: `عدد السجلات: ${U.fn(list.length)} — ${U.fmtDateFull(U.today())}`,
        body: U.printTable([
          { label: 'اسم الطالب', get: r => r.stu.name },
          { label: 'الصف', get: r => r.stu.grade },
          { label: 'المادة', get: r => r.subject },
          { label: 'الاختبار', get: r => r.exam },
          { label: 'الدرجة', get: r => `${r.score} / ${r.maxScore}` },
          { label: 'النسبة', get: r => U.fn(pctOf(r)) + '٪' },
          { label: 'المستوى', get: r => U.perfLevel(pctOf(r)).name },
          { label: 'الفصل / العام', get: r => `${r.semester} — ${r.year}` },
        ], list),
      });
      S.log('طباعة تقرير', 'طباعة تقرير الأداء الأكاديمي');
    });
  }

  renderAll();
};
