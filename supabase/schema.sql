-- ============================================
-- مخطط قاعدة البيانات - مدرسة العائشية
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. الملفات الشخصية
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin','school_manager','teacher','employee','user')),
    active BOOLEAN DEFAULT true,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. أولياء الأمور
CREATE TABLE IF NOT EXISTS guardians (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name TEXT NOT NULL,
    relation TEXT DEFAULT 'أب',
    phone TEXT NOT NULL,
    alternative_phone TEXT,
    national_id TEXT,
    address TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. الصفوف
CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stage TEXT NOT NULL CHECK (stage IN ('ابتدائي','إعدادي','ثانوي')),
    grade TEXT NOT NULL,
    section TEXT NOT NULL,
    academic_year TEXT DEFAULT '2025-2026',
    capacity INTEGER DEFAULT 40,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_classes_unique ON classes(stage, grade, section, academic_year);

-- 4. الطلبة
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_number TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    gender TEXT NOT NULL CHECK (gender IN ('ذكر','أنثى')),
    birth_date DATE,
    status TEXT DEFAULT 'نشط' CHECK (status IN ('نشط','متوقف','منقول')),
    national_id TEXT,
    stage TEXT NOT NULL,
    grade TEXT NOT NULL,
    section TEXT NOT NULL,
    class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
    guardian_id UUID REFERENCES guardians(id) ON DELETE SET NULL,
    phone TEXT,
    address TEXT,
    governorate TEXT DEFAULT 'الوسطى',
    city TEXT DEFAULT 'دير البلح',
    housing_type TEXT DEFAULT 'سكن عائلي',
    displacement_status TEXT DEFAULT 'نازح',
    enrollment_date DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_students_class ON students(class_id);
CREATE INDEX IF NOT EXISTS idx_students_file ON students(file_number);

-- 5. المواد الدراسية
CREATE TABLE IF NOT EXISTS subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    stage TEXT NOT NULL,
    grade TEXT NOT NULL,
    max_score INTEGER DEFAULT 100,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. الأداء الأكاديمي
CREATE TABLE IF NOT EXISTS academic_performance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
    subject_name TEXT,
    exam_type TEXT NOT NULL,
    semester TEXT DEFAULT 'الأول',
    academic_year TEXT DEFAULT '2025-2026',
    score DECIMAL(5,2) NOT NULL,
    max_score INTEGER NOT NULL DEFAULT 100,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. الحضور
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL CHECK (status IN ('حاضر','غائب','متأخر','غياب بعذر')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_unique ON attendance(student_id, date);

-- 8. الموظفون
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name TEXT NOT NULL,
    position TEXT NOT NULL,
    department TEXT,
    phone TEXT,
    email TEXT,
    status TEXT DEFAULT 'نشط',
    salary DECIMAL(10,2),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. العاملون
CREATE TABLE IF NOT EXISTS workers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name TEXT NOT NULL,
    position TEXT NOT NULL,
    phone TEXT,
    work_period TEXT DEFAULT 'دوام كامل',
    status TEXT DEFAULT 'نشط',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. مخزون البسكويت
CREATE TABLE IF NOT EXISTS biscuit_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL CHECK (type IN ('وارد','موزع')),
    quantity_boxes INTEGER NOT NULL,
    quantity_pieces INTEGER NOT NULL,
    date DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. توزيعات البسكويت
CREATE TABLE IF NOT EXISTS biscuit_distributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    distribution_type TEXT NOT NULL,
    target_name TEXT NOT NULL,
    quantity_boxes INTEGER NOT NULL,
    quantity_pieces INTEGER NOT NULL,
    distribution_date DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. التنبيهات
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'معلومة',
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. سجل النشاطات
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. إعدادات المدرسة
CREATE TABLE IF NOT EXISTS school_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_name TEXT DEFAULT 'مدرسة العائشية',
    location TEXT DEFAULT 'دير البلح',
    academic_year TEXT DEFAULT '2025-2026',
    principal_name TEXT,
    phone TEXT,
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO school_settings (school_name, location) VALUES ('مدرسة العائشية', 'دير البلح') ON CONFLICT DO NOTHING;

-- ============================================
-- تفعيل RLS
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE biscuit_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_settings ENABLE ROW LEVEL SECURITY;

-- سياسات RLS
CREATE POLICY "عرض الطلبة" ON students FOR SELECT TO authenticated USING (true);
CREATE POLICY "إضافة الطلبة" ON students FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','school_manager','teacher'))
);
CREATE POLICY "تحديث الطلبة" ON students FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','school_manager'))
);
CREATE POLICY "حذف الطلبة" ON students FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "عرض السجلات" ON activity_logs FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "إضافة السجلات" ON activity_logs FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "عرض التنبيهات" ON notifications FOR SELECT TO authenticated USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "إضافة التنبيهات" ON notifications FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "عرض الإعدادات" ON school_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "تحديث الإعدادات" ON school_settings FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
