import React from 'react';
import { Box, Typography } from '@mui/material';

interface HeaderProps {
    title: string;
    category: string;
}

export const Header: React.FC<HeaderProps> = ({ title }) => {
    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 0,
                pb: 1,
                borderBottom: '1px solid #E2E8F0'
            }}
        >
            <Box>
                {/* Page Title */}
                <Typography
                    variant="h4"
                    sx={{
                        fontWeight: 700,
                        color: '#0F172A',
                        fontSize: '1.75rem', // Slightly smaller
                        letterSpacing: '-0.02em',
                    }}
                >
                    {title}
                </Typography>
            </Box>

            {/* Right Section Removed */}_
        </Box>
    );
};
