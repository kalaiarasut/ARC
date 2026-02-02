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
            <Box
                sx={{
                    display: 'flex',
                    width: '100vw',
                    height: '100vh',
                    overflow: 'hidden',
                    backgroundColor: '#FFFFFF',
                    margin: 0,
                    padding: 0,
                }}
            >
                <Sidebar />
                <Box
                    component="main"
                    sx={{
                        flexGrow: 1,
                        width: `calc(100vw - ${DRAWER_WIDTH}px)`,
                        height: '100vh',
                        overflow: 'auto',
                        backgroundColor: '#FFFFFF',
                        margin: 0,
                        padding: 0,
                    }}
                >
                    <Box sx={{ p: 4, width: '100%', boxSizing: 'border-box' }}>
                        {children}
                    </Box>
                </Box>
            </Box>
        </ThemeProvider>
    );
};
