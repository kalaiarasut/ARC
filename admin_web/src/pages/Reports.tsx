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
  Skeleton,
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
  OutlinedFlag as OutlinedFlagIcon,
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
import {
  hazardService,
  type AiAttentionQueueItem,
  type AiScoringQueueStats,
  type FailedTranslationQueueItem,
  type TranslationQueueStats,
} from '../services/hazardService';
import { isSupabaseConfigured } from '../core/supabase_config';
import type {
  HazardReport,
  FilterOptions,
  HazardType,
  UrgencyLevel,
  ReportStatus,
  ReportAuditLog,
  ReportAiScoreBucket,
  ReportIntegritySeverity,
  ReportIntegritySignal,
  ReportSubmissionEvent,
  DuplicateClusterMember,
} from '../types/hazard';
import type { Landmark } from '../types/landmark';
import { LandmarkManager } from '../components/LandmarkManager';
import { format } from 'date-fns';

const HAZARD_TYPES: HazardType[] = ['High Waves', 'Tsunami', 'Storm', 'Flood', 'Other'];
const URGENCY_LEVELS: UrgencyLevel[] = ['Low', 'Medium', 'High'];
const STATUSES: ReportStatus[] = ['pending', 'verified', 'rejected', 'resolved'];
const SCORE_BUCKETS: ReportAiScoreBucket[] = ['critical', 'high', 'medium', 'low'];
const INTEGRITY_SEVERITIES: ReportIntegritySeverity[] = ['critical', 'high', 'medium', 'low'];

export function Reports() {
  const navigate = useNavigate();
  const theme = useTheme();
  const [reports, setReports] = useState<HazardReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
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
  const [loadingIntegrityDetails, setLoadingIntegrityDetails] = useState(false);
  const [integritySignals, setIntegritySignals] = useState<ReportIntegritySignal[]>([]);
  const [submissionEvents, setSubmissionEvents] = useState<ReportSubmissionEvent[]>([]);
  const [duplicateClusterMembers, setDuplicateClusterMembers] = useState<DuplicateClusterMember[]>([]);
  const [translatingReportId, setTranslatingReportId] = useState<string | null>(null);
  const [showOriginalDescription, setShowOriginalDescription] = useState(false);
  const [translationQueueStats, setTranslationQueueStats] = useState<TranslationQueueStats | null>(null);
  const [translationQueueLoading, setTranslationQueueLoading] = useState(false);
  const [failedTranslationsDrawerOpen, setFailedTranslationsDrawerOpen] = useState(false);
  const [failedTranslationReports, setFailedTranslationReports] = useState<FailedTranslationQueueItem[]>([]);
  const [failedTranslationsLoading, setFailedTranslationsLoading] = useState(false);
  const [retryingAllFailed, setRetryingAllFailed] = useState(false);
  const [retryingFailedIds, setRetryingFailedIds] = useState<string[]>([]);
  const [aiQueueStats, setAiQueueStats] = useState<AiScoringQueueStats | null>(null);
  const [aiQueueLoading, setAiQueueLoading] = useState(false);
  const [aiAttentionDrawerOpen, setAiAttentionDrawerOpen] = useState(false);
  const [aiAttentionReports, setAiAttentionReports] = useState<AiAttentionQueueItem[]>([]);
  const [aiAttentionLoading, setAiAttentionLoading] = useState(false);
  const [runningAiWorker, setRunningAiWorker] = useState(false);
  const [runningVideoAiWorkflow, setRunningVideoAiWorkflow] = useState(false);
  const [analyzingReportId, setAnalyzingReportId] = useState<string | null>(null);
  const selectedReportId = selectedReport?.id ?? null;
  const selectedTranslationStatus = selectedReport?.translation_status ?? null;
  const reportsLoadInFlightRef = useRef(false);
  const translationQueueLoadInFlightRef = useRef(false);
  const aiQueueLoadInFlightRef = useRef(false);
  const failedTranslationsLoadInFlightRef = useRef(false);
  const aiAttentionLoadInFlightRef = useRef(false);

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
    suspiciousOnly: null,
    duplicateOnly: null,
    sharedDeviceOnly: null,
    sortBy: 'newest',
    scoreBuckets: [],
    integritySeverities: [],
  });

  const loadReports = async (options?: { silent?: boolean }) => {
    if (options?.silent && reportsLoadInFlightRef.current) {
      return;
    }

    reportsLoadInFlightRef.current = true;
    try {
      if (!options?.silent) {
        setLoading(true);
      }
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
      reportsLoadInFlightRef.current = false;
      if (!options?.silent) {
        setLoading(false);
      }
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
    const path = lower.split('?')[0]?.split('#')[0] || lower;
    return (
      lower.includes('video') ||
      path.endsWith('.mp4') ||
      path.endsWith('.mov') ||
      path.endsWith('.webm') ||
      path.endsWith('.ogv') ||
      path.endsWith('.ogg')
    );
  };

  const loadTranslationQueueStats = async (options?: { silent?: boolean }) => {
    if (options?.silent && translationQueueLoadInFlightRef.current) {
      return;
    }

    translationQueueLoadInFlightRef.current = true;
    try {
      if (!options?.silent) {
        setTranslationQueueLoading(true);
      }

      const stats = await hazardService.getTranslationQueueStats();
      setTranslationQueueStats(stats);
    } catch (queueError) {
      console.error(queueError);
    } finally {
      translationQueueLoadInFlightRef.current = false;
      if (!options?.silent) {
        setTranslationQueueLoading(false);
      }
    }
  };

  const loadFailedTranslationReports = async (options?: { silent?: boolean }) => {
    if (options?.silent && failedTranslationsLoadInFlightRef.current) {
      return;
    }

    failedTranslationsLoadInFlightRef.current = true;
    try {
      if (!options?.silent) {
        setFailedTranslationsLoading(true);
      }

      const failedReports = await hazardService.getFailedTranslationReports();
      setFailedTranslationReports(failedReports);
    } catch (failedError) {
      console.error(failedError);
    } finally {
      failedTranslationsLoadInFlightRef.current = false;
      if (!options?.silent) {
        setFailedTranslationsLoading(false);
      }
    }
  };

  const loadAiQueueStats = async (options?: { silent?: boolean }) => {
    if (options?.silent && aiQueueLoadInFlightRef.current) {
      return;
    }

    aiQueueLoadInFlightRef.current = true;
    try {
      if (!options?.silent) {
        setAiQueueLoading(true);
      }

      const stats = await hazardService.getAiQueueStats();
      setAiQueueStats(stats);
    } catch (queueError) {
      console.error(queueError);
    } finally {
      aiQueueLoadInFlightRef.current = false;
      if (!options?.silent) {
        setAiQueueLoading(false);
      }
    }
  };

  const loadAiAttentionReports = async (options?: { silent?: boolean }) => {
    if (options?.silent && aiAttentionLoadInFlightRef.current) {
      return;
    }

    aiAttentionLoadInFlightRef.current = true;
    try {
      if (!options?.silent) {
        setAiAttentionLoading(true);
      }

      const reportsNeedingAttention = await hazardService.getAiAttentionReports();
      setAiAttentionReports(reportsNeedingAttention);
    } catch (attentionError) {
      console.error(attentionError);
    } finally {
      aiAttentionLoadInFlightRef.current = false;
      if (!options?.silent) {
        setAiAttentionLoading(false);
      }
    }
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
        'immediate_danger_status',
        'urgency_level',
        'people_at_risk',
        'affected_people_band',
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
  const loadTranslationQueueStatsRef = useRef(loadTranslationQueueStats);
  const loadAiQueueStatsRef = useRef(loadAiQueueStats);
  useEffect(() => {
    loadReportsRef.current = loadReports;
  });
  useEffect(() => {
    loadTranslationQueueStatsRef.current = loadTranslationQueueStats;
  });
  useEffect(() => {
    loadAiQueueStatsRef.current = loadAiQueueStats;
  });

  // Realtime updates: refresh on new reports.
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const channel = hazardService.subscribeToReports(() => {
      void loadReportsRef.current({ silent: true });
      void loadTranslationQueueStatsRef.current({ silent: true });
      void loadAiQueueStatsRef.current({ silent: true });
    });

    return () => {
      channel.unsubscribe();
    };
    // Subscribe once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadReports();
    void loadTranslationQueueStats({ silent: true });
    void loadAiQueueStats({ silent: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage]); // Removed filters from dep array to match original behavior where explicit search/filter button is needed, or add if auto-filtering is desired. Original only had page/rows.

  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const id = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      void loadTranslationQueueStatsRef.current({ silent: true });
      void loadAiQueueStatsRef.current({ silent: true });
    }, 15000);

    return () => window.clearInterval(id);
  }, []);

  // Auto-search effect with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      // Only reload if query changed or if we need to applying new filters (logic is simplified here for instant search)
      // Note: We might want to avoid initial double load since loadReports is called on mount.
      // But checking if query is different from previous ref would be better.
      // For now, simple debounce for search query changes:
      setPage(0);
      void loadReports({ silent: true });
    }, 100); // 100ms debounce for fast search
    return () => clearTimeout(timer);
  }, [filters.searchQuery]);

  // Continuous sync loop. "Live" mode runs faster, but even when disabled
  // we still refresh periodically so records/translations appear without page reload.
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const intervalMs = autoRefreshEnabled ? 5000 : 12000;
    const id = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      if (detailDialogOpen || failedTranslationsDrawerOpen || aiAttentionDrawerOpen) return;
      void loadReportsRef.current({ silent: true });
      void loadTranslationQueueStatsRef.current({ silent: true });
      void loadAiQueueStatsRef.current({ silent: true });
    }, intervalMs);

    return () => window.clearInterval(id);
  }, [autoRefreshEnabled, detailDialogOpen, failedTranslationsDrawerOpen, aiAttentionDrawerOpen]);

  // Keep the detail dialog report in sync with table refreshes.
  useEffect(() => {
    if (!detailDialogOpen || !selectedReportId) return;

    const refreshed = reports.find((report) => report.id === selectedReportId);
    if (!refreshed) return;

    setSelectedReport((prev) => (prev && prev.id === selectedReportId ? { ...prev, ...refreshed } : prev));
  }, [detailDialogOpen, reports, selectedReportId]);

  // While translation is queued/processing, poll the selected row for live status.
  useEffect(() => {
    if (!detailDialogOpen || !selectedReportId) return;
    if (!isSupabaseConfigured()) return;

    const isLiveTranslationState =
      selectedTranslationStatus === 'pending' ||
      selectedTranslationStatus === 'processing' ||
      translatingReportId === selectedReportId;
    if (!isLiveTranslationState) return;

    let active = true;

    const refreshSelectedReport = async () => {
      try {
        const latest = await hazardService.getReportById(selectedReportId);
        if (!active || !latest) return;

        setSelectedReport((prev) => (prev && prev.id === latest.id ? { ...prev, ...latest } : prev));
        setReports((prev) => prev.map((item) => (item.id === latest.id ? { ...item, ...latest } : item)));

        if (
          latest.translation_status &&
          latest.translation_status !== 'pending' &&
          latest.translation_status !== 'processing' &&
          translatingReportId === latest.id
        ) {
          setTranslatingReportId(null);
        }
      } catch (pollError) {
        console.error(pollError);
      }
    };

    void refreshSelectedReport();
    const timerId = window.setInterval(() => {
      void refreshSelectedReport();
    }, 2500);

    return () => {
      active = false;
      window.clearInterval(timerId);
    };
  }, [detailDialogOpen, selectedReportId, selectedTranslationStatus, translatingReportId]);

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
      suspiciousOnly: null,
      duplicateOnly: null,
      sharedDeviceOnly: null,
      sortBy: 'newest',
      scoreBuckets: [],
      integritySeverities: [],
    });
    setSelectedDay(new Date());
    setShowDayCalendar(false);
  };

  const handleLandmarkUpdate = () => {
    setLandmarks(landmarkService.getLandmarks());
  };

  const openReportDetailsById = async (reportId: string) => {
    const latest = await hazardService.getReportById(reportId);
    if (!latest) {
      throw new Error('Report not found.');
    }
    return latest;
  };

  const handleRowClick = async (report: HazardReport) => {
    setSelectedReport(report);
    setDetailDialogOpen(true);
    setShowOriginalDescription(false);
    setLoadingAudit(true);
    setLoadingIntegrityDetails(true);
    try {
      const [logsResult, signalsResult, submissionEventsResult, duplicateMembersResult] = await Promise.allSettled([
        hazardService.getReportAuditLogs(report.id),
        hazardService.getReportIntegritySignals(report.id),
        hazardService.getReportSubmissionEvents(report.id),
        hazardService.getDuplicateClusterMembers(report.id),
      ]);

      setAuditLogs(logsResult.status === 'fulfilled' ? logsResult.value : []);
      setIntegritySignals(signalsResult.status === 'fulfilled' ? signalsResult.value : []);
      setSubmissionEvents(submissionEventsResult.status === 'fulfilled' ? submissionEventsResult.value : []);
      setDuplicateClusterMembers(duplicateMembersResult.status === 'fulfilled' ? duplicateMembersResult.value : []);
    } catch (e) {
      console.error(e);
      setAuditLogs([]);
      setIntegritySignals([]);
      setSubmissionEvents([]);
      setDuplicateClusterMembers([]);
    } finally {
      setLoadingAudit(false);
      setLoadingIntegrityDetails(false);
    }
  };

  const ensureReportTranslation = async (reportRef: { id: string }, options?: { silent?: boolean; force?: boolean }) => {
    try {
      setTranslatingReportId(reportRef.id);
      const translated = await hazardService.translateReportToEnglish(reportRef.id, {
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

      setReports((prev) => prev.map((item) => (item.id === reportRef.id ? { ...item, ...patch } : item)));
      setSelectedReport((prev) => (prev && prev.id === reportRef.id ? { ...prev, ...patch } : prev));
      void loadTranslationQueueStatsRef.current({ silent: true });
      void loadAiQueueStatsRef.current({ silent: true });
    } catch (e) {
      console.error(e);
      try {
        const latest = await hazardService.getReportById(reportRef.id);
        if (latest) {
          setReports((prev) => prev.map((item) => (item.id === latest.id ? { ...item, ...latest } : item)));
          setSelectedReport((prev) => (prev && prev.id === latest.id ? { ...prev, ...latest } : prev));
          void loadTranslationQueueStatsRef.current({ silent: true });
          void loadAiQueueStatsRef.current({ silent: true });
        }
      } catch (refreshError) {
        console.error(refreshError);
      }
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

  const getImmediateDangerStatus = (report: HazardReport) => {
    if (report.immediate_danger_status) return report.immediate_danger_status;
    if (report.is_high_risk || (report.people_at_risk ?? 0) > 0) return 'yes' as const;
    return 'no' as const;
  };

  const getAffectedPeopleBandLabel = (band?: HazardReport['affected_people_band'] | null) => {
    switch (band) {
      case '1_5':
        return '1-5';
      case '6_20':
        return '6-20';
      case '21_50':
        return '21-50';
      case '50_plus':
        return '50+';
      case 'unknown':
        return 'Unknown';
      default:
        return null;
    }
  };

  const getAffectedNearbyLabel = (report: HazardReport) => {
    const bandLabel = getAffectedPeopleBandLabel(report.affected_people_band);
    if (bandLabel) return bandLabel;
    if (getImmediateDangerStatus(report) === 'yes') return 'Unknown';
    if ((report.people_at_risk ?? 0) > 0) return String(report.people_at_risk);
    return null;
  };

  const isTranslationLive = (report: HazardReport | null) =>
    !!report &&
    (report.translation_status === 'pending' ||
      report.translation_status === 'processing' ||
      translatingReportId === report.id);

  const getTranslationLiveLabel = (report: HazardReport | null) => {
    if (!report) return '';
    if (translatingReportId === report.id || report.translation_status === 'processing') {
      return 'Translating...';
    }
    if (report.translation_status === 'pending') {
      return 'Queued...';
    }
    return '';
  };

  const getTranslationFailureReason = (
    report: Pick<HazardReport, 'translation_last_error' | 'translated_english'>,
  ) => {
    const directError = (report.translation_last_error ?? '').trim();
    if (directError) return directError;

    const translatedText = (report.translated_english ?? '').trim();
    if (!translatedText) return 'Unknown translation error';

    const upper = translatedText.toUpperCase();
    if (
      upper.startsWith('TRANSLATION FAILED') ||
      upper.includes('SARVAM REQUEST FAILED') ||
      upper.includes('SOURCE AND TARGET LANGUAGES MUST BE DIFFERENT')
    ) {
      return translatedText;
    }

    return 'Unknown translation error';
  };

  const getQueueChipSx = (tone: 'warning' | 'info' | 'error' | 'success' | 'default') => ({
    height: 22,
    fontSize: '0.68rem',
    fontWeight: 700,
    border: 'none',
    bgcolor:
      tone === 'warning'
        ? alpha(theme.palette.warning.main, 0.14)
        : tone === 'info'
          ? alpha(theme.palette.info.main, 0.14)
          : tone === 'error'
            ? alpha(theme.palette.error.main, 0.14)
            : tone === 'success'
              ? alpha(theme.palette.success.main, 0.14)
              : alpha(theme.palette.grey[500], 0.12),
    color:
      tone === 'warning'
        ? theme.palette.warning.dark
        : tone === 'info'
          ? theme.palette.info.main
          : tone === 'error'
            ? theme.palette.error.main
            : tone === 'success'
              ? theme.palette.success.main
              : theme.palette.text.secondary,
  });

  const openFailedTranslationsDrawer = () => {
    setFailedTranslationsDrawerOpen(true);
    void loadFailedTranslationReports();
  };

  const closeFailedTranslationsDrawer = () => {
    setFailedTranslationsDrawerOpen(false);
  };

  const handleRetryFailedReport = async (report: FailedTranslationQueueItem) => {
    setRetryingFailedIds((prev) => [...prev, report.id]);
    try {
      await ensureReportTranslation(report, { silent: true, force: true });
      await loadFailedTranslationReports({ silent: true });
      await loadTranslationQueueStats({ silent: true });
      await loadAiQueueStats({ silent: true });
      await loadReports({ silent: true });
    } finally {
      setRetryingFailedIds((prev) => prev.filter((id) => id !== report.id));
    }
  };

  const handleRetryAllFailed = async () => {
    setRetryingAllFailed(true);
    try {
      for (const report of failedTranslationReports) {
        await ensureReportTranslation(report, { silent: true, force: true });
      }
      await loadFailedTranslationReports({ silent: true });
      await loadTranslationQueueStats({ silent: true });
      await loadAiQueueStats({ silent: true });
      await loadReports({ silent: true });
    } finally {
      setRetryingAllFailed(false);
      setRetryingFailedIds([]);
    }
  };

  const handleAnalyzeReportAi = async (report: { id: string }, options?: { force?: boolean }) => {
    setAnalyzingReportId(report.id);
    try {
      const result = await hazardService.analyzeReportAi(report.id, { force: options?.force ?? false });
      setReports((prev) => prev.map((item) => (
        item.id === report.id
          ? { ...item, ai_analysis: result.ai_analysis }
          : item
      )));
      setSelectedReport((prev) => (
        prev && prev.id === report.id
          ? { ...prev, ai_analysis: result.ai_analysis }
          : prev
      ));
      await loadAiQueueStats({ silent: true });
      if (aiAttentionDrawerOpen) {
        await loadAiAttentionReports({ silent: true });
      }
      await loadReports({ silent: true });
    } catch (analysisError) {
      console.error(analysisError);
      setError(analysisError instanceof Error ? analysisError.message : 'Failed to analyze report with AI.');
    } finally {
      setAnalyzingReportId(null);
    }
  };

  const openAiAttentionDrawer = () => {
    setAiAttentionDrawerOpen(true);
    void loadAiAttentionReports();
  };

  const closeAiAttentionDrawer = () => {
    setAiAttentionDrawerOpen(false);
  };

  const handleRunAiWorker = async () => {
    setRunningAiWorker(true);
    try {
      await hazardService.runAiWorker({ limit: 10, concurrency: 2 });
      await loadAiQueueStats({ silent: true });
      if (aiAttentionDrawerOpen) {
        await loadAiAttentionReports({ silent: true });
      }
      await loadReports({ silent: true });
    } catch (workerError) {
      console.error(workerError);
      setError(workerError instanceof Error ? workerError.message : 'Failed to run AI scoring worker.');
    } finally {
      setRunningAiWorker(false);
    }
  };

  const handleTriggerVideoAiWorkflow = async () => {
    setRunningVideoAiWorkflow(true);
    try {
      await hazardService.triggerVideoAiWorkflow({ limit: 5, frameCount: 3 });
    } catch (workflowError) {
      console.error(workflowError);
      setError(workflowError instanceof Error ? workflowError.message : 'Failed to trigger video AI workflow.');
    } finally {
      setRunningVideoAiWorkflow(false);
    }
  };

  const handleOpenDrawerReport = async (reportId: string) => {
    try {
      const report = await openReportDetailsById(reportId);
      await handleRowClick(report);
    } catch (openError) {
      console.error(openError);
      setError(openError instanceof Error ? openError.message : 'Failed to open report details.');
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
    if (filters.sortBy && filters.sortBy !== 'newest') count++;
    if (filters.scoreBuckets && filters.scoreBuckets.length > 0) count++;
    if (filters.suspiciousOnly) count++;
    if (filters.duplicateOnly) count++;
    if (filters.sharedDeviceOnly) count++;
    if (filters.integritySeverities && filters.integritySeverities.length > 0) count++;
    return count;
  };

  const formatAiScore = (report: HazardReport) => {
    const score = report.ai_analysis?.operational_score;
    if (typeof score !== 'number' || Number.isNaN(score)) return '—';
    return Math.round(score).toString();
  };

  const formatIntegrityScore = (report: HazardReport) => {
    const score = report.integrity_snapshot?.integrity_score;
    if (typeof score !== 'number' || Number.isNaN(score)) return '0';
    return Math.round(score).toString();
  };

  const getAiScoreBucketMeta = (bucket?: ReportAiScoreBucket | null) => {
    switch (bucket) {
      case 'critical':
        return {
          label: 'Immediate',
          background: alpha(theme.palette.error.main, 0.1),
          color: theme.palette.error.main,
          border: alpha(theme.palette.error.main, 0.22),
        };
      case 'high':
        return {
          label: 'High',
          background: alpha(theme.palette.warning.main, 0.12),
          color: theme.palette.warning.dark,
          border: alpha(theme.palette.warning.main, 0.24),
        };
      case 'medium':
        return {
          label: 'Medium',
          background: alpha(theme.palette.info.main, 0.08),
          color: theme.palette.info.main,
          border: alpha(theme.palette.info.main, 0.2),
        };
      case 'low':
      default:
        return {
          label: 'Low',
          background: alpha(theme.palette.success.main, 0.08),
          color: theme.palette.success.main,
          border: alpha(theme.palette.success.main, 0.18),
        };
    }
  };

  const getAiAnalysisStatusMeta = (report: HazardReport) => {
    const status = report.ai_analysis?.analysis_status;
    switch (status) {
      case 'completed':
        return {
          label: 'Scored',
          background: alpha(theme.palette.success.main, 0.08),
          color: theme.palette.success.main,
          border: alpha(theme.palette.success.main, 0.18),
        };
      case 'partial':
        return {
          label: 'Provisional',
          background: alpha(theme.palette.warning.main, 0.1),
          color: theme.palette.warning.dark,
          border: alpha(theme.palette.warning.main, 0.22),
        };
      case 'processing':
        return {
          label: 'Scoring',
          background: alpha(theme.palette.info.main, 0.08),
          color: theme.palette.info.main,
          border: alpha(theme.palette.info.main, 0.18),
        };
      case 'failed':
        return {
          label: 'Failed',
          background: alpha(theme.palette.error.main, 0.08),
          color: theme.palette.error.main,
          border: alpha(theme.palette.error.main, 0.22),
        };
      case 'pending':
      default:
        return {
          label: 'Queued',
          background: alpha(theme.palette.grey[500], 0.08),
          color: theme.palette.text.secondary,
          border: alpha(theme.palette.grey[500], 0.18),
        };
    }
  };

  const getAiPriorityDisplayMeta = (report: HazardReport) => {
    const status = report.ai_analysis?.analysis_status;
    if (status === 'completed') {
      return getAiScoreBucketMeta(report.ai_analysis?.score_bucket);
    }

    if (status === 'partial') {
      return {
        label: 'Provisional',
        background: alpha(theme.palette.warning.main, 0.08),
        color: theme.palette.warning.dark,
        border: alpha(theme.palette.warning.main, 0.2),
        helper: null as string | null,
      };
    }

    const statusMeta = getAiAnalysisStatusMeta(report);
    return {
      ...statusMeta,
      helper: null as string | null,
    };
  };

  const getStringArrayFromJson = (value: unknown) =>
    Array.isArray(value)
      ? value.map((item) => String(item).trim()).filter((item) => item.length > 0)
      : [];

  const getAiMediaEvidence = (
    report: HazardReport,
  ): {
    imageSummaries: string[];
    audioSummaries: string[];
    videoSummaries: string[];
    videoFrameSummaries: string[];
    audioTranscripts: string[];
    videoTranscripts: string[];
    imageStatus: string | null;
    audioStatus: string | null;
    videoStatus: string | null;
    videoFrameStatus: string | null;
  } => {
    const mediaEvidence = report.ai_analysis?.media_evidence_json as Record<string, unknown> | null | undefined;
    if (!mediaEvidence) {
      return {
        imageSummaries: [] as string[],
        audioSummaries: [] as string[],
        videoSummaries: [] as string[],
        videoFrameSummaries: [] as string[],
        audioTranscripts: [] as string[],
        videoTranscripts: [] as string[],
        imageStatus: null as string | null,
        audioStatus: null as string | null,
        videoStatus: null as string | null,
        videoFrameStatus: null as string | null,
      };
    }

    return {
      imageSummaries: getStringArrayFromJson(mediaEvidence.image_summaries),
      audioSummaries: getStringArrayFromJson(mediaEvidence.audio_summaries),
      videoSummaries: getStringArrayFromJson(mediaEvidence.video_summaries),
      videoFrameSummaries: getStringArrayFromJson(mediaEvidence.video_frame_summaries),
      audioTranscripts: getStringArrayFromJson(mediaEvidence.audio_transcripts),
      videoTranscripts: getStringArrayFromJson(mediaEvidence.video_transcripts),
      imageStatus: typeof mediaEvidence.image_analysis_status === 'string' ? mediaEvidence.image_analysis_status : null,
      audioStatus: typeof mediaEvidence.audio_analysis_status === 'string' ? mediaEvidence.audio_analysis_status : null,
      videoStatus: typeof mediaEvidence.video_analysis_status === 'string' ? mediaEvidence.video_analysis_status : null,
      videoFrameStatus: typeof mediaEvidence.video_frame_analysis_status === 'string' ? mediaEvidence.video_frame_analysis_status : null,
    };
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

  const getStatusColor = (status: ReportStatus) => {
    const colors = {
      'pending': 'default',
      'verified': 'primary',
      'rejected': 'error',
      'resolved': 'info',
    };
    return colors[status] as any;
  };

  const getIntegritySeverityMeta = (severity?: ReportIntegritySeverity | null) => {
    switch (severity) {
      case 'critical':
        return {
          label: 'Critical',
          color: theme.palette.error.main,
          background: alpha(theme.palette.error.main, 0.1),
          border: alpha(theme.palette.error.main, 0.22),
        };
      case 'high':
        return {
          label: 'High',
          color: theme.palette.warning.dark,
          background: alpha(theme.palette.warning.main, 0.14),
          border: alpha(theme.palette.warning.main, 0.22),
        };
      case 'medium':
        return {
          label: 'Medium',
          color: theme.palette.info.main,
          background: alpha(theme.palette.info.main, 0.1),
          border: alpha(theme.palette.info.main, 0.2),
        };
      case 'low':
        return {
          label: 'Low',
          color: theme.palette.success.main,
          background: alpha(theme.palette.success.main, 0.1),
          border: alpha(theme.palette.success.main, 0.2),
        };
      default:
        return {
          label: 'Clear',
          color: theme.palette.text.secondary,
          background: alpha(theme.palette.grey[500], 0.08),
          border: alpha(theme.palette.grey[500], 0.18),
        };
    }
  };

  const getIntegritySignalLabel = (signalType: string) => {
    const labels: Record<string, string> = {
      rapid_submissions_user: 'Rapid submissions by user',
      high_hourly_volume_user: 'High hourly volume by user',
      rapid_submissions_device: 'Rapid submissions from device',
      device_submission_burst: 'Device burst activity',
      high_hourly_volume_device: 'High device volume',
      multi_account_same_device: 'Shared device across accounts',
      duplicate_exact_text: 'Repeated description',
      duplicate_nearby_recent: 'Nearby recent duplicate',
      duplicate_cluster_member: 'Duplicate cluster member',
    };

    return labels[signalType] || signalType.replace(/_/g, ' ');
  };

  const getIntegrityFlags = (report: HazardReport) => {
    return (report.integrity_snapshot?.active_signal_types || []).map(getIntegritySignalLabel);
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
                borderColor: alpha(theme.palette.text.primary, 0.2),
                color: alpha(theme.palette.text.secondary, 0.7),
                '&:hover': { borderColor: theme.palette.success.main, color: theme.palette.success.main, bgcolor: alpha(theme.palette.success.main, 0.04) },
              }),
            }}
          >
            {autoRefreshEnabled ? 'Live (Fast)' : 'Live (Balanced)'}
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
                    bgcolor: alpha(theme.palette.text.primary, 0.04),
                    fontSize: '0.875rem',
                    '& fieldset': { borderColor: alpha(theme.palette.divider, 0.12) },
                    '&:hover': {
                      bgcolor: alpha(theme.palette.text.primary, 0.08),
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
                  onClick={() => void loadReports()}
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
                      borderColor: alpha(theme.palette.text.primary, 0.2),
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
                    borderColor: alpha(theme.palette.text.primary, 0.2),
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

          <Box
            sx={{
              mt: 1.25,
              pt: 1.1,
              borderTop: `1px dashed ${alpha(theme.palette.divider, 0.16)}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1,
              flexWrap: 'wrap',
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography
                variant="caption"
                sx={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: alpha(theme.palette.text.secondary, 0.75),
                }}
              >
                Translation Queue
              </Typography>
              {translationQueueLoading && !translationQueueStats && <CircularProgress size={12} />}
            </Stack>

            <Stack direction="row" spacing={0.7} alignItems="center" useFlexGap flexWrap="wrap">
              <Chip label={`Pending ${translationQueueStats?.pending ?? 0}`} size="small" sx={getQueueChipSx('warning')} />
              <Chip label={`Processing ${translationQueueStats?.processing ?? 0}`} size="small" sx={getQueueChipSx('info')} />
              <Box
                onClick={openFailedTranslationsDrawer}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openFailedTranslationsDrawer();
                  }
                }}
                role="button"
                tabIndex={0}
                sx={{ cursor: 'pointer', outline: 'none' }}
              >
                <Chip label={`Failed ${translationQueueStats?.failed ?? 0}`} size="small" sx={getQueueChipSx('error')} />
              </Box>
              <Chip label={`Done ${translationQueueStats?.completed ?? 0}`} size="small" sx={getQueueChipSx('success')} />
              <Chip label={`Active ${translationQueueStats?.active ?? 0}`} size="small" sx={getQueueChipSx('default')} />
            </Stack>
          </Box>

          <Box
            sx={{
              mt: 1.1,
              pt: 1.1,
              borderTop: `1px dashed ${alpha(theme.palette.divider, 0.16)}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1,
              flexWrap: 'wrap',
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography
                variant="caption"
                sx={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: alpha(theme.palette.text.secondary, 0.75),
                }}
              >
                AI Scoring Queue
              </Typography>
              {aiQueueLoading && !aiQueueStats && <CircularProgress size={12} />}
            </Stack>

            <Stack direction="row" spacing={0.7} alignItems="center" useFlexGap flexWrap="wrap">
              <Chip label={`Pending ${aiQueueStats?.pending ?? 0}`} size="small" sx={getQueueChipSx('warning')} />
              <Chip label={`Processing ${aiQueueStats?.processing ?? 0}`} size="small" sx={getQueueChipSx('info')} />
              <Box
                onClick={openAiAttentionDrawer}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openAiAttentionDrawer();
                  }
                }}
                role="button"
                tabIndex={0}
                sx={{ cursor: 'pointer', outline: 'none' }}
              >
                <Chip label={`Partial ${aiQueueStats?.partial ?? 0}`} size="small" sx={getQueueChipSx('default')} />
              </Box>
              <Box
                onClick={openAiAttentionDrawer}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openAiAttentionDrawer();
                  }
                }}
                role="button"
                tabIndex={0}
                sx={{ cursor: 'pointer', outline: 'none' }}
              >
                <Chip label={`Failed ${aiQueueStats?.failed ?? 0}`} size="small" sx={getQueueChipSx('error')} />
              </Box>
              <Chip label={`Done ${aiQueueStats?.completed ?? 0}`} size="small" sx={getQueueChipSx('success')} />
              <Chip label={`Active ${aiQueueStats?.active ?? 0}`} size="small" sx={getQueueChipSx('default')} />
              <Button
                variant="outlined"
                onClick={() => void handleRunAiWorker()}
                disabled={runningAiWorker}
                startIcon={runningAiWorker ? <CircularProgress size={14} /> : <RefreshIcon sx={{ fontSize: '0.95rem' }} />}
                sx={{
                  height: 24,
                  px: 1.25,
                  borderRadius: '999px',
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '0.72rem',
                  borderColor: alpha(theme.palette.primary.main, 0.24),
                  color: theme.palette.primary.main,
                  minWidth: 0,
                }}
              >
                Run AI
              </Button>
              <Button
                variant="outlined"
                onClick={() => void handleTriggerVideoAiWorkflow()}
                disabled={runningVideoAiWorkflow}
                startIcon={runningVideoAiWorkflow ? <CircularProgress size={14} /> : <VideoIcon sx={{ fontSize: '0.95rem' }} />}
                sx={{
                  height: 24,
                  px: 1.25,
                  borderRadius: '999px',
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '0.72rem',
                  borderColor: alpha(theme.palette.warning.main, 0.28),
                  color: theme.palette.warning.dark,
                  minWidth: 0,
                }}
              >
                Analyze Videos
              </Button>
            </Stack>
          </Box>

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
                          bgcolor: selected ? alpha(theme.palette.primary.main, 0.14) : alpha(theme.palette.text.primary, 0.05),
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
                  bgcolor: alpha(theme.palette.text.primary, 0.02),
                  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                },
                '& .MuiChip-root': { height: 22 },
                '& .MuiIconButton-root': { p: 0.4 },
              }}
            >
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 118 }}>Hazard</TableCell>
                  <TableCell sx={{ width: '50%' }}>Description</TableCell>
                  <TableCell sx={{ width: 124, pl: 2 }}>Location</TableCell>
                  <TableCell sx={{ width: 96, textAlign: 'center' }}>Priority</TableCell>
                  <TableCell sx={{ width: 86, textAlign: 'center' }}>Affected</TableCell>
                  <TableCell sx={{ width: 56, textAlign: 'center' }}>Media</TableCell>
                  <TableCell sx={{ width: 108, textAlign: 'right', pr: 1 }}>Date & Time</TableCell>
                  <TableCell sx={{ width: 95, textAlign: 'center' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  [...Array(5)].map((_, index) => (
                    <TableRow key={index} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell><Skeleton variant="circular" width={32} height={32} sx={{ mb: 0.5 }} /><Skeleton variant="text" width="60%" /></TableCell>
                      <TableCell><Skeleton variant="text" width="80%" /><Skeleton variant="text" width="40%" /></TableCell>
                      <TableCell><Skeleton variant="text" width="70%" /><Skeleton variant="text" width="50%" /></TableCell>
                      <TableCell align="center"><Skeleton variant="rounded" width={50} height={20} sx={{ mx: 'auto' }} /></TableCell>
                      <TableCell align="center"><Skeleton variant="circular" width={24} height={24} sx={{ mx: 'auto' }} /></TableCell>
                      <TableCell align="center"><Skeleton variant="rounded" width={40} height={20} sx={{ mx: 'auto' }} /></TableCell>
                      <TableCell align="right"><Skeleton variant="text" width="80%" sx={{ ml: 'auto' }} /></TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={1} justifyContent="center">
                          <Skeleton variant="rounded" width={28} height={28} />
                          <Skeleton variant="rounded" width={28} height={28} />
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
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
                          <Button size="small" variant="contained" onClick={() => void loadReports()} sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, fontSize: '0.75rem', boxShadow: 'none' }}>
                            Refresh
                          </Button>
                        </Stack>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ) : (
                  reports.map((report, index) => (
                    (() => {
                      const integrityFlags = getIntegrityFlags(report);
                      const integritySeverityMeta = getIntegritySeverityMeta(report.integrity_snapshot?.integrity_severity);
                      const isVerified = report.status === 'verified';
                      const isRejected = report.status === 'rejected';
                      const isResolved = report.status === 'resolved';
                      const isPending = report.status === 'pending';
                      const affectedNearbyLabel = getAffectedNearbyLabel(report);
                      const aiPriorityDisplayMeta = getAiPriorityDisplayMeta(report);
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
                                : alpha(theme.palette.text.primary, 0.01),
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
                      {/* Hazard Type + Risk indicator */}
                      <TableCell>
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
                              <WarningIcon
                                sx={{
                                  fontSize: '0.82rem',
                                  color: theme.palette.error.main,
                                  opacity: 0.9,
                                }}
                              />
                            </Tooltip>
                          )}
                          {integrityFlags.length > 0 && (
                            <Tooltip 
                              title={
                                <Stack component="ol" spacing={0.5} sx={{ m: 0.5, pl: 2, '& li': { fontSize: '0.75rem', fontWeight: 600 } }}>
                                  {integrityFlags.map((flag, idx) => (
                                    <li key={idx} style={{ paddingLeft: '4px' }}>{flag}</li>
                                  ))}
                                </Stack>
                              }
                              arrow
                            >
                              <OutlinedFlagIcon
                                sx={{
                                  fontSize: '0.85rem',
                                  color: integritySeverityMeta.color,
                                }}
                              />
                            </Tooltip>
                          )}
                        </Stack>
                      </TableCell>

                      {/* Description */}
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{
                            fontSize: '0.85rem',
                            color: alpha(theme.palette.text.primary, 0.85),
                            maxWidth: '100%',
                            pr: 1,
                            lineHeight: 1.45,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {displayedDescription}
                        </Typography>
                      </TableCell>

                      {/* Location */}
                      <TableCell sx={{ pl: 2 }}>
                        <Stack direction="row" spacing={0.4} alignItems="center" sx={{ whiteSpace: 'nowrap' }}>
                          <Typography
                            variant="caption"
                            sx={{
                              fontSize: '0.76rem',
                              color: alpha(theme.palette.text.secondary, 0.78),
                              fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                              fontWeight: 600,
                            }}
                          >
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

                      {/* Priority */}
                      <TableCell align="center">
                        <Stack spacing={0.45} alignItems="center">
                          <Chip
                            label={aiPriorityDisplayMeta.label}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: '0.62rem',
                              fontWeight: 700,
                              border: '1px solid',
                              borderColor: aiPriorityDisplayMeta.border,
                              bgcolor: aiPriorityDisplayMeta.background,
                              color: aiPriorityDisplayMeta.color,
                            }}
                          />
                        </Stack>
                      </TableCell>

                      {/* Affected nearby */}
                      <TableCell align="center">
                        {affectedNearbyLabel ? (
                          <Tooltip title="How many people seem affected nearby" arrow>
                            <Chip
                              label={affectedNearbyLabel}
                              size="small"
                              sx={{
                                fontSize: '0.65rem',
                                height: 20,
                                fontWeight: 600,
                                minWidth: 44,
                                bgcolor: alpha(theme.palette.primary.main, 0.06),
                                color: theme.palette.primary.main,
                                border: '1px solid',
                                borderColor: alpha(theme.palette.primary.main, 0.14),
                                '& .MuiChip-label': { px: 0.75 },
                              }}
                            />
                          </Tooltip>
                        ) : (
                          <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', color: alpha(theme.palette.text.secondary, 0.3) }}>—</Typography>
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
                      <TableCell align="right" sx={{ pr: 1.5 }}>
                        <Stack spacing={0} alignItems="flex-end">
                          <Typography variant="caption" sx={{ whiteSpace: 'nowrap', fontSize: '0.76rem', color: alpha(theme.palette.text.primary, 0.8), fontWeight: 600 }}>
                            {format(new Date(report.created_at), 'MMM dd')}
                          </Typography>
                          <Typography variant="caption" sx={{ whiteSpace: 'nowrap', fontSize: '0.72rem', color: alpha(theme.palette.text.secondary, 0.68), fontWeight: 500 }}>
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
              bgcolor: alpha(theme.palette.text.primary, 0.03),
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
                  Narrow down your reports and switch queue ordering
                </Typography>
              </Box>
              <IconButton onClick={() => setFilterDrawerOpen(false)} size="small" sx={{ bgcolor: alpha(theme.palette.text.primary, 0.12), '&:hover': { bgcolor: alpha(theme.palette.text.primary, 0.18) } }}>
                <CloseIcon sx={{ fontSize: '1.1rem' }} />
              </IconButton>
            </Box>

            <Stack spacing={2.5}>
              <FormControl fullWidth size="small">
                <InputLabel>Sort Queue By</InputLabel>
                <Select
                  value={filters.sortBy || 'newest'}
                  onChange={(e) => setFilters({
                    ...filters,
                    sortBy: e.target.value as FilterOptions['sortBy'],
                  })}
                  label="Sort Queue By"
                  sx={{ borderRadius: '10px' }}
                >
                  <MenuItem value="newest">Newest first</MenuItem>
                  <MenuItem value="score_desc">Highest priority first</MenuItem>
                  <MenuItem value="score_asc">Lowest priority first</MenuItem>
                  <MenuItem value="integrity_desc">Highest integrity risk first</MenuItem>
                  <MenuItem value="integrity_asc">Lowest integrity risk first</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth size="small">
                <InputLabel>Priority</InputLabel>
                <Select
                  multiple
                  value={filters.scoreBuckets || []}
                  onChange={(e) => setFilters({ ...filters, scoreBuckets: e.target.value as ReportAiScoreBucket[] })}
                  input={<OutlinedInput label="Priority" />}
                  sx={{ borderRadius: '10px' }}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(selected as ReportAiScoreBucket[]).map((value) => (
                        <Chip key={value} label={getAiScoreBucketMeta(value).label} size="small" sx={{ height: 20, fontSize: '0.7rem' }} />
                      ))}
                    </Box>
                  )}
                >
                  {SCORE_BUCKETS.map((bucket) => (
                    <MenuItem key={bucket} value={bucket}>
                      <Checkbox checked={(filters.scoreBuckets || []).indexOf(bucket) > -1} size="small" />
                      <ListItemText primary={getAiScoreBucketMeta(bucket).label} primaryTypographyProps={{ fontSize: '0.8125rem' }} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth size="small">
                <InputLabel>Integrity Severity</InputLabel>
                <Select
                  multiple
                  value={filters.integritySeverities || []}
                  onChange={(e) => setFilters({ ...filters, integritySeverities: e.target.value as ReportIntegritySeverity[] })}
                  input={<OutlinedInput label="Integrity Severity" />}
                  sx={{ borderRadius: '10px' }}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(selected as ReportIntegritySeverity[]).map((value) => (
                        <Chip key={value} label={getIntegritySeverityMeta(value).label} size="small" sx={{ height: 20, fontSize: '0.7rem' }} />
                      ))}
                    </Box>
                  )}
                >
                  {INTEGRITY_SEVERITIES.map((severity) => (
                    <MenuItem key={severity} value={severity}>
                      <Checkbox checked={(filters.integritySeverities || []).indexOf(severity) > -1} size="small" />
                      <ListItemText primary={getIntegritySeverityMeta(severity).label} primaryTypographyProps={{ fontSize: '0.8125rem' }} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth size="small">
                <InputLabel>Suspicious Queue</InputLabel>
                <Select
                  value={filters.suspiciousOnly ? 'yes' : 'all'}
                  onChange={(e) => setFilters({ ...filters, suspiciousOnly: e.target.value === 'yes' ? true : null })}
                  label="Suspicious Queue"
                  sx={{ borderRadius: '10px' }}
                >
                  <MenuItem value="all">All reports</MenuItem>
                  <MenuItem value="yes">Suspicious only</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth size="small">
                <InputLabel>Duplicate Review</InputLabel>
                <Select
                  value={filters.duplicateOnly ? 'yes' : 'all'}
                  onChange={(e) => setFilters({ ...filters, duplicateOnly: e.target.value === 'yes' ? true : null })}
                  label="Duplicate Review"
                  sx={{ borderRadius: '10px' }}
                >
                  <MenuItem value="all">All reports</MenuItem>
                  <MenuItem value="yes">Duplicate cluster only</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth size="small">
                <InputLabel>Shared Device</InputLabel>
                <Select
                  value={filters.sharedDeviceOnly ? 'yes' : 'all'}
                  onChange={(e) => setFilters({ ...filters, sharedDeviceOnly: e.target.value === 'yes' ? true : null })}
                  label="Shared Device"
                  sx={{ borderRadius: '10px' }}
                >
                  <MenuItem value="all">All reports</MenuItem>
                  <MenuItem value="yes">Shared device only</MenuItem>
                </Select>
              </FormControl>

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
                Priority sorting uses the latest stored AI analysis snapshot. Day-based date filtering stays available from the <strong>Day Filter</strong> button in the top bar.
              </Alert>
            </Stack>

            <Box mt={3} display="flex" gap={1.5}>
              <Button
                fullWidth
                variant="outlined"
                onClick={handleResetFilters}
                sx={{ borderRadius: '10px', borderColor: alpha(theme.palette.text.primary, 0.2), color: 'text.secondary', textTransform: 'none', fontWeight: 600, py: 1 }}
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

        <Drawer
          anchor="right"
          open={failedTranslationsDrawerOpen}
          onClose={closeFailedTranslationsDrawer}
          PaperProps={{
            sx: {
              width: { xs: '100%', sm: 460 },
              borderRadius: { xs: 0, sm: '18px 0 0 18px' },
              border: 'none',
              boxShadow: `0 18px 48px ${alpha(theme.palette.common.black, 0.16)}`,
              overflow: 'hidden',
            },
          }}
        >
          <Box
            sx={{
              p: 3,
              background: `linear-gradient(180deg, ${alpha(theme.palette.error.main, 0.08)} 0%, ${alpha(theme.palette.background.paper, 0.96)} 100%)`,
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={2}>
              <Box>
                <Typography variant="subtitle1" fontWeight={800} sx={{ fontSize: '1.02rem' }}>
                  Failed Translations
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.6, color: alpha(theme.palette.text.secondary, 0.78), lineHeight: 1.6 }}>
                  Inspect translation errors and retry directly from this drawer without adding more clutter to the main reports table.
                </Typography>
              </Box>
              <IconButton
                onClick={closeFailedTranslationsDrawer}
                size="small"
                sx={{ bgcolor: alpha(theme.palette.text.primary, 0.08), '&:hover': { bgcolor: alpha(theme.palette.text.primary, 0.14) } }}
              >
                <CloseIcon sx={{ fontSize: '1.1rem' }} />
              </IconButton>
            </Box>

            <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" sx={{ mt: 2.2 }}>
              <Chip
                label={`${failedTranslationReports.length} in queue`}
                size="small"
                sx={{
                  height: 26,
                  border: 'none',
                  fontWeight: 700,
                  bgcolor: alpha(theme.palette.error.main, 0.12),
                  color: theme.palette.error.main,
                }}
              />
              <Button
                size="small"
                variant="outlined"
                onClick={() => void handleRetryAllFailed()}
                disabled={failedTranslationReports.length === 0 || retryingAllFailed}
                startIcon={retryingAllFailed ? <CircularProgress size={14} /> : <RefreshIcon sx={{ fontSize: '0.95rem' }} />}
                sx={{
                  borderRadius: '999px',
                  textTransform: 'none',
                  fontWeight: 700,
                  px: 1.5,
                }}
              >
                Retry All
              </Button>
            </Stack>
          </Box>

          <Box sx={{ p: 2, overflowY: 'auto', flex: 1 }}>
            {failedTranslationsLoading ? (
              <Stack spacing={1.25}>
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} variant="rounded" height={118} sx={{ borderRadius: '16px' }} />
                ))}
              </Stack>
            ) : failedTranslationReports.length === 0 ? (
              <Paper
                variant="outlined"
                sx={{
                  p: 3,
                  borderRadius: '18px',
                  textAlign: 'center',
                  borderColor: alpha(theme.palette.success.main, 0.14),
                  bgcolor: alpha(theme.palette.success.main, 0.04),
                }}
              >
                <Typography variant="subtitle2" fontWeight={700} sx={{ color: theme.palette.success.main }}>
                  No failed translations right now
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.8, color: alpha(theme.palette.text.secondary, 0.82), lineHeight: 1.6 }}>
                  New failures will appear here automatically whenever the queue picks them up.
                </Typography>
              </Paper>
            ) : (
              <Stack spacing={1.25}>
                {failedTranslationReports.map((report) => {
                  const isRetrying = retryingAllFailed || retryingFailedIds.includes(report.id);
                  return (
                    <Paper
                      key={report.id}
                      variant="outlined"
                      sx={{
                        p: 1.75,
                        borderRadius: '18px',
                        borderColor: alpha(theme.palette.error.main, 0.12),
                        bgcolor: alpha(theme.palette.background.paper, 0.92),
                        boxShadow: `0 8px 24px ${alpha(theme.palette.common.black, 0.04)}`,
                      }}
                    >
                      <Stack spacing={1.2}>
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={1.5}>
                          <Box sx={{ minWidth: 0 }}>
                            <Stack direction="row" spacing={0.8} alignItems="center" sx={{ mb: 0.6 }}>
                              <Chip
                                label={report.hazard_type}
                                size="small"
                                sx={{
                                  height: 22,
                                  fontSize: '0.68rem',
                                  fontWeight: 700,
                                  border: 'none',
                                  bgcolor: alpha(getHazardColor(report.hazard_type), 0.1),
                                  color: getHazardColor(report.hazard_type),
                                }}
                              />
                              <Typography variant="caption" sx={{ color: alpha(theme.palette.text.secondary, 0.72) }}>
                                {report.user_name || 'Unknown reporter'}
                              </Typography>
                            </Stack>
                            <Typography
                              variant="body2"
                              sx={{
                                color: theme.palette.text.primary,
                                fontWeight: 600,
                                lineHeight: 1.55,
                                display: '-webkit-box',
                                overflow: 'hidden',
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: 'vertical',
                              }}
                            >
                              {report.description}
                            </Typography>
                          </Box>
                          <Chip label="Failed" size="small" sx={getQueueChipSx('error')} />
                        </Box>

                        <Alert
                          severity="error"
                          variant="outlined"
                          sx={{
                            borderRadius: '14px',
                            '& .MuiAlert-message': { width: '100%' },
                          }}
                        >
                          <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, mb: 0.35 }}>
                            Last error
                          </Typography>
                          <Typography variant="body2" sx={{ lineHeight: 1.55 }}>
                            {getTranslationFailureReason(report)}
                          </Typography>
                        </Alert>

                        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                          <Chip
                            label={`Attempts ${report.translation_attempts ?? 0}`}
                            size="small"
                            sx={{ height: 22, fontSize: '0.68rem', border: 'none', bgcolor: alpha(theme.palette.warning.main, 0.1), color: theme.palette.warning.dark }}
                          />
                          <Chip
                            label={`Last try ${report.translation_last_attempt_at ? format(new Date(report.translation_last_attempt_at), 'MMM dd, HH:mm') : 'Unknown'}`}
                            size="small"
                            sx={{ height: 22, fontSize: '0.68rem', border: 'none', bgcolor: alpha(theme.palette.info.main, 0.1), color: theme.palette.info.main }}
                          />
                          <Chip
                            label={`Next retry ${report.translation_next_retry_at ? format(new Date(report.translation_next_retry_at), 'MMM dd, HH:mm') : 'Manual only'}`}
                            size="small"
                            sx={{ height: 22, fontSize: '0.68rem', border: 'none', bgcolor: alpha(theme.palette.text.secondary, 0.08), color: theme.palette.text.secondary }}
                          />
                        </Stack>

                        <Box display="flex" justifyContent="space-between" alignItems="center" gap={1}>
                          <Typography variant="caption" sx={{ color: alpha(theme.palette.text.secondary, 0.72), fontFamily: '"JetBrains Mono", monospace' }}>
                            {report.id.slice(0, 8)}...
                          </Typography>
                          <Stack direction="row" spacing={1}>
                            <Button
                              size="small"
                              variant="text"
                              onClick={() => void handleOpenDrawerReport(report.id)}
                              sx={{ textTransform: 'none', fontWeight: 700 }}
                            >
                              Open
                            </Button>
                            <Button
                              size="small"
                              variant="contained"
                              disabled={isRetrying}
                              onClick={() => void handleRetryFailedReport(report)}
                              startIcon={isRetrying ? <CircularProgress size={14} color="inherit" /> : <RefreshIcon sx={{ fontSize: '0.95rem' }} />}
                              sx={{
                                borderRadius: '999px',
                                textTransform: 'none',
                                fontWeight: 700,
                                px: 1.5,
                                boxShadow: 'none',
                              }}
                            >
                              Retry
                            </Button>
                          </Stack>
                        </Box>
                      </Stack>
                    </Paper>
                  );
                })}
              </Stack>
            )}
          </Box>
        </Drawer>

        <Drawer
          anchor="right"
          open={aiAttentionDrawerOpen}
          onClose={closeAiAttentionDrawer}
          PaperProps={{
            sx: {
              width: { xs: '100%', sm: 460 },
              borderRadius: { xs: 0, sm: '18px 0 0 18px' },
              border: 'none',
              boxShadow: `0 18px 48px ${alpha(theme.palette.common.black, 0.16)}`,
              overflow: 'hidden',
            },
          }}
        >
          <Box
            sx={{
              p: 2.25,
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
              background: `linear-gradient(180deg, ${alpha(theme.palette.info.light, 0.14)} 0%, ${alpha(theme.palette.background.paper, 1)} 100%)`,
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={1.5}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
                  AI Scoring Queue
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.6, color: alpha(theme.palette.text.secondary, 0.78), lineHeight: 1.6 }}>
                  Review reports with partial or failed scoring, and trigger the batch worker directly from this drawer.
                </Typography>
              </Box>
              <IconButton
                onClick={closeAiAttentionDrawer}
                size="small"
                sx={{ bgcolor: alpha(theme.palette.text.primary, 0.08), '&:hover': { bgcolor: alpha(theme.palette.text.primary, 0.14) } }}
              >
                <CloseIcon sx={{ fontSize: '1.1rem' }} />
              </IconButton>
            </Box>

            <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" sx={{ mt: 2.2 }}>
              <Chip
                label={`${aiAttentionReports.length} needing attention`}
                size="small"
                sx={{
                  height: 26,
                  border: 'none',
                  fontWeight: 700,
                  bgcolor: alpha(theme.palette.warning.main, 0.12),
                  color: theme.palette.warning.dark,
                }}
              />
              <Button
                variant="outlined"
                onClick={() => void handleRunAiWorker()}
                disabled={runningAiWorker}
                startIcon={runningAiWorker ? <CircularProgress size={14} /> : <RefreshIcon sx={{ fontSize: '0.95rem' }} />}
                sx={{
                  borderRadius: '999px',
                  textTransform: 'none',
                  fontWeight: 700,
                  px: 1.5,
                }}
              >
                Run Worker
              </Button>
              <Button
                variant="outlined"
                onClick={() => void handleTriggerVideoAiWorkflow()}
                disabled={runningVideoAiWorkflow}
                startIcon={runningVideoAiWorkflow ? <CircularProgress size={14} /> : <VideoIcon sx={{ fontSize: '0.95rem' }} />}
                sx={{
                  borderRadius: '999px',
                  textTransform: 'none',
                  fontWeight: 700,
                  px: 1.5,
                }}
              >
                Analyze Videos
              </Button>
            </Stack>
          </Box>

          <Box sx={{ p: 2, overflowY: 'auto', flex: 1 }}>
            {aiAttentionLoading ? (
              <Stack spacing={1.25}>
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} variant="rounded" height={118} sx={{ borderRadius: '16px' }} />
                ))}
              </Stack>
            ) : aiAttentionReports.length === 0 ? (
              <Paper
                variant="outlined"
                sx={{
                  p: 3,
                  borderRadius: '18px',
                  textAlign: 'center',
                  borderColor: alpha(theme.palette.divider, 0.08),
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  No AI scoring items need attention
                </Typography>
                <Typography variant="body2" sx={{ mt: 1, color: alpha(theme.palette.text.secondary, 0.76), lineHeight: 1.7 }}>
                  Partial and failed AI analyses will appear here so admins can retry without searching the main queue.
                </Typography>
              </Paper>
            ) : (
              <Stack spacing={1.25}>
                {aiAttentionReports.map((report) => {
                  const isRetrying = analyzingReportId === report.id;
                  const aiStatus = report.ai_analysis?.analysis_status ?? 'pending';
                  const aiError = report.ai_analysis?.last_error ?? null;
                  const statusTone = aiStatus === 'failed' ? 'error' : 'default';
                  const scoreLabel =
                    aiStatus === 'partial'
                      ? `Provisional score ${Math.round(report.ai_analysis?.operational_score ?? 0)} | ${report.ai_analysis?.score_bucket ?? 'low'}`
                      : `Score ${Math.round(report.ai_analysis?.operational_score ?? 0)} | ${report.ai_analysis?.score_bucket ?? 'low'}`;

                  return (
                    <Paper
                      key={report.id}
                      variant="outlined"
                      sx={{
                        p: 1.6,
                        borderRadius: '16px',
                        borderColor: alpha(theme.palette.divider, 0.08),
                      }}
                    >
                      <Stack spacing={1.25}>
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={1}>
                          <Box minWidth={0}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                              {report.hazard_type}
                            </Typography>
                            <Typography variant="body2" sx={{ color: alpha(theme.palette.text.secondary, 0.82), mt: 0.35 }}>
                              {report.translated_english || report.description}
                            </Typography>
                          </Box>
                          <Chip label={aiStatus === 'failed' ? 'Failed' : 'Provisional'} size="small" sx={getQueueChipSx(statusTone)} />
                        </Box>

                        {aiError && (
                          <Alert
                            severity="error"
                            sx={{
                              borderRadius: '12px',
                              '& .MuiAlert-message': { fontSize: '0.8rem' },
                            }}
                          >
                            {aiError}
                          </Alert>
                        )}

                        <Box display="flex" justifyContent="space-between" alignItems="center" gap={1} flexWrap="wrap">
                          <Typography variant="caption" sx={{ color: alpha(theme.palette.text.secondary, 0.78) }}>
                            {scoreLabel}
                          </Typography>
                          <Button
                            variant="contained"
                            disabled={isRetrying}
                            onClick={() => void handleAnalyzeReportAi(report, { force: true })}
                            startIcon={isRetrying ? <CircularProgress size={14} color="inherit" /> : <RefreshIcon sx={{ fontSize: '0.95rem' }} />}
                            sx={{
                              borderRadius: '999px',
                              textTransform: 'none',
                              fontWeight: 700,
                              px: 1.5,
                              boxShadow: 'none',
                            }}
                          >
                            Retry AI
                          </Button>
                        </Box>
                      </Stack>
                    </Paper>
                  );
                })}
              </Stack>
            )}
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
              <DialogTitle sx={{ pb: 2, pt: 3, px: 3, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}` }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6" fontWeight={800} sx={{ fontSize: '1.25rem', letterSpacing: '-0.02em', color: theme.palette.text.primary }}>
                    Report Details
                  </Typography>
                  <IconButton onClick={() => setDetailDialogOpen(false)} size="small" sx={{ bgcolor: alpha(theme.palette.text.primary, 0.12), '&:hover': { bgcolor: alpha(theme.palette.text.primary, 0.18) }, transition: 'all 0.2s' }}>
                    <CloseIcon sx={{ fontSize: '1.2rem', color: theme.palette.text.secondary }} />
                  </IconButton>
                </Box>
              </DialogTitle>
              <DialogContent sx={{ px: 3, py: 2.5 }}>
                {/* Status and Risk Badges */}
                <Box display="flex" gap={0.75} flexWrap="wrap" sx={{ mb: 2 }}>
                  <Chip 
                    label={selectedReport.status.toUpperCase()} 
                      size="small" 
                      sx={{ 
                        fontWeight: 700, fontSize: '0.7rem', px: 0.5,
                        bgcolor: selectedReport.status === 'pending' ? alpha(theme.palette.warning.main, 0.08)
                          : selectedReport.status === 'verified' ? alpha(theme.palette.success.main, 0.08)
                          : selectedReport.status === 'rejected' ? alpha(theme.palette.error.main, 0.08)
                          : alpha(theme.palette.info.main, 0.08),
                        color: selectedReport.status === 'pending' ? theme.palette.warning.dark
                          : selectedReport.status === 'verified' ? theme.palette.success.main
                          : selectedReport.status === 'rejected' ? theme.palette.error.main
                          : theme.palette.info.main,
                        border: 'none'
                      }} 
                    />
                    <Chip 
                      label={selectedReport.hazard_type} 
                      size="small" 
                      sx={{ 
                        fontWeight: 700, fontSize: '0.7rem', px: 0.5,
                        bgcolor: alpha(getHazardColor(selectedReport.hazard_type), 0.08), 
                        color: getHazardColor(selectedReport.hazard_type), 
                        border: 'none' 
                      }} 
                    />
                    {getAffectedNearbyLabel(selectedReport) && (
                      <Chip 
                        icon={<PeopleIcon sx={{ fontSize: '0.85rem !important', color: 'inherit' }} />} 
                        label={`Affected nearby: ${getAffectedNearbyLabel(selectedReport)}`} 
                        size="small" 
                        sx={{ 
                          fontWeight: 700, fontSize: '0.7rem', px: 0.5,
                          bgcolor: alpha(theme.palette.primary.main, 0.08),
                          color: theme.palette.primary.main,
                          border: '1px solid',
                          borderColor: alpha(theme.palette.primary.main, 0.16),
                          '& .MuiChip-icon': { ml: 0.5, mr: -0.5, color: 'inherit' }
                        }} 
                      />
                    )}
                    {selectedReport.ai_analysis && (
                      <>
                        <Chip
                          label={`AI ${formatAiScore(selectedReport)}`}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            fontSize: '0.7rem',
                            px: 0.5,
                            bgcolor: getAiScoreBucketMeta(selectedReport.ai_analysis.score_bucket).background,
                            color: getAiScoreBucketMeta(selectedReport.ai_analysis.score_bucket).color,
                            border: '1px solid',
                            borderColor: getAiScoreBucketMeta(selectedReport.ai_analysis.score_bucket).border,
                          }}
                        />
                        {selectedReport.ai_analysis.analysis_status !== 'completed' && (
                          <Chip
                            label={getAiAnalysisStatusMeta(selectedReport).label}
                            size="small"
                            sx={{
                              fontWeight: 700,
                              fontSize: '0.7rem',
                              px: 0.5,
                              bgcolor: getAiAnalysisStatusMeta(selectedReport).background,
                              color: getAiAnalysisStatusMeta(selectedReport).color,
                              border: '1px solid',
                              borderColor: getAiAnalysisStatusMeta(selectedReport).border,
                            }}
                          />
                        )}
                      </>
                    )}
                    {selectedReport.integrity_snapshot && selectedReport.integrity_snapshot.active_signal_count > 0 && (
                      <Chip
                        label={`Integrity ${formatIntegrityScore(selectedReport)}`}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          fontSize: '0.7rem',
                          px: 0.5,
                          bgcolor: getIntegritySeverityMeta(selectedReport.integrity_snapshot.integrity_severity).background,
                          color: getIntegritySeverityMeta(selectedReport.integrity_snapshot.integrity_severity).color,
                          border: '1px solid',
                          borderColor: getIntegritySeverityMeta(selectedReport.integrity_snapshot.integrity_severity).border,
                        }}
                      />
                    )}
                </Box>

                <Box sx={{ 
                  height: 4, 
                  background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`, 
                  mx: -3, 
                  mb: 3
                }} />

                <Stack spacing={3.5}>
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
                          sx={{ 
                            height: 22, fontSize: '0.65rem', fontWeight: 700, px: 0.5,
                            bgcolor: getTranslationStatusMeta(selectedReport.translation_status).color === 'success' ? alpha(theme.palette.success.main, 0.08)
                              : getTranslationStatusMeta(selectedReport.translation_status).color === 'info' ? alpha(theme.palette.info.main, 0.08)
                              : getTranslationStatusMeta(selectedReport.translation_status).color === 'error' ? alpha(theme.palette.error.main, 0.08)
                              : getTranslationStatusMeta(selectedReport.translation_status).color === 'warning' ? alpha(theme.palette.warning.main, 0.08)
                              : alpha(theme.palette.grey[500], 0.08),
                            color: getTranslationStatusMeta(selectedReport.translation_status).color === 'success' ? theme.palette.success.main
                              : getTranslationStatusMeta(selectedReport.translation_status).color === 'info' ? theme.palette.info.main
                              : getTranslationStatusMeta(selectedReport.translation_status).color === 'error' ? theme.palette.error.main
                              : getTranslationStatusMeta(selectedReport.translation_status).color === 'warning' ? theme.palette.warning.dark
                              : theme.palette.text.secondary,
                            border: 'none'
                          }}
                        />
                        {selectedReport.detected_language && (
                          <Chip
                            size="small"
                            icon={<TranslateIcon sx={{ fontSize: '0.8rem !important', color: 'inherit' }} />}
                            label={getLanguageLabel(selectedReport.detected_language)}
                            sx={{ 
                              height: 22, fontSize: '0.65rem', fontWeight: 700, px: 0.5,
                              bgcolor: alpha(theme.palette.grey[500], 0.08),
                              color: theme.palette.text.secondary,
                              border: '1px solid',
                              borderColor: alpha(theme.palette.grey[500], 0.2),
                              '& .MuiChip-icon': { ml: 0.5, mr: -0.5 }
                            }}
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
                        {isTranslationLive(selectedReport) && (
                          <Stack direction="row" spacing={0.75} alignItems="center">
                            <CircularProgress size={14} />
                            <Typography
                              variant="caption"
                              sx={{
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                color:
                                  selectedReport.translation_status === 'pending'
                                    ? theme.palette.warning.dark
                                    : theme.palette.info.main,
                                letterSpacing: '0.01em',
                              }}
                            >
                              {getTranslationLiveLabel(selectedReport)}
                            </Typography>
                          </Stack>
                        )}
                        {selectedReport.translation_status === 'failed' && (
                          <Tooltip title={getTranslationFailureReason(selectedReport)}>
                            <Chip
                              size="small"
                              label="Reason"
                              sx={{
                                height: 22,
                                fontSize: '0.62rem',
                                fontWeight: 700,
                                px: 0.45,
                                bgcolor: alpha(theme.palette.error.main, 0.08),
                                color: theme.palette.error.main,
                                border: '1px solid',
                                borderColor: alpha(theme.palette.error.main, 0.25),
                              }}
                            />
                          </Tooltip>
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
                    <Paper variant="outlined" sx={{ p: 2.5, mt: 1, borderRadius: '12px', border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`, bgcolor: alpha(theme.palette.primary.main, 0.02), boxShadow: `inset 0 2px 4px ${alpha(theme.palette.common.black, 0.02)}` }}>
                      {selectedReport.translation_status === 'failed' ? (
                        <>
                          <Typography
                            variant="caption"
                            sx={{ display: 'block', mb: 1.5, fontWeight: 600, color: theme.palette.error.main, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.65rem' }}
                          >
                            Translation failed: {getTranslationFailureReason(selectedReport)}
                          </Typography>
                          <Typography variant="body1" sx={{ lineHeight: 1.7, color: theme.palette.text.primary }}>
                            {selectedReport.description}
                          </Typography>
                        </>
                      ) : selectedReport.translated_english?.trim() &&
                      selectedReport.translated_english.trim() != selectedReport.description.trim() ? (
                        <>
                          <Typography
                            variant="caption"
                            sx={{ display: 'block', mb: 1.5, fontWeight: 600, color: theme.palette.primary.main, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.65rem' }}
                          >
                            {showOriginalDescription
                              ? `Original ${getLanguageLabel(selectedReport.detected_language)} text`
                              : `English translation from ${getLanguageLabel(selectedReport.detected_language)}`}
                          </Typography>
                          <Typography variant="body1" sx={{ lineHeight: 1.7, color: theme.palette.text.primary }}>
                            {showOriginalDescription
                              ? selectedReport.description
                              : selectedReport.translated_english}
                          </Typography>
                        </>
                      ) : selectedReport.translation_status === 'pending' ? (
                        <>
                          <Typography
                            variant="caption"
                            sx={{ display: 'block', mb: 1.5, fontWeight: 600, color: theme.palette.warning.dark, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.65rem' }}
                          >
                            Translation is queued. The original message is shown until English text is ready.
                          </Typography>
                          <Typography variant="body1" sx={{ lineHeight: 1.7, color: theme.palette.text.primary }}>
                            {selectedReport.description}
                          </Typography>
                        </>
                      ) : selectedReport.translation_status === 'processing' ? (
                        <>
                          <Typography
                            variant="caption"
                            sx={{ display: 'block', mb: 1.5, fontWeight: 600, color: theme.palette.info.main, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.65rem' }}
                          >
                            Translation is in progress. The original message is shown until English text is ready.
                          </Typography>
                          <Typography variant="body1" sx={{ lineHeight: 1.7, color: theme.palette.text.primary }}>
                            {selectedReport.description}
                          </Typography>
                        </>
                      ) : (
                        <Typography variant="body1" sx={{ lineHeight: 1.7, color: theme.palette.text.primary }}>
                          {selectedReport.description}
                        </Typography>
                      )}
                    </Paper>
                  </Box>

                  <Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 0.75 }}>
                      <Typography variant="caption" fontWeight={600} sx={{ color: alpha(theme.palette.text.secondary, 0.6), textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.65rem' }}>
                        AI Operational Scoring
                      </Typography>
                      <Button
                        size="small"
                        variant="outlined"
                        disabled={analyzingReportId === selectedReport.id}
                        onClick={() => void handleAnalyzeReportAi(selectedReport, { force: true })}
                        startIcon={analyzingReportId === selectedReport.id ? <CircularProgress size={14} /> : <RefreshIcon sx={{ fontSize: '0.95rem' }} />}
                        sx={{
                          borderRadius: '999px',
                          textTransform: 'none',
                          fontWeight: 700,
                          px: 1.5,
                        }}
                      >
                        Retry AI
                      </Button>
                    </Box>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 2,
                        borderRadius: '14px',
                        borderColor: alpha(theme.palette.divider, 0.08),
                        bgcolor: alpha(theme.palette.text.primary, 0.02),
                      }}
                    >
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 4 }}>
                          <Box
                            sx={{
                              p: 1.75,
                              borderRadius: '14px',
                              bgcolor: getAiScoreBucketMeta(selectedReport.ai_analysis?.score_bucket).background,
                              border: '1px solid',
                              borderColor: getAiScoreBucketMeta(selectedReport.ai_analysis?.score_bucket).border,
                            }}
                          >
                            <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, color: alpha(theme.palette.text.secondary, 0.72), textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.64rem' }}>
                              Score
                            </Typography>
                            <Typography variant="h4" sx={{ mt: 0.35, fontSize: '1.8rem', lineHeight: 1, fontWeight: 900, color: getAiScoreBucketMeta(selectedReport.ai_analysis?.score_bucket).color }}>
                              {formatAiScore(selectedReport)}
                            </Typography>
                            <Stack direction="row" spacing={0.75} sx={{ mt: 1 }}>
                              {selectedReport.ai_analysis?.analysis_status === 'completed' && (
                                <Chip
                                  label={getAiScoreBucketMeta(selectedReport.ai_analysis?.score_bucket).label}
                                  size="small"
                                  sx={{
                                    height: 22,
                                    fontSize: '0.64rem',
                                    fontWeight: 700,
                                    border: '1px solid',
                                    borderColor: getAiScoreBucketMeta(selectedReport.ai_analysis?.score_bucket).border,
                                    bgcolor: 'transparent',
                                    color: getAiScoreBucketMeta(selectedReport.ai_analysis?.score_bucket).color,
                                  }}
                                />
                              )}
                              <Chip
                                label={getAiAnalysisStatusMeta(selectedReport).label}
                                size="small"
                                sx={{
                                  height: 22,
                                  fontSize: '0.64rem',
                                  fontWeight: 700,
                                  border: '1px solid',
                                  borderColor: getAiAnalysisStatusMeta(selectedReport).border,
                                  bgcolor: getAiAnalysisStatusMeta(selectedReport).background,
                                  color: getAiAnalysisStatusMeta(selectedReport).color,
                                }}
                              />
                            </Stack>
                          </Box>
                        </Grid>
                        <Grid size={{ xs: 12, md: 8 }}>
                          <Stack spacing={1.25}>
                            <Typography variant="body2" sx={{ lineHeight: 1.65, color: theme.palette.text.primary }}>
                              {selectedReport.ai_analysis?.summary || 'This report is queued for AI scoring. The current foundation scores translated text and metadata first, then enriches the record as more media analysis becomes available.'}
                            </Typography>
                            <Typography variant="body2" sx={{ color: alpha(theme.palette.text.secondary, 0.8), lineHeight: 1.6 }}>
                              <strong>Recommended action:</strong> {selectedReport.ai_analysis?.recommended_action || 'Await AI recommendation'}
                            </Typography>
                            <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
                              <Chip label={`Text ${Math.round(selectedReport.ai_analysis?.text_score ?? 0)}`} size="small" sx={{ fontWeight: 700, bgcolor: alpha(theme.palette.primary.main, 0.08), color: theme.palette.primary.main, border: 'none' }} />
                              <Chip label={`Metadata ${Math.round(selectedReport.ai_analysis?.metadata_score ?? 0)}`} size="small" sx={{ fontWeight: 700, bgcolor: alpha(theme.palette.info.main, 0.08), color: theme.palette.info.main, border: 'none' }} />
                              <Chip label={`Image ${Math.round(selectedReport.ai_analysis?.image_score ?? 0)}`} size="small" sx={{ fontWeight: 700, bgcolor: alpha(theme.palette.warning.main, 0.08), color: theme.palette.warning.dark, border: 'none' }} />
                              <Chip label={`Audio ${Math.round(selectedReport.ai_analysis?.audio_score ?? 0)}`} size="small" sx={{ fontWeight: 700, bgcolor: alpha(theme.palette.warning.main, 0.08), color: theme.palette.warning.dark, border: 'none' }} />
                              <Chip label={`Video ${Math.round(selectedReport.ai_analysis?.video_score ?? 0)}`} size="small" sx={{ fontWeight: 700, bgcolor: alpha(theme.palette.warning.main, 0.08), color: theme.palette.warning.dark, border: 'none' }} />
                              <Chip label={`Confidence ${Math.round(selectedReport.ai_analysis?.confidence_score ?? 0)}`} size="small" sx={{ fontWeight: 700, bgcolor: alpha(theme.palette.success.main, 0.08), color: theme.palette.success.main, border: 'none' }} />
                            </Stack>
                          </Stack>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Box>

                  {(() => {
                    const mediaEvidence = getAiMediaEvidence(selectedReport);
                    const hasMediaEvidence =
                      mediaEvidence.imageSummaries.length > 0 ||
                      mediaEvidence.audioSummaries.length > 0 ||
                      mediaEvidence.videoSummaries.length > 0 ||
                      mediaEvidence.videoFrameSummaries.length > 0 ||
                      mediaEvidence.audioTranscripts.length > 0 ||
                      mediaEvidence.videoTranscripts.length > 0;

                    if (!hasMediaEvidence) return null;

                    return (
                      <Box>
                        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 0.75 }}>
                          <Typography variant="caption" fontWeight={600} sx={{ color: alpha(theme.palette.text.secondary, 0.6), textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.65rem' }}>
                            AI Media Evidence
                          </Typography>
                          <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
                            {mediaEvidence.imageStatus && (
                              <Chip label={`Images ${mediaEvidence.imageStatus}`} size="small" sx={{ height: 22, fontSize: '0.64rem', fontWeight: 700, bgcolor: alpha(theme.palette.warning.main, 0.08), color: theme.palette.warning.dark, border: 'none' }} />
                            )}
                            {mediaEvidence.audioStatus && (
                              <Chip label={`Audio ${mediaEvidence.audioStatus}`} size="small" sx={{ height: 22, fontSize: '0.64rem', fontWeight: 700, bgcolor: alpha(theme.palette.info.main, 0.08), color: theme.palette.info.main, border: 'none' }} />
                            )}
                            {mediaEvidence.videoStatus && (
                              <Chip label={`Video ${mediaEvidence.videoStatus}`} size="small" sx={{ height: 22, fontSize: '0.64rem', fontWeight: 700, bgcolor: alpha(theme.palette.primary.main, 0.08), color: theme.palette.primary.main, border: 'none' }} />
                            )}
                            {mediaEvidence.videoFrameStatus && (
                              <Chip label={`Frames ${mediaEvidence.videoFrameStatus}`} size="small" sx={{ height: 22, fontSize: '0.64rem', fontWeight: 700, bgcolor: alpha(theme.palette.success.main, 0.08), color: theme.palette.success.main, border: 'none' }} />
                            )}
                          </Stack>
                        </Box>
                        <Paper
                          variant="outlined"
                          sx={{
                            p: 2,
                            borderRadius: '14px',
                            borderColor: alpha(theme.palette.divider, 0.08),
                            bgcolor: alpha(theme.palette.text.primary, 0.02),
                          }}
                        >
                          <Stack spacing={1.5}>
                            {mediaEvidence.imageSummaries.length > 0 && (
                              <Box>
                                <Typography variant="caption" sx={{ display: 'block', mb: 0.6, fontWeight: 700, color: alpha(theme.palette.text.secondary, 0.72), textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.64rem' }}>
                                  Image Findings
                                </Typography>
                                <Stack spacing={0.75}>
                                  {mediaEvidence.imageSummaries.slice(0, 3).map((item, index) => (
                                    <Typography key={`image-summary-${index}`} variant="body2" sx={{ lineHeight: 1.6, color: theme.palette.text.primary }}>
                                      {item}
                                    </Typography>
                                  ))}
                                </Stack>
                              </Box>
                            )}

                            {mediaEvidence.audioSummaries.length > 0 && (
                              <Box>
                                <Typography variant="caption" sx={{ display: 'block', mb: 0.6, fontWeight: 700, color: alpha(theme.palette.text.secondary, 0.72), textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.64rem' }}>
                                  Audio Findings
                                </Typography>
                                <Stack spacing={0.75}>
                                  {mediaEvidence.audioSummaries.slice(0, 3).map((item, index) => (
                                    <Typography key={`audio-summary-${index}`} variant="body2" sx={{ lineHeight: 1.6, color: theme.palette.text.primary }}>
                                      {item}
                                    </Typography>
                                  ))}
                                </Stack>
                              </Box>
                            )}

                            {mediaEvidence.videoSummaries.length > 0 && (
                              <Box>
                                <Typography variant="caption" sx={{ display: 'block', mb: 0.6, fontWeight: 700, color: alpha(theme.palette.text.secondary, 0.72), textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.64rem' }}>
                                  Video Findings
                                </Typography>
                                <Stack spacing={0.75}>
                                  {mediaEvidence.videoSummaries.slice(0, 3).map((item, index) => (
                                    <Typography key={`video-summary-${index}`} variant="body2" sx={{ lineHeight: 1.6, color: theme.palette.text.primary }}>
                                      {item}
                                    </Typography>
                                  ))}
                                </Stack>
                              </Box>
                            )}

                            {mediaEvidence.videoFrameSummaries.length > 0 && (
                              <Box>
                                <Typography variant="caption" sx={{ display: 'block', mb: 0.6, fontWeight: 700, color: alpha(theme.palette.text.secondary, 0.72), textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.64rem' }}>
                                  Video Frame Findings
                                </Typography>
                                <Stack spacing={0.75}>
                                  {mediaEvidence.videoFrameSummaries.slice(0, 3).map((item, index) => (
                                    <Typography key={`video-frame-summary-${index}`} variant="body2" sx={{ lineHeight: 1.6, color: theme.palette.text.primary }}>
                                      {item}
                                    </Typography>
                                  ))}
                                </Stack>
                              </Box>
                            )}

                            {mediaEvidence.audioTranscripts.length > 0 && (
                              <Box>
                                <Typography variant="caption" sx={{ display: 'block', mb: 0.6, fontWeight: 700, color: alpha(theme.palette.text.secondary, 0.72), textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.64rem' }}>
                                  Audio Transcript Excerpts
                                </Typography>
                                <Stack spacing={0.75}>
                                  {mediaEvidence.audioTranscripts.slice(0, 2).map((item, index) => (
                                    <Typography key={`audio-transcript-${index}`} variant="body2" sx={{ lineHeight: 1.6, color: alpha(theme.palette.text.secondary, 0.86), fontStyle: 'italic' }}>
                                      {item}
                                    </Typography>
                                  ))}
                                </Stack>
                              </Box>
                            )}

                            {mediaEvidence.videoTranscripts.length > 0 && (
                              <Box>
                                <Typography variant="caption" sx={{ display: 'block', mb: 0.6, fontWeight: 700, color: alpha(theme.palette.text.secondary, 0.72), textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.64rem' }}>
                                  Video Audio Transcript Excerpts
                                </Typography>
                                <Stack spacing={0.75}>
                                  {mediaEvidence.videoTranscripts.slice(0, 2).map((item, index) => (
                                    <Typography key={`video-transcript-${index}`} variant="body2" sx={{ lineHeight: 1.6, color: alpha(theme.palette.text.secondary, 0.86), fontStyle: 'italic' }}>
                                      {item}
                                    </Typography>
                                  ))}
                                </Stack>
                              </Box>
                            )}
                          </Stack>
                        </Paper>
                      </Box>
                    );
                  })()}

                  <Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 0.75 }}>
                      <Typography variant="caption" fontWeight={600} sx={{ color: alpha(theme.palette.text.secondary, 0.6), textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.65rem' }}>
                        Integrity & Fraud Signals
                      </Typography>
                      {selectedReport.integrity_snapshot && (
                        <Chip
                          size="small"
                          label={`${getIntegritySeverityMeta(selectedReport.integrity_snapshot.integrity_severity).label} ${formatIntegrityScore(selectedReport)}`}
                          sx={{
                            height: 22,
                            fontSize: '0.64rem',
                            fontWeight: 700,
                            border: '1px solid',
                            borderColor: getIntegritySeverityMeta(selectedReport.integrity_snapshot.integrity_severity).border,
                            bgcolor: getIntegritySeverityMeta(selectedReport.integrity_snapshot.integrity_severity).background,
                            color: getIntegritySeverityMeta(selectedReport.integrity_snapshot.integrity_severity).color,
                          }}
                        />
                      )}
                    </Box>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 2,
                        borderRadius: '14px',
                        borderColor: alpha(theme.palette.divider, 0.08),
                        bgcolor: alpha(theme.palette.text.primary, 0.02),
                      }}
                    >
                      {loadingIntegrityDetails ? (
                        <CircularProgress size={20} />
                      ) : (
                        <Stack spacing={1.5}>
                          <Grid container spacing={1.5}>
                            <Grid size={{ xs: 12, md: 4 }}>
                              <Box
                                sx={{
                                  p: 1.75,
                                  borderRadius: '14px',
                                  bgcolor: getIntegritySeverityMeta(selectedReport.integrity_snapshot?.integrity_severity).background,
                                  border: '1px solid',
                                  borderColor: getIntegritySeverityMeta(selectedReport.integrity_snapshot?.integrity_severity).border,
                                }}
                              >
                                <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, color: alpha(theme.palette.text.secondary, 0.72), textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.64rem' }}>
                                  Integrity Score
                                </Typography>
                                <Typography variant="h4" sx={{ mt: 0.35, fontSize: '1.8rem', lineHeight: 1, fontWeight: 900, color: getIntegritySeverityMeta(selectedReport.integrity_snapshot?.integrity_severity).color }}>
                                  {formatIntegrityScore(selectedReport)}
                                </Typography>
                                <Stack direction="row" spacing={0.75} sx={{ mt: 1 }} useFlexGap flexWrap="wrap">
                                  <Chip
                                    size="small"
                                    label={getIntegritySeverityMeta(selectedReport.integrity_snapshot?.integrity_severity).label}
                                    sx={{
                                      height: 22,
                                      fontSize: '0.64rem',
                                      fontWeight: 700,
                                      border: '1px solid',
                                      borderColor: getIntegritySeverityMeta(selectedReport.integrity_snapshot?.integrity_severity).border,
                                      bgcolor: 'transparent',
                                      color: getIntegritySeverityMeta(selectedReport.integrity_snapshot?.integrity_severity).color,
                                    }}
                                  />
                                  <Chip
                                    size="small"
                                    label={`${selectedReport.integrity_snapshot?.active_signal_count ?? 0} signals`}
                                    sx={{
                                      height: 22,
                                      fontSize: '0.64rem',
                                      fontWeight: 700,
                                      bgcolor: alpha(theme.palette.grey[500], 0.08),
                                      color: theme.palette.text.secondary,
                                      border: '1px solid',
                                      borderColor: alpha(theme.palette.grey[500], 0.18),
                                    }}
                                  />
                                </Stack>
                              </Box>
                            </Grid>
                            <Grid size={{ xs: 12, md: 8 }}>
                              <Stack spacing={1}>
                                <Typography variant="body2" sx={{ color: alpha(theme.palette.text.secondary, 0.8), lineHeight: 1.6 }}>
                                  {selectedReport.integrity_snapshot?.active_signal_count
                                    ? 'Server-side fraud signals are active for this report. Review the signal list, duplicate cluster, and submission event trail before changing status.'
                                    : 'No active fraud signals are currently attached to this report. Submission history and duplicate clustering are still retained for audit.'}
                                </Typography>
                                <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
                                  {(selectedReport.integrity_snapshot?.active_signal_types || []).map((signalType) => (
                                    <Chip
                                      key={signalType}
                                      size="small"
                                      label={getIntegritySignalLabel(signalType)}
                                      sx={{
                                        fontWeight: 700,
                                        bgcolor: alpha(theme.palette.warning.main, 0.08),
                                        color: theme.palette.warning.dark,
                                        border: '1px solid',
                                        borderColor: alpha(theme.palette.warning.main, 0.18),
                                      }}
                                    />
                                  ))}
                                  {(selectedReport.integrity_snapshot?.duplicate_cluster_size ?? 0) > 1 && (
                                    <Chip
                                      size="small"
                                      label={`Cluster size ${selectedReport.integrity_snapshot?.duplicate_cluster_size ?? 0}`}
                                      sx={{
                                        fontWeight: 700,
                                        bgcolor: alpha(theme.palette.info.main, 0.08),
                                        color: theme.palette.info.main,
                                        border: '1px solid',
                                        borderColor: alpha(theme.palette.info.main, 0.18),
                                      }}
                                    />
                                  )}
                                  {selectedReport.integrity_snapshot?.latest_submission_result_code && (
                                    <Chip
                                      size="small"
                                      label={`Last submission ${selectedReport.integrity_snapshot.latest_submission_result_code}`}
                                      sx={{
                                        fontWeight: 700,
                                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                                        color: theme.palette.primary.main,
                                        border: '1px solid',
                                        borderColor: alpha(theme.palette.primary.main, 0.18),
                                      }}
                                    />
                                  )}
                                </Stack>
                              </Stack>
                            </Grid>
                          </Grid>

                          {integritySignals.length > 0 && (
                            <Box>
                              <Typography variant="caption" fontWeight={700} sx={{ color: alpha(theme.palette.text.secondary, 0.58), textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.62rem' }}>
                                Active Signals
                              </Typography>
                              <Stack spacing={0.75} sx={{ mt: 1 }}>
                                {integritySignals.slice(0, 6).map((signal) => (
                                  <Paper
                                    key={signal.id}
                                    variant="outlined"
                                    sx={{
                                      p: 1.25,
                                      borderRadius: '10px',
                                      borderColor: alpha(theme.palette.divider, 0.1),
                                      bgcolor: alpha(theme.palette.text.primary, 0.01),
                                    }}
                                  >
                                    <Stack direction="row" justifyContent="space-between" spacing={1} alignItems="center">
                                      <Box>
                                        <Typography variant="body2" fontWeight={700}>
                                          {getIntegritySignalLabel(signal.signal_type)}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: alpha(theme.palette.text.secondary, 0.58) }}>
                                          {format(new Date(signal.detected_at), 'PPpp')}
                                        </Typography>
                                      </Box>
                                      <Stack direction="row" spacing={0.75}>
                                        <Chip
                                          size="small"
                                          label={`${getIntegritySeverityMeta(signal.severity).label} ${signal.score}`}
                                          sx={{
                                            fontWeight: 700,
                                            bgcolor: getIntegritySeverityMeta(signal.severity).background,
                                            color: getIntegritySeverityMeta(signal.severity).color,
                                            border: '1px solid',
                                            borderColor: getIntegritySeverityMeta(signal.severity).border,
                                          }}
                                        />
                                        <Chip
                                          size="small"
                                          label={signal.status}
                                          sx={{
                                            fontWeight: 700,
                                            bgcolor: alpha(theme.palette.grey[500], 0.08),
                                            color: theme.palette.text.secondary,
                                            border: '1px solid',
                                            borderColor: alpha(theme.palette.grey[500], 0.18),
                                          }}
                                        />
                                      </Stack>
                                    </Stack>
                                  </Paper>
                                ))}
                              </Stack>
                            </Box>
                          )}

                          {duplicateClusterMembers.length > 1 && (
                            <Box>
                              <Typography variant="caption" fontWeight={700} sx={{ color: alpha(theme.palette.text.secondary, 0.58), textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.62rem' }}>
                                Duplicate Cluster Members
                              </Typography>
                              <Stack spacing={0.75} sx={{ mt: 1 }}>
                                {duplicateClusterMembers.slice(0, 6).map((member) => (
                                  <Paper
                                    key={member.report_id}
                                    variant="outlined"
                                    sx={{
                                      p: 1.25,
                                      borderRadius: '10px',
                                      borderColor: alpha(theme.palette.divider, 0.1),
                                      bgcolor: member.report_id === selectedReport.id ? alpha(theme.palette.primary.main, 0.04) : alpha(theme.palette.text.primary, 0.01),
                                    }}
                                  >
                                    <Stack direction="row" justifyContent="space-between" spacing={1}>
                                      <Box sx={{ minWidth: 0 }}>
                                        <Typography variant="body2" fontWeight={700}>
                                          {member.user_name || 'Unknown reporter'} • {member.hazard_type}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: alpha(theme.palette.text.secondary, 0.82), mt: 0.35 }}>
                                          {(member.translated_english || member.description || '').slice(0, 140)}
                                        </Typography>
                                      </Box>
                                      <Stack alignItems="flex-end" spacing={0.5}>
                                        <Chip size="small" label={member.status.toUpperCase()} sx={{ fontWeight: 700 }} />
                                        <Typography variant="caption" sx={{ color: alpha(theme.palette.text.secondary, 0.58) }}>
                                          {format(new Date(member.created_at), 'PPp')}
                                        </Typography>
                                      </Stack>
                                    </Stack>
                                  </Paper>
                                ))}
                              </Stack>
                            </Box>
                          )}

                          {submissionEvents.length > 0 && (
                            <Box>
                              <Typography variant="caption" fontWeight={700} sx={{ color: alpha(theme.palette.text.secondary, 0.58), textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.62rem' }}>
                                Submission Events
                              </Typography>
                              <Stack spacing={0.75} sx={{ mt: 1 }}>
                                {submissionEvents.slice(0, 6).map((event) => (
                                  <Paper
                                    key={event.id}
                                    variant="outlined"
                                    sx={{
                                      p: 1.25,
                                      borderRadius: '10px',
                                      borderColor: alpha(theme.palette.divider, 0.1),
                                      bgcolor: alpha(theme.palette.text.primary, 0.01),
                                    }}
                                  >
                                    <Stack direction="row" justifyContent="space-between" spacing={1}>
                                      <Box>
                                        <Typography variant="body2" fontWeight={700}>
                                          {event.event_type.replace(/_/g, ' ')} • {event.result_code}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: alpha(theme.palette.text.secondary, 0.58) }}>
                                          {format(new Date(event.created_at), 'PPpp')}
                                        </Typography>
                                      </Box>
                                      <Chip
                                        size="small"
                                        label={event.device_id ? `Device ${event.device_id.slice(-6)}` : 'No device'}
                                        sx={{
                                          fontWeight: 700,
                                          bgcolor: alpha(theme.palette.grey[500], 0.08),
                                          color: theme.palette.text.secondary,
                                          border: '1px solid',
                                          borderColor: alpha(theme.palette.grey[500], 0.18),
                                        }}
                                      />
                                    </Stack>
                                  </Paper>
                                ))}
                              </Stack>
                            </Box>
                          )}
                        </Stack>
                      )}
                    </Paper>
                  </Box>

                  {/* Location & Contact Grid */}
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 6 }}>
                      <Stack spacing={2.5}>
                        <Box>
                          <Typography variant="caption" fontWeight={700} sx={{ color: alpha(theme.palette.text.secondary, 0.6), textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.65rem' }}>
                            Location Coordinates
                          </Typography>
                          <Typography variant="body2" fontWeight={600} sx={{ mt: 0.5, fontFamily: '"JetBrains Mono", monospace', fontSize: '0.9rem' }}>
                            {selectedReport.latitude.toFixed(6)}°N, {selectedReport.longitude.toFixed(6)}°E
                          </Typography>
                        </Box>

                        <Box>
                          <Typography variant="caption" fontWeight={700} sx={{ color: alpha(theme.palette.text.secondary, 0.6), textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.65rem' }}>
                            Reporter Info
                          </Typography>
                          <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                            <Typography variant="body2" fontWeight={500}>
                              {selectedReport.user_name || 'Anonymous'}
                            </Typography>
                            <Typography variant="body2" sx={{ fontFamily: '"JetBrains Mono", monospace', color: theme.palette.text.secondary, fontSize: '0.85rem' }}>
                              {safeMaskPhone(selectedReport.user_phone)}
                            </Typography>
                          </Stack>
                        </Box>
                      </Stack>
                    </Grid>

                    <Grid size={{ xs: 6 }}>
                      <Stack spacing={2.5}>
                        <Box>
                          <Typography variant="caption" fontWeight={700} sx={{ color: alpha(theme.palette.text.secondary, 0.6), textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.65rem' }}>
                            Timestamps
                          </Typography>
                          <Stack spacing={1} sx={{ mt: 0.5 }}>
                            <Box>
                              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block', fontSize: '0.7rem' }}>Event Time</Typography>
                              <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.9rem' }}>{format(new Date(selectedReport.event_time), 'MMM dd, yyyy • hh:mm a')}</Typography>
                            </Box>
                            <Box>
                              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block', fontSize: '0.7rem' }}>System Logged At</Typography>
                              <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.9rem' }}>{format(new Date(selectedReport.created_at), 'MMM dd, yyyy • hh:mm a')}</Typography>
                            </Box>
                          </Stack>
                        </Box>

                        {/* AI priority */}
                        <Box>
                          <Typography variant="caption" fontWeight={700} sx={{ color: alpha(theme.palette.text.secondary, 0.6), textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.65rem' }}>
                            Priority
                          </Typography>
                          <Box sx={{ mt: 0.5 }}>
                            {selectedReport.ai_analysis ? (
                              <Stack direction="row" spacing={0.75} alignItems="center" useFlexGap flexWrap="wrap">
                                <Chip
                                  label={getAiPriorityDisplayMeta(selectedReport).label}
                                  size="small"
                                  sx={{ fontWeight: 700, fontSize: '0.75rem', px: 0.5, py: 1.5, bgcolor: getAiPriorityDisplayMeta(selectedReport).background, color: getAiPriorityDisplayMeta(selectedReport).color, border: '1px solid', borderColor: getAiPriorityDisplayMeta(selectedReport).border }}
                                />
                              </Stack>
                            ) : (
                              <Typography variant="body2" sx={{ color: alpha(theme.palette.text.secondary, 0.5) }}>—</Typography>
                            )}
                          </Box>
                        </Box>

                        {getAffectedNearbyLabel(selectedReport) && (
                          <Box>
                            <Typography variant="caption" fontWeight={700} sx={{ color: alpha(theme.palette.text.secondary, 0.6), textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.65rem' }}>
                              Affected Nearby
                            </Typography>
                            <Box sx={{ mt: 0.5 }}>
                              <Chip
                                icon={<PeopleIcon sx={{ fontSize: '1rem !important' }} />}
                                label={getAffectedNearbyLabel(selectedReport)}
                                size="small"
                                sx={{ fontWeight: 700, fontSize: '0.75rem', px: 0.5, py: 1.5, bgcolor: alpha(theme.palette.primary.main, 0.08), color: theme.palette.primary.main, border: '1px solid', borderColor: alpha(theme.palette.primary.main, 0.2), '& .MuiChip-icon': { color: alpha(theme.palette.primary.main, 0.8) } }}
                              />
                            </Box>
                          </Box>
                        )}
                      </Stack>
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
                            <Box sx={{ p: 1.5, border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, borderRadius: '10px', bgcolor: alpha(theme.palette.text.primary, 0.03) }}>
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
                          <Paper key={log.id} variant="outlined" sx={{ p: 1.25, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '10px', borderColor: alpha(theme.palette.divider, 0.1), bgcolor: alpha(theme.palette.text.primary, 0.01) }}>
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
              <DialogActions sx={{ px: 3, py: 2.5, bgcolor: alpha(theme.palette.text.primary, 0.04), borderTop: `1px solid ${alpha(theme.palette.divider, 0.08)}` }}>
                {selectedReport.status === 'pending' && (
                  <Stack direction="row" spacing={1.5} sx={{ mr: 'auto' }}>
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<CheckCircleIcon />}
                      disabled={statusUpdatingId === selectedReport.id}
                      onClick={() => updateStatus(selectedReport, 'verified')}
                      sx={{ 
                        borderRadius: '12px', 
                        textTransform: 'none', 
                        fontWeight: 700, 
                        px: 3, 
                        py: 0.8,
                        boxShadow: 'none',
                        bgcolor: alpha(theme.palette.success.main, 0.1),
                        color: theme.palette.success.dark,
                        '&:hover': {
                          boxShadow: 'none',
                          bgcolor: alpha(theme.palette.success.main, 0.18),
                          transform: 'translateY(-1px)'
                        },
                        transition: 'all 0.2s'
                      }}
                    >
                      {statusUpdatingId === selectedReport.id ? 'Updating...' : 'Verify Report'}
                    </Button>
                    <Button
                      variant="contained"
                      color="error"
                      startIcon={<CancelIcon />}
                      disabled={statusUpdatingId === selectedReport.id}
                      onClick={() => updateStatus(selectedReport, 'rejected')}
                      sx={{ 
                        borderRadius: '12px', 
                        textTransform: 'none', 
                        fontWeight: 700, 
                        px: 3, 
                        py: 0.8,
                        boxShadow: 'none',
                        bgcolor: alpha(theme.palette.error.main, 0.1),
                        color: theme.palette.error.dark,
                        '&:hover': {
                          boxShadow: 'none',
                          bgcolor: alpha(theme.palette.error.main, 0.18),
                          transform: 'translateY(-1px)'
                        },
                        transition: 'all 0.2s'
                      }}
                    >
                      Reject Report
                    </Button>
                  </Stack>
                )}
                <Button 
                  onClick={() => setDetailDialogOpen(false)} 
                  variant="text"
                  sx={{ 
                    borderRadius: '12px', 
                    textTransform: 'none', 
                    fontWeight: 600,
                    color: theme.palette.text.secondary,
                    px: 3,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.grey[500], 0.08)
                    }
                  }}
                >
                  Close
                </Button>
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


