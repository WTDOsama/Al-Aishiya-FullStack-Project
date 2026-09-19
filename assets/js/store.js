/* =====================================================================
   طبقة البيانات: التخزين المحلي + البيانات التجريبية + العمليات
   ===================================================================== */
'use strict';

const S = (() => {
  const KEY = CONFIG.storagePrefix + 'db_v2';
  const SESSION_KEY = CONFIG.storagePrefix + 'session';
  const _mem = {};
  const sGet = (k) => { try { return localStorage.getItem(k); } catch (e) { return _mem[k] ?? null; } };
  const sSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { _mem[k] = v; } };
  const sDel = (k) => { try { localStorage.removeItem(k); } catch (e) { delete _mem[k]; } };

  const COLLECTIONS = ['users', 'students', 'guardians', 'employees', 'workers', 'attendance', 'grades', 'biscuitMoves', 'biscuitDist', 'notifications', 'activity', 'classes'];
  let db = null;

  const defaultSettings = () => ({
    schoolName: CONFIG.schoolName,
    directorate: CONFIG.directorate,
    address: 'دير البلح — شارع صلاح الدين، بجوار البلدية',
    phone: '082537214',
    email: 'info@alaishiya-db.edu.ps',
    principal: 'د. سلوى أبو جراد',
    established: '1985',
    academicYear: '2026/2027',
    semester: 'الفصل الأول',
    piecesPerCarton: CONFIG.piecesPerCarton,
    lowStockThreshold: CONFIG.lowStockThreshold,
    absenceAlert: CONFIG.absenceAlertDays,
    theme: 'light',
    numerals: 'arabic',
    fontSize: 'medium',
    social: {
      facebook: 'https://facebook.com/alaishiya.db',
      whatsapp: '0599001122',
      telegram: 'https://t.me/alaishiya_db',
      youtube: '',
      website: '',
    },
  });

  /* ================= توليد البيانات التجريبية ================= */
  function buildSeed() {
    const rnd = U.seededRng(20260916);
    const ri = (min, max) => min + Math.floor(rnd() * (max - min + 1));
    const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
    const chance = (p) => rnd() < p;

    const maleFirst = ['أحمد', 'محمد', 'محمود', 'يوسف', 'عمر', 'خالد', 'إبراهيم', 'عبد الرحمن', 'مصطفى', 'حمزة', 'كريم', 'أمير', 'بلال', 'طه', 'أنس', 'يحيى', 'زياد', 'وسيم', 'مالك', 'سالم', 'إياد', 'نور الدين', 'عبد الله', 'حسام', 'بهاء'];
    const femaleFirst = ['فاطمة', 'مريم', 'عائشة', 'زينب', 'سارة', 'جنى', 'ليان', 'رتاج', 'ملك', 'تالا', 'ياسمين', 'ديمة', 'آلاء', 'حلا', 'نور', 'شهد', 'سجى', 'رؤى', 'هبة', 'إيمان', 'دنيا', 'لينا', 'أسيل', 'ريماس', 'سلma', 'سلمى'];
    const femaleFirstClean = femaleFirst.filter(n => !/[a-z]/.test(n));
    const families = ['أبو شعبان', 'أبو جراد', 'أبو حولي', 'أبو زيد', 'أبو مغصيب', 'أبو خوصة', 'أبو سويرح', 'البردويل', 'المدهون', 'النجار', 'الأسطل', 'المصري', 'أبو شملة', 'قنديل', 'بشير', 'النواجحة', 'أبو ركاب', 'صيام', 'عاشور', 'أبو دان', 'حبوش', 'الطهراوي', 'ثابت', 'بركة', 'أبو كميل', 'الديراوي', 'السمعوني', 'أبو جياب'];
    const areas = ['شارع صلاح الدين', 'منطقة البلد', 'منطقة المدارس', 'حي النور', 'شارع أبو بكر', 'منطقة المعسكر', 'شارع البحر', 'حي البركة', 'شارع النزهة', 'منطقة الحكر'];
    const supervisors = ['أ. هبة الأسطل', 'أ. سماح قنديل', 'أ. إيمان بشير', 'أ. روان صيام', 'أ. آلاء النجار', 'أ. شهد أبو زيد', 'أ. محمد عاشور', 'أ. أحمد المصري', 'أ. نهال الديراوي', 'أ. ريم حبوش'];

    const phone = () => `05${pick(['99', '98', '97', '92', '95', '67', '68', '82'])}${String(ri(100000, 999999))}`;
    const natId = () => '9' + String(ri(10000000, 99999999));
    const birthFor = (stageIdx, gradeIdx) => {
      const ageY = 6 + stageIdx * 3 + gradeIdx + (chance(.3) ? 1 : 0); // تقريبية
      const y = 2026 - ageY;
      return `${y}-${String(ri(1, 12)).padStart(2, '0')}-${String(ri(1, 28)).padStart(2, '0')}`;
    };
    const randDate = (from, to) => {
      const t0 = new Date(from).getTime(), t1 = new Date(to).getTime();
      const t = t0 + rnd() * (t1 - t0);
      const d = new Date(t);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    /* ---------- أولياء الأمور والطلبة ---------- */
    const students = [];
    const guardians = [];
    let sid = 0, gid = 0;
    const guardianByKey = {};

    const distribution = [
      { s: 0, g: 0, n: 5 }, { s: 0, g: 1, n: 5 }, { s: 0, g: 2, n: 6 }, { s: 0, g: 3, n: 5 }, { s: 0, g: 4, n: 5 }, { s: 0, g: 5, n: 5 },
      { s: 1, g: 0, n: 6 }, { s: 1, g: 1, n: 5 }, { s: 1, g: 2, n: 5 },
      { s: 2, g: 0, n: 5 }, { s: 2, g: 1, n: 4 }, { s: 2, g: 2, n: 4 },
    ];

    for (const d of distribution) {
      const stage = CONFIG.stages[d.s];
      for (let k = 0; k < d.n; k++) {
        sid++;
        const isGirl = chance(.52);
        const first = isGirl ? pick(femaleFirstClean) : pick(maleFirst);
        const fatherFirst = pick(maleFirst);
        const family = pick(families);
        const name = `${first} ${fatherFirst} ${family}`;
        const gov = 'دير البلح';
        const city = pick(CONFIG.cities);
        const area = pick(areas);
        const displacement = chance(.68) ? 'مقيم' : (chance(.7) ? 'نازح' : 'عائد من النزوح');
        const housing = displacement === 'نازح' ? pick(['خيمة', 'مركز إيواء', 'منزل الأقارب', 'منزل مستأجر']) : pick(['منزل مستقل', 'شقة سكنية', 'منزل مستأجر']);

        /* ولي الأمر: مشاركة بين الأشقاء من نفس العائلة */
        const gKey = family;
        let guardianId;
        if (chance(.32) && guardianByKey[gKey]) {
          guardianId = guardianByKey[gKey];
        } else {
          gid++;
          const isMother = chance(.22);
          const gName = isMother ? `${pick(femaleFirstClean)} ${pick(maleFirst)} ${family}` : `${fatherFirst} ${pick(maleFirst)} ${family}`;
          const g = {
            id: gid, name: gName, nationalId: natId(), phone: phone(),
            governorate: gov, city, area, relation: isMother ? 'الأم' : 'الأب',
            childrenIds: [], notes: chance(.15) ? 'يفضل التواصل بعد الساعة الثانية ظهراً' : '',
          };
          guardians.push(g);
          guardianByKey[gKey] = gid;
          guardianId = gid;
        }
        const gRef = guardians.find(g => g.id === guardianId);
        gRef.childrenIds.push(sid);

        const gradeIdx = d.g;
        const isNew = d.s === 0 && gradeIdx === 0;
        students.push({
          id: sid, fileNo: String(1000 + sid), name, nationalId: natId(),
          phone: chance(.4) ? phone() : '',
          birthDate: birthFor(d.s, gradeIdx),
          gender: isGirl ? 'أنثى' : 'ذكر',
          stage: stage.id, grade: stage.grades[gradeIdx], section: pick(['أ', 'ب']),
          guardianId, guardianPhone: gRef.phone,
          governorate: gov, city, area, housingType: housing, displacement,
          regDate: isNew ? randDate('2026-08-20', '2026-09-05') : randDate('2022-09-01', '2026-06-30'),
          status: chance(.93) ? 'نشط' : pick(['منتقل', 'متوقف مؤقتاً']),
          notes: chance(.12) ? pick(['يحتاج إلى متابعة صحية دورية', 'من الأسر النازحة — يحتاج دعماً نفسياً', 'طالب متفوق — مرشح للمسابقات', 'يعاني من ضعف في النظر — يجلس في الصف الأمامي']) : '',
        });
      }
    }

    /* ---------- الصفوف ---------- */
    const classes = [];
    let cid = 0;
    for (const st of CONFIG.stages) {
      st.grades.forEach((grade, gi) => {
        ['أ', 'ب'].forEach(sec => {
          cid++;
          classes.push({ id: cid, stage: st.id, grade, section: sec, capacity: 32, supervisor: pick(supervisors) });
        });
      });
    }

    /* ---------- الإدارة ---------- */
    const employees = [
      { name: 'د. سلوى أبو جراد', jobTitle: 'مديرة المدرسة', dept: 'الإدارة العامة', hire: '2010-09-01', phone: '0599112233' },
      { name: 'أ. محمد النواجحة', jobTitle: 'نائب المدير', dept: 'الإدارة العامة', hire: '2013-09-01', phone: '0567445566' },
      { name: 'أ. سامي المصري', jobTitle: 'محاسب', dept: 'الشؤون المالية', hire: '2015-02-10', phone: '0592778899' },
      { name: 'أ. إيمان بشير', jobTitle: 'مرشدة تربوية', dept: 'الإرشاد التربوي', hire: '2017-09-03', phone: '0598123456' },
      { name: 'أ. روان صيام', jobTitle: 'أمينة المكتبة', dept: 'المكتبة', hire: '2019-09-01', phone: '0567987654' },
      { name: 'أ. ديمة حبوش', jobTitle: 'سكرتيرة', dept: 'السكرتارية', hire: '2021-01-15', phone: '0595001122' },
      { name: 'أ. كريم ثابت', jobTitle: 'منسق تكنولوجيا المعلومات', dept: 'تكنولوجيا المعلومات', hire: '2022-09-01', phone: '0592334455' },
      { name: 'أ. هبة الأسطل', jobTitle: 'رئيسة قسم شؤون الطلبة', dept: 'الشؤون الأكاديمية', hire: '2014-09-07', phone: '0568667788' },
    ].map((e, i) => ({ id: i + 1, nationalId: natId(), status: 'نشط', notes: '', ...e }));

    /* ---------- العاملون ---------- */
    const workers = [
      { name: 'أ. عوني أبو دان', jobTitle: 'حارس المدرسة', shift: 'الفترة الصباحية', hire: '2018-03-01', phone: '0595111333' },
      { name: 'أ. سعاد بركة', jobTitle: 'عامل نظافة', shift: 'الفترة الصباحية', hire: '2020-09-01', phone: '0567222444' },
      { name: 'أ. فتحية السمعوني', jobTitle: 'عامل نظافة', shift: 'الفترة الصباحية', hire: '2021-02-14', phone: '0599333555' },
      { name: 'أ. وليد أبو كميل', jobTitle: 'عامل نظافة', shift: 'الفترة المسائية', hire: '2023-01-08', phone: '0592444666' },
      { name: 'أ. جهاد المدهون', jobTitle: 'فني صيانة', shift: 'الفترة الصباحية', hire: '2019-06-20', phone: '0567555777' },
      { name: 'أ. صابر الطهراوي', jobTitle: 'بستاني', shift: 'الفترة الصباحية', hire: '2022-04-11', phone: '0592666888' },
    ].map((w, i) => ({ id: i + 1, nationalId: natId(), status: 'نشط', notes: '', ...w }));

    /* ---------- الحضور (آخر ١٠ أيام دراسية) ---------- */
    const attendance = [];
    let aid = 0;
    const days = U.schoolDaysBack(10, U.today());
    const chronic = [students[4]?.id, students[13]?.id, students[29]?.id].filter(Boolean);
    for (const day of days) {
      for (const stu of students) {
        if (stu.status !== 'نشط') continue;
        let status = 'present';
        const r = rnd();
        if (chronic.includes(stu.id) && days.indexOf(day) >= days.length - 3) status = 'absent';
        else if (r < .88) status = 'present';
        else if (r < .93) status = 'absent';
        else if (r < .97) status = 'late';
        else status = 'excused';
        aid++;
        attendance.push({ id: aid, date: day, studentId: stu.id, status, stage: stu.stage, grade: stu.grade, section: stu.section });
      }
    }

    /* ---------- الأداء الأكاديمي ---------- */
    const grades = [];
    let grid2 = 0;
    for (const stu of students) {
      if (stu.status !== 'نشط') continue;
      const ability = .55 + rnd() * .45;
      const subjCount = 4;
      const shuffled = [...CONFIG.subjects].sort(() => rnd() - .5).slice(0, subjCount);
      for (const subj of shuffled) {
        const exams = chance(.5) ? [pick(CONFIG.examTypes.slice(0, 5))] : [pick(CONFIG.examTypes.slice(0, 4)), pick(['الاختبار النصفي', 'الاختبار النهائي'])];
        for (const exam of exams) {
          const max = 100;
          const score = Math.min(100, Math.max(38, Math.round((ability + (rnd() - .5) * .22) * max)));
          grid2++;
          grades.push({
            id: grid2, studentId: stu.id, subject: subj, exam,
            score, maxScore: max,
            semester: chance(.55) ? 'الفصل الثاني' : 'الفصل الأول',
            year: '2025/2026',
            date: randDate('2026-02-01', '2026-06-10'),
          });
        }
      }
    }

    /* ---------- البسكويت ---------- */
    const ppc = 50;
    const biscuitMoves = [
      { id: 1, date: '2026-08-20', cartons: 8, piecesPerCarton: ppc, source: 'برنامج الغذاء العالمي', notes: 'دفعة افتتاح العام الدراسي' },
      { id: 2, date: '2026-08-31', cartons: 4, piecesPerCarton: ppc, source: 'وكالة غوث وتشغيل اللاجئين (الأونروا)', notes: 'دفعة جزئية' },
      { id: 3, date: '2026-09-10', cartons: 3, piecesPerCarton: ppc, source: 'مؤسسة التعاون — فلسطين', notes: 'دعم طارئ للمدارس' },
    ];
    const activeStudents = students.filter(s => s.status === 'نشط');
    const classCount = (stageId, grade, sec) => activeStudents.filter(s => s.stage === stageId && s.grade === grade && s.section === sec).length;
    const biscuitDist = [];
    let bid = 0;
    const addDist = (date, label, stageId, grade, section, count, perStu, notes) => {
      bid++;
      biscuitDist.push({ id: bid, date, label, stage: stageId || '', grade: grade || '', section: section || '', studentsCount: count, perStudent: perStu, pieces: count * perStu, notes: notes || '' });
    };
    addDist('2026-09-01', 'المدرسة كاملة', '', '', '', activeStudents.length, 1, 'توزيع افتتاحي لجميع الطلبة');
    addDist('2026-09-03', 'المرحلة الابتدائية', 'primary', '', '', activeStudents.filter(s => s.stage === 'primary').length, 2, '');
    addDist('2026-09-06', 'المرحلة الإعدادية', 'prep', '', '', activeStudents.filter(s => s.stage === 'prep').length, 2, '');
    addDist('2026-09-07', 'المرحلة الثانوية', 'secondary', '', '', activeStudents.filter(s => s.stage === 'secondary').length, 2, '');
    addDist('2026-09-08', 'الصف الأول — شعبة أ', 'primary', 'الصف الأول', 'أ', classCount('primary', 'الصف الأول', 'أ'), 2, '');
    addDist('2026-09-09', 'الصف الثالث — شعبة ب', 'primary', 'الصف الثالث', 'ب', classCount('primary', 'الصف الثالث', 'ب'), 2, '');
    addDist('2026-09-10', 'المدرسة كاملة', '', '', '', activeStudents.length, 1, 'دعم إضافي');
    addDist('2026-09-13', 'الصف السابع — شعبة أ', 'prep', 'الصف السابع', 'أ', classCount('prep', 'الصف السابع', 'أ'), 2, '');
    addDist('2026-09-14', 'الصف العاشر — شعبة أ', 'secondary', 'الصف العاشر', 'أ', classCount('secondary', 'الصف العاشر', 'أ'), 2, '');

    /* ---------- المستخدمون ---------- */
    const users = [
      { id: 1, name: 'أ. سامي المصري', email: 'admin@alaishiya.edu.ps', pass: U.hash('admin123'), role: 'مدير النظام', createdAt: U.nowISO() },
      { id: 2, name: 'أ. ديمة حبوش', email: 'secretary@alaishiya.edu.ps', pass: U.hash('123456'), role: 'سكرتارية', createdAt: U.nowISO() },
    ];

    /* ---------- التنبيهات ---------- */
    const nowT = Date.now();
    const mkNotif = (i, title, body, type, hoursAgo, read) => ({
      id: i + 1, title, body, type, read: !!read,
      ts: new Date(nowT - hoursAgo * 3600e3).toISOString(),
    });
    const notifications = [
      mkNotif(0, 'مخزون البسكويت منخفض', 'المخزون المتبقي يقترب من الحد الأدنى المحدد، يُنصح بمتابعة التوريد.', 'warning', 3, false),
      mkNotif(1, 'غياب متكرر', 'تم رصد طلبة تجاوز غيابهم ٣ أيام متتالية، يرجى مراجعة صفحة الحضور والغياب.', 'warning', 8, false),
      mkNotif(2, 'تذكير إداري', 'يرجى تحديث بيانات أولياء الأمور للطلبة المستجدين قبل نهاية الأسبوع.', 'info', 26, false),
      mkNotif(3, 'إدخال درجات', 'تم إدخال دفعة جديدة من سجلات الأداء الأكاديمي للفصل الأول.', 'success', 50, true),
      mkNotif(4, 'نسخة احتياطية', 'يُنصح بتصدير نسخة احتياطية من البيانات بشكل دوري من صفحة الاستيراد والتصدير.', 'info', 90, true),
    ];

    /* ---------- سجل النشاطات ---------- */
    const mkAct = (i, action, details, hoursAgo, user) => ({
      id: i + 1, action, details,
      ts: new Date(nowT - hoursAgo * 3600e3).toISOString(),
      user: user || 'أ. سامي المصري',
    });
    const activity = [
      mkAct(0, 'تسجيل الحضور', 'تم تسجيل حضور اليوم الدراسي لجميع الصفوف', 2),
      mkAct(1, 'إضافة سجلات أداء', 'إدخال درجات الاختبار القصير لمادة الرياضيات', 5, 'أ. ديمة حبوش'),
      mkAct(2, 'توزيع بسكويت', 'توزيع وجبة البسكويت على الصف العاشر — شعبة أ', 26),
      mkAct(3, 'تعديل بيانات طالب', 'تحديث بيانات السكن والتواصل', 30),
      mkAct(4, 'إضافة طالب جديد', 'تسجيل طالب مستجد في الصف الأول', 49, 'أ. ديمة حبوش'),
      mkAct(5, 'إضافة وارد بسكويت', 'استلام دفعة بسكويت من مؤسسة التعاون', 140),
      mkAct(6, 'إنشاء تقرير', 'تصدير تقرير الحضور الشهري بصيغة PDF', 150),
      mkAct(7, 'إضافة ولي أمر', 'تسجيل ولي أمر جديد وربطه بالأبناء', 170),
    ];

    return {
      users, students, guardians, employees, workers, attendance, grades,
      biscuitMoves, biscuitDist, notifications, activity, classes,
      settings: defaultSettings(),
      meta: { seededAt: U.nowISO(), version: CONFIG.version },
    };
  }

  /* ================= التحميل والحفظ ================= */
  function load() {
    const raw = sGet(KEY);
    if (raw) {
      try { db = JSON.parse(raw); } catch (e) { db = null; }
    }
    if (!db || !db.students) {
      db = buildSeed();
      save();
    }
    return db;
  }
  function save() { sSet(KEY, JSON.stringify(db)); }
  function reset() { db = buildSeed(); save(); return db; }
  function wipe() { sDel(KEY); sDel(SESSION_KEY); db = buildSeed(); save(); }

  /* ================= عمليات أساسية ================= */
  const nextId = (coll) => (db[coll].reduce((m, x) => Math.max(m, +x.id || 0), 0) + 1);

  function add(coll, obj) {
    obj.id = nextId(coll);
    db[coll].push(obj);
    save();
    return obj;
  }
  function update(coll, id, patch) {
    const it = db[coll].find(x => x.id === +id || x.id === id);
    if (it) { Object.assign(it, patch); save(); }
    return it;
  }
  function remove(coll, id) {
    id = +id;
    const idx = db[coll].findIndex(x => x.id === id);
    if (idx < 0) return false;
    db[coll].splice(idx, 1);
    if (coll === 'students') {
      db.attendance = db.attendance.filter(a => a.studentId !== id);
      db.grades = db.grades.filter(g => g.studentId !== id);
      db.guardians.forEach(g => { g.childrenIds = (g.childrenIds || []).filter(c => c !== id); });
    }
    if (coll === 'guardians') {
      db.students.forEach(s => { if (s.guardianId === id) s.guardianId = null; });
    }
    save();
    return true;
  }
  function find(coll, id) { return db[coll].find(x => x.id === +id || x.id === id) || null; }
  function replaceAll(coll, rows) { db[coll] = rows; save(); }
  function replaceDb(data) { db = data; save(); }
  function importRows(coll, rows, keyFn) {
    let added = 0, skipped = 0;
    for (const r of rows) {
      if (keyFn && db[coll].some(x => keyFn(x) === keyFn(r))) { skipped++; continue; }
      r.id = nextId(coll);
      db[coll].push(r);
      added++;
    }
    save();
    return { added, skipped };
  }

  /* ================= السجلات والتنبيهات ================= */
  function log(action, details = '') {
    const user = (typeof Auth !== 'undefined' && Auth.user()) ? Auth.user().name : 'النظام';
    db.activity.unshift({ id: nextId('activity'), ts: U.nowISO(), user, action, details });
    if (db.activity.length > 500) db.activity.length = 500;
    save();
  }
  function notify(title, body, type = 'info', key = '') {
    if (key) {
      const day = U.today();
      if (db.notifications.some(n => n.key === key && String(n.ts).slice(0, 10) === day)) return;
    }
    db.notifications.unshift({ id: nextId('notifications'), ts: U.nowISO(), title, body, type, read: false, key });
    if (db.notifications.length > 120) db.notifications.length = 120;
    save();
  }
  const unreadCount = () => db.notifications.filter(n => !n.read).length;

  /* ================= استعلامات جاهزة ================= */
  const student = (id) => find('students', id);
  const studentByFileNo = (fileNo) => db.students.find(s => s.fileNo === String(fileNo).trim());
  const guardianOf = (stu) => stu && stu.guardianId ? find('guardians', stu.guardianId) : null;
  const childrenOf = (gid) => db.students.filter(s => s.guardianId === +gid);
  const activeStudents = () => db.students.filter(s => s.status === 'نشط');
  const roster = (stageId, grade, section) => activeStudents().filter(s =>
    (!stageId || s.stage === stageId) && (!grade || s.grade === grade) && (!section || s.section === section));

  function avgForStudent(id, year, semester) {
    const rows = db.grades.filter(g => g.studentId === +id && (!year || g.year === year) && (!semester || g.semester === semester));
    if (!rows.length) return null;
    return Math.round(rows.reduce((t, g) => t + (g.score / (g.maxScore || 100)) * 100, 0) / rows.length * 10) / 10;
  }
  function topStudents(year, semester, min = 90) {
    return activeStudents()
      .map(s => ({ student: s, avg: avgForStudent(s.id, year, semester) }))
      .filter(x => x.avg !== null && x.avg >= min)
      .sort((a, b) => b.avg - a.avg);
  }

  function todayAttendance(date) {
    date = date || U.today();
    return db.attendance.filter(a => a.date === date);
  }
  function absenceStreak(studentId, daysNeeded) {
    const days = U.schoolDaysBack(daysNeeded, U.today());
    return days.every(d => db.attendance.some(a => a.studentId === +studentId && a.date === d && a.status === 'absent'));
  }

  function biscuitStats() {
    const ppc = db.settings.piecesPerCarton || CONFIG.piecesPerCarton;
    const inPieces = db.biscuitMoves.reduce((t, m) => t + m.cartons * (m.piecesPerCarton || ppc), 0);
    const inCartons = db.biscuitMoves.reduce((t, m) => t + m.cartons, 0);
    const outPieces = db.biscuitDist.reduce((t, d) => t + d.pieces, 0);
    const remaining = Math.max(0, inPieces - outPieces);
    return {
      inPieces, inCartons, outPieces, remaining,
      outCartons: Math.floor(outPieces / ppc),
      remCartons: Math.floor(remaining / ppc),
      remLoose: remaining % ppc,
      distCount: db.biscuitDist.length,
    };
  }

  /* فحص التنبيهات الآلية */
  function checkAlerts() {
    const st = db.settings;
    const bs = biscuitStats();
    if (bs.remCartons <= st.lowStockThreshold) {
      notify('مخزون البسكويت منخفض', `المتبقي في المخزون ${U.fn(bs.remCartons)} كرتونة فقط (الحد الأدنى ${U.fn(st.lowStockThreshold)}). يرجى متابعة التوريد.`, 'warning', 'low-stock');
    }
    const needy = activeStudents().filter(s => absenceStreak(s.id, st.absenceAlert));
    if (needy.length) {
      notify('غياب متكرر يحتاج متابعة', `${needy.length === 1 ? 'طالب واحد تجاوز' : `${U.fn(needy.length)} من الطلبة تجاوزوا`} ${U.fn(st.absenceAlert)} أيام غياب متتالية: ${needy.slice(0, 4).map(s => s.name).join('، ')}${needy.length > 4 ? '…' : ''}`, 'danger', 'chronic-absence');
    }
  }

  /* ================= الجلسة ================= */
  const getSession = () => { try { return JSON.parse(sGet(SESSION_KEY) || 'null'); } catch (e) { return null; } };
  const setSession = (v) => v ? sSet(SESSION_KEY, JSON.stringify(v)) : sDel(SESSION_KEY);

  /* ================= الإعدادات ================= */
  const settings = () => db.settings;
  function saveSettings(patch) { Object.assign(db.settings, patch); save(); }

  /* ================= تطبيق المظهر ================= */
  function applyAppearance() {
    const st = db.settings;
    document.documentElement.setAttribute('data-theme', st.theme || 'light');
    document.documentElement.setAttribute('data-font-size', st.fontSize || 'medium');
  }

  load();

  return {
    get db() { return db; },
    load, save, reset, wipe,
    nextId, add, update, remove, find, replaceAll, replaceDb, importRows,
    log, notify, unreadCount,
    student, studentByFileNo, guardianOf, childrenOf, activeStudents, roster,
    avgForStudent, topStudents, todayAttendance, absenceStreak,
    biscuitStats, checkAlerts,
    getSession, setSession,
    settings, saveSettings, applyAppearance,
  };
})();
