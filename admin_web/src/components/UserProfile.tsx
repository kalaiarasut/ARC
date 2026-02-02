import React, { useState } from 'react';
import {
    Box,
    Avatar,
    Typography,
    IconButton,
    Menu,
    MenuItem,
    Divider,
    ListItemIcon,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import { useAuth } from '../contexts/AuthContext';

export const UserProfile: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = async () => {
        await logout();
        handleClose();
        navigate('/login');
    };

    if (!user) return null;

    // Generate avatar color based on name
    const getAvatarColor = (name: string) => {
        const colors = [
            '#088395', // Ocean blue
            '#05bfdb', // Aqua
            '#0a4d68', // Deep blue
            '#10B981', // Green
            '#3B82F6', // Blue
        ];
        const index = name.charCodeAt(0) % colors.length;
        return colors[index];
    };

    const avatarColor = getAvatarColor(user.name);
    const initials = user.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* User Info */}
            <Box
                sx={{
                    display: { xs: 'none', sm: 'block' },
                    textAlign: 'right',
                }}
            >
                <Typography
                    sx={{
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: '#0F172A',
                        lineHeight: 1.2,
                    }}
                >
                    {user.name}
                </Typography>
                <Typography
                    sx={{
                        fontSize: '0.75rem',
                        color: '#64748B',
                        lineHeight: 1.2,
                    }}
                >
                    {user.role || 'User'}
                </Typography>
            </Box>

            {/* Avatar Button */}
            <IconButton
                onClick={handleClick}
                sx={{
                    padding: 0,
                    '&:hover': {
                        transform: 'scale(1.05)',
                        transition: 'transform 0.2s ease',
                    },
                }}
            >
                <Avatar
                    sx={{
                        width: 40,
                        height: 40,
                        bgcolor: avatarColor,
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        border: '2px solid white',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                        },
                    }}
                >
                    {initials}
                </Avatar>
            </IconButton>

            {/* Dropdown Menu */}
            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                onClick={handleClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                PaperProps={{
                    elevation: 3,
                    sx: {
                        mt: 1.5,
                        minWidth: 200,
                        borderRadius: 2,
                        overflow: 'visible',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                        '&:before': {
                            content: '""',
                            display: 'block',
                            position: 'absolute',
                            top: 0,
                            right: 14,
                            width: 10,
                            height: 10,
                            bgcolor: 'background.paper',
                            transform: 'translateY(-50%) rotate(45deg)',
                            zIndex: 0,
                        },
                    },
                }}
            >
                {/* User Info in Menu */}
                <Box sx={{ px: 2, py: 1.5 }}>
                    <Typography
                        sx={{
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            color: '#0F172A',
                        }}
                    >
                        {user.name}
                    </Typography>
                    <Typography
                        sx={{
                            fontSize: '0.75rem',
                            color: '#64748B',
                            mt: 0.25,
                        }}
                    >
                        {user.email}
                    </Typography>
                </Box>

                <Divider />

                {/* Menu Items */}
                <MenuItem
                    sx={{
                        py: 1.5,
                        fontSize: '0.875rem',
                        '&:hover': {
                            backgroundColor: '#F8FAFC',
                        },
                    }}
                >
                    <ListItemIcon>
                        <PersonOutlineIcon fontSize="small" sx={{ color: '#64748B' }} />
                    </ListItemIcon>
                    My Profile
                </MenuItem>

                <MenuItem
                    sx={{
                        py: 1.5,
                        fontSize: '0.875rem',
                        '&:hover': {
                            backgroundColor: '#F8FAFC',
                        },
                    }}
                >
                    <ListItemIcon>
                        <SettingsOutlinedIcon fontSize="small" sx={{ color: '#64748B' }} />
                    </ListItemIcon>
                    Settings
                </MenuItem>

                <Divider />

                <MenuItem
                    onClick={handleLogout}
                    sx={{
                        py: 1.5,
                        fontSize: '0.875rem',
                        color: '#EF4444',
                        '&:hover': {
                            backgroundColor: '#FEF2F2',
                        },
                    }}
                >
                    <ListItemIcon>
                        <LogoutIcon fontSize="small" sx={{ color: '#EF4444' }} />
                    </ListItemIcon>
                    Logout
                </MenuItem>
            </Menu>
        </Box>
    );
};
