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
  Translate as TranslateIcon,
  TextSnippet as TextSnippetIcon,
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
  const [translatingReportId, setTranslatingReportId] = useState<string | null>(null);
  const [showOriginalDescription, setShowOriginalDescription] = useState(false);

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
    setShowOriginalDescription(false);
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

  const ensureReportTranslation = async (report: HazardReport, options?: { silent?: boolean; force?: boolean }) => {
    try {
      setTranslatingReportId(report.id);
      const translated = await hazardService.translateReportToEnglish(report.id, {
        force: options?.force ?? false,
      });
      const patch: Partial<HazardReport> = {
        detected_language: translated.detected_language,
        translated_english: translated.translated_english,
        translation_status: translated.translation_status,
        translation_attempts: translated.translation_attempts,
        translation_provider: translated.translation_provider,
        translation_model: translated.translation_model,
        translated_at: translated.translated_at,
        translation_last_error: null,
        translation_next_retry_at: null,
      };

      setReports((prev) => prev.map((item) => (item.id === report.id ? { ...item, ...patch } : item)));
      setSelectedReport((prev) => (prev && prev.id === report.id ? { ...prev, ...patch } : prev));
    } catch (e) {
      console.error(e);
      if (!options?.silent) {
        setError('Failed to translate report description.');
      }
    } finally {
      setTranslatingReportId(null);
    }
  };

  const getLanguageLabel = (code?: string | null) => {
    switch ((code ?? '').trim().toLowerCase()) {
      case 'bn':
        return 'Bengali';
      case 'gu':
        return 'Gujarati';
      case 'hi':
        return 'Hindi';
      case 'kn':
        return 'Kannada';
      case 'ml':
        return 'Malayalam';
      case 'mr':
        return 'Marathi';
      case 'or':
        return 'Odia';
      case 'ta':
        return 'Tamil';
      case 'te':
        return 'Telugu';
      case 'en':
        return 'English';
      default:
        return 'Unknown';
    }
  };

  const getTranslationStatusMeta = (status?: HazardReport['translation_status'] | null) => {
    switch (status) {
      case 'completed':
        return { label: 'Translated', color: 'success' as const };
      case 'processing':
        return { label: 'Processing', color: 'info' as const };
      case 'failed':
        return { label: 'Failed', color: 'error' as const };
      case 'skipped':
        return { label: 'Skipped', color: 'default' as const };
      case 'pending':
      default:
        return { label: 'Pending', color: 'warning' as const };
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
    const colors: Record<string, string> = {
      'Tsunami': '#ef4444',
      'High Waves': '#0891b2',
      'Storm': '#f59e0b',
      'Flood': '#088395',
      'Other': '#6b7280',
    };
    return colors[type] || '#6b7280';
  };

  const getUrgencyColor = (level: UrgencyLevel | null) => {
    if (!level) return 'default';
    const colors = {
      'High': 'error',
      'Medium': 'warning',
      'Low': 'info',
    };
    return colors[level] as any;
  };

  const getStatusColor = (status: ReportStatus) => {
    const colors = {
      'pending': 'default',
      'verified': 'primary',
      'rejected': 'error',
      'resolved': 'info',
    };
    return colors[status] as any;
  };

  const getStatusChipStyle = (status: ReportStatus) => {
    const styles: Record<ReportStatus, { bgcolor: string; color: string }> = {
      'pending': { bgcolor: alpha(theme.palette.grey[500], 0.12), color: theme.palette.grey[700] },
      'verified': { bgcolor: alpha('#088395', 0.12), color: '#088395' },
      'rejected': { bgcolor: alpha(theme.palette.error.main, 0.1), color: theme.palette.error.main },
      'resolved': { bgcolor: alpha('#0891b2', 0.12), color: '#0891b2' },
    };
    return styles[status] || styles['pending'];
  };

  const getUrgencyChipStyle = (level: UrgencyLevel | null) => {
    if (!level) return { bgcolor: alpha(theme.palette.grey[400], 0.1), color: theme.palette.grey[600] };
    const styles: Record<UrgencyLevel, { bgcolor: string; color: string; borderColor: string }> = {
      'High': { bgcolor: alpha(theme.palette.error.main, 0.08), color: theme.palette.error.main, borderColor: alpha(theme.palette.error.main, 0.3) },
      'Medium': { bgcolor: alpha('#f59e0b', 0.08), color: '#d97706', borderColor: alpha('#f59e0b', 0.3) },
      'Low': { bgcolor: alpha('#088395', 0.08), color: '#088395', borderColor: alpha('#088395', 0.3) },
    };
    return styles[level] || { bgcolor: 'transparent', color: theme.palette.grey[600], borderColor: theme.palette.grey[300] };
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
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 0.75, gap: 1, alignItems: 'center' }}>
          <Button
            variant={autoRefreshEnabled ? 'contained' : 'outlined'}
            size="small"
            startIcon={<RefreshIcon sx={{ fontSize: '0.9rem !important', ...(autoRefreshEnabled ? { animation: 'spin 2s linear infinite', '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } } } : {}) }} />}
            onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
            disabled={!isSupabaseConfigured()}
            sx={{
              fontSize: '0.7rem',
              fontWeight: 600,
              textTransform: 'none',
              borderRadius: '8px',
              px: 1.5,
              height: 30,
              ...(autoRefreshEnabled ? {
                bgcolor: alpha(theme.palette.success.main, 0.85),
                color: 'white',
                boxShadow: 'none',
                '&:hover': { bgcolor: theme.palette.success.main, boxShadow: 'none' },
              } : {
                borderColor: alpha(theme.palette.grey[300], 0.8),
                color: alpha(theme.palette.text.secondary, 0.7),
                '&:hover': { borderColor: theme.palette.success.main, color: theme.palette.success.main, bgcolor: alpha(theme.palette.success.main, 0.04) },
              }),
            }}
          >
            {autoRefreshEnabled ? 'Live' : 'Auto-refresh'}
          </Button>
          <Button
            variant="text"
            size="small"
            startIcon={<DownloadIcon sx={{ fontSize: '0.9rem !important' }} />}
            onClick={handleExportCsv}
            disabled={loading || exporting || !isSupabaseConfigured()}
            sx={{
              fontSize: '0.7rem',
              fontWeight: 600,
              color: alpha(theme.palette.text.secondary, 0.6),
              textTransform: 'none',
              borderRadius: '8px',
              px: 1.5,
              height: 30,
              '&:hover': { color: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.06) }
            }}
          >
            Export CSV
          </Button>
        </Box>

        {/* Search and Filter Bar */}
        <Box
          sx={{
            p: 1.25,
            mb: 1.5,
            borderRadius: '14px',
            background: theme.palette.background.paper,
            border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
            boxShadow: `0 1px 4px ${alpha(theme.palette.common.black, 0.04)}, 0 4px 16px ${alpha(theme.palette.common.black, 0.02)}`,
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

          <Grid container spacing={1.5} alignItems="center">
            <Grid size={{ xs: 12, md: 'grow' }}>
              <TextField
                fullWidth
                placeholder="Search by description, location, or user name..."
                value={filters.searchQuery}
                onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') loadReports();
                }}
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '10px',
                    bgcolor: alpha(theme.palette.grey[100], 0.4),
                    fontSize: '0.875rem',
                    '& fieldset': { borderColor: alpha(theme.palette.divider, 0.12) },
                    '&:hover': {
                      bgcolor: alpha(theme.palette.grey[100], 0.7),
                      '& fieldset': { borderColor: alpha(theme.palette.divider, 0.25) },
                    },
                    '&.Mui-focused': {
                      bgcolor: 'background.paper',
                      '& fieldset': { borderColor: theme.palette.primary.main, borderWidth: '1.5px' },
                    },
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: alpha(theme.palette.text.secondary, 0.5), fontSize: '1.2rem' }} />
                    </InputAdornment>
                  ),
                  endAdornment: filters.searchQuery && (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setFilters({ ...filters, searchQuery: '' })}
                        sx={{ color: 'text.secondary', '&:hover': { color: 'text.primary' } }}
                      >
                        <CloseIcon sx={{ fontSize: '1rem' }} />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid size="auto">
              <Stack direction="row" spacing={1}>
                <IconButton
                  onClick={loadReports}
                  disabled={loading}
                  sx={{
                    bgcolor: theme.palette.primary.main,
                    color: 'white',
                    borderRadius: '10px',
                    width: 38, height: 38,
                    '&:hover': { bgcolor: theme.palette.primary.dark },
                    '&.Mui-disabled': { bgcolor: alpha(theme.palette.primary.main, 0.4), color: 'white' },
                  }}
                >
                  <RefreshIcon sx={{ fontSize: '1.2rem' }} />
                </IconButton>
                <Badge
                  badgeContent={getActiveFilterCount()}
                  color="error"
                  sx={{ '& .MuiBadge-badge': { fontWeight: 700, fontSize: '0.65rem', minWidth: 18, height: 18 } }}
                >
                  <Button
                    variant="outlined"
                    startIcon={<FilterIcon sx={{ fontSize: '1rem !important' }} />}
                    onClick={() => setFilterDrawerOpen(true)}
                    sx={{
                      height: 38,
                      px: 2,
                      borderRadius: '10px',
                      borderColor: alpha(theme.palette.grey[300], 0.8),
                      color: 'text.primary',
                      fontWeight: 600,
                      fontSize: '0.8125rem',
                      textTransform: 'none',
                      '&:hover': { borderColor: theme.palette.primary.main, bgcolor: alpha(theme.palette.primary.main, 0.04) },
                    }}
                  >
                    Filters
                  </Button>
                </Badge>
                <Button
                  variant={filters.dateFrom && filters.dateTo ? 'contained' : 'outlined'}
                  startIcon={<CalendarMonthIcon sx={{ fontSize: '1rem !important' }} />}
                  onClick={openDayFilter}
                  sx={{
                    height: 38,
                    px: 2,
                    borderRadius: '10px',
                    borderColor: alpha(theme.palette.grey[300], 0.8),
                    color: filters.dateFrom && filters.dateTo ? 'white' : 'text.primary',
                    fontWeight: 600,
                    fontSize: '0.8125rem',
                    textTransform: 'none',
                    minWidth: 120,
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
                width: 380,
                borderRadius: '14px',
                border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.1)}`,
                p: 1.5,
              },
            }}
          >
            <Stack spacing={1.5}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Typography variant="subtitle2" fontWeight={700} sx={{ fontSize: '0.95rem' }}>
                  {format(selectedDay, 'MMMM yyyy')}
                </Typography>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <IconButton
                    size="small"
                    onClick={() => setSelectedDay((prev) => addDays(prev, -7))}
                    sx={{ border: `1px solid ${alpha(theme.palette.divider, 0.12)}`, borderRadius: '8px', width: 30, height: 30 }}
                  >
                    <NavigateBeforeIcon sx={{ fontSize: '1rem' }} />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => {
                      if (!canGoNextWeek) return;
                      setSelectedDay((prev) => addDays(prev, 7));
                    }}
                    disabled={!canGoNextWeek}
                    sx={{ border: `1px solid ${alpha(theme.palette.divider, 0.12)}`, borderRadius: '8px', width: 30, height: 30 }}
                  >
                    <NavigateNextIcon sx={{ fontSize: '1rem' }} />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => setShowDayCalendar((prev) => !prev)}
                    sx={{
                      border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                      borderRadius: '8px',
                      width: 30, height: 30,
                      color: showDayCalendar ? 'primary.main' : alpha(theme.palette.text.secondary, 0.5),
                    }}
                  >
                    <CalendarMonthIcon sx={{ fontSize: '0.95rem' }} />
                  </IconButton>
                </Box>
              </Box>

              <Stack direction="row" spacing={0.75}>
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
                        py: 0.75,
                        px: 0,
                        borderRadius: '10px',
                        textTransform: 'none',
                        border: `1px solid ${selected ? alpha(theme.palette.primary.main, 0.2) : alpha(theme.palette.divider, 0.1)}`,
                        bgcolor: selected ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                        color: selected ? 'primary.main' : 'text.primary',
                        '&:hover': {
                          bgcolor: selected ? alpha(theme.palette.primary.main, 0.14) : alpha(theme.palette.grey[100], 0.5),
                        },
                      }}
                    >
                      <Stack alignItems="center" spacing={0.2}>
                        <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.6rem', color: selected ? 'primary.main' : alpha(theme.palette.text.secondary, 0.6) }}>
                          {shortDayNames[index]}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.875rem' }}>
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
                  sx={{ fontSize: '0.75rem', textTransform: 'none', fontWeight: 600 }}
                >
                  Today
                </Button>
                <Stack direction="row" spacing={0.75}>
                  <Button
                    size="small"
                    color="inherit"
                    onClick={() => {
                      clearDayFilter();
                    }}
                    sx={{ fontSize: '0.75rem', textTransform: 'none', fontWeight: 600, color: alpha(theme.palette.text.secondary, 0.6) }}
                  >
                    Clear
                  </Button>
                  <Button size="small" variant="contained" onClick={closeDayFilter} sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, px: 2, boxShadow: 'none' }}>
                    Done
                  </Button>
                </Stack>
              </Stack>
            </Stack>
          </Popover>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: '10px', fontSize: '0.8125rem' }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Data Table */}
        <Box
          sx={{
            borderRadius: '16px',
            overflow: 'hidden',
            border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
            bgcolor: 'background.paper',
            boxShadow: `0 1px 4px ${alpha(theme.palette.common.black, 0.04)}, 0 4px 20px ${alpha(theme.palette.common.black, 0.02)}`,
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
                  py: 1.125,
                  px: 1.5,
                  lineHeight: 1.4,
                  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.06)}`,
                  overflow: 'hidden',
                },
                '& .MuiTableCell-head': {
                  py: 1.25,
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: alpha(theme.palette.text.secondary, 0.7),
                  bgcolor: alpha(theme.palette.grey[50], 0.6),
                  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                },
                '& .MuiChip-root': { height: 22 },
                '& .MuiIconButton-root': { p: 0.4 },
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
                    <TableCell colSpan={8} align="center" sx={{ py: 6, border: 'none' }}>
                      <CircularProgress size={28} thickness={3} />
                      <Typography variant="caption" sx={{ mt: 1.5, display: 'block', color: alpha(theme.palette.text.secondary, 0.5) }}>
                        Loading reports...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : reports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 6, border: 'none' }}>
                      <Stack spacing={1.5} alignItems="center">
                        <Typography variant="body2" sx={{ color: alpha(theme.palette.text.secondary, 0.5) }}>
                          No reports found matching your criteria
                        </Typography>
                        <Stack direction="row" spacing={1}>
                          <Button size="small" variant="outlined" onClick={handleResetFilters} sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, fontSize: '0.75rem' }}>
                            Clear filters
                          </Button>
                          <Button size="small" variant="contained" onClick={loadReports} sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, fontSize: '0.75rem', boxShadow: 'none' }}>
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
                      const translationMeta = getTranslationStatusMeta(report.translation_status);
                      const displayedDescription =
                        report.translation_status === 'completed' && report.translated_english?.trim()
                          ? report.translated_english
                          : report.description;
                      return (
                    <TableRow
                      key={report.id}
                      onClick={() => handleRowClick(report)}
                      sx={{
                        cursor: 'pointer',
                        position: 'relative',
                        bgcolor: report.is_high_risk
                          ? alpha(theme.palette.error.main, 0.03)
                          : isVerified
                            ? alpha(theme.palette.success.main, 0.015)
                            : isRejected
                              ? alpha(theme.palette.error.main, 0.012)
                              : index % 2 === 0
                                ? 'transparent'
                                : alpha(theme.palette.grey[50], 0.35),
                        opacity: (isVerified || isResolved) ? 0.55 : 1,
                        transition: 'all 0.15s ease',
                        '&:hover': {
                          opacity: 1,
                          bgcolor: alpha(theme.palette.primary.main, 0.04),
                        },
                        borderLeft: report.is_high_risk
                          ? `3px solid ${theme.palette.error.main}`
                          : isVerified
                            ? `3px solid ${alpha(theme.palette.success.main, 0.5)}`
                            : isRejected
                              ? `3px solid ${alpha(theme.palette.error.main, 0.35)}`
                              : isResolved
                                ? `3px solid ${alpha(theme.palette.info.main, 0.4)}`
                                : '3px solid transparent',
                      }}
                    >
                      {/* Hazard Type + Risk + Status indicator */}
                      <TableCell>
                        <Stack spacing={0.4} alignItems="flex-start">
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <Chip
                              label={report.hazard_type}
                              size="small"
                              sx={{
                                fontWeight: 600, fontSize: '0.6875rem', height: 22,
                                bgcolor: alpha(getHazardColor(report.hazard_type), 0.1),
                                color: getHazardColor(report.hazard_type),
                                border: 'none',
                              }}
                            />
                            {report.is_high_risk && (
                              <Tooltip title="High Risk" arrow>
                                <WarningIcon sx={{ fontSize: '0.85rem', color: theme.palette.error.main, opacity: 0.85 }} />
                              </Tooltip>
                            )}
                          </Stack>
                          <Stack direction="row" spacing={0.4} alignItems="center">
                            <Box
                              sx={{
                                width: 5, height: 5, borderRadius: '50%', flexShrink: 0,
                                bgcolor: isPending ? alpha(theme.palette.grey[500], 0.6)
                                  : isVerified ? theme.palette.success.main
                                    : isRejected ? theme.palette.error.main
                                      : theme.palette.info.main,
                              }}
                            />
                            <Typography variant="caption" sx={{
                              fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
                              color: isPending ? alpha(theme.palette.text.secondary, 0.6)
                                : isVerified ? alpha(theme.palette.success.main, 0.8)
                                  : isRejected ? alpha(theme.palette.error.main, 0.75)
                                    : alpha(theme.palette.info.main, 0.8),
                            }}>
                              {report.status}
                            </Typography>
                            {suspiciousFlags.length > 0 && (
                              <Tooltip title={suspiciousFlags.join(' · ')} arrow>
                                <WarningIcon sx={{ fontSize: '0.7rem', color: alpha(theme.palette.warning.main, 0.75) }} />
                              </Tooltip>
                            )}
                          </Stack>
                        </Stack>
                      </TableCell>

                      {/* Description */}
                      <TableCell>
                        <Stack spacing={0.5} alignItems="flex-start">
                          <Typography variant="body2" noWrap sx={{ fontSize: '0.8rem', color: alpha(theme.palette.text.primary, 0.85) }}>
                            {displayedDescription}
                          </Typography>
                          <Stack direction="row" spacing={0.5} alignItems="center" useFlexGap flexWrap="wrap">
                            <Chip
                              label={translationMeta.label}
                              size="small"
                              color={translationMeta.color}
                              variant={translationMeta.color === 'default' ? 'outlined' : 'filled'}
                              sx={{ fontSize: '0.62rem', height: 20, fontWeight: 600 }}
                            />
                            {report.detected_language && (
                              <Chip
                                size="small"
                                label={getLanguageLabel(report.detected_language)}
                                variant="outlined"
                                sx={{ fontSize: '0.62rem', height: 20, fontWeight: 600 }}
                              />
                            )}
                          </Stack>
                        </Stack>
                      </TableCell>

                      {/* Location */}
                      <TableCell>
                        <Stack direction="row" spacing={0.4} alignItems="center" sx={{ whiteSpace: 'nowrap' }}>
                          <Typography variant="caption" sx={{ fontSize: '0.675rem', color: alpha(theme.palette.text.secondary, 0.7), fontFamily: '"JetBrains Mono", "Fira Code", monospace', fontWeight: 500 }}>
                            {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}
                          </Typography>
                          <Tooltip title="Open in Live Map" arrow>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                openInLiveMap(report);
                              }}
                              aria-label="Open in Live Map"
                              sx={{ color: alpha(theme.palette.primary.main, 0.6), '&:hover': { color: theme.palette.primary.main, bgcolor: alpha(theme.palette.primary.main, 0.06) } }}
                            >
                              <PlaceIcon sx={{ fontSize: '0.9rem' }} />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>

                      {/* Urgency */}
                      <TableCell>
                        {report.urgency_level ? (
                          <Chip
                            label={report.urgency_level}
                            size="small"
                            sx={{
                              fontWeight: 600, fontSize: '0.65rem', height: 20,
                              bgcolor: report.urgency_level === 'High' ? alpha(theme.palette.error.main, 0.08)
                                : report.urgency_level === 'Medium' ? alpha(theme.palette.warning.main, 0.08)
                                  : alpha(theme.palette.success.main, 0.08),
                              color: report.urgency_level === 'High' ? theme.palette.error.main
                                : report.urgency_level === 'Medium' ? theme.palette.warning.dark
                                  : theme.palette.success.dark,
                              border: 'none',
                            }}
                          />
                        ) : (
                          <Typography variant="caption" sx={{ color: alpha(theme.palette.text.secondary, 0.4) }}>—</Typography>
                        )}
                      </TableCell>

                      {/* People at risk */}
                      <TableCell align="center">
                        {report.people_at_risk ? (
                          <Tooltip title="People at Risk" arrow>
                            <Chip
                              icon={<PeopleIcon sx={{ fontSize: '0.75rem !important' }} />}
                              label={report.people_at_risk}
                              size="small"
                              sx={{
                                fontSize: '0.65rem', height: 20, fontWeight: 600,
                                bgcolor: alpha(theme.palette.error.main, 0.06),
                                color: theme.palette.error.main,
                                border: 'none',
                                '& .MuiChip-icon': { color: alpha(theme.palette.error.main, 0.7) },
                              }}
                            />
                          </Tooltip>
                        ) : (
                          <Typography variant="caption" sx={{ color: alpha(theme.palette.text.secondary, 0.3) }}>—</Typography>
                        )}
                      </TableCell>

                      {/* Media */}
                      <TableCell align="center">
                        {report.media_urls && report.media_urls.length > 0 ? (
                          <Tooltip title="View Media" arrow>
                            <IconButton
                              size="small"
                               onClick={(e) => {
                                 e.stopPropagation();
                                 setSelectedReport(report);
                                 setDetailDialogOpen(true);
                               }}
                               sx={{ color: alpha(theme.palette.primary.main, 0.6), '&:hover': { color: theme.palette.primary.main, bgcolor: alpha(theme.palette.primary.main, 0.06) } }}
                            >
                              <Badge badgeContent={report.media_urls.length} color="primary" sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem', minWidth: 16, height: 16 } }}>
                                {report.media_urls.some(looksLikeVideo) ? (
                                  <VideoIcon sx={{ fontSize: '1rem' }} />
                                ) : report.media_urls.some(looksLikeAudio) ? (
                                  <AudioIcon sx={{ fontSize: '1rem' }} />
                                ) : (
                                  <ImageIcon sx={{ fontSize: '1rem' }} />
                                )}
                              </Badge>
                            </IconButton>
                          </Tooltip>
                        ) : (
                          <Typography variant="caption" sx={{ color: alpha(theme.palette.text.secondary, 0.3) }}>—</Typography>
                        )}
                      </TableCell>

                      {/* Date */}
                      <TableCell>
                        <Stack spacing={0}>
                          <Typography variant="caption" sx={{ whiteSpace: 'nowrap', fontSize: '0.6875rem', color: alpha(theme.palette.text.primary, 0.75), fontWeight: 500 }}>
                            {format(new Date(report.created_at), 'MMM dd, yyyy')}
                          </Typography>
                          <Typography variant="caption" sx={{ whiteSpace: 'nowrap', fontSize: '0.6rem', color: alpha(theme.palette.text.secondary, 0.5) }}>
                            {format(new Date(report.created_at), 'HH:mm')}
                          </Typography>
                        </Stack>
                      </TableCell>

                      {/* Actions */}
                      <TableCell align="center">
                        {isPending ? (
                          <Stack direction="row" spacing={0.5} justifyContent="center">
                            <Tooltip title="Verify" arrow>
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
                                    bgcolor: alpha(theme.palette.success.main, 0.06),
                                    border: `1px solid ${alpha(theme.palette.success.main, 0.15)}`,
                                    '&:hover': { bgcolor: alpha(theme.palette.success.main, 0.14), borderColor: alpha(theme.palette.success.main, 0.3) },
                                    width: 28, height: 28,
                                    transition: 'all 0.15s ease',
                                  }}
                                >
                                  {statusUpdatingId === report.id ? <CircularProgress size={14} /> : <CheckCircleIcon sx={{ fontSize: '0.9rem' }} />}
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title="Reject" arrow>
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
                                    color: alpha(theme.palette.error.main, 0.7),
                                    bgcolor: alpha(theme.palette.error.main, 0.04),
                                    border: `1px solid ${alpha(theme.palette.error.main, 0.1)}`,
                                    '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.1), borderColor: alpha(theme.palette.error.main, 0.25), color: theme.palette.error.main },
                                    width: 28, height: 28,
                                    transition: 'all 0.15s ease',
                                  }}
                                >
                                  {statusUpdatingId === report.id ? <CircularProgress size={14} /> : <CancelIcon sx={{ fontSize: '0.9rem' }} />}
                                </IconButton>
                              </span>
                            </Tooltip>
                          </Stack>
                        ) : (
                          <Chip
                            label={report.status.toUpperCase()}
                            size="small"
                            sx={{
                              fontWeight: 600, fontSize: '0.55rem', height: 18,
                              bgcolor: isVerified ? alpha(theme.palette.success.main, 0.08)
                                : isRejected ? alpha(theme.palette.error.main, 0.06)
                                  : alpha(theme.palette.info.main, 0.08),
                              color: isVerified ? alpha(theme.palette.success.main, 0.8)
                                : isRejected ? alpha(theme.palette.error.main, 0.65)
                                  : alpha(theme.palette.info.main, 0.8),
                              border: 'none',
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
              py: 0.75,
              borderTop: `1px solid ${alpha(theme.palette.divider, 0.06)}`,
              bgcolor: alpha(theme.palette.grey[50], 0.3),
            }}
          >
            <Typography variant="caption" fontWeight={600} sx={{ color: alpha(theme.palette.text.secondary, 0.6), fontSize: '0.75rem' }}>
              {totalCount.toLocaleString()} reports
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
              sx={{ border: 'none', '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': { fontSize: '0.75rem', color: alpha(theme.palette.text.secondary, 0.7) } }}
            />
          </Box>
        </Box>

        {/* Filter Drawer */}
        <Drawer
          anchor="right"
          open={filterDrawerOpen}
          onClose={() => setFilterDrawerOpen(false)}
          PaperProps={{ sx: { width: 380, borderRadius: '16px 0 0 16px', border: 'none', boxShadow: `0 8px 40px ${alpha(theme.palette.common.black, 0.12)}` } }}
        >
          <Box sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Box>
                <Typography variant="subtitle1" fontWeight={700} sx={{ fontSize: '1.05rem' }}>
                  Filters
                </Typography>
                <Typography variant="caption" sx={{ color: alpha(theme.palette.text.secondary, 0.6) }}>
                  Narrow down your reports
                </Typography>
              </Box>
              <IconButton onClick={() => setFilterDrawerOpen(false)} size="small" sx={{ bgcolor: alpha(theme.palette.grey[200], 0.5), '&:hover': { bgcolor: alpha(theme.palette.grey[200], 0.8) } }}>
                <CloseIcon sx={{ fontSize: '1.1rem' }} />
              </IconButton>
            </Box>

            <Stack spacing={2.5}>
              {/* Hazard Types */}
              <FormControl fullWidth size="small">
                <InputLabel>Hazard Types</InputLabel>
                <Select
                  multiple
                  value={filters.hazardTypes || []}
                  onChange={(e) => setFilters({ ...filters, hazardTypes: e.target.value as HazardType[] })}
                  input={<OutlinedInput label="Hazard Types" />}
                  sx={{ borderRadius: '10px' }}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" sx={{ height: 20, fontSize: '0.7rem' }} />
                      ))}
                    </Box>
                  )}
                >
                  {HAZARD_TYPES.map((type) => (
                    <MenuItem key={type} value={type}>
                      <Checkbox checked={(filters.hazardTypes || []).indexOf(type) > -1} size="small" />
                      <ListItemText primary={type} primaryTypographyProps={{ fontSize: '0.8125rem' }} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Statuses */}
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  multiple
                  value={filters.statuses || []}
                  onChange={(e) => setFilters({ ...filters, statuses: e.target.value as ReportStatus[] })}
                  input={<OutlinedInput label="Status" />}
                  sx={{ borderRadius: '10px' }}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value.toUpperCase()} size="small" sx={{ height: 20, fontSize: '0.7rem' }} />
                      ))}
                    </Box>
                  )}
                >
                  {STATUSES.map((status) => (
                    <MenuItem key={status} value={status}>
                      <Checkbox checked={(filters.statuses || []).indexOf(status) > -1} size="small" />
                      <ListItemText primary={status.toUpperCase()} primaryTypographyProps={{ fontSize: '0.8125rem' }} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Urgency Levels */}
              <FormControl fullWidth size="small">
                <InputLabel>Urgency Level</InputLabel>
                <Select
                  multiple
                  value={filters.urgencyLevels || []}
                  onChange={(e) => setFilters({ ...filters, urgencyLevels: e.target.value as UrgencyLevel[] })}
                  input={<OutlinedInput label="Urgency Level" />}
                  sx={{ borderRadius: '10px' }}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" sx={{ height: 20, fontSize: '0.7rem' }} />
                      ))}
                    </Box>
                  )}
                >
                  {URGENCY_LEVELS.map((level) => (
                    <MenuItem key={level} value={level}>
                      <Checkbox checked={(filters.urgencyLevels || []).indexOf(level) > -1} size="small" />
                      <ListItemText primary={level} primaryTypographyProps={{ fontSize: '0.8125rem' }} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Divider sx={{ borderColor: alpha(theme.palette.divider, 0.06) }} />

              {/* Risk Level */}
              <FormControl fullWidth size="small">
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
                  sx={{ borderRadius: '10px' }}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="high">High Risk Only</MenuItem>
                  <MenuItem value="normal">Normal Risk Only</MenuItem>
                </Select>
              </FormControl>

              {/* Media Filter */}
              <FormControl fullWidth size="small">
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
                  sx={{ borderRadius: '10px' }}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="with">With Media Only</MenuItem>
                  <MenuItem value="without">Without Media</MenuItem>
                </Select>
              </FormControl>

              <Divider sx={{ borderColor: alpha(theme.palette.divider, 0.06) }} />

              {/* Landmark Filter */}
              <FormControl fullWidth size="small">
                <InputLabel>Filter by Landmark</InputLabel>
                <Select
                  value={filters.landmarkId || ''}
                  onChange={(e) => setFilters({ ...filters, landmarkId: e.target.value || null })}
                  label="Filter by Landmark"
                  sx={{ borderRadius: '10px' }}
                >
                  <MenuItem value="">
                    <em>All Locations</em>
                  </MenuItem>
                  {landmarks.map((landmark) => (
                    <MenuItem key={landmark.id} value={landmark.id}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <PlaceIcon sx={{ fontSize: '1rem' }} />
                        {landmark.name}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {filters.landmarkId && (
                <TextField
                  fullWidth
                  size="small"
                  label="Search Radius"
                  type="number"
                  value={filters.landmarkRadius || 5000}
                  onChange={(e) => setFilters({ ...filters, landmarkRadius: parseInt(e.target.value) })}
                  inputProps={{ min: 100, step: 100 }}
                  helperText="Radius in meters from the landmark"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                  InputProps={{
                    endAdornment: <InputAdornment position="end"><Typography variant="caption" sx={{ fontSize: '0.7rem', color: alpha(theme.palette.text.secondary, 0.5) }}>meters</Typography></InputAdornment>,
                  }}
                />
              )}

              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  size="small"
                  startIcon={<PlaceIcon sx={{ fontSize: '0.85rem !important' }} />}
                  onClick={() => setLandmarkManagerOpen(true)}
                  sx={{
                    fontSize: '0.75rem',
                    color: alpha(theme.palette.text.secondary, 0.6),
                    textTransform: 'none',
                    fontWeight: 600,
                    '&:hover': { color: 'primary.main', bgcolor: 'transparent' }
                  }}
                >
                  Manage Landmarks
                </Button>
              </Box>

              <Divider sx={{ borderColor: alpha(theme.palette.divider, 0.06) }} />

              <Alert severity="info" sx={{ borderRadius: '10px', fontSize: '0.75rem', '& .MuiAlert-icon': { fontSize: '1.1rem' } }}>
                Day-based date filtering is available from the <strong>Day Filter</strong> button in the top bar.
              </Alert>
            </Stack>

            <Box mt={3} display="flex" gap={1.5}>
              <Button
                fullWidth
                variant="outlined"
                onClick={handleResetFilters}
                sx={{ borderRadius: '10px', borderColor: alpha(theme.palette.grey[300], 0.8), color: 'text.secondary', textTransform: 'none', fontWeight: 600, py: 1 }}
              >
                Reset All
              </Button>
              <Button
                fullWidth
                variant="contained"
                onClick={handleApplyFilters}
                sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, py: 1, boxShadow: 'none', '&:hover': { boxShadow: 'none' } }}
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
          PaperProps={{ sx: { borderRadius: '16px', overflow: 'hidden' } }}
        >
          {selectedReport && (
            <>
              <DialogTitle sx={{ pb: 1.5 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="subtitle1" fontWeight={700} sx={{ fontSize: '1.05rem' }}>
                    Report Details
                  </Typography>
                  <IconButton onClick={() => setDetailDialogOpen(false)} size="small" sx={{ bgcolor: alpha(theme.palette.grey[200], 0.5), '&:hover': { bgcolor: alpha(theme.palette.grey[200], 0.8) } }}>
                    <CloseIcon sx={{ fontSize: '1.1rem' }} />
                  </IconButton>
                </Box>
              </DialogTitle>
              <DialogContent dividers sx={{ borderColor: alpha(theme.palette.divider, 0.08) }}>
                <Stack spacing={2.5}>
                  {/* Status and Risk Badges */}
                  <Box display="flex" gap={0.75} flexWrap="wrap">
                    <Chip label={selectedReport.status.toUpperCase()} color={getStatusColor(selectedReport.status)} size="small" sx={{ fontWeight: 600, fontSize: '0.7rem' }} />
                    <Chip label={selectedReport.hazard_type} size="small" sx={{ fontWeight: 600, fontSize: '0.7rem', bgcolor: alpha(getHazardColor(selectedReport.hazard_type), 0.1), color: getHazardColor(selectedReport.hazard_type), border: 'none' }} />
                    {selectedReport.is_high_risk && (
                      <Chip icon={<WarningIcon sx={{ fontSize: '0.85rem !important' }} />} label="HIGH RISK" color="error" size="small" sx={{ fontWeight: 700, fontSize: '0.7rem' }} />
                    )}
                    {selectedReport.urgency_level && (
                      <Chip label={selectedReport.urgency_level} color={getUrgencyColor(selectedReport.urgency_level)} size="small" sx={{ fontWeight: 600, fontSize: '0.7rem', bgcolor: 'transparent' }} variant="outlined" />
                    )}
                  </Box>

                  {/* Description */}
                  <Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                      <Typography variant="caption" fontWeight={600} sx={{ color: alpha(theme.palette.text.secondary, 0.6), textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.65rem' }}>
                        Description
                      </Typography>
                      <Stack direction="row" spacing={0.75} alignItems="center">
                        <Chip
                          size="small"
                          label={getTranslationStatusMeta(selectedReport.translation_status).label}
                          color={getTranslationStatusMeta(selectedReport.translation_status).color}
                          variant={getTranslationStatusMeta(selectedReport.translation_status).color === 'default' ? 'outlined' : 'filled'}
                          sx={{ height: 22, fontSize: '0.65rem', fontWeight: 600 }}
                        />
                        {selectedReport.detected_language && (
                          <Chip
                            size="small"
                            icon={<TranslateIcon sx={{ fontSize: '0.8rem !important' }} />}
                            label={getLanguageLabel(selectedReport.detected_language)}
                            sx={{ height: 22, fontSize: '0.65rem', fontWeight: 600 }}
                          />
                        )}
                        {selectedReport.translated_english?.trim() &&
                          selectedReport.translated_english.trim() != selectedReport.description.trim() && (
                            <Tooltip title={showOriginalDescription ? 'Show English translation' : 'Show original text'}>
                              <IconButton
                                size="small"
                                onClick={() => setShowOriginalDescription((prev) => !prev)}
                                sx={{
                                  width: 24,
                                  height: 24,
                                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                                  '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.16) },
                                }}
                              >
                                <TextSnippetIcon sx={{ fontSize: '0.9rem', color: theme.palette.primary.main }} />
                              </IconButton>
                            </Tooltip>
                          )}
                        {(selectedReport.translation_status === 'processing' || translatingReportId === selectedReport.id) && (
                          <CircularProgress size={16} />
                        )}
                        {selectedReport.translation_status === 'failed' && translatingReportId !== selectedReport.id && (
                          <Tooltip title="Retry translation">
                            <IconButton
                              size="small"
                              onClick={() => void ensureReportTranslation(selectedReport, { force: true })}
                              sx={{
                                width: 24,
                                height: 24,
                                bgcolor: alpha(theme.palette.error.main, 0.08),
                                '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.16) },
                              }}
                            >
                              <RefreshIcon sx={{ fontSize: '0.9rem', color: theme.palette.error.main }} />
                            </IconButton>
                          </Tooltip>
                        )}
                        {(selectedReport.translation_status === 'skipped' || !selectedReport.translation_status) &&
                          translatingReportId !== selectedReport.id && (
                          <Tooltip title="Translate anyway">
                            <IconButton
                              size="small"
                              onClick={() => void ensureReportTranslation(selectedReport, { force: true })}
                              sx={{
                                width: 24,
                                height: 24,
                                bgcolor: alpha(theme.palette.primary.main, 0.08),
                                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.16) },
                              }}
                            >
                              <TranslateIcon sx={{ fontSize: '0.9rem', color: theme.palette.primary.main }} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Stack>
                    </Box>
                    <Paper variant="outlined" sx={{ p: 2, mt: 0.5, borderRadius: '10px', borderColor: alpha(theme.palette.divider, 0.1), bgcolor: alpha(theme.palette.grey[50], 0.3) }}>
                      {selectedReport.translated_english?.trim() &&
                      selectedReport.translated_english.trim() != selectedReport.description.trim() ? (
                        <>
                          <Typography
                            variant="caption"
                            sx={{ display: 'block', mb: 1, color: alpha(theme.palette.text.secondary, 0.65) }}
                          >
                            {showOriginalDescription
                              ? `Original ${getLanguageLabel(selectedReport.detected_language)} text`
                              : `English translation from ${getLanguageLabel(selectedReport.detected_language)}`}
                          </Typography>
                          <Typography variant="body2" sx={{ lineHeight: 1.6, color: alpha(theme.palette.text.primary, 0.85) }}>
                            {showOriginalDescription
                              ? selectedReport.description
                              : selectedReport.translated_english}
                          </Typography>
                        </>
                      ) : selectedReport.translation_status === 'pending' ? (
                        <>
                          <Typography
                            variant="caption"
                            sx={{ display: 'block', mb: 1, color: alpha(theme.palette.warning.dark, 0.75) }}
                          >
                            Translation is queued. The original message is shown until English text is ready.
                          </Typography>
                          <Typography variant="body2" sx={{ lineHeight: 1.6, color: alpha(theme.palette.text.primary, 0.85) }}>
                            {selectedReport.description}
                          </Typography>
                        </>
                      ) : selectedReport.translation_status === 'processing' ? (
                        <>
                          <Typography
                            variant="caption"
                            sx={{ display: 'block', mb: 1, color: alpha(theme.palette.info.main, 0.75) }}
                          >
                            Translation is in progress. The original message is shown until English text is ready.
                          </Typography>
                          <Typography variant="body2" sx={{ lineHeight: 1.6, color: alpha(theme.palette.text.primary, 0.85) }}>
                            {selectedReport.description}
                          </Typography>
                        </>
                      ) : selectedReport.translation_status === 'failed' ? (
                        <>
                          <Typography
                            variant="caption"
                            sx={{ display: 'block', mb: 1, color: alpha(theme.palette.error.main, 0.75) }}
                          >
                            Translation failed{selectedReport.translation_last_error ? `: ${selectedReport.translation_last_error}` : '.'}
                          </Typography>
                          <Typography variant="body2" sx={{ lineHeight: 1.6, color: alpha(theme.palette.text.primary, 0.85) }}>
                            {selectedReport.description}
                          </Typography>
                        </>
                      ) : (
                        <Typography variant="body2" sx={{ lineHeight: 1.6, color: alpha(theme.palette.text.primary, 0.85) }}>
                          {selectedReport.description}
                        </Typography>
                      )}
                    </Paper>
                  </Box>

                  {/* Location */}
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" fontWeight={600} sx={{ color: alpha(theme.palette.text.secondary, 0.6), textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.65rem' }}>
                        Latitude
                      </Typography>
                      <Typography variant="body2" fontWeight={600} sx={{ mt: 0.25, fontFamily: '"JetBrains Mono", monospace' }}>
                        {selectedReport.latitude.toFixed(6)}°N
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" fontWeight={600} sx={{ color: alpha(theme.palette.text.secondary, 0.6), textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.65rem' }}>
                        Longitude
                      </Typography>
                      <Typography variant="body2" fontWeight={600} sx={{ mt: 0.25, fontFamily: '"JetBrains Mono", monospace' }}>
                        {selectedReport.longitude.toFixed(6)}°E
                      </Typography>
                    </Grid>
                  </Grid>

                  {/* Risk Info */}
                  {selectedReport.people_at_risk && selectedReport.people_at_risk > 0 && (
                    <Box>
                      <Typography variant="caption" fontWeight={600} sx={{ color: alpha(theme.palette.text.secondary, 0.6), textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.65rem' }}>
                        People at Risk
                      </Typography>
                      <Box sx={{ mt: 0.5 }}>
                        <Chip
                          icon={<PeopleIcon sx={{ fontSize: '0.9rem !important' }} />}
                          label={`${selectedReport.people_at_risk} people`}
                          size="small"
                          sx={{ fontWeight: 600, bgcolor: alpha(theme.palette.error.main, 0.06), color: theme.palette.error.main, border: 'none', '& .MuiChip-icon': { color: alpha(theme.palette.error.main, 0.7) } }}
                        />
                      </Box>
                    </Box>
                  )}

                  {/* User Info */}
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" fontWeight={600} sx={{ color: alpha(theme.palette.text.secondary, 0.6), textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.65rem' }}>
                        Reporter Name
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.25 }}>
                        {selectedReport.user_name || 'Anonymous'}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" fontWeight={600} sx={{ color: alpha(theme.palette.text.secondary, 0.6), textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.65rem' }}>
                        Phone Number
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.25, fontFamily: '"JetBrains Mono", monospace' }}>
                        {safeMaskPhone(selectedReport.user_phone)}
                      </Typography>
                    </Grid>
                  </Grid>

                  {/* Timestamps */}
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" fontWeight={600} sx={{ color: alpha(theme.palette.text.secondary, 0.6), textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.65rem' }}>
                        Event Time
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.25 }}>
                        {format(new Date(selectedReport.event_time), 'PPpp')}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" fontWeight={600} sx={{ color: alpha(theme.palette.text.secondary, 0.6), textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.65rem' }}>
                        Reported At
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.25 }}>
                        {format(new Date(selectedReport.created_at), 'PPpp')}
                      </Typography>
                    </Grid>
                  </Grid>

                  {/* Media */}
                  {selectedReport.media_urls && selectedReport.media_urls.length > 0 && (
                    <Box>
                      <Typography variant="caption" fontWeight={600} sx={{ color: alpha(theme.palette.text.secondary, 0.6), textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.65rem' }}>
                        Media Attachments ({selectedReport.media_urls.length})
                      </Typography>
                      <Grid container spacing={1.5} sx={{ mt: 0.5 }}>
                        {selectedReport.media_urls.map((url, idx) => (
                          <Grid size={{ xs: 12, md: looksLikeAudio(url) ? 12 : 6 }} key={idx}>
                            <Box sx={{ p: 1.5, border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, borderRadius: '10px', bgcolor: alpha(theme.palette.grey[50], 0.3) }}>
                              <Typography variant="caption" sx={{ color: alpha(theme.palette.text.secondary, 0.5), mb: 1, display: 'block', fontSize: '0.65rem' }}>
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
                  <Divider sx={{ borderColor: alpha(theme.palette.divider, 0.06) }} />
                  <Box>
                    <Typography variant="caption" fontWeight={600} sx={{ color: alpha(theme.palette.text.secondary, 0.6), textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <HistoryIcon sx={{ fontSize: '0.85rem' }} /> Audit Trail
                    </Typography>
                    {loadingAudit ? (
                      <CircularProgress size={20} sx={{ mt: 1 }} />
                    ) : auditLogs.length === 0 ? (
                      <Typography variant="caption" sx={{ mt: 1, display: 'block', fontStyle: 'italic', color: alpha(theme.palette.text.secondary, 0.5) }}>
                        No status changes recorded yet.
                      </Typography>
                    ) : (
                      <Stack spacing={0.75} sx={{ mt: 1 }}>
                        {auditLogs.map((log) => (
                          <Paper key={log.id} variant="outlined" sx={{ p: 1.25, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '10px', borderColor: alpha(theme.palette.divider, 0.1), bgcolor: alpha(theme.palette.grey[50], 0.2) }}>
                            <Box>
                              <Typography variant="caption" fontWeight={600} sx={{ fontSize: '0.75rem' }}>
                                {log.admin_email}
                              </Typography>
                              <Typography variant="caption" sx={{ display: 'block', color: alpha(theme.palette.text.secondary, 0.5), fontSize: '0.65rem' }}>
                                {format(new Date(log.changed_at), 'PPpp')}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Chip size="small" variant="outlined" label={log.old_status.toUpperCase()} sx={{ fontSize: '0.6rem', height: 20, borderColor: alpha(theme.palette.divider, 0.2) }} />
                              <NavigateNextIcon sx={{ fontSize: '0.85rem', color: alpha(theme.palette.text.secondary, 0.35) }} />
                              <Chip size="small" label={log.new_status.toUpperCase()} color={getStatusColor(log.new_status)} sx={{ fontSize: '0.6rem', height: 20 }} />
                            </Box>
                          </Paper>
                        ))}
                      </Stack>
                    )}
                  </Box>
                </Stack>
              </DialogContent>
              <DialogActions sx={{ px: 2.5, py: 1.5, borderTop: `1px solid ${alpha(theme.palette.divider, 0.06)}` }}>
                {selectedReport.status === 'pending' && (
                  <Stack direction="row" spacing={1} sx={{ mr: 'auto' }}>
                    <Button
                      variant="contained"
                      color="success"
                      size="small"
                      startIcon={<CheckCircleIcon sx={{ fontSize: '1rem !important' }} />}
                      disabled={statusUpdatingId === selectedReport.id}
                      onClick={() => updateStatus(selectedReport, 'verified')}
                      sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, px: 2 }}
                    >
                      Accept
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      startIcon={<CancelIcon sx={{ fontSize: '1rem !important' }} />}
                      disabled={statusUpdatingId === selectedReport.id}
                      onClick={() => updateStatus(selectedReport, 'rejected')}
                      sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, px: 2 }}
                    >
                      Reject
                    </Button>
                  </Stack>
                )}
                <Button onClick={() => setDetailDialogOpen(false)} sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}>Close</Button>
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

