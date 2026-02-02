import React from 'react';
import { Box, CssBaseline, ThemeProvider } from '@mui/material';
import { theme } from '../theme';
import { Sidebar, DRAWER_WIDTH } from './Sidebar';

interface LayoutProps {
    children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#FFFFFF' }}>
                <Sidebar />
                <Box
                    component="main"
                    sx={{
                        flexGrow: 1,
                        marginLeft: `${DRAWER_WIDTH}px`,
                        minHeight: '100vh',
                        backgroundColor: '#FFFFFF',
                    }}
                >
                    <Box sx={{ p: 4 }}>
                        {children}
                    </Box>
                </Box>
            </Box>
        </ThemeProvider>
    );
};
