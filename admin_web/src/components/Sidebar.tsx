import React, { useState } from 'react';
import { Box, Divider, Typography, Avatar, Tooltip } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { useLocation, useNavigate } from 'react-router-dom';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import MapOutlinedIcon from '@mui/icons-material/MapOutlined';
import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined';
import HubOutlinedIcon from '@mui/icons-material/HubOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded';
import { IconButton } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { useThemeContext } from '../contexts/ThemeContext';

export const DRAWER_WIDTH = 260;

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, isActive, onClick }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: 1.5,
        py: 1,
        mx: 1.5,
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        backgroundColor: isActive
          ? isDark
            ? alpha(theme.palette.primary.main, 0.15)
            : alpha(theme.palette.primary.main, 0.1)
          : 'transparent',
        '&:hover': {
          backgroundColor: isActive
            ? isDark
              ? alpha(theme.palette.primary.main, 0.18)
              : alpha(theme.palette.primary.main, 0.12)
            : isDark
            ? alpha(theme.palette.grey[700], 0.4)
            : theme.palette.grey[100],
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          color: isActive ? 'primary.main' : 'text.secondary',
          transition: 'color 0.15s ease',
        }}
      >
        {icon}
      </Box>
      <Typography
        sx={{
          fontSize: '0.875rem',
          fontWeight: isActive ? 600 : 500,
          color: isActive ? 'primary.main' : 'text.primary',
          letterSpacing: '-0.01em',
        }}
      >
        {label}
      </Typography>
    </Box>
  );
};

interface SidebarProps {
  onNavigate?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onNavigate }) => {
  const theme = useTheme();
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
        backgroundColor: 'background.paper',
        display: 'flex',
        flexDirection: 'column',
        borderRight: `1px solid ${theme.palette.divider}`,
        zIndex: 1200,
      }}
    >
      {/* Header with Logo and Theme Toggle */}
      <Box
        sx={{
          p: 2.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.3)}`,
            }}
          >
            <Typography sx={{ color: '#FFFFFF', fontWeight: 700, fontSize: '0.9375rem' }}>C</Typography>
          </Box>
          <Box>
            <Typography
              sx={{
                fontSize: '1rem',
                fontWeight: 700,
                color: 'text.primary',
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
              }}
            >
              CoastSafe
            </Typography>
            <Typography
              sx={{
                fontSize: '0.625rem',
                fontWeight: 500,
                color: 'text.secondary',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              Admin
            </Typography>
          </Box>
        </Box>

        <Tooltip title={isDark ? 'Light mode' : 'Dark mode'} placement="right">
          <IconButton
            onClick={(e) => toggleColorMode(e)}
            size="small"
            sx={{
              width: 32,
              height: 32,
              color: 'text.secondary',
              backgroundColor: isDark
                ? alpha(theme.palette.grey[800], 0.6)
                : theme.palette.grey[100],
              '&:hover': {
                backgroundColor: isDark
                  ? alpha(theme.palette.grey[700], 0.8)
                  : theme.palette.grey[200],
              },
            }}
          >
            {isDark ? (
              <LightModeRoundedIcon sx={{ fontSize: 18 }} />
            ) : (
              <DarkModeRoundedIcon sx={{ fontSize: 18 }} />
            )}
          </IconButton>
        </Tooltip>
      </Box>

      {/* Navigation */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.25, py: 2, overflowY: 'auto' }}>
        <Typography
          sx={{
            px: 3,
            mb: 1,
            fontSize: '0.6875rem',
            fontWeight: 600,
            color: 'text.secondary',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}
        >
          Navigation
        </Typography>
        {navItems.map((item) => (
          <NavItem
            key={item.path}
            icon={item.icon}
            label={item.label}
            isActive={isActive(item.path)}
            onClick={() => handleNavClick(item.path)}
          />
        ))}
      </Box>

      {/* User Profile & Logout */}
      {isAuthenticated && user && (
        <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
          <Box
            onClick={handleLogout}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              p: 1.5,
              borderRadius: '10px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              backgroundColor: isDark
                ? alpha(theme.palette.grey[800], 0.4)
                : theme.palette.grey[50],
              '&:hover': {
                backgroundColor: alpha(theme.palette.error.main, 0.08),
                '& .logout-icon': { opacity: 1, color: theme.palette.error.main },
              },
            }}
          >
            <Avatar
              sx={{
                width: 34,
                height: 34,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                color: '#fff',
                fontSize: '0.8125rem',
                fontWeight: 600,
              }}
            >
              {user.name?.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography
                sx={{
                  fontWeight: 600,
                  color: 'text.primary',
                  fontSize: '0.8125rem',
                  lineHeight: 1.3,
                }}
                noWrap
              >
                {user.name}
              </Typography>
              <Typography
                sx={{
                  color: 'text.secondary',
                  fontSize: '0.6875rem',
                }}
                noWrap
              >
                {loggingOut ? 'Signing out...' : 'Click to sign out'}
              </Typography>
            </Box>
            <LogoutIcon
              className="logout-icon"
              sx={{
                fontSize: 18,
                color: 'text.secondary',
                opacity: 0.5,
                transition: 'all 0.15s ease',
              }}
            />
          </Box>
        </Box>
      )}
    </Box>
  );
};
