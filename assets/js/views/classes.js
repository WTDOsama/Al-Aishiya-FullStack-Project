/* =====================================================================
   الصفوف الدراسية والشعب
   ===================================================================== */
'use strict';
window.Views = window.Views || {};

Views.classes = function (container) {

  function classCount(c) { return S.roster(c.stage, c.grade, c.section); }

  function classForm(c = null) {
    const isEdit = !!c;
    UI.formDialog({
      title: isEdit ? 'تعديل بيانات الشعبة' : 'إضافة شعبة جديدة',
      icon: 'classes', size: 'lg',
      submitLabel: isEdit ? 'حفظ' : 'إضافة الشعبة',
      initial: c || { stage: '', capacity: 32 },
      fields: [
        { name: 'stage', label: 'المرحلة الدراسية', type: 'select', options: CONFIG.stages.map(s => ({ v: s.id, l: s.name })), required: true },
        { name: 'grade', label: 'الصف', type: 'select', options: [], required: true, placeholder: '— اختر المرحلة أولاً —' },
        { name: 'section', label: 'الشعبة', type: 'select', options: CONFIG.sections, required: true },
        { name: 'supervisor', label: 'معلم(ة) الشعبة / المشرفة', type: 'text', required: true, placeholder: 'مثال: أ. هبة الأسطل' },
        { name: 'capacity', label: 'الطاقة الاستيعابية', type: 'number', min: 1, max: 60, required: true },
      ],
      onMount(api) {
        const fill = (stageId, keep) => {
          const st = CONFIG.stages.find(x => x.id === stageId);
          api.setOptions('grade', st ? st.grades : [], '— اختر الصف —');
          if (keep) api.setValue('grade', keep);
        };
        api.onChange('stage', () => fill(api.value('stage')));
        if (c) fill(c.stage, c.grade);
      },
      onSubmit(v) {
        const dup = S.db.classes.find(x => x.stage === v.stage && x.grade === v.grade && x.section === v.section && (!c || x.id !== c.id));
        if (dup) { UI.err('هذه الشعبة مسجلة مسبقاً لهذا الصف'); return false; }
        if (isEdit) {
          S.update('classes', c.id, v);
          S.log('تعديل شعبة', `تحديث بيانات ${v.grade} — شعبة ${v.section}`);
          UI.ok('تم حفظ بيانات الشعبة');
        } else {
          S.add('classes', v);
          S.log('إضافة شعبة', `إضافة ${v.grade} — شعبة ${v.section} (${U.stageName(v.stage)})`);
          UI.ok('تمت إضافة الشعبة بنجاح');
        }
        render();
      },
    });
  }

  async function deleteClass(c) {
    const n = classCount(c).length;
    if (n) { UI.warn(`لا يمكن حذف الشعبة وبداخلها ${U.fn(n)} من الطلبة. انقل الطلبة أولاً.`, 'تعذر الحذف'); return; }
    const yes = await UI.confirm({ title: 'حذف الشعبة', danger: true, message: `حذف <b>${U.esc(c.grade)} — شعبة ${U.esc(c.section)}</b> من سجل الصفوف؟`, okLabel: 'حذف' });
    if (!yes) return;
    S.remove('classes', c.id);
    S.log('حذف شعبة', `حذف ${c.grade} — شعبة ${c.section}`);
    UI.ok('تم حذف الشعبة');
    render();
  }

  function printClasses() {
    const rows = S.db.classes.map(c => ({ ...c, n: classCount(c).length }));
    U.printDoc({
      title: 'تقرير الصفوف الدراسية والشعب', landscape: true,
      meta: `إجمالي الشعب: ${U.fn(rows.length)} — ${U.fmtDateFull(U.today())}`,
      body: U.printTable([
        { label: 'المرحلة الدراسية', get: r => U.stageName(r.stage) },
        { label: 'الصف', get: r => r.grade },
        { label: 'الشعبة', get: r => r.section },
        { label: 'معلم(ة) الشعبة', get: r => r.supervisor || '—' },
        { label: 'عدد الطلبة', get: r => U.fn(r.n) },
        { label: 'الطاقة الاستيعابية', get: r => U.fn(r.capacity) },
        { label: 'نسبة الإشغال', get: r => U.fn(Math.round(r.n / r.capacity * 100)) + '٪' },
      ], rows),
    });
    S.log('طباعة تقرير', 'طباعة تقرير الصفوف الدراسية');
  }

  function render() {
    const st = S.settings();
    const ph = UI.pageHead({
      title: 'الصفوف الدراسية',
      sub: `بنية الصفوف والشعب للعام الدراسي ${st.academicYear} — ${U.fn(S.db.classes.length)} شعبة`,
      actions: [
        { label: 'إضافة شعبة', icon: 'plus', kind: 'p', onClick: () => classForm() },
        { label: 'طباعة التقرير', icon: 'print', kind: 'o', onClick: printClasses },
      ],
    });

    /* تصنيف الشعب حسب المرحلة */
    const stageCols = CONFIG.stages.map(stage => {
      const list = S.db.classes.filter(c => c.stage === stage.id);
      return { stage, list };
    });

    container.innerHTML = `
      ${ph.html}
      <div class="stats-grid">
        ${CONFIG.stages.map(stage => {
      const n = S.roster(stage.id).length;
      const secN = S.db.classes.filter(c => c.stage === stage.id).length;
      return UI.statCard({ label: stage.name, value: n, icon: 'classes', tone: stage.id === 'primary' ? 'teal' : stage.id === 'prep' ? 'blue' : 'purple', sub: `${U.fn(stage.grades.length)} صفوف • ${U.fn(secN)} شعبة`, href: `#/students?stage=${stage.id}` });
    }).join('')}
      </div>
      ${stageCols.map(({ stage, list }) => `
        <div>
          <div class="section-title mb-1" style="color:${stage.color}">${UI.icon('classes')} ${stage.name}</div>
          <div class="report-grid">
            ${list.map(c => {
        const kids = classCount(c);
        const girls = kids.filter(s => s.gender === 'أنثى').length;
        const pct = Math.min(100, Math.round(kids.length / c.capacity * 100));
        const over = kids.length > c.capacity;
        return `<div class="card class-card"><div class="card-body">
                <div class="cc-top">
                  <div>
                    <div class="cc-name">${U.esc(c.grade)} — شعبة ${U.esc(c.section)}</div>
                    <div class="card-sub">${U.esc(c.supervisor || 'بدون مشرفة')}</div>
                  </div>
                  <div class="cc-badge" style="background:${stage.color}1a;color:${stage.color}">${U.esc(c.section)}</div>
                </div>
                <div class="cc-stats">
                  <span>الطلبة: <b class="num">${U.fn(kids.length)}</b></span>
                  <span>إناث: <b class="num">${U.fn(girls)}</b></span>
                  <span>ذكور: <b class="num">${U.fn(kids.length - girls)}</b></span>
                </div>
                <div class="mt-1" title="الإشغال ${U.fn(pct)}٪">
                  <div class="flex-between"><span class="small muted">الإشغال (${U.fn(kids.length)}/${U.fn(c.capacity)})</span><span class="small bold num">${U.fn(pct)}٪</span></div>
                  <div class="prog ${over ? 'red' : pct > 85 ? 'amber' : ''}"><span style="width:${pct}%"></span></div>
                </div>
                <div class="flex mt-2">
                  <button class="btn o sm" data-view="${c.id}">${UI.icon('eye')} عرض الطلبة</button>
                  <button class="btn g sm" data-edit="${c.id}">${UI.icon('edit')} تعديل</button>
                  <button class="btn g sm" data-del="${c.id}" title="حذف الشعبة">${UI.icon('trash')}</button>
                </div>
              </div></div>`;
      }).join('') || UI.empty({ title: 'لا توجد شعب مسجلة لهذه المرحلة', icon: 'classes' })}
          </div>
        </div>`).join('')}`;

    ph.bind(container);
    UI.bindGo(container);
    container.querySelectorAll('[data-view]').forEach(b => b.addEventListener('click', () => {
      const c = S.find('classes', b.dataset.view);
      App.go(`#/students?stage=${c.stage}&grade=${encodeURIComponent(c.grade)}&section=${encodeURIComponent(c.section)}`);
    }));
    container.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => classForm(S.find('classes', b.dataset.edit))));
    container.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => deleteClass(S.find('classes', b.dataset.del))));
  }

  render();
};
