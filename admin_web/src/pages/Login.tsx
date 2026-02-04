import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, TextField, Button, Typography, Container, Alert, Collapse } from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import WavesIcon from '@mui/icons-material/Waves';
import { useAuth } from '../contexts/AuthContext';

// Animated wave keyframes
const waveAnimation = keyframes`
  0% {
    transform: translateX(0) translateZ(0) scaleY(1);
  }
  50% {
    transform: translateX(-25%) translateZ(0) scaleY(0.55);
  }
  100% {
    transform: translateX(-50%) translateZ(0) scaleY(1);
  }
`;

const rippleAnimation = keyframes`
  0% {
    transform: scale(0);
    opacity: 1;
  }
  100% {
    transform: scale(4);
    opacity: 0;
  }
`;

const floatAnimation = keyframes`
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
`;

// Styled components
const LoginContainer = styled(Box)({
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingLeft: '5%',
    position: 'relative',
    overflow: 'hidden',
    background: 'linear-gradient(135deg, #0a4d68 0%, #088395 50%, #05bfdb 100%)',
    '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 20% 50%, rgba(16, 185, 129, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)',
        pointerEvents: 'none',
    },
});

const WaveContainer = styled(Box)({
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    height: '200px',
    overflow: 'hidden',
    lineHeight: 0,
    pointerEvents: 'none',
});

const Wave = styled('div')<{ delay?: number }>(({ delay = 0 }) => ({
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '200%',
    height: '100%',
    background: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 1200 120\' preserveAspectRatio=\'none\'%3E%3Cpath d=\'M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z\' opacity=\'.25\' fill=\'%23ffffff\'/%3E%3Cpath d=\'M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z\' opacity=\'.5\' fill=\'%23ffffff\'/%3E%3Cpath d=\'M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z\' fill=\'%23ffffff\'/%3E%3C/svg%3E")',
    backgroundSize: '50% 100%',
    backgroundRepeat: 'repeat-x',
    animation: `${waveAnimation} 15s cubic-bezier(0.36, 0.45, 0.63, 0.53) infinite`,
    animationDelay: `${delay}s`,
    opacity: 0.3,
}));

const GlassCard = styled(Box)(() => ({
    background: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(20px)',
    borderRadius: '24px',
    padding: '56px 48px',
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
    border: '1px solid rgba(255, 255, 255, 0.18)',
    maxWidth: '460px',
    width: '100%',
    position: 'relative',
    zIndex: 10,
    animation: `${floatAnimation} 6s ease-in-out infinite`,
    transition: 'all 0.3s ease',
    '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: '-100%',
        width: '100%',
        height: '100%',
        background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
        transition: 'left 0.5s',
    },
    '&:hover::before': {
        left: '100%',
    },
    '&:hover': {
        transform: 'translateY(-5px)',
        boxShadow: '0 12px 48px 0 rgba(31, 38, 135, 0.5)',
    },
}));

const StyledTextField = styled(TextField)(() => ({
    marginBottom: '24px',
    width: '100%',
    '& .MuiOutlinedInput-root': {
        background: 'rgba(255, 255, 255, 0.9)',
        borderRadius: '12px',
        transition: 'all 0.3s ease',
        willChange: 'box-shadow, background',
        '&:hover': {
            background: 'rgba(255, 255, 255, 1)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        },
        '&.Mui-focused': {
            background: 'rgba(255, 255, 255, 1)',
            boxShadow: '0 0 0 3px rgba(8, 131, 149, 0.2)',
            transform: 'none',
        },
        '& fieldset': {
            borderColor: 'rgba(8, 131, 149, 0.3)',
            borderWidth: '2px',
        },
        '&:hover fieldset': {
            borderColor: 'rgba(8, 131, 149, 0.5)',
        },
        '&.Mui-focused fieldset': {
            borderColor: '#088395',
        },
    },
    '& .MuiInputLabel-root': {
        color: '#0a4d68',
        fontWeight: 500,
        backgroundColor: 'transparent',
        '&.Mui-focused': {
            color: '#088395',
        },
    },
    '& .MuiOutlinedInput-input': {
        color: '#0a4d68',
        fontWeight: 500,
        padding: '16px 14px',
        fontSize: '15px',
        '&::placeholder': {
            color: '#64748B',
            opacity: 0.7,
        },
    },
}));

const OceanButton = styled(Button)({
    background: 'linear-gradient(135deg, #088395 0%, #05bfdb 100%)',
    color: 'white',
    padding: '14px 32px',
    fontSize: '16px',
    fontWeight: 600,
    borderRadius: '12px',
    textTransform: 'none',
    position: 'relative',
    overflow: 'hidden',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(8, 131, 149, 0.4)',
    '&::before': {
        content: '""',
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: '0',
        height: '0',
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.3)',
        transform: 'translate(-50%, -50%)',
        transition: 'width 0.6s, height 0.6s',
    },
    '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 6px 20px rgba(8, 131, 149, 0.6)',
        background: 'linear-gradient(135deg, #05bfdb 0%, #088395 100%)',
    },
    '&:active::before': {
        width: '300px',
        height: '300px',
        animation: `${rippleAnimation} 0.6s ease-out`,
    },
});

const IconWrapper = styled(Box)({
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '24px',
    '& svg': {
        fontSize: '64px',
        color: 'rgba(255, 255, 255, 0.9)',
        filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2))',
    },
});

export const Login: React.FC = () => {
    const navigate = useNavigate();
    const { login, isAuthenticated, loading } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!loading && isAuthenticated) {
            navigate('/dashboard', { replace: true });
        }
    }, [isAuthenticated, loading, navigate]);

    const handleInputFocus = () => {
        setIsTyping(true);
        setError(null); // Clear error on focus
    };

    const handleInputBlur = () => {
        setIsTyping(false);
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Basic validation
        if (!email.trim() || !password.trim()) {
            setError('Please enter both email and password.');
            return;
        }

        // Login user via Supabase
        const { error: loginError } = await login(email, password);

        if (loginError) {
            console.error('Login error:', loginError);
            setError(loginError.message || 'Failed to login. Please check your credentials.');
            return;
        }

        // Navigate to dashboard after successful login
        navigate('/dashboard');
    };

    return (
        <LoginContainer>
            {/* Animated Ocean Waves */}
            <WaveContainer sx={{ opacity: isTyping ? 0.6 : 0.3 }}>
                <Wave delay={0} />
                <Wave delay={-5} />
                <Wave delay={-10} />
            </WaveContainer>

            {/* Floating particles effect */}
            {[...Array(20)].map((_, i) => (
                <Box
                    key={i}
                    sx={{
                        position: 'absolute',
                        width: `${Math.random() * 4 + 2}px`,
                        height: `${Math.random() * 4 + 2}px`,
                        background: 'rgba(255, 255, 255, 0.5)',
                        borderRadius: '50%',
                        top: `${Math.random() * 100}%`,
                        left: `${Math.random() * 100}%`,
                        animation: `${floatAnimation} ${Math.random() * 3 + 4}s ease-in-out infinite`,
                        animationDelay: `${Math.random() * 2}s`,
                    }}
                />
            ))}

            <Container maxWidth="sm">
                <GlassCard>
                    <IconWrapper>
                        <WavesIcon />
                    </IconWrapper>

                    <Typography
                        variant="h4"
                        align="center"
                        sx={{
                            color: 'white',
                            fontWeight: 700,
                            marginBottom: '12px',
                            textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                        }}
                    >
                        Coastal Safety Portal
                    </Typography>

                    <Typography
                        variant="body1"
                        align="center"
                        sx={{
                            color: 'rgba(255, 255, 255, 0.9)',
                            marginBottom: '40px',
                            fontSize: '14px',
                        }}
                    >
                        Protecting our shores, securing our future
                    </Typography>

                    <form onSubmit={handleLogin} style={{ width: '100%' }}>
                        <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
                            <Collapse in={!!error}>
                                {error && (
                                    <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>
                                        {error}
                                    </Alert>
                                )}
                            </Collapse>
                            <StyledTextField
                                fullWidth
                                placeholder="Email"
                                variant="outlined"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onFocus={handleInputFocus}
                                onBlur={handleInputBlur}
                                required
                                autoComplete="email"
                            />

                            <StyledTextField
                                fullWidth
                                placeholder="Password"
                                variant="outlined"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onFocus={handleInputFocus}
                                onBlur={handleInputBlur}
                                required
                                autoComplete="current-password"
                            />

                            <OceanButton
                                fullWidth
                                type="submit"
                                variant="contained"
                                size="large"
                                sx={{ marginBottom: '24px' }}
                            >
                                Login
                            </OceanButton>

                            <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="body2" sx={{ color: 'white' }}>
                                    Need an account? Ask your administrator to create one in Supabase.
                                </Typography>
                            </Box>
                        </Box>
                    </form>

                </GlassCard>

                <Typography
                    variant="body2"
                    align="center"
                    sx={{
                        color: 'rgba(255, 255, 255, 0.7)',
                        marginTop: '24px',
                        fontSize: '12px',
                    }}
                >
                    © 2026 Coastal Safety System • Disaster Response & Prevention
                </Typography>
            </Container>
        </LoginContainer>
    );
};
