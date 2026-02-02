import React from 'react';
import { Box } from '@mui/material';
import { Header } from '../components/Header';
import LeafletMapWithDraw from '../components/LeafletMapWithDraw';

/**
 * MapView Page
 * Dedicated page for monitoring zone visualization and management
 */
export const MapView: React.FC = () => {
    return (
        <Box>
            <Header title="Zone Map View" category="Monitoring Zones Management" />

            <Box sx={{ width: '100%', mt: 2 }}>
                <LeafletMapWithDraw
                    height="calc(100vh - 200px)"
                    zoom={6}
                    center={[13.08, 80.27]}
                />
            </Box>
        </Box>
    );
};

export default MapView;
