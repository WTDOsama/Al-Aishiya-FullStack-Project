/* =====================================================================
   مكتبة مكونات الواجهة: أزرار، جداول، حوارات، نماذج، تنبيهات
   ===================================================================== */
'use strict';

const UI = (() => {

  const icon = (name, cls) => iconSvg(name, cls);

  /* تطبيع النص العربي للبحث المرن */
  const normAr = (s) => String(s ?? '')
    .replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي')
    .replace(/[ً-ٟـ]/g, '').toLowerCase().trim();

  const opt = (list, cur, placeholder) => {
    const fmt = (o) => (o && typeof o === 'object') ? o : { v: o, l: o };
    const items = list.map(fmt);
    return (placeholder !== undefined ? `<option value="">${U.esc(placeholder)}</option>` : '') +
      items.map(o => `<option value="${U.esc(o.v)}" ${String(o.v) === String(cur) ? 'selected' : ''}>${U.esc(o.l)}</option>`).join('');
  };

  /* ================= التنبيهات الفورية ================= */
  function toast(msg, type = 'success', title = '') {
    const root = document.getElementById('toast-root');
    const icons = { success: 'checkCircle', error: 'xCircle', warning: 'alert', info: 'info' };
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `${icon(icons[type] || 'info')}
      <div style="flex:1">${title ? `<div class="t-title">${U.esc(title)}</div>` : ''}<div>${msg}</div></div>`;
    root.appendChild(el);
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 240); }, 3800);
    return el;
  }
  const ok = (m, t) => toast(m, 'success', t);
  const err = (m, t) => toast(m, 'error', t || 'تعذر إتمام العملية');
  const warn = (m, t) => toast(m, 'warning', t);

  /* ================= الحوارات ================= */
  function dialog({ title, sub = '', body = '', foot = '', size = '', icon: ic = '', onMount } = {}) {
    const root = document.getElementById('dialog-root');
    const overlay = document.createElement('div');
    overlay.className = 'dialog-overlay';
    overlay.innerHTML = `
      <div class="dialog ${size}" role="dialog" aria-modal="true">
        <div class="d-head">
          <div class="d-title">${ic ? icon(ic) : ''}<div>${U.esc(title)}${sub ? `<div class="d-sub">${U.esc(sub)}</div>` : ''}</div></div>
          <button class="icon-btn d-x" data-close title="إغلاق">${icon('x')}</button>
        </div>
        <div class="d-body">${body}</div>
        ${foot ? `<div class="d-foot">${foot}</div>` : ''}
      </div>`;
    const close = () => { overlay.remove(); document.removeEventListener('keydown', onKey); };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    overlay.addEventListener('mousedown', (e) => { if (e.target === overlay) close(); });
    overlay.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', close));
    root.appendChild(overlay);
    if (onMount) onMount(overlay, close);
    return { el: overlay, close };
  }

  function confirm({ title = 'تأكيد العملية', message = 'هل أنت متأكد؟', okLabel = 'تأكيد', cancelLabel = 'إلغاء', danger = false, icon: ic = 'alert' } = {}) {
    return new Promise((resolve) => {
      const d = dialog({
        title, size: 'sm', icon: ic,
        body: `<p style="font-size:.92rem;line-height:1.9">${message}</p>`,
        foot: `<button class="btn ${danger ? 'danger' : 'p'}" data-ok>${icon('check')} ${U.esc(okLabel)}</button>
               <button class="btn o" data-close>${U.esc(cancelLabel)}</button>`,
        onMount(el, close) {
          el.querySelector('[data-ok]').addEventListener('click', () => { close(); resolve(true); });
          el.addEventListener('mousedown', (e) => { if (e.target === el) resolve(false); });
          el.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => resolve(false)));
        },
      });
    });
  }

  /* ---------- بناء حقول النموذج ---------- */
  function fieldHTML(f, val) {
    const span = f.span === 2 ? 'span-2' : f.span === 3 ? 'span-3' : '';
    const req = f.required ? '<span class="req">*</span>' : '';
    const ltr = ['tel', 'email', 'number'].includes(f.type) ? 'dir="ltr" style="text-align:left"' : '';
    let ctrl = '';
    const v = val ?? f.value ?? '';
    switch (f.type) {
      case 'select':
        ctrl = `<select class="select" name="${f.name}" ${f.required ? 'required' : ''}>${opt(f.options || [], v, f.placeholder ?? '— اختر —')}</select>`;
        break;
      case 'textarea':
        ctrl = `<textarea class="textarea" name="${f.name}" placeholder="${U.esc(f.placeholder || '')}" ${f.required ? 'required' : ''}>${U.esc(v)}</textarea>`;
        break;
      case 'checkbox':
        ctrl = `<label class="check-line" style="padding:.45rem 0"><input type="checkbox" name="${f.name}" ${v ? 'checked' : ''}> ${U.esc(f.checkLabel || f.label)}</label>`;
        break;
      case 'checkboxes':
        ctrl = `<div class="checkboxes" data-name="${f.name}">${(f.options || []).map(o => {
          const oo = (o && typeof o === 'object') ? o : { v: o, l: o };
          const checked = (v || []).map(String).includes(String(oo.v));
          return `<label class="check-line"><input type="checkbox" value="${U.esc(oo.v)}" ${checked ? 'checked' : ''}> <span>${U.esc(oo.l)}</span></label>`;
        }).join('') || '<span class="muted small">لا توجد عناصر متاحة</span>'}</div>`;
        break;
      case 'date':
        ctrl = `<input type="date" class="input ltr" style="text-align:right" name="${f.name}" value="${U.esc(v)}" ${f.required ? 'required' : ''} ${f.min ? `min="${f.min}"` : ''} ${f.max ? `max="${f.max}"` : ''}>`;
        break;
      case 'static':
        ctrl = `<div class="chip" style="width:100%;justify-content:flex-start;padding:.55rem .8rem;font-size:.88rem">${v || '—'}</div>`;
        break;
      case 'html':
        ctrl = f.html || '';
        break;
      default:
        ctrl = `<input type="${f.type || 'text'}" class="input" name="${f.name}" value="${U.esc(v)}" placeholder="${U.esc(f.placeholder || '')}" ${f.required ? 'required' : ''} ${f.min !== undefined ? `min="${f.min}"` : ''} ${f.max !== undefined ? `max="${f.max}"` : ''} ${ltr} ${f.attrs || ''}>`;
    }
    if (f.type === 'html') return `<div class="field ${span}" data-fname="${f.name || ''}">${ctrl}</div>`;
    if (f.type === 'checkbox') return `<div class="field ${span}">${ctrl}</div>`;
    return `<div class="field ${span}"><label>${U.esc(f.label)}${req}</label>${ctrl}${f.hint ? `<div class="hint">${U.esc(f.hint)}</div>` : ''}</div>`;
  }

  function collectValues(form, fields) {
    const out = {};
    for (const f of fields) {
      if (!f.name || f.type === 'html' || f.type === 'static') continue;
      if (f.type === 'checkbox') out[f.name] = !!form.querySelector(`[name="${f.name}"]`)?.checked;
      else if (f.type === 'checkboxes') out[f.name] = [...form.querySelectorAll(`[data-name="${f.name}"] input:checked`)].map(i => i.value);
      else {
        const el = form.querySelector(`[name="${f.name}"]`);
        let v = el ? el.value.trim() : '';
        if (f.type === 'number') { v = U.toEnDigits(v); v = v === '' ? '' : Number(v); }
        out[f.name] = v;
      }
    }
    return out;
  }

  function formDialog({ title, sub = '', icon: ic = 'edit', fields = [], initial = {}, submitLabel = 'حفظ', cancelLabel = 'إلغاء', size = 'lg', cols = 2, onSubmit, extraFoot = '', onMount: extraMount }) {
    const secHTML = [];
    const bodyHTML = `<form class="form-grid ${cols === 3 ? 'cols-3' : ''}" novalidate>` +
      fields.map(f => f.type === 'section' ? `<div class="form-sec">${f.icon ? icon(f.icon) : ''}${U.esc(f.label)}</div>` : fieldHTML(f, initial ? initial[f.name] : undefined)).join('') + `</form>`;
    const d = dialog({
      title, sub, icon: ic, size,
      body: bodyHTML,
      foot: `<button class="btn p" data-submit>${icon('save')} ${U.esc(submitLabel)}</button>
             <button class="btn o" data-close>${U.esc(cancelLabel)}</button>${extraFoot}`,
      onMount(el, close) {
        const form = el.querySelector('form');
        const api = {
          el, close, form,
          getValues: () => collectValues(form, fields),
          value: (name) => form.querySelector(`[name="${name}"]`)?.value ?? '',
          setValue: (name, v) => { const e = form.querySelector(`[name="${name}"]`); if (e) e.value = v; },
          setOptions: (name, options, placeholder) => {
            const e = form.querySelector(`[name="${name}"]`); if (!e) return;
            const cur = e.value; e.innerHTML = opt(options, cur, placeholder);
          },
          onChange: (name, fn2) => { const e = form.querySelector(`[name="${name}"]`); if (e) e.addEventListener('change', () => fn2(api)); },
        };
        form.addEventListener('submit', (e) => e.preventDefault());
        el.querySelector('[data-submit]').addEventListener('click', () => {
          const invalid = [];
          fields.forEach(f => {
            if (!f.required || f.type === 'section' || f.type === 'html' || f.type === 'static' || f.type === 'checkbox' || f.type === 'checkboxes') return;
            const inp = form.querySelector(`[name="${f.name}"]`);
            if (inp && inp.offsetParent === null) return; /* حقل مخفي — يُتجاوز */
            if (inp && !inp.value.trim()) { invalid.push(f.label); inp.classList.add('invalid'); }
          });
          if (invalid.length) { err(`يرجى تعبئة الحقول المطلوبة: ${invalid.join('، ')}`, 'حقول ناقصة'); return; }
          const values = collectValues(form, fields);
          const res = onSubmit(values, api);
          if (res !== false) close();
        });
        form.querySelectorAll('input,select,textarea').forEach(i => i.addEventListener('input', () => i.classList.remove('invalid')));
        if (extraMount) extraMount(api);
      },
    });
    return d;
  }

  /* ================= رأس الصفحة ================= */
  function pageHead({ title, sub = '', actions = [] }) {
    const html = `
      <div class="page-head">
        <div><h1>${U.esc(title)}</h1>${sub ? `<div class="ph-sub">${sub}</div>` : ''}</div>
        <div class="ph-actions">${actions.map((a, i) => `<button class="btn ${a.kind || 'o'} ${a.sm ? 'sm' : ''}" data-phact="${i}">${a.icon ? icon(a.icon) : ''}${U.esc(a.label)}</button>`).join('')}</div>
      </div>`;
    return {
      html,
      bind(container) {
        container.querySelectorAll('[data-phact]').forEach(b => b.addEventListener('click', () => actions[+b.dataset.phact].onClick()));
      },
    };
  }

  /* ================= بطاقات وعناصر ================= */
  const statCard = ({ label, value, icon: ic = 'info', tone = 'teal', sub = '', subTone = '', href = '' }) => `
    <div class="stat-card" ${href ? `data-go="${href}" style="cursor:pointer"` : ''}>
      <div class="sc-ic tone-${tone}">${icon(ic)}</div>
      <div>
        <div class="sc-val num">${typeof value === 'number' ? U.fn(value) : (value ?? '—')}</div>
        <div class="sc-label">${U.esc(label)}</div>
        ${sub ? `<div class="sc-sub ${subTone === 'red' ? 'danger-text' : subTone === 'green' ? 'success-text' : 'muted'}">${sub}</div>` : ''}
      </div>
    </div>`;

  const badge = (text, tone = 'gray', dot = true) => `<span class="badge b-${tone}">${dot ? '<i class="b-dot"></i>' : ''}${U.esc(text)}</span>`;

  const sectionTitle = (t, ic = '') => `<div class="section-title">${ic ? icon(ic) : ''}${U.esc(t)}</div>`;

  const empty = ({ title = 'لا توجد بيانات', sub = '', icon: ic = 'inbox', action = '' } = {}) => `
    <div class="empty">
      <div class="e-ic">${icon(ic)}</div>
      <div class="e-t">${U.esc(title)}</div>
      ${sub ? `<div class="e-s">${U.esc(sub)}</div>` : ''}
      ${action ? `<div style="margin-top:1rem">${action}</div>` : ''}
    </div>`;

  const loader = (t = 'جارٍ تحميل البيانات…') => `<div class="loader"><div class="spinner"></div><div class="small bold">${U.esc(t)}</div></div>`;

  const avatar = (name, cls = '', size = '') => {
    const ch = String(name || '؟').trim().charAt(0);
    return `<span class="avatar ${size} ${cls}">${U.esc(ch)}</span>`;
  };
  const personCell = (name, sub = '', gender = '') =>
    `<div style="display:flex;align-items:center;gap:.6rem">${avatar(name, gender === 'أنثى' ? 'a-girl' : gender === 'ذكر' ? 'a-boy' : 'a-user')}
      <div><div class="t-main">${U.esc(name)}</div>${sub ? `<div class="t-sub">${sub}</div>` : ''}</div></div>`;

  /* ================= مفتاح تبديل ================= */
  function switchHTML(checked, name) {
    return `<label class="switch"><input type="checkbox" name="${name}" ${checked ? 'checked' : ''}><span class="sl"></span></label>`;
  }

  /* ================= جدول البيانات ================= */
  function dataTable(mount, cfg) {
    const state = { q: '', fv: {}, page: 1 };
    const pageSize = cfg.pageSize || 10;
    let rows = cfg.rows || [];

    const searchTxt = (r) => (cfg.searchKeys || []).map(k => typeof k === 'function' ? k(r) : r[k]).join(' ');
    function filtered() {
      let out = rows;
      if (state.q) {
        const nq = normAr(state.q);
        out = out.filter(r => normAr(searchTxt(r)).includes(nq));
      }
      for (const f of (cfg.filters || [])) {
        const v = state.fv[f.key];
        if (v) out = out.filter(r => f.match(r, v));
      }
      return out;
    }

    function bodyHTML(list, totalPages) {
      if (!list.length) return `<tr><td colspan="99">${empty({ title: cfg.emptyTitle || 'لا توجد نتائج مطابقة', sub: cfg.emptySub || 'جرّب تعديل خيارات البحث أو التصفية', icon: cfg.emptyIcon || 'search' })}</td></tr>`;
      return list.map(r => {
        const acts = cfg.actions ? cfg.actions(r) : [];
        return `<tr class="${cfg.onRowClick ? 'clickable' : ''} ${cfg.rowClass ? cfg.rowClass(r) : ''}" data-rid="${r.id}">
          ${cfg.columns.map(c => `<td class="${c.class || ''}">${c.render(r)}</td>`).join('')}
          ${acts.length ? `<td><div class="row-actions">${acts.map((a, i) => `<button class="icon-btn ${a.tone || ''}" data-act="${i}" title="${U.esc(a.title || a.label || '')}">${icon(a.icon)}</button>`).join('')}</div></td>` : ''}
        </tr>`;
      }).join('');
    }

    function render() {
      const list = filtered();
      const totalPages = Math.max(1, Math.ceil(list.length / pageSize));
      if (state.page > totalPages) state.page = totalPages;
      const start = (state.page - 1) * pageSize;
      const pageRows = list.slice(start, start + pageSize);

      const tbody = mount.querySelector('tbody');
      tbody.innerHTML = bodyHTML(pageRows, totalPages);

      tbody.querySelectorAll('tr[data-rid]').forEach(tr => {
        const row = rows.find(x => String(x.id) === tr.dataset.rid);
        if (!row) return;
        if (cfg.onRowClick) tr.addEventListener('click', (e) => { if (!e.target.closest('.icon-btn')) cfg.onRowClick(row); });
        tr.querySelectorAll('[data-act]').forEach(btn => btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const acts = cfg.actions ? cfg.actions(row) : [];
          const a = acts[+btn.dataset.act];
          if (a && a.onClick) a.onClick(row);
        }));
      });

      let nums = [];
      const w = 2;
      for (let p = 1; p <= totalPages; p++) {
        if (p === 1 || p === totalPages || (p >= state.page - w && p <= state.page + w)) nums.push(p);
        else if (nums[nums.length - 1] !== '…') nums.push('…');
      }
      const info = list.length ? `عرض ${U.fn(start + 1)}–${U.fn(Math.min(start + pageSize, list.length))} من ${U.fn(list.length)} سجل` : 'لا توجد سجلات للعرض';
      mount.querySelector('.p-info').innerHTML = info;
      const btns = mount.querySelector('.p-btns');
      btns.innerHTML = `
        <button data-pg="prev" ${state.page <= 1 ? 'disabled' : ''} title="السابق">${icon('chevronRight')}</button>
        ${nums.map(p => p === '…' ? `<button disabled>…</button>` : `<button data-pg="${p}" class="${p === state.page ? 'cur' : ''}">${U.fn(p)}</button>`).join('')}
        <button data-pg="next" ${state.page >= totalPages ? 'disabled' : ''} title="التالي">${icon('chevronLeft')}</button>`;
      btns.querySelectorAll('[data-pg]').forEach(b => b.addEventListener('click', () => {
        const v = b.dataset.pg;
        if (v === 'prev') state.page--;
        else if (v === 'next') state.page++;
        else state.page = +v;
        render();
      }));
      if (cfg.onRender) cfg.onRender(list);
    }

    mount.innerHTML = `
      <div class="card">
        <div class="filters-bar">
          <div class="fb-search">${icon('search')}<input type="search" placeholder="${U.esc(cfg.searchPlaceholder || 'بحث…')}"></div>
          ${(cfg.filters || []).map(f => `<select class="select" data-fkey="${f.key}" title="${U.esc(f.label)}">${opt([{ v: '', l: f.label }, ...(f.options || [])], '', undefined)}</select>`).join('')}
          ${(cfg.filters || []).length || cfg.searchPlaceholder !== null ? `<button class="btn g sm fb-reset" title="إعادة تعيين البحث والتصفية">${icon('refreshCCW')} إعادة تعيين</button>` : ''}
          ${cfg.toolbar || ''}
        </div>
        <div class="table-wrap"><table class="tbl ${cfg.compact ? 'compact' : ''}">
          <thead><tr>${cfg.columns.map(c => `<th>${U.esc(c.label)}</th>`).join('')}${cfg.actions ? '<th style="width:1%">الإجراءات</th>' : ''}</tr></thead>
          <tbody></tbody>
        </table></div>
        <div class="pager"><div class="p-info"></div><div class="p-btns"></div></div>
      </div>`;

    const searchInput = mount.querySelector('.fb-search input');
    searchInput.addEventListener('input', U.debounce(() => { state.q = searchInput.value; state.page = 1; render(); }, 200));
    mount.querySelectorAll('select[data-fkey]').forEach(sel => sel.addEventListener('change', () => {
      state.fv[sel.dataset.fkey] = sel.value; state.page = 1; render();
    }));
    const resetBtn = mount.querySelector('.fb-reset');
    if (resetBtn) resetBtn.addEventListener('click', () => {
      state.q = ''; state.fv = {}; state.page = 1;
      searchInput.value = '';
      mount.querySelectorAll('select[data-fkey]').forEach(s => s.value = '');
      render();
      UI.toast('تمت إعادة تعيين خيارات البحث والتصفية', 'info');
    });

    render();
    return {
      setRows(r) { rows = r || []; state.page = 1; render(); },
      refresh: render,
      getFiltered: filtered,
    };
  }

  /* ================= روابط مساعدة ================= */
  function bindGo(container) {
    container.querySelectorAll('[data-go]').forEach(el => el.addEventListener('click', () => App.go(el.dataset.go)));
  }

  return { icon, normAr, opt, toast, ok, err, warn, dialog, confirm, formDialog, fieldHTML, pageHead, statCard, badge, sectionTitle, empty, loader, avatar, personCell, switchHTML, dataTable, bindGo, collectValues };
})();
