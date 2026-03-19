import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    TextField,
    Button,
    Typography,
    Alert,
    Collapse,
    IconButton,
    InputAdornment,
    CircularProgress,
    useTheme,
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import { useAuth } from '../contexts/AuthContext';

/* ─────────────────────── CSS injected once ─────────────────────── */
const WAVE_CSS_ID = 'ocean-login-waves';
if (typeof document !== 'undefined' && !document.getElementById(WAVE_CSS_ID)) {
    const style = document.createElement('style');
    style.id = WAVE_CSS_ID;
    style.textContent = `
        @keyframes ocean-swell {
            0%   { d: path("M0,160 C120,185 240,125 360,155 C480,185 600,115 720,145 C840,175 960,105 1080,140 C1200,175 1320,110 1440,145 L1440,320 L0,320 Z"); }
            50%  { d: path("M0,145 C120,115 240,180 360,145 C480,110 600,175 720,155 C840,125 960,185 1080,150 C1200,115 1320,175 1440,155 L1440,320 L0,320 Z"); }
            100% { d: path("M0,160 C120,185 240,125 360,155 C480,185 600,115 720,145 C840,175 960,105 1080,140 C1200,175 1320,110 1440,145 L1440,320 L0,320 Z"); }
        }
        @keyframes ocean-swell-2 {
            0%   { d: path("M0,180 C160,210 320,155 480,175 C640,195 800,140 960,165 C1120,190 1280,140 1440,170 L1440,320 L0,320 Z"); }
            50%  { d: path("M0,170 C160,140 320,200 480,170 C640,140 800,195 960,175 C1120,150 1280,200 1440,180 L1440,320 L0,320 Z"); }
            100% { d: path("M0,180 C160,210 320,155 480,175 C640,195 800,140 960,165 C1120,190 1280,140 1440,170 L1440,320 L0,320 Z"); }
        }
        @keyframes ocean-swell-3 {
            0%   { d: path("M0,200 C180,225 360,185 540,210 C720,235 900,175 1080,200 C1260,225 1440,185 1440,200 L1440,320 L0,320 Z"); }
            50%  { d: path("M0,210 C180,185 360,230 540,200 C720,175 900,225 1080,210 C1260,185 1440,225 1440,210 L1440,320 L0,320 Z"); }
            100% { d: path("M0,200 C180,225 360,185 540,210 C720,235 900,175 1080,200 C1260,225 1440,185 1440,200 L1440,320 L0,320 Z"); }
        }
        @keyframes ocean-swell-4 {
            0%   { d: path("M0,230 C200,250 400,215 600,235 C800,255 1000,215 1200,235 C1400,250 1440,225 1440,240 L1440,320 L0,320 Z"); }
            50%  { d: path("M0,240 C200,220 400,250 600,230 C800,210 1000,250 1200,240 C1400,225 1440,245 1440,235 L1440,320 L0,320 Z"); }
            100% { d: path("M0,230 C200,250 400,215 600,235 C800,255 1000,215 1200,235 C1400,250 1440,225 1440,240 L1440,320 L0,320 Z"); }
        }
    `;
    document.head.appendChild(style);
}

// ── Keyframes ───────────────────────────────────────────────

const gradientShift = keyframes`
  0%, 100% { background-position: 0% 50%; }
  50%      { background-position: 100% 50%; }
`;

const orbDrift = keyframes`
  0%, 100% { transform: translate(0, 0) scale(1); }
  33%      { transform: translate(25px, -20px) scale(1.03); }
  66%      { transform: translate(-15px, 12px) scale(0.97); }
`;

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const pulseGlow = keyframes`
  0%, 100% { opacity: 0.5; }
  50%      { opacity: 0.8; }
`;

const twinkle = keyframes`
  0%, 100% { opacity: 0.1; transform: scale(0.7); }
  50%      { opacity: 0.85; transform: scale(1.3); }
`;

const drift = keyframes`
  0%   { translate: 0 0; }
  25%  { translate: 18px -25px; }
  50%  { translate: -12px -40px; }
  75%  { translate: 22px -15px; }
  100% { translate: 0 0; }
`;

// ── Styled Components ───────────────────────────────────────

const PageRoot = styled(Box)(({ theme }) => ({
    height: '100vh',
    display: 'flex',
    overflow: 'hidden',
    [theme.breakpoints.down('md')]: {
        flexDirection: 'column',
        height: 'auto',
        minHeight: '100vh',
        overflow: 'auto',
    },
}));

const HeroPanel = styled(Box)(({ theme }) => ({
    flex: '0 0 50%',
    maxWidth: '50%',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    padding: '40px 48px 0',
    overflow: 'hidden',
    background: theme.palette.mode === 'dark'
        ? 'linear-gradient(160deg, #020A0E 0%, #041E2B 30%, #00ffd110 65%, #0a3352 100%)'
        : 'linear-gradient(160deg, #020A0E 0%, #041E2B 30%, #083344 65%, #0a3352 100%)',
    backgroundSize: '200% 200%',
    animation: `${gradientShift} 20s ease infinite`,
    [theme.breakpoints.down('md')]: {
        display: 'none',
    },
}));

const FormPanel = styled(Box)(({ theme }) => ({
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '32px 48px',
    backgroundColor: theme.palette.mode === 'dark' ? '#0a192f' : theme.palette.background.paper,
    overflow: 'auto',
    position: 'relative',
    boxShadow: theme.palette.mode === 'dark' ? '-20px 0 40px rgba(0, 255, 209, 0.05)' : 'none',
    [theme.breakpoints.down('sm')]: {
        padding: '32px 24px',
    },
}));

const FormWrapper = styled(Box)({
    width: '100%',
    maxWidth: '370px',
    display: 'flex',
    flexDirection: 'column',
});

const FieldLabel = styled(Typography)(({ theme }) => ({
    fontSize: '0.8125rem',
    fontWeight: 600,
    color: theme.palette.text.secondary,
    marginBottom: '6px',
}));

const StyledInput = styled(TextField)(({ theme }) => ({
    '& .MuiOutlinedInput-root': {
        borderRadius: '10px',
        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0, 255, 209, 0.02)' : '#f8fafc',
        transition: 'all 0.2s ease',
        '& fieldset': {
            borderColor: '#e2e8f0',
            borderWidth: '1.5px',
        },
        '&:hover': {
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0, 255, 209, 0.05)' : '#f1f5f9',
            '& fieldset': { borderColor: theme.palette.mode === 'dark' ? 'rgba(0, 255, 209, 0.3)' : '#cbd5e1' },
        },
        '&.Mui-focused': {
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0, 255, 209, 0.08)' : theme.palette.background.paper,
            boxShadow: theme.palette.mode === 'dark' ? '0 0 0 3px rgba(0, 255, 209, 0.15)' : '0 0 0 3px rgba(8, 131, 149, 0.08)',
            '& fieldset': {
                borderColor: '#088395',
                borderWidth: '1.5px',
            },
        },
    },
    '& .MuiOutlinedInput-input': {
        padding: '12px 14px',
        fontSize: '0.9375rem',
        color: theme.palette.text.primary,
        fontWeight: 500,
        '&::placeholder': { color: theme.palette.text.secondary, opacity: 1, fontWeight: 400 },
    },
}));

const SubmitButton = styled(Button)(({ theme }) => ({
    padding: '12px 24px',
    fontSize: '0.9375rem',
    fontWeight: 600,
    borderRadius: '10px',
    textTransform: 'none',
    background: theme.palette.mode === 'dark' ? 'linear-gradient(135deg, #00ffd1 0%, #00ccA7 100%)' : 'linear-gradient(135deg, #088395 0%, #0a6b7a 100%)',
    color: theme.palette.mode === 'dark' ? '#040b16' : '#ffffff',
    boxShadow: theme.palette.mode === 'dark' ? '0 2px 8px rgba(0,255,209,0.3)' : '0 2px 8px rgba(8,131,149,0.3)',
    transition: 'all 0.2s ease',
    '&:hover': {
        background: theme.palette.mode === 'dark' ? 'linear-gradient(135deg, #00e6bc 0%, #00b392 100%)' : 'linear-gradient(135deg, #07758a 0%, #095d6d 100%)',
        boxShadow: theme.palette.mode === 'dark' ? '0 6px 20px rgba(0,255,209,0.4)' : '0 6px 20px rgba(8,131,149,0.35)',
        transform: 'translateY(-1px)',
    },
    '&:active': {
        transform: 'translateY(0)',
    },
    '&.Mui-disabled': {
        background: theme.palette.mode === 'dark' ? 'rgba(0,255,209,0.2)' : '#cbd5e1',
        color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.3)' : '#ffffff',
        boxShadow: 'none',
    },
}));

// ── Ocean Waves (real water-like SVG animation) ─────────────

const OceanWaves: React.FC = () => (
    <Box
        sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: '45%',
            pointerEvents: 'none',
            zIndex: 1,
        }}
    >
        <svg
            viewBox="0 0 1440 320"
            preserveAspectRatio="none"
            style={{ width: '100%', height: '100%', display: 'block' }}
        >
            <defs>
                <linearGradient id="wg1" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="rgba(8,131,149,0.12)" />
                    <stop offset="100%" stopColor="rgba(8,131,149,0.03)" />
                </linearGradient>
                <linearGradient id="wg2" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="rgba(5,191,219,0.10)" />
                    <stop offset="100%" stopColor="rgba(5,191,219,0.02)" />
                </linearGradient>
                <linearGradient id="wg3" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="rgba(8,131,149,0.08)" />
                    <stop offset="100%" stopColor="rgba(8,131,149,0.015)" />
                </linearGradient>
                <linearGradient id="wg4" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="rgba(5,191,219,0.06)" />
                    <stop offset="100%" stopColor="rgba(5,191,219,0.01)" />
                </linearGradient>
            </defs>
            {/* Wave 1 – deepest, slowest */}
            <path
                fill="url(#wg1)"
                d="M0,160 C120,185 240,125 360,155 C480,185 600,115 720,145 C840,175 960,105 1080,140 C1200,175 1320,110 1440,145 L1440,320 L0,320 Z"
                style={{ animation: 'ocean-swell 8s ease-in-out infinite' }}
            />
            {/* Wave 2 */}
            <path
                fill="url(#wg2)"
                d="M0,180 C160,210 320,155 480,175 C640,195 800,140 960,165 C1120,190 1280,140 1440,170 L1440,320 L0,320 Z"
                style={{ animation: 'ocean-swell-2 6s ease-in-out infinite' }}
            />
            {/* Wave 3 */}
            <path
                fill="url(#wg3)"
                d="M0,200 C180,225 360,185 540,210 C720,235 900,175 1080,200 C1260,225 1440,185 1440,200 L1440,320 L0,320 Z"
                style={{ animation: 'ocean-swell-3 5s ease-in-out infinite' }}
            />
            {/* Wave 4 – front, fastest */}
            <path
                fill="url(#wg4)"
                d="M0,230 C200,250 400,215 600,235 C800,255 1000,215 1200,235 C1400,250 1440,225 1440,240 L1440,320 L0,320 Z"
                style={{ animation: 'ocean-swell-4 4s ease-in-out infinite' }}
            />
        </svg>
    </Box>
);

// ── Ambient orb ─────────────────────────────────────────────

const Orb: React.FC<{
    color: string; size: number; top: string; left: string; delay: number;
}> = ({ color, size, top, left, delay }) => (
    <Box
        sx={{
            position: 'absolute',
            width: size, height: size, borderRadius: '50%',
            background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
            top, left,
            filter: 'blur(60px)',
            opacity: 0.3,
            animation: `${orbDrift} ${16 + delay * 2}s ease-in-out infinite`,
            animationDelay: `${delay}s`,
            pointerEvents: 'none',
        }}
    />
);

// ── Brand mark ──────────────────────────────────────────────

const BrandMark: React.FC<{ size?: number; light?: boolean }> = ({ size = 32, light }) => (
    <Box component="svg" viewBox="0 0 32 32" sx={{ width: size, height: size, flexShrink: 0 }}>
        <defs>
            <linearGradient id="wgr1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={light ? "#00ffd1" : "#05bfdb"} />
                <stop offset="100%" stopColor={light ? "#00ccA7" : "#088395"} />
            </linearGradient>
            <linearGradient id="wgr2" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={light ? "#00ccA7" : "#088395"} />
                <stop offset="100%" stopColor={light ? "#00997d" : "#0a4d68"} />
            </linearGradient>
        </defs>
        <circle cx="16" cy="16" r="15"
            fill={light ? 'rgba(8,131,149,0.12)' : 'rgba(8,131,149,0.1)'}
            stroke={light ? 'rgba(5,191,219,0.3)' : 'rgba(8,131,149,0.2)'}
            strokeWidth="1"
        />
        <path d="M7 19c2.5-4 5.5-7 9-7s6.5 3 9 7" stroke="url(#wgr1)" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        <path d="M7 14c2.5-4 5.5-7 9-7s6.5 3 9 7" stroke="url(#wgr2)" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </Box>
);

// ── Stat card ───────────────────────────────────────────────

const StatCard = styled(Box)({
    padding: '16px 20px',
    borderRadius: '12px',
    background: 'rgba(255, 255, 255, 0.06)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    flex: 1,
    minWidth: 0,
    backdropFilter: 'blur(6px)',
    transition: 'all 0.25s ease',
    '&:hover': {
        background: 'rgba(255, 255, 255, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.18)',
        transform: 'translateY(-2px)',
    },
});

// ── Component ───────────────────────────────────────────────

const STATS = [
    { value: '24/7', label: 'Real-time Monitoring' },
    { value: '150+', label: 'Coastal Zones' },
    { value: '99.9%', label: 'System Uptime' },
] as const;

export const Login: React.FC = () => {
    const navigate = useNavigate();
    const { login, isAuthenticated, loading } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const muiTheme = useTheme();
    const isDark = muiTheme.palette.mode === 'dark';

    const stars = useMemo(
        () =>
            Array.from({ length: 22 }, (_, i) => ({
                id: i,
                x: (i * 41 + 17) % 96 + 2,
                y: (i * 59 + 11) % 90 + 3,
                size: 1.5 + (i % 3) * 0.8,
                delay: (i % 9) * 1.1,
                duration: 4 + (i % 5) * 1.8,
                driftDuration: 18 + (i % 6) * 4,
            })),
        [],
    );

    useEffect(() => {
        if (!loading && isAuthenticated) {
            navigate('/dashboard', { replace: true });
        }
    }, [isAuthenticated, loading, navigate]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!email.trim() || !password.trim()) {
            setError('Please enter both email and password.');
            return;
        }
        setIsSubmitting(true);
        const { error: loginError } = await login(email, password);
        setIsSubmitting(false);
        if (loginError) {
            console.error('Login error:', loginError);
            setError(loginError.message || 'Invalid credentials. Please try again.');
            return;
        }
        navigate('/dashboard');
    };

    const fillCredentials = () => {
        setEmail('admin@gmail.com');
        setPassword('123456');
    };

    return (
        <PageRoot>
            {/* ═════════ LEFT HERO ═════════ */}
            <HeroPanel>
                {/* Orbs */}
                <Orb color="#088395" size={380} top="5%" left="-8%" delay={0} />
                <Orb color="#05bfdb" size={280} top="40%" left="58%" delay={4} />
                <Orb color="#0a4d68" size={300} top="-5%" left="72%" delay={8} />

                {/* Floating dot stars */}
                {stars.map((s) => (
                    <Box
                        key={s.id}
                        sx={{
                            position: 'absolute',
                            width: s.size,
                            height: s.size,
                            borderRadius: '50%',
                            backgroundColor: 'rgba(5, 191, 219, 0.55)',
                            boxShadow: '0 0 4px rgba(5, 191, 219, 0.3)',
                            top: `${s.y}%`,
                            left: `${s.x}%`,
                            animation: `${twinkle} ${s.duration}s ease-in-out infinite, ${drift} ${s.driftDuration}s ease-in-out infinite`,
                            animationDelay: `${s.delay}s`,
                            pointerEvents: 'none',
                            zIndex: 1,
                        }}
                    />
                ))}

                {/* ── Content ── */}
                <Box sx={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
                    {/* Brand */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, animation: `${fadeInUp} 0.5s ease-out both` }}>
                        <BrandMark size={34} light />
                        <Typography sx={{ color: '#fff', fontSize: '1.1rem', fontWeight: 700, letterSpacing: '0.06em' }}>
                            OCEAN
                        </Typography>
                    </Box>

                    {/* Headline — centered */}
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: '450px', animation: `${fadeInUp} 0.6s ease-out 0.1s both` }}>
                        {/* Accent bar */}
                        <Box sx={{
                            width: 48, height: 3, borderRadius: 2, mb: 2.5,
                            background: 'linear-gradient(90deg, #088395, #05bfdb)',
                            position: 'relative',
                            '&::after': {
                                content: '""', position: 'absolute', inset: '-2px', borderRadius: '4px',
                                background: 'linear-gradient(90deg, rgba(8,131,149,0.4), rgba(5,191,219,0.4))',
                                filter: 'blur(4px)',
                                animation: `${pulseGlow} 3s ease-in-out infinite`,
                            },
                        }} />
                        <Typography sx={{
                            color: '#fff',
                            fontSize: 'clamp(1.75rem, 3vw, 2.5rem)',
                            fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.03em', mb: 1.5,
                        }}>
                            Coastal Safety{' '}
                            <Box component="span" sx={{
                                background: isDark 
                                    ? 'linear-gradient(135deg, #00ffd1, #00ccA7)' 
                                    : 'linear-gradient(135deg, #05bfdb, #088395)',
                                backgroundClip: 'text', WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}>
                                Admin Portal
                            </Box>
                        </Typography>
                        <Typography sx={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.9375rem', lineHeight: 1.65, maxWidth: 380 }}>
                            Monitor hazards, manage advisories, and protect coastal
                            communities with real-time data intelligence.
                        </Typography>
                    </Box>

                    {/* Stat cards — pinned above waves */}
                    <Box sx={{ position: 'relative', zIndex: 3, pb: '120px', animation: `${fadeInUp} 0.7s ease-out 0.2s both` }}>
                        <Box sx={{ display: 'flex', gap: 1.5 }}>
                            {STATS.map((s) => (
                                <StatCard key={s.label}>
                                    <Typography sx={{
                                        color: isDark ? '#00ffd1' : '#05bfdb', fontSize: '1.35rem',
                                        fontWeight: 800, letterSpacing: '-0.02em', mb: 0.25,
                                    }}>
                                        {s.value}
                                    </Typography>
                                    <Typography sx={{
                                        color: isDark ? '#e2f1f8' : 'rgba(255,255,255,0.55)', fontSize: '0.7rem',
                                        fontWeight: 500,
                                    }}>
                                        {s.label}
                                    </Typography>
                                </StatCard>
                            ))}
                        </Box>
                    </Box>
                </Box>

                {/* Animated ocean waves */}
                <OceanWaves />
            </HeroPanel>

            {/* ═════════ RIGHT FORM ═════════ */}
            <FormPanel>
                <FormWrapper>
                    {/* Mobile brand */}
                    <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1.5, mb: 4 }}>
                        <BrandMark size={28} />
                        <Typography sx={{ color: muiTheme.palette.text.primary, fontSize: '1rem', fontWeight: 700, letterSpacing: '0.04em' }}>
                            OCEAN
                        </Typography>
                    </Box>

                    {/* Icon */}
                    <Box sx={{
                        width: 44, height: 44, borderRadius: '12px',
                        background: 'linear-gradient(135deg, rgba(8,131,149,0.08), rgba(5,191,219,0.05))',
                        border: '1px solid rgba(8,131,149,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        mb: 2.5, animation: `${fadeInUp} 0.4s ease-out both`,
                    }}>
                        <ShieldOutlinedIcon sx={{ color: '#088395', fontSize: '1.3rem' }} />
                    </Box>

                    {/* Heading */}
                    <Typography sx={{
                        fontSize: '1.6rem', fontWeight: 800, color: muiTheme.palette.text.primary,
                        letterSpacing: '-0.03em', mb: 0.25,
                        animation: `${fadeInUp} 0.45s ease-out 0.05s both`,
                    }}>
                        Welcome back
                    </Typography>
                    <Typography sx={{
                        fontSize: '0.875rem', color: '#64748b', mb: 3,
                        animation: `${fadeInUp} 0.5s ease-out 0.1s both`,
                    }}>
                        Sign in to your admin account
                    </Typography>

                    {/* Error */}
                    <Collapse in={!!error}>
                        <Alert severity="error" onClose={() => setError(null)}
                            sx={{ mb: 2, borderRadius: '10px', fontSize: '0.8125rem' }}>
                            {error}
                        </Alert>
                    </Collapse>

                    {/* Form */}
                    <Box component="form" onSubmit={handleLogin} sx={{ animation: `${fadeInUp} 0.55s ease-out 0.15s both` }}>
                        <Box sx={{ mb: 2 }}>
                            <FieldLabel>Email address</FieldLabel>
                            <StyledInput fullWidth placeholder="you@example.com" type="email"
                                value={email} onChange={(e) => setEmail(e.target.value)}
                                onFocus={() => setError(null)} required autoComplete="email" autoFocus />
                        </Box>

                        <Box sx={{ mb: 3 }}>
                            <FieldLabel>Password</FieldLabel>
                            <StyledInput fullWidth placeholder="Enter your password"
                                type={showPassword ? 'text' : 'password'}
                                value={password} onChange={(e) => setPassword(e.target.value)}
                                onFocus={() => setError(null)} required autoComplete="current-password"
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton onClick={() => setShowPassword((p) => !p)}
                                                edge="end" size="small" tabIndex={-1}
                                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                                                sx={{ color: '#94a3b8' }}>
                                                {showPassword ? <VisibilityOffOutlinedIcon fontSize="small" /> : <VisibilityOutlinedIcon fontSize="small" />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Box>

                        <SubmitButton fullWidth type="submit" variant="contained" disabled={isSubmitting} disableElevation>
                            {isSubmitting ? (
                                <CircularProgress size={22} sx={{ color: '#fff' }} />
                            ) : (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <LockOutlinedIcon sx={{ fontSize: '1.1rem' }} />
                                    Sign in
                                </Box>
                            )}
                        </SubmitButton>
                    </Box>

                    {/* TLS badge */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.75, mt: 2, animation: `${fadeInUp} 0.6s ease-out 0.2s both` }}>
                        <Box sx={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: '#10b981', boxShadow: '0 0 6px rgba(16,185,129,0.4)' }} />
                        <Typography sx={{ fontSize: '0.6875rem', color: '#94a3b8', fontWeight: 500 }}>
                            Secured with TLS encryption
                        </Typography>
                    </Box>

                    {/* Divider */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2.5, mb: 2, animation: `${fadeInUp} 0.65s ease-out 0.25s both` }}>
                        <Box sx={{ flex: 1, height: '1px', backgroundColor: muiTheme.palette.divider }} />
                        <Typography sx={{ fontSize: '0.625rem', color: muiTheme.palette.text.secondary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            Demo
                        </Typography>
                        <Box sx={{ flex: 1, height: '1px', backgroundColor: muiTheme.palette.divider }} />
                    </Box>

                    {/* Demo creds */}
                    <Box sx={{ p: 1.5, borderRadius: '10px', backgroundColor: isDark ? 'rgba(0, 255, 209, 0.03)' : '#f8fafc', border: `1px solid ${muiTheme.palette.divider}`, animation: `${fadeInUp} 0.7s ease-out 0.3s both` }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 1.25 }}>
                            {[{ label: 'Email', value: 'admin@gmail.com' }, { label: 'Password', value: '123456' }].map((item) => (
                                <Box key={item.label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography sx={{ color: muiTheme.palette.text.secondary, fontSize: '0.75rem' }}>{item.label}</Typography>
                                    <Typography sx={{
                                        color: muiTheme.palette.text.primary, fontSize: '0.75rem',
                                        fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                                        fontWeight: 500, backgroundColor: muiTheme.palette.background.paper,
                                        padding: '1px 8px', borderRadius: '5px', border: `1px solid ${muiTheme.palette.divider}`,
                                    }}>
                                        {item.value}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>
                        <Button fullWidth size="small" onClick={fillCredentials} sx={{
                            fontSize: '0.6875rem', fontWeight: 600, textTransform: 'none',
                            color: '#088395', backgroundColor: 'rgba(8,131,149,0.06)',
                            borderRadius: '7px', py: 0.625,
                            '&:hover': { backgroundColor: 'rgba(8,131,149,0.12)' },
                        }}>
                            Auto-fill credentials
                        </Button>
                    </Box>

                    {/* Footer */}
                    <Typography sx={{ mt: 3, textAlign: 'center', fontSize: '0.6875rem', color: '#cbd5e1' }}>
                        © 2026 Ocean · Coastal Safety System
                    </Typography>
                </FormWrapper>
            </FormPanel>
        </PageRoot>
    );
};
