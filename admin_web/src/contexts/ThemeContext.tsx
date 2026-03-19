import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { ThemeProvider as MUIThemeProvider, CssBaseline, type PaletteMode } from '@mui/material';
import { getTheme } from '../theme';

interface ThemeContextType {
    mode: PaletteMode;
    toggleColorMode: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
    mode: 'light',
    toggleColorMode: () => {},
});

export const useThemeContext = () => useContext(ThemeContext);

export const CustomThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Check local storage or system preference on initial load
    const [mode, setMode] = useState<PaletteMode>(() => {
        const savedMode = localStorage.getItem('themeMode');
        if (savedMode === 'light' || savedMode === 'dark') return savedMode;
        
        // Check system preference
        if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    });

    const toggleColorMode = () => {
        setMode((prevMode) => {
            const newMode = prevMode === 'light' ? 'dark' : 'light';
            localStorage.setItem('themeMode', newMode);
            return newMode;
        });
    };

    // Listen for system preference changes if no manual override is set
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e: MediaQueryListEvent) => {
            if (!localStorage.getItem('themeMode')) {
                setMode(e.matches ? 'dark' : 'light');
            }
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    // Generate theme based on mode
    const theme = useMemo(() => getTheme(mode), [mode]);

    return (
        <ThemeContext.Provider value={{ mode, toggleColorMode }}>
            <MUIThemeProvider theme={theme}>
                <CssBaseline />
                {children}
            </MUIThemeProvider>
        </ThemeContext.Provider>
    );
};
