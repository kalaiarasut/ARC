import React from 'react';
import { Box, Typography, Divider } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import MapOutlinedIcon from '@mui/icons-material/MapOutlined';
import WavesIcon from '@mui/icons-material/Waves';
import { keyframes } from '@mui/material/styles';

export const DRAWER_WIDTH = 280;

// Ocean Gradient matching Login page
const OCEAN_GRADIENT = 'linear-gradient(135deg, #0a4d68 0%, #088395 50%, #05bfdb 100%)';
const ACTIVE_SHADOW = '0 4px 15px rgba(8, 131, 149, 0.4)';

// Subtle wave animation for logo
const waveMotion = keyframes`
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  25% {
    transform: translateY(-2px) rotate(-2deg);
  }
  75% {
    transform: translateY(1px) rotate(2deg);
  }
`;

// Glow pulse for active items
const glowPulse = keyframes`
  0%, 100% {
    box-shadow: 0 4px 15px rgba(8, 131, 149, 0.4);
  }
  50% {
    box-shadow: 0 4px 25px rgba(8, 131, 149, 0.6);
  }
`;

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
            gap: 2,
            px: 2.5,
            py: 1.5,
            mx: 2,
            borderRadius: '14px',
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            background: isActive ? OCEAN_GRADIENT : 'transparent',
            boxShadow: isActive ? ACTIVE_SHADOW : 'none',
            animation: isActive ? `${glowPulse} 3s ease-in-out infinite` : 'none',
            '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent)',
                transition: 'left 0.5s ease',
            },
            '&:hover::before': {
                left: '100%',
            },
            '&:hover': {
                backgroundColor: isActive ? 'transparent' : 'rgba(8, 131, 149, 0.1)',
                transform: isActive ? 'scale(1.02)' : 'translateX(6px)',
                boxShadow: isActive ? '0 6px 20px rgba(8, 131, 149, 0.5)' : '0 2px 8px rgba(8, 131, 149, 0.15)',
            },
        }}
    >
        <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 36,
            height: 36,
            borderRadius: '10px',
            background: isActive ? 'rgba(255, 255, 255, 0.2)' : 'rgba(8, 131, 149, 0.08)',
            color: isActive ? '#FFFFFF' : '#0a4d68',
            transition: 'all 0.3s ease',
        }}>
            {icon}
        </Box>
        <Typography
            sx={{
                fontSize: '0.9rem',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? '#FFFFFF' : '#334155',
                letterSpacing: '-0.01em',
                transition: 'all 0.3s ease',
            }}
        >
            {label}
        </Typography>
        {isActive && (
            <Box
                sx={{
                    position: 'absolute',
                    right: 12,
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    backgroundColor: '#FFFFFF',
                    boxShadow: '0 0 8px rgba(255, 255, 255, 0.8)',
                }}
            />
        )}
    </Box>
);

interface SidebarProps {
    onNavigate?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onNavigate }) => {
    const location = useLocation();
    const navigate = useNavigate();

    const navItems = [
        { icon: <DashboardOutlinedIcon sx={{ fontSize: 20 }} />, label: 'Dashboard', path: '/dashboard' },
        { icon: <DescriptionOutlinedIcon sx={{ fontSize: 20 }} />, label: 'Hazard Reports', path: '/reports' },
        { icon: <MapOutlinedIcon sx={{ fontSize: 20 }} />, label: 'Live Map', path: '/map' },
    ];

    const isActive = (path: string) => {
        if (path === '/reports') return location.pathname.startsWith('/reports');
        if (path === '/map') return location.pathname.startsWith('/map');
        return location.pathname.startsWith(path);
    };

    const handleNavClick = (path: string) => {
        navigate(path);
        if (onNavigate) onNavigate();
    };

    return (
        <Box
            component="nav"
            sx={{
                width: DRAWER_WIDTH,
                flexShrink: 0,
                height: '100vh',
                background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 50%, #f1f5f9 100%)',
                display: 'flex',
                flexDirection: 'column',
                borderRight: '1px solid rgba(8, 131, 149, 0.1)',
                boxShadow: '4px 0 20px rgba(0, 0, 0, 0.03)',
                zIndex: 1200,
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: OCEAN_GRADIENT,
                },
            }}
        >
            {/* Logo Section - Matching Login Page */}
            <Box
                sx={{
                    p: 3,
                    pb: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 1.5,
                }}
            >
                {/* Logo Icon Container */}
                <Box
                    sx={{
                        width: 64,
                        height: 64,
                        borderRadius: '18px',
                        background: OCEAN_GRADIENT,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 8px 25px rgba(8, 131, 149, 0.35)',
                        animation: `${waveMotion} 4s ease-in-out infinite`,
                        position: 'relative',
                        overflow: 'hidden',
                        '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: '-50%',
                            left: '-50%',
                            width: '200%',
                            height: '200%',
                            background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)',
                            animation: `${waveMotion} 3s ease-in-out infinite reverse`,
                        },
                    }}
                >
                    <WavesIcon sx={{
                        color: '#FFFFFF',
                        fontSize: 36,
                        filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))',
                    }} />
                </Box>

                {/* Brand Name */}
                <Box sx={{ textAlign: 'center' }}>
                    <Typography
                        sx={{
                            fontSize: '1.25rem',
                            fontWeight: 800,
                            background: OCEAN_GRADIENT,
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            letterSpacing: '-0.03em',
                            lineHeight: 1.2,
                        }}
                    >
                        Coastal Safety
                    </Typography>
                    <Typography
                        sx={{
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            color: '#64748b',
                            letterSpacing: '0.05em',
                            textTransform: 'uppercase',
                            mt: 0.25,
                        }}
                    >
                        Admin Portal
                    </Typography>
                </Box>
            </Box>

            <Divider sx={{
                mx: 3,
                mb: 2,
                borderColor: 'rgba(8, 131, 149, 0.12)',
            }} />

            {/* Navigation Section */}
            <Box
                sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                    py: 1,
                }}
            >
                <Typography
                    sx={{
                        px: 4,
                        py: 1,
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        color: '#94a3b8',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                    }}
                >
                    Navigation
                </Typography>
                {navItems.map((item) => (
                    <NavItem
                        key={item.path}
                        icon={item.icon}
                        label={item.label}
                        path={item.path}
                        isActive={isActive(item.path)}
                        onClick={() => handleNavClick(item.path)}
                    />
                ))}
            </Box>

            {/* Footer Section */}
            <Box
                sx={{
                    p: 3,
                    pt: 2,
                    borderTop: '1px solid rgba(8, 131, 149, 0.08)',
                    background: 'linear-gradient(180deg, transparent 0%, rgba(8, 131, 149, 0.03) 100%)',
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        p: 1.5,
                        borderRadius: '12px',
                        background: 'rgba(8, 131, 149, 0.06)',
                        border: '1px solid rgba(8, 131, 149, 0.1)',
                    }}
                >
                    <Box
                        sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: '#10b981',
                            boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)',
                        }}
                    />
                    <Typography
                        sx={{
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            color: '#64748b',
                        }}
                    >
                        System Online
                    </Typography>
                </Box>
                <Typography
                    sx={{
                        mt: 2,
                        fontSize: '0.65rem',
                        color: '#94a3b8',
                        textAlign: 'center',
                    }}
                >
                    © 2026 Coastal Safety System
                </Typography>
            </Box>
        </Box>
    );
};
