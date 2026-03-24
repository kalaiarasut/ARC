import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Grid,
  IconButton,
  Link,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import ApiOutlinedIcon from '@mui/icons-material/ApiOutlined';
import BoltOutlinedIcon from '@mui/icons-material/BoltOutlined';
import CodeOutlinedIcon from '@mui/icons-material/CodeOutlined';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import DatasetLinkedOutlinedIcon from '@mui/icons-material/DatasetLinkedOutlined';
import HubOutlinedIcon from '@mui/icons-material/HubOutlined';
import KeyOutlinedIcon from '@mui/icons-material/KeyOutlined';
import LaunchOutlinedIcon from '@mui/icons-material/LaunchOutlined';
import PolicyOutlinedIcon from '@mui/icons-material/PolicyOutlined';
import PublicOutlinedIcon from '@mui/icons-material/PublicOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';

type EndpointDoc = {
  key: string;
  title: string;
  method: 'GET';
  path: string;
  purpose: string;
  bestFor: string;
  accent: string;
  icon: React.ReactNode;
  example: string;
  queryHints: string[];
};

type CodeSample = {
  key: string;
  label: string;
  language: string;
  code: string;
};

function maskKey(value: string) {
  if (!value) return '<YOUR_SUPABASE_ANON_KEY>';
  if (value.length <= 12) return value;
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function buildCurl(baseUrl: string, query: string) {
  return `curl -X GET '${baseUrl}${query}' \\
-H 'apikey: <ANON_KEY>' \\
-H 'Authorization: Bearer <ANON_KEY>'`;
}

export function ApiReference() {
  const theme = useTheme();
  const [activeSample, setActiveSample] = useState<'reports' | 'advisories' | 'python'>('reports');
  const [copyState, setCopyState] = useState<string | null>(null);

  const supabaseUrl = (
    import.meta.env.VITE_SUPABASE_URL ||
    import.meta.env.VITE_PUBLIC_SUPABASE_URL ||
    import.meta.env.SUPABASE_URL ||
    ''
  ).trim();

  const anonKey = (
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY ||
    import.meta.env.VITE_SUPABASE_KEY ||
    import.meta.env.SUPABASE_ANON_KEY ||
    import.meta.env.SUPABASE_KEY ||
    ''
  ).trim();

  const restBaseUrl = supabaseUrl
    ? `${supabaseUrl}/rest/v1`
    : 'https://<YOUR_SUPABASE_PROJECT_REF>.supabase.co/rest/v1';

  const endpoints: EndpointDoc[] = useMemo(
    () => [
      {
        key: 'reports',
        title: 'Verified Hazard Reports',
        method: 'GET',
        path: '/hazard_reports',
        purpose:
          'Query citizen-submitted hazard reports that have already passed verification rules enforced by Row-Level Security.',
        bestFor: 'Situational awareness dashboards, research exports, and verified incident feeds.',
        accent: '#088395',
        icon: <WarningAmberRoundedIcon fontSize="small" />,
        example:
          '?select=*&status=eq.verified&order=created_at.desc&limit=50',
        queryHints: [
          'Filter by hazard type: hazard_type=eq.Flood',
          'Filter by high risk: is_high_risk=is.true',
          'Since a date: created_at=gte.2024-01-01T00:00:00Z',
          'Bounding box: latitude / longitude gte/lte filters',
        ],
      },
      {
        key: 'advisories',
        title: 'Official Advisories',
        method: 'GET',
        path: '/official_advisories',
        purpose:
          'Fetch authoritative alerts and advisories published by the disaster management center.',
        bestFor: 'Partner portals, public alert mirrors, and institutional status boards.',
        accent: '#3b82f6',
        icon: <BoltOutlinedIcon fontSize="small" />,
        example:
          '?select=*&expires_at=gte.now()&order=published_at.desc',
        queryHints: [
          'Use expires_at=gte.now() to get active advisories',
          'Sort by published_at.desc for newest-first',
          'Project only required columns with select=title,body,region',
          'Use order and limit for lightweight polling',
        ],
      },
      {
        key: 'zones',
        title: 'Generated Risk Zones',
        method: 'GET',
        path: '/generated_risk_zones',
        purpose:
          'Read dynamic hotspot zones calculated from clustered report activity and backend risk analysis.',
        bestFor: 'Heatmap overlays, institutional GIS sync, and verified hotspot monitoring.',
        accent: '#10b981',
        icon: <HubOutlinedIcon fontSize="small" />,
        example:
          '?select=*&level=eq.high_risk&status=eq.verified',
        queryHints: [
          'Filter by risk level: level=eq.high_risk',
          'Restrict to verified zones: status=eq.verified',
          'Use select to avoid pulling large geometry unnecessarily',
          'Pair with report exports for deeper downstream analysis',
        ],
      },
    ],
    [],
  );

  const codeSamples: Record<CodeSample['key'], CodeSample> = useMemo(
    () => ({
      reports: {
        key: 'reports',
        label: 'cURL: Verified Reports',
        language: 'bash',
        code: buildCurl(
          restBaseUrl,
          "/hazard_reports?select=*&status=eq.verified&order=created_at.desc&limit=50",
        ),
      },
      advisories: {
        key: 'advisories',
        label: 'cURL: Active Advisories',
        language: 'bash',
        code: buildCurl(
          restBaseUrl,
          "/official_advisories?select=*&expires_at=gte.now()&order=published_at.desc",
        ),
      },
      python: {
        key: 'python',
        label: 'Python Example',
        language: 'python',
        code: `import requests

PROJECT_URL = "${restBaseUrl}/hazard_reports"
ANON_KEY = "<YOUR_SUPABASE_ANON_KEY>"

headers = {
    "apikey": ANON_KEY,
    "Authorization": f"Bearer {ANON_KEY}",
    "Accept": "application/json",
}

params = {
    "select": "*",
    "status": "eq.verified",
    "hazard_type": "eq.Flood",
    "order": "created_at.desc",
    "limit": "10",
}

response = requests.get(PROJECT_URL, headers=headers, params=params)
data = response.json()

for report in data:
    print(f"[{report['created_at']}] {report['hazard_type']} at {report['latitude']},{report['longitude']}")`,
      },
    }),
    [restBaseUrl],
  );

  const copyText = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopyState(key);
      window.setTimeout(() => setCopyState((current) => (current === key ? null : current)), 1500);
    } catch (error) {
      console.error(error);
    }
  };

  const activeCodeSample = codeSamples[activeSample];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: alpha(theme.palette.primary.main, 0.03),
      }}
    >
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Paper
          elevation={0}
          sx={{
            borderRadius: 5,
            overflow: 'hidden',
            border: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
            backgroundColor: theme.palette.background.default,
          }}
        >
          <Box
            sx={{
              px: { xs: 2.5, md: 4 },
              py: { xs: 3, md: 4 },
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.12)} 0%, ${alpha(
                theme.palette.background.paper,
                0.96,
              )} 55%, ${alpha(theme.palette.info.main, 0.08)} 100%)`,
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.7)}`,
            }}
          >
            <Stack
              direction={{ xs: 'column', lg: 'row' }}
              spacing={3}
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', lg: 'center' }}
            >
              <Stack direction="row" spacing={2} alignItems="flex-start">
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: 3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: theme.palette.primary.contrastText,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                    boxShadow: `0 14px 28px ${alpha(theme.palette.primary.main, 0.24)}`,
                  }}
                >
                  <ApiOutlinedIcon sx={{ fontSize: 28 }} />
                </Box>
                <Box>
                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mb: 1 }}>
                    <Chip size="small" color="primary" label="Admin Reference" />
                    <Chip size="small" variant="outlined" label="PostgREST / Supabase" />
                    <Chip size="small" variant="outlined" label="Institutional Export" />
                  </Stack>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 800,
                      letterSpacing: '-0.03em',
                      mb: 1,
                    }}
                  >
                    Institutional Export API
                  </Typography>
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ maxWidth: 900 }}
                  >
                    Direct access to verified hazard reports, official advisories, and generated risk
                    zones for partner agencies, researchers, and institutional dashboards.
                  </Typography>
                </Box>
              </Stack>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25}>
                <Button
                  variant="outlined"
                  color="inherit"
                  startIcon={<LaunchOutlinedIcon />}
                  component={Link}
                  href="https://postgrest.org/en/v12/references/api/tables_views.html"
                  target="_blank"
                  rel="noreferrer"
                  sx={{ textTransform: 'none', borderRadius: 2.5 }}
                >
                  PostgREST Reference
                </Button>
                <Button
                  variant="contained"
                  startIcon={<ContentCopyOutlinedIcon />}
                  onClick={() => copyText('base-url', restBaseUrl)}
                  sx={{
                    textTransform: 'none',
                    borderRadius: 2.5,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  }}
                >
                  {copyState === 'base-url' ? 'Copied Base URL' : 'Copy Base URL'}
                </Button>
              </Stack>
            </Stack>
          </Box>

          <Box sx={{ p: { xs: 2.5, md: 4 } }}>
            <Grid container spacing={2.5} sx={{ mb: 3 }}>
              <Grid size={{ xs: 12, lg: 7.5 }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    height: '100%',
                    borderRadius: 4,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.16)}`,
                    background: `linear-gradient(145deg, ${alpha(theme.palette.primary.main, 0.06)} 0%, ${theme.palette.background.paper} 100%)`,
                  }}
                >
                  <Typography variant="overline" color="primary.main" sx={{ fontWeight: 700 }}>
                    Integration Surface
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.5 }}>
                    Export-ready by default
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 2.5, maxWidth: 760 }}>
                    The platform exposes a secure REST interface through Supabase PostgREST. Verified
                    public data is available with the project anon key, while Row-Level Security
                    constrains what unauthenticated clients can read.
                  </Typography>
                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mb: 2.5 }}>
                    <Chip icon={<ShieldOutlinedIcon />} label="RLS enforced" />
                    <Chip icon={<DatasetLinkedOutlinedIcon />} label="REST / JSON" />
                    <Chip icon={<PublicOutlinedIcon />} label="Institutional access patterns" />
                  </Stack>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: 3,
                      bgcolor: alpha(theme.palette.background.paper, 0.92),
                      border: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
                    }}
                  >
                    <Stack
                      direction={{ xs: 'column', md: 'row' }}
                      spacing={1.5}
                      justifyContent="space-between"
                    >
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700 }}>
                          Base URL
                        </Typography>
                        <Typography
                          sx={{
                            mt: 0.5,
                            fontFamily: '"JetBrains Mono", monospace',
                            fontSize: '0.92rem',
                            wordBreak: 'break-all',
                            color: theme.palette.primary.dark,
                          }}
                        >
                          {restBaseUrl}
                        </Typography>
                      </Box>
                      <Tooltip title={copyState === 'base-url-inline' ? 'Copied' : 'Copy URL'}>
                        <IconButton
                          onClick={() => copyText('base-url-inline', restBaseUrl)}
                          sx={{ alignSelf: { xs: 'flex-start', md: 'center' } }}
                        >
                          <ContentCopyOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Paper>
                </Paper>
              </Grid>

              <Grid size={{ xs: 12, lg: 4.5 }}>
                <Stack spacing={2.5} sx={{ height: '100%' }}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.5,
                      borderRadius: 4,
                      border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                      bgcolor: alpha(theme.palette.warning.main, 0.06),
                    }}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="flex-start">
                      <KeyOutlinedIcon sx={{ color: theme.palette.warning.main, mt: 0.25 }} />
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
                          Authentication
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                          Use the public anon key in both `apikey` and `Authorization` headers for
                          public institutional export endpoints.
                        </Typography>
                        <Box
                          sx={{
                            p: 1.5,
                            borderRadius: 2.5,
                            bgcolor: theme.palette.background.paper,
                            border: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
                            fontFamily: '"JetBrains Mono", monospace',
                            fontSize: '0.78rem',
                            lineHeight: 1.7,
                          }}
                        >
                          <div>apikey: {maskKey(anonKey)}</div>
                          <div>Authorization: Bearer {maskKey(anonKey)}</div>
                          <div>Content-Type: application/json</div>
                        </Box>
                      </Box>
                    </Stack>
                  </Paper>

                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.5,
                      borderRadius: 4,
                      border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                      bgcolor: alpha(theme.palette.info.main, 0.05),
                      flex: 1,
                    }}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="flex-start">
                      <PolicyOutlinedIcon sx={{ color: theme.palette.info.main, mt: 0.25 }} />
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
                          Operational Notes
                        </Typography>
                        <Stack spacing={1.1}>
                          <Typography variant="body2" color="text.secondary">
                            Verified reports are the default public export surface.
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Active advisories should usually be filtered with `expires_at=gte.now()`.
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Generated risk zones are intended for downstream GIS and hotspot overlays.
                          </Typography>
                        </Stack>
                      </Box>
                    </Stack>
                  </Paper>
                </Stack>
              </Grid>
            </Grid>

            <Grid container spacing={2.5} sx={{ mb: 3 }}>
              {endpoints.map((endpoint) => (
                <Grid key={endpoint.key} size={{ xs: 12, xl: 4 }}>
                  <Paper
                    elevation={0}
                    sx={{
                      height: '100%',
                      p: 2.5,
                      borderRadius: 4,
                      border: `1px solid ${alpha(endpoint.accent, 0.16)}`,
                      background: `linear-gradient(180deg, ${alpha(endpoint.accent, 0.06)} 0%, ${theme.palette.background.paper} 100%)`,
                    }}
                  >
                    <Stack spacing={2}>
                      <Stack direction="row" justifyContent="space-between" spacing={2}>
                        <Stack direction="row" spacing={1.25} alignItems="center">
                          <Box
                            sx={{
                              width: 42,
                              height: 42,
                              borderRadius: 2.5,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: endpoint.accent,
                              bgcolor: alpha(endpoint.accent, 0.12),
                            }}
                          >
                            {endpoint.icon}
                          </Box>
                          <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                              {endpoint.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {endpoint.bestFor}
                            </Typography>
                          </Box>
                        </Stack>
                        <Chip
                          size="small"
                          label={endpoint.method}
                          sx={{
                            fontWeight: 700,
                            bgcolor: alpha(endpoint.accent, 0.14),
                            color: endpoint.accent,
                          }}
                        />
                      </Stack>

                      <Paper
                        elevation={0}
                        sx={{
                          p: 1.5,
                          borderRadius: 2.5,
                          bgcolor: alpha(theme.palette.background.paper, 0.92),
                          border: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
                        }}
                      >
                        <Typography
                          sx={{
                            fontFamily: '"JetBrains Mono", monospace',
                            fontSize: '0.86rem',
                            color: endpoint.accent,
                            fontWeight: 600,
                          }}
                        >
                          {endpoint.path}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {endpoint.purpose}
                        </Typography>
                      </Paper>

                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                          Example Query
                        </Typography>
                        <Typography
                          sx={{
                            mt: 0.75,
                            fontFamily: '"JetBrains Mono", monospace',
                            fontSize: '0.76rem',
                            wordBreak: 'break-all',
                            color: theme.palette.text.primary,
                          }}
                        >
                          {endpoint.example}
                        </Typography>
                      </Box>

                      <Divider />

                      <Stack spacing={1.1}>
                        {endpoint.queryHints.map((hint) => (
                          <Typography key={hint} variant="body2" color="text.secondary">
                            • {hint}
                          </Typography>
                        ))}
                      </Stack>
                    </Stack>
                  </Paper>
                </Grid>
              ))}
            </Grid>

            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, lg: 7.5 }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 4,
                    border: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
                    bgcolor: theme.palette.background.paper,
                  }}
                >
                  <Stack
                    direction={{ xs: 'column', md: 'row' }}
                    spacing={2}
                    justifyContent="space-between"
                    sx={{ mb: 2.5 }}
                  >
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>
                        Example Requests
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Copyable samples aligned with the export API documentation.
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                      {Object.values(codeSamples).map((sample) => (
                        <Button
                          key={sample.key}
                          size="small"
                          variant={activeSample === sample.key ? 'contained' : 'outlined'}
                          onClick={() => setActiveSample(sample.key)}
                          sx={{ textTransform: 'none', borderRadius: 2.5 }}
                        >
                          {sample.label}
                        </Button>
                      ))}
                    </Stack>
                  </Stack>

                  <Paper
                    elevation={0}
                    sx={{
                      position: 'relative',
                      p: 0,
                      overflow: 'hidden',
                      borderRadius: 3,
                      bgcolor: '#0f172a',
                      color: '#e2e8f0',
                    }}
                  >
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      sx={{
                        px: 2,
                        py: 1.25,
                        borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
                      }}
                    >
                      <Typography
                        sx={{
                          fontFamily: '"JetBrains Mono", monospace',
                          fontSize: '0.78rem',
                          color: '#93c5fd',
                        }}
                      >
                        {activeCodeSample.language}
                      </Typography>
                      <Button
                        size="small"
                        color="inherit"
                        startIcon={<ContentCopyOutlinedIcon fontSize="small" />}
                        onClick={() => copyText(activeCodeSample.key, activeCodeSample.code)}
                        sx={{ textTransform: 'none', color: '#cbd5e1' }}
                      >
                        {copyState === activeCodeSample.key ? 'Copied' : 'Copy'}
                      </Button>
                    </Stack>
                    <Box
                      component="pre"
                      sx={{
                        m: 0,
                        p: 2.5,
                        overflowX: 'auto',
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: '0.79rem',
                        lineHeight: 1.75,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                      }}
                    >
                      {activeCodeSample.code}
                    </Box>
                  </Paper>
                </Paper>
              </Grid>

              <Grid size={{ xs: 12, lg: 4.5 }}>
                <Stack spacing={2.5}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.5,
                      borderRadius: 4,
                      border: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
                    }}
                  >
                    <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 1.5 }}>
                      <CodeOutlinedIcon color="primary" fontSize="small" />
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        Common Query Controls
                      </Typography>
                    </Stack>
                    <Stack spacing={1}>
                      <Typography variant="body2" color="text.secondary">
                        `select=*` projects all columns.
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        `order=created_at.desc` sorts newest-first.
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        `limit=50` controls payload size.
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        `eq`, `gte`, and `lte` support simple filtering patterns.
                      </Typography>
                    </Stack>
                  </Paper>

                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.5,
                      borderRadius: 4,
                      border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                      bgcolor: alpha(theme.palette.success.main, 0.05),
                    }}
                  >
                    <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 1.5 }}>
                      <ShieldOutlinedIcon sx={{ color: theme.palette.success.main }} fontSize="small" />
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        Export Guidance
                      </Typography>
                    </Stack>
                    <Stack spacing={1}>
                      <Typography variant="body2" color="text.secondary">
                        Prefer specific column selection for production integrations.
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Use server-side filters to keep exports small and predictable.
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Verified and active data should be treated as the public-safe integration layer.
                      </Typography>
                    </Stack>
                  </Paper>

                  <Alert
                    severity="info"
                    icon={<PublicOutlinedIcon fontSize="inherit" />}
                    sx={{ borderRadius: 3 }}
                  >
                    Full PostgREST syntax reference:{' '}
                    <Link
                      href="https://postgrest.org/en/v12/references/api/tables_views.html"
                      target="_blank"
                      rel="noreferrer"
                    >
                      postgrest.org
                    </Link>
                  </Alert>
                </Stack>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
