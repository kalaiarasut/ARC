import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  
  Typography,
  Button,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  
  ToggleOn as ToggleOnIcon,
  ToggleOff as ToggleOffIcon,
} from '@mui/icons-material';
import type { Zone, ZoneStatus } from '../types/zone';
import { formatZoneShape, generateZoneColor } from '../utils/zoneHelpers';

interface ZoneManagerProps {
  zones: Zone[];
  onCreateZone?: (zone: Omit<Zone, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onDeleteZone?: (zoneId: string) => void;
  onToggleZone?: (zoneId: string, status: ZoneStatus) => void;
  onEditZone?: (zone: Zone) => void;
}

const ZoneManager: React.FC<ZoneManagerProps> = ({
  zones,
  onCreateZone,
  onDeleteZone,
  onToggleZone,
  
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [zoneToDelete, setZoneToDelete] = useState<string | null>(null);
  const [newZone, setNewZone] = useState<Omit<Zone, 'id' | 'createdAt' | 'updatedAt'>>({
    name: '',
    description: '',
    shape: 'rectangle',
    coordinates: [],
    status: 'inactive',
    color: generateZoneColor(),
  });

  const handleCreateZone = () => {
    if (newZone.name.trim() && onCreateZone) {
      onCreateZone(newZone);
      setNewZone({
        name: '',
        description: '',
        shape: 'rectangle',
        coordinates: [],
        status: 'inactive',
        color: generateZoneColor(),
      });
      setDialogOpen(false);
    }
  };

  const handleDeleteZone = (zoneId: string) => {
    setZoneToDelete(zoneId);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (zoneToDelete && onDeleteZone) {
      onDeleteZone(zoneToDelete);
      setDeleteConfirmOpen(false);
      setZoneToDelete(null);
    }
  };

  const handleToggleStatus = (zoneId: string, currentStatus: ZoneStatus) => {
    if (onToggleZone) {
      const newStatus: ZoneStatus = currentStatus === 'active' ? 'inactive' : 'active';
      onToggleZone(zoneId, newStatus);
    }
  };

  const getStatusColor = (status: ZoneStatus) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'default';
      case 'paused':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: ZoneStatus) => {
    switch (status) {
      case 'active':
        return '✅ ACTIVE';
      case 'inactive':
        return '❌ INACTIVE';
      case 'paused':
        return '⏸️ PAUSED';
      default:
        return status;
    }
  };

  const totalReports = zones.reduce((sum, zone) => sum + (zone.reportsCount || 0), 0);
  const activeZones = zones.filter((z) => z.status === 'active').length;

  return (
    <Box>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            📍 Monitoring Zones
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setDialogOpen(true)}
            sx={{ backgroundColor: '#0F172A' }}
          >
            New Zone
          </Button>
        </Box>

        {/* Statistics Cards */}
        <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
          <Card sx={{ flex: 1, backgroundColor: '#F0F9FF', border: '1px solid #BAE6FD' }}>
            <CardContent sx={{ pb: 1 }}>
              <Typography color="textSecondary" variant="body2">
                Total Zones
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#0F172A' }}>
                {zones.length}
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ flex: 1, backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0' }}>
            <CardContent sx={{ pb: 1 }}>
              <Typography color="textSecondary" variant="body2">
                Active Zones
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#15803D' }}>
                {activeZones}
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ flex: 1, backgroundColor: '#FEF3C7', border: '1px solid #FCD34D' }}>
            <CardContent sx={{ pb: 1 }}>
              <Typography color="textSecondary" variant="body2">
                Total Reports
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#92400E' }}>
                {totalReports}
              </Typography>
            </CardContent>
          </Card>
        </Stack>
      </Box>

      {/* Zones Table */}
      <TableContainer
        component={Card}
        sx={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
        }}
      >
        <Table>
          <TableHead sx={{ backgroundColor: '#F8FAFC' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, color: '#475569', borderBottom: '1px solid #E2E8F0' }}>
                Zone Name
              </TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#475569', borderBottom: '1px solid #E2E8F0' }}>
                Shape
              </TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#475569', borderBottom: '1px solid #E2E8F0' }}>
                Status
              </TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#475569', borderBottom: '1px solid #E2E8F0' }}>
                Reports
              </TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#475569', borderBottom: '1px solid #E2E8F0' }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {zones.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4, color: '#94A3B8' }}>
                  No zones created yet. Click "New Zone" to get started.
                </TableCell>
              </TableRow>
            ) : (
              zones.map((zone) => (
                <TableRow key={zone.id} sx={{ '&:hover': { backgroundColor: '#F8FAFC' } }}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: zone.color,
                        }}
                      />
                      <Box>
                        <Typography sx={{ fontWeight: 600, color: '#0F172A' }}>
                          {zone.name}
                        </Typography>
                        {zone.description && (
                          <Typography variant="body2" sx={{ color: '#64748B' }}>
                            {zone.description.substring(0, 40)}...
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>{formatZoneShape(zone.shape)}</TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusLabel(zone.status)}
                      color={getStatusColor(zone.status)}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{zone.reportsCount || 0}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton
                        size="small"
                        title="Toggle Status"
                        onClick={() => handleToggleStatus(zone.id, zone.status)}
                        sx={{ color: '#2563eb' }}
                      >
                        {zone.status === 'active' ? <ToggleOnIcon /> : <ToggleOffIcon />}
                      </IconButton>
                      <IconButton
                        size="small"
                        title="Delete"
                        onClick={() => handleDeleteZone(zone.id)}
                        sx={{ color: '#dc2626' }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create Zone Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: '#0F172A' }}>Create New Monitoring Zone</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={2}>
            <TextField
              fullWidth
              label="Zone Name"
              placeholder="e.g., Coastal Area, Downtown District"
              value={newZone.name}
              onChange={(e) => setNewZone({ ...newZone, name: e.target.value })}
              size="small"
            />
            <TextField
              fullWidth
              label="Description (Optional)"
              placeholder="e.g., High-risk coastal flood zone"
              value={newZone.description}
              onChange={(e) => setNewZone({ ...newZone, description: e.target.value })}
              multiline
              rows={2}
              size="small"
            />
            <FormControl fullWidth size="small">
              <InputLabel>Shape Type</InputLabel>
              <Select
                value={newZone.shape}
                onChange={(e) => setNewZone({ ...newZone, shape: e.target.value as 'rectangle' | 'polygon' })}
                label="Shape Type"
              >
                <MenuItem value="rectangle">📦 Rectangle</MenuItem>
                <MenuItem value="polygon">🔶 Polygon (Free-draw)</MenuItem>
              </Select>
            </FormControl>
            <Alert severity="info">
              After creating the zone, you'll be able to draw it on the map by clicking "Draw Zone" button.
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateZone}
            variant="contained"
            disabled={!newZone.name.trim()}
            sx={{ backgroundColor: '#0F172A' }}
          >
            Create Zone
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle sx={{ fontWeight: 700, color: '#0F172A' }}>Delete Zone</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography>Are you sure you want to delete this zone? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button
            onClick={confirmDelete}
            variant="contained"
            sx={{ backgroundColor: '#dc2626' }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ZoneManager;
