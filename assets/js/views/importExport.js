/* =====================================================================
   مركز استيراد وتصدير البيانات + النسخ الاحتياطي
   ===================================================================== */
'use strict';
window.Views = window.Views || {};

Views.importExport = function (container) {

  const stageIdByName = (n) => (CONFIG.stages.find(s => s.name === String(n).trim()) || {}).id || 'primary';
  const attIdByName = (n) => (CONFIG.attendanceStatuses.find(a => a.name === String(n).trim()) || {}).id || 'present';

  /* ---------- تعريف مجموعات البيانات ---------- */
  const DATASETS = [
    {
      id: 'students', title: 'الطلبة', icon: 'students', tone: 'teal',
      headers: ['رقم الملف', 'اسم الطالب', 'رقم الهوية', 'رقم الجوال', 'تاريخ الميلاد', 'الجنس', 'المرحلة الدراسية', 'الصف', 'الشعبة', 'اسم ولي الأمر', 'رقم جوال ولي الأمر', 'المحافظة', 'المدينة', 'المنطقة', 'نوع السكن', 'حالة النزوح', 'تاريخ التسجيل', 'حالة الطالب', 'ملاحظات'],
      exportRow: s => [s.fileNo, s.name, s.nationalId, s.phone, s.birthDate, s.gender, U.stageName(s.stage), s.grade, s.section, (S.guardianOf(s) || {}).name || '', s.guardianPhone, s.governorate, s.city, s.area, s.housingType, s.displacement, s.regDate, s.status, s.notes],
      mapRow: (r) => ({ fileNo: r['رقم الملف'] || '', name: r['اسم الطالب'] || '', nationalId: r['رقم الهوية'] || '', phone: r['رقم الجوال'] || '', birthDate: r['تاريخ الميلاد'] || '', gender: CONFIG.genders.includes(r['الجنس']) ? r['الجنس'] : 'ذكر', stage: stageIdByName(r['المرحلة الدراسية']), grade: r['الصف'] || 'الصف الأول', section: CONFIG.sections.includes(r['الشعبة']) ? r['الشعبة'] : 'أ', _guardianName: r['اسم ولي الأمر'] || '', guardianPhone: r['رقم جوال ولي الأمر'] || '', governorate: r['المحافظة'] || 'دير البلح', city: r['المدينة'] || 'دير البلح', area: r['المنطقة'] || '', housingType: r['نوع السكن'] || '', displacement: CONFIG.displacementStatuses.includes(r['حالة النزوح']) ? r['حالة النزوح'] : 'مقيم', regDate: r['تاريخ التسجيل'] || U.today(), status: CONFIG.studentStatuses.includes(r['حالة الطالب']) ? r['حالة الطالب'] : 'نشط', notes: r['ملاحظات'] || '' }),
      valid: (r) => r.name.length >= 3,
      customImport(rows) {
        let added = 0, skipped = 0;
        for (const r of rows) {
          if (S.db.students.some(s => s.nationalId && s.nationalId === r.nationalId)) { skipped++; continue; }
          let guardianId = null;
          if (r._guardianName || r.guardianPhone) {
            let g = S.db.guardians.find(x => (r.guardianPhone && x.phone === r.guardianPhone) || (r._guardianName && x.name === r._guardianName));
            if (!g) {
              g = S.add('guardians', { name: r._guardianName || ('ولي أمر ' + r.name.split(' ')[0]), nationalId: '', phone: r.guardianPhone || '', governorate: r.governorate, city: r.city, area: r.area, relation: 'الأب', childrenIds: [], notes: '' });
            }
            guardianId = g.id;
          }
          const nid = S.nextId('students');
          const { _guardianName, ...clean } = r;
          const created = S.add('students', { ...clean, fileNo: clean.fileNo || String(1000 + nid), guardianId, guardianPhone: guardianId ? (S.find('guardians', guardianId) || {}).phone || clean.guardianPhone : clean.guardianPhone });
          if (guardianId) { const g = S.find('guardians', guardianId); g.childrenIds = g.childrenIds || []; if (!g.childrenIds.includes(created.id)) g.childrenIds.push(created.id); }
          added++;
        }
        S.save();
        return { added, skipped };
      },
    },
    {
      id: 'guardians', title: 'أولياء الأمور', icon: 'guardians', tone: 'gold',
      headers: ['اسم ولي الأمر', 'رقم الهوية', 'رقم الجوال', 'صلة القرابة', 'المحافظة', 'المدينة', 'المنطقة', 'ملاحظات'],
      exportRow: g => [g.name, g.nationalId, g.phone, g.relation, g.governorate, g.city, g.area, g.notes],
      mapRow: (r) => ({ name: r['اسم ولي الأمر'] || '', nationalId: r['رقم الهوية'] || '', phone: r['رقم الجوال'] || '', relation: CONFIG.relations.includes(r['صلة القرابة']) ? r['صلة القرابة'] : 'الأب', governorate: r['المحافظة'] || 'دير البلح', city: r['المدينة'] || 'دير البلح', area: r['المنطقة'] || '', notes: r['ملاحظات'] || '', childrenIds: [] }),
      valid: (r) => r.name.length >= 3,
      key: (g) => g.nationalId || g.phone,
    },
    {
      id: 'employees', title: 'الإدارة', icon: 'school', tone: 'blue',
      headers: ['اسم الموظف', 'رقم الهوية', 'رقم الجوال', 'المسمى الوظيفي', 'القسم', 'تاريخ التعيين', 'الراتب الشهري', 'الحالة', 'ملاحظات'],
      exportRow: e => [e.name, e.nationalId, e.phone, e.jobTitle, e.dept, e.hireDate, e.salary, e.status, e.notes],
      mapRow: (r) => ({ name: r['اسم الموظف'] || '', nationalId: r['رقم الهوية'] || '', phone: r['رقم الجوال'] || '', jobTitle: r['المسمى الوظيفي'] || '', dept: CONFIG.empDepartments.includes(r['القسم']) ? r['القسم'] : 'الإدارة العامة', hireDate: r['تاريخ التعيين'] || U.today(), salary: r['الراتب الشهري'] || '', status: CONFIG.empStatuses.includes(r['الحالة']) ? r['الحالة'] : 'نشط', notes: r['ملاحظات'] || '' }),
      valid: (r) => r.name.length >= 3 && !!r.jobTitle,
      key: (e) => e.nationalId || (e.name + e.phone),
    },
    {
      id: 'workers', title: 'العاملون', icon: 'workers', tone: 'amber',
      headers: ['اسم العامل', 'رقم الهوية', 'رقم الجوال', 'المسمى الوظيفي', 'الفترة', 'تاريخ التعيين', 'الراتب الشهري', 'الحالة', 'ملاحظات'],
      exportRow: w => [w.name, w.nationalId, w.phone, w.jobTitle, w.shift, w.hireDate, w.salary, w.status, w.notes],
      mapRow: (r) => ({ name: r['اسم العامل'] || '', nationalId: r['رقم الهوية'] || '', phone: r['رقم الجوال'] || '', jobTitle: CONFIG.workerJobs.includes(r['المسمى الوظيفي']) ? r['المسمى الوظيفي'] : (r['المسمى الوظيفي'] || 'عامل خدمات'), shift: CONFIG.shifts.includes(r['الفترة']) ? r['الفترة'] : 'الفترة الصباحية', hireDate: r['تاريخ التعيين'] || U.today(), salary: r['الراتب الشهري'] || '', status: CONFIG.empStatuses.includes(r['الحالة']) ? r['الحالة'] : 'نشط', notes: r['ملاحظات'] || '' }),
      valid: (r) => r.name.length >= 3,
      key: (w) => w.nationalId || (w.name + w.phone),
    },
    {
      id: 'attendance', title: 'سجلات الحضور', icon: 'attendance', tone: 'red',
      headers: ['التاريخ', 'رقم ملف الطالب', 'الحالة'],
      exportRow: a => [a.date, (S.student(a.studentId) || {}).fileNo || '', U.attStatus(a.status).name],
      mapRow: (r) => ({ date: r['التاريخ'] || U.today(), _fileNo: String(r['رقم ملف الطالب'] || '').trim(), status: attIdByName(r['الحالة']) }),
      valid: (r) => !!r._fileNo,
      customImport(rows) {
        let added = 0, skipped = 0;
        for (const r of rows) {
          const stu = S.studentByFileNo(r._fileNo);
          if (!stu) { skipped++; continue; }
          const ex = S.db.attendance.find(a => a.studentId === stu.id && a.date === r.date);
          if (ex) { ex.status = r.status; skipped++; }
          else { S.db.attendance.push({ id: S.nextId('attendance'), date: r.date, studentId: stu.id, status: r.status, stage: stu.stage, grade: stu.grade, section: stu.section }); added++; }
        }
        S.save();
        return { added, skipped, note: 'السجلات الموجودة مسبقاً تم تحديثها' };
      },
    },
    {
      id: 'grades', title: 'سجلات الأداء', icon: 'performance', tone: 'purple',
      headers: ['رقم ملف الطالب', 'المادة', 'الاختبار', 'الدرجة', 'الدرجة الكلية', 'الفصل الدراسي', 'العام الدراسي', 'تاريخ الرصد'],
      exportRow: g => [(S.student(g.studentId) || {}).fileNo || '', g.subject, g.exam, g.score, g.maxScore, g.semester, g.year, g.date],
      mapRow: (r) => ({ _fileNo: String(r['رقم ملف الطالب'] || '').trim(), subject: CONFIG.subjects.includes(r['المادة']) ? r['المادة'] : (r['المادة'] || 'اللغة العربية'), exam: r['الاختبار'] || 'اختبار قصير أول', score: +U.toEnDigits(r['الدرجة']) || 0, maxScore: +U.toEnDigits(r['الدرجة الكلية']) || 100, semester: CONFIG.semesters.includes(r['الفصل الدراسي']) ? r['الفصل الدراسي'] : 'الفصل الأول', year: r['العام الدراسي'] || '2025/2026', date: r['تاريخ الرصد'] || U.today() }),
      valid: (r) => !!r._fileNo,
      customImport(rows) {
        let added = 0, skipped = 0;
        for (const r of rows) {
          const stu = S.studentByFileNo(r._fileNo);
          if (!stu) { skipped++; continue; }
          const { _fileNo, ...clean } = r;
          S.add('grades', { ...clean, studentId: stu.id });
          added++;
        }
        return { added, skipped };
      },
    },
  ];

  /* ---------- تصدير ---------- */
  function exportDataset(ds, excel) {
    const rows = S.db[ds.id] || [];
    if (!rows.length) { UI.warn(`لا توجد بيانات في مجموعة «${ds.title}» للتصدير`); return; }
    if (excel && typeof XLSX !== 'undefined') {
      const aoa = [ds.headers, ...rows.map(ds.exportRow)];
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      ws['!views'] = [{ RTL: true }];
      const wb = XLSX.utils.book_new();
      wb.Workbook = { Views: [{ RTL: true }] };
      XLSX.utils.book_append_sheet(wb, ws, ds.title);
      XLSX.writeFile(wb, `${ds.title}-${U.today()}.xlsx`);
      UI.ok(`تم تصدير «${ds.title}» بصيغة Excel (XLSX)`);
    } else {
      U.download(`${ds.title}-${U.today()}.csv`, U.toCSV(ds.headers, rows.map(ds.exportRow)));
      UI.ok(`تم تصدير «${ds.title}» بصيغة CSV`);
    }
    S.log('تصدير بيانات', `تصدير مجموعة «${ds.title}» (${rows.length} سجل)${excel ? ' بصيغة Excel' : ''}`);
  }

  function template(ds) {
    U.download(`قالب-استيراد-${ds.title}.csv`, U.toCSV(ds.headers, []));
    UI.ok('تم تحميل ملف القالب — عبّئه ثم استورده من نفس البطاقة');
  }

  /* ---------- استيراد ---------- */
  function readFile(file) {
    return new Promise((resolve, reject) => {
      const isExcel = /\.(xlsx|xls)$/i.test(file.name);
      if (isExcel) {
        if (typeof XLSX === 'undefined') return reject(new Error('مكتبة Excel غير متوفرة'));
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const wb = XLSX.read(new Uint8Array(reader.result), { type: 'array' });
            const csv = XLSX.utils.sheet_to_csv(wb.Sheets[wb.SheetNames[0]], { blankrows: false });
            resolve(U.parseCSV(csv));
          } catch (e) { reject(e); }
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
      } else {
        const reader = new FileReader();
        reader.onload = () => resolve(U.parseCSV(reader.result));
        reader.onerror = reject;
        reader.readAsText(file, 'utf-8');
      }
    });
  }

  async function importDataset(ds, file) {
    let grid;
    try { grid = await readFile(file); }
    catch (e) { UI.err('تعذر قراءة الملف. تأكد أنه ملف CSV أو Excel سليم بترميز UTF-8'); return; }
    if (!grid || grid.length < 2) { UI.warn('الملف لا يحتوي على صفوف بيانات (تأكد من وجود صف العناوين ثم البيانات)'); return; }

    const headers = grid[0].map(h => String(h).trim());
    const matched = ds.headers.filter(h => headers.includes(h));
    if (!matched.length) {
      UI.err('لم يتم التعرف على أعمدة الملف. حمّل ملف القالب أولاً والتزم بترتيب العناوين');
      return;
    }
    const idx = (name) => headers.indexOf(name);
    const rawRows = grid.slice(1).map(cells => {
      const obj = {};
      ds.headers.forEach(h => { const i = idx(h); if (i >= 0) obj[h] = String(cells[i] ?? '').trim(); });
      return obj;
    });
    const mapped = rawRows.map(ds.mapRow).filter(ds.valid);

    UI.dialog({
      title: `معاينة استيراد «${ds.title}»`, icon: 'upload', size: 'lg',
      sub: `${U.fn(grid.length - 1)} صف في الملف — ${U.fn(mapped.length)} صف صالح للاستيراد`,
      body: `
        <div class="chip mb-1" style="width:100%;justify-content:flex-start">${UI.icon('info')} الأعمدة المتطابقة: ${matched.join('، ')}</div>
        <div class="table-wrap" style="border:1px solid var(--border);border-radius:12px;max-height:300px"><table class="tbl compact">
          <thead><tr>${ds.headers.slice(0, 6).map(h => `<th>${U.esc(h)}</th>`).join('')}</tr></thead>
          <tbody>${rawRows.slice(0, 6).map(r => `<tr>${ds.headers.slice(0, 6).map(h => `<td>${U.esc(r[h] || '—')}</td>`).join('')}</tr>`).join('')}</tbody>
        </table></div>
        ${rawRows.length > 6 ? `<div class="small muted mt-1 center">… و ${U.fn(rawRows.length - 6)} صفاً آخر سيستورد بعد التأكيد</div>` : ''}`,
      foot: `<button class="btn p" id="ok">${UI.icon('check')} تأكيد استيراد ${U.fn(mapped.length)} سجل</button>
             <button class="btn o" data-close>إلغاء</button>`,
      onMount(el, close) {
        el.querySelector('#ok').addEventListener('click', () => {
          close();
          const res = ds.customImport ? ds.customImport(mapped) : S.importRows(ds.id, mapped, ds.key);
          UI.ok(`تم الاستيراد: ${U.fn(res.added)} سجل جديد${res.skipped ? ` — تم تخطي ${U.fn(res.skipped)} ${res.note || 'سجل مكرر'}` : ''}`, 'اكتمل الاستيراد');
          S.log('استيراد بيانات', `استيراد ${U.fn(res.added)} سجل إلى مجموعة «${ds.title}» من ملف ${file.name}${res.skipped ? ` (تخطي ${U.fn(res.skipped)})` : ''}`);
          S.notify('اكتمل الاستيراد', `استيراد ${U.fn(res.added)} سجل إلى «${ds.title}» بنجاح.`, 'success');
          render();
        });
      },
    });
  }

  /* ---------- نسخ احتياطي ---------- */
  function backup() {
    const payload = JSON.stringify({ app: CONFIG.systemName, version: CONFIG.version, exportedAt: U.nowISO(), data: S.db }, null, 1);
    U.download(`نسخة-احتياطية-كاملة-${U.today()}.json`, payload, 'application/json;charset=utf-8');
    S.log('نسخ احتياطي', 'تصدير نسخة احتياطية كاملة من قاعدة البيانات (JSON)');
    S.notify('نسخة احتياطية', 'تم تصدير نسخة احتياطية كاملة من البيانات بنجاح.', 'success');
    UI.ok('تم تصدير النسخة الاحتياطية الكاملة');
  }

  function restore(file) {
    const reader = new FileReader();
    reader.onload = async () => {
      let obj;
      try { obj = JSON.parse(reader.result); } catch (e) { UI.err('ملف النسخة الاحتياطية غير صالح'); return; }
      const data = obj.data || obj;
      if (!data.students || !data.settings) { UI.err('هذا الملف ليس نسخة احتياطية صالحة من النظام'); return; }
      const yes = await UI.confirm({
        title: 'استعادة نسخة احتياطية', danger: true, icon: 'database',
        message: `سيتم <b>استبدال جميع البيانات الحالية</b> بمحتوى النسخة (تاريخ التصدير: ${U.fmtDateTime(obj.exportedAt || 'غير معروف')}).<br>يُنصح بتصدير نسخة احتياطية أولاً. هل تريد المتابعة؟`,
        okLabel: 'استعادة الآن',
      });
      if (!yes) return;
      S.replaceDb(data);
      S.log('استعادة نسخة احتياطية', 'تمت استعادة قاعدة البيانات من ملف نسخة احتياطية');
      UI.ok('تمت استعادة النسخة الاحتياطية بنجاح');
      App.render();
    };
    reader.readAsText(file, 'utf-8');
  }

  /* ---------- العرض ---------- */
  function render() {
    const ph = UI.pageHead({
      title: 'استيراد وتصدير البيانات',
      sub: 'تبادل البيانات مع ملفات CSV و Excel وإدارة النسخ الاحتياطية',
      actions: [{ label: 'نسخة احتياطية كاملة', icon: 'database', kind: 'p', onClick: backup }],
    });

    container.innerHTML = `
      ${ph.html}
      <div class="card"><div class="card-body" style="display:flex;gap:.9rem;align-items:flex-start">
        <span class="sc-ic tone-blue" style="width:42px;height:42px;border-radius:11px;display:flex;align-items:center;justify-content:center;flex:none">${UI.icon('info')}</span>
        <div class="small" style="line-height:1.9">
          <b>إرشادات الاستيراد:</b>
          حمّل ملف القالب CSV الخاص بكل مجموعة، عبّئه بالبيانات بنفس ترتيب الأعمدة، ثم ارفعه من زر «استيراد».
          يتم البحث عن التكرار تلقائياً (حسب رقم الهوية أو رقم الجوال) وتخطيه.
          ملفات CSV يجب أن تكون بترميز UTF-8، وملفات Excel بصيغة XLSX. عند استيراد الطلبة يتم إنشاء سجلات أولياء الأمور المرتبطة تلقائياً.
        </div>
      </div></div>

      <div class="io-grid">
        ${DATASETS.map(ds => `
          <div class="card io-card">
            <div class="io-head">
              <span class="io-ic tone-${ds.tone}">${UI.icon(ds.icon)}</span>
              <div><div class="bold">${ds.title}</div><div class="io-count">${U.fn((S.db[ds.id] || []).length)} سجل حالياً</div></div>
            </div>
            <div class="io-actions">
              <button class="btn o sm" data-tpl="${ds.id}">${UI.icon('fileDown')} قالب CSV</button>
              <button class="btn o sm" data-exp="${ds.id}">${UI.icon('download')} تصدير CSV</button>
              <button class="btn o sm" data-exx="${ds.id}" ${typeof XLSX === 'undefined' ? 'disabled title="مكتبة Excel غير متوفرة"' : ''}>${UI.icon('download')} Excel</button>
              <label class="btn p sm" style="cursor:pointer;margin:0">${UI.icon('upload')} استيراد<input type="file" accept=".csv,.xlsx,.xls" data-imp="${ds.id}" class="hidden"></label>
            </div>
          </div>`).join('')}
      </div>

      <div class="grid-2eq">
        <div class="card">
          <div class="card-head"><div class="card-title">${UI.icon('database')} النسخ الاحتياطي الكامل</div></div>
          <div class="card-body stack" style="display:flex;flex-direction:column;gap:.8rem">
            <p class="small muted" style="line-height:1.9">تحتفظ النسخة الاحتياطية بجميع بيانات النظام (الطلبة، الحضور، الأداء، المخزون، المستخدمون، الإعدادات…) في ملف JSON واحد يمكن استعادته لاحقاً أو نقله لجهاز آخر.</p>
            <div class="flex">
              <button class="btn p" id="bkBtn">${UI.icon('download')} تصدير نسخة احتياطية</button>
              <label class="btn o" style="cursor:pointer;margin:0">${UI.icon('upload')} استعادة نسخة<input type="file" accept=".json" id="restoreInp" class="hidden"></label>
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card-head"><div class="card-title" style="color:var(--danger)">${UI.icon('alert')} منطقة الخطر</div></div>
          <div class="card-body" style="display:flex;flex-direction:column;gap:.8rem">
            <p class="small muted" style="line-height:1.9">إعادة تعيين النظام تحذف جميع البيانات المدخلة وتعيد تحميل البيانات التجريبية الأصلية. لا يمكن التراجع عن هذا الإجراء.</p>
            <div class="flex"><button class="btn danger-o" id="resetBtn">${UI.icon('refreshCCW')} إعادة تعيين البيانات التجريبية</button></div>
          </div>
        </div>
      </div>`;

    ph.bind(container);
    container.querySelectorAll('[data-tpl]').forEach(b => b.addEventListener('click', () => template(DATASETS.find(d => d.id === b.dataset.tpl))));
    container.querySelectorAll('[data-exp]').forEach(b => b.addEventListener('click', () => exportDataset(DATASETS.find(d => d.id === b.dataset.exp), false)));
    container.querySelectorAll('[data-exx]').forEach(b => b.addEventListener('click', () => exportDataset(DATASETS.find(d => d.id === b.dataset.exx), true)));
    container.querySelectorAll('[data-imp]').forEach(inp => inp.addEventListener('change', () => {
      const f = inp.files[0];
      if (f) importDataset(DATASETS.find(d => d.id === inp.dataset.imp), f);
      inp.value = '';
    }));
    container.querySelector('#bkBtn').addEventListener('click', backup);
    container.querySelector('#restoreInp').addEventListener('change', (e) => { const f = e.target.files[0]; if (f) restore(f); e.target.value = ''; });
    container.querySelector('#resetBtn').addEventListener('click', async () => {
      const yes = await UI.confirm({ title: 'إعادة تعيين البيانات', danger: true, message: 'سيتم استبدال كل البيانات الحالية بالبيانات التجريبية الأصلية. هل أنت متأكد؟', okLabel: 'إعادة التعيين' });
      if (!yes) return;
      S.reset();
      S.log('إعادة تعيين النظام', 'استعادة البيانات التجريبية الأصلية');
      UI.ok('تمت إعادة تعيين البيانات التجريبية');
      App.render();
    });
  }

  render();
};
