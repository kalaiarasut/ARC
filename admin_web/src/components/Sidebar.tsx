import React from 'react';
import { Box, Typography } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';

export const DRAWER_WIDTH = 280;

// Ocean Gradient matching Login
const OCEAN_GRADIENT = 'linear-gradient(135deg, #0a4d68 0%, #088395 50%, #05bfdb 100%)';
const ACTIVE_SHADOW = '0 4px 12px rgba(8, 131, 149, 0.35)'; // Based on #088395

interface NavItemProps {
    icon: React.ReactNode;
    label: string;
    path: string;
    isActive: boolean;
    onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, isActive, onClick }) => (
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
            background: isActive ? OCEAN_GRADIENT : 'transparent',
            boxShadow: isActive ? ACTIVE_SHADOW : 'none',
            '&:hover': {
                backgroundColor: isActive ? 'transparent' : 'rgba(8, 131, 149, 0.08)',
                transform: isActive ? 'none' : 'translateX(4px)',
            },
        }}
    >
        <Box sx={{
            display: 'flex',
            alignItems: 'center',
            color: isActive ? '#FFFFFF' : '#64748b',
            transition: 'color 0.2s ease',
        }}>
            {icon}
        </Box>
        <Typography
            sx={{
                fontSize: '0.875rem',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? '#FFFFFF' : '#475569',
                letterSpacing: '-0.01em',
            }}
        >
            {label}
        </Typography>
    </Box>
);

export const Sidebar: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const navItems = [
        { icon: <DashboardOutlinedIcon sx={{ fontSize: 20 }} />, label: 'Dashboard', path: '/dashboard' },
        { icon: <DescriptionOutlinedIcon sx={{ fontSize: 20 }} />, label: 'Hazard Reports', path: '/reports' },
    ];

    const isActive = (path: string) => {
        if (path === '/reports') return location.pathname.startsWith('/reports');
        return location.pathname.startsWith(path);
    };

    return (
        <Box
            component="nav"
            sx={{
                width: DRAWER_WIDTH,
                flexShrink: 0,
                height: '100vh',
                background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
                display: 'flex',
                flexDirection: 'column',
                borderRight: '1px solid rgba(226, 232, 240, 0.8)',
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
                        background: OCEAN_GRADIENT,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(8, 131, 149, 0.3)',
                    }}
                >
                    <Typography sx={{ color: '#FFFFFF', fontWeight: 700, fontSize: '1rem' }}>C</Typography>
                </Box>
                <Typography sx={{ fontSize: '1.125rem', fontWeight: 700, color: '#1e293b', letterSpacing: '-0.02em' }}>
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
                        onClick={() => navigate(item.path)}
                    />
                ))}
            </Box>
        </Box>
    );
};
