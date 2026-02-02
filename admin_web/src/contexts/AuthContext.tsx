import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface User {
    email: string;
    name: string;
    avatar?: string;
    role?: string;
}

interface AuthContextType {
    user: User | null;
    login: (emailOrUsername: string, password: string, name?: string) => void;
    logout: () => void;
    isAuthenticated: boolean;
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

    const login = (emailOrUsername: string, _password: string, name?: string) => {
        // In production, this would validate with your backend
        // Use provided name, or extract from email if not provided
        const userName = name || emailOrUsername.split('@')[0];
        const capitalizedName = userName.charAt(0).toUpperCase() + userName.slice(1);

        setUser({
            email: emailOrUsername,
            name: capitalizedName,
            role: 'Admin',
        });

        // Store in localStorage for persistence
        localStorage.setItem('user', JSON.stringify({
            email: emailOrUsername,
            name: capitalizedName,
            role: 'Admin',
        }));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
    };

    // Check for existing user on mount
    React.useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const value = {
        user,
        login,
        logout,
        isAuthenticated: !!user,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
