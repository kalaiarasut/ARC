import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../config/supabase';

interface User {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    role?: 'admin' | null;
}

interface AuthContextType {
    user: User | null;
    login: (email: string, password: string) => Promise<{ error: any }>;
    logout: () => Promise<void>;
    isAuthenticated: boolean;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const hydrateUserFromSession = async (sessionUser: { id: string; email?: string | null; user_metadata?: any }) => {
        const email = sessionUser.email || '';

        // Best-effort role lookup (RLS allows users to read only their own row).
        let role: 'admin' | null = null;
        try {
            const { data } = await supabase
                .from('app_roles')
                .select('role')
                .eq('user_id', sessionUser.id)
                .maybeSingle();
            role = (data?.role as 'admin' | undefined) ?? null;
        } catch {
            // Ignore (table may not exist yet / RLS mismatch / network)
            role = null;
        }

        setUser({
            id: sessionUser.id,
            email,
            name: sessionUser.user_metadata?.name || email.split('@')[0] || 'User',
            role,
        });
    };

    useEffect(() => {
        // Check active session
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                await hydrateUserFromSession(session.user);
            }
            setLoading(false);
        };

        getSession();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                void hydrateUserFromSession(session.user).finally(() => setLoading(false));
                return;
            }
            setUser(null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const login = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        return { error };
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
    };

    const value = {
        user,
        login,
        logout,
        isAuthenticated: !!user,
        loading,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
