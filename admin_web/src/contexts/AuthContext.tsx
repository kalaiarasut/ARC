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

    const getUserRole = async (userId: string): Promise<'admin' | null> => {
        try {
            const { data } = await supabase
                .from('app_roles')
                .select('role')
                .eq('user_id', userId)
                .maybeSingle();

            return (data?.role as 'admin' | undefined) ?? null;
        } catch {
            return null;
        }
    };

    const hydrateUserFromSession = async (sessionUser: { id: string; email?: string | null; user_metadata?: any }) => {
        const email = sessionUser.email || '';

        const role = await getUserRole(sessionUser.id);

        // Strict admin-only web access.
        if (role !== 'admin') {
            await supabase.auth.signOut();
            setUser(null);
            return;
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
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            return { error };
        }

        const signedInUser = data.user;
        if (!signedInUser) {
            return { error: { message: 'Login failed. Please try again.' } };
        }

        const role = await getUserRole(signedInUser.id);
        if (role !== 'admin') {
            await supabase.auth.signOut();
            setUser(null);
            return { error: { message: 'Access denied. Admin account required.' } };
        }

        setUser({
            id: signedInUser.id,
            email: signedInUser.email || email,
            name: signedInUser.user_metadata?.name || (signedInUser.email || email).split('@')[0] || 'Admin',
            role,
        });

        return { error: null };
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
