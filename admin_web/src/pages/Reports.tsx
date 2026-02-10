import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Switch,
  FormControlLabel,
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  Image as ImageIcon,
  VideoLibrary as VideoIcon,
  Audiotrack as AudioIcon,
  Warning as WarningIcon,
  People as PeopleIcon,
  Place as PlaceIcon,
  Download as DownloadIcon,
  OpenInNew as OpenInNewIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';

import { landmarkService } from '../services/landmarkService';
import { hazardService } from '../services/hazardService';
import { isSupabaseConfigured } from '../core/supabase_config';
import type { HazardReport, FilterOptions, HazardType, UrgencyLevel, ReportStatus } from '../types/hazard';
import type { Landmark } from '../types/landmark';
import { LandmarkManager } from '../components/LandmarkManager';
import { format } from 'date-fns';

const HAZARD_TYPES: HazardType[] = ['High Waves', 'Tsunami', 'Storm', 'Flood', 'Other'];
const URGENCY_LEVELS: UrgencyLevel[] = ['Low', 'Medium', 'High'];
const STATUSES: ReportStatus[] = ['pending', 'verified', 'rejected', 'resolved'];

export function Reports() {
  const navigate = useNavigate();
  const theme = useTheme();
  const [reports, setReports] = useState<HazardReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<HazardReport | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const [mediaPreview, setMediaPreview] = useState<{ open: boolean; urls: string[]; index: number }>(
    { open: false, urls: [], index: 0 }
  );
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

      if (!isSupabaseConfigured()) {
        setReports([]);
        setTotalCount(0);
        setError('Supabase not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in admin_web/.env.local and restart the dev server.');
        return;
      }

      // If landmark filter is active, we can't do geo filtering in SQL (without PostGIS).
      // Fetch a larger set from Supabase, apply landmark filter client-side, then paginate client-side.
      const isLandmarkFilterActive = !!filters.landmarkId;

      const { data, total } = await hazardService.getReportsWithCount(
        filters,
        page,
        rowsPerPage,
        isLandmarkFilterActive ? { fetchAll: true, maxRows: 5000 } : undefined
      );

      if (!isLandmarkFilterActive) {
        setReports(data);
        setTotalCount(total);
        return;
      }

      const landmark = landmarks.find((l) => l.id === filters.landmarkId);
      if (!landmark) {
        setReports([]);
        setTotalCount(0);
        return;
      }

      const radius = filters.landmarkRadius || landmark.radius || 5000;
      const landmarkFiltered = data.filter((report) =>
        landmarkService.isWithinLandmark(report.latitude, report.longitude, landmark, radius)
      );

      setTotalCount(landmarkFiltered.length);
      const startIndex = page * rowsPerPage;
      const endIndex = startIndex + rowsPerPage;
      setReports(landmarkFiltered.slice(startIndex, endIndex));
    } catch (err) {
      setError('Failed to load reports from Supabase.');
      console.error(err);
      setReports([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const safeMaskPhone = (phone: string | null | undefined) => {
    if (!phone) return '—';
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 6) return phone;
    const suffix = digits.slice(-3);
    return `***-***-${suffix}`;
  };

  const looksLikeVideo = (url: string) => {
    const lower = url.toLowerCase();
    return lower.includes('video') || lower.endsWith('.mp4') || lower.endsWith('.mov') || lower.endsWith('.webm');
  };

  const looksLikeAudio = (url: string) => {
    const lower = url.toLowerCase();
    return (
      lower.includes('audio') ||
      lower.endsWith('.mp3') ||
      lower.endsWith('.wav') ||
      lower.endsWith('.m4a') ||
      lower.endsWith('.aac') ||
      lower.endsWith('.ogg') ||
      lower.endsWith('.opus')
    );
  };

  const openInLiveMap = (report: HazardReport) => {
    const params = new URLSearchParams({
      reportId: report.id,
      lat: String(report.latitude),
      lng: String(report.longitude),
    });
    navigate(`/map?${params.toString()}`);
  };

  const downloadTextFile = (filename: string, content: string, mime = 'text/plain;charset=utf-8') => {
    const blob = new Blob([content], { type: mime });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
  };

  const escapeCsv = (value: unknown) => {
    const s = value === null || value === undefined ? '' : String(value);
    const needsQuotes = /[\n\r,\"]/g.test(s);
    const escaped = s.replace(/\"/g, '""');
    return needsQuotes ? `"${escaped}"` : escaped;
  };

  const handleExportCsv = async () => {
    try {
      if (!isSupabaseConfigured()) {
        setError('Supabase not configured. Cannot export.');
        return;
      }

      setExporting(true);
      setError(null);

      const isLandmarkFilterActive = !!filters.landmarkId;
      const { data } = await hazardService.getReportsWithCount(
        filters,
        0,
        5000,
        { fetchAll: true, maxRows: 5000 }
      );

      let exportRows = data;
      if (isLandmarkFilterActive) {
        const landmark = landmarks.find((l) => l.id === filters.landmarkId);
        if (landmark) {
          const radius = filters.landmarkRadius || landmark.radius || 5000;
          exportRows = data.filter((report) =>
            landmarkService.isWithinLandmark(report.latitude, report.longitude, landmark, radius)
          );
        }
      }

      const headers = [
        'id',
        'status',
        'hazard_type',
        'description',
        'latitude',
        'longitude',
        'is_high_risk',
        'urgency_level',
        'people_at_risk',
        'user_name',
        'user_phone',
        'event_time',
        'created_at',
        'media_urls',
      ];

      const csv = [
        headers.join(','),
        ...exportRows.map((r) =>
          headers
            .map((h) => {
              const key = h as keyof HazardReport;
              const value = key === 'media_urls' ? (r.media_urls || []).join('|') : (r as any)[key];
              return escapeCsv(value);
            })
            .join(',')
        ),
      ].join('\n');

      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      downloadTextFile(`hazard-reports-${stamp}.csv`, csv, 'text/csv;charset=utf-8');
    } catch (e) {
      console.error(e);
      setError('Failed to export CSV.');
    } finally {
      setExporting(false);
    }
  };

  // Keep a ref to the latest loadReports implementation so realtime callbacks
  // always use current filters/pagination without re-subscribing.
  const loadReportsRef = useRef(loadReports);
  useEffect(() => {
    loadReportsRef.current = loadReports;
  });

  // Realtime updates: refresh on new reports.
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const channel = hazardService.subscribeToReports(() => {
      loadReportsRef.current();
    });

    return () => {
      channel.unsubscribe();
    };
    // Subscribe once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage]); // Removed filters from dep array to match original behavior where explicit search/filter button is needed, or add if auto-filtering is desired. Original only had page/rows.

  // Auto-search effect with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      // Only reload if query changed or if we need to applying new filters (logic is simplified here for instant search)
      // Note: We might want to avoid initial double load since loadReports is called on mount.
      // But checking if query is different from previous ref would be better.
      // For now, simple debounce for search query changes:
      setPage(0);
      loadReports();
    }, 100); // 100ms debounce for fast search
    return () => clearTimeout(timer);
  }, [filters.searchQuery]);

  // Optional auto-refresh (does not change filters; just reloads current view)
  useEffect(() => {
    if (!autoRefreshEnabled) return;
    if (!isSupabaseConfigured()) return;

    const id = window.setInterval(() => {
      loadReportsRef.current();
    }, 30000);

    return () => window.clearInterval(id);
  }, [autoRefreshEnabled]);

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

  const updateStatus = async (report: HazardReport, nextStatus: ReportStatus) => {
    try {
      if (!isSupabaseConfigured()) {
        setError('Supabase not configured. Cannot update status.');
        return;
      }

      if (report.status === nextStatus) return;

      const confirmText =
        nextStatus === 'verified'
          ? 'Accept this report and mark as VERIFIED?'
          : nextStatus === 'rejected'
            ? 'Reject this report?'
            : `Change status to ${nextStatus.toUpperCase()}?`;

      if (!window.confirm(confirmText)) return;

      setStatusUpdatingId(report.id);
      await hazardService.setReportStatus(report.id, nextStatus);

      // Update local list for snappy UX
      setReports((prev) => prev.map((r) => (r.id === report.id ? { ...r, status: nextStatus } : r)));
      setSelectedReport((prev) => (prev && prev.id === report.id ? { ...prev, status: nextStatus } : prev));
    } catch (e) {
      console.error(e);
      setError('Failed to update report status.');
    } finally {
      setStatusUpdatingId(null);
    }
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
      'High Waves': 'secondary',
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
      'rejected': 'error',
      'resolved': 'success',
    };
    return colors[status] as any;
  };

  return (
    <Box>
      <Container maxWidth={false} sx={{ py: 1, px: { xs: 1, sm: 2, md: 2 } }}>
        {/* Floating Actions Row */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1, gap: 2 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <FormControlLabel
              control={
                <Switch
                  checked={autoRefreshEnabled}
                  onChange={(e) => setAutoRefreshEnabled(e.target.checked)}
                  disabled={!isSupabaseConfigured()}
                  size="small"
                />
              }
              label={<Typography variant="body2" fontWeight={500} color="text.secondary">Auto-refresh</Typography>}
              sx={{ mr: 1 }}
            />
            <Button
              variant="text"
              startIcon={<DownloadIcon />}
              onClick={handleExportCsv}
              disabled={loading || exporting || !isSupabaseConfigured()}
              sx={{
                color: 'text.secondary',
                '&:hover': { color: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.08) }
              }}
            >
              Export CSV
            </Button>
          </Stack>
        </Box>

        {/* Search and Filter Bar */}
        <Box
          sx={{
            p: 1,
            mb: 1.5, // Reduced margin
            borderRadius: '12px',
            background: alpha(theme.palette.background.paper, 0.8),
            border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
            boxShadow: `0 2px 12px ${alpha(theme.palette.common.black, 0.04)}`,
          }}
        >
          {/* Active Landmark Filter Badge */}
          {filters.landmarkId && (
            <Box mb={2}>
              <Chip
                icon={<PlaceIcon />}
                label={`Filtering by: ${landmarks.find(l => l.id === filters.landmarkId)?.name} (${(filters.landmarkRadius || 5000).toLocaleString()}m radius)`}
                onDelete={() => setFilters({ ...filters, landmarkId: null })}
                color="primary"
                sx={{
                  fontWeight: 600,
                  borderRadius: '8px',
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  '& .MuiChip-deleteIcon': {
                    color: theme.palette.primary.main,
                    '&:hover': {
                      color: theme.palette.primary.dark,
                    },
                  },
                }}
              />
            </Box>
          )}

          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 8 }}>
              <TextField
                fullWidth
                placeholder="Search by description, location, or user name..."
                value={filters.searchQuery}
                onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                onKeyPress={(e) => {
                  // Removed Enter key handler for instant search (or you can keep it to force immediate search)
                  if (e.key === 'Enter') {
                    // Force refresh or just let debounce handle it? 
                    // Let's keep it just in case user wants to force it.
                    loadReports();
                  }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    bgcolor: alpha(theme.palette.grey[100], 0.5),
                    '&:hover': {
                      bgcolor: alpha(theme.palette.grey[100], 0.8),
                    },
                    '&.Mui-focused': {
                      bgcolor: 'background.paper',
                    },
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                  endAdornment: filters.searchQuery && (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setFilters({ ...filters, searchQuery: '' })}
                        sx={{
                          color: 'text.secondary',
                          '&:hover': { color: 'text.primary' },
                        }}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Stack direction="row" spacing={1.5}>
                <IconButton
                  onClick={loadReports}
                  disabled={loading}
                  sx={{
                    bgcolor: theme.palette.primary.main,
                    color: 'white',
                    borderRadius: '12px',
                    p: 1, // Smaller padding for lower height
                    '&:hover': {
                      bgcolor: theme.palette.primary.dark,
                    },
                    '&.Mui-disabled': {
                      bgcolor: alpha(theme.palette.primary.main, 0.5),
                      color: 'white',
                    },
                  }}
                >
                  <RefreshIcon />
                </IconButton>
                <Badge
                  badgeContent={getActiveFilterCount()}
                  color="error"
                  sx={{
                    '& .MuiBadge-badge': {
                      fontWeight: 700,
                      fontSize: '0.7rem',
                    },
                  }}
                >
                  <Button
                    variant="outlined"
                    startIcon={<FilterIcon />}
                    onClick={() => setFilterDrawerOpen(true)}
                    sx={{
                      py: 0.75, // Lower height
                      px: 2,
                      borderRadius: '12px',
                      borderColor: alpha(theme.palette.grey[400], 0.5),
                      color: 'text.primary',
                      fontWeight: 600,
                      '&:hover': {
                        borderColor: theme.palette.primary.main,
                        bgcolor: alpha(theme.palette.primary.main, 0.04),
                      },
                    }}
                  >
                    Filters
                  </Button>
                </Badge>
              </Stack>
            </Grid>
          </Grid>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Data Table */}
        <Box
          sx={{
            borderRadius: '20px',
            overflow: 'hidden',
            border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
            bgcolor: 'background.paper',
            boxShadow: `0 4px 24px ${alpha(theme.palette.common.black, 0.06)}`,
          }}
        >
          <TableContainer sx={{ maxHeight: 'calc(100vh - 400px)' }}>
            <Table
              stickyHeader
              size="small"
              sx={{
                '& .MuiTableCell-root': {
                  py: 1,
                  px: 1.5,
                  lineHeight: 1.4,
                  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.4)}`,
                },
                '& .MuiTableCell-head': {
                  py: 1.5,
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: theme.palette.text.secondary,
                  bgcolor: alpha(theme.palette.grey[50], 0.95),
                  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                },
                '& .MuiChip-root': { height: 24 },
                '& .MuiIconButton-root': { p: 0.5 },
              }}
            >
              <TableHead>
                <TableRow>
                  <TableCell>Status</TableCell>
                  <TableCell>Hazard Type</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Risk Level</TableCell>
                  <TableCell>Urgency</TableCell>
                  <TableCell>People at Risk</TableCell>
                  <TableCell>Media</TableCell>
                  <TableCell>Date & Time</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ py: 8 }}>
                      <CircularProgress />
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                        Loading reports...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : reports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ py: 8 }}>
                      <Stack spacing={1} alignItems="center">
                        <Typography variant="body1" color="text.secondary">
                          No reports found matching your criteria
                        </Typography>
                        <Stack direction="row" spacing={1}>
                          <Button size="small" variant="outlined" onClick={handleResetFilters}>
                            Clear filters
                          </Button>
                          <Button size="small" variant="contained" onClick={loadReports}>
                            Refresh
                          </Button>
                        </Stack>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ) : (
                  reports.map((report, index) => (
                    <TableRow
                      key={report.id}
                      onClick={() => handleRowClick(report)}
                      sx={{
                        cursor: 'pointer',
                        bgcolor: report.is_high_risk
                          ? alpha(theme.palette.error.main, 0.04)
                          : index % 2 === 0
                            ? 'transparent'
                            : alpha(theme.palette.grey[50], 0.5),
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          bgcolor: alpha(theme.palette.primary.main, 0.06),
                          transform: 'scale(1.001)',
                          boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.08)}`,
                        },
                        ...(report.is_high_risk && {
                          borderLeft: `3px solid ${theme.palette.error.main}`,
                        }),
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
                        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ whiteSpace: 'nowrap' }}>
                          <Typography variant="caption" color="text.secondary">
                            {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}
                          </Typography>
                          <Tooltip title="Open in Live Map">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                openInLiveMap(report);
                              }}
                              aria-label="Open in Live Map"
                            >
                              <PlaceIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
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
                                setMediaPreview({ open: true, urls: report.media_urls ?? [], index: 0 });
                              }}
                            >
                              <Badge badgeContent={report.media_urls.length} color="primary">
                                {report.media_urls.some(looksLikeVideo) ? (
                                  <VideoIcon />
                                ) : report.media_urls.some(looksLikeAudio) ? (
                                  <AudioIcon />
                                ) : (
                                  <ImageIcon />
                                )}
                              </Badge>
                            </IconButton>
                          </Tooltip>
                        ) : (
                          <Typography variant="caption" color="text.secondary">—</Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        <Typography variant="caption" color="text.secondary">
                          {format(new Date(report.created_at), 'MMM dd, yyyy HH:mm')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {report.status === 'pending' ? (
                          <Stack direction="row" spacing={0.75}>
                            <Tooltip title="Accept (Verify)">
                              <span>
                                <IconButton
                                  size="small"
                                  color="success"
                                  disabled={statusUpdatingId === report.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateStatus(report, 'verified');
                                  }}
                                  aria-label="Accept report"
                                >
                                  {statusUpdatingId === report.id ? <CircularProgress size={18} /> : <CheckCircleIcon fontSize="small" />}
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title="Reject">
                              <span>
                                <IconButton
                                  size="small"
                                  color="error"
                                  disabled={statusUpdatingId === report.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateStatus(report, 'rejected');
                                  }}
                                  aria-label="Reject report"
                                >
                                  {statusUpdatingId === report.id ? <CircularProgress size={18} /> : <CancelIcon fontSize="small" />}
                                </IconButton>
                              </span>
                            </Tooltip>
                          </Stack>
                        ) : (
                          <Typography variant="caption" color="text.secondary">—</Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              px: 2,
              py: 1,
              borderTop: `1px solid ${alpha(theme.palette.divider, 0.5)}`
            }}
          >
            <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
              Total: {totalCount.toLocaleString()} Reports
            </Typography>
            <TablePagination
              component="div"
              count={totalCount}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[10, 25, 50, 100]}
              sx={{ border: 'none' }}
            />
          </Box>
        </Box>

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

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                <Button
                  size="small"
                  startIcon={<PlaceIcon fontSize="small" />}
                  onClick={() => setLandmarkManagerOpen(true)}
                  sx={{
                    fontSize: '0.8125rem',
                    color: 'text.secondary',
                    '&:hover': { color: 'primary.main', bgcolor: 'transparent' }
                  }}
                >
                  Manage Landmarks
                </Button>
              </Box>

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
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Latitude
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {selectedReport.latitude.toFixed(6)}°N
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
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
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Reporter Name
                      </Typography>
                      <Typography variant="body1">
                        {selectedReport.user_name || 'Anonymous'}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Phone Number
                      </Typography>
                      <Typography variant="body1" fontFamily="monospace">
                        {safeMaskPhone(selectedReport.user_phone)}
                      </Typography>
                    </Grid>
                  </Grid>

                  {/* Timestamps */}
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Event Time
                      </Typography>
                      <Typography variant="body2">
                        {format(new Date(selectedReport.event_time), 'PPpp')}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
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
                            startIcon={looksLikeVideo(url) ? <VideoIcon /> : looksLikeAudio(url) ? <AudioIcon /> : <ImageIcon />}
                            onClick={() => setMediaPreview({ open: true, urls: selectedReport.media_urls ?? [], index: idx })}
                          >
                            {looksLikeVideo(url) ? 'Video' : looksLikeAudio(url) ? 'Audio' : 'Image'} {idx + 1}
                          </Button>
                        ))}
                      </Box>
                    </Box>
                  )}
                </Stack>
              </DialogContent>
              <DialogActions>
                {selectedReport.status === 'pending' && (
                  <Stack direction="row" spacing={1} sx={{ mr: 'auto', pl: 1 }}>
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<CheckCircleIcon />}
                      disabled={statusUpdatingId === selectedReport.id}
                      onClick={() => updateStatus(selectedReport, 'verified')}
                    >
                      Accept
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<CancelIcon />}
                      disabled={statusUpdatingId === selectedReport.id}
                      onClick={() => updateStatus(selectedReport, 'rejected')}
                    >
                      Reject
                    </Button>
                  </Stack>
                )}
                <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* Media Preview Dialog */}
        <Dialog
          open={mediaPreview.open}
          onClose={() => setMediaPreview({ open: false, urls: [], index: 0 })}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6" fontWeight={700}>
                Media Preview
              </Typography>
              <IconButton onClick={() => setMediaPreview({ open: false, urls: [], index: 0 })}>
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent dividers>
            {mediaPreview.urls.length > 0 ? (
              <Stack spacing={2}>
                <Typography variant="caption" color="text.secondary">
                  {mediaPreview.index + 1} / {mediaPreview.urls.length}
                </Typography>

                {looksLikeVideo(mediaPreview.urls[mediaPreview.index]) ? (
                  <Box
                    component="video"
                    src={mediaPreview.urls[mediaPreview.index]}
                    controls
                    sx={{ width: '100%', borderRadius: 1 }}
                  />
                ) : looksLikeAudio(mediaPreview.urls[mediaPreview.index]) ? (
                  <Box
                    component="audio"
                    src={mediaPreview.urls[mediaPreview.index]}
                    controls
                    sx={{ width: '100%' }}
                  />
                ) : (
                  <Box
                    component="img"
                    src={mediaPreview.urls[mediaPreview.index]}
                    alt="Report media"
                    sx={{ width: '100%', borderRadius: 1 }}
                  />
                )}

                {mediaPreview.urls.length > 1 && (
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Button
                      size="small"
                      variant="outlined"
                      disabled={mediaPreview.index === 0}
                      onClick={() => setMediaPreview((s) => ({ ...s, index: Math.max(0, s.index - 1) }))}
                    >
                      Prev
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      disabled={mediaPreview.index >= mediaPreview.urls.length - 1}
                      onClick={() => setMediaPreview((s) => ({ ...s, index: Math.min(s.urls.length - 1, s.index + 1) }))}
                    >
                      Next
                    </Button>

                    <Divider flexItem sx={{ mx: 1 }} />

                    {mediaPreview.urls.map((_, idx) => (
                      <Button
                        key={idx}
                        size="small"
                        variant={idx === mediaPreview.index ? 'contained' : 'text'}
                        onClick={() => setMediaPreview((s) => ({ ...s, index: idx }))}
                      >
                        {idx + 1}
                      </Button>
                    ))}
                  </Stack>
                )}
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary">No media</Typography>
            )}
          </DialogContent>
          <DialogActions>
            {mediaPreview.urls.length > 0 && (
              <Button
                variant="outlined"
                startIcon={<OpenInNewIcon />}
                onClick={() => window.open(mediaPreview.urls[mediaPreview.index], '_blank', 'noopener,noreferrer')}
              >
                Open in new tab
              </Button>
            )}
            <Button onClick={() => setMediaPreview({ open: false, urls: [], index: 0 })}>Close</Button>
          </DialogActions>
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

