import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ متغيرات Supabase غير موجودة! تحقق من Vercel Environment Variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true }
});

export function handleSupabaseError(error, context = '') {
    console.error(`خطأ في ${context}:`, error);
    const messages = {
        '23505': 'هذا السجل موجود مسبقاً',
        '23503': 'لا يمكن الحذف لوجود بيانات مرتبطة',
        '42501': 'ليس لديك صلاحية لتنفيذ هذه العملية',
        'PGRST301': 'البيانات المطلوبة غير موجودة'
    };
    return { success: false, message: messages[error.code] || 'حدث خطأ غير متوقع', error };
}
