/* =====================================================================
   لوحة التحكم الرئيسية
   ===================================================================== */
'use strict';
window.Views = window.Views || {};

Views.dashboard = function (container) {
  const st = S.settings();
  const students = S.db.students;
  const active = S.activeStudents();
  const byStage = (id) => active.filter(s => s.stage === id).length;
  const todayAtt = S.todayAttendance();
  const attCount = (s) => todayAtt.filter(a => a.status === s).length;
  const tops = S.topStudents();
  const bs = S.biscuitStats();
  const unread = S.unreadCount();

  const hour = new Date().getHours();
  const greet = hour < 12 ? 'صباح الخير' : hour < 17 ? 'مساء النور' : 'مساء الخير';
  const user = Auth.user();

  /* بيانات الرسوم */
  const last7 = U.schoolDaysBack(7, U.today());
  const attOfDay = (d, st2) => S.db.attendance.filter(a => a.date === d && a.status === st2).length;
  const dayLabel = (d) => CONFIG.weekdays[U.parseISO(d).getDay()];

  const levelOf = (g) => { const p = g.score / (g.maxScore || 100) * 100; return CONFIG.perfLevels.find(l => p >= l.min); };
  const levelCounts = CONFIG.perfLevels.map(l => S.db.grades.filter(g => levelOf(g) === l).length);

  const statCards = [
    { label: 'إجمالي الطلبة', value: active.length, icon: 'students', tone: 'teal', sub: `${U.fn(active.filter(s => s.gender === 'أنثى').length)} أنثى • ${U.fn(active.filter(s => s.gender === 'ذكر').length)} ذكر`, href: '#/students' },
    { label: 'طلبة المرحلة الابتدائية', value: byStage('primary'), icon: 'baby', tone: 'green', href: '#/students?stage=primary' },
    { label: 'طلبة المرحلة الإعدادية', value: byStage('prep'), icon: 'bookOpen', tone: 'blue', href: '#/students?stage=prep' },
    { label: 'طلبة المرحلة الثانوية', value: byStage('secondary'), icon: 'award', tone: 'purple', href: '#/students?stage=secondary' },
    { label: 'أولياء الأمور', value: S.db.guardians.length, icon: 'guardians', tone: 'gold', href: '#/guardians' },
    { label: 'الإدارة', value: S.db.employees.length, icon: 'school', tone: 'blue', href: '#/school' },
    { label: 'العاملون', value: S.db.workers.length, icon: 'workers', tone: 'amber', href: '#/workers' },
    { label: 'الحضور اليوم', value: attCount('present'), icon: 'checkCircle', tone: 'green', sub: `متأخرون: ${U.fn(attCount('late'))}`, href: '#/attendance' },
    { label: 'الغياب اليوم', value: attCount('absent') + attCount('excused'), icon: 'xCircle', tone: 'red', sub: `بعذر: ${U.fn(attCount('excused'))}`, subTone: attCount('absent') > 5 ? 'red' : '', href: '#/attendance' },
    { label: 'المتفوقون', value: tops.length, icon: 'award', tone: 'gold', sub: `بمتوسط ${U.fn(90)}٪ فأكثر`, href: '#/performance' },
    { label: 'مخزون البسكويت', value: U.fmtPieces(bs.remaining), icon: 'biscuit', tone: bs.remCartons <= st.lowStockThreshold ? 'red' : 'teal', sub: bs.remCartons <= st.lowStockThreshold ? 'المخزون منخفض — يلزم التوريد' : `تم توزيع ${U.fmtPieces(bs.outPieces)}`, subTone: bs.remCartons <= st.lowStockThreshold ? 'red' : '', href: '#/biscuits' },
  ];

  const actIcon = (a) => {
    if (a.includes('حضور')) return ['attendance', 'green'];
    if (a.includes('أداء') || a.includes('درجات')) return ['performance', 'blue'];
    if (a.includes('بسكويت')) return ['biscuit', 'amber'];
    if (a.includes('طالب')) return ['students', 'teal'];
    if (a.includes('تقرير')) return ['reports', 'purple'];
    if (a.includes('دخول') || a.includes('خروج')) return ['user', 'blue'];
    return ['activity', 'teal'];
  };

  container.innerHTML = `
    <div class="hero">
      <h2>${greet}، ${U.esc(user ? user.name : '')} ${UI.icon('sparkles')}</h2>
      <p class="h-sub">${CONFIG.systemName} — ${U.esc(st.directorate)}. يومك الدراسي الحالي: <b>${U.fmtDateFull(U.today())}</b></p>
      <div class="h-meta">
        <span class="hm">${UI.icon('calendar')} العام الدراسي ${U.esc(st.academicYear)}</span>
        <span class="hm">${UI.icon('bookOpen')} ${U.esc(st.semester)}</span>
        <span class="hm">${UI.icon('attendance')} نسبة الحضور اليوم ${todayAtt.length ? U.fn(Math.round(attCount('present') / todayAtt.length * 100)) : '—'}٪</span>
        <span class="hm" style="cursor:pointer" data-go="#/notifications">${UI.icon('bell')} ${unread ? `${U.fn(unread)} تنبيهات غير مقروءة` : 'لا توجد تنبيهات جديدة'}</span>
      </div>
    </div>

    <div class="stats-grid">${statCards.map(c => UI.statCard(c)).join('')}</div>

    <div class="grid-2">
      <div class="card">
        <div class="card-head"><div class="card-title">${UI.icon('trend')} تتبع الحضور — آخر ٧ أيام دراسية</div>
          <div class="legend-inline">
            <span class="lg"><i style="background:#0ea36f"></i>حاضر</span>
            <span class="lg"><i style="background:#f59e0b"></i>متأخر</span>
            <span class="lg"><i style="background:#ef4444"></i>غائب</span>
          </div>
        </div>
        <div class="card-body"><div class="mini-chart" style="height:280px"><canvas id="chAtt"></canvas></div></div>
      </div>
      <div class="card">
        <div class="card-head"><div class="card-title">${UI.icon('classes')} توزيع الطلبة حسب المرحلة</div></div>
        <div class="card-body"><div class="mini-chart" style="height:280px"><canvas id="chStage"></canvas></div></div>
      </div>
    </div>

    <div class="grid-3">
      <div class="card">
        <div class="card-head"><div class="card-title">${UI.icon('performance')} مستويات الأداء الأكاديمي</div></div>
        <div class="card-body"><div class="mini-chart"><canvas id="chPerf"></canvas></div></div>
      </div>
      <div class="card">
        <div class="card-head"><div class="card-title">${UI.icon('biscuit')} ميزان مخزون البسكويت (قطعة)</div></div>
        <div class="card-body"><div class="mini-chart"><canvas id="chBis"></canvas></div></div>
      </div>
      <div class="card">
        <div class="card-head"><div class="card-title">${UI.icon('bell')} أحدث التنبيهات</div>
          <button class="btn g sm" data-go="#/notifications">عرض الكل ${UI.icon('chevronLeft')}</button></div>
        <div class="card-body flush">
          ${S.db.notifications.slice(0, 4).map(n => `
            <div class="notif-item ${n.read ? '' : 'unread'}" style="border-bottom:1px solid var(--border)">
              <span class="n-ic tone-${({ warning: 'amber', danger: 'red', success: 'green', info: 'blue' })[n.type] || 'blue'}" style="border-radius:10px">${UI.icon(({ warning: 'alert', danger: 'xCircle', success: 'checkCircle', info: 'info' })[n.type] || 'info')}</span>
              <div style="flex:1"><div class="n-t">${U.esc(n.title)}</div><div class="n-b">${U.esc(n.body)}</div><div class="n-time">${U.timeAgo(n.ts)}</div></div>
            </div>`).join('') || UI.empty({ title: 'لا توجد تنبيهات', icon: 'bell' })}
        </div>
      </div>
    </div>

    <div class="grid-2eq">
      <div class="card">
        <div class="card-head"><div class="card-title">${UI.icon('activity')} آخر الأنشطة</div>
          <button class="btn g sm" data-go="#/activity-log">سجل النشاطات ${UI.icon('chevronLeft')}</button></div>
        <div class="card-body"><div class="tl">
          ${S.db.activity.slice(0, 7).map(a => { const [ic, tone] = actIcon(a.action); return `
            <div class="tl-item">
              <span class="tl-ic tone-${tone}">${UI.icon(ic)}</span>
              <div style="flex:1"><div class="tl-t">${U.esc(a.action)}</div><div class="tl-s">${U.esc(a.details)}</div></div>
              <div style="text-align:left"><div class="tl-time">${U.timeAgo(a.ts)}</div><div class="tl-time">${U.esc(a.user)}</div></div>
            </div>`; }).join('')}
        </div></div>
      </div>
      <div class="card">
        <div class="card-head"><div class="card-title">${UI.icon('award')} لوحة المتفوقين</div>
          <button class="btn g sm" data-go="#/performance">الأداء الأكاديمي ${UI.icon('chevronLeft')}</button></div>
        <div class="card-body flush"><div class="table-wrap"><table class="tbl compact">
          <thead><tr><th>#</th><th>اسم الطالب</th><th>الصف</th><th>المتوسط</th></tr></thead>
          <tbody>
          ${tops.slice(0, 6).map((t, i) => `<tr class="clickable" data-go="#/students/${t.student.id}">
            <td class="num bold" style="color:${i < 3 ? '#b45309' : 'var(--faint)'}">${U.fn(i + 1)}</td>
            <td>${UI.personCell(t.student.name, U.stageName(t.student.stage), t.student.gender)}</td>
            <td class="small">${U.esc(t.student.grade)} — ${U.esc(t.student.section)}</td>
            <td>${UI.badge(U.fn(t.avg) + '٪', 'green', false)}</td></tr>`).join('') || `<tr><td colspan="4">${UI.empty({ title: 'لا توجد بيانات أداء بعد', sub: 'أضف سجلات الأداء لتظهر لوحة المتفوقين', icon: 'performance' })}</td></tr>`}
          </tbody></table></div></div>
      </div>
    </div>`;

  UI.bindGo(container);

  /* ---- الرسوم ---- */
  if (!CH.available()) ['chAtt', 'chStage', 'chPerf', 'chBis'].forEach(id => CH.fallbackMsg(container.querySelector('#' + id)?.parentElement));
  else {
    CH.line(container.querySelector('#chAtt'), last7.map(dayLabel), [
      { label: 'حاضر', data: last7.map(d => attOfDay(d, 'present')) },
      { label: 'متأخر', data: last7.map(d => attOfDay(d, 'late')) },
      { label: 'غائب', data: last7.map(d => attOfDay(d, 'absent') + attOfDay(d, 'excused')) },
    ]);
    CH.doughnut(container.querySelector('#chStage'),
      CONFIG.stages.map(s => s.name),
      CONFIG.stages.map(s => byStage(s.id)),
      CONFIG.stages.map(s => s.color));
    CH.bar(container.querySelector('#chPerf'),
      CONFIG.perfLevels.map(l => l.name),
      levelCounts,
      { label: 'عدد السجلات', mono: true, colors: ['#0ea36f', '#14b8a6', '#0284c7', '#f59e0b', '#ef4444'] });
    CH.bar(container.querySelector('#chBis'),
      ['الوارد', 'الموزع', 'المتبقي'],
      [bs.inPieces, bs.outPieces, bs.remaining],
      { label: 'قطعة', mono: true, colors: ['#0ea36f', '#f59e0b', '#0284c7'] });
  }
};
