/* =====================================================================
   ملف الطالب الشخصي: بيانات، حضور، أداء، QR، مشاركة
   ===================================================================== */
'use strict';
window.Views = window.Views || {};

Views.studentProfile = function (container, params = {}) {
  const stu = S.student(params.id);
  if (!stu) {
    container.innerHTML = `
      <button class="btn g" data-go="#/students">${UI.icon('chevronRight')} العودة إلى قائمة الطلبة</button>
      ${UI.empty({ title: 'الطالب غير موجود', sub: 'ربما تم حذف ملف هذا الطالب من النظام', icon: 'students', action: `<button class="btn p" data-go="#/students">العودة إلى قائمة الطلبة</button>` })}`;
    UI.bindGo(container);
    return;
  }

  const g = S.guardianOf(stu);
  const siblings = g ? S.childrenOf(g.id).filter(s => s.id !== stu.id) : [];
  const attRows = S.db.attendance.filter(a => a.studentId === stu.id).sort((a, b) => b.date.localeCompare(a.date));
  const attStat = (s) => attRows.filter(a => a.status === s).length;
  const gradeRows = S.db.grades.filter(x => x.studentId === stu.id).sort((a, b) => b.id - a.id);
  const avg = S.avgForStudent(stu.id);
  const streak = S.absenceStreak(stu.id, S.settings().absenceAlert);
  const pct = (x) => Math.round(x.score / (x.maxScore || 100) * 100);

  /* ---------- إجراءات ---------- */
  function printProfile() {
    const infoCol = [
      { label: 'اسم الطالب', get: () => stu.name }, { label: 'رقم الملف', get: () => stu.fileNo },
      { label: 'رقم الهوية', get: () => stu.nationalId }, { label: 'تاريخ الميلاد', get: () => U.fmtDate(stu.birthDate) },
      { label: 'الجنس', get: () => stu.gender }, { label: 'رقم الجوال', get: () => stu.phone || '—' },
      { label: 'المرحلة', get: () => U.stageName(stu.stage) }, { label: 'الصف والشعبة', get: () => `${stu.grade} — ${stu.section}` },
      { label: 'ولي الأمر', get: () => g ? g.name : '—' }, { label: 'جوال ولي الأمر', get: () => stu.guardianPhone || '—' },
      { label: 'مكان السكن', get: () => U.fullAddress(stu) }, { label: 'نوع السكن', get: () => stu.housingType || '—' },
      { label: 'حالة النزوح', get: () => stu.displacement }, { label: 'تاريخ التسجيل', get: () => U.fmtDate(stu.regDate) },
      { label: 'حالة الطالب', get: () => stu.status },
    ];
    const rows = infoCol.map(c => ({ k: c.label, v: c.get() }));
    U.printDoc({
      title: 'الملف الشخصي للطالب',
      meta: `أُحرر بتاريخ ${U.fmtDateFull(U.today())}`,
      body: `
        <div class="psec">البيانات الأساسية</div>
        <table class="ptbl"><tbody>${rows.map(r => `<tr><td style="width:30%;background:#f3f8f5;font-weight:800">${U.esc(r.k)}</td><td>${U.esc(r.v)}</td></tr>`).join('')}</tbody></table>
        ${stu.notes ? `<div class="pnote"><b>ملاحظات:</b> ${U.esc(stu.notes)}</div>` : ''}
        <div class="psec">ملخص الحضور والغياب (آخر ${U.fn(attRows.length)} تسجيلات)</div>
        ${U.printKPIs([['حاضر', attStat('present')], ['غائب', attStat('absent')], ['متأخر', attStat('late')], ['غياب بعذر', attStat('excused')]])}
        ${gradeRows.length ? `<div class="psec">الأداء الأكاديمي — المتوسط العام ${U.fn(avg)}٪</div>` + U.printTable(
        [{ label: 'المادة', get: r => r.subject }, { label: 'الاختبار', get: r => r.exam }, { label: 'الدرجة', get: r => `${r.score} من ${r.maxScore}` }, { label: 'النسبة', get: r => pct(r) + '٪' }, { label: 'المستوى', get: r => U.perfLevel(pct(r)).name }],
        gradeRows.slice(0, 12)) : ''}
      `,
    });
    S.log('طباعة ملف طالب', `طباعة الملف الشخصي للطالب «${stu.name}»`);
  }

  function shareProfile() {
    const text = [
      `🧾 *ملف الطالب — ${S.settings().schoolName}*`, '',
      `👤 الاسم: ${stu.name}`,
      `🗂 رقم الملف: ${stu.fileNo}`,
      `🏫 الصف: ${stu.grade} — شعبة ${stu.section}`,
      `📚 المرحلة: ${U.stageName(stu.stage)}`,
      `📊 نسبة الحضور: ${attRows.length ? U.fn(Math.round(attStat('present') / attRows.length * 100)) : '—'}٪`,
      avg !== null ? `🎓 المتوسط العام: ${U.fn(avg)}٪` : '',
      `📍 السكن: ${U.fullAddress(stu)}`, '',
      `_صادر عن ${CONFIG.systemName}_`,
    ].filter(Boolean).join('\n');
    U.waShare(text);
    S.log('مشاركة عبر واتساب', `مشاركة ملف الطالب «${stu.name}» عبر واتساب`);
  }

  const ph = UI.pageHead({
    title: 'ملف الطالب',
    sub: `آخر تحديث للبيانات — ${U.fmtDate(U.today())}`,
    actions: [
      { label: 'تعديل البيانات', icon: 'edit', kind: 'p', onClick: () => window.StudentForm(stu, () => Views.studentProfile(container, params)) },
      { label: 'إنشاء رمز QR', icon: 'qr', kind: 'o', onClick: () => QRU.showStudentQR(stu) },
      { label: 'طباعة الملف', icon: 'print', kind: 'o', onClick: printProfile },
      { label: 'مشاركة عبر واتساب', icon: 'whatsapp', kind: 'wa', onClick: shareProfile },
      { label: 'حذف', icon: 'trash', kind: 'danger-o', onClick: () => window.StudentDelete(stu, () => App.go('#/students')) },
    ],
  });

  container.innerHTML = `
    <button class="btn g sm" data-go="#/students">${UI.icon('chevronRight')} العودة إلى قائمة الطلبة</button>
    ${ph.html}
    ${streak ? `<div class="card" style="border-inline-start:4px solid var(--danger)"><div class="card-body" style="display:flex;gap:.8rem;align-items:center;padding:.9rem 1.2rem">
      <span class="sc-ic tone-red" style="width:40px;height:40px;border-radius:11px;display:flex;align-items:center;justify-content:center">${UI.icon('alert')}</span>
      <div><b>تنبيه غياب متكرر:</b> تجاوز الطالب ${U.fn(S.settings().absenceAlert)} أيام غياب متتالية. يُنصح بالتواصل مع ولي الأمر ${g ? `<a href="${U.waLink(`السلام عليكم، نود إعلامكم بتكرار غياب الطالب «${stu.name}» عن المدرسة. نرجو المتابعة. — إدارة ${S.settings().schoolName}`, g.phone)}" target="_blank">عبر واتساب ${UI.icon('whatsapp')}</a>` : 'هاتفياً'}.</div>
    </div></div>` : ''}

    <div class="card"><div class="card-body">
      <div class="profile-head">
        ${UI.avatar(stu.name, stu.gender === 'أنثى' ? 'a-girl' : 'a-boy', 'lg')}
        <div class="ph-info" style="flex:1;min-width:230px">
          <h2>${U.esc(stu.name)}</h2>
          <div class="ph-meta">
            <span class="chip num">${UI.icon('idCard')} ملف ${U.esc(stu.fileNo)}</span>
            ${UI.badge(U.stageName(stu.stage), 'teal')}
            <span class="chip">${U.esc(stu.grade)} — شعبة ${U.esc(stu.section)}</span>
            ${UI.badge(stu.status, U.badgeTone(stu.status))}
            ${UI.badge(stu.displacement, U.badgeTone(stu.displacement))}
          </div>
          <div class="ph-meta">
            ${stu.phone ? `<span>${UI.icon('phone')} <span class="ltr">${U.esc(stu.phone)}</span></span>` : ''}
            <span>${UI.icon('cake')} ${U.fmtDate(stu.birthDate)} (${U.age(stu.birthDate) !== null ? U.fn(U.age(stu.birthDate)) + ' سنوات' : '—'})</span>
            <span>${UI.icon('mapPin')} ${U.esc(U.fullAddress(stu))}</span>
          </div>
        </div>
        <div class="qr-box" style="background:#fff;border:1px solid var(--border);border-radius:12px;padding:8px;cursor:pointer" id="miniQR" title="عرض رمز QR">
          ${QRU.available() ? QRU.svg(QRU.payloadFor(stu), 2, 1) : ''}
          <div class="q-cap" style="font-size:.65rem">مسح للوصول السريع</div>
        </div>
      </div>
    </div></div>

    <div class="card">
      <div class="card-body flush" style="padding:0 1.25rem"><div class="tabs" id="pTabs">
        <button class="tab active" data-tab="info">نظرة عامة</button>
        <button class="tab" data-tab="att">سجل الحضور والغياب <span class="chip">${U.fn(attRows.length)}</span></button>
        <button class="tab" data-tab="perf">الأداء الأكاديمي <span class="chip">${U.fn(gradeRows.length)}</span></button>
      </div></div>
    </div>

    <div id="tab-info">
      <div class="grid-2">
        <div class="card">
          <div class="card-head"><div class="card-title">${UI.icon('idCard')} البيانات التفصيلية</div></div>
          <div class="card-body flush"><div class="info-grid">
            ${[['رقم الهوية', stu.nationalId, 'idCard'], ['رقم الجوال', stu.phone || '—', 'phone'],
      ['تاريخ الميلاد', U.fmtDate(stu.birthDate), 'cake'], ['العمر', U.age(stu.birthDate) !== null ? `${U.fn(U.age(stu.birthDate))} سنوات` : '—', 'clock'],
      ['الجنس', stu.gender, 'user'], ['المحافظة', stu.governorate, 'mapPin'], ['المدينة', stu.city, 'mapPin'],
      ['المنطقة', stu.area || '—', 'home'], ['نوع السكن', stu.housingType || '—', 'home'],
      ['تاريخ التسجيل', U.fmtDate(stu.regDate), 'calendar'], ['المرحلة الدراسية', U.stageName(stu.stage), 'school'],
      ['الصف', stu.grade, 'classes'], ['الشعبة', stu.section, 'classes'],
    ].map(([k, v, ic]) => `<div class="ig"><span class="k">${UI.icon(ic)} ${k}</span><span class="v">${U.esc(v)}</span></div>`).join('')}
          </div></div>
          ${stu.notes ? `<div class="card-body" style="border-top:1px dashed var(--border)"><div class="k small muted bold mb-1">ملاحظات</div><div>${U.esc(stu.notes)}</div></div>` : ''}
        </div>
        <div class="stack">
          <div class="card">
            <div class="card-head"><div class="card-title">${UI.icon('guardians')} بيانات ولي الأمر</div>
              ${g ? `<button class="btn g sm" data-go="#/guardians">صفحة أولياء الأمور ${UI.icon('chevronLeft')}</button>` : ''}</div>
            <div class="card-body">
              ${g ? `
                <div style="display:flex;align-items:center;gap:.8rem;margin-bottom:.9rem">${UI.avatar(g.name, 'a-user')}
                  <div><div class="bold">${U.esc(g.name)}</div><div class="small muted">${U.esc(g.relation)}${g.nationalId ? ' • هوية <span class="ltr">' + U.esc(g.nationalId) + '</span>' : ''}</div></div></div>
                <div class="kv"><span class="k">رقم الجوال</span><span class="v ltr">${U.esc(g.phone)}</span></div>
                <div class="kv"><span class="k">مكان السكن</span><span class="v">${U.esc(U.fullAddress(g))}</span></div>
                <div class="flex mt-2">
                  <a class="btn wa sm" href="${U.waLink(`السلام عليكم، معكم إدارة ${S.settings().schoolName} بخصوص الطالب «${stu.name}».`, g.phone)}" target="_blank">${UI.icon('whatsapp')} تواصل عبر واتساب</a>
                  <a class="btn o sm ltr" href="tel:${U.esc(g.phone)}">${UI.icon('phone')} اتصال</a>
                </div>` : UI.empty({ title: 'لا يوجد ولي أمر مرتبط', sub: 'يمكن ربط ولي أمر من شاشة تعديل بيانات الطالب', icon: 'guardians' })}
            </div>
          </div>
          ${siblings.length ? `<div class="card"><div class="card-head"><div class="card-title">${UI.icon('users')} الأشقاء في المدرسة <span class="chip">${U.fn(siblings.length)}</span></div></div>
            <div class="card-body flush">${siblings.map(sib => `
              <div class="gs-item" data-go="#/students/${sib.id}" style="border-bottom:1px solid var(--border)">${UI.personCell(sib.name, `${sib.grade} — شعبة ${sib.section}`, sib.gender)}${UI.icon('chevronLeft', 'faint')}</div>`).join('')}
            </div></div>` : ''}
        </div>
      </div>
    </div>

    <div id="tab-att" class="hidden">
      <div class="stats-grid" style="grid-template-columns:repeat(auto-fill,minmax(165px,1fr))">
        ${UI.statCard({ label: 'حاضر', value: attStat('present'), icon: 'checkCircle', tone: 'green' })}
        ${UI.statCard({ label: 'غائب', value: attStat('absent'), icon: 'xCircle', tone: 'red' })}
        ${UI.statCard({ label: 'متأخر', value: attStat('late'), icon: 'clock', tone: 'amber' })}
        ${UI.statCard({ label: 'غياب بعذر', value: attStat('excused'), icon: 'info', tone: 'blue' })}
        ${UI.statCard({ label: 'نسبة الحضور', value: (attRows.length ? U.fn(Math.round(attStat('present') / attRows.length * 100)) : '—') + '٪', icon: 'trend', tone: 'teal' })}
      </div>
      <div class="card">
        <div class="card-head"><div class="card-title">${UI.icon('attendance')} آخر تسجيلات الحضور</div></div>
        <div class="card-body flush"><div class="table-wrap"><table class="tbl compact">
          <thead><tr><th>التاريخ</th><th>اليوم</th><th>الحالة</th></tr></thead>
          <tbody>${attRows.slice(0, 15).map(a => `<tr><td class="t-main">${U.fmtDate(a.date)}</td><td class="small muted">${CONFIG.weekdays[U.parseISO(a.date).getDay()]}</td><td>${UI.badge(U.attStatus(a.status).name, U.attStatus(a.status).tone)}</td></tr>`).join('') || `<tr><td colspan="3">${UI.empty({ title: 'لا توجد تسجيلات حضور بعد', icon: 'attendance' })}</td></tr>`}</tbody>
        </table></div></div>
      </div>
    </div>

    <div id="tab-perf" class="hidden">
      <div class="stats-grid" style="grid-template-columns:repeat(auto-fill,minmax(190px,1fr))">
        ${UI.statCard({ label: 'المتوسط العام', value: avg !== null ? U.fn(avg) + '٪' : '—', icon: 'award', tone: 'gold' })}
        ${UI.statCard({ label: 'عدد السجلات', value: gradeRows.length, icon: 'reports', tone: 'blue' })}
        ${UI.statCard({ label: 'مستوى الأداء', value: avg !== null ? U.perfLevel(avg).name : '—', icon: 'trend', tone: avg !== null ? U.perfLevel(avg).tone : 'teal' })}
      </div>
      <div class="card">
        <div class="card-head"><div class="card-title">${UI.icon('performance')} سجلات الدرجات</div></div>
        <div class="card-body flush"><div class="table-wrap"><table class="tbl compact">
          <thead><tr><th>المادة</th><th>الاختبار</th><th>الدرجة</th><th>النسبة المئوية</th><th>مستوى الأداء</th><th>الفصل / العام</th></tr></thead>
          <tbody>${gradeRows.map(r => { const p = pct(r); const lv = U.perfLevel(p); return `<tr>
            <td class="t-main">${U.esc(r.subject)}</td><td class="small">${U.esc(r.exam)}</td>
            <td class="num bold">${U.fn(r.score)} <span class="faint small">/ ${U.fn(r.maxScore)}</span></td>
            <td class="num">${U.fn(p)}٪</td><td>${UI.badge(lv.name, lv.tone)}</td>
            <td class="small muted">${U.esc(r.semester)} — ${U.esc(r.year)}</td></tr>`; }).join('') || `<tr><td colspan="6">${UI.empty({ title: 'لا توجد سجلات أداء بعد', sub: 'أضف سجلات من صفحة الأداء الأكاديمي', icon: 'performance' })}</td></tr>`}</tbody>
        </table></div></div>
      </div>
    </div>`;

  ph.bind(container);
  UI.bindGo(container);
  container.querySelector('#miniQR')?.addEventListener('click', () => QRU.showStudentQR(stu));

  container.querySelectorAll('#pTabs .tab').forEach(t => t.addEventListener('click', () => {
    container.querySelectorAll('#pTabs .tab').forEach(x => x.classList.toggle('active', x === t));
    ['info', 'att', 'perf'].forEach(k => container.querySelector('#tab-' + k).classList.toggle('hidden', k !== t.dataset.tab));
  }));
};
