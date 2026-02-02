import React, { useState } from 'react';
import { Box, Tab, Tabs, Alert, AlertTitle } from '@mui/material';
import { Header } from '../components/Header';
import ZoneManager from '../components/ZoneManager';
import LeafletMapWithDraw from '../components/LeafletMapWithDraw';
import type { Zone, ZoneStatus } from '../types/zone';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div hidden={value !== index} style={{ width: '100%' }}>
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
};

export const Dashboard: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [zones, setZones] = useState<Zone[]>([]);

  const handleCreateZone = (newZone: Omit<Zone, 'id' | 'createdAt' | 'updatedAt'>) => {
    const zone: Zone = {
      ...newZone,
      id: `zone_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setZones([...zones, zone]);
  };

  const handleDeleteZone = (zoneId: string) => {
    setZones(zones.filter((z) => z.id !== zoneId));
  };

  const handleToggleZone = (zoneId: string, status: ZoneStatus) => {
    setZones(zones.map((z) => (z.id === zoneId ? { ...z, status, updatedAt: new Date().toISOString() } : z)));
  };

  return (
    <Box>
      <Header title="Real-Time Hazard Dashboard" category="Map-Based Alert System" />

      <Alert severity="success" sx={{ mb: 2 }}>
        <AlertTitle>✓ Geofenced Monitoring Zones Enabled</AlertTitle>
        Admin can draw circular monitoring zones on the map using Leaflet + OpenStreetMap. Reports are only accepted from users inside active zones.
      </Alert>

      {/* Tab Navigation */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          sx={{
            '& .MuiTab-root': {
              fontWeight: 500,
              textTransform: 'none',
              fontSize: '0.95rem',
            },
          }}
        >
          <Tab label="📍 Monitoring Zones" />
          <Tab label="🗺️ Map View" />
          <Tab label="📊 Statistics" />
          <Tab label="✓ Verification Queue" />
        </Tabs>
      </Box>

      {/* Tab Content */}

      {/* Zone Management Tab */}
      <TabPanel value={tabValue} index={0}>
        <ZoneManager
          zones={zones}
          onCreateZone={handleCreateZone}
          onDeleteZone={handleDeleteZone}
          onToggleZone={handleToggleZone}
        />
      </TabPanel>

      {/* Map View Tab - Google Maps with Circle Drawing */}
      <TabPanel value={tabValue} index={1}>
        <Box sx={{ width: '100%' }}>
          <LeafletMapWithDraw
            height="700px"
            zoom={6}
            center={[13.08, 80.27]}
          />
        </Box>
      </TabPanel>

      {/* Statistics Tab */}
      <TabPanel value={tabValue} index={2}>
        <Box sx={{ p: 4, textAlign: 'center', backgroundColor: '#f5f5f5', borderRadius: '12px' }}>
          📊 Statistics Dashboard (Coming Soon)
        </Box>
      </TabPanel>

      {/* Verification Queue Tab */}
      <TabPanel value={tabValue} index={3}>
        <Box sx={{ p: 4, textAlign: 'center', backgroundColor: '#f5f5f5', borderRadius: '12px' }}>
          ✓ Verification Queue (Coming Soon)
        </Box>
      </TabPanel>
    </Box>
  );
};

export default Dashboard;
