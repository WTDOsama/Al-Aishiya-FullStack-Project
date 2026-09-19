# 🏫 نظام إدارة طلبة مدرسة العائشية - دير البلح

منظومة مدرسية عربية متكاملة (RTL) مبنية على **Supabase + Vercel**.

## 🚀 النشر السريع

### 1️⃣ إنشاء مشروع Supabase
1. اذهب إلى [supabase.com](https://supabase.com) وسجّل الدخول
2. اضغط **New Project** → اسم: `alaishiya-school`
3. انتظر دقيقة حتى يكتمل الإنشاء
4. من **Settings** → **API** انسخ:
   - **Project URL**
   - **anon public key**

### 2️⃣ تشغيل قاعدة البيانات
1. في Supabase، اذهب إلى **SQL Editor**
2. الصق محتوى ملف `supabase/schema.sql` بالكامل
3. اضغط **Run**
4. (اختياري) شغّل `supabase/seed.sql` للبيانات التجريبية

### 3️⃣ إنشاء حساب المدير
1. في Supabase → **Authentication** → **Users** → **Add user**
2. أدخل:
   - Email: `admin@alaishiya.edu.ps`
   - Password: `Admin@123456`
   - ✅ Auto Confirm User
3. في **Table Editor** → جدول `profiles` → عدّل المستخدم:
   - `role`: `admin`
   - `full_name`: `مدير النظام`
   - `active`: `true`

### 4️⃣ النشر على Vercel
1. اذهب إلى [vercel.com/new](https://vercel.com/new)
2. اختر هذا المستودع
3. Framework Preset: **Vite**
4. ⚠️ **أضف Environment Variables**:
   - `VITE_SUPABASE_URL` = رابط مشروعك من Supabase
   - `VITE_SUPABASE_ANON_KEY` = المفتاح العام
5. اضغط **Deploy**

## 🔐 بيانات الدخول
| الحقل | القيمة |
|------|--------|
| البريد | `admin@alaishiya.edu.ps` |
| كلمة المرور | `Admin@123456` |

## 📊 الجداول
- profiles, students, guardians, classes, subjects
- academic_performance, attendance
- employees, workers
- biscuit_inventory, biscuit_distributions
- notifications, activity_logs, school_settings

## 🛠️ البنية
```
├── index.html
├── package.json
├── vite.config.js
├── vercel.json
├── .env.example
├── assets/          # الواجهة الحالية
├── services/        # خدمات Supabase
│   ├── supabase.js
│   ├── authService.js
│   └── studentService.js
└── supabase/        # قاعدة البيانات
    ├── schema.sql
    └── seed.sql
```

## 📞 الدعم
راجع ملف DEPLOYMENT.md للتفاصيل الكاملة.
