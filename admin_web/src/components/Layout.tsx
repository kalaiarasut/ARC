import React, { useState } from 'react';
import { Box, CssBaseline, ThemeProvider, IconButton, Drawer } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { theme } from '../theme';
import { Sidebar, DRAWER_WIDTH } from './Sidebar';

interface LayoutProps {
    children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

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
                {/* Mobile Drawer */}
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{ keepMounted: true }}
                    sx={{
                        display: { xs: 'block', md: 'none' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH, border: 'none' },
                    }}
                >
                    <Sidebar onNavigate={handleDrawerToggle} />
                </Drawer>

                {/* Desktop Sidebar */}
                <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                    <Sidebar />
                </Box>

                <Box
                    component="main"
                    sx={{
                        flexGrow: 1,
                        width: { xs: '100%', md: `calc(100vw - ${DRAWER_WIDTH}px)` },
                        height: '100vh',
                        overflow: 'auto',
                        backgroundColor: '#FFFFFF',
                        margin: 0,
                        padding: 0,
                    }}
                >
                    <Box sx={{ p: { xs: 1, sm: 1, md: 1 }, width: '100%', boxSizing: 'border-box' }}>
                        {/* Mobile Menu Button */}
                        <IconButton
                            color="inherit"
                            aria-label="open drawer"
                            edge="start"
                            onClick={handleDrawerToggle}
                            sx={{
                                mr: 2,
                                display: { md: 'none' },
                                mb: 2,
                                color: '#0a4d68',
                                backgroundColor: '#f1f5f9',
                                '&:hover': { backgroundColor: '#e2e8f0' }
                            }}
                        >
                            <MenuIcon />
                        </IconButton>
                        {children}
                    </Box>
                </Box>
            </Box>
        </ThemeProvider>
    );
};
