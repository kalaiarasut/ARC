import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Divider,
  InputAdornment,
  Alert,
  Chip,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  Place as PlaceIcon,
  Edit as EditIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { landmarkService } from '../services/landmarkService';
import type { Landmark } from '../types/landmark';

interface LandmarkManagerProps {
  open: boolean;
  onClose: () => void;
  onLandmarkAdded?: () => void;
}

export function LandmarkManager({ open, onClose, onLandmarkAdded }: LandmarkManagerProps) {
  const [landmarks, setLandmarks] = useState<Landmark[]>(landmarkService.getLandmarks());
  const [name, setName] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [radius, setRadius] = useState('5000');
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleAddOrUpdateLandmark = () => {
    setError('');
    
    if (!name.trim()) {
      setError('Landmark name is required');
      return;
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    const rad = parseFloat(radius);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      setError('Latitude must be between -90 and 90');
      return;
    }

    if (isNaN(lon) || lon < -180 || lon > 180) {
      setError('Longitude must be between -180 and 180');
      return;
    }

    if (isNaN(rad) || rad <= 0) {
      setError('Radius must be a positive number');
      return;
    }

    if (editingId) {
      // Update existing landmark
      const updated = landmarkService.updateLandmark(editingId, {
        name: name.trim(),
        latitude: lat,
        longitude: lon,
        radius: rad,
      });
      
      if (updated) {
        setLandmarks(landmarks.map(l => l.id === editingId ? updated : l));
        setEditingId(null);
      }
    } else {
      // Add new landmark
      const newLandmark = landmarkService.addLandmark({
        name: name.trim(),
        latitude: lat,
        longitude: lon,
        radius: rad,
      });
      setLandmarks([...landmarks, newLandmark]);
    }

    setName('');
    setLatitude('');
    setLongitude('');
    setRadius('5000');
    
    if (onLandmarkAdded) {
      onLandmarkAdded();
    }
  };

  const handleEditLandmark = (landmark: Landmark) => {
    setEditingId(landmark.id);
    setName(landmark.name);
    setLatitude(landmark.latitude.toString());
    setLongitude(landmark.longitude.toString());
    setRadius((landmark.radius || 5000).toString());
    setError('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setName('');
    setLatitude('');
    setLongitude('');
    setRadius('5000');
    setError('');
  };

  const handleDeleteLandmark = (id: string) => {
    landmarkService.deleteLandmark(id);
    setLandmarks(landmarks.filter(l => l.id !== id));
    if (editingId === id) {
      handleCancelEdit();
    }
    if (onLandmarkAdded) {
      onLandmarkAdded();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <PlaceIcon color="primary" />
          <Typography variant="h6" fontWeight={700}>
            Manage Landmarks
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        {/* Add/Edit Landmark Form */}
        <Box mb={3}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="subtitle2" fontWeight={600}>
              {editingId ? 'Edit Landmark' : 'Add New Landmark'}
            </Typography>
            {editingId && (
              <Chip 
                label="Editing" 
                color="primary" 
                size="small" 
                onDelete={handleCancelEdit}
              />
            )}
          </Box>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          <Box display="flex" flexDirection="column" gap={2} mt={2}>
            <TextField
              label="Landmark Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Marina Beach, Chennai Port"
              fullWidth
              size="small"
            />
            
            <Box display="flex" gap={2}>
              <TextField
                label="Latitude"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="e.g., 13.0827"
                type="number"
                inputProps={{ step: 'any' }}
                fullWidth
                size="small"
                InputProps={{
                  endAdornment: <InputAdornment position="end">°N</InputAdornment>,
                }}
              />
              <TextField
                label="Longitude"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="e.g., 80.2707"
                type="number"
                inputProps={{ step: 'any' }}
                fullWidth
                size="small"
                InputProps={{
                  endAdornment: <InputAdornment position="end">°E</InputAdornment>,
                }}
              />
            </Box>

            <TextField
              label="Search Radius"
              value={radius}
              onChange={(e) => setRadius(e.target.value)}
              type="number"
              inputProps={{ min: 100, step: 100 }}
              fullWidth
              size="small"
              helperText="Radius in meters to search for reports near this landmark"
              InputProps={{
                endAdornment: <InputAdornment position="end">meters</InputAdornment>,
              }}
            />

            <Box display="flex" gap={1}>
              <Button
                variant="contained"
                startIcon={editingId ? <SaveIcon /> : <AddIcon />}
                onClick={handleAddOrUpdateLandmark}
                fullWidth
                color={editingId ? 'success' : 'primary'}
              >
                {editingId ? 'Update Landmark' : 'Add Landmark'}
              </Button>
              {editingId && (
                <Button
                  variant="outlined"
                  onClick={handleCancelEdit}
                  sx={{ minWidth: '100px' }}
                >
                  Cancel
                </Button>
              )}
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Existing Landmarks List */}
        <Box>
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            Saved Landmarks ({landmarks.length})
          </Typography>
          
          {landmarks.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Typography variant="body2" color="text.secondary">
                No landmarks added yet. Create your first landmark above.
              </Typography>
            </Box>
          ) : (
            <List>
              {landmarks.map((landmark) => (
                <ListItem
                  key={landmark.id}
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    mb: 1,
                    bgcolor: 'background.paper',
                  }}
                >
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <PlaceIcon fontSize="small" color="primary" />
                        <Typography variant="body1" fontWeight={600}>
                          {landmark.name}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box mt={1}>
                        <Typography variant="caption" display="block" color="text.secondary">
                          📍 {landmark.latitude.toFixed(6)}°N, {landmark.longitude.toFixed(6)}°E
                        </Typography>
                        <Box display="flex" gap={1} mt={0.5}>
                          <Chip
                            label={`Radius: ${(landmark.radius || 5000).toLocaleString()}m`}
                            size="small"
                            variant="outlined"
                          />
                          <Chip
                            label={new Date(landmark.createdAt).toLocaleDateString()}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Box display="flex" gap={1}>
                      <IconButton
                        edge="end"
                        aria-label="edit"
                        size="small"
                        onClick={() => handleEditLandmark(landmark)}
                        sx={{
                          color: 'primary.main',
                          '&:hover': { bgcolor: 'primary.light', color: 'primary.contrastText' }
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        size="small"
                        color="error"
                        onClick={() => handleDeleteLandmark(landmark.id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
