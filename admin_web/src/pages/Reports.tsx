import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  Chip,
  Button,
  Drawer,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Checkbox,
  ListItemText,
  Stack,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Badge,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  Image as ImageIcon,
  VideoLibrary as VideoIcon,
  Warning as WarningIcon,
  People as PeopleIcon,
  Place as PlaceIcon,
} from '@mui/icons-material';

import { landmarkService } from '../services/landmarkService';
import type { HazardReport, FilterOptions, HazardType, UrgencyLevel, ReportStatus } from '../types/hazard';
import type { Landmark } from '../types/landmark';
import { LandmarkManager } from '../components/LandmarkManager';
import { Header } from '../components/Header';
import { format } from 'date-fns';

const HAZARD_TYPES: HazardType[] = ['High Waves', 'Tsunami', 'Storm', 'Flood', 'Other'];
const URGENCY_LEVELS: UrgencyLevel[] = ['Low', 'Medium', 'High'];
const STATUSES: ReportStatus[] = ['pending', 'verified', 'resolved'];

const STATIC_REPORTS: HazardReport[] = [
  {
    id: '1',
    client_id: 'client_123',
    user_id: 'user_456',
    user_phone: '9876543210',
    user_name: 'John Citizen',
    hazard_type: 'High Waves',
    description: 'Observed dangerously high waves exceeding 3 meters near the fishing harbor. Several boats are at risk.',
    latitude: 13.0827,
    longitude: 80.2707, // Chennai
    is_high_risk: true,
    people_at_risk: 15,
    urgency_level: 'High',
    media_urls: [],
    upload_complete: true,
    status: 'pending',
    event_time: new Date().toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    client_id: 'client_124',
    user_id: 'user_457',
    user_phone: '9123456780',
    user_name: 'Sarah Connor',
    hazard_type: 'Flood',
    description: 'Main road blocked due to water logging from heavy rains. Traffic moving very slowly.',
    latitude: 12.9716,
    longitude: 77.5946, // Bangalore
    is_high_risk: false,
    people_at_risk: null,
    urgency_level: 'Medium',
    media_urls: [],
    upload_complete: true,
    status: 'verified',
    event_time: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: '3',
    client_id: 'client_125',
    user_id: 'user_458',
    user_phone: '8888888888',
    user_name: 'Mike Smith',
    hazard_type: 'Storm',
    description: 'Strong winds knocking down trees in the residential area. Power lines might be affected.',
    latitude: 19.0760,
    longitude: 72.8777, // Mumbai
    is_high_risk: true,
    people_at_risk: 5,
    urgency_level: 'High',
    media_urls: [],
    upload_complete: true,
    status: 'resolved',
    event_time: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: '4',
    client_id: 'client_126',
    user_id: 'user_459',
    user_phone: '7777777777',
    user_name: null,
    hazard_type: 'Other',
    description: 'Strange structural noise from the bridge.',
    latitude: 28.6139,
    longitude: 77.2090, // Delhi
    is_high_risk: false,
    people_at_risk: null,
    urgency_level: 'Low',
    media_urls: [],
    upload_complete: true,
    status: 'pending',
    event_time: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    created_at: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: '5',
    client_id: 'client_127',
    user_id: 'user_460',
    user_phone: '9988776655',
    user_name: 'Fisherman Joe',
    hazard_type: 'Tsunami',
    description: 'Receding water levels observed significantly. Potential tsunami warning signs.',
    latitude: 9.9252,
    longitude: 78.1198, // Madurai/Coastal ref (approx)
    is_high_risk: true,
    people_at_risk: 100,
    urgency_level: 'High',
    media_urls: [],
    upload_complete: true,
    status: 'verified',
    event_time: new Date().toISOString(),
    created_at: new Date().toISOString(),
  }
];

export function Reports() {
  const [reports, setReports] = useState<HazardReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<HazardReport | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [landmarkManagerOpen, setLandmarkManagerOpen] = useState(false);
  const [landmarks, setLandmarks] = useState<Landmark[]>(landmarkService.getLandmarks());

  const [filters, setFilters] = useState<Partial<FilterOptions>>({
    hazardTypes: [],
    statuses: [],
    urgencyLevels: [],
    isHighRisk: null,
    hasMedia: null,
    dateFrom: null,
    dateTo: null,
    searchQuery: '',
    landmarkId: null,
    landmarkRadius: 5000,
  });

  const loadReports = async () => {
    try {
      setLoading(true);
      setError(null);

      // STATIC DATA MOCK
      console.log('Loading static reports...');

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));

      const data = STATIC_REPORTS;

      // Apply landmark filtering if selected (Logic preserved from original)
      let filteredData = data;
      if (filters.landmarkId) {
        const landmark = landmarks.find(l => l.id === filters.landmarkId);
        if (landmark) {
          const radius = filters.landmarkRadius || landmark.radius || 5000;
          filteredData = data.filter(report =>
            landmarkService.isWithinLandmark(
              report.latitude,
              report.longitude,
              landmark,
              radius
            )
          );
        }
      }
      // Simple client-side search filter implementation for static data
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        filteredData = filteredData.filter(r =>
          r.description.toLowerCase().includes(query) ||
          r.user_name?.toLowerCase().includes(query) ||
          r.hazard_type.toLowerCase().includes(query)
        );
      }

      // Filter by Hazard Type
      if (filters.hazardTypes && filters.hazardTypes.length > 0) {
        filteredData = filteredData.filter(r => filters.hazardTypes!.includes(r.hazard_type));
      }

      // Filter by Status
      if (filters.statuses && filters.statuses.length > 0) {
        filteredData = filteredData.filter(r => filters.statuses!.includes(r.status));
      }

      // Filter by Urgency
      if (filters.urgencyLevels && filters.urgencyLevels.length > 0) {
        filteredData = filteredData.filter(r => r.urgency_level && filters.urgencyLevels!.includes(r.urgency_level));
      }

      // Filter by Risk
      if (filters.isHighRisk !== null && filters.isHighRisk !== undefined) {
        filteredData = filteredData.filter(r => r.is_high_risk === filters.isHighRisk);
      }

      // Filter by Media
      if (filters.hasMedia !== null && filters.hasMedia !== undefined) {
        if (filters.hasMedia) {
          filteredData = filteredData.filter(r => r.media_urls && r.media_urls.length > 0);
        } else {
          filteredData = filteredData.filter(r => !r.media_urls || r.media_urls.length === 0);
        }
      }

      setReports(filteredData);
    } catch (err) {
      setError('Failed to load reports.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage]); // Removed filters from dep array to match original behavior where explicit search/filter button is needed, or add if auto-filtering is desired. Original only had page/rows.

  // Real-time subscription disabled for static mode
  /*
  useEffect(() => {
    const channel = hazardService.subscribeToReports((newReport) => {
      setAllReports(prev => [newReport, ...prev]);
    });

    return () => {
      channel.unsubscribe();
    };
  }, []);
  */

  const handleApplyFilters = () => {
    setPage(0);
    loadReports();
    setFilterDrawerOpen(false);
  };

  const handleResetFilters = () => {
    setFilters({
      hazardTypes: [],
      statuses: [],
      urgencyLevels: [],
      isHighRisk: null,
      hasMedia: null,
      dateFrom: null,
      dateTo: null,
      searchQuery: '',
      landmarkId: null,
      landmarkRadius: 5000,
    });
  };

  const handleLandmarkUpdate = () => {
    setLandmarks(landmarkService.getLandmarks());
  };

  const handleRowClick = (report: HazardReport) => {
    setSelectedReport(report);
    setDetailDialogOpen(true);
  };



  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.hazardTypes && filters.hazardTypes.length > 0) count++;
    if (filters.statuses && filters.statuses.length > 0) count++;
    if (filters.urgencyLevels && filters.urgencyLevels.length > 0) count++;
    if (filters.isHighRisk !== null) count++;
    if (filters.hasMedia !== null) count++;
    if (filters.dateFrom) count++;
    if (filters.dateTo) count++;
    if (filters.searchQuery) count++;
    if (filters.landmarkId) count++;
    return count;
  };

  const getHazardColor = (type: HazardType) => {
    const colors = {
      'Tsunami': 'error',
      'High Waves': 'warning',
      'Storm': 'info',
      'Flood': 'primary',
      'Other': 'default',
    };
    return colors[type] as any;
  };

  const getUrgencyColor = (level: UrgencyLevel | null) => {
    if (!level) return 'default';
    const colors = {
      'High': 'error',
      'Medium': 'warning',
      'Low': 'success',
    };
    return colors[level] as any;
  };

  const getStatusColor = (status: ReportStatus) => {
    const colors = {
      'pending': 'default',
      'verified': 'info',
      'resolved': 'success',
    };
    return colors[status] as any;
  };

  return (
    <Box>
      <Header title="Hazard Reports" category="Reports" />
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Action Buttons */}
        <Box display="flex" justifyContent="flex-end" mb={3}>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<PlaceIcon />}
              onClick={() => setLandmarkManagerOpen(true)}
            >
              Manage Landmarks
            </Button>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadReports}
              disabled={loading}
            >
              Refresh
            </Button>
          </Stack>
        </Box>

        {/* Search and Filter Bar */}
        <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
          {/* Active Landmark Filter Badge */}
          {filters.landmarkId && (
            <Box mb={2}>
              <Chip
                icon={<PlaceIcon />}
                label={`Filtering by: ${landmarks.find(l => l.id === filters.landmarkId)?.name} (${(filters.landmarkRadius || 5000).toLocaleString()}m radius)`}
                onDelete={() => setFilters({ ...filters, landmarkId: null })}
                color="primary"
                variant="outlined"
              />
            </Box>
          )}

          <Grid container spacing={2} alignItems="center">
            <Grid xs={12} md={8}>
              <TextField
                fullWidth
                placeholder="Search by description, location, or user name..."
                value={filters.searchQuery}
                onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                onKeyPress={(e) => e.key === 'Enter' && handleApplyFilters()}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: filters.searchQuery && (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setFilters({ ...filters, searchQuery: '' })}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid xs={12} md={4}>
              <Stack direction="row" spacing={2}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<SearchIcon />}
                  onClick={handleApplyFilters}
                  disabled={loading}
                >
                  Search
                </Button>
                <Badge badgeContent={getActiveFilterCount()} color="primary">
                  <Button
                    variant="outlined"
                    startIcon={<FilterIcon />}
                    onClick={() => setFilterDrawerOpen(true)}
                  >
                    Filters
                  </Button>
                </Badge>
              </Stack>
            </Grid>
          </Grid>
        </Paper>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Data Table */}
        <Paper elevation={3}>
          <TableContainer sx={{ maxHeight: 'calc(100vh - 400px)' }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, bgcolor: 'grey.50' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: 'grey.50' }}>Hazard Type</TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: 'grey.50' }}>Description</TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: 'grey.50' }}>Location</TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: 'grey.50' }}>Risk Level</TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: 'grey.50' }}>Urgency</TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: 'grey.50' }}>People at Risk</TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: 'grey.50' }}>Media</TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: 'grey.50' }}>Date & Time</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 8 }}>
                      <CircularProgress />
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                        Loading reports...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : reports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 8 }}>
                      <Typography variant="body1" color="text.secondary">
                        No reports found matching your criteria
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  reports.map((report) => (
                    <TableRow
                      key={report.id}
                      hover
                      onClick={() => handleRowClick(report)}
                      sx={{
                        cursor: 'pointer',
                        bgcolor: report.is_high_risk ? 'error.50' : 'inherit',
                        '&:hover': { bgcolor: report.is_high_risk ? 'error.100' : 'action.hover' },
                      }}
                    >
                      <TableCell>
                        <Chip
                          label={report.status.toUpperCase()}
                          color={getStatusColor(report.status)}
                          size="small"
                          sx={{ fontWeight: 600, minWidth: 85 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={report.hazard_type}
                          color={getHazardColor(report.hazard_type)}
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell sx={{ maxWidth: 300 }}>
                        <Typography variant="body2" noWrap>
                          {report.description}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" display="block">
                          {report.latitude.toFixed(4)}°N
                        </Typography>
                        <Typography variant="caption" display="block" color="text.secondary">
                          {report.longitude.toFixed(4)}°E
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {report.is_high_risk ? (
                          <Chip
                            icon={<WarningIcon />}
                            label="HIGH RISK"
                            color="error"
                            size="small"
                            sx={{ fontWeight: 700 }}
                          />
                        ) : (
                          <Chip label="Normal" size="small" variant="outlined" />
                        )}
                      </TableCell>
                      <TableCell>
                        {report.urgency_level ? (
                          <Chip
                            label={report.urgency_level}
                            color={getUrgencyColor(report.urgency_level)}
                            size="small"
                            variant="outlined"
                          />
                        ) : (
                          <Typography variant="caption" color="text.secondary">—</Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        {report.people_at_risk ? (
                          <Tooltip title="People at Risk">
                            <Chip
                              icon={<PeopleIcon fontSize="small" />}
                              label={report.people_at_risk}
                              color="error"
                              size="small"
                              variant="outlined"
                            />
                          </Tooltip>
                        ) : (
                          <Typography variant="caption" color="text.secondary">—</Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        {report.media_urls && report.media_urls.length > 0 ? (
                          <Tooltip title="View Media">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (report.media_urls && report.media_urls.length > 0) {
                                  window.open(report.media_urls[0], '_blank');
                                }
                              }}
                            >
                              <Badge badgeContent={report.media_urls.length} color="primary">
                                <ImageIcon />
                              </Badge>
                            </IconButton>
                          </Tooltip>
                        ) : (
                          <Typography variant="caption" color="text.secondary">—</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" display="block">
                          {format(new Date(report.created_at), 'MMM dd, yyyy')}
                        </Typography>
                        <Typography variant="caption" display="block" color="text.secondary">
                          {format(new Date(report.created_at), 'HH:mm:ss')}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={-1}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 25, 50, 100]}
          />
        </Paper>

        {/* Filter Drawer */}
        <Drawer
          anchor="right"
          open={filterDrawerOpen}
          onClose={() => setFilterDrawerOpen(false)}
          PaperProps={{ sx: { width: 400 } }}
        >
          <Box sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6" fontWeight={700}>
                Advanced Filters
              </Typography>
              <IconButton onClick={() => setFilterDrawerOpen(false)}>
                <CloseIcon />
              </IconButton>
            </Box>

            <Stack spacing={3}>
              {/* Hazard Types */}
              <FormControl fullWidth>
                <InputLabel>Hazard Types</InputLabel>
                <Select
                  multiple
                  value={filters.hazardTypes || []}
                  onChange={(e) => setFilters({ ...filters, hazardTypes: e.target.value as HazardType[] })}
                  input={<OutlinedInput label="Hazard Types" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {HAZARD_TYPES.map((type) => (
                    <MenuItem key={type} value={type}>
                      <Checkbox checked={(filters.hazardTypes || []).indexOf(type) > -1} />
                      <ListItemText primary={type} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Statuses */}
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  multiple
                  value={filters.statuses || []}
                  onChange={(e) => setFilters({ ...filters, statuses: e.target.value as ReportStatus[] })}
                  input={<OutlinedInput label="Status" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value.toUpperCase()} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {STATUSES.map((status) => (
                    <MenuItem key={status} value={status}>
                      <Checkbox checked={(filters.statuses || []).indexOf(status) > -1} />
                      <ListItemText primary={status.toUpperCase()} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Urgency Levels */}
              <FormControl fullWidth>
                <InputLabel>Urgency Level</InputLabel>
                <Select
                  multiple
                  value={filters.urgencyLevels || []}
                  onChange={(e) => setFilters({ ...filters, urgencyLevels: e.target.value as UrgencyLevel[] })}
                  input={<OutlinedInput label="Urgency Level" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {URGENCY_LEVELS.map((level) => (
                    <MenuItem key={level} value={level}>
                      <Checkbox checked={(filters.urgencyLevels || []).indexOf(level) > -1} />
                      <ListItemText primary={level} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Divider />

              {/* Risk Level */}
              <FormControl fullWidth>
                <InputLabel>Risk Level</InputLabel>
                <Select
                  value={filters.isHighRisk === null ? 'all' : filters.isHighRisk ? 'high' : 'normal'}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFilters({
                      ...filters,
                      isHighRisk: val === 'all' ? null : val === 'high',
                    });
                  }}
                  label="Risk Level"
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="high">High Risk Only</MenuItem>
                  <MenuItem value="normal">Normal Risk Only</MenuItem>
                </Select>
              </FormControl>

              {/* Media Filter */}
              <FormControl fullWidth>
                <InputLabel>Media Attachment</InputLabel>
                <Select
                  value={filters.hasMedia === null ? 'all' : filters.hasMedia ? 'with' : 'without'}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFilters({
                      ...filters,
                      hasMedia: val === 'all' ? null : val === 'with',
                    });
                  }}
                  label="Media Attachment"
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="with">With Media Only</MenuItem>
                  <MenuItem value="without">Without Media</MenuItem>
                </Select>
              </FormControl>

              <Divider />

              {/* Landmark Filter */}
              <FormControl fullWidth>
                <InputLabel>Filter by Landmark</InputLabel>
                <Select
                  value={filters.landmarkId || ''}
                  onChange={(e) => setFilters({ ...filters, landmarkId: e.target.value || null })}
                  label="Filter by Landmark"
                >
                  <MenuItem value="">
                    <em>All Locations</em>
                  </MenuItem>
                  {landmarks.map((landmark) => (
                    <MenuItem key={landmark.id} value={landmark.id}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <PlaceIcon fontSize="small" />
                        {landmark.name}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {filters.landmarkId && (
                <TextField
                  fullWidth
                  label="Search Radius"
                  type="number"
                  value={filters.landmarkRadius || 5000}
                  onChange={(e) => setFilters({ ...filters, landmarkRadius: parseInt(e.target.value) })}
                  inputProps={{ min: 100, step: 100 }}
                  helperText="Radius in meters from the landmark"
                  InputProps={{
                    endAdornment: <InputAdornment position="end">meters</InputAdornment>,
                  }}
                />
              )}

              <Divider />

              {/* Date Range */}
              <TextField
                fullWidth
                label="From Date"
                type="datetime-local"
                value={filters.dateFrom || ''}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />

              <TextField
                fullWidth
                label="To Date"
                type="datetime-local"
                value={filters.dateTo || ''}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Stack>

            <Box mt={4} display="flex" gap={2}>
              <Button
                fullWidth
                variant="outlined"
                onClick={handleResetFilters}
              >
                Reset All
              </Button>
              <Button
                fullWidth
                variant="contained"
                onClick={handleApplyFilters}
              >
                Apply Filters
              </Button>
            </Box>
          </Box>
        </Drawer>

        {/* Report Detail Dialog */}
        <Dialog
          open={detailDialogOpen}
          onClose={() => setDetailDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          {selectedReport && (
            <>
              <DialogTitle>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6" fontWeight={700}>
                    Report Details
                  </Typography>
                  <IconButton onClick={() => setDetailDialogOpen(false)}>
                    <CloseIcon />
                  </IconButton>
                </Box>
              </DialogTitle>
              <DialogContent dividers>
                <Stack spacing={3}>
                  {/* Status and Risk Badges */}
                  <Box display="flex" gap={1} flexWrap="wrap">
                    <Chip label={selectedReport.status.toUpperCase()} color={getStatusColor(selectedReport.status)} />
                    <Chip label={selectedReport.hazard_type} color={getHazardColor(selectedReport.hazard_type)} />
                    {selectedReport.is_high_risk && (
                      <Chip icon={<WarningIcon />} label="HIGH RISK" color="error" sx={{ fontWeight: 700 }} />
                    )}
                    {selectedReport.urgency_level && (
                      <Chip label={selectedReport.urgency_level} color={getUrgencyColor(selectedReport.urgency_level)} variant="outlined" />
                    )}
                  </Box>

                  {/* Description */}
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Description
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="body1">{selectedReport.description}</Typography>
                    </Paper>
                  </Box>

                  {/* Location */}
                  <Grid container spacing={2}>
                    <Grid xs={6}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Latitude
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {selectedReport.latitude.toFixed(6)}°N
                      </Typography>
                    </Grid>
                    <Grid xs={6}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Longitude
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {selectedReport.longitude.toFixed(6)}°E
                      </Typography>
                    </Grid>
                  </Grid>

                  {/* Risk Info */}
                  {selectedReport.people_at_risk && selectedReport.people_at_risk > 0 && (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        People at Risk
                      </Typography>
                      <Chip
                        icon={<PeopleIcon />}
                        label={`${selectedReport.people_at_risk} people`}
                        color="error"
                        variant="outlined"
                      />
                    </Box>
                  )}

                  {/* User Info */}
                  <Grid container spacing={2}>
                    <Grid xs={6}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Reporter Name
                      </Typography>
                      <Typography variant="body1">
                        {selectedReport.user_name || 'Anonymous'}
                      </Typography>
                    </Grid>
                    <Grid xs={6}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Phone Number
                      </Typography>
                      <Typography variant="body1" fontFamily="monospace">
                        {selectedReport.user_phone.replace(/(\d{2})(\d{4})(\d{2})(\d+)/, '+$1-****-**$4')}
                      </Typography>
                    </Grid>
                  </Grid>

                  {/* Timestamps */}
                  <Grid container spacing={2}>
                    <Grid xs={6}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Event Time
                      </Typography>
                      <Typography variant="body2">
                        {format(new Date(selectedReport.event_time), 'PPpp')}
                      </Typography>
                    </Grid>
                    <Grid xs={6}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Reported At
                      </Typography>
                      <Typography variant="body2">
                        {format(new Date(selectedReport.created_at), 'PPpp')}
                      </Typography>
                    </Grid>
                  </Grid>

                  {/* Media */}
                  {selectedReport.media_urls && selectedReport.media_urls.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Media Attachments ({selectedReport.media_urls.length})
                      </Typography>
                      <Box display="flex" gap={1} flexWrap="wrap">
                        {selectedReport.media_urls.map((url, idx) => (
                          <Button
                            key={idx}
                            variant="outlined"
                            size="small"
                            startIcon={url.includes('video') ? <VideoIcon /> : <ImageIcon />}
                            onClick={() => window.open(url, '_blank')}
                          >
                            {url.includes('video') ? 'Video' : 'Image'} {idx + 1}
                          </Button>
                        ))}
                      </Box>
                    </Box>
                  )}
                </Stack>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* Landmark Manager Dialog */}
        <LandmarkManager
          open={landmarkManagerOpen}
          onClose={() => setLandmarkManagerOpen(false)}
          onLandmarkAdded={handleLandmarkUpdate}
        />
      </Container>
    </Box>
  );
}

