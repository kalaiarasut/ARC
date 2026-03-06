import { useState, useEffect, useRef, type MouseEvent } from 'react';
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
  Popover,
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
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  CalendarMonth as CalendarMonthIcon,
  NavigateBefore as NavigateBeforeIcon,
  NavigateNext as NavigateNextIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { ImageZoom, AudioWaveform, VideoPreview } from '../components/MediaComponents';

import { landmarkService } from '../services/landmarkService';
import { hazardService } from '../services/hazardService';
import { isSupabaseConfigured } from '../core/supabase_config';
import type { HazardReport, FilterOptions, HazardType, UrgencyLevel, ReportStatus, ReportAuditLog } from '../types/hazard';
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
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<HazardReport | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const [landmarkManagerOpen, setLandmarkManagerOpen] = useState(false);
  const [landmarks, setLandmarks] = useState<Landmark[]>(landmarkService.getLandmarks());
  const [dayFilterAnchorEl, setDayFilterAnchorEl] = useState<HTMLElement | null>(null);
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [showDayCalendar, setShowDayCalendar] = useState(false);
  
  const [auditLogs, setAuditLogs] = useState<ReportAuditLog[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

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

  const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
  const endOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
  const startOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    return startOfDay(d);
  };
  const addDays = (date: Date, days: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  };
  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  const applyDayFilter = (day: Date) => {
    const from = startOfDay(day).toISOString();
    const to = endOfDay(day).toISOString();
    setFilters((prev) => ({ ...prev, dateFrom: from, dateTo: to }));
    setPage(0);
    loadReports();
  };

  const clearDayFilter = () => {
    setFilters((prev) => ({ ...prev, dateFrom: null, dateTo: null }));
    setPage(0);
    loadReports();
  };

  const openDayFilter = (event: MouseEvent<HTMLElement>) => {
    if (filters.dateFrom) {
      const parsed = new Date(filters.dateFrom);
      if (!Number.isNaN(parsed.getTime())) setSelectedDay(parsed);
    }
    setDayFilterAnchorEl(event.currentTarget);
  };

  const closeDayFilter = () => {
    setDayFilterAnchorEl(null);
    setShowDayCalendar(false);
  };

  const dayFilterOpen = Boolean(dayFilterAnchorEl);
  const weekStart = startOfWeek(selectedDay);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const shortDayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const today = new Date();
  const currentWeekStart = startOfWeek(today);
  const canGoNextWeek = weekStart.getTime() < currentWeekStart.getTime();

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
    setSelectedDay(new Date());
    setShowDayCalendar(false);
  };

  const handleLandmarkUpdate = () => {
    setLandmarks(landmarkService.getLandmarks());
  };

  const handleRowClick = async (report: HazardReport) => {
    setSelectedReport(report);
    setDetailDialogOpen(true);
    setLoadingAudit(true);
    try {
      const logs = await hazardService.getReportAuditLogs(report.id);
      setAuditLogs(logs);
    } catch (e) {
      console.error(e);
      setAuditLogs([]);
    } finally {
      setLoadingAudit(false);
    }
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

  const normalizeText = (value: string) => value.toLowerCase().replace(/\s+/g, ' ').trim();

  const getSuspiciousFlags = (report: HazardReport) => {
    const flags: string[] = [];
    const reportTime = new Date(report.created_at).getTime();

    const sameUser = reports.filter((r) => r.user_id === report.user_id);

    const inFiveMinutes = sameUser.filter(
      (r) => Math.abs(new Date(r.created_at).getTime() - reportTime) <= 5 * 60 * 1000
    );
    if (inFiveMinutes.length >= 3) flags.push('Rapid submissions');

    const inOneHour = sameUser.filter(
      (r) => Math.abs(new Date(r.created_at).getTime() - reportTime) <= 60 * 60 * 1000
    );
    if (inOneHour.length >= 8) flags.push('High hourly volume');

    const desc = normalizeText(report.description || '');
    if (desc.length >= 10) {
      const sameDescription = sameUser.filter((r) => normalizeText(r.description || '') === desc);
      if (sameDescription.length >= 2) flags.push('Repeated description');
    }

    if (report.is_high_risk && (!report.media_urls || report.media_urls.length === 0)) {
      flags.push('High-risk without media');
    }

    return flags;
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Container
        maxWidth={false}
        sx={{
          pt: 1,
          pb: 0,
          px: { xs: 1, sm: 2, md: 2 },
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
        }}
      >
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
                <Button
                  variant={filters.dateFrom && filters.dateTo ? 'contained' : 'outlined'}
                  startIcon={<CalendarMonthIcon />}
                  onClick={openDayFilter}
                  sx={{
                    py: 0.75,
                    px: 2,
                    borderRadius: '12px',
                    borderColor: alpha(theme.palette.grey[400], 0.5),
                    color: filters.dateFrom && filters.dateTo ? 'white' : 'text.primary',
                    fontWeight: 600,
                    minWidth: 130,
                    '&:hover': {
                      borderColor: theme.palette.primary.main,
                      bgcolor: filters.dateFrom && filters.dateTo
                        ? theme.palette.primary.dark
                        : alpha(theme.palette.primary.main, 0.04),
                    },
                  }}
                >
                  Day Filter
                </Button>
              </Stack>
            </Grid>
          </Grid>

          <Popover
            open={dayFilterOpen}
            anchorEl={dayFilterAnchorEl}
            onClose={closeDayFilter}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            PaperProps={{
              sx: {
                mt: 1,
                width: 390,
                borderRadius: '16px',
                border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.12)}`,
                p: 1.5,
              },
            }}
          >
            <Stack spacing={1.5}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Typography variant="subtitle1" fontWeight={700}>
                  {format(selectedDay, 'MMMM yyyy')}
                </Typography>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <IconButton
                    size="small"
                    onClick={() => setSelectedDay((prev) => addDays(prev, -7))}
                    sx={{ border: `1px solid ${alpha(theme.palette.divider, 0.6)}`, borderRadius: '10px' }}
                  >
                    <NavigateBeforeIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => {
                      if (!canGoNextWeek) return;
                      setSelectedDay((prev) => addDays(prev, 7));
                    }}
                    disabled={!canGoNextWeek}
                    sx={{ border: `1px solid ${alpha(theme.palette.divider, 0.6)}`, borderRadius: '10px' }}
                  >
                    <NavigateNextIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => setShowDayCalendar((prev) => !prev)}
                    sx={{
                      border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                      borderRadius: '10px',
                      color: showDayCalendar ? 'primary.main' : 'text.secondary',
                    }}
                  >
                    <CalendarMonthIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>

              <Stack direction="row" spacing={0.8}>
                {weekDays.map((day, index) => {
                  const selected = isSameDay(day, selectedDay);
                  const disabled = day.getTime() > endOfDay(today).getTime();
                  return (
                    <Button
                      key={day.toISOString()}
                      disabled={disabled}
                      onClick={() => {
                        setSelectedDay(day);
                        applyDayFilter(day);
                      }}
                      sx={{
                        minWidth: 0,
                        flex: 1,
                        py: 1,
                        px: 0,
                        borderRadius: '12px',
                        textTransform: 'none',
                        border: `1px solid ${selected ? alpha(theme.palette.primary.main, 0.2) : alpha(theme.palette.divider, 0.6)}`,
                        bgcolor: selected ? alpha(theme.palette.primary.main, 0.12) : 'background.paper',
                        color: selected ? 'primary.main' : 'text.primary',
                        '&:hover': {
                          bgcolor: selected ? alpha(theme.palette.primary.main, 0.16) : alpha(theme.palette.grey[100], 0.8),
                        },
                      }}
                    >
                      <Stack alignItems="center" spacing={0.3}>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: selected ? 'primary.main' : 'text.secondary' }}>
                          {shortDayNames[index]}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {day.getDate()}
                        </Typography>
                      </Stack>
                    </Button>
                  );
                })}
              </Stack>

              {showDayCalendar && (
                <TextField
                  fullWidth
                  label="Pick day"
                  type="date"
                  value={format(selectedDay, 'yyyy-MM-dd')}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (!value) return;
                    const date = new Date(`${value}T00:00:00`);
                    if (Number.isNaN(date.getTime())) return;
                    setSelectedDay(date);
                    applyDayFilter(date);
                  }}
                  InputLabelProps={{ shrink: true }}
                />
              )}

              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Button
                  size="small"
                  onClick={() => {
                    const now = new Date();
                    setSelectedDay(now);
                    applyDayFilter(now);
                  }}
                >
                  Today
                </Button>
                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    color="inherit"
                    onClick={() => {
                      clearDayFilter();
                    }}
                  >
                    Clear
                  </Button>
                  <Button size="small" variant="contained" onClick={closeDayFilter}>
                    Done
                  </Button>
                </Stack>
              </Stack>
            </Stack>
          </Popover>
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
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <TableContainer sx={{ flex: 1, minHeight: 0 }}>
            <Table
              stickyHeader
              size="small"
              sx={{
                tableLayout: 'fixed',
                '& .MuiTableCell-root': {
                  py: 1,
                  px: 1.5,
                  lineHeight: 1.4,
                  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.4)}`,
                  overflow: 'hidden',
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
                  <TableCell sx={{ width: 130 }}>Hazard</TableCell>
                  <TableCell sx={{ width: '30%' }}>Description</TableCell>
                  <TableCell sx={{ width: 150 }}>Location</TableCell>
                  <TableCell sx={{ width: 80 }}>Urgency</TableCell>
                  <TableCell sx={{ width: 70, textAlign: 'center' }}>People</TableCell>
                  <TableCell sx={{ width: 55, textAlign: 'center' }}>Media</TableCell>
                  <TableCell sx={{ width: 130 }}>Date & Time</TableCell>
                  <TableCell sx={{ width: 95, textAlign: 'center' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                      <CircularProgress />
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                        Loading reports...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : reports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
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
                    (() => {
                      const suspiciousFlags = getSuspiciousFlags(report);
                      const isVerified = report.status === 'verified';
                      const isRejected = report.status === 'rejected';
                      const isResolved = report.status === 'resolved';
                      const isPending = report.status === 'pending';
                      return (
                    <TableRow
                      key={report.id}
                      onClick={() => handleRowClick(report)}
                      sx={{
                        cursor: 'pointer',
                        position: 'relative',
                        bgcolor: report.is_high_risk
                          ? alpha(theme.palette.error.main, 0.04)
                          : isVerified
                            ? alpha(theme.palette.success.main, 0.02)
                            : isRejected
                              ? alpha(theme.palette.error.main, 0.015)
                              : index % 2 === 0
                                ? 'transparent'
                                : alpha(theme.palette.grey[50], 0.5),
                        opacity: (isVerified || isResolved) ? 0.65 : 1,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          opacity: 1,
                          bgcolor: alpha(theme.palette.primary.main, 0.06),
                        },
                        borderLeft: report.is_high_risk
                          ? `3px solid ${theme.palette.error.main}`
                          : isVerified
                            ? `3px solid ${theme.palette.success.main}`
                            : isRejected
                              ? `3px solid ${theme.palette.error.light}`
                              : isResolved
                                ? `3px solid ${theme.palette.info.main}`
                                : '3px solid transparent',
                      }}
                    >
                      {/* Hazard Type + Risk + Status indicator */}
                      <TableCell>
                        <Stack spacing={0.5} alignItems="flex-start">
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <Chip
                              label={report.hazard_type}
                              color={getHazardColor(report.hazard_type)}
                              size="small"
                              sx={{ fontWeight: 600, maxWidth: '100%' }}
                            />
                            {report.is_high_risk && (
                              <Tooltip title="High Risk">
                                <WarningIcon sx={{ fontSize: '0.9rem', color: theme.palette.error.main }} />
                              </Tooltip>
                            )}
                          </Stack>
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <Box
                              sx={{
                                width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                                bgcolor: isPending ? theme.palette.grey[400]
                                  : isVerified ? theme.palette.success.main
                                    : isRejected ? theme.palette.error.main
                                      : theme.palette.info.main,
                                boxShadow: isPending ? 'none' : `0 0 4px ${
                                  isVerified ? alpha(theme.palette.success.main, 0.4)
                                    : isRejected ? alpha(theme.palette.error.main, 0.4)
                                      : alpha(theme.palette.info.main, 0.4)
                                }`,
                              }}
                            />
                            <Typography variant="caption" sx={{
                              fontSize: '0.625rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em',
                              color: isPending ? theme.palette.text.secondary
                                : isVerified ? theme.palette.success.main
                                  : isRejected ? theme.palette.error.main
                                    : theme.palette.info.main,
                            }}>
                              {report.status}
                            </Typography>
                            {suspiciousFlags.length > 0 && (
                              <Tooltip title={suspiciousFlags.join(', ')}>
                                <WarningIcon sx={{ fontSize: '0.75rem', color: theme.palette.warning.main }} />
                              </Tooltip>
                            )}
                          </Stack>
                        </Stack>
                      </TableCell>

                      {/* Description */}
                      <TableCell>
                        <Typography variant="body2" noWrap sx={{ fontSize: '0.8125rem' }}>
                          {report.description}
                        </Typography>
                      </TableCell>

                      {/* Location */}
                      <TableCell>
                        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ whiteSpace: 'nowrap' }}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6875rem' }}>
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
                              <PlaceIcon sx={{ fontSize: '1rem' }} />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>

                      {/* Urgency */}
                      <TableCell>
                        {report.urgency_level ? (
                          <Chip
                            label={report.urgency_level}
                            color={getUrgencyColor(report.urgency_level)}
                            size="small"
                            variant="outlined"
                            sx={{ fontWeight: 600, fontSize: '0.6875rem' }}
                          />
                        ) : (
                          <Typography variant="caption" color="text.secondary">—</Typography>
                        )}
                      </TableCell>

                      {/* People at risk */}
                      <TableCell align="center">
                        {report.people_at_risk ? (
                          <Tooltip title="People at Risk">
                            <Chip
                              icon={<PeopleIcon sx={{ fontSize: '0.85rem !important' }} />}
                              label={report.people_at_risk}
                              color="error"
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: '0.6875rem' }}
                            />
                          </Tooltip>
                        ) : (
                          <Typography variant="caption" color="text.secondary">—</Typography>
                        )}
                      </TableCell>

                      {/* Media */}
                      <TableCell align="center">
                        {report.media_urls && report.media_urls.length > 0 ? (
                          <Tooltip title="View Media">
                            <IconButton
                              size="small"
                              color="primary"
                               onClick={(e) => {
                                 e.stopPropagation();
                                 setSelectedReport(report);
                                 setDetailDialogOpen(true);
                               }}
                            >
                              <Badge badgeContent={report.media_urls.length} color="primary">
                                {report.media_urls.some(looksLikeVideo) ? (
                                  <VideoIcon sx={{ fontSize: '1.1rem' }} />
                                ) : report.media_urls.some(looksLikeAudio) ? (
                                  <AudioIcon sx={{ fontSize: '1.1rem' }} />
                                ) : (
                                  <ImageIcon sx={{ fontSize: '1.1rem' }} />
                                )}
                              </Badge>
                            </IconButton>
                          </Tooltip>
                        ) : (
                          <Typography variant="caption" color="text.secondary">—</Typography>
                        )}
                      </TableCell>

                      {/* Date */}
                      <TableCell>
                        <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap', fontSize: '0.6875rem' }}>
                          {format(new Date(report.created_at), 'MMM dd, yyyy HH:mm')}
                        </Typography>
                      </TableCell>

                      {/* Actions */}
                      <TableCell align="center">
                        {isPending ? (
                          <Stack direction="row" spacing={0.5} justifyContent="center">
                            <Tooltip title="Verify">
                              <span>
                                <IconButton
                                  size="small"
                                  disabled={statusUpdatingId === report.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateStatus(report, 'verified');
                                  }}
                                  aria-label="Verify report"
                                  sx={{
                                    color: theme.palette.success.main,
                                    bgcolor: alpha(theme.palette.success.main, 0.08),
                                    '&:hover': { bgcolor: alpha(theme.palette.success.main, 0.16) },
                                    width: 30, height: 30,
                                  }}
                                >
                                  {statusUpdatingId === report.id ? <CircularProgress size={16} /> : <CheckCircleIcon sx={{ fontSize: '1rem' }} />}
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title="Reject">
                              <span>
                                <IconButton
                                  size="small"
                                  disabled={statusUpdatingId === report.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateStatus(report, 'rejected');
                                  }}
                                  aria-label="Reject report"
                                  sx={{
                                    color: theme.palette.error.main,
                                    bgcolor: alpha(theme.palette.error.main, 0.08),
                                    '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.16) },
                                    width: 30, height: 30,
                                  }}
                                >
                                  {statusUpdatingId === report.id ? <CircularProgress size={16} /> : <CancelIcon sx={{ fontSize: '1rem' }} />}
                                </IconButton>
                              </span>
                            </Tooltip>
                          </Stack>
                        ) : (
                          <Chip
                            label={report.status.toUpperCase()}
                            size="small"
                            variant="outlined"
                            sx={{
                              fontWeight: 600, fontSize: '0.5625rem', height: 20,
                              color: isVerified ? theme.palette.success.main
                                : isRejected ? theme.palette.error.main
                                  : theme.palette.info.main,
                              borderColor: isVerified ? alpha(theme.palette.success.main, 0.3)
                                : isRejected ? alpha(theme.palette.error.main, 0.3)
                                  : alpha(theme.palette.info.main, 0.3),
                            }}
                          />
                        )}
                      </TableCell>
                    </TableRow>
                      );
                    })()
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
              rowsPerPageOptions={[25, 50, 100]}
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

              <Alert severity="info" sx={{ borderRadius: 2 }}>
                Day-based date filtering is available from the <strong>Day Filter</strong> button in the top bar.
              </Alert>
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
          maxWidth="lg"
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
                      <Grid container spacing={2}>
                        {selectedReport.media_urls.map((url, idx) => (
                          <Grid size={{ xs: 12, md: looksLikeAudio(url) ? 12 : 6 }} key={idx}>
                            <Box sx={{ p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: 'background.paper' }}>
                              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                                Attachment {idx + 1}
                              </Typography>
                              {looksLikeVideo(url) ? (
                                <VideoPreview src={url} />
                              ) : looksLikeAudio(url) ? (
                                <AudioWaveform src={url} />
                              ) : (
                                <ImageZoom src={url} alt={`Attachment ${idx + 1}`} />
                              )}
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  )}

                  {/* Audit Trail Section */}
                  <Divider />
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <HistoryIcon fontSize="small" /> Audit Trail
                    </Typography>
                    {loadingAudit ? (
                      <CircularProgress size={24} sx={{ mt: 1 }} />
                    ) : auditLogs.length === 0 ? (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
                        No status changes recorded yet.
                      </Typography>
                    ) : (
                      <Stack spacing={1} sx={{ mt: 1 }}>
                        {auditLogs.map((log) => (
                          <Paper key={log.id} variant="outlined" sx={{ p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box>
                              <Typography variant="body2" fontWeight={600}>
                                {log.admin_email}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {format(new Date(log.changed_at), 'PPpp')}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Chip size="small" variant="outlined" label={log.old_status.toUpperCase()} sx={{ fontSize: '0.7rem' }} />
                              <NavigateNextIcon fontSize="small" color="action" />
                              <Chip size="small" label={log.new_status.toUpperCase()} color={getStatusColor(log.new_status)} sx={{ fontSize: '0.7rem' }} />
                            </Box>
                          </Paper>
                        ))}
                      </Stack>
                    )}
                  </Box>
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

