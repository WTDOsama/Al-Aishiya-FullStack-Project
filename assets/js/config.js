/* =====================================================================
   الإعدادات والثوابت العامة + الأيقونات + الشعار
   ===================================================================== */
'use strict';

const CONFIG = {
  systemName: 'نظام إدارة طلبة مدرسة العائشية دير البلح',
  schoolName: 'مدرسة العائشية دير البلح',
  ministry: 'وزارة التربية والتعليم العالي',
  country: 'دولة فلسطين',
  directorate: 'مديرية التربية والتعليم — دير البلح',
  version: '2.1.0',
  storagePrefix: 'aishiya_sms_',
  piecesPerCarton: 50,
  lowStockThreshold: 15,
  absenceAlertDays: 3,

  stages: [
    { id: 'primary',   name: 'المرحلة الابتدائية', grades: ['الصف الأول', 'الصف الثاني', 'الصف الثالث', 'الصف الرابع', 'الصف الخامس', 'الصف السادس'], color: '#0b7a5c' },
    { id: 'prep',      name: 'المرحلة الإعدادية',  grades: ['الصف السابع', 'الصف الثامن', 'الصف التاسع'], color: '#0369a1' },
    { id: 'secondary', name: 'المرحلة الثانوية',   grades: ['الصف العاشر', 'الصف الحادي عشر', 'الصف الثاني عشر'], color: '#6d28d9' },
  ],
  sections: ['أ', 'ب', 'ج'],

  subjects: ['اللغة العربية', 'اللغة الإنجليزية', 'الرياضيات', 'العلوم', 'التربية الإسلامية', 'الدراسات الاجتماعية', 'التكنولوجيا', 'التربية الفنية', 'التربية الرياضية'],
  examTypes: ['اختبار قصير أول', 'اختبار قصير ثانٍ', 'اختبار الشهر الأول', 'اختبار الشهر الثاني', 'الاختبار النصفي', 'الاختبار النهائي', 'مشاركة صفية', 'واجب منزلي'],
  semesters: ['الفصل الأول', 'الفصل الثاني'],
  academicYears: ['2024/2025', '2025/2026', '2026/2027'],

  attendanceStatuses: [
    { id: 'present', name: 'حاضر',       tone: 'green', cls: 'on-p', icon: 'check' },
    { id: 'absent',  name: 'غائب',       tone: 'red',   cls: 'on-a', icon: 'x' },
    { id: 'late',    name: 'متأخر',      tone: 'amber', cls: 'on-l', icon: 'clock' },
    { id: 'excused', name: 'غياب بعذر',  tone: 'blue',  cls: 'on-e', icon: 'info' },
  ],

  studentStatuses: ['نشط', 'منتقل', 'متوقف مؤقتاً'],
  genders: ['ذكر', 'أنثى'],
  relations: ['الأب', 'الأم', 'الجد', 'الجدة', 'العم', 'الخال', 'الأخ', 'الأخت'],
  governorates: ['شمال غزة', 'غزة', 'دير البلح', 'خان يونس', 'رفح'],
  cities: ['دير البلح', 'النصيرات', 'المغازي', 'البريج', 'الزوايدة', 'المصدر', 'وادي السلقا', 'جحر الديك'],
  housingTypes: ['منزل مستقل', 'شقة سكنية', 'منزل مستأجر', 'خيمة', 'مركز إيواء', 'منزل الأقارب'],
  displacementStatuses: ['مقيم', 'نازح', 'عائد من النزوح'],

  empStatuses: ['نشط', 'في إجازة', 'متوقف'],
  empDepartments: ['الإدارة العامة', 'الشؤون المالية', 'الشؤون الأكاديمية', 'الإرشاد التربوي', 'المكتبة', 'السكرتارية', 'تكنولوجيا المعلومات', 'الخدمات'],
  workerJobs: ['عامل نظافة', 'حارس المدرسة', 'سائق', 'فني صيانة', 'بستاني', 'عامل خدمات'],
  shifts: ['الفترة الصباحية', 'الفترة المسائية'],

  perfLevels: [
    { min: 90, name: 'ممتاز',     tone: 'green' },
    { min: 80, name: 'جيد جداً',  tone: 'teal' },
    { min: 70, name: 'جيد',       tone: 'blue' },
    { min: 60, name: 'مقبول',     tone: 'amber' },
    { min: 0,  name: 'ضعيف',      tone: 'red' },
  ],

  months: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
  weekdays: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],

  chartPalette: ['#0ea36f', '#f59e0b', '#0284c7', '#8b5cf6', '#ef4444', '#14b8a6', '#e0508c', '#84cc16', '#f97316'],
};

/* ============================ الشعار ============================ */
const LOGO_SVG = `
<svg viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="شعار المدرسة">
  <defs>
    <linearGradient id="lg1" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0e8a63"/><stop offset="1" stop-color="#07452f"/>
    </linearGradient>
    <linearGradient id="lg2" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffdf7e"/><stop offset="1" stop-color="#d9a521"/>
    </linearGradient>
  </defs>
  <circle cx="48" cy="48" r="46" fill="url(#lg1)"/>
  <circle cx="48" cy="48" r="46" fill="none" stroke="#d9a521" stroke-width="2.5"/>
  <circle cx="48" cy="48" r="39.5" fill="none" stroke="rgba(255,255,255,.35)" stroke-width="1"/>
  <path d="M48 20.5c2.6 3.6 4.4 7.3 5.1 11h-10.2c.7-3.7 2.5-7.4 5.1-11z" fill="url(#lg2)"/>
  <path d="M48 33c-8.5 0-15.8 2.4-21.5 6.2V57c5.7-3.8 13-6.2 21.5-6.2s15.8 2.4 21.5 6.2V39.2C63.8 35.4 56.5 33 48 33z" fill="#fdfcf7"/>
  <path d="M48 33v17.8" stroke="#0b7a5c" stroke-width="2.2" stroke-linecap="round"/>
  <path d="M31 40.5c4.8-1.9 10-2.9 15-2.9M31 46.5c4.8-1.9 10-2.9 15-2.9M65 40.5c-4.8-1.9-10-2.9-15-2.9M65 46.5c-4.8-1.9-10-2.9-15-2.9" stroke="#9db8ae" stroke-width="1.5" stroke-linecap="round" fill="none"/>
  <path d="M25 68.5c6.5-5.4 14-5.9 18-2.2M71 68.5c-6.5-5.4-14-5.9-18-2.2" stroke="#d9a521" stroke-width="3" stroke-linecap="round" fill="none"/>
  <circle cx="48" cy="65" r="2.4" fill="#d9a521"/>
</svg>`;

/* ============================ الأيقونات ============================ */
const ICON_PATHS = {
  dashboard: '<rect x="3" y="3" width="7.5" height="9" rx="1.6"/><rect x="13.5" y="3" width="7.5" height="5.5" rx="1.6"/><rect x="13.5" y="12" width="7.5" height="9" rx="1.6"/><rect x="3" y="15.5" width="7.5" height="5.5" rx="1.6"/>',
  students: '<circle cx="9" cy="8" r="3.4"/><path d="M3.2 19.5c.7-3.2 3-5 5.8-5s5.1 1.8 5.8 5"/><circle cx="17" cy="9" r="2.6"/><path d="M15.4 14.6c2.6.3 4.6 1.9 5.2 4.4"/>',
  guardians: '<circle cx="8.5" cy="7.5" r="3"/><path d="M3 19.5c.7-3 2.8-4.7 5.5-4.7s4.8 1.7 5.5 4.7"/><path d="M17.8 10.2c.1-2.1 3.1-2.2 3.1 0 0 1.5-1.55 2.3-3.1 3.6-1.55-1.3-3.1-2.1-3.1-3.6 0-2.2 3-2.1 3.1 0z" fill="currentColor" stroke="none"/>',
  classes: '<path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H10a2 2 0 0 1 2 2v14a2.5 2.5 0 0 0-2.5-2H4z"/><path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H14a2 2 0 0 0-2 2v14a2.5 2.5 0 0 1 2.5-2H20z"/>',
  attendance: '<rect x="4" y="4" width="16" height="17" rx="2.5"/><path d="M8.5 2.5v3.5M15.5 2.5v3.5M4 9.5h16"/><path d="m9 15 2.2 2.2L16 12.5"/>',
  performance: '<path d="M4 20V9.5M10 20V4M16 20v-6M22 20H2"/><path d="m3.5 8.5 6-5.5 4.5 4.5 6.5-4"/>',
  biscuit: '<circle cx="12" cy="12" r="8.6"/><circle cx="9.4" cy="9.6" r="1" fill="currentColor" stroke="none"/><circle cx="14.6" cy="10.8" r="1" fill="currentColor" stroke="none"/><circle cx="10.4" cy="14.8" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="15.4" r="1" fill="currentColor" stroke="none"/><circle cx="8.8" cy="12.4" r="1" fill="currentColor" stroke="none"/>',
  school: '<path d="m3 9.5 9-5.5 9 5.5"/><path d="M5.5 11v8.5h13V11"/><path d="M9.5 19.5v-5h5v5"/><path d="M19.5 8.5v4"/>',
  workers: '<path d="M6.5 16a5.8 5.8 0 0 1 11 0"/><path d="M3.5 16.5h17V19a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19z"/><path d="M12 10.2V6.8M9 7.5a3.2 3.2 0 0 1 6 0"/><path d="M10.5 20.5v-2.5h3v2.5"/>',
  qr: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.2"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.2"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.2"/><path d="M13.5 13.5h3.4v3.4h-3.4zM17.4 20.5h3.1M20.5 17.4v3.1M13.5 20.5h.5"/>',
  scan: '<path d="M3.5 7.5v-2a2 2 0 0 1 2-2h2M16.5 3.5h2a2 2 0 0 1 2 2v2M20.5 16.5v2a2 2 0 0 1-2 2h-2M7.5 20.5h-2a2 2 0 0 1-2-2v-2"/><path d="M4 12h16"/>',
  importExport: '<path d="M8 3.5 4.5 7 8 10.5"/><path d="M4.5 7H15a4.5 4.5 0 0 1 4.5 4.5v.5"/><path d="m16 13.5 3.5 3.5-3.5 3.5"/><path d="M19.5 17H9a4.5 4.5 0 0 1-4.5-4.5V12"/>',
  reports: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13.5h6M9 17h6M9 10h2"/>',
  bell: '<path d="M18 9a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-2-1-2-6"/><path d="M10.3 19.5a1.9 1.9 0 0 0 3.4 0"/>',
  activity: '<path d="M12 21a9 9 0 1 1 8.9-10.3"/><path d="M12 7v5l3.2 1.8"/><path d="M18.5 14.5 21 17l-2.5 2.5M21 17h-5"/>',
  social: '<circle cx="6" cy="12" r="2.7"/><circle cx="17" cy="5.7" r="2.7"/><circle cx="17" cy="18.3" r="2.7"/><path d="m8.4 10.7 6.2-3.6M8.4 13.3l6.2 3.6"/>',
  settings: '<circle cx="12" cy="12" r="3.1"/><path d="M12 2.8 13.4 5a6.6 6.6 0 0 1 2.4 1l2.6-.8 1.8 3.1-2 1.8a6.7 6.7 0 0 1 0 2.4l2 1.8-1.8 3.1-2.6-.8a6.6 6.6 0 0 1-2.4 1L12 21.2 10.6 19a6.6 6.6 0 0 1-2.4-1l-2.6.8-1.8-3.1 2-1.8a6.7 6.7 0 0 1 0-2.4l-2-1.8 1.8-3.1 2.6.8a6.6 6.6 0 0 1 2.4-1z"/>',
  search: '<circle cx="11" cy="11" r="6.3"/><path d="m20.5 20.5-4.6-4.6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  edit: '<path d="M14.5 5.5 18.5 9.5M4 20l1-4.5L15.7 4.8a1.9 1.9 0 0 1 2.7 0l.8.8a1.9 1.9 0 0 1 0 2.7L8.5 19z"/>',
  trash: '<path d="M4 6.5h16M9 6V4.3A1.3 1.3 0 0 1 10.3 3h3.4A1.3 1.3 0 0 1 15 4.3V6"/><path d="M6.5 6.5 7.4 20a1.6 1.6 0 0 0 1.6 1.5h6a1.6 1.6 0 0 0 1.6-1.5l.9-13.5"/><path d="M10 11v6M14 11v6"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/>',
  print: '<path d="M7 8V3.5h10V8"/><rect x="3.5" y="8" width="17" height="8.5" rx="1.8"/><path d="M7 14h10v6.5H7z"/>',
  download: '<path d="M12 3.5V15"/><path d="m7 10.5 5 5 5-5"/><path d="M4 19.5h16"/>',
  upload: '<path d="M12 15.5V4"/><path d="m7 8.5 5-5 5 5"/><path d="M4 20h16"/>',
  share: '<circle cx="6" cy="12" r="2.6"/><circle cx="17.5" cy="6" r="2.6"/><circle cx="17.5" cy="18" r="2.6"/><path d="m8.3 10.9 6.9-3.8M8.3 13.1l6.9 3.8"/>',
  whatsapp: '<path d="M12 3a8.9 8.9 0 0 0-7.7 13.3L3 21l4.8-1.3A9 9 0 1 0 12 3z"/><path d="M9 8.2c.9-.4 1.3-.5 1.6.6l.5 1.3c.1.4 0 .8-.3 1.1l-.6.6c.4 1 1.5 2.1 2.6 2.6l.7-.6c.3-.3.7-.4 1.1-.3l1.3.5c1.1.3 1 .7.6 1.6-.9 1.7-2.2 1.3-3.4.9a13 13 0 0 1-4.2-2.5 12 12 0 0 1-2.5-4.2c-.4-1.2-.8-2.5.9-3.4z" fill="currentColor" stroke="none"/>',
  telegram: '<path d="m21 4.5-3 15.3c-.2.9-.8 1.1-1.6.7l-4.5-3.3-2.2 2.1c-.24.24-.44.44-.9.44l.32-4.6L17.4 7.4c.36-.32-.08-.5-.56-.18L6.7 13.7 2.2 12.3c-.97-.3-.99-.97.2-1.43L19 3.6c.8-.3 1.53.18 1.27.9z" fill="currentColor" stroke="none"/>',
  facebook: '<path d="M14.5 21.5v-7h2.6l.5-3.4h-3.1V8.9c0-1 .4-1.9 2-1.9h1.3V4c-.6-.1-1.6-.2-2.6-.2-2.4 0-4 1.4-4 4.1v3.2H8.5v3.4h2.7v7z" fill="currentColor" stroke="none"/>',
  youtube: '<rect x="2.8" y="6" width="18.4" height="12.5" rx="3"/><path d="m10.3 9.5 4.6 2.8-4.6 2.8z" fill="currentColor" stroke="none"/>',
  globe: '<circle cx="12" cy="12" r="8.6"/><path d="M3.4 12h17.2M12 3.4c2.4 2.3 3.7 5.3 3.7 8.6s-1.3 6.3-3.7 8.6c-2.4-2.3-3.7-5.3-3.7-8.6S9.6 5.7 12 3.4z"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  check: '<path d="m4.5 12.5 5 5 10-11"/>',
  checkCircle: '<circle cx="12" cy="12" r="8.6"/><path d="m8.5 12.3 2.4 2.4 4.8-5.2"/>',
  xCircle: '<circle cx="12" cy="12" r="8.6"/><path d="m9 9 6 6M15 9l-6 6"/>',
  alert: '<path d="M12 3.5 1.8 20h20.4z"/><path d="M12 9.5v4.5M12 17.2v.3"/>',
  info: '<circle cx="12" cy="12" r="8.6"/><path d="M12 11v5.5M12 7.6v.3"/>',
  clock: '<circle cx="12" cy="12" r="8.6"/><path d="M12 7v5.2l3.3 2"/>',
  menu: '<path d="M4 6.5h16M4 12h16M4 17.5h16"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5V5M12 19v2.5M4.6 4.6 6.4 6.4M17.6 17.6l1.8 1.8M2.5 12H5M19 12h2.5M4.6 19.4l1.8-1.8M17.6 6.4l1.8-1.8"/>',
  moon: '<path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11z"/>',
  chevronDown: '<path d="m6 9 6 6 6-6"/>',
  chevronLeft: '<path d="m14.5 6-6 6 6 6"/>',
  chevronRight: '<path d="m9.5 6 6 6-6 6"/>',
  filter: '<path d="M4 5h16l-6.2 7.2v5.3L10.2 20v-7.8z"/>',
  refresh: '<path d="M20 11.5A8 8 0 0 0 6.2 6.7L4 9"/><path d="M4 4v5h5"/><path d="M4 12.5a8 8 0 0 0 13.8 4.8L20 15"/><path d="M20 20v-5h-5"/>',
  refreshCCW: '<path d="M4 11.5A8 8 0 0 1 17.8 6.7L20 9"/><path d="M20 4v5h-5"/><path d="M20 12.5a8 8 0 0 1-13.8 4.8L4 15"/><path d="M4 20v-5h5"/>',
  save: '<path d="M5 3.5h11l3.5 3.5v12a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 19V5A1.5 1.5 0 0 1 6 3.5z"/><path d="M8 3.5V8h7.5V3.5"/><rect x="8" y="13" width="8" height="7.5" rx="1"/>',
  logout: '<path d="M14 4H6.5A1.5 1.5 0 0 0 5 5.5v13A1.5 1.5 0 0 0 6.5 20H14"/><path d="m16.5 8 4 4-4 4M20.5 12H10"/>',
  user: '<circle cx="12" cy="8" r="3.6"/><path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5"/>',
  phone: '<path d="M6.8 3.5h3l1.5 4-2 1.5a13 13 0 0 0 5.7 5.7l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.8 5.7a2 2 0 0 1 2-2.2z"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>',
  mapPin: '<path d="M12 21s-7-5.6-7-11a7 7 0 0 1 14 0c0 5.4-7 11-7 11z"/><circle cx="12" cy="10" r="2.6"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="16" rx="2"/><path d="M8 3v4M16 3v4M3.5 10h17"/>',
  idCard: '<rect x="3" y="4.5" width="18" height="15" rx="2"/><circle cx="8.5" cy="10.5" r="1.8"/><path d="M6 15.5c.5-1.7 1.4-2.5 2.5-2.5s2 .8 2.5 2.5"/><path d="M14 9.5h4M14 13h4"/>',
  home: '<path d="m4 11 8-7 8 7"/><path d="M6 9.5V20h12V9.5"/><path d="M10 20v-5.5h4V20"/>',
  award: '<circle cx="12" cy="9" r="5.5"/><path d="m8.7 13.5-1.7 7 5-2.6 5 2.6-1.7-7"/><path d="m10 9 1.4 1.4 2.6-2.9"/>',
  box: '<path d="m12 3 8.5 4.5v9L12 21l-8.5-4.5v-9z"/><path d="m12 12 8.5-4.5M12 12v9M12 12 3.5 7.5"/>',
  inbox: '<path d="M4 13.5 6.5 4.5h11l2.5 9"/><path d="M4 13.5h5l1.5 2.5h3L15 13.5h5v5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 18.5z"/>',
  send: '<path d="m21 3.5-9.8 9.8"/><path d="M21 3.5 14.5 21l-3.3-7.7L3.5 10z"/>',
  database: '<ellipse cx="12" cy="5.5" rx="7.5" ry="3"/><path d="M4.5 5.5v13c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-13"/><path d="M4.5 12c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3"/>',
  camera: '<path d="M4 8h3l2-2.5h6L17 8h3a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 20 20H4a1.5 1.5 0 0 1-1.5-1.5v-9A1.5 1.5 0 0 1 4 8z"/><circle cx="12" cy="13.5" r="3.4"/>',
  heart: '<path d="M12 20s-8-4.8-8-10.5C4 6 7 4 9.5 5.4 10.6 6 11.4 7 12 8c.6-1 1.4-2 2.5-2.6C17 4 20 6 20 9.5 20 15.2 12 20 12 20z"/>',
  bookOpen: '<path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H10a2 2 0 0 1 2 2v14a2.5 2.5 0 0 0-2.5-2H4z"/><path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H14a2 2 0 0 0-2 2v14a2.5 2.5 0 0 1 2.5-2H20z"/>',
  cake: '<path d="M4.5 21h15"/><path d="M5.5 21v-7a1.8 1.8 0 0 1 1.8-1.8h9.4a1.8 1.8 0 0 1 1.8 1.8v7"/><path d="M12 8.5v3.7"/><path d="M12 5.2a1.4 1.4 0 0 0 1.4-1.4C13.4 2.6 12 1.5 12 1.5s-1.4 1.1-1.4 2.3A1.4 1.4 0 0 0 12 5.2z" fill="currentColor" stroke="none"/><path d="M5.5 16.8c1.5 1.2 3 1.2 4.5 0s3-1.2 4.5 0 3 1.2 4.5 0"/>',
  link: '<path d="M10 14a4.5 4.5 0 0 0 6.4.4l3-3a4.5 4.5 0 0 0-6.4-6.4l-1.7 1.7"/><path d="M14 10a4.5 4.5 0 0 0-6.4-.4l-3 3a4.5 4.5 0 0 0 6.4 6.4l1.7-1.7"/>',
  users: '<circle cx="9" cy="8" r="3.4"/><path d="M3.2 19.5c.7-3.2 3-5 5.8-5s5.1 1.8 5.8 5"/><path d="M16 4.8a3.4 3.4 0 0 1 0 6.4"/><path d="M17.8 14.8c1.9.7 3.2 2.3 3.7 4.7"/>',
  baby: '<circle cx="12" cy="11" r="7.5"/><path d="M9.5 10.2v.3M14.5 10.2v.3"/><path d="M9.2 13.4c.8.9 1.7 1.3 2.8 1.3s2-.4 2.8-1.3"/><path d="M12 3.5c1.2 0 1.8.8 1.8 1.6"/>',
  trend: '<path d="m3.5 17 5.5-5.5 3.5 3.5 8-8.5"/><path d="M15.5 6.5h5v5"/>',
  fileDown: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M12 11.5V17M9.2 14.7 12 17.5l2.8-2.8"/>',
  sparkles: '<path d="M12 4 13.6 9 18.5 10.5 13.6 12 12 17 10.4 12 5.5 10.5 10.4 9z"/><path d="M18.5 15.5 19 17l1.5.5-1.5.5-.5 1.5-.5-1.5-1.5-.5 1.5-.5z"/>',
};

function iconSvg(name, cls) {
  const p = ICON_PATHS[name] || ICON_PATHS.info;
  return `<span class="ic ${cls || ''}" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${p}</svg></span>`;
}

/* خريطة عناصر القائمة الجانبية */
const NAV_ITEMS = [
  { group: 'الرئيسية' },
  { id: 'dashboard',  label: 'لوحة التحكم',           icon: 'dashboard',    hash: '#/dashboard' },
  { group: 'شؤون الطلبة' },
  { id: 'students',   label: 'الطلبة',                icon: 'students',     hash: '#/students' },
  { id: 'guardians',  label: 'أولياء الأمور',          icon: 'guardians',    hash: '#/guardians' },
  { id: 'classes',    label: 'الصفوف الدراسية',        icon: 'classes',      hash: '#/classes' },
  { group: 'العمليات اليومية' },
  { id: 'attendance', label: 'الحضور والغياب',         icon: 'attendance',   hash: '#/attendance' },
  { id: 'performance',label: 'الأداء الأكاديمي',       icon: 'performance',  hash: '#/performance' },
  { id: 'biscuits',   label: 'توزيع البسكويت',         icon: 'biscuit',      hash: '#/biscuits' },
  { group: 'شؤون المدرسة' },
  { id: 'school',     label: 'إدارة المدرسة',          icon: 'school',       hash: '#/school' },
  { id: 'workers',    label: 'العاملون',               icon: 'workers',      hash: '#/workers' },
  { group: 'الأنظمة والأدوات' },
  { id: 'qr',         label: 'قارئ رمز QR',            icon: 'scan',         hash: '#/qr-reader' },
  { id: 'io',         label: 'استيراد وتصدير البيانات', icon: 'importExport', hash: '#/import-export' },
  { id: 'reports',    label: 'مركز التقارير',           icon: 'reports',      hash: '#/reports' },
  { group: 'المتابعة' },
  { id: 'notifications', label: 'التنبيهات',           icon: 'bell',         hash: '#/notifications', badge: true },
  { id: 'activity',   label: 'سجل النشاطات',            icon: 'activity',     hash: '#/activity-log' },
  { id: 'social',     label: 'مواقع التواصل الاجتماعي', icon: 'social',       hash: '#/social' },
  { group: 'النظام' },
  { id: 'settings',   label: 'الإعدادات',               icon: 'settings',     hash: '#/settings' },
];
