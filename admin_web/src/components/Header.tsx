import React from 'react';
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
            <Box>
                {/* Breadcrumbs */}
                <Breadcrumbs
                    separator={<NavigateNextIcon sx={{ fontSize: 16, color: '#94A3B8' }} />}
                    sx={{ mb: 1 }}
                >
                    <Link
                        underline="hover"
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            color: '#64748B',
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
                        fontSize: '1.75rem',
                        letterSpacing: '-0.02em',
                    }}
                >
                    {title}
                </Typography>
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
