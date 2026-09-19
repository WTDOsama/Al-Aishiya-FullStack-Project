# 🚀 دليل النشر الكامل

## الخطوات بالترتيب

### 1. Supabase Setup
- أنشئ مشروعاً على supabase.com
- شغّل schema.sql في SQL Editor
- فعّل Email Authentication
- أنشئ حساب المدير وعدّل role = 'admin'

### 2. GitHub Upload
- ارفع ملفات المشروع على مستودع جديد
- تأكد من عدم رفع node_modules و .env

### 3. Vercel Deploy
- استورد المستودع في Vercel
- اختر Vite كـ Framework
- أضف Environment Variables:
  - VITE_SUPABASE_URL
  - VITE_SUPABASE_ANON_KEY
- اضغط Deploy

### 4. Post-Deploy
- حدّث Site URL في Supabase
- اختبر تسجيل الدخول
- اختبر إضافة طالب جديد

## حل المشاكل
- **"متغيرات غير موجودة"**: أضف Environment Variables في Vercel
- **"permission denied"**: تأكد من تفعيل RLS
- **"Failed to fetch"**: تحقق من URL و Key
