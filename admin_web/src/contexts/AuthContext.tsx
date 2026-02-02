import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../config/supabase';

interface User {
    email: string;
    name: string;
    avatar?: string;
    role?: string;
}

interface AuthContextType {
    user: User | null;
    login: (email: string, password: string) => Promise<{ error: any }>;
    signup: (email: string, password: string) => Promise<{ error: any }>;
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

    useEffect(() => {
        // Check active session
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const email = session.user.email || '';
                setUser({
                    email,
                    name: session.user.user_metadata?.name || email.split('@')[0],
                    role: 'Admin', // Default role for now
                });
            }
            setLoading(false);
        };

        getSession();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                const email = session.user.email || '';
                setUser({
                    email,
                    name: session.user.user_metadata?.name || email.split('@')[0],
                    role: 'Admin',
                });
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const login = async (email: string, password: string) => {
        // DEV ONLY: Test Validation Bypass
        // Allows access for testing/demo without needing a real Supabase account
        if (email === 'admin@showcase.com' && password === 'admin123') {
            setUser({
                email: 'admin@showcase.com',
                name: 'Test Admin',
                role: 'Admin',
            });
            return { error: null };
        }

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        return { error };
    };

    const signup = async (email: string, password: string) => {
        const { error } = await supabase.auth.signUp({
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
        signup,
        logout,
        isAuthenticated: !!user,
        loading,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
