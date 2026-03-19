import React, { useState } from 'react';
import { Box, Divider, Typography, Avatar } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import MapOutlinedIcon from '@mui/icons-material/MapOutlined';
import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined';
import HubOutlinedIcon from '@mui/icons-material/HubOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import { IconButton } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { useThemeContext } from '../contexts/ThemeContext';

export const DRAWER_WIDTH = 240;

// Ocean Gradient matching Login
const OCEAN_GRADIENT = 'linear-gradient(135deg, #0a4d68 0%, #088395 50%, #05bfdb 100%)';
const ACTIVE_SHADOW_LIGHT = '0 4px 12px rgba(8, 131, 149, 0.35)';

// Bioluminescent Gradient for Dark Mode
const BIO_GRADIENT = 'linear-gradient(135deg, rgba(0, 255, 209, 0.15) 0%, transparent 100%)';
const BIO_SHADOW = '0 0 15px rgba(0, 255, 209, 0.2)';

interface NavItemProps {
    icon: React.ReactNode;
    label: string;
    path: string;
    isActive: boolean;
    isDark: boolean;
    onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, isActive, isDark, onClick }) => (
    <Box
        onClick={onClick}
        sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            px: 2,
            py: 1.25,
            mx: 2,
            borderRadius: '10px',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            background: isActive ? (isDark ? BIO_GRADIENT : OCEAN_GRADIENT) : 'transparent',
            boxShadow: isActive ? (isDark ? BIO_SHADOW : ACTIVE_SHADOW_LIGHT) : 'none',
            border: isActive && isDark ? '1px solid rgba(0, 255, 209, 0.1)' : '1px solid transparent',
            '&:hover': {
                backgroundColor: isActive ? 'transparent' : (isDark ? 'rgba(0, 255, 209, 0.05)' : 'rgba(8, 131, 149, 0.08)'),
                transform: isActive ? 'none' : 'translateX(4px)',
            },
        }}
    >
        <Box sx={{
            display: 'flex',
            alignItems: 'center',
            color: isActive ? (isDark ? '#00ffd1' : '#FFFFFF') : (isDark ? '#8892b0' : '#64748b'),
            transition: 'color 0.2s ease',
        }}>
            {icon}
        </Box>
        <Typography
            sx={{
                fontSize: '0.875rem',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? (isDark ? '#00ffd1' : '#FFFFFF') : (isDark ? '#e2f1f8' : '#475569'),
                letterSpacing: '-0.01em',
            }}
        >
            {label}
        </Typography>
    </Box>
);

interface SidebarProps {
    onNavigate?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onNavigate }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { isAuthenticated, logout, user } = useAuth();
    const { mode, toggleColorMode } = useThemeContext();
    const isDark = mode === 'dark';
    const [loggingOut, setLoggingOut] = useState(false);

    const navItems = [
        { icon: <DashboardOutlinedIcon sx={{ fontSize: 20 }} />, label: 'Dashboard', path: '/dashboard' },
        { icon: <DescriptionOutlinedIcon sx={{ fontSize: 20 }} />, label: 'Hazard Reports', path: '/reports' },
        { icon: <CampaignOutlinedIcon sx={{ fontSize: 20 }} />, label: 'Official Updates', path: '/advisories' },
        { icon: <HubOutlinedIcon sx={{ fontSize: 20 }} />, label: 'Generated Zones', path: '/generated-zones' },
        { icon: <HistoryOutlinedIcon sx={{ fontSize: 20 }} />, label: 'Audit Logs', path: '/audit-logs' },
        { icon: <MapOutlinedIcon sx={{ fontSize: 20 }} />, label: 'Live Map', path: '/map' },
    ];

    const isActive = (path: string) => {
        if (path === '/reports') return location.pathname.startsWith('/reports');
        if (path === '/advisories') return location.pathname.startsWith('/advisories');
        if (path === '/generated-zones') return location.pathname.startsWith('/generated-zones');
        if (path === '/audit-logs') return location.pathname.startsWith('/audit-logs');
        if (path === '/map') return location.pathname.startsWith('/map');
        return location.pathname.startsWith(path);
    };

    const handleNavClick = (path: string) => {
        navigate(path);
        if (onNavigate) onNavigate();
    };

    const handleLogout = async () => {
        if (loggingOut) return;
        try {
            setLoggingOut(true);
            await logout();
        } finally {
            setLoggingOut(false);
            navigate('/login');
            if (onNavigate) onNavigate();
        }
    };

    return (
        <Box
            component="nav"
            sx={{
                width: DRAWER_WIDTH,
                flexShrink: 0,
                height: '100vh',
                background: isDark ? 'linear-gradient(180deg, #0a192f 0%, #040b16 100%)' : 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
                display: 'flex',
                flexDirection: 'column',
                borderRight: `1px solid ${isDark ? 'rgba(0, 255, 209, 0.1)' : 'rgba(226, 232, 240, 0.8)'}`,
                zIndex: 1200,
            }}
        >
            {/* Logo */}
            <Box sx={{ p: 3, pb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                    sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '12px',
                        background: isDark ? 'linear-gradient(135deg, #00ffd1 0%, #00ccA7 100%)' : OCEAN_GRADIENT,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: isDark ? '0 0 15px rgba(0, 255, 209, 0.3)' : '0 4px 12px rgba(8, 131, 149, 0.3)',
                    }}
                >
                    <Typography sx={{ color: isDark ? '#040b16' : '#FFFFFF', fontWeight: 800, fontSize: '1rem' }}>C</Typography>
                </Box>
                <Typography sx={{ fontSize: '1.125rem', fontWeight: 700, color: isDark ? '#e2f1f8' : '#1e293b', letterSpacing: '-0.02em' }}>
                    CoastSafe
                </Typography>
            </Box>

            {/* Navigation */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.5, pt: 1 }}>
                {navItems.map((item) => (
                    <NavItem
                        key={item.path}
                        icon={item.icon}
                        label={item.label}
                        path={item.path}
                        isActive={isActive(item.path)}
                        isDark={isDark}
                        onClick={() => handleNavClick(item.path)}
                    />
                ))}
            </Box>

            {/* Bottom Actions */}
            <Box sx={{ p: 2, pt: 0 }}>
                {/* Theme Toggle */}
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: isAuthenticated && user ? 2 : 0 }}>
                    <IconButton 
                        onClick={toggleColorMode} 
                        sx={{ 
                            color: isDark ? '#00ffd1' : '#475569',
                            backgroundColor: isDark ? 'rgba(0, 255, 209, 0.05)' : 'rgba(0,0,0,0.04)',
                            '&:hover': {
                                backgroundColor: isDark ? 'rgba(0, 255, 209, 0.15)' : 'rgba(0,0,0,0.08)'
                            }
                        }}
                    >
                        {isDark ? <LightModeOutlinedIcon fontSize="small" /> : <DarkModeOutlinedIcon fontSize="small" />}
                    </IconButton>
                </Box>

                {/* Bottom Profile & Logout */}
                {isAuthenticated && user && (
                    <>
                        <Divider sx={{ mb: 1.5, opacity: 0.7, borderColor: isDark ? '#334155' : undefined }} />
                        <Box
                        onClick={handleLogout}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                            p: 1,
                            borderRadius: '12px',
                            cursor: 'pointer',
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            border: '1px solid transparent',
                            '&:hover': {
                                backgroundColor: 'rgba(239, 68, 68, 0.04)',
                                borderColor: 'rgba(239, 68, 68, 0.1)',
                                '& .logout-icon': { opacity: 1, transform: 'translateX(0)' },
                            }
                        }}
                    >
                        <Avatar sx={{ width: 34, height: 34, background: isDark ? '#040b16' : OCEAN_GRADIENT, border: isDark ? '1px solid rgba(0,255,209,0.2)' : 'none', color: isDark ? '#00ffd1' : '#fff', fontSize: '0.85rem', fontWeight: 600 }}>
                            {user.name?.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: isDark ? '#e2f1f8' : '#0F172A', fontSize: '0.85rem' }} noWrap>
                                {user.name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: isDark ? '#8892b0' : '#64748B', fontSize: '0.7rem' }} noWrap>
                                {loggingOut ? 'Logging out...' : 'Admin'}
                            </Typography>
                        </Box>
                        <LogoutIcon
                            className="logout-icon"
                            sx={{
                                fontSize: 18,
                                color: '#EF4444',
                                opacity: 0.4,
                                transform: 'translateX(-4px)',
                                transition: 'all 0.2s ease'
                            }}
                        />
                    </Box>
                    </>
                )}
            </Box>
        </Box>
    );
};
