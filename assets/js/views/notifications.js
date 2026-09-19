/* =====================================================================
   مركز التنبيهات
   ===================================================================== */
'use strict';
window.Views = window.Views || {};

Views.notifications = function (container) {

  const typeMeta = (t) => ({
    warning: { icon: 'alert', tone: 'amber', label: 'تحذير' },
    danger: { icon: 'xCircle', tone: 'red', label: 'عاجل' },
    success: { icon: 'checkCircle', tone: 'green', label: 'نجاح' },
    info: { icon: 'info', tone: 'blue', label: 'معلومة' },
  })[t] || { icon: 'bell', tone: 'teal', label: 'تنبيه' };

  function render() {
    S.checkAlerts();
    const list = S.db.notifications;
    const unread = list.filter(n => !n.read).length;
    const counts = { all: list.length, warning: list.filter(n => n.type === 'warning').length, danger: list.filter(n => n.type === 'danger').length };

    const ph = UI.pageHead({
      title: 'التنبيهات',
      sub: `${unread ? `${U.fn(unread)} تنبيهات غير مقروءة` : 'جميع التنبيهات مقروءة'} — يتم توليد تنبيهات المخزون والغياب تلقائياً`,
      actions: [
        { label: 'تعيين الكل كمقروء', icon: 'checkCircle', kind: 'o', onClick: () => { list.forEach(n => n.read = true); S.save(); S.log('إدارة التنبيهات', 'تعيين جميع التنبيهات كمقروءة'); UI.ok('تم تعيين جميع التنبيهات كمقروءة'); render(); } },
        { label: 'مسح الكل', icon: 'trash', kind: 'danger-o', onClick: async () => { if (await UI.confirm({ title: 'مسح التنبيهات', danger: true, message: 'سيتم حذف جميع التنبيهات نهائياً. متابعة؟', okLabel: 'مسح الكل' })) { S.db.notifications = []; S.save(); S.log('إدارة التنبيهات', 'حذف جميع التنبيهات'); UI.ok('تم مسح جميع التنبيهات'); render(); } } },
      ],
    });

    container.innerHTML = `
      ${ph.html}
      <div class="stats-grid" style="grid-template-columns:repeat(auto-fill,minmax(200px,1fr))">
        ${UI.statCard({ label: 'إجمالي التنبيهات', value: counts.all, icon: 'bell', tone: 'teal' })}
        ${UI.statCard({ label: 'غير مقروءة', value: unread, icon: 'info', tone: 'blue' })}
        ${UI.statCard({ label: 'تحذيرات', value: counts.warning, icon: 'alert', tone: 'amber' })}
        ${UI.statCard({ label: 'عاجلة', value: counts.danger, icon: 'xCircle', tone: 'red' })}
      </div>
      <div class="card">
        <div class="card-body flush" id="notifList">
        ${list.length ? list.map(n => {
      const m = typeMeta(n.type);
      return `<div class="notif-item ${n.read ? '' : 'unread'}" data-nid="${n.id}">
            <span class="n-ic tone-${m.tone}">${UI.icon(m.icon)}</span>
            <div style="flex:1">
              <div style="display:flex;align-items:center;gap:.5rem"><span class="notif-dot ${n.read ? 'read' : ''}"></span><span class="n-t">${U.esc(n.title)}</span>${UI.badge(m.label, m.tone, false)}</div>
              <div class="n-b">${U.esc(n.body)}</div>
              <div class="n-time">${U.fmtDateTime(n.ts)} — ${U.timeAgo(n.ts)}</div>
            </div>
            <div class="row-actions">
              ${n.read ? '' : `<button class="icon-btn" data-read="${n.id}" title="تعيين كمقروء">${UI.icon('check')}</button>`}
              <button class="icon-btn del" data-del="${n.id}" title="حذف">${UI.icon('trash')}</button>
            </div>
          </div>`;
    }).join('') : UI.empty({ title: 'لا توجد تنبيهات', sub: 'ستظهر هنا تنبيهات المخزون المنخفض والغياب المتكرر وإشعارات النظام', icon: 'bell' })}
        </div>
      </div>`;

    ph.bind(container);
    container.querySelectorAll('[data-read]').forEach(b => b.addEventListener('click', (e) => {
      e.stopPropagation();
      S.update('notifications', b.dataset.read, { read: true });
      render();
    }));
    container.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', async (e) => {
      e.stopPropagation();
      S.remove('notifications', b.dataset.del);
      UI.ok('تم حذف التنبيه');
      render();
    }));
    container.querySelectorAll('.notif-item').forEach(el => el.addEventListener('click', () => {
      const n = S.find('notifications', el.dataset.nid);
      if (n && !n.read) { S.update('notifications', n.id, { read: true }); render(); }
    }));
  }

  render();
};
