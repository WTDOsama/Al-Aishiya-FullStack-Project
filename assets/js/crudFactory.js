/* =====================================================================
   مصنع صفحات الإدارة العامة (عرض/بحث/إضافة/تعديل/حذف/طباعة/تصدير)
   ===================================================================== */
'use strict';

window.crudPage = function (container, cfg) {
  const coll = cfg.collection;

  function openForm(entity = null) {
    const isEdit = !!entity;
    UI.formDialog({
      title: isEdit ? `تعديل ${cfg.entityName}` : `إضافة ${cfg.entityName}`,
      sub: isEdit && entity ? entity.name : '',
      icon: cfg.icon, size: cfg.formSize || 'lg', cols: cfg.formCols || 2,
      submitLabel: isEdit ? 'حفظ التعديلات' : `إضافة ${cfg.entityName}`,
      initial: entity ? cfg.initial(entity) : (cfg.initialNew ? cfg.initialNew() : {}),
      fields: cfg.formFields(entity),
      onMount: cfg.onFormMount,
      onSubmit(values) {
        const data = cfg.mapSubmit(values, entity);
        if (data === false) return false;
        let saved;
        if (isEdit) {
          S.update(coll, entity.id, data);
          saved = S.find(coll, entity.id);
          S.log(`تعديل ${cfg.entityName}`, `تحديث بيانات «${saved.name || ''}»`);
          UI.ok('تم حفظ التعديلات بنجاح');
        } else {
          saved = S.add(coll, data);
          S.log(`إضافة ${cfg.entityName}`, `تسجيل «${saved.name || ''}» في النظام`);
          UI.ok(`تمت إضافة ${cfg.entityName} «${saved.name || ''}» بنجاح`, 'تمت الإضافة');
        }
        if (cfg.afterSave) cfg.afterSave(saved, values, isEdit);
        reload();
        return true;
      },
    });
  }

  async function removeEntity(entity) {
    const yes = await UI.confirm({
      title: `حذف ${cfg.entityName}`, danger: true, icon: 'trash',
      message: `هل أنت متأكد من حذف <b>«${U.esc(entity.name || '')}»</b>؟ لا يمكن التراجع عن هذا الإجراء.`,
      okLabel: 'حذف نهائي',
    });
    if (!yes) return;
    S.remove(coll, entity.id);
    S.log(`حذف ${cfg.entityName}`, `حذف «${entity.name || ''}» من النظام`);
    UI.ok(`تم حذف ${cfg.entityName} من النظام`, 'تم الحذف');
    reload();
  }

  function printList(rows) {
    U.printDoc({
      title: cfg.printTitle, landscape: cfg.landscape,
      meta: `عدد السجلات: ${U.fn(rows.length)} — ${U.fmtDateFull(U.today())}`,
      body: U.printTable(cfg.printColumns, rows),
    });
    S.log('طباعة تقرير', `طباعة ${cfg.printTitle} (${rows.length} سجل)`);
  }

  function exportCSV(rows) {
    const headers = cfg.printColumns.map(c => c.label);
    const data = rows.map(r => cfg.printColumns.map(c => c.get ? c.get(r) : r[c.key]));
    U.download(`${cfg.fileSlug}-${U.today()}.csv`, U.toCSV(headers, data));
    S.log('تصدير بيانات', `تصدير ${cfg.printTitle} بصيغة CSV (${rows.length} سجل)`);
    UI.ok('تم التصدير بصيغة CSV');
  }

  const actions = [
    { label: `إضافة ${cfg.entityName}`, icon: 'plus', kind: 'p', onClick: () => openForm() },
    { label: 'طباعة', icon: 'print', kind: 'o', onClick: () => printList(dt ? dt.getFiltered() : S.db[coll]) },
    { label: 'تصدير', icon: 'download', kind: 'o', onClick: () => exportCSV(dt ? dt.getFiltered() : S.db[coll]) },
  ];
  if (cfg.share) actions.push({ label: 'مشاركة عبر واتساب', icon: 'whatsapp', kind: 'wa', onClick: () => { cfg.share(dt ? dt.getFiltered() : S.db[coll]); } });

  const ph = cfg.noPageHead ? null : UI.pageHead({ title: cfg.title, sub: typeof cfg.sub === 'function' ? cfg.sub() : cfg.sub, actions });
  container.innerHTML = (ph ? ph.html : '') + (cfg.statsHTML ? `<div style="margin-top:1.1rem">${cfg.statsHTML()}</div>` : '');
  const tableMount = document.createElement('div');
  tableMount.style.marginTop = '1.1rem';
  container.appendChild(tableMount);
  if (ph) ph.bind(container);
  if (cfg.noPageHead) {
    /* أزرار مضمنة عند غياب رأس الصفحة */
    const bar = document.createElement('div');
    bar.className = 'flex';
    bar.style.marginBottom = '.6rem';
    bar.innerHTML = actions.map((a, i) => `<button class="btn ${a.kind} sm" data-ia="${i}">${UI.icon(a.icon)} ${a.label}</button>`).join('');
    tableMount.before(bar);
    bar.querySelectorAll('[data-ia]').forEach(b => b.addEventListener('click', () => actions[+b.dataset.ia].onClick()));
  }

  let dt = null;
  function reload() {
    const rows = cfg.sortRows ? cfg.sortRows([...S.db[coll]]) : [...S.db[coll]];
    if (!dt) {
      dt = UI.dataTable(tableMount, {
        rows,
        searchPlaceholder: cfg.searchPlaceholder,
        searchKeys: cfg.searchKeys,
        filters: cfg.filters ? cfg.filters() : [],
        columns: cfg.columns,
        actions: (r) => [
          ...(cfg.profile ? [{ icon: 'eye', title: 'عرض التفاصيل', onClick: () => cfg.profile(r, reload) }] : []),
          ...(cfg.extraActions ? cfg.extraActions(r, reload) : []),
          { icon: 'edit', title: 'تعديل', tone: 'edit', onClick: () => openForm(r) },
          { icon: 'trash', title: 'حذف', tone: 'del', onClick: () => removeEntity(r) },
        ],
        onRowClick: cfg.profile ? (r) => cfg.profile(r, reload) : undefined,
        pageSize: cfg.pageSize || 10,
        emptyTitle: cfg.emptyTitle || 'لا توجد سجلات بعد',
        emptySub: cfg.emptySub || `ابدأ بإضافة ${cfg.entityName} جديد من الزر أعلاه`,
        emptyIcon: cfg.icon,
      });
    } else dt.setRows(rows);
    if (cfg.onReload) cfg.onReload(container);
  }

  reload();
  return { reload, getDT: () => dt };
};
