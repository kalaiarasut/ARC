import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Container,
  Grid,
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
import RefreshIcon from '@mui/icons-material/Refresh';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import { format } from 'date-fns';

import { advisoryService } from '../services/advisoryService';
import { riskZoneService } from '../services/riskZoneService';
import { isSupabaseConfigured } from '../core/supabase_config';
import { useAuth } from '../contexts/AuthContext';
import type { AdvisoryCategory, AdvisorySeverity, OfficialAdvisory } from '../types/advisory';

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

export function Advisories() {
  const { isAuthenticated } = useAuth();
  const theme = useTheme();

  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [publishExpanded, setPublishExpanded] = useState(false);

  const [items, setItems] = useState<OfficialAdvisory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const [publishing, setPublishing] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [region, setRegion] = useState('');
  const [category, setCategory] = useState<AdvisoryCategory>('warning');
  const [severity, setSeverity] = useState<AdvisorySeverity>('info');
  const [lat, setLat] = useState<string>('');
  const [lng, setLng] = useState<string>('');
  const [startsAt, setStartsAt] = useState<string>('');
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [hotline, setHotline] = useState('');

  const supabaseOk = useMemo(() => isSupabaseConfigured(), []);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!isSupabaseConfigured()) {
        setItems([]);
        setTotalCount(0);
        setError('Supabase not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in admin_web/.env.local and restart the dev server.');
        return;
      }

      const { data, total } = await advisoryService.getAdvisoriesWithCount(page, rowsPerPage);
      setItems(data);
      setTotalCount(total);
    } catch (e) {
      console.error(e);
      setError('Failed to load official updates.');
      setItems([]);
      setTotalCount(0);
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
      .then((v) => {
        if (!cancelled) setIsAdmin(Boolean(v));
      })
      .catch(() => {
        if (!cancelled) setIsAdmin(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, supabaseOk]);

  const parseNullableNumber = (value: string): number | null => {
    const t = value.trim();
    if (!t) return null;
    const n = Number(t);
    return Number.isFinite(n) ? n : null;
  };

  const toIsoOrNull = (value: string): string | null => {
    const t = value.trim();
    if (!t) return null;
    const d = new Date(t);
    return Number.isFinite(d.getTime()) ? d.toISOString() : null;
  };

  const resetForm = () => {
    setTitle('');
    setBody('');
    setRegion('');
    setCategory('warning');
    setSeverity('info');
    setLat('');
    setLng('');
    setStartsAt('');
    setExpiresAt('');
    setPhone('');
    setWhatsapp('');
    setHotline('');
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

    try {
      setPublishing(true);
      setError(null);

      const latitude = parseNullableNumber(lat);
      const longitude = parseNullableNumber(lng);

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
        starts_at: toIsoOrNull(startsAt),
        expires_at: toIsoOrNull(expiresAt),
        contact_phone: phone.trim() || null,
        contact_whatsapp: whatsapp.trim() || null,
        contact_hotline: hotline.trim() || null,
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

      const newTotal = Math.max(0, totalCount - 1);
      const isLastRowOnPage = items.length === 1;
      const newMaxPage = Math.max(0, Math.ceil(newTotal / rowsPerPage) - 1);

      if (isLastRowOnPage && page > newMaxPage) {
        setTotalCount(newTotal);
        setPage(newMaxPage);
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
    <Box sx={{ minHeight: '100vh', bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
      {/* Page Header */}
      <Box
        sx={{
          px: { xs: 2, sm: 3 },
          py: 2,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.secondary.main, 0.04)} 100%)`,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
              }}
            >
              <CampaignOutlinedIcon sx={{ color: 'white', fontSize: 22 }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.2 }}>
                Official Updates
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Publish alerts and advisories
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1}>
            <Tooltip title="Refresh updates">
              <IconButton onClick={load} disabled={loading} size="small">
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Button
              variant={publishExpanded ? 'outlined' : 'contained'}
              size="small"
              startIcon={publishExpanded ? <CloseIcon /> : <AddCircleOutlineIcon />}
              onClick={() => setPublishExpanded(!publishExpanded)}
              sx={{
                borderRadius: '10px',
                textTransform: 'none',
                fontWeight: 600,
                px: 2,
              }}
            >
              {publishExpanded ? 'Cancel' : 'New Update'}
            </Button>
          </Stack>
        </Stack>
      </Box>

      <Container maxWidth="xl" sx={{ py: 2, px: { xs: 1.5, sm: 2.5 } }}>
        {!supabaseOk && (
          <Alert severity="warning" sx={{ mb: 2, borderRadius: '12px' }}>
            Supabase is not configured. Publishing and loading updates will not work.
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: '12px' }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Collapsible Publish Form */}
        <Collapse in={publishExpanded}>
          <Paper
            elevation={0}
            sx={{
              mb: 2,
              p: 2.5,
              borderRadius: '16px',
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.04)} 0%, ${alpha(theme.palette.background.paper, 1)} 100%)`,
            }}
          >
            <Grid container spacing={2}>
              {/* Left Column - Essential Fields */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Stack spacing={1.5}>
                  <TextField
                    label="Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    fullWidth
                    size="small"
                    placeholder="Enter alert title..."
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                  />
                  <TextField
                    label="Message"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    fullWidth
                    size="small"
                    multiline
                    minRows={3}
                    maxRows={5}
                    placeholder="Detailed message content..."
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                  />
                  <Stack direction="row" spacing={1.5}>
                    <TextField
                      label="Category"
                      select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as AdvisoryCategory)}
                      fullWidth
                      size="small"
                      SelectProps={{ native: true }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </TextField>
                    <TextField
                      label="Severity"
                      select
                      value={severity}
                      onChange={(e) => setSeverity(e.target.value as AdvisorySeverity)}
                      fullWidth
                      size="small"
                      SelectProps={{ native: true }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                    >
                      {SEVERITIES.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </TextField>
                  </Stack>
                  <TextField
                    label="Region"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    fullWidth
                    size="small"
                    placeholder="e.g., Chennai Coast"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                  />
                </Stack>
              </Grid>

              {/* Right Column - Optional Fields */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Stack spacing={1.5}>
                  <Stack direction="row" spacing={1.5}>
                    <TextField
                      label="Latitude"
                      value={lat}
                      onChange={(e) => setLat(e.target.value)}
                      fullWidth
                      size="small"
                      inputProps={{ inputMode: 'decimal' }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                    />
                    <TextField
                      label="Longitude"
                      value={lng}
                      onChange={(e) => setLng(e.target.value)}
                      fullWidth
                      size="small"
                      inputProps={{ inputMode: 'decimal' }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                    />
                  </Stack>
                  <Stack direction="row" spacing={1.5}>
                    <TextField
                      label="Starts At"
                      type="datetime-local"
                      value={startsAt}
                      onChange={(e) => setStartsAt(e.target.value)}
                      fullWidth
                      size="small"
                      InputLabelProps={{ shrink: true }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                    />
                    <TextField
                      label="Expires At"
                      type="datetime-local"
                      value={expiresAt}
                      onChange={(e) => setExpiresAt(e.target.value)}
                      fullWidth
                      size="small"
                      InputLabelProps={{ shrink: true }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                    />
                  </Stack>
                  <Stack direction="row" spacing={1.5}>
                    <TextField
                      label="Phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      fullWidth
                      size="small"
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                    />
                    <TextField
                      label="WhatsApp"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      fullWidth
                      size="small"
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                    />
                  </Stack>
                  <TextField
                    label="Hotline"
                    value={hotline}
                    onChange={(e) => setHotline(e.target.value)}
                    fullWidth
                    size="small"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                  />
                </Stack>
              </Grid>

              {/* Action Buttons */}
              <Grid size={{ xs: 12 }}>
                <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ pt: 1 }}>
                  <Button
                    variant="text"
                    onClick={resetForm}
                    disabled={publishing}
                    sx={{ borderRadius: '10px', textTransform: 'none' }}
                  >
                    Clear
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={publishing ? <CircularProgress size={16} color="inherit" /> : <SendOutlinedIcon />}
                    onClick={handlePublish}
                    disabled={publishing || !title.trim() || !body.trim()}
                    sx={{
                      borderRadius: '10px',
                      textTransform: 'none',
                      fontWeight: 600,
                      px: 3,
                      background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                      boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                    }}
                  >
                    {publishing ? 'Publishing…' : 'Publish Update'}
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </Paper>
        </Collapse>

        {/* Updates Table */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: '16px',
            overflow: 'hidden',
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.04)}`,
          }}
        >
          <Box
            sx={{
              px: 2.5,
              py: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
              background: alpha(theme.palette.grey[50], 0.5),
            }}
          >
            <Typography variant="subtitle1" fontWeight={700} color="text.secondary">
              Recent Updates
            </Typography>
            <Chip
              label={`${totalCount} total`}
              size="small"
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
                fontWeight: 600,
                fontSize: 11,
              }}
            />
          </Box>

          <TableContainer sx={{ maxHeight: publishExpanded ? 'calc(100vh - 520px)' : 'calc(100vh - 220px)' }}>
            <Table stickyHeader size="small" sx={{
              '& .MuiTableCell-root': { py: 1, px: 1.5 },
              '& .MuiTableCell-head': {
                py: 1.25,
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                bgcolor: alpha(theme.palette.grey[100], 0.8),
                color: 'text.secondary',
              },
              '& .MuiChip-root': { height: 22, fontSize: 11 },
              '& .MuiTableRow-root:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) },
            }}>
              <TableHead>
                <TableRow>
                  <TableCell>Published</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Severity</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Region</TableCell>
                  <TableCell>Validity</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                      <CircularProgress size={28} thickness={4} />
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                        Loading updates…
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                      <CampaignOutlinedIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        No official updates yet. Click "New Update" to publish one.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((a) => {
                    const validity =
                      a.starts_at || a.expires_at
                        ? `${a.starts_at ? format(new Date(a.starts_at), 'MMM dd HH:mm') : '—'} → ${a.expires_at ? format(new Date(a.expires_at), 'MMM dd HH:mm') : '—'}`
                        : '—';

                    return (
                      <TableRow key={a.id}>
                        <TableCell sx={{ whiteSpace: 'nowrap', color: 'text.secondary', fontSize: 12 }}>
                          {format(new Date(a.published_at), 'MMM dd, yyyy HH:mm')}
                        </TableCell>
                        <TableCell>
                          <Chip label={a.category} size="small" color={getCategoryChipColor(a.category)} variant="outlined" />
                        </TableCell>
                        <TableCell>
                          <Chip label={a.severity} size="small" color={getSeverityChipColor(a.severity)} />
                        </TableCell>
                        <TableCell sx={{ maxWidth: 280 }}>
                          <Typography variant="body2" fontWeight={500} noWrap title={a.title}>
                            {a.title}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ maxWidth: 180 }}>
                          <Typography variant="body2" color="text.secondary" noWrap title={a.region ?? ''}>
                            {a.region || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap', fontSize: 12, color: 'text.secondary' }}>
                          {validity}
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title={!isAuthenticated || !isAdmin ? 'Login as admin to delete' : 'Delete update'}>
                            <span>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDelete(a.id)}
                                disabled={!isAuthenticated || !isAdmin || deletingId === a.id}
                                sx={{ opacity: deletingId === a.id ? 0.5 : 1 }}
                              >
                                {deletingId === a.id ? <CircularProgress size={16} /> : <DeleteOutlineIcon fontSize="small" />}
                              </IconButton>
                            </span>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })
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
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 25, 50]}
            sx={{
              borderTop: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
              '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                fontSize: 12,
              },
            }}
          />
        </Paper>
      </Container>
    </Box>
  );
}
