import { supabase, handleSupabaseError } from './supabase.js';
import { authService } from './authService.js';

export const studentService = {
    async getAll(filters = {}, page = 1, pageSize = 50) {
        try {
            let query = supabase.from('students').select('*, guardian:guardians(full_name, phone), class:classes(stage, grade, section)', { count: 'exact' });
            if (filters.search) query = query.or(`full_name.ilike.%${filters.search}%,file_number.ilike.%${filters.search}%`);
            if (filters.stage) query = query.eq('stage', filters.stage);
            if (filters.status) query = query.eq('status', filters.status);
            const from = (page - 1) * pageSize;
            const { data, error, count } = await query.range(from, from + pageSize - 1).order('created_at', { ascending: false });
            if (error) throw error;
            return { success: true, data: data || [], total: count || 0, page, pageSize };
        } catch (error) { return handleSupabaseError(error, 'تحميل الطلبة'); }
    },
    async create(studentData) {
        try {
            const user = await authService.getCurrentUser();
            const { data, error } = await supabase.from('students').insert({ ...studentData, created_by: user?.id }).select().single();
            if (error) throw error;
            await authService.logActivity('إضافة طالب', 'students', { name: data.full_name });
            return { success: true, data, message: 'تم إضافة الطالب بنجاح' };
        } catch (error) { return handleSupabaseError(error, 'إضافة الطالب'); }
    },
    async update(id, studentData) {
        try {
            const { data, error } = await supabase.from('students').update(studentData).eq('id', id).select().single();
            if (error) throw error;
            return { success: true, data, message: 'تم التحديث بنجاح' };
        } catch (error) { return handleSupabaseError(error, 'تحديث الطالب'); }
    },
    async delete(id) {
        try {
            const { error } = await supabase.from('students').delete().eq('id', id);
            if (error) throw error;
            await authService.logActivity('حذف طالب', 'students', { id });
            return { success: true, message: 'تم الحذف بنجاح' };
        } catch (error) { return handleSupabaseError(error, 'حذف الطالب'); }
    }
};
