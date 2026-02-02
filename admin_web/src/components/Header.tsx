import React from 'react';
import { Box, Breadcrumbs, Link, Typography, IconButton, Badge } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import { UserProfile } from './UserProfile';
import { Box, Breadcrumbs, Link, Typography, IconButton } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';

interface HeaderProps {
    title: string;
    category: string;
}

export const Header: React.FC<HeaderProps> = ({ title, category }) => {
    return (
        <Box
            sx={{
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 4,
                pb: 3,
                borderBottom: '1px solid #E2E8F0'
            }}
        >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                {/* Breadcrumbs */}
                    separator={<NavigateNextIcon sx={{ fontSize: 16, color: '#94A3B8' }} />}
                    sx={{ mb: 1.5 }}
                    sx={{ mb: 1 }}
                >
                    <Link
                        underline="hover"
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            color: '#64748B',
                            fontSize: '0.875rem',
                            cursor: 'pointer',
                            '&:hover': { color: '#1976d2' },
                        }}
                        href="/dashboard"
                    >
                        <HomeIcon sx={{ fontSize: 18 }} />
                        Home
                    </Link>
                    <Typography sx={{ fontSize: '0.875rem', color: '#1976d2', fontWeight: 600 }}>
                            fontSize: '0.8125rem',
                            '&:hover': { color: '#0F172A' },
                        }}
                        href="/"
                    >
                        <HomeIcon sx={{ fontSize: 16 }} />
                        Home
                    </Link>
                    <Typography sx={{ fontSize: '0.8125rem', color: '#0F172A', fontWeight: 500 }}>
                        {category}
                    </Typography>
                </Breadcrumbs>

                {/* Page Title */}
                <Typography
                    variant="h4"
                    sx={{
                        fontWeight: 700,
                        color: '#0F172A',
                        fontSize: '1.875rem',
                        fontSize: '1.75rem',
                        letterSpacing: '-0.02em',
                    }}
                >
                    {title}
                </Typography>
            </Box>

            {/* Right Section: Notifications & User Profile */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {/* Notification Icon */}
                <IconButton
                    sx={{
                        color: '#64748B',
                        backgroundColor: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        '&:hover': {
                            backgroundColor: '#F1F5F9',
                            borderColor: '#CBD5E1'
                        },
                    }}
                >
                    <Badge badgeContent={0} color="error">
                        <NotificationsNoneOutlinedIcon sx={{ fontSize: 22 }} />
                    </Badge>
                </IconButton>

                {/* User Profile */}
                <UserProfile />
            </Box>
            {/* Notification Icon */}
            <IconButton
                sx={{
                    color: '#64748B',
                    '&:hover': { backgroundColor: '#F1F5F9' },
                }}
            >
                <NotificationsNoneOutlinedIcon />
            </IconButton>
        </Box>
    );
};
