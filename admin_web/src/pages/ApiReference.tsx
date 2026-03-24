import { useState } from 'react';
import {
  Box,
  Button,
  Container,
  Grid,
  IconButton,
  Link,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import DatabaseIcon from '@mui/icons-material/StorageRounded';
import ChevronRightIcon from '@mui/icons-material/ChevronRightRounded';
import BookOpenIcon from '@mui/icons-material/MenuBookRounded';
import KeyIcon from '@mui/icons-material/VpnKeyRounded';
import CopyIcon from '@mui/icons-material/ContentCopyRounded';
import InfoIcon from '@mui/icons-material/InfoRounded';
import LaunchIcon from '@mui/icons-material/LaunchRounded';

function maskKey(value: string) {
  if (!value) return '<YOUR_SUPABASE_ANON_KEY>';
  if (value.length <= 12) return value;
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

export function ApiReference() {
  const theme = useTheme();
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

  const copyText = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopyState(key);
      window.setTimeout(() => setCopyState((current) => (current === key ? null : current)), 2000);
    } catch (error) {
      console.error(error);
    }
  };

  const curlExample = `curl -X GET '${restBaseUrl}/hazard_reports?status=eq.verified' \\
  -H 'apikey: ${maskKey(anonKey)}' \\
  -H 'Authorization: Bearer ${maskKey(anonKey)}'`;

  const pythonExample = `# Fetch 10 latest verified floods
import requests

URL = "${restBaseUrl}/hazard_reports"
HEADERS = {
    "apikey": "${maskKey(anonKey)}",
    "Authorization": "Bearer ${maskKey(anonKey)}"
}

PARAMS = {
    "hazard_type": "eq.Flood",
    "order": "created_at.desc",
    "limit": "10"
}

res = requests.get(URL, params=PARAMS, headers=HEADERS)
for report in res.json():
    print(f"[{report['hazard_type']}] @ {report['latitude']},{report['longitude']}")`;

  return (
    <Box
      sx={{
        minHeight: '100%',
        bgcolor: '#f8fafc', // slate-50
        p: { xs: 1, md: 3 },
      }}
    >
      <Paper
        elevation={0}
        sx={{
          maxWidth: 'lg',
          mx: 'auto',
          minHeight: '100%',
          bgcolor: '#ffffff',
          borderRadius: '24px',
          boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
          border: '1px solid #e2e8f0', // slate-200
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Top Header */}
        <Box
          component="header"
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 40,
            bgcolor: '#ffffff',
            borderBottom: '1px solid #f1f5f9', // slate-100
            px: { xs: 4, md: 8 },
            py: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2
          }}
        >
          <Stack direction="row" alignItems="center" spacing={3}>
            <Box
              sx={{
                p: 1.5,
                bgcolor: alpha('#088395', 0.1),
                borderRadius: '12px',
                display: 'flex',
                color: '#0a4d68',
              }}
            >
              <DatabaseIcon sx={{ fontSize: 28 }} />
            </Box>
            <Box>
              <Typography
                variant="h5"
                sx={{
                  fontFamily: '"Cabinet Grotesk", sans-serif',
                  fontWeight: 800,
                  color: '#0f172a', // slate-900
                  letterSpacing: '-0.02em',
                }}
              >
                Institutional Export API
              </Typography>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.5 }}>
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>Documentation</Typography>
                <ChevronRightIcon sx={{ fontSize: 14, color: '#94a3b8' }} />
                <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600 }}>Public Data Access</Typography>
              </Stack>
            </Box>
          </Stack>
          
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<BookOpenIcon sx={{ fontSize: 18 }} />}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.875rem',
                color: '#334155',
                borderColor: '#e2e8f0',
                borderRadius: '8px',
                px: 2,
                py: 1,
                bgcolor: '#ffffff',
                '&:hover': { bgcolor: '#f8fafc', borderColor: '#e2e8f0' },
              }}
              component="a"
              href="https://postgrest.org/en/v12/references/api/tables_views.html"
              target="_blank"
            >
              Full Reference
            </Button>
            <Button
              variant="contained"
              startIcon={<KeyIcon sx={{ fontSize: 18 }} />}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.875rem',
                borderRadius: '8px',
                px: 2,
                py: 1,
                background: 'linear-gradient(135deg, #0a4d68 0%, #088395 50%, #05bfdb 100%)',
                boxShadow: '0 4px 12px rgba(8, 131, 149, 0.35)',
                color: '#ffffff',
                '&:hover': { opacity: 0.9, boxShadow: '0 4px 12px rgba(8, 131, 149, 0.45)' },
              }}
              onClick={() => copyText('anon_key', anonKey)}
            >
              Copy API Key
            </Button>
          </Stack>
        </Box>

        {/* Content Sections */}
        <Grid container sx={{ flex: 1 }}>
          {/* Left: Documentation */}
          <Grid size={{ xs: 12, lg: 7 }} sx={{ p: { xs: 4, md: 8 } }}>
            <Stack spacing={6}>
              {/* Authentication */}
              <Box component="section">
                <Typography
                  variant="h6"
                  sx={{
                    fontFamily: '"Cabinet Grotesk", sans-serif',
                    fontWeight: 800,
                    color: '#0f172a',
                    mb: 1.5,
                  }}
                >
                  Authentication
                </Typography>
                <Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.7, mb: 3 }}>
                  Since public data (verified reports and active advisories) is accessible via Row-Level Security (RLS), simply include the public{' '}
                  <Box component="code" sx={{ bgcolor: '#f1f5f9', px: 0.5, py: 0.25, borderRadius: 1, color: '#0a4d68', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                    anon
                  </Box>{' '}
                  key in your request headers.
                </Typography>
                
                <Box sx={{ bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', p: 3 }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', mb: 2 }}>
                    Required Headers
                  </Typography>
                  <Stack spacing={1.5}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: '#ffffff', p: 1.5, borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                      <Typography sx={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#334155' }}>apikey</Typography>
                      <Typography sx={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#088395', fontWeight: 700 }}>&lt;YOUR_SUPABASE_ANON_KEY&gt;</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: '#ffffff', p: 1.5, borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                      <Typography sx={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#334155' }}>Authorization</Typography>
                      <Typography sx={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#088395', fontWeight: 700 }}>Bearer &lt;YOUR_SUPABASE_ANON_KEY&gt;</Typography>
                    </Box>
                  </Stack>
                </Box>
              </Box>

              {/* Endpoints */}
              <Stack component="section" spacing={5}>
                {/* hazard_reports */}
                <Box>
                  <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
                    <Box sx={{ px: 1.5, py: 0.5, bgcolor: '#ecfdf5', color: '#059669', fontSize: '0.625rem', fontWeight: 800, borderRadius: '6px', border: '1px solid #d1fae5', textTransform: 'uppercase', tracking: 'tight' }}>
                      GET
                    </Box>
                    <Typography variant="h6" sx={{ fontFamily: '"Cabinet Grotesk", sans-serif', fontWeight: 800, color: '#1e293b' }}>
                      /hazard_reports
                    </Typography>
                  </Stack>
                  <Typography variant="body2" sx={{ color: '#475569', mb: 3 }}>
                    Fetch user-submitted reports that have been formally verified by our emergency response team. Row Level Security limits unauthenticated requests to `status = 'verified'`.
                  </Typography>
                  <Box sx={{ overflow: 'hidden', border: '1px solid #e2e8f0', borderRadius: '12px', bgcolor: '#ffffff' }}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'minmax(120px, 1.2fr) 1fr 1.5fr 2fr', bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0', p: 1.5 }}>
                      <Typography variant="caption" sx={{ color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Parameter</Typography>
                      <Typography variant="caption" sx={{ color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Type</Typography>
                      <Typography variant="caption" sx={{ color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Example</Typography>
                      <Typography variant="caption" sx={{ color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Description</Typography>
                    </Box>
                    <Stack divider={<Box sx={{ borderBottom: '1px solid #f1f5f9' }} />}>
                      <Box sx={{ display: 'grid', gridTemplateColumns: 'minmax(120px, 1.2fr) 1fr 1.5fr 2fr', p: 1.5, alignItems: 'center' }}>
                        <Typography sx={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#0a4d68' }}>hazard_type</Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: '#334155' }}>String</Typography>
                        <Typography sx={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#94a3b8' }}>eq.Flood</Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: '#334155' }}>Filter by hazard category</Typography>
                      </Box>
                      <Box sx={{ display: 'grid', gridTemplateColumns: 'minmax(120px, 1.2fr) 1fr 1.5fr 2fr', p: 1.5, alignItems: 'center' }}>
                        <Typography sx={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#0a4d68' }}>is_high_risk</Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: '#334155' }}>Boolean</Typography>
                        <Typography sx={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#94a3b8' }}>is.true</Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: '#334155' }}>Only severe warnings</Typography>
                      </Box>
                      <Box sx={{ display: 'grid', gridTemplateColumns: 'minmax(120px, 1.2fr) 1fr 1.5fr 2fr', p: 1.5, alignItems: 'center' }}>
                        <Typography sx={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#0a4d68' }}>created_at</Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: '#334155' }}>String (ISO)</Typography>
                        <Typography sx={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#94a3b8' }}>gte.2024-01-01</Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: '#334155' }}>Filter reports since a specific date</Typography>
                      </Box>
                      <Box sx={{ display: 'grid', gridTemplateColumns: 'minmax(120px, 1.2fr) 1fr 1.5fr 2fr', p: 1.5, alignItems: 'center' }}>
                        <Typography sx={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#0a4d68' }}>limit</Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: '#334155' }}>Int</Typography>
                        <Typography sx={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#94a3b8' }}>50</Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: '#334155' }}>Batch size (max 1000)</Typography>
                      </Box>
                    </Stack>
                  </Box>
                </Box>

                {/* official_advisories */}
                <Box>
                  <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
                    <Box sx={{ px: 1.5, py: 0.5, bgcolor: '#ecfdf5', color: '#059669', fontSize: '0.625rem', fontWeight: 800, borderRadius: '6px', border: '1px solid #d1fae5', textTransform: 'uppercase', tracking: 'tight' }}>
                      GET
                    </Box>
                    <Typography variant="h6" sx={{ fontFamily: '"Cabinet Grotesk", sans-serif', fontWeight: 800, color: '#1e293b' }}>
                      /official_advisories
                    </Typography>
                  </Stack>
                  <Typography variant="body2" sx={{ color: '#475569', mb: 3 }}>
                    Fetch authoritative broadcasts from the national disaster management agency.
                  </Typography>
                  <Box sx={{ overflow: 'hidden', border: '1px solid #e2e8f0', borderRadius: '12px', bgcolor: '#ffffff' }}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'minmax(120px, 1.2fr) 1fr 1.5fr 2fr', bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0', p: 1.5 }}>
                      <Typography variant="caption" sx={{ color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Parameter</Typography>
                      <Typography variant="caption" sx={{ color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Type</Typography>
                      <Typography variant="caption" sx={{ color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Example</Typography>
                      <Typography variant="caption" sx={{ color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Description</Typography>
                    </Box>
                    <Stack divider={<Box sx={{ borderBottom: '1px solid #f1f5f9' }} />}>
                      <Box sx={{ display: 'grid', gridTemplateColumns: 'minmax(120px, 1.2fr) 1fr 1.5fr 2fr', p: 1.5, alignItems: 'center' }}>
                        <Typography sx={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#0a4d68' }}>expires_at</Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: '#334155' }}>String (ISO)</Typography>
                        <Typography sx={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#94a3b8' }}>gte.now()</Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: '#334155' }}>Filter for currently active advisories</Typography>
                      </Box>
                    </Stack>
                  </Box>
                </Box>

                {/* generated_risk_zones */}
                <Box>
                  <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
                    <Box sx={{ px: 1.5, py: 0.5, bgcolor: '#ecfdf5', color: '#059669', fontSize: '0.625rem', fontWeight: 800, borderRadius: '6px', border: '1px solid #d1fae5', textTransform: 'uppercase', tracking: 'tight' }}>
                      GET
                    </Box>
                    <Typography variant="h6" sx={{ fontFamily: '"Cabinet Grotesk", sans-serif', fontWeight: 800, color: '#1e293b' }}>
                      /generated_risk_zones
                    </Typography>
                  </Stack>
                  <Typography variant="body2" sx={{ color: '#475569', mb: 3 }}>
                    Access calculated hotspots derived from real-time report clustering and sensor telemetry.
                  </Typography>
                  <Box sx={{ overflow: 'hidden', border: '1px solid #e2e8f0', borderRadius: '12px', bgcolor: '#ffffff' }}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'minmax(120px, 1.2fr) 1fr 1.5fr 2fr', bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0', p: 1.5 }}>
                      <Typography variant="caption" sx={{ color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Parameter</Typography>
                      <Typography variant="caption" sx={{ color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Type</Typography>
                      <Typography variant="caption" sx={{ color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Example</Typography>
                      <Typography variant="caption" sx={{ color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Description</Typography>
                    </Box>
                    <Stack divider={<Box sx={{ borderBottom: '1px solid #f1f5f9' }} />}>
                      <Box sx={{ display: 'grid', gridTemplateColumns: 'minmax(120px, 1.2fr) 1fr 1.5fr 2fr', p: 1.5, alignItems: 'center' }}>
                        <Typography sx={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#0a4d68' }}>level</Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: '#334155' }}>String</Typography>
                        <Typography sx={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#94a3b8' }}>eq.high_risk</Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: '#334155' }}>Filter by calculated risk level</Typography>
                      </Box>
                      <Box sx={{ display: 'grid', gridTemplateColumns: 'minmax(120px, 1.2fr) 1fr 1.5fr 2fr', p: 1.5, alignItems: 'center' }}>
                        <Typography sx={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#0a4d68' }}>status</Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: '#334155' }}>String</Typography>
                        <Typography sx={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#94a3b8' }}>eq.verified</Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: '#334155' }}>Filter for formally verified zones</Typography>
                      </Box>
                    </Stack>
                  </Box>

                </Box>
              </Stack>
            </Stack>
          </Grid>

          {/* Right: Code Examples (Dark Section) */}
          <Grid
            size={{ xs: 12, lg: 5 }}
            sx={{
              bgcolor: '#0f172a',
              borderLeft: { lg: '1px solid #f1f5f9' },
              p: { xs: 4, md: 8 },
            }}
          >
            <Stack spacing={8}>
              {/* cURL Example */}
              <Box>
                <Stack direction="row" alignItems="center" justifyItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                  <Typography sx={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    cURL Request Example
                  </Typography>
                  <Tooltip title={copyState === 'curl' ? 'Copied' : 'Copy cURL'}>
                    <IconButton size="small" onClick={() => copyText('curl', curlExample)} sx={{ color: '#64748b', '&:hover': { color: '#ffffff' } }}>
                      <CopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
                <Box
                  sx={{
                    bgcolor: 'rgba(0, 0, 0, 0.2)',
                    boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
                    borderRadius: '12px',
                    p: 3,
                    fontFamily: 'monospace',
                    fontSize: '0.8125rem',
                    lineHeight: 1.7,
                    color: '#e0f2fe',
                    overflowX: 'auto',
                    whiteSpace: 'pre',
                  }}
                >
                  <span style={{ color: '#f472b6' }}>curl</span> -X GET <span style={{ color: '#fcd34d' }}>'{restBaseUrl}/hazard_reports?status=eq.verified'</span> \
                  <br />&nbsp;&nbsp;-H <span style={{ color: '#fcd34d' }}>'apikey: YOUR_KEY'</span> \
                  <br />&nbsp;&nbsp;-H <span style={{ color: '#fcd34d' }}>'Authorization: Bearer YOUR_KEY'</span>
                </Box>
              </Box>

              {/* Python Example */}
              <Box>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                  <Typography sx={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    Python (Requests) Implementation
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box sx={{ fontSize: '0.625rem', px: 1, py: 0.25, bgcolor: '#1e293b', borderRadius: '4px', color: '#94a3b8', border: '1px solid #334155', fontFamily: 'monospace' }}>
                      v3.11+
                    </Box>
                    <Tooltip title={copyState === 'python' ? 'Copied' : 'Copy Python'}>
                      <IconButton size="small" onClick={() => copyText('python', pythonExample)} sx={{ color: '#64748b', '&:hover': { color: '#ffffff' } }}>
                        <CopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Stack>
                <Box
                  sx={{
                    bgcolor: 'rgba(0, 0, 0, 0.2)',
                    boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
                    borderRadius: '12px',
                    p: 3,
                    fontFamily: 'monospace',
                    fontSize: '0.8125rem',
                    lineHeight: 1.7,
                    color: '#e2e8f0',
                    overflowX: 'auto',
                    whiteSpace: 'pre',
                  }}
                >
                  <span style={{ color: '#64748b' }}># Fetch 10 latest verified floods</span>
                  <br /><span style={{ color: '#c084fc' }}>import</span> requests
                  <br /><br />URL = <span style={{ color: '#fcd34d' }}>"{restBaseUrl}/hazard_reports"</span>
                  <br />PARAMS = {'{'}
                  <br />&nbsp;&nbsp;<span style={{ color: '#fcd34d' }}>"hazard_type"</span>: <span style={{ color: '#fcd34d' }}>"eq.Flood"</span>,
                  <br />&nbsp;&nbsp;<span style={{ color: '#fcd34d' }}>"order"</span>: <span style={{ color: '#fcd34d' }}>"created_at.desc"</span>,
                  <br />&nbsp;&nbsp;<span style={{ color: '#fcd34d' }}>"limit"</span>: <span style={{ color: '#fcd34d' }}>"10"</span>
                  <br />{'}'}
                  <br /><br />res = requests.get(URL, params=PARAMS, headers=HEADERS)
                  <br /><span style={{ color: '#c084fc' }}>for</span> report <span style={{ color: '#c084fc' }}>in</span> res.json():
                  <br />&nbsp;&nbsp;print(<span style={{ color: '#34d399' }}>f"[<span style={{ color: '#bfdbfe' }}>{'{report[\'type\']}'}</span>] @ <span style={{ color: '#bfdbfe' }}>{'{report[\'lat\']}'}</span>"</span>)
                </Box>
              </Box>

              {/* Power of PostgREST Info Box */}
              <Box
                sx={{
                  bgcolor: 'rgba(30, 41, 59, 0.4)',
                  border: '1px solid rgba(51, 65, 85, 0.5)',
                  borderRadius: '16px',
                  p: 3,
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
                  <Box sx={{ width: 32, height: 32, borderRadius: '8px', bgcolor: 'rgba(99, 102, 241, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <InfoIcon sx={{ color: '#818cf8', fontSize: 20 }} />
                  </Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#ffffff', letterSpacing: '-0.02em' }}>
                    Power of PostgREST
                  </Typography>
                </Stack>
                <Typography variant="body2" sx={{ color: '#94a3b8', lineHeight: 1.7, mb: 2 }}>
                  Our API uses PostgREST, allowing for sophisticated filtering directly in the URL query string. You can use operators like{' '}
                  <Box component="code" sx={{ color: '#a5b4fc' }}>gte.</Box>,{' '}
                  <Box component="code" sx={{ color: '#a5b4fc' }}>is.null</Box>, and{' '}
                  <Box component="code" sx={{ color: '#a5b4fc' }}>ov.</Box> for complex spatial queries.
                </Typography>
                <Link
                  href="https://postgrest.org"
                  target="_blank"
                  rel="noreferrer"
                  sx={{
                    fontSize: '0.75rem',
                    color: '#818cf8',
                    '&:hover': { color: '#a5b4fc' },
                    fontWeight: 600,
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    transition: 'color 0.2s',
                  }}
                >
                  Read Filter Syntax Reference
                  <LaunchIcon sx={{ fontSize: 10 }} />
                </Link>
              </Box>
            </Stack>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
