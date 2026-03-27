import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Container,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditNoteIcon from '@mui/icons-material/EditNote';
import GTranslateIcon from '@mui/icons-material/GTranslate';
import PhoneIcon from '@mui/icons-material/Phone';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import PreviewIcon from '@mui/icons-material/Preview';
import RefreshIcon from '@mui/icons-material/Refresh';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { format } from 'date-fns';

import { isSupabaseConfigured } from '../core/supabase_config';
import { useAuth } from '../contexts/AuthContext';
import { advisoryService } from '../services/advisoryService';
import { riskZoneService } from '../services/riskZoneService';
import type { OfficialAdvisory } from '../types/advisory';
import { useAdvisoryForm } from '../components/advisories/hooks/useAdvisoryForm';
import { useTranslations } from '../components/advisories/hooks/useTranslations';
import { FormSection } from '../components/advisories/FormSection';
import { TranslationProgressBar } from '../components/advisories/TranslationProgressBar';
import { TranslationEditor } from '../components/advisories/TranslationEditor';

const CATEGORIES = [
  { value: 'food' as const, label: 'Food', color: '#10b981' },
  { value: 'shelter' as const, label: 'Shelter', color: '#6366f1' },
  { value: 'medical' as const, label: 'Medical', color: '#ef4444' },
  { value: 'rescue' as const, label: 'Rescue', color: '#f59e0b' },
  { value: 'roadblock' as const, label: 'Roadblock', color: '#64748b' },
  { value: 'warning' as const, label: 'Warning', color: '#eab308' },
  { value: 'evacuation' as const, label: 'Evacuation', color: '#dc2626' },
];

const SEVERITIES = [
  { value: 'info' as const, label: 'Informational', color: '#3b82f6' },
  { value: 'watch' as const, label: 'Watch', color: '#f59e0b' },
  { value: 'warning' as const, label: 'Warning', color: '#ef4444' },
];

const getCategoryColor = (category: string) => {
  const cat = CATEGORIES.find((c) => c.value === category);
  return cat?.color || '#64748b';
};

const getSeverityChipColor = (severity: string) => {
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

const formatDateTime = (value: string | null) => {
  if (!value) return '—';
  try {
    return format(new Date(value), 'MMM d, yyyy HH:mm');
  } catch {
    return '—';
  }
};

const normalizeSourceText = (value: string | null | undefined) => (value ?? '').trim();

const buildSourceSignature = (source: {
  title: string;
  body: string;
  region: string | null;
}) =>
  JSON.stringify({
    title: normalizeSourceText(source.title),
    body: normalizeSourceText(source.body),
    region: normalizeSourceText(source.region),
  });

const toDateTimeLocalValue = (value: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
};

const WIZARD_STEPS = [
  { label: 'Advisory Content', icon: <EditNoteIcon /> },
  { label: 'Location & Contacts', icon: <PlaceOutlinedIcon /> },
  { label: 'Translations', icon: <GTranslateIcon /> },
  { label: 'Review & Publish', icon: <PreviewIcon /> },
];

export function Advisories() {
  const { isAuthenticated } = useAuth();
  const theme = useTheme();

  const [isAdmin, setIsAdmin] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingAdvisory, setEditingAdvisory] = useState<OfficialAdvisory | null>(null);
  const [loadingEditTranslations, setLoadingEditTranslations] = useState(false);
  const [originalSourceSignature, setOriginalSourceSignature] = useState<string | null>(null);
  const [publishExpanded, setPublishExpanded] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const [items, setItems] = useState<OfficialAdvisory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);

  const [publishing, setPublishing] = useState(false);
  const [generatingTranslations, setGeneratingTranslations] = useState(false);

  const formState = useAdvisoryForm();
  const translationsState = useTranslations();
  const { form, updateField, setFormValues, resetForm, isSourceReady, parseNullableNumber, toIsoOrNull } =
    formState;
  const {
    translations,
    setTranslations,
    activeTab,
    setActiveTab,
    updateTranslation,
    markReviewed,
    markAllReviewed,
    markEditable,
    allReviewed,
    reviewedCount,
    totalCount: translationCount,
    languages,
    clearTranslations,
  } = translationsState;

  const supabaseOk = useMemo(() => isSupabaseConfigured(), []);
  const isEditing = editingAdvisory != null;
  const currentSourceSignature = useMemo(
    () =>
      buildSourceSignature({
        title: form.title,
        body: form.body,
        region: form.region,
      }),
    [form.title, form.body, form.region]
  );
  const sourceContentChanged = useMemo(
    () => (!isEditing ? true : currentSourceSignature !== originalSourceSignature),
    [currentSourceSignature, isEditing, originalSourceSignature]
  );
  const requiresTranslationStep = !isEditing || sourceContentChanged;
  const reviewStepIndex = requiresTranslationStep ? 3 : 2;
  const visibleSteps = useMemo(
    () =>
      requiresTranslationStep
        ? WIZARD_STEPS
        : [WIZARD_STEPS[0], WIZARD_STEPS[1], WIZARD_STEPS[3]],
    [requiresTranslationStep]
  );

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!isSupabaseConfigured()) {
        setItems([]);
        setTotalCount(0);
        setError(
          'Supabase not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in admin_web/.env.local and restart the dev server.'
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
  }, [page, rowsPerPage]);

  useEffect(() => {
    void load();
  }, [load]);

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

  const handleGenerateTranslations = async () => {
    if (!isSourceReady) {
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
        title: form.title.trim(),
        body: form.body.trim(),
        region: form.region.trim() || null,
        target_languages: languages.map((lang) => lang.code),
      });

      translationsState.setTranslations(preview.translations);
      if (preview.translations.length > 0) {
        setActiveTab(preview.translations[0].language_code);
      }
    } catch (e) {
      console.error(e);
      setError('Failed to generate translations. Check Sarvam configuration and admin access.');
    } finally {
      setGeneratingTranslations(false);
    }
  };

  const handleReset = () => {
    setEditingAdvisory(null);
    setOriginalSourceSignature(null);
    resetForm();
    clearTranslations();
    setActiveStep(0);
  };

  const handleEdit = useCallback(
    async (advisory: OfficialAdvisory) => {
      if (!isAuthenticated) {
        setError('Please login to edit official updates.');
        return;
      }

      try {
        setLoadingEditTranslations(true);
        setError(null);

        setEditingAdvisory(advisory);
        setOriginalSourceSignature(
          buildSourceSignature({
            title: advisory.title,
            body: advisory.body,
            region: advisory.region,
          })
        );
        setFormValues({
          title: advisory.title,
          body: advisory.body,
          region: advisory.region ?? '',
          category: advisory.category,
          severity: advisory.severity,
          lat: advisory.latitude?.toString() ?? '',
          lng: advisory.longitude?.toString() ?? '',
          radius: advisory.radius_km?.toString() ?? '',
          startsAt: toDateTimeLocalValue(advisory.starts_at),
          expiresAt: toDateTimeLocalValue(advisory.expires_at),
          phone: advisory.contact_phone ?? '',
          whatsapp: advisory.contact_whatsapp ?? '',
          hotline: advisory.contact_hotline ?? '',
        });

        const existingTranslations = await advisoryService.getAdvisoryTranslations(advisory.id);
        setTranslations(existingTranslations);
        setActiveTab(existingTranslations[0]?.language_code ?? 'ta');
        setActiveStep(0);
        setPublishExpanded(true);
      } catch (e) {
        console.error(e);
        setError('Failed to load advisory for editing.');
      } finally {
        setLoadingEditTranslations(false);
      }
    },
    [isAuthenticated, setFormValues, setActiveTab, setTranslations]
  );

  const handlePublish = async () => {
    if (!isSourceReady) {
      setError('Title and message are required.');
      return;
    }

    if (!isAuthenticated) {
      setError('Please login to publish official updates.');
      return;
    }

    if (requiresTranslationStep && !allReviewed) {
      setError('Generate and review all required translations before publish.');
      return;
    }

    try {
      setPublishing(true);
      setError(null);

      const latitude = parseNullableNumber(form.lat);
      const longitude = parseNullableNumber(form.lng);
      const radiusKm = parseNullableNumber(form.radius);

      if ((latitude === null) !== (longitude === null)) {
        setError('Please provide both Latitude and Longitude (or leave both empty).');
        return;
      }

      await advisoryService.publishAdvisory({
        advisory_id: editingAdvisory?.id,
        title: form.title.trim(),
        body: form.body.trim(),
        region: form.region.trim() || null,
        category: form.category,
        severity: form.severity,
        latitude,
        longitude,
        radius_km: radiusKm,
        starts_at: toIsoOrNull(form.startsAt),
        expires_at: toIsoOrNull(form.expiresAt),
        contact_phone: form.phone.trim() || null,
        contact_whatsapp: form.whatsapp.trim() || null,
        contact_hotline: form.hotline.trim() || null,
        source_language: 'en',
        translations: requiresTranslationStep ? translations : [],
        replace_translations: requiresTranslationStep,
      });

      handleReset();
      setPublishExpanded(false);
      setPage(0);
      await load();
    } catch (e) {
      console.error(e);
      setError(
        editingAdvisory
          ? 'Failed to save advisory changes. Check your permissions and login status.'
          : 'Failed to publish update. Check your permissions (RLS) and login status.'
      );
    } finally {
      setPublishing(false);
    }
  };

  const handleDelete = useCallback(
    async (advisoryId: string) => {
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
    },
    [isAuthenticated, isAdmin, items.length, load, page, rowsPerPage, totalCount]
  );

  const canAdvance = useMemo(() => {
    if (activeStep === 0) return isSourceReady;
    if (activeStep === 1) return true;
    if (requiresTranslationStep && activeStep === 2) return translations.length > 0;
    if (activeStep === reviewStepIndex) return requiresTranslationStep ? allReviewed : true;
    return false;
  }, [activeStep, allReviewed, isSourceReady, requiresTranslationStep, reviewStepIndex, translations.length]);

  useEffect(() => {
    if (activeStep > reviewStepIndex) {
      setActiveStep(reviewStepIndex);
    }
  }, [activeStep, reviewStepIndex]);

  const pendingReviewLanguages = useMemo(
    () =>
      languages.filter((lang) => {
        const draft = translations.find((t) => t.language_code === lang.code);
        return !(
          draft &&
          draft.translation_status === 'reviewed' &&
          draft.title.trim().length > 0 &&
          draft.body.trim().length > 0
        );
      }),
    [languages, translations]
  );

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box
        sx={{
          px: { xs: 2, sm: 3 },
          py: 2.5,
          bgcolor: 'background.paper',
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '12px',
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.25)}`,
              }}
            >
              <CampaignOutlinedIcon sx={{ fontSize: 22 }} />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={600} color="text.primary">
                Official Updates
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Publish alerts and advisories to citizens
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1.5}>
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
              onClick={() => {
                if (publishExpanded) {
                  handleReset();
                  setPublishExpanded(false);
                  return;
                }
                setPublishExpanded(true);
              }}
            >
              {publishExpanded ? (isEditing ? 'Cancel Edit' : 'Cancel') : 'New Update'}
            </Button>
          </Stack>
        </Stack>
      </Box>

      {/* Main Content */}
      <Container maxWidth="xl" sx={{ pt: 3, pb: 4, flex: 1 }}>
        {!supabaseOk && (
          <Alert severity="warning" sx={{ mb: 2, borderRadius: '12px' }}>
            Supabase is not configured. Publishing and loading updates will not work.
          </Alert>
        )}

        {error && (
          <Alert
            severity="error"
            sx={{ mb: 2, borderRadius: '12px' }}
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        {/* Wizard */}
        <Collapse in={publishExpanded}>
          <Paper
            elevation={0}
            sx={{
              mb: 3,
              borderRadius: '16px',
              overflow: 'hidden',
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: theme.shadows[2],
              bgcolor: 'background.paper',
            }}
          >
            {/* Stepper */}
            <Box
              sx={{
                px: { xs: 2, sm: 3, md: 4 },
                py: { xs: 2, md: 3 },
                bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.grey[900], 0.5) : theme.palette.grey[50],
                borderBottom: `1px solid ${theme.palette.divider}`,
                display: 'flex',
                justifyContent: 'center',
                gap: 2,
                flexWrap: 'wrap',
              }}
            >
              {visibleSteps.map((step, index) => {
                const isCompleted = activeStep > index;
                const isActive = activeStep === index;

                return (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 1,
                      cursor: isCompleted ? 'pointer' : 'default',
                      transition: 'all 0.2s ease',
                      '&:hover': isCompleted ? { opacity: 0.8 } : {},
                    }}
                    onClick={() => isCompleted && setActiveStep(index)}
                  >
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        transition: 'all 0.2s ease',
                        background: isCompleted
                          ? `linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.dark})`
                          : isActive
                          ? `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`
                          : theme.palette.mode === 'dark'
                          ? theme.palette.grey[800]
                          : theme.palette.grey[200],
                        color: isCompleted || isActive ? '#fff' : theme.palette.text.secondary,
                        boxShadow: isActive
                          ? `0 4px 16px ${alpha(theme.palette.primary.main, 0.4)}`
                          : 'none',
                      }}
                    >
                      {isCompleted ? <CheckCircleOutlineIcon /> : step.icon}
                    </Box>
                    <Typography
                      variant="caption"
                      fontWeight={isActive ? 600 : 500}
                      sx={{ textAlign: 'center', maxWidth: 80 }}
                    >
                      {step.label}
                    </Typography>
                  </Box>
                );
              })}
            </Box>

            {/* Content */}
            <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, minHeight: 320 }}>
              {/* Step 1: Content */}
              {activeStep === 0 && (
                <Stack spacing={3}>
                  <TextField
                    label="Title *"
                    value={form.title}
                    onChange={(e) => {
                      updateField('title', e.target.value);
                      translationsState.invalidateTranslations();
                    }}
                    fullWidth
                    placeholder="Enter advisory title..."
                  />
                  <TextField
                    label="Message *"
                    value={form.body}
                    onChange={(e) => {
                      updateField('body', e.target.value);
                      translationsState.invalidateTranslations();
                    }}
                    fullWidth
                    multiline
                    rows={6}
                    placeholder="Describe the advisory in detail..."
                  />
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                    <TextField
                      label="Category"
                      select
                      value={form.category}
                      onChange={(e) => updateField('category', e.target.value as unknown as AdvisoryCategory)}
                      fullWidth
                      SelectProps={{ native: true }}
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </TextField>
                    <TextField
                      label="Severity"
                      select
                      value={form.severity}
                      onChange={(e) => updateField('severity', e.target.value as unknown as AdvisorySeverity)}
                      fullWidth
                      SelectProps={{ native: true }}
                    >
                      {SEVERITIES.map((sev) => (
                        <option key={sev.value} value={sev.value}>
                          {sev.label}
                        </option>
                      ))}
                    </TextField>
                    <TextField
                      label="Region"
                      value={form.region}
                      onChange={(e) => {
                        updateField('region', e.target.value);
                        translationsState.invalidateTranslations();
                      }}
                      fullWidth
                      placeholder="e.g. Chennai Coast"
                    />
                  </Stack>
                </Stack>
              )}

              {/* Step 2: Location & Contacts */}
              {activeStep === 1 && (
                <Stack spacing={3}>
                  <FormSection
                    icon={<PlaceOutlinedIcon />}
                    title="Geographic Targeting"
                    description="Target this advisory to a specific location (optional)"
                    color="info"
                  >
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                      <TextField
                        label="Latitude"
                        value={form.lat}
                        onChange={(e) => updateField('lat', e.target.value)}
                        fullWidth
                        placeholder="e.g. 13.0827"
                      />
                      <TextField
                        label="Longitude"
                        value={form.lng}
                        onChange={(e) => updateField('lng', e.target.value)}
                        fullWidth
                        placeholder="e.g. 80.2707"
                      />
                      <TextField
                        label="Radius (km)"
                        value={form.radius}
                        onChange={(e) => updateField('radius', e.target.value)}
                        fullWidth
                        disabled={!form.lat && !form.lng}
                      />
                    </Stack>
                  </FormSection>

                  <FormSection
                    icon={<EditNoteIcon />}
                    title="Validity Period"
                    description="When should this advisory be active? (optional)"
                    color="primary"
                  >
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                      <TextField
                        label="Starts At"
                        type="datetime-local"
                        value={form.startsAt}
                        onChange={(e) => updateField('startsAt', e.target.value)}
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                      />
                      <TextField
                        label="Expires At"
                        type="datetime-local"
                        value={form.expiresAt}
                        onChange={(e) => updateField('expiresAt', e.target.value)}
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                      />
                    </Stack>
                  </FormSection>

                  <FormSection
                    icon={<PhoneIcon />}
                    title="Emergency Contacts"
                    description="Provide contact numbers (optional)"
                    color="warning"
                  >
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                      <TextField
                        label="Phone"
                        value={form.phone}
                        onChange={(e) => updateField('phone', e.target.value)}
                        fullWidth
                        placeholder="+91 98765 43210"
                      />
                      <TextField
                        label="WhatsApp"
                        value={form.whatsapp}
                        onChange={(e) => updateField('whatsapp', e.target.value)}
                        fullWidth
                        placeholder="+91 98765 43210"
                      />
                      <TextField
                        label="Hotline"
                        value={form.hotline}
                        onChange={(e) => updateField('hotline', e.target.value)}
                        fullWidth
                        placeholder="1800-XXX-XXXX"
                      />
                    </Stack>
                  </FormSection>
                </Stack>
              )}

              {/* Step 3: Translations */}
              {requiresTranslationStep && activeStep === 2 && (
                <Stack spacing={2.5}>
                  <Stack direction="row" justifyContent="flex-end" spacing={1.5}>
                    {translations.length > 0 && (
                      <Button
                        variant="outlined"
                        startIcon={<TaskAltIcon />}
                        onClick={() => {
                          const reviewed = markAllReviewed();
                          if (reviewed === 0) {
                            setError('Nothing to review yet. Make sure each translation has title and body text.');
                            return;
                          }
                          setError(null);
                        }}
                      >
                        Quick Review All
                      </Button>
                    )}
                    <Button
                      variant="contained"
                      startIcon={
                        generatingTranslations ? (
                          <CircularProgress size={16} color="inherit" />
                        ) : (
                          <GTranslateIcon />
                        )
                      }
                      onClick={handleGenerateTranslations}
                      disabled={generatingTranslations || !isSourceReady}
                    >
                      {generatingTranslations ? 'Generating...' : 'Generate Translations'}
                    </Button>
                  </Stack>

                  {translations.length === 0 ? (
                    <Alert severity="info">Generate translations to create AI-powered previews.</Alert>
                  ) : (
                    <>
                      <TranslationProgressBar
                        reviewedCount={reviewedCount}
                        totalCount={translationCount}
                      />

                      <Stack
                        direction="row"
                        spacing={1}
                        flexWrap="wrap"
                        useFlexGap
                        sx={{
                          p: 1.5,
                          bgcolor: alpha(theme.palette.grey[500], 0.04),
                          borderRadius: 2,
                          border: `1px solid ${theme.palette.divider}`,
                        }}
                      >
                        {languages.map((lang) => {
                          const draft = translations.find((t) => t.language_code === lang.code);
                          const isReviewed = draft?.translation_status === 'reviewed';

                          return (
                            <Button
                              key={lang.code}
                              onClick={() => setActiveTab(lang.code)}
                              sx={{
                                borderRadius: 2,
                                px: 2,
                                py: 1,
                                textTransform: 'none',
                                fontWeight: 500,
                                bgcolor:
                                  activeTab === lang.code
                                    ? 'background.paper'
                                    : 'transparent',
                                color: activeTab === lang.code ? 'text.primary' : 'text.secondary',
                                border: activeTab === lang.code
                                  ? `1px solid ${theme.palette.divider}`
                                  : 'transparent',
                              }}
                            >
                              <Stack direction="row" alignItems="center" spacing={0.75}>
                                <span>{lang.label}</span>
                                {isReviewed && <TaskAltIcon sx={{ fontSize: 16, color: 'success.main' }} />}
                              </Stack>
                            </Button>
                          );
                        })}
                      </Stack>

                      {languages.map((lang) => {
                        if (lang.code !== activeTab) return null;
                        const draft = translations.find((t) => t.language_code === lang.code);
                        if (!draft) return null;

                        return (
                          <Box key={lang.code}>
                            <TranslationEditor
                              language={lang}
                              draft={draft}
                              source={{
                                title: form.title.trim(),
                                body: form.body.trim(),
                                region: form.region.trim() || null,
                              }}
                              onUpdate={(patch) => updateTranslation(lang.code, patch)}
                              onMarkReviewed={() => markReviewed(lang.code)}
                              onMarkEditable={() => markEditable(lang.code)}
                            />
                          </Box>
                        );
                      })}
                    </>
                  )}
                </Stack>
              )}

              {/* Step 4: Review */}
              {activeStep === reviewStepIndex && (
                <Stack spacing={2}>
                  <Alert severity={!requiresTranslationStep || allReviewed ? 'success' : 'warning'}>
                    <strong>Review summary</strong>
                    <br />
                    Title: {form.title || '-'}
                    <br />
                    {requiresTranslationStep ? (
                      <>
                        Generated translations: {translations.length}
                        <br />
                        Status: {allReviewed ? 'All translations reviewed' : 'Awaiting review before publish'}
                      </>
                    ) : (
                      <>Status: Source text unchanged. Existing translations will be kept.</>
                    )}
                  </Alert>

                  {requiresTranslationStep ? (
                    <>
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          bgcolor: alpha(theme.palette.background.paper, 0.72),
                        }}
                      >
                        <Stack spacing={1.5}>
                          <Typography variant="subtitle2" fontWeight={600}>
                            Translation review status
                          </Typography>

                          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            {languages.map((lang) => {
                              const draft = translations.find((t) => t.language_code === lang.code);
                              const reviewed =
                                draft &&
                                draft.translation_status === 'reviewed' &&
                                draft.title.trim().length > 0 &&
                                draft.body.trim().length > 0;

                              return (
                                <Chip
                                  key={lang.code}
                                  label={lang.label + ': ' + (reviewed ? 'Reviewed' : 'Pending')}
                                  color={reviewed ? 'success' : 'warning'}
                                  variant={reviewed ? 'filled' : 'outlined'}
                                />
                              );
                            })}
                          </Stack>

                          {!allReviewed && (
                            <Typography variant="body2" color="text.secondary">
                              Publish is blocked until all four translations are marked reviewed in
                              the previous step.
                            </Typography>
                          )}
                        </Stack>
                      </Paper>

                      {!allReviewed && (
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                          {pendingReviewLanguages.map((lang) => (
                            <Button
                              key={lang.code}
                              size="small"
                              variant="outlined"
                              onClick={() => {
                                setActiveTab(lang.code);
                                setActiveStep(2);
                              }}
                            >
                              Review {lang.label}
                            </Button>
                          ))}
                        </Stack>
                      )}
                    </>
                  ) : null}
                </Stack>
              )}
            </Box>

            {/* Navigation */}
            <Box
              sx={{
                px: { xs: 2, sm: 3, md: 4 },
                py: 2.5,
                borderTop: `1px solid ${theme.palette.divider}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.5) : alpha(theme.palette.grey[50], 0.5),
              }}
            >
              <Button
                variant="text"
                startIcon={<ArrowBackIcon />}
                onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
                disabled={activeStep === 0}
              >
                Back
              </Button>

              <Stack direction="row" spacing={1.5}>
                <Button variant="text" onClick={handleReset} disabled={publishing}>
                  Clear
                </Button>

                {activeStep < reviewStepIndex ? (
                  <Button
                    variant="contained"
                    endIcon={<ArrowForwardIcon />}
                    onClick={() => setActiveStep(Math.min(reviewStepIndex, activeStep + 1))}
                    disabled={!canAdvance}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    startIcon={publishing ? <CircularProgress size={16} color="inherit" /> : <SendOutlinedIcon />}
                    onClick={handlePublish}
                    disabled={publishing || !isSourceReady}
                  >
                    {publishing ? (isEditing ? 'Saving...' : 'Publishing...') : isEditing ? 'Save Changes' : 'Publish'}
                  </Button>
                )}
              </Stack>
            </Box>
          </Paper>
        </Collapse>

        {/* Table */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: '16px',
            overflow: 'hidden',
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: theme.shadows[2],
          }}
        >
          <Box
            sx={{
              px: 3,
              py: 2.5,
              background: `linear-gradient(135deg, ${alpha(theme.palette.grey[900], 0.02)} 0%, ${alpha(theme.palette.background.paper, 1)} 100%)`,
              borderBottom: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Box
                sx={{
                  width: 4,
                  height: 24,
                  borderRadius: '2px',
                  background: `linear-gradient(180deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                }}
              />
              <Typography variant="subtitle1" fontWeight={700}>
                Recent Updates
              </Typography>
            </Stack>
          </Box>

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
                          label={CATEGORIES.find((c) => c.value === item.category)?.label}
                          sx={{
                            bgcolor: alpha(getCategoryColor(item.category), 0.1),
                            color: getCategoryColor(item.category),
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={SEVERITIES.find((s) => s.value === item.severity)?.label}
                          color={getSeverityChipColor(item.severity)}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {item.title}
                        </Typography>
                      </TableCell>
                      <TableCell>{item.region || '-'}</TableCell>
                      <TableCell>
                        <Typography variant="caption">{formatDateTime(item.starts_at)}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => void handleEdit(item)}
                          disabled={!isAdmin || loadingEditTranslations}
                        >
                          {loadingEditTranslations && editingAdvisory?.id === item.id ? (
                            <CircularProgress size={16} />
                          ) : (
                            <EditNoteIcon />
                          )}
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(item.id)}
                          disabled={!isAdmin || deletingId === item.id}
                        >
                          {deletingId === item.id ? (
                            <CircularProgress size={16} />
                          ) : (
                            <DeleteOutlineIcon />
                          )}
                        </IconButton>
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
