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

const isAbortError = (error: unknown): boolean => {
    if (error instanceof DOMException) {
        return error.name === 'AbortError';
    }

    return (
        typeof error === 'object' &&
        error !== null &&
        'name' in error &&
        (error as { name?: string }).name === 'AbortError'
    );
};

type SessionUser = {
    id: string;
    email?: string | null;
    user_metadata?: {
        name?: string | null;
    } | null;
};

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
        } catch (error) {
            if (isAbortError(error)) {
                throw error;
            }

            return null;
        }
    };

    const resolveAuthorizedUser = async (sessionUser: SessionUser): Promise<User | null> => {
        const email = sessionUser.email || '';
        const role = await getUserRole(sessionUser.id);

        if (role !== 'admin') {
            return null;
        }

        return {
            id: sessionUser.id,
            email,
            name: sessionUser.user_metadata?.name || email.split('@')[0] || 'User',
            role,
        };
    };

    useEffect(() => {
        let active = true;
        let initialized = false;

        const finalizeBootstrap = () => {
            if (!active || initialized) return;
            initialized = true;
            setLoading(false);
        };

        const syncSession = async (sessionUser: SessionUser | null) => {
            try {
                if (!sessionUser) {
                    if (active) setUser(null);
                    return;
                }

                const nextUser = await resolveAuthorizedUser(sessionUser);
                if (!active) return;

                if (!nextUser) {
                    setUser(null);
                    void supabase.auth.signOut().catch((error) => {
                        if (!isAbortError(error)) {
                            console.error('Failed to sign out unauthorized user', error);
                        }
                    });
                    return;
                }

                setUser(nextUser);
            } catch (error) {
                if (!isAbortError(error)) {
                    console.error('Failed to restore auth session', error);
                }
                if (active) setUser(null);
            } finally {
                finalizeBootstrap();
            }
        };

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            void syncSession(session?.user ?? null);
        });

        const bootstrapTimeout = window.setTimeout(() => {
            if (active && !initialized) {
                setUser(null);
                setLoading(false);
            }
        }, 4000);

        return () => {
            active = false;
            window.clearTimeout(bootstrapTimeout);
            subscription.unsubscribe();
        };
    }, []);

    const login = async (email: string, password: string) => {
        try {
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

            const nextUser = await resolveAuthorizedUser(signedInUser);
            if (!nextUser) {
                await supabase.auth.signOut();
                setUser(null);
                return { error: { message: 'Access denied. Admin account required.' } };
            }

            setUser(nextUser);

            return { error: null };
        } catch (error) {
            if (isAbortError(error)) {
                return { error: { message: 'Authentication request was interrupted. Please try again.' } };
            }

            console.error('Login failed unexpectedly', error);
            return { error: { message: 'Login failed. Please try again.' } };
        }
    };

    const logout = async () => {
        try {
            await supabase.auth.signOut();
        } catch (error) {
            if (!isAbortError(error)) {
                console.error('Logout failed', error);
            }
        }
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
