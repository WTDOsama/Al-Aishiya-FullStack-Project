import { supabase, handleSupabaseError } from './supabase.js';

export const authService = {
    async signIn(email, password) {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            await this.logActivity('تسجيل دخول', 'auth');
            return { success: true, user: data.user, session: data.session };
        } catch (error) { return handleSupabaseError(error, 'تسجيل الدخول'); }
    },
    async signOut() {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            return { success: true };
        } catch (error) { return handleSupabaseError(error, 'تسجيل الخروج'); }
    },
    async getCurrentUser() {
        const { data: { user } } = await supabase.auth.getUser();
        return user;
    },
    async getProfile(userId) {
        const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
        if (error) return null;
        return data;
    },
    onAuthStateChange(callback) {
        return supabase.auth.onAuthStateChange((event, session) => callback(event, session));
    },
    async logActivity(action, entityType, details = null) {
        const user = await this.getCurrentUser();
        if (!user) return;
        await supabase.from('activity_logs').insert({ user_id: user.id, action, entity_type: entityType, details });
    }
};
