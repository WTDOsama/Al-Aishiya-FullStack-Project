/* =====================================================================
   نظام توزيع البسكويت: المخزون، الوارد، التوزيع حسب الصف
   ===================================================================== */
'use strict';
window.Views = window.Views || {};

Views.biscuits = function (container) {

  const low = () => { const st = S.settings(); const bs = S.biscuitStats(); return bs.remCartons <= st.lowStockThreshold; };

  /* ---------- إضافة وارد ---------- */
  function incomingForm() {
    UI.formDialog({
      title: 'إضافة وارد بسكويت', sub: 'تسجيل دفعة جديدة من البسكويت إلى المخزون',
      icon: 'inbox', submitLabel: 'إضافة إلى المخزون',
      initial: { date: U.today(), piecesPerCarton: S.settings().piecesPerCarton, source: 'برنامج الغذاء العالمي' },
      fields: [
        { name: 'date', label: 'تاريخ الاستلام', type: 'date', required: true, max: U.today() },
        { name: 'cartons', label: 'عدد الكراتين الواردة', type: 'number', min: 1, required: true, placeholder: 'مثال: 25' },
        { name: 'piecesPerCarton', label: 'عدد القطع في الكرتونة', type: 'number', min: 1, required: true },
        { name: 'source', label: 'الجهة المورِّدة', type: 'select', options: ['برنامج الغذاء العالمي', 'وكالة غوث وتشغيل اللاجئين (الأونروا)', 'مؤسسة التعاون — فلسطين', 'وزارة التربية والتعليم', 'جهة أهلية مانحة', 'أخرى'] },
        { name: 'notes', label: 'ملاحظات', type: 'textarea', span: 2, placeholder: 'رقم إذن الاستلام، حالة الشحنة…' },
      ],
      onSubmit(v) {
        S.add('biscuitMoves', { date: v.date, cartons: v.cartons, piecesPerCarton: v.piecesPerCarton, source: v.source || '', notes: v.notes || '' });
        S.log('إضافة وارد بسكويت', `استلام ${U.fn(v.cartons)} كرتونة بسكويت من ${v.source || 'جهة غير محددة'} (${U.fn(v.cartons * v.piecesPerCarton)} قطعة)`);
        S.notify('وارد بسكويت جديد', `تمت إضافة ${U.fn(v.cartons)} كرتونة إلى المخزون من ${v.source || 'جهة غير محددة'}.`, 'success');
        UI.ok(`تمت إضافة ${U.fn(v.cartons)} كرتونة (${U.fn(v.cartons * v.piecesPerCarton)} قطعة) إلى المخزون`, 'تم الإضافة');
        renderAll();
      },
    });
  }

  /* ---------- تسجيل توزيع ---------- */
  function distributeForm() {
    const bs = S.biscuitStats();
    if (bs.remaining <= 0) {
      UI.warn(`لا يوجد رصيد متبقٍ من البسكويت. أضف وارداً جديداً أولاً.`, 'المخزون فارغ');
      incomingForm();
      return;
    }
    UI.formDialog({
      title: 'تسجيل توزيع بسكويت', icon: 'biscuit',
      sub: `الرصيد المتاح حالياً: ${U.fmtPieces(bs.remaining)}`,
      submitLabel: 'تسجيل التوزيع',
      initial: { date: U.today(), scope: 'school', perStudent: 1, studentsCount: S.activeStudents().length },
      fields: [
        { name: 'date', label: 'تاريخ التوزيع', type: 'date', required: true, max: U.today() },
        { name: 'scope', label: 'نطاق التوزيع', type: 'select', options: [{ v: 'school', l: 'المدرسة كاملة' }, { v: 'stage', l: 'مرحلة دراسية كاملة' }, { v: 'class', l: 'صف وشعبة محددة' }], required: true },
        { name: 'stage', label: 'المرحلة الدراسية', type: 'select', options: CONFIG.stages.map(s => ({ v: s.id, l: s.name })) },
        { name: 'grade', label: 'الصف', type: 'select', options: [], placeholder: '— اختر —' },
        { name: 'section', label: 'الشعبة', type: 'select', options: CONFIG.sections },
        { name: 'studentsCount', label: 'عدد الطلبة المستفيدين', type: 'number', min: 1, required: true },
        { name: 'perStudent', label: 'القطع لكل طالب', type: 'number', min: 1, max: 10, required: true },
        { type: 'html', name: 'calcInfo', span: 3 },
        { name: 'notes', label: 'ملاحظات', type: 'textarea', span: 3, placeholder: 'ملاحظات حول عملية التوزيع…' },
      ],
      onMount(api) {
        const wrap = (n) => api.form.querySelector(`[name="${n}"]`)?.closest('.field');
        const calcBox = api.form.querySelector('[data-fname="calcInfo"]');
        const countForScope = () => {
          const sc = api.value('scope');
          if (sc === 'school') return S.activeStudents().length;
          if (sc === 'stage') return S.roster(api.value('stage')).length;
          return S.roster(api.value('stage'), api.value('grade'), api.value('section')).length;
        };
        const refresh = (autoCount = true) => {
          const sc = api.value('scope');
          wrap('stage').style.display = sc !== 'school' ? '' : 'none';
          wrap('grade').style.display = sc === 'class' ? '' : 'none';
          wrap('section').style.display = sc === 'class' ? '' : 'none';
          if (sc !== 'school' && !api.value('grade')) {
            const stg = CONFIG.stages.find(x => x.id === (api.value('stage') || 'primary'));
            api.setOptions('grade', stg ? stg.grades : [], '— اختر الصف —');
          }
          if (autoCount) api.setValue('studentsCount', countForScope());
          updateCalc();
        };
        const updateCalc = () => {
          const cnt = +api.value('studentsCount') || 0;
          const per = +api.value('perStudent') || 0;
          const total = cnt * per;
          const remaining = S.biscuitStats().remaining;
          const overdraw = total > remaining;
          calcBox.innerHTML = `<div class="chip" style="width:100%;justify-content:flex-start;padding:.65rem .9rem;${overdraw ? 'border-color:var(--danger);background:var(--danger-soft);color:var(--danger)' : 'border-color:var(--primary-300);background:var(--primary-50);color:var(--primary-700)'}">
            ${UI.icon('biscuit')} إجمالي القطع المطلوبة: <b class="num">${U.fn(total)}</b> قطعة ≈ <b>${U.fmtPieces(total)}</b>
            <span style="margin-inline-start:auto">${overdraw ? `⚠ يتجاوز الرصيد المتاح (${U.fn(remaining)} قطعة)` : `المتبقي بعد التوزيع: ${U.fn(remaining - total)} قطعة`}</span></div>`;
        };
        api.onChange('scope', () => refresh());
        api.onChange('stage', () => { const stg = CONFIG.stages.find(x => x.id === api.value('stage')); api.setOptions('grade', stg ? stg.grades : [], '— اختر الصف —'); refresh(); });
        api.onChange('grade', () => refresh());
        api.onChange('section', () => refresh());
        const cntInp = api.form.querySelector('[name="studentsCount"]');
        const perInp = api.form.querySelector('[name="perStudent"]');
        cntInp.addEventListener('input', updateCalc);
        perInp.addEventListener('input', updateCalc);
        refresh();
      },
      onSubmit(v) {
        const total = (+v.studentsCount) * (+v.perStudent);
        const bs2 = S.biscuitStats();
        if (total > bs2.remaining) { UI.err(`الكمية المطلوبة (${U.fn(total)} قطعة) تتجاوز الرصيد المتاح (${U.fn(bs2.remaining)} قطعة)`); return false; }
        let label = 'المدرسة كاملة', stageVal = '', gradeVal = '', secVal = '';
        if (v.scope === 'stage') { label = U.stageName(v.stage); stageVal = v.stage; }
        if (v.scope === 'class') { if (!v.grade || !v.section) { UI.err('اختر الصف والشعبة أولاً'); return false; } label = `${v.grade} — شعبة ${v.section}`; stageVal = v.stage; gradeVal = v.grade; secVal = v.section; }
        S.add('biscuitDist', { date: v.date, label, stage: stageVal, grade: gradeVal, section: secVal, studentsCount: +v.studentsCount, perStudent: +v.perStudent, pieces: total, notes: v.notes || '' });
        S.log('توزيع بسكويت', `توزيع ${U.fn(total)} قطعة (${U.fn(v.perStudent)} لكل طالب) على ${label} — ${U.fn(v.studentsCount)} طالب مستفيد`);
        S.checkAlerts();
        UI.ok(`تم تسجيل توزيع ${U.fn(total)} قطعة على ${label}`, 'تم التوزيع');
        renderAll();
      },
    });
  }

  /* ---------- حذف سجلات ---------- */
  async function deleteMove(m) {
    const yes = await UI.confirm({ title: 'حذف سجل الوارد', danger: true, message: `حذف دفعة <b>${U.fn(m.cartons)} كرتونة</b> الواردة بتاريخ ${U.fmtDate(m.date)}؟ سينقص المخزون تلقائياً.`, okLabel: 'حذف' });
    if (!yes) return;
    const after = S.biscuitStats().remaining - m.cartons * (m.piecesPerCarton || 50) + S.biscuitStats().outPieces;
    S.remove('biscuitMoves', m.id);
    S.log('حذف سجل وارد', `حذف دفعة وارد بسكويت (${U.fn(m.cartons)} كرتونة)`);
    UI.ok('تم حذف سجل الوارد');
    renderAll();
  }
  async function deleteDist(d) {
    const yes = await UI.confirm({ title: 'حذف سجل التوزيع', danger: true, message: `حذف توزيع <b>${U.fn(d.pieces)} قطعة</b> على «${U.esc(d.label)}»؟ سيعود الرصيد إلى المخزون.`, okLabel: 'حذف' });
    if (!yes) return;
    S.remove('biscuitDist', d.id);
    S.log('حذف سجل توزيع', `حذف سجل توزيع بسكويت على ${d.label}`);
    UI.ok('تم حذف سجل التوزيع وعاد الرصيد للمخزون');
    renderAll();
  }

  /* ---------- تقارير ---------- */
  function printReport() {
    const bs = S.biscuitStats();
    U.printDoc({
      title: 'تقرير توزيع البسكويت', landscape: true,
      meta: `الفترة: منذ بداية العام الدراسي — ${U.fmtDateFull(U.today())}`,
      body: `
        ${U.printKPIs([['إجمالي الوارد', `${U.fn(bs.inCartons)} كرتونة (${U.fn(bs.inPieces)} قطعة)`], ['الموزع', U.fmtPieces(bs.outPieces)], ['المتبقي', U.fmtPieces(bs.remaining)], ['مرات التوزيع', bs.distCount]])}
        <div class="psec">سجل الوارد</div>
        ${U.printTable([
        { label: 'التاريخ', get: r => U.fmtDate(r.date) },
        { label: 'الكراتين الواردة', get: r => U.fn(r.cartons) },
        { label: 'إجمالي القطع', get: r => U.fn(r.cartons * (r.piecesPerCarton || 50)) },
        { label: 'الجهة المورِّدة', get: r => r.source || '—' },
        { label: 'ملاحظات', get: r => r.notes || '—' },
      ], [...S.db.biscuitMoves].sort((a, b) => b.date.localeCompare(a.date)))}
        <div class="psec">سجل التوزيع</div>
        ${U.printTable([
        { label: 'التاريخ', get: r => U.fmtDate(r.date) },
        { label: 'الجهة الموزع لها', get: r => r.label },
        { label: 'الطلبة المستفيدون', get: r => U.fn(r.studentsCount) },
        { label: 'القطع لكل طالب', get: r => U.fn(r.perStudent) },
        { label: 'إجمالي القطع', get: r => U.fn(r.pieces) },
        { label: 'ملاحظات', get: r => r.notes || '—' },
      ], [...S.db.biscuitDist].sort((a, b) => b.date.localeCompare(a.date)))}
        <div class="pnote">رصيد المخزون المتبقي حتى تاريخه: <b>${U.fmtPieces(bs.remaining)}</b> — الحد الأدنى للتنبيه: ${U.fn(S.settings().lowStockThreshold)} كرتونة.</div>`,
    });
    S.log('طباعة تقرير', 'طباعة تقرير توزيع البسكويت');
  }

  function shareReport() {
    const bs = S.biscuitStats();
    const text = [
      `🍪 *تقرير توزيع البسكويت — ${S.settings().schoolName}*`,
      `📅 ${U.fmtDateFull(U.today())}`, '',
      `📦 الوارد: ${U.fn(bs.inCartons)} كرتونة (${U.fn(bs.inPieces)} قطعة)`,
      `📤 الموزع: ${U.fmtPieces(bs.outPieces)}`,
      `🏬 المتبقي: ${U.fmtPieces(bs.remaining)}`,
      `👥 مرات التوزيع: ${U.fn(bs.distCount)}`,
      low() ? '⚠️ *تنبيه: المخزون منخفض ويحتاج توريداً عاجلاً*' : '', '',
      `_صادر عن ${CONFIG.systemName}_`,
    ].filter(Boolean).join('\n');
    U.waShare(text);
    S.log('مشاركة عبر واتساب', 'مشاركة تقرير مخزون البسكويت');
  }

  function exportCSV() {
    const data = S.db.biscuitDist.map(d => [d.date, d.label, d.studentsCount, d.perStudent, d.pieces, d.notes]);
    U.download(`توزيع-البسكويت-${U.today()}.csv`, U.toCSV(['التاريخ', 'الجهة الموزع لها', 'عدد الطلبة', 'القطع لكل طالب', 'إجمالي القطع', 'ملاحظات'], data));
    S.log('تصدير بيانات', 'تصدير سجل توزيع البسكويت');
    UI.ok('تم التصدير بصيغة CSV');
  }

  /* ---------- العرض ---------- */
  function renderAll() {
    const st = S.settings();
    const bs = S.biscuitStats();
    const usagePct = bs.inPieces ? Math.min(100, Math.round(bs.outPieces / bs.inPieces * 100)) : 0;

    /* تجميع التوزيع حسب الصف/الجهة */
    const byLabel = {};
    S.db.biscuitDist.forEach(d => { byLabel[d.label] = (byLabel[d.label] || 0) + d.pieces; });
    const labels = Object.keys(byLabel);

    const ph = UI.pageHead({
      title: 'توزيع البسكويت',
      sub: `إدارة مخزون وتوزيع وجبات البسكويت — ${U.fn(st.piecesPerCarton)} قطعة في الكرتونة`,
      actions: [
        { label: 'إضافة وارد', icon: 'inbox', kind: 'o', onClick: incomingForm },
        { label: 'تسجيل توزيع', icon: 'biscuit', kind: 'p', onClick: distributeForm },
        { label: 'طباعة التقرير', icon: 'print', kind: 'o', onClick: printReport },
        { label: 'مشاركة', icon: 'whatsapp', kind: 'wa', onClick: shareReport },
      ],
    });

    container.innerHTML = `
      ${ph.html}
      ${low() ? `<div class="card" style="border-inline-start:4px solid var(--danger)"><div class="card-body" style="display:flex;gap:.8rem;align-items:center;padding:.9rem 1.2rem">
        <span class="sc-ic tone-red" style="width:42px;height:42px;border-radius:11px;display:flex;align-items:center;justify-content:center">${UI.icon('alert')}</span>
        <div><b>تنبيه: مخزون البسكويت منخفض!</b> المتبقي ${U.fmtPieces(bs.remaining)} فقط، وهو ما يقل عن الحد الأدنى المحدد (${U.fn(st.lowStockThreshold)} كرتونة). يُرجى التواصل مع الجهات المورِّدة لتأمين دفعة جديدة.</div>
        <button class="btn p sm" style="margin-inline-start:auto" id="lowAdd">${UI.icon('inbox')} إضافة وارد</button>
      </div></div>` : ''}

      <div class="stats-grid" style="grid-template-columns:repeat(auto-fill,minmax(195px,1fr))">
        ${UI.statCard({ label: 'الوارد — الكراتين الواردة', value: U.fn(bs.inCartons) + ' كرتونة', icon: 'inbox', tone: 'teal', sub: `${U.fn(bs.inPieces)} قطعة إجمالاً` })}
        ${UI.statCard({ label: 'الموزع — الكراتين الموزعة', value: U.fmtPieces(bs.outPieces), icon: 'send', tone: 'amber', sub: `${U.fn(bs.outPieces)} قطعة` })}
        ${UI.statCard({ label: 'المتبقي — الكراتين المتبقية', value: U.fmtPieces(bs.remaining), icon: 'box', tone: low() ? 'red' : 'green', sub: low() ? 'أقل من الحد الأدنى' : 'المخزون بحالة جيدة', subTone: low() ? 'red' : 'green' })}
        ${UI.statCard({ label: 'مرات التوزيع', value: bs.distCount, icon: 'biscuit', tone: 'blue' })}
        ${UI.statCard({ label: 'الطلبة المستفيدون (تراكمي)', value: S.db.biscuitDist.reduce((t, d) => t + d.studentsCount, 0), icon: 'students', tone: 'purple' })}
      </div>

      <div class="card"><div class="card-body">
        <div class="flex-between mb-1">
          <div class="section-title">${UI.icon('trend')} استهلاك المخزون</div>
          <span class="small bold num">${U.fn(usagePct)}٪ مستهلِك</span>
        </div>
        <div class="prog ${usagePct > 85 ? 'red' : usagePct > 65 ? 'amber' : ''}" style="height:12px"><span style="width:${usagePct}%"></span></div>
        <div class="flex mt-1 small muted">
          <span>صافي الرصيد: <b>${U.fn(bs.remaining)} قطعة</b></span>
          <span>•</span><span>يكفي لتوزيع: <b>${U.fn(bs.remaining)} طالب × قطعة واحدة</b></span>
        </div>
      </div></div>

      <div class="grid-2">
        <div class="card">
          <div class="card-head"><div class="card-title">${UI.icon('biscuit')} التوزيع حسب الصف / الجهة (قطعة)</div></div>
          <div class="card-body"><div class="mini-chart" style="height:${Math.max(230, labels.length * 36)}px"><canvas id="chDist"></canvas></div></div>
        </div>
        <div class="card">
          <div class="card-head"><div class="card-title">${UI.icon('inbox')} سجل الوارد</div><span class="card-sub">${U.fn(S.db.biscuitMoves.length)} دفعة واردة</span></div>
          <div class="card-body flush"><div class="table-wrap" style="max-height:${Math.max(230, labels.length * 36)}px;overflow-y:auto"><table class="tbl compact">
            <thead><tr><th>التاريخ</th><th>الكراتين</th><th>القطع</th><th>الجهة المورِّدة</th><th></th></tr></thead>
            <tbody>${[...S.db.biscuitMoves].sort((a, b) => b.date.localeCompare(a.date)).map(m => `<tr>
              <td class="nowrap t-main">${U.fmtDate(m.date)}</td>
              <td>${UI.badge(U.fn(m.cartons) + ' كرتونة', 'teal', false)}</td>
              <td class="num">${U.fn(m.cartons * (m.piecesPerCarton || st.piecesPerCarton))}</td>
              <td class="small">${U.esc(m.source || '—')}${m.notes ? `<div class="t-sub">${U.esc(m.notes)}</div>` : ''}</td>
              <td><div class="row-actions"><button class="icon-btn del" data-delm="${m.id}" title="حذف">${UI.icon('trash')}</button></div></td></tr>`).join('') ||
      `<tr><td colspan="5">${UI.empty({ title: 'لا يوجد وارد مسجل', icon: 'inbox' })}</td></tr>`}</tbody>
          </table></div></div>
        </div>
      </div>

      <div class="card">
        <div class="card-head"><div class="card-title">${UI.icon('send')} سجل التوزيع</div>
          <div class="flex"><span class="card-sub">${U.fn(S.db.biscuitDist.length)} عملية توزيع</span>
          <button class="btn o sm" id="expDist">${UI.icon('download')} تصدير</button></div></div>
        <div class="card-body flush"><div class="table-wrap"><table class="tbl">
          <thead><tr><th>التاريخ</th><th>الجهة الموزع لها</th><th>المستفيدون</th><th>لكل طالب</th><th>إجمالي القطع</th><th>ما يعادل</th><th>ملاحظات</th><th></th></tr></thead>
          <tbody>${[...S.db.biscuitDist].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id).map(d => `<tr>
            <td class="nowrap t-main">${U.fmtDate(d.date)}</td>
            <td><div class="t-main">${U.esc(d.label)}</div>${d.stage ? `<div class="t-sub">${U.stageName(d.stage)}</div>` : '<div class="t-sub">جميع المراحل</div>'}</td>
            <td>${UI.badge(U.fn(d.studentsCount) + ' طالب', 'blue', false)}</td>
            <td class="num">${U.fn(d.perStudent)}</td>
            <td class="num bold">${U.fn(d.pieces)}</td>
            <td class="small muted">${U.fmtPieces(d.pieces)}</td>
            <td class="small muted">${U.esc(d.notes || '—')}</td>
            <td><div class="row-actions"><button class="icon-btn del" data-deld="${d.id}" title="حذف">${UI.icon('trash')}</button></div></td></tr>`).join('') ||
      `<tr><td colspan="8">${UI.empty({ title: 'لا توجد عمليات توزيع بعد', sub: 'سجل أول عملية توزيع من زر «تسجيل توزيع»', icon: 'biscuit' })}</td></tr>`}</tbody>
        </table></div></div>
      </div>`;

    ph.bind(container);
    container.querySelector('#lowAdd')?.addEventListener('click', incomingForm);
    container.querySelector('#expDist')?.addEventListener('click', exportCSV);
    container.querySelectorAll('[data-delm]').forEach(b => b.addEventListener('click', () => deleteMove(S.find('biscuitMoves', b.dataset.delm))));
    container.querySelectorAll('[data-deld]').forEach(b => b.addEventListener('click', () => deleteDist(S.find('biscuitDist', b.dataset.deld))));

    if (CH.available() && labels.length) {
      CH.bar(container.querySelector('#chDist'), labels, labels.map(l => byLabel[l]),
        { label: 'قطعة', horizontal: true, mono: true });
    } else if (!labels.length) CH.fallbackMsg(container.querySelector('#chDist')?.parentElement);
  }

  renderAll();
};
