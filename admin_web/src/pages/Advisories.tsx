import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Collapse,
  Container,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined';
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';

import { isSupabaseConfigured } from '../core/supabase_config';
import { useAuth } from '../contexts/AuthContext';
import { advisoryService } from '../services/advisoryService';
import { riskZoneService } from '../services/riskZoneService';
import type { OfficialAdvisory } from '../types/advisory';

import { AdvisoryWizard } from '../components/advisories/AdvisoryWizard';
import { AdvisoriesTable } from '../components/advisories/AdvisoriesTable';
import { useAdvisoryForm } from '../components/advisories/hooks/useAdvisoryForm';
import { useTranslations } from '../components/advisories/hooks/useTranslations';

export function Advisories() {
  const { isAuthenticated } = useAuth();
  const theme = useTheme();

  // UI State
  const [publishExpanded, setPublishExpanded] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Admin State
  const [isAdmin, setIsAdmin] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Data State
  const [items, setItems] = useState<OfficialAdvisory[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);

  // Publishing State
  const [publishing, setPublishing] = useState(false);
  const [generatingTranslations, setGeneratingTranslations] = useState(false);

  // Form and Translations Hooks
  const translationsState = useTranslations();
  const formState = useAdvisoryForm(translationsState.invalidateTranslations);

  const supabaseOk = useMemo(() => isSupabaseConfigured(), []);

  // Load advisories
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

  // Check admin status
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

  // Generate translations
  const handleGenerateTranslations = async () => {
    const { form, isSourceReady } = formState;

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
        target_languages: translationsState.languages.map((lang) => lang.code),
      });

      translationsState.setTranslations(preview.translations);
      if (preview.translations.length > 0) {
        translationsState.setActiveTab(preview.translations[0].language_code);
      }
    } catch (e) {
      console.error(e);
      setError('Failed to generate translations. Check Sarvam configuration and admin access.');
    } finally {
      setGeneratingTranslations(false);
    }
  };

  // Publish advisory
  const handlePublish = async () => {
    const { form, isSourceReady, parseNullableNumber, toIsoOrNull } = formState;
    const { translations, allReviewed } = translationsState;

    if (!isSourceReady) {
      setError('Title and message are required.');
      return;
    }

    if (!isAuthenticated) {
      setError('Please login to publish official updates.');
      return;
    }

    if (!allReviewed) {
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
        translations,
      });

      // Reset and reload
      handleReset();
      setPublishExpanded(false);
      setPage(0);
      await load();
    } catch (e) {
      console.error(e);
      setError('Failed to publish update. Check your permissions (RLS) and login status.');
    } finally {
      setPublishing(false);
    }
  };

  // Reset form
  const handleReset = () => {
    formState.resetForm();
    translationsState.clearTranslations();
    setActiveStep(0);
  };

  // Delete advisory
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

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handleRowsPerPageChange = useCallback((newRowsPerPage: number) => {
    setRowsPerPage(newRowsPerPage);
    setPage(0);
  }, []);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Page Header */}
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
              onClick={() => setPublishExpanded((current) => !current)}
            >
              {publishExpanded ? 'Cancel' : 'New Update'}
            </Button>
          </Stack>
        </Stack>
      </Box>

      {/* Main Content */}
      <Container maxWidth="xl" sx={{ pt: 3, pb: 4, flex: 1 }}>
        {/* Alerts */}
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
          <Box sx={{ mb: 3 }}>
            <AdvisoryWizard
              formState={formState}
              translationsState={translationsState}
              activeStep={activeStep}
              isPublishing={publishing}
              isGeneratingTranslations={generatingTranslations}
              onStepChange={setActiveStep}
              onGenerateTranslations={handleGenerateTranslations}
              onPublish={handlePublish}
              onReset={handleReset}
            />
          </Box>
        </Collapse>

        {/* Advisories Table */}
        <AdvisoriesTable
          items={items}
          loading={loading}
          totalCount={totalCount}
          page={page}
          rowsPerPage={rowsPerPage}
          isAdmin={isAdmin}
          deletingId={deletingId}
          onDelete={handleDelete}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
        />
      </Container>
    </Box>
  );
}
