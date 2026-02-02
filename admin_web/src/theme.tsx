import { createTheme, alpha } from '@mui/material/styles';

// Premium Ocean-themed palette matching Login page
const PRIMARY_MAIN = '#088395'; // Ocean Teal
const PRIMARY_DARK = '#0a4d68'; // Deep Ocean
const PRIMARY_LIGHT = '#05bfdb'; // Aqua

const SECONDARY_MAIN = '#6366f1'; // Indigo 500

const SUCCESS_MAIN = '#10b981'; // Emerald 500
const WARNING_MAIN = '#f59e0b'; // Amber 500
const ERROR_MAIN = '#ef4444'; // Red 500
const INFO_MAIN = '#3b82f6'; // Blue 500

const TEXT_PRIMARY = '#1e293b'; // Slate 800
const TEXT_SECONDARY = '#64748b'; // Slate 500

export const theme = createTheme({
    palette: {
        primary: {
            main: PRIMARY_MAIN,
            light: PRIMARY_LIGHT,
            dark: PRIMARY_DARK,
            contrastText: '#ffffff',
        },
        secondary: {
            main: SECONDARY_MAIN,
        },
        success: {
            main: SUCCESS_MAIN,
            light: alpha(SUCCESS_MAIN, 0.1),
        },
        warning: {
            main: WARNING_MAIN,
            light: alpha(WARNING_MAIN, 0.1),
        },
        error: {
            main: ERROR_MAIN,
            light: alpha(ERROR_MAIN, 0.1),
        },
        info: {
            main: INFO_MAIN,
            light: alpha(INFO_MAIN, 0.1),
        },
        background: {
            default: '#f1f5f9', // Slate 100
            paper: '#ffffff',
        },
        text: {
            primary: TEXT_PRIMARY,
            secondary: TEXT_SECONDARY,
        },
        divider: '#e2e8f0',
    },
    typography: {
        fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
        h1: { fontWeight: 700 },
        h2: { fontWeight: 700 },
        h3: { fontWeight: 700 },
        h4: {
            fontSize: '1.5rem',
            fontWeight: 700,
            color: TEXT_PRIMARY,
            letterSpacing: '-0.025em',
        },
        h5: { fontWeight: 600, letterSpacing: '-0.025em' },
        h6: {
            fontSize: '1rem',
            fontWeight: 600,
            letterSpacing: '-0.025em',
        },
        body1: {
            fontSize: '0.875rem',
            lineHeight: 1.6,
            color: TEXT_PRIMARY,
        },
        body2: {
            fontSize: '0.8125rem',
            lineHeight: 1.5,
            color: TEXT_SECONDARY,
        },
        button: {
            textTransform: 'none',
            fontWeight: 600,
        },
    },
    shape: {
        borderRadius: 12, // More rounded
    },
    components: {
        MuiCssBaseline: {
            styleOverrides: {
                body: {
                    backgroundColor: '#f1f5f9',
                    scrollbarWidth: 'thin',
                    '&::-webkit-scrollbar': {
                        width: '8px',
                        height: '8px',
                    },
                    '&::-webkit-scrollbar-thumb': {
                        backgroundColor: '#cbd5e1',
                        borderRadius: '4px',
                    },
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: '16px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
                    border: '1px solid #f1f5f9',
                    backgroundImage: 'none',
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                elevation1: {
                    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
                },
                elevation2: {
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                },
                elevation3: {
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: '10px',
                    padding: '8px 16px',
                    boxShadow: 'none',
                    '&:hover': {
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                        transform: 'translateY(-1px)',
                    },
                    transition: 'all 0.2s ease-in-out',
                },
                containedPrimary: {
                    background: `linear-gradient(135deg, ${PRIMARY_MAIN} 0%, ${PRIMARY_DARK} 100%)`,
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    borderRadius: '8px',
                    fontWeight: 500,
                },
                sizeSmall: {
                    fontSize: '0.75rem',
                    height: '24px',
                },
            },
        },
        MuiTableCell: {
            styleOverrides: {
                root: {
                    borderBottom: '1px solid #f1f5f9',
                    padding: '16px',
                },
                head: {
                    fontWeight: 600,
                    color: TEXT_SECONDARY,
                    backgroundColor: '#f8fafc',
                    borderBottom: '1px solid #e2e8f0',
                    textTransform: 'uppercase',
                    fontSize: '0.75rem',
                    letterSpacing: '0.05em',
                },
            },
        },
        MuiOutlinedInput: {
            styleOverrides: {
                root: {
                    borderRadius: '10px',
                    backgroundColor: '#ffffff',
                    '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#e2e8f0',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#94a3b8',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: PRIMARY_MAIN,
                        borderWidth: 1,
                        boxShadow: `0 0 0 3px ${alpha(PRIMARY_MAIN, 0.1)}`,
                    },
                },
            },
        },
    },
});
