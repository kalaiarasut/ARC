import { useState } from 'react';
import {
  Box,
  Button,
  Grid,
  IconButton,
  Link,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import DatabaseIcon from '@mui/icons-material/StorageRounded';
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
  const isDark = theme.palette.mode === 'dark';
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
    <Box sx={{ minHeight: '100vh', bgcolor: isDark ? 'background.default' : alpha(theme.palette.primary.main, 0.02) }}>
      {/* Premium Header */}
      <Box
        sx={{
          px: { xs: 2, sm: 3 },
          py: 2,
          background: isDark
            ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${theme.palette.background.paper} 100%)`
            : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.background.paper, 1)} 100%)`,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isDark
                  ? 'linear-gradient(135deg, #00ffd1 0%, #00ccA7 100%)'
                  : 'linear-gradient(135deg, #0a4d68 0%, #088395 50%, #05bfdb 100%)',
                boxShadow: isDark
                  ? '0 0 15px rgba(0, 255, 209, 0.3)'
                  : '0 4px 14px rgba(8, 131, 149, 0.35)',
              }}
            >
              <DatabaseIcon sx={{ color: isDark ? '#040b16' : 'white', fontSize: 24 }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.2, letterSpacing: -0.5 }}>
                Institutional Export API
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 0.3 }}>
                Public Data Access Documentation
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1.5}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<BookOpenIcon sx={{ fontSize: 18 }} />}
              component="a"
              href="https://postgrest.org/en/v12/references/api/tables_views.html"
              target="_blank"
              sx={{
                borderRadius: '10px',
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              Full Reference
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<KeyIcon sx={{ fontSize: 18 }} />}
              onClick={() => copyText('anon_key', anonKey)}
              sx={{
                borderRadius: '10px',
                textTransform: 'none',
                fontWeight: 600,
                background: isDark
                  ? 'linear-gradient(135deg, #00ffd1 0%, #00ccA7 100%)'
                  : 'linear-gradient(135deg, #0a4d68 0%, #088395 50%, #05bfdb 100%)',
                color: isDark ? '#040b16' : '#ffffff',
                boxShadow: isDark
                  ? '0 0 15px rgba(0, 255, 209, 0.3)'
                  : '0 4px 12px rgba(8, 131, 149, 0.3)',
              }}
            >
              {copyState === 'anon_key' ? 'Copied!' : 'Copy API Key'}
            </Button>
          </Stack>
        </Stack>
      </Box>

      {/* Main Content */}
      <Box sx={{ px: { xs: 2, sm: 3 }, py: 2.5 }}>
        <Grid container spacing={3}>
          {/* Left: Documentation */}
          <Grid size={{ xs: 12, lg: 7 }}>
            <Stack spacing={3}>
              {/* Authentication */}
              <Box
                component="section"
                sx={{
                  p: 2.5,
                  borderRadius: '16px',
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  bgcolor: alpha(theme.palette.background.paper, 0.8),
                }}
              >
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
                  Authentication
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7, mb: 2 }}>
                  Since public data (verified reports and active advisories) is accessible via Row-Level Security (RLS), simply include the public{' '}
                  <Box component="code" sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), px: 0.5, py: 0.25, borderRadius: 1, color: 'primary.main', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                    anon
                  </Box>{' '}
                  key in your request headers.
                </Typography>

                <Box sx={{ bgcolor: alpha(theme.palette.divider, 0.05), border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, borderRadius: '12px', p: 2 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', mb: 1.5 }}>
                    Required Headers
                  </Typography>
                  <Stack spacing={1}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'background.paper', p: 1.5, borderRadius: '8px', border: `1px solid ${alpha(theme.palette.divider, 0.08)}` }}>
                      <Typography sx={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'text.primary' }}>apikey</Typography>
                      <Typography sx={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'primary.main', fontWeight: 600 }}>&lt;YOUR_SUPABASE_ANON_KEY&gt;</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'background.paper', p: 1.5, borderRadius: '8px', border: `1px solid ${alpha(theme.palette.divider, 0.08)}` }}>
                      <Typography sx={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'text.primary' }}>Authorization</Typography>
                      <Typography sx={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'primary.main', fontWeight: 600 }}>Bearer &lt;YOUR_SUPABASE_ANON_KEY&gt;</Typography>
                    </Box>
                  </Stack>
                </Box>
              </Box>

              {/* Endpoints */}
              <Stack component="section" spacing={2}>
                {/* hazard_reports */}
                <Box
                  sx={{
                    p: 2.5,
                    borderRadius: '16px',
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    bgcolor: alpha(theme.palette.background.paper, 0.8),
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.5 }}>
                    <Box sx={{ px: 1.5, py: 0.5, bgcolor: alpha(theme.palette.success.main, 0.1), color: 'success.main', fontSize: '0.625rem', fontWeight: 700, borderRadius: '6px', textTransform: 'uppercase' }}>
                      GET
                    </Box>
                    <Typography variant="subtitle1" fontWeight={700}>
                      /hazard_reports
                    </Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Fetch user-submitted reports that have been formally verified by our emergency response team.
                  </Typography>
                  <Box sx={{ overflow: 'hidden', border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, borderRadius: '10px' }}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr 2fr', bgcolor: alpha(theme.palette.divider, 0.05), borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`, p: 1 }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>Parameter</Typography>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>Type</Typography>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>Example</Typography>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>Description</Typography>
                    </Box>
                    {[
                      { param: 'hazard_type', type: 'String', example: 'eq.Flood', desc: 'Filter by hazard category' },
                      { param: 'is_high_risk', type: 'Boolean', example: 'is.true', desc: 'Only severe warnings' },
                      { param: 'created_at', type: 'ISO String', example: 'gte.2024-01-01', desc: 'Filter by date' },
                      { param: 'limit', type: 'Int', example: '50', desc: 'Batch size (max 1000)' },
                    ].map((row, idx) => (
                      <Box key={idx} sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr 2fr', p: 1, borderBottom: idx < 3 ? `1px solid ${alpha(theme.palette.divider, 0.05)}` : 'none' }}>
                        <Typography sx={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'primary.main' }}>{row.param}</Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{row.type}</Typography>
                        <Typography sx={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'text.disabled' }}>{row.example}</Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{row.desc}</Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>

                {/* official_advisories */}
                <Box
                  sx={{
                    p: 2.5,
                    borderRadius: '16px',
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    bgcolor: alpha(theme.palette.background.paper, 0.8),
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.5 }}>
                    <Box sx={{ px: 1.5, py: 0.5, bgcolor: alpha(theme.palette.success.main, 0.1), color: 'success.main', fontSize: '0.625rem', fontWeight: 700, borderRadius: '6px', textTransform: 'uppercase' }}>
                      GET
                    </Box>
                    <Typography variant="subtitle1" fontWeight={700}>
                      /official_advisories
                    </Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Fetch authoritative broadcasts from the national disaster management agency.
                  </Typography>
                  <Box sx={{ overflow: 'hidden', border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, borderRadius: '10px' }}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr 2fr', bgcolor: alpha(theme.palette.divider, 0.05), borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`, p: 1 }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>Parameter</Typography>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>Type</Typography>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>Example</Typography>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>Description</Typography>
                    </Box>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr 2fr', p: 1 }}>
                      <Typography sx={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'primary.main' }}>expires_at</Typography>
                      <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>ISO String</Typography>
                      <Typography sx={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'text.disabled' }}>gte.now()</Typography>
                      <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Filter for active advisories</Typography>
                    </Box>
                  </Box>
                </Box>

                {/* generated_risk_zones */}
                <Box
                  sx={{
                    p: 2.5,
                    borderRadius: '16px',
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    bgcolor: alpha(theme.palette.background.paper, 0.8),
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.5 }}>
                    <Box sx={{ px: 1.5, py: 0.5, bgcolor: alpha(theme.palette.success.main, 0.1), color: 'success.main', fontSize: '0.625rem', fontWeight: 700, borderRadius: '6px', textTransform: 'uppercase' }}>
                      GET
                    </Box>
                    <Typography variant="subtitle1" fontWeight={700}>
                      /generated_risk_zones
                    </Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Access calculated hotspots derived from real-time report clustering.
                  </Typography>
                  <Box sx={{ overflow: 'hidden', border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, borderRadius: '10px' }}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr 2fr', bgcolor: alpha(theme.palette.divider, 0.05), borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`, p: 1 }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>Parameter</Typography>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>Type</Typography>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>Example</Typography>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>Description</Typography>
                    </Box>
                    {[
                      { param: 'level', type: 'String', example: 'eq.high_risk', desc: 'Filter by risk level' },
                      { param: 'status', type: 'String', example: 'eq.verified', desc: 'Filter verified zones' },
                    ].map((row, idx) => (
                      <Box key={idx} sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr 2fr', p: 1, borderBottom: idx < 1 ? `1px solid ${alpha(theme.palette.divider, 0.05)}` : 'none' }}>
                        <Typography sx={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'primary.main' }}>{row.param}</Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{row.type}</Typography>
                        <Typography sx={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'text.disabled' }}>{row.example}</Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{row.desc}</Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Stack>
            </Stack>
          </Grid>

          {/* Right: Code Examples */}
          <Grid
            size={{ xs: 12, lg: 5 }}
            sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
          >
            {/* cURL Example */}
            <Box
              sx={{
                p: 2.5,
                borderRadius: '16px',
                bgcolor: isDark ? alpha(theme.palette.primary.main, 0.05) : '#0f172a',
                border: `1px solid ${isDark ? alpha(theme.palette.primary.main, 0.1) : 'transparent'}`,
              }}
            >
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
                <Typography sx={{ color: isDark ? 'text.secondary' : '#94a3b8', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  cURL Example
                </Typography>
                <Tooltip title={copyState === 'curl' ? 'Copied!' : 'Copy'}>
                  <IconButton size="small" onClick={() => copyText('curl', curlExample)} sx={{ color: isDark ? 'text.secondary' : '#64748b', '&:hover': { color: isDark ? 'primary.main' : '#ffffff' } }}>
                    <CopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
              <Box
                sx={{
                  bgcolor: isDark ? alpha(theme.palette.background.default, 0.5) : 'rgba(0,0,0,0.2)',
                  borderRadius: '10px',
                  p: 2,
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  lineHeight: 1.8,
                  color: isDark ? '#00ffd1' : '#e0f2fe',
                  overflowX: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {`curl -X GET '${restBaseUrl}/hazard_reports?status=eq.verified' \\
  -H 'apikey: YOUR_KEY' \\
  -H 'Authorization: Bearer YOUR_KEY'`}
              </Box>
            </Box>

            {/* Python Example */}
            <Box
              sx={{
                p: 2.5,
                borderRadius: '16px',
                bgcolor: isDark ? alpha(theme.palette.primary.main, 0.05) : '#0f172a',
                border: `1px solid ${isDark ? alpha(theme.palette.primary.main, 0.1) : 'transparent'}`,
              }}
            >
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
                <Typography sx={{ color: isDark ? 'text.secondary' : '#94a3b8', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Python Example
                </Typography>
                <Tooltip title={copyState === 'python' ? 'Copied!' : 'Copy'}>
                  <IconButton size="small" onClick={() => copyText('python', pythonExample)} sx={{ color: isDark ? 'text.secondary' : '#64748b', '&:hover': { color: isDark ? 'primary.main' : '#ffffff' } }}>
                    <CopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
              <Box
                sx={{
                  bgcolor: isDark ? alpha(theme.palette.background.default, 0.5) : 'rgba(0,0,0,0.2)',
                  borderRadius: '10px',
                  p: 2,
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  lineHeight: 1.8,
                  color: isDark ? '#e2f1f8' : '#e2e8f0',
                  overflowX: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {pythonExample}
              </Box>
            </Box>

            {/* PostgREST Info */}
            <Box
              sx={{
                p: 2.5,
                borderRadius: '16px',
                bgcolor: alpha(theme.palette.info.main, 0.05),
                border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.5 }}>
                <Box sx={{ width: 32, height: 32, borderRadius: '8px', bgcolor: alpha(theme.palette.info.main, 0.15), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <InfoIcon sx={{ color: 'info.main', fontSize: 18 }} />
                </Box>
                <Typography variant="subtitle2" fontWeight={700}>
                  Power of PostgREST
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7, mb: 1.5 }}>
                Our API uses PostgREST, allowing sophisticated filtering directly in the URL query string using operators like{' '}
                <Box component="code" sx={{ color: 'info.main', fontFamily: 'monospace', fontSize: '0.75rem' }}>gte.</Box>,{' '}
                <Box component="code" sx={{ color: 'info.main', fontFamily: 'monospace', fontSize: '0.75rem' }}>is.null</Box>, and{' '}
                <Box component="code" sx={{ color: 'info.main', fontFamily: 'monospace', fontSize: '0.75rem' }}>ov.</Box>
              </Typography>
              <Link
                href="https://postgrest.org"
                target="_blank"
                rel="noreferrer"
                sx={{
                  fontSize: '0.8rem',
                  color: 'info.main',
                  fontWeight: 600,
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                Read Filter Syntax Reference
                <LaunchIcon sx={{ fontSize: 12 }} />
              </Link>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
