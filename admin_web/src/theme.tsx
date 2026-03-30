import { createTheme, alpha, type PaletteMode } from '@mui/material/styles';

// Premium Ocean-themed palette matching Login page
const PRIMARY_MAIN = '#088395'; // Ocean Teal
const PRIMARY_DARK = '#0a4d68'; // Deep Ocean
const PRIMARY_LIGHT = '#05bfdb'; // Aqua

const SECONDARY_MAIN = '#6366f1'; // Indigo 500

const SUCCESS_MAIN = '#10b981'; // Emerald 500
const WARNING_MAIN = '#f59e0b'; // Amber 500
const ERROR_MAIN = '#ef4444'; // Red 500
const INFO_MAIN = '#3b82f6'; // Blue 500

const TEXT_PRIMARY_LIGHT = '#1e293b'; // Slate 800
const TEXT_SECONDARY_LIGHT = '#64748b'; // Slate 500

const TEXT_PRIMARY_DARK = '#e2f1f8'; // Ice White
const TEXT_SECONDARY_DARK = '#8892b0'; // Muted Ice

const BG_DEFAULT_LIGHT = '#f1f5f9'; // Slate 100
const BG_PAPER_LIGHT = '#ffffff';

const BG_DEFAULT_DARK = '#040b16'; // Midnight Trench
const BG_PAPER_DARK = '#0a192f'; // Deep Navy

const DIVIDER_LIGHT = '#e2e8f0'; // Slate 200
const DIVIDER_DARK = 'rgba(0, 255, 209, 0.1)'; // Glowing Cyan Subtlety

export const getTheme = (mode: PaletteMode) => {
    const isDark = mode === 'dark';
    const TEXT_PRIMARY = isDark ? TEXT_PRIMARY_DARK : TEXT_PRIMARY_LIGHT;
    const TEXT_SECONDARY = isDark ? TEXT_SECONDARY_DARK : TEXT_SECONDARY_LIGHT;
    const DIVIDER = isDark ? DIVIDER_DARK : DIVIDER_LIGHT;

    return createTheme({
        palette: {
            mode,
        primary: {
            main: isDark ? '#00ffd1' : PRIMARY_MAIN, // Glowing Cyan in dark mode
            light: isDark ? alpha('#00ffd1', 0.2) : PRIMARY_LIGHT,
            dark: isDark ? '#00ccA7' : PRIMARY_DARK,
            contrastText: isDark ? '#040b16' : '#ffffff',
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
                default: isDark ? BG_DEFAULT_DARK : BG_DEFAULT_LIGHT,
                paper: isDark ? BG_PAPER_DARK : BG_PAPER_LIGHT,
            },
            text: {
                primary: TEXT_PRIMARY,
                secondary: TEXT_SECONDARY,
            },
            divider: DIVIDER,
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
                    backgroundColor: isDark ? BG_DEFAULT_DARK : BG_DEFAULT_LIGHT,
                    scrollbarWidth: 'thin',
                    '&::-webkit-scrollbar': {
                        width: '8px',
                        height: '8px',
                    },
                    '&::-webkit-scrollbar-thumb': {
                        backgroundColor: isDark ? 'rgba(0, 255, 209, 0.2)' : '#cbd5e1',
                        borderRadius: '4px',
                    },
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: '16px',
                    boxShadow: isDark 
                        ? '0 10px 30px -10px rgba(0, 255, 209, 0.05)'
                        : '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
                    border: `1px solid ${isDark ? DIVIDER_DARK : DIVIDER_LIGHT}`,
                    backgroundImage: 'none',
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                elevation1: {
                    boxShadow: isDark 
                        ? '0 4px 12px rgba(0, 255, 209, 0.03)'
                        : '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
                },
                elevation2: {
                    boxShadow: isDark
                        ? '0 8px 24px rgba(0, 255, 209, 0.05)'
                        : '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                },
                elevation3: {
                    boxShadow: isDark
                        ? '0 12px 32px rgba(0, 255, 209, 0.08)'
                        : '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
                },
            },
        },
        MuiTooltip: {
            styleOverrides: {
                tooltip: {
                    backgroundColor: isDark ? '#1e293b' : '#ffffff',
                    color: isDark ? '#f8fafc' : '#1e293b',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    borderRadius: '10px',
                    padding: '8px 12px',
                    boxShadow: isDark 
                      ? '0 4px 12px rgba(0,0,0,0.5)' 
                      : '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
                    lineHeight: 1.5,
                    border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
                },
                arrow: {
                    color: isDark ? '#1e293b' : '#ffffff',
                    '&::before': {
                        border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
                    }
                }
            }
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: '10px',
                    padding: '8px 16px',
                    boxShadow: isDark ? '0 0 10px rgba(0, 255, 209, 0.1)' : 'none',
                    '&:hover': {
                        boxShadow: isDark ? '0 0 15px rgba(0, 255, 209, 0.3)' : '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                        transform: 'translateY(-1px)',
                    },
                    transition: 'all 0.2s ease-in-out',
                },
                containedPrimary: {
                    background: isDark 
                        ? `linear-gradient(135deg, #00ffd1 0%, #00ccA7 100%)`
                        : `linear-gradient(135deg, ${PRIMARY_MAIN} 0%, ${PRIMARY_DARK} 100%)`,
                    color: isDark ? '#040b16' : '#ffffff',
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
                    borderBottom: `1px solid ${DIVIDER}`,
                    padding: '16px',
                },
                head: {
                    fontWeight: 600,
                    color: TEXT_SECONDARY,
                    backgroundColor: isDark ? alpha(BG_PAPER_DARK, 0.8) : '#f8fafc',
                    borderBottom: `1px solid ${DIVIDER}`,
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
                    backgroundColor: isDark ? alpha(BG_PAPER_DARK, 0.5) : '#ffffff',
                    '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: DIVIDER,
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: isDark ? TEXT_SECONDARY : '#94a3b8',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: isDark ? '#00ffd1' : PRIMARY_MAIN,
                        borderWidth: 1,
                        boxShadow: isDark 
                            ? `0 0 10px ${alpha('#00ffd1', 0.15)}`
                            : `0 0 0 3px ${alpha(PRIMARY_MAIN, 0.1)}`,
                    },
                },
            },
        },
    },
});
};
