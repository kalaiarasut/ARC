import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Container,
  Divider,
  Grid,
  IconButton,
  Paper,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import GTranslateIcon from '@mui/icons-material/GTranslate';
import RefreshIcon from '@mui/icons-material/Refresh';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import { format } from 'date-fns';

import { isSupabaseConfigured } from '../core/supabase_config';
import { useAuth } from '../contexts/AuthContext';
import { advisoryService } from '../services/advisoryService';
import { riskZoneService } from '../services/riskZoneService';
import type {
  AdvisoryCategory,
  AdvisorySeverity,
  AdvisoryTranslationDraft,
  OfficialAdvisory,
} from '../types/advisory';

const CATEGORIES: { value: AdvisoryCategory; label: string }[] = [
  { value: 'food', label: 'Food' },
  { value: 'shelter', label: 'Shelter' },
  { value: 'medical', label: 'Medical' },
  { value: 'rescue', label: 'Rescue' },
  { value: 'roadblock', label: 'Roadblock' },
  { value: 'warning', label: 'Warning' },
  { value: 'evacuation', label: 'Evacuation' },
];

const SEVERITIES: { value: AdvisorySeverity; label: string }[] = [
  { value: 'info', label: 'Info' },
  { value: 'watch', label: 'Watch' },
  { value: 'warning', label: 'Warning' },
];

const TARGET_LANGUAGES: Array<{
  code: AdvisoryTranslationDraft['language_code'];
  label: string;
  nativeLabel: string;
}> = [
  { code: 'ta', label: 'Tamil', nativeLabel: 'தமிழ்' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी' },
  { code: 'te', label: 'Telugu', nativeLabel: 'తెలుగు' },
  { code: 'ml', label: 'Malayalam', nativeLabel: 'മലയാളം' },
];

const getSeverityChipColor = (severity: AdvisorySeverity) => {
  switch (severity) {
    case 'warning':
      return 'error' as const;
    case 'watch':
      return 'warning' as const;
    case 'info':
    default:
      return 'info' as const;
  }
};

const getCategoryChipColor = (category: AdvisoryCategory) => {
  switch (category) {
    case 'medical':
      return 'error' as const;
    case 'evacuation':
      return 'warning' as const;
    case 'rescue':
      return 'primary' as const;
    case 'shelter':
    case 'food':
      return 'success' as const;
    case 'roadblock':
      return 'secondary' as const;
    case 'warning':
    default:
      return 'info' as const;
  }
};

const formatDateTime = (value: string | null) => {
  if (!value) return '-';

  try {
    return format(new Date(value), 'dd MMM yyyy, hh:mm a');
  } catch {
    return '-';
  }
};

export function Advisories() {
  const { isAuthenticated } = useAuth();
  const theme = useTheme();

  const [isAdmin, setIsAdmin] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [publishExpanded, setPublishExpanded] = useState(false);

  const [items, setItems] = useState<OfficialAdvisory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);

  const [publishing, setPublishing] = useState(false);
  const [generatingTranslations, setGeneratingTranslations] = useState(false);
  const [translations, setTranslations] = useState<AdvisoryTranslationDraft[]>([]);
  const [activeTranslationTab, setActiveTranslationTab] =
    useState<AdvisoryTranslationDraft['language_code']>('ta');

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [region, setRegion] = useState('');
  const [category, setCategory] = useState<AdvisoryCategory>('warning');
  const [severity, setSeverity] = useState<AdvisorySeverity>('info');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [radius, setRadius] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [hotline, setHotline] = useState('');

  const supabaseOk = useMemo(() => isSupabaseConfigured(), []);
  const sourceReady = title.trim().length > 0 && body.trim().length > 0;
  const reviewedTranslations = useMemo(
    () =>
      TARGET_LANGUAGES.every((lang) =>
        translations.some(
          (translation) =>
            translation.language_code === lang.code &&
            translation.translation_status === 'reviewed' &&
            translation.title.trim().length > 0 &&
            translation.body.trim().length > 0,
        ),
      ),
    [translations],
  );

  const load = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!isSupabaseConfigured()) {
        setItems([]);
        setTotalCount(0);
        setError(
          'Supabase not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in admin_web/.env.local and restart the dev server.',
        );
        return;
      }

      const { data, total } = await advisoryService.getAdvisoriesWithCount(page, rowsPerPage);
      setItems(data);
      setTotalCount(total);
    } catch (e) {
      console.error(e);
      setItems([]);
      setTotalCount(0);
      setError('Failed to load official updates.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage]);

  useEffect(() => {
    if (!isAuthenticated || !supabaseOk) {
      setIsAdmin(false);
      return;
    }

    let cancelled = false;
    riskZoneService
      .isAdmin()
      .then((value) => {
        if (!cancelled) setIsAdmin(Boolean(value));
      })
      .catch(() => {
        if (!cancelled) setIsAdmin(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, supabaseOk]);

  const parseNullableNumber = (value: string): number | null => {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const toIsoOrNull = (value: string): string | null => {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = new Date(trimmed);
    return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : null;
  };

  const clearTranslationDrafts = () => {
    setTranslations([]);
    setActiveTranslationTab('ta');
  };

  const updateTranslationDraft = (
    languageCode: AdvisoryTranslationDraft['language_code'],
    patch: Partial<AdvisoryTranslationDraft>,
  ) => {
    setTranslations((current) =>
      current.map((translation) => {
        if (translation.language_code !== languageCode) return translation;

        const next = { ...translation, ...patch };
        const touchedText =
          patch.title !== undefined || patch.body !== undefined || patch.region !== undefined;

        if (touchedText && translation.translation_status === 'reviewed') {
          next.translation_status = 'generated';
        }

        return next;
      }),
    );
  };

  const markTranslationReviewed = (languageCode: AdvisoryTranslationDraft['language_code']) => {
    const draft = translations.find((translation) => translation.language_code === languageCode);

    if (!draft || !draft.title.trim() || !draft.body.trim()) {
      setError('Each translation must include a title and message before review.');
      return;
    }

    updateTranslationDraft(languageCode, {
      translation_status: 'reviewed',
      error: undefined,
    });
  };

  const resetForm = () => {
    setTitle('');
    setBody('');
    setRegion('');
    setCategory('warning');
    setSeverity('info');
    setLat('');
    setLng('');
    setRadius('');
    setStartsAt('');
    setExpiresAt('');
    setPhone('');
    setWhatsapp('');
    setHotline('');
    clearTranslationDrafts();
  };

  const handleGenerateTranslations = async () => {
    if (!title.trim() || !body.trim()) {
      setError('Title and message are required before translation.');
      return;
    }

    if (!isAuthenticated) {
      setError('Please login to generate translations.');
      return;
    }

    try {
      setGeneratingTranslations(true);
      setError(null);

      const preview = await advisoryService.generateTranslationPreview({
        title: title.trim(),
        body: body.trim(),
        region: region.trim() || null,
        target_languages: TARGET_LANGUAGES.map((lang) => lang.code),
      });

      setTranslations(preview.translations);
      if (preview.translations.length > 0) {
        setActiveTranslationTab(preview.translations[0].language_code);
      }
    } catch (e) {
      console.error(e);
      setError('Failed to generate translations. Check Sarvam configuration and admin access.');
    } finally {
      setGeneratingTranslations(false);
    }
  };

  const handlePublish = async () => {
    if (!title.trim() || !body.trim()) {
      setError('Title and message are required.');
      return;
    }

    if (!isAuthenticated) {
      setError('Please login to publish official updates.');
      return;
    }

    if (!reviewedTranslations) {
      setError('Generate and review all required translations before publish.');
      return;
    }

    try {
      setPublishing(true);
      setError(null);

      const latitude = parseNullableNumber(lat);
      const longitude = parseNullableNumber(lng);
      const radiusKm = parseNullableNumber(radius);

      if ((latitude === null) !== (longitude === null)) {
        setError('Please provide both Latitude and Longitude (or leave both empty).');
        return;
      }

      await advisoryService.publishAdvisory({
        title: title.trim(),
        body: body.trim(),
        region: region.trim() || null,
        category,
        severity,
        latitude,
        longitude,
        radius_km: radiusKm,
        starts_at: toIsoOrNull(startsAt),
        expires_at: toIsoOrNull(expiresAt),
        contact_phone: phone.trim() || null,
        contact_whatsapp: whatsapp.trim() || null,
        contact_hotline: hotline.trim() || null,
        source_language: 'en',
        translations,
      });

      resetForm();
      setPage(0);
      await load();
    } catch (e) {
      console.error(e);
      setError('Failed to publish update. Check your permissions (RLS) and login status.');
    } finally {
      setPublishing(false);
    }
  };

  const handleDelete = async (advisoryId: string) => {
    if (!isAuthenticated) {
      setError('Please login to delete updates.');
      return;
    }

    if (!isAdmin) {
      setError('You do not have permission to delete updates.');
      return;
    }

    const ok = window.confirm('Delete this official update? This cannot be undone.');
    if (!ok) return;

    try {
      setDeletingId(advisoryId);
      setError(null);

      await advisoryService.deleteAdvisory(advisoryId);

      const nextTotal = Math.max(0, totalCount - 1);
      const isLastRowOnPage = items.length === 1;
      const nextMaxPage = Math.max(0, Math.ceil(nextTotal / rowsPerPage) - 1);

      if (isLastRowOnPage && page > nextMaxPage) {
        setTotalCount(nextTotal);
        setPage(nextMaxPage);
        return;
      }

      await load();
    } catch (e) {
      console.error(e);
      setError('Failed to delete update. Check your permissions (RLS) and login status.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: alpha(theme.palette.primary.main, 0.02),
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box
        sx={{
          px: { xs: 2, sm: 3 },
          py: 2,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(
            theme.palette.background.paper,
            1,
          )} 100%)`,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.primary.main, 0.12),
                color: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CampaignOutlinedIcon />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700}>
                Official Updates
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Publish alerts and advisories
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1}>
            <Tooltip title="Refresh updates">
              <span>
                <IconButton onClick={load} disabled={loading} size="small">
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Button
              variant={publishExpanded ? 'outlined' : 'contained'}
              size="small"
              startIcon={publishExpanded ? <CloseIcon /> : <AddCircleOutlineIcon />}
              onClick={() => setPublishExpanded((current) => !current)}
              sx={{ textTransform: 'none' }}
            >
              {publishExpanded ? 'Cancel' : 'New Update'}
            </Button>
          </Stack>
        </Stack>
      </Box>

      <Container maxWidth="xl" sx={{ pt: 2.5, pb: 4 }}>
        {!supabaseOk && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Supabase is not configured. Publishing and loading updates will not work.
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Collapse in={publishExpanded}>
          <Paper variant="outlined" sx={{ mb: 3, p: { xs: 2, md: 3 } }}>
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Stack spacing={2}>
                  <TextField
                    label="Title"
                    value={title}
                    onChange={(event) => {
                      setTitle(event.target.value);
                      clearTranslationDrafts();
                    }}
                    fullWidth
                    size="small"
                    placeholder="Enter alert title..."
                  />
                  <TextField
                    label="Message"
                    value={body}
                    onChange={(event) => {
                      setBody(event.target.value);
                      clearTranslationDrafts();
                    }}
                    fullWidth
                    size="small"
                    multiline
                    minRows={4}
                  />
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <TextField
                      label="Category"
                      select
                      value={category}
                      onChange={(event) => setCategory(event.target.value as AdvisoryCategory)}
                      fullWidth
                      size="small"
                      SelectProps={{ native: true }}
                    >
                      {CATEGORIES.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </TextField>
                    <TextField
                      label="Severity"
                      select
                      value={severity}
                      onChange={(event) => setSeverity(event.target.value as AdvisorySeverity)}
                      fullWidth
                      size="small"
                      SelectProps={{ native: true }}
                    >
                      {SEVERITIES.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </TextField>
                  </Stack>
                  <TextField
                    label="Region"
                    value={region}
                    onChange={(event) => {
                      setRegion(event.target.value);
                      clearTranslationDrafts();
                    }}
                    fullWidth
                    size="small"
                  />
                </Stack>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Stack spacing={2}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <TextField
                      label="Latitude"
                      value={lat}
                      onChange={(event) => setLat(event.target.value)}
                      fullWidth
                      size="small"
                      inputProps={{ inputMode: 'decimal' }}
                    />
                    <TextField
                      label="Longitude"
                      value={lng}
                      onChange={(event) => setLng(event.target.value)}
                      fullWidth
                      size="small"
                      inputProps={{ inputMode: 'decimal' }}
                    />
                    <TextField
                      label="Target Radius (km)"
                      value={radius}
                      onChange={(event) => setRadius(event.target.value)}
                      fullWidth
                      size="small"
                      inputProps={{ inputMode: 'decimal' }}
                      disabled={!lat && !lng}
                    />
                  </Stack>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <TextField
                      label="Starts At"
                      type="datetime-local"
                      value={startsAt}
                      onChange={(event) => setStartsAt(event.target.value)}
                      fullWidth
                      size="small"
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                      label="Expires At"
                      type="datetime-local"
                      value={expiresAt}
                      onChange={(event) => setExpiresAt(event.target.value)}
                      fullWidth
                      size="small"
                      InputLabelProps={{ shrink: true }}
                    />
                  </Stack>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <TextField
                      label="Phone"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      fullWidth
                      size="small"
                    />
                    <TextField
                      label="WhatsApp"
                      value={whatsapp}
                      onChange={(event) => setWhatsapp(event.target.value)}
                      fullWidth
                      size="small"
                    />
                  </Stack>
                  <TextField
                    label="Hotline"
                    value={hotline}
                    onChange={(event) => setHotline(event.target.value)}
                    fullWidth
                    size="small"
                  />
                </Stack>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Stack spacing={2}>
                    <Stack
                      direction={{ xs: 'column', md: 'row' }}
                      spacing={1.5}
                      alignItems={{ xs: 'flex-start', md: 'center' }}
                      justifyContent="space-between"
                    >
                      <Box>
                        <Typography variant="subtitle1" fontWeight={700}>
                          Step 2: Generate and review translations
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Generate Sarvam previews for Tamil, Hindi, Telugu, and Malayalam, then
                          review each translation before publishing.
                        </Typography>
                      </Box>

                      <Tooltip
                        title={
                          sourceReady
                            ? 'Generate translation previews'
                            : 'Generate translations after the English source is ready'
                        }
                      >
                        <span>
                          <Button
                            variant="outlined"
                            startIcon={
                              generatingTranslations ? (
                                <CircularProgress size={16} color="inherit" />
                              ) : (
                                <GTranslateIcon />
                              )
                            }
                            onClick={handleGenerateTranslations}
                            disabled={generatingTranslations || !sourceReady}
                            sx={{ textTransform: 'none' }}
                          >
                            {generatingTranslations ? 'Generating...' : 'Generate Translations'}
                          </Button>
                        </span>
                      </Tooltip>
                    </Stack>

                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                      <Chip
                        label="1. Source (English)"
                        color={sourceReady ? 'primary' : 'default'}
                        size="small"
                      />
                      <Chip
                        label="2. Review translations"
                        color={translations.length > 0 ? 'primary' : 'default'}
                        variant={translations.length > 0 ? 'filled' : 'outlined'}
                        size="small"
                      />
                      <Chip
                        label="3. Publish"
                        color={reviewedTranslations ? 'success' : 'default'}
                        variant={reviewedTranslations ? 'filled' : 'outlined'}
                        size="small"
                      />
                    </Stack>

                    {translations.length === 0 ? (
                      <Alert severity="info">
                        Generate translations after you finish the English source advisory.
                      </Alert>
                    ) : (
                      <>
                        <Tabs
                          value={activeTranslationTab}
                          onChange={(_, value: AdvisoryTranslationDraft['language_code']) =>
                            setActiveTranslationTab(value)
                          }
                          variant="scrollable"
                          allowScrollButtonsMobile
                        >
                          {TARGET_LANGUAGES.map((language) => {
                            const draft = translations.find(
                              (item) => item.language_code === language.code,
                            );
                            const status = draft?.translation_status ?? 'failed';

                            return (
                              <Tab
                                key={language.code}
                                value={language.code}
                                label={`${language.label} · ${status}`}
                              />
                            );
                          })}
                        </Tabs>

                        <Divider />

                        {TARGET_LANGUAGES.map((language) => {
                          if (language.code !== activeTranslationTab) return null;
                          const draft = translations.find(
                            (item) => item.language_code === language.code,
                          );
                          if (!draft) return null;

                          const statusColor =
                            draft.translation_status === 'reviewed'
                              ? 'success'
                              : draft.translation_status === 'failed'
                                ? 'error'
                                : 'warning';

                          return (
                            <Stack key={language.code} spacing={2}>
                              <Stack
                                direction={{ xs: 'column', md: 'row' }}
                                spacing={1.5}
                                alignItems={{ xs: 'flex-start', md: 'center' }}
                                justifyContent="space-between"
                              >
                                <Stack
                                  direction="row"
                                  spacing={1}
                                  useFlexGap
                                  flexWrap="wrap"
                                  alignItems="center"
                                >
                                  <Typography variant="subtitle2" fontWeight={700}>
                                    {language.label}
                                  </Typography>
                                  <Chip
                                    label={language.nativeLabel}
                                    size="small"
                                    variant="outlined"
                                  />
                                  <Chip
                                    label={draft.translation_status.toUpperCase()}
                                    size="small"
                                    color={statusColor}
                                  />
                                </Stack>
                                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                                  <Chip
                                    label={`Provider: ${draft.provider ?? 'sarvam'}`}
                                    size="small"
                                    variant="outlined"
                                  />
                                  <Chip
                                    label={`Model: ${draft.model ?? 'n/a'}`}
                                    size="small"
                                    variant="outlined"
                                  />
                                </Stack>
                              </Stack>

                              {draft.error && <Alert severity="warning">{draft.error}</Alert>}

                              <TextField
                                label={`${language.label} Title`}
                                value={draft.title}
                                onChange={(event) =>
                                  updateTranslationDraft(language.code, {
                                    title: event.target.value,
                                    error: undefined,
                                  })
                                }
                                fullWidth
                                size="small"
                              />
                              <TextField
                                label={`${language.label} Message`}
                                value={draft.body}
                                onChange={(event) =>
                                  updateTranslationDraft(language.code, {
                                    body: event.target.value,
                                    error: undefined,
                                  })
                                }
                                fullWidth
                                size="small"
                                multiline
                                minRows={3}
                              />
                              <TextField
                                label={`${language.label} Region`}
                                value={draft.region ?? ''}
                                onChange={(event) =>
                                  updateTranslationDraft(language.code, {
                                    region: event.target.value || null,
                                    error: undefined,
                                  })
                                }
                                fullWidth
                                size="small"
                              />

                              <Stack direction="row" spacing={1} justifyContent="flex-end">
                                <Button
                                  variant="outlined"
                                  onClick={() =>
                                    updateTranslationDraft(language.code, {
                                      translation_status: 'generated',
                                      error: undefined,
                                    })
                                  }
                                  sx={{ textTransform: 'none' }}
                                >
                                  Mark Pending Review
                                </Button>
                                <Button
                                  variant="contained"
                                  startIcon={<TaskAltIcon />}
                                  onClick={() => markTranslationReviewed(language.code)}
                                  sx={{ textTransform: 'none' }}
                                >
                                  Mark Reviewed
                                </Button>
                              </Stack>
                            </Stack>
                          );
                        })}
                      </>
                    )}
                  </Stack>
                </Paper>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Stack direction="row" spacing={1.5} justifyContent="flex-end">
                  <Button
                    variant="text"
                    onClick={resetForm}
                    disabled={publishing}
                    sx={{ textTransform: 'none' }}
                  >
                    Clear
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={
                      publishing ? <CircularProgress size={16} color="inherit" /> : <SendOutlinedIcon />
                    }
                    onClick={handlePublish}
                    disabled={publishing || !sourceReady || !reviewedTranslations}
                    sx={{ textTransform: 'none' }}
                  >
                    {publishing ? 'Publishing...' : 'Publish Update'}
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </Paper>
        </Collapse>

        <Paper variant="outlined">
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            justifyContent="space-between"
            sx={{ px: 2, py: 1.5 }}
          >
            <Typography variant="h6" fontWeight={700}>
              Recent Updates
            </Typography>
            <Chip label={`${totalCount} total`} size="small" color="info" variant="outlined" />
          </Stack>

          <Divider />

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Published</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Severity</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Region</TableCell>
                  <TableCell>Validity</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                      <CircularProgress size={24} />
                    </TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      No official updates published yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell>{formatDateTime(item.published_at)}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={
                            CATEGORIES.find((entry) => entry.value === item.category)?.label ??
                            item.category
                          }
                          color={getCategoryChipColor(item.category)}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={
                            SEVERITIES.find((entry) => entry.value === item.severity)?.label ??
                            item.severity
                          }
                          color={getSeverityChipColor(item.severity)}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Stack spacing={0.5}>
                          <Typography variant="body2" fontWeight={600}>
                            {item.title}
                          </Typography>
                          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                            <Chip
                              size="small"
                              label={`Source: ${item.source_language.toUpperCase()}`}
                              variant="outlined"
                            />
                            {item.latitude !== null && item.longitude !== null && (
                              <Chip
                                size="small"
                                label={`Targeted${item.radius_km ? ` · ${item.radius_km} km` : ''}`}
                                variant="outlined"
                              />
                            )}
                          </Stack>
                        </Stack>
                      </TableCell>
                      <TableCell>{item.region || '-'}</TableCell>
                      <TableCell>
                        <Stack spacing={0.25}>
                          <Typography variant="caption" color="text.secondary">
                            Start: {formatDateTime(item.starts_at)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            End: {formatDateTime(item.expires_at)}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title={isAdmin ? 'Delete update' : 'Admin access required'}>
                          <span>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDelete(item.id)}
                              disabled={!isAdmin || deletingId === item.id}
                            >
                              {deletingId === item.id ? (
                                <CircularProgress size={16} color="inherit" />
                              ) : (
                                <DeleteOutlineIcon fontSize="small" />
                              )}
                            </IconButton>
                          </span>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={totalCount}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(parseInt(event.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 25, 50, 100]}
          />
        </Paper>
      </Container>
    </Box>
  );
}
