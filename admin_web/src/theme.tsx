import { createTheme } from '@mui/material/styles';

// Clean, professional theme matching the reference design
export const theme = createTheme({
    palette: {
        primary: {
            main: '#0F172A', // Deep navy blue for active states
            light: '#1E293B',
            dark: '#020617',
        },
        secondary: {
            main: '#10B981', // Green for active status
        },
        error: {
            main: '#EF4444', // Red for inactive status
        },
        background: {
            default: '#F8FAFC', // Very light gray
            paper: '#FFFFFF',
        },
        text: {
            primary: '#1E293B',
            secondary: '#64748B',
        },
        divider: '#E2E8F0',
    },
    typography: {
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        h4: {
            fontSize: '1.5rem',
            fontWeight: 700,
            color: '#0F172A',
        },
        h6: {
            fontSize: '0.875rem',
            fontWeight: 600,
        },
        body1: {
            fontSize: '0.875rem',
            color: '#475569',
        },
        body2: {
            fontSize: '0.8125rem',
            color: '#64748B',
        },
        caption: {
            fontSize: '0.75rem',
            color: '#94A3B8',
        },
    },
    shape: {
        borderRadius: 8,
    },
    components: {
        MuiCssBaseline: {
            styleOverrides: {
                body: {
                    backgroundColor: '#F8FAFC',
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: '8px',
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    boxShadow: 'none',
                    '&:hover': {
                        boxShadow: 'none',
                    },
                },
                containedPrimary: {
                    backgroundColor: '#0F172A',
                    '&:hover': {
                        backgroundColor: '#1E293B',
                    },
                },
            },
        },
        MuiTableCell: {
            styleOverrides: {
                root: {
                    borderBottom: '1px solid #F1F5F9',
                    padding: '16px 20px',
                    fontSize: '0.875rem',
                },
                head: {
                    fontWeight: 600,
                    color: '#475569',
                    backgroundColor: '#FAFBFC',
                    borderBottom: '1px solid #E2E8F0',
                },
            },
        },
        MuiOutlinedInput: {
            styleOverrides: {
                root: {
                    borderRadius: '8px',
                    backgroundColor: '#FFFFFF',
                    '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#E2E8F0',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#CBD5E1',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#0F172A',
                        borderWidth: 1,
                    },
                },
            },
        },
    },
});
