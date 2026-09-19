/* =====================================================================
   سجل النشاطات
   ===================================================================== */
'use strict';
window.Views = window.Views || {};

Views.activity = function (container) {

  function render() {
    const rows = [...S.db.activity].sort((a, b) => String(b.ts).localeCompare(String(a.ts)));
    const users = [...new Set(rows.map(a => a.user))];
    const types = [...new Set(rows.map(a => a.action))];

    const ph = UI.pageHead({
      title: 'سجل النشاطات',
      sub: `تتبع كامل لعمليات النظام — ${U.fn(rows.length)} نشاط مسجل`,
      actions: [
        { label: 'طباعة السجل', icon: 'print', kind: 'o', onClick: () => printLog(dt ? dt.getFiltered() : rows) },
        { label: 'تصدير', icon: 'download', kind: 'o', onClick: () => exportLog(dt ? dt.getFiltered() : rows) },
        { label: 'مسح السجل', icon: 'trash', kind: 'danger-o', onClick: clearLog },
      ],
    });

    container.innerHTML = `${ph.html}<div id="actTable"></div>`;
    ph.bind(container);

    const dt = UI.dataTable(container.querySelector('#actTable'), {
      rows,
      searchPlaceholder: 'ابحث في النشاطات…',
      searchKeys: ['action', 'details', 'user'],
      filters: [
        { key: 'user', label: 'المستخدم', options: users, match: (r, v) => r.user === v },
        { key: 'type', label: 'نوع النشاط', options: types, match: (r, v) => r.action === v },
      ],
      columns: [
        { label: 'وقت النشاط', render: a => `<div class="t-main small nowrap">${U.fmtDateTime(a.ts)}</div><div class="t-sub">${U.timeAgo(a.ts)}</div>` },
        { label: 'النشاط', render: a => UI.badge(a.action, 'teal', false) },
        { label: 'التفاصيل', render: a => `<span class="small">${U.esc(a.details || '—')}</span>` },
        { label: 'المستخدم', render: a => UI.personCell(a.user, '', '') },
      ],
      pageSize: 15,
      emptyTitle: 'السجل فارغ',
      emptySub: 'ستُسجل هنا كل العمليات التي تتم على النظام',
      emptyIcon: 'activity',
    });

    function printLog(list) {
      U.printDoc({
        title: 'سجل نشاطات النظام', landscape: true,
        meta: `عدد الأنشطة: ${U.fn(list.length)} — ${U.fmtDateFull(U.today())}`,
        body: U.printTable([
          { label: 'الوقت', get: a => U.fmtDateTime(a.ts) },
          { label: 'النشاط', get: a => a.action },
          { label: 'التفاصيل', get: a => a.details || '—' },
          { label: 'المستخدم', get: a => a.user },
        ], list),
      });
      S.log('طباعة تقرير', 'طباعة سجل النشاطات');
    }

    function exportLog(list) {
      U.download(`سجل-النشاطات-${U.today()}.csv`, U.toCSV(['الوقت', 'النشاط', 'التفاصيل', 'المستخدم'], list.map(a => [a.ts, a.action, a.details, a.user])));
      S.log('تصدير بيانات', 'تصدير سجل النشاطات بصيغة CSV');
      UI.ok('تم تصدير سجل النشاطات');
    }

    async function clearLog() {
      const yes = await UI.confirm({ title: 'مسح سجل النشاطات', danger: true, message: 'سيتم حذف جميع الأنشطة المسجلة نهائياً (سيُسجل نشاط المسح نفسه). متابعة؟', okLabel: 'مسح السجل' });
      if (!yes) return;
      S.db.activity = [];
      S.save();
      S.log('إدارة النظام', 'مسح سجل النشاطات');
      UI.ok('تم مسح سجل النشاطات');
      render();
    }
  }

  render();
};
