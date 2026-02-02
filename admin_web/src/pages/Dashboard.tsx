import React from 'react';
import { Box, Typography } from '@mui/material';
import { Header } from '../components/Header';

export const Dashboard: React.FC = () => {
    return (
        <Box>
            <Header title="Dashboard" category="Overview" />
            <Box sx={{ mt: 4, p: 4, bgcolor: 'white', borderRadius: '20px', textAlign: 'center' }}>
                <Typography variant="h5" color="textSecondary">
                    Welcome to the Civil Alert Authority Platform
                </Typography>
                <Typography variant="body1" sx={{ mt: 2 }}>
                    Select "Data Barang" (Hazard Reports) from the sidebar to view the main UI.
                </Typography>
            </Box>
        </Box>
    );
};
