import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Grid,
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
  Typography,
} from '@mui/material';
import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import { format } from 'date-fns';

import { Header } from '../components/Header';
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

  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
    <Container maxWidth={false} sx={{ py: 2, px: { xs: 1, sm: 2, md: 2 } }}>

      {!supabaseOk && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Supabase is not configured. Publishing and loading updates will not work.
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12 }}>
          <Paper elevation={2} sx={{ p: 2.5 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
              <CampaignOutlinedIcon />
              <Typography variant="h6" fontWeight={800}>
                Publish Update
              </Typography>
            </Stack>

            <Stack spacing={2}>
              <TextField
                label="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                fullWidth
                size="small"
              />

              <TextField
                label="Message"
                value={body}
                onChange={(e) => setBody(e.target.value)}
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
                  onChange={(e) => setCategory(e.target.value as AdvisoryCategory)}
                  fullWidth
                  size="small"
                  SelectProps={{ native: true }}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
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
                >
                  {SEVERITIES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </TextField>
              </Stack>

              <TextField
                label="Region (optional)"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                fullWidth
                size="small"
              />

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Latitude (optional)"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  fullWidth
                  size="small"
                  inputProps={{ inputMode: 'decimal' }}
                />
                <TextField
                  label="Longitude (optional)"
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  fullWidth
                  size="small"
                  inputProps={{ inputMode: 'decimal' }}
                />
              </Stack>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Starts At (optional)"
                  type="datetime-local"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="Expires At (optional)"
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
              </Stack>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Phone (optional)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  fullWidth
                  size="small"
                />
                <TextField
                  label="WhatsApp (optional)"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  fullWidth
                  size="small"
                />
              </Stack>

              <TextField
                label="Hotline (optional)"
                value={hotline}
                onChange={(e) => setHotline(e.target.value)}
                fullWidth
                size="small"
              />

              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Button variant="outlined" onClick={resetForm} disabled={publishing}>
                  Clear
                </Button>
                <Button
                  variant="contained"
                  startIcon={<SendOutlinedIcon />}
                  onClick={handlePublish}
                  disabled={publishing}
                >
                  {publishing ? 'Publishing…' : 'Publish'}
                </Button>
              </Stack>
            </Stack>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Box
            sx={{
              borderRadius: '20px',
              overflow: 'hidden',
              bgcolor: 'background.paper',
              border: '1px solid rgba(0,0,0,0.08)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
            }}
          >
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h6" fontWeight={800}>
                Recent Updates
              </Typography>
              <Button startIcon={<RefreshIcon />} onClick={load} disabled={loading}>
                Refresh
              </Button>
            </Box>

            <TableContainer sx={{ maxHeight: 'calc(100vh - 320px)' }}>
              <Table stickyHeader size="small" sx={{
                '& .MuiTableCell-root': { py: 0.75, px: 1.25 },
                '& .MuiTableCell-head': { py: 1, fontSize: 12, fontWeight: 800, bgcolor: 'grey.50' },
                '& .MuiChip-root': { height: 22 },
              }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Published</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Severity</TableCell>
                    <TableCell>Title</TableCell>
                    <TableCell>Region</TableCell>
                    <TableCell>Validity</TableCell>
                    <TableCell>Contacts</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                        <CircularProgress size={22} />
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          Loading updates…
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                        <Typography variant="body2" color="text.secondary">
                          No official updates found.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((a) => {
                      const validity =
                        a.starts_at || a.expires_at
                          ? `${a.starts_at ? format(new Date(a.starts_at), 'MMM dd HH:mm') : '—'} → ${a.expires_at ? format(new Date(a.expires_at), 'MMM dd HH:mm') : '—'}`
                          : '—';

                      const contacts =
                        [a.contact_phone, a.contact_whatsapp, a.contact_hotline]
                          .filter(Boolean)
                          .join(' • ') || '—';

                      return (
                        <TableRow key={a.id} hover>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>
                            {format(new Date(a.published_at), 'MMM dd, yyyy HH:mm')}
                          </TableCell>
                          <TableCell>
                            <Chip label={a.category} size="small" color={getCategoryChipColor(a.category)} variant="outlined" />
                          </TableCell>
                          <TableCell>
                            <Chip label={a.severity} size="small" color={getSeverityChipColor(a.severity)} />
                          </TableCell>
                          <TableCell sx={{ maxWidth: 260 }}>
                            <Typography variant="body2" noWrap title={a.title}>
                              {a.title}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ maxWidth: 220 }}>
                            <Typography variant="body2" noWrap title={a.region ?? ''}>
                              {a.region || '—'}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>{validity}</TableCell>
                          <TableCell sx={{ maxWidth: 260 }}>
                            <Typography variant="caption" color="text.secondary" noWrap title={contacts}>
                              {contacts}
                            </Typography>
                          </TableCell>
                          <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                            <Button
                              size="small"
                              color="error"
                              variant="text"
                              startIcon={<DeleteOutlineIcon />}
                              onClick={() => handleDelete(a.id)}
                              disabled={!isAuthenticated || !isAdmin || deletingId === a.id}
                            >
                              {deletingId === a.id ? 'Deleting…' : 'Delete'}
                            </Button>
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
            />
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
}
