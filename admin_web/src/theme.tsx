import { createTheme, alpha, type PaletteMode } from '@mui/material/styles';

// ============================================================================
// DESIGN TOKENS
// A premium enterprise design system inspired by Linear, Vercel, and Stripe
// ============================================================================

// ----------------------------------------------------------------------------
// NEUTRAL SCALE - Custom refined grays with subtle cool undertones
// ----------------------------------------------------------------------------
const NEUTRAL = {
  50: '#FAFBFC',
  100: '#F4F6F8',
  150: '#EBEEF2',
  200: '#E1E5EB',
  300: '#C9D0D8',
  400: '#A1ABB8',
  500: '#7A8595',
  600: '#5C6675',
  700: '#434C59',
  800: '#2D3440',
  850: '#232931',
  900: '#181D24',
  950: '#0F1318',
};

// ----------------------------------------------------------------------------
// PRIMARY - Deep indigo-violet for sophistication and trust
// ----------------------------------------------------------------------------
const PRIMARY = {
  50: '#F5F3FF',
  100: '#EDE9FE',
  200: '#DDD6FE',
  300: '#C4B5FD',
  400: '#A78BFA',
  500: '#8B5CF6',  // Main
  600: '#7C3AED',  // Dark
  700: '#6D28D9',
  800: '#5B21B6',
  900: '#4C1D95',
};

// ----------------------------------------------------------------------------
// ACCENT - Electric blue for CTAs and interactive elements
// ----------------------------------------------------------------------------
const ACCENT = {
  50: '#EFF6FF',
  100: '#DBEAFE',
  200: '#BFDBFE',
  300: '#93C5FD',
  400: '#60A5FA',
  500: '#3B82F6',  // Main
  600: '#2563EB',  // Dark
  700: '#1D4ED8',
  800: '#1E40AF',
  900: '#1E3A8A',
};

// ----------------------------------------------------------------------------
// SEMANTIC COLORS - Refined for clarity and accessibility
// ----------------------------------------------------------------------------
const SEMANTIC = {
  success: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    200: '#A7F3D0',
    300: '#6EE7B7',
    400: '#34D399',
    500: '#10B981',  // Main
    600: '#059669',
    700: '#047857',
  },
  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B',  // Main
    600: '#D97706',
    700: '#B45309',
  },
  error: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444',  // Main
    600: '#DC2626',
    700: '#B91C1C',
  },
  info: {
    50: '#F0F9FF',
    100: '#E0F2FE',
    200: '#BAE6FD',
    300: '#7DD3FC',
    400: '#38BDF8',
    500: '#0EA5E9',  // Main
    600: '#0284C7',
    700: '#0369A1',
  },
};

// ----------------------------------------------------------------------------
// TYPOGRAPHY - Inter for UI, refined scale with optical sizing
// ----------------------------------------------------------------------------
const FONT_FAMILY = '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
const FONT_MONO = '"JetBrains Mono", "SF Mono", "Fira Code", monospace';

// ----------------------------------------------------------------------------
// SPACING SCALE - 4px base, consistent rhythm
// ----------------------------------------------------------------------------
const SPACING_UNIT = 4;

// ----------------------------------------------------------------------------
// ELEVATION - Layered shadow system for depth
// ----------------------------------------------------------------------------
const createShadow = (isDark: boolean, level: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl') => {
  const color = isDark ? 'rgba(0, 0, 0, 0.4)' : 'rgba(15, 23, 42, 0.08)';
  const colorHeavy = isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(15, 23, 42, 0.12)';

  const shadows = {
    xs: `0 1px 2px ${color}`,
    sm: `0 1px 3px ${color}, 0 1px 2px -1px ${color}`,
    md: `0 4px 6px -1px ${color}, 0 2px 4px -2px ${color}`,
    lg: `0 10px 15px -3px ${colorHeavy}, 0 4px 6px -4px ${color}`,
    xl: `0 20px 25px -5px ${colorHeavy}, 0 8px 10px -6px ${color}`,
    '2xl': `0 25px 50px -12px ${colorHeavy}`,
  };

  return shadows[level];
};

// ----------------------------------------------------------------------------
// BORDER RADIUS - Consistent roundness scale
// ----------------------------------------------------------------------------
const RADII = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  full: 9999,
};

// ----------------------------------------------------------------------------
// TRANSITIONS - Smooth, professional motion
// ----------------------------------------------------------------------------
const TRANSITIONS = {
  fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  normal: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
  bounce: '400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
};

// ============================================================================
// THEME GENERATOR
// ============================================================================
export const getTheme = (mode: PaletteMode) => {
  const isDark = mode === 'dark';

  // Background hierarchy
  const BG = {
    base: isDark ? NEUTRAL[950] : NEUTRAL[50],
    subtle: isDark ? NEUTRAL[900] : NEUTRAL[100],
    surface: isDark ? NEUTRAL[850] : '#FFFFFF',
    elevated: isDark ? NEUTRAL[800] : '#FFFFFF',
    overlay: isDark ? alpha(NEUTRAL[900], 0.8) : alpha(NEUTRAL[950], 0.6),
  };

  // Text hierarchy
  const TEXT = {
    primary: isDark ? NEUTRAL[50] : NEUTRAL[900],
    secondary: isDark ? NEUTRAL[400] : NEUTRAL[500],
    tertiary: isDark ? NEUTRAL[500] : NEUTRAL[400],
    disabled: isDark ? NEUTRAL[600] : NEUTRAL[300],
    inverse: isDark ? NEUTRAL[900] : NEUTRAL[50],
  };

  // Border colors
  const BORDER = {
    subtle: isDark ? alpha(NEUTRAL[700], 0.5) : NEUTRAL[200],
    default: isDark ? NEUTRAL[700] : NEUTRAL[200],
    strong: isDark ? NEUTRAL[600] : NEUTRAL[300],
    focus: isDark ? PRIMARY[400] : PRIMARY[500],
  };

  return createTheme({
    palette: {
      mode,
      primary: {
        main: PRIMARY[500],
        light: PRIMARY[400],
        dark: PRIMARY[600],
        contrastText: '#FFFFFF',
      },
      secondary: {
        main: ACCENT[500],
        light: ACCENT[400],
        dark: ACCENT[600],
        contrastText: '#FFFFFF',
      },
      success: {
        main: SEMANTIC.success[500],
        light: SEMANTIC.success[400],
        dark: SEMANTIC.success[600],
        contrastText: '#FFFFFF',
      },
      warning: {
        main: SEMANTIC.warning[500],
        light: SEMANTIC.warning[400],
        dark: SEMANTIC.warning[600],
        contrastText: '#FFFFFF',
      },
      error: {
        main: SEMANTIC.error[500],
        light: SEMANTIC.error[400],
        dark: SEMANTIC.error[600],
        contrastText: '#FFFFFF',
      },
      info: {
        main: SEMANTIC.info[500],
        light: SEMANTIC.info[400],
        dark: SEMANTIC.info[600],
        contrastText: '#FFFFFF',
      },
      background: {
        default: BG.base,
        paper: BG.surface,
      },
      text: {
        primary: TEXT.primary,
        secondary: TEXT.secondary,
        disabled: TEXT.disabled,
      },
      divider: BORDER.subtle,
      action: {
        active: isDark ? NEUTRAL[300] : NEUTRAL[600],
        hover: isDark ? alpha(NEUTRAL[300], 0.08) : alpha(NEUTRAL[900], 0.04),
        selected: isDark ? alpha(PRIMARY[500], 0.16) : alpha(PRIMARY[500], 0.08),
        disabled: isDark ? NEUTRAL[700] : NEUTRAL[300],
        disabledBackground: isDark ? NEUTRAL[800] : NEUTRAL[100],
        focus: isDark ? alpha(PRIMARY[500], 0.24) : alpha(PRIMARY[500], 0.12),
      },
      grey: NEUTRAL,
    },

    typography: {
      fontFamily: FONT_FAMILY,

      // Display - Hero sections
      h1: {
        fontSize: '3rem',
        fontWeight: 700,
        lineHeight: 1.1,
        letterSpacing: '-0.03em',
      },
      // Page titles
      h2: {
        fontSize: '2.25rem',
        fontWeight: 700,
        lineHeight: 1.2,
        letterSpacing: '-0.025em',
      },
      // Section headers
      h3: {
        fontSize: '1.5rem',
        fontWeight: 600,
        lineHeight: 1.3,
        letterSpacing: '-0.02em',
      },
      // Card titles
      h4: {
        fontSize: '1.25rem',
        fontWeight: 600,
        lineHeight: 1.35,
        letterSpacing: '-0.015em',
      },
      // Subsection headers
      h5: {
        fontSize: '1rem',
        fontWeight: 600,
        lineHeight: 1.4,
        letterSpacing: '-0.01em',
      },
      // Labels, small headers
      h6: {
        fontSize: '0.875rem',
        fontWeight: 600,
        lineHeight: 1.45,
        letterSpacing: '0',
      },
      // Body text
      body1: {
        fontSize: '0.9375rem',
        lineHeight: 1.6,
        letterSpacing: '-0.01em',
      },
      // Secondary body
      body2: {
        fontSize: '0.875rem',
        lineHeight: 1.55,
        letterSpacing: '0',
        color: TEXT.secondary,
      },
      // Small text
      caption: {
        fontSize: '0.75rem',
        lineHeight: 1.5,
        letterSpacing: '0.01em',
        color: TEXT.secondary,
      },
      // Tiny labels
      overline: {
        fontSize: '0.6875rem',
        fontWeight: 600,
        lineHeight: 1.5,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: TEXT.tertiary,
      },
      // Buttons
      button: {
        fontSize: '0.875rem',
        fontWeight: 500,
        lineHeight: 1.5,
        letterSpacing: '0',
        textTransform: 'none',
      },
      // Code
      subtitle1: {
        fontFamily: FONT_MONO,
        fontSize: '0.875rem',
        fontWeight: 500,
      },
      subtitle2: {
        fontFamily: FONT_MONO,
        fontSize: '0.8125rem',
        fontWeight: 400,
      },
    },

    spacing: SPACING_UNIT,

    shape: {
      borderRadius: RADII.md,
    },

    shadows: [
      'none',
      createShadow(isDark, 'xs'),
      createShadow(isDark, 'sm'),
      createShadow(isDark, 'sm'),
      createShadow(isDark, 'md'),
      createShadow(isDark, 'md'),
      createShadow(isDark, 'md'),
      createShadow(isDark, 'lg'),
      createShadow(isDark, 'lg'),
      createShadow(isDark, 'lg'),
      createShadow(isDark, 'xl'),
      createShadow(isDark, 'xl'),
      createShadow(isDark, 'xl'),
      createShadow(isDark, '2xl'),
      createShadow(isDark, '2xl'),
      createShadow(isDark, '2xl'),
      createShadow(isDark, '2xl'),
      createShadow(isDark, '2xl'),
      createShadow(isDark, '2xl'),
      createShadow(isDark, '2xl'),
      createShadow(isDark, '2xl'),
      createShadow(isDark, '2xl'),
      createShadow(isDark, '2xl'),
      createShadow(isDark, '2xl'),
      createShadow(isDark, '2xl'),
    ] as any,

    components: {
      MuiCssBaseline: {
        styleOverrides: {
          ':root': {
            // Expose design tokens as CSS variables
            '--font-mono': FONT_MONO,
            '--transition-fast': TRANSITIONS.fast,
            '--transition-normal': TRANSITIONS.normal,
            '--transition-slow': TRANSITIONS.slow,
            '--radius-sm': `${RADII.sm}px`,
            '--radius-md': `${RADII.md}px`,
            '--radius-lg': `${RADII.lg}px`,
            '--radius-xl': `${RADII.xl}px`,
          },
          html: {
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
            textRendering: 'optimizeLegibility',
          },
          body: {
            backgroundColor: BG.base,
            scrollbarWidth: 'thin',
            scrollbarColor: `${isDark ? NEUTRAL[700] : NEUTRAL[300]} transparent`,
            '&::-webkit-scrollbar': {
              width: '8px',
              height: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: isDark ? NEUTRAL[700] : NEUTRAL[300],
              borderRadius: '4px',
              border: '2px solid transparent',
              backgroundClip: 'content-box',
              '&:hover': {
                backgroundColor: isDark ? NEUTRAL[600] : NEUTRAL[400],
              },
            },
          },
          '::selection': {
            backgroundColor: alpha(PRIMARY[500], 0.2),
            color: TEXT.primary,
          },
        },
      },

      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
        styleOverrides: {
          root: {
            borderRadius: RADII.lg,
            padding: '10px 18px',
            fontWeight: 500,
            transition: TRANSITIONS.fast,
            '&:focus-visible': {
              outline: `2px solid ${PRIMARY[500]}`,
              outlineOffset: '2px',
            },
          },
          sizeSmall: {
            padding: '6px 12px',
            fontSize: '0.8125rem',
            borderRadius: RADII.md,
          },
          sizeLarge: {
            padding: '12px 24px',
            fontSize: '0.9375rem',
            borderRadius: RADII.xl,
          },
          contained: {
            '&:hover': {
              transform: 'translateY(-1px)',
              boxShadow: createShadow(isDark, 'md'),
            },
            '&:active': {
              transform: 'translateY(0)',
            },
          },
          containedPrimary: {
            background: `linear-gradient(135deg, ${PRIMARY[500]} 0%, ${PRIMARY[600]} 100%)`,
            '&:hover': {
              background: `linear-gradient(135deg, ${PRIMARY[400]} 0%, ${PRIMARY[500]} 100%)`,
            },
          },
          containedSecondary: {
            background: `linear-gradient(135deg, ${ACCENT[500]} 0%, ${ACCENT[600]} 100%)`,
            '&:hover': {
              background: `linear-gradient(135deg, ${ACCENT[400]} 0%, ${ACCENT[500]} 100%)`,
            },
          },
          containedSuccess: {
            background: `linear-gradient(135deg, ${SEMANTIC.success[500]} 0%, ${SEMANTIC.success[600]} 100%)`,
            '&:hover': {
              background: `linear-gradient(135deg, ${SEMANTIC.success[400]} 0%, ${SEMANTIC.success[500]} 100%)`,
            },
          },
          outlined: {
            borderColor: BORDER.default,
            '&:hover': {
              borderColor: BORDER.strong,
              backgroundColor: isDark ? alpha(NEUTRAL[700], 0.3) : alpha(NEUTRAL[100], 0.8),
            },
          },
          text: {
            '&:hover': {
              backgroundColor: isDark ? alpha(NEUTRAL[700], 0.4) : alpha(NEUTRAL[100], 1),
            },
          },
        },
      },

      MuiPaper: {
        defaultProps: {
          elevation: 0,
        },
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: BG.surface,
            border: `1px solid ${BORDER.subtle}`,
            borderRadius: RADII.xl,
          },
          elevation0: {
            boxShadow: 'none',
          },
          elevation1: {
            boxShadow: createShadow(isDark, 'sm'),
          },
          elevation2: {
            boxShadow: createShadow(isDark, 'md'),
          },
          elevation3: {
            boxShadow: createShadow(isDark, 'lg'),
          },
        },
      },

      MuiCard: {
        defaultProps: {
          elevation: 0,
        },
        styleOverrides: {
          root: {
            borderRadius: RADII.xl,
            border: `1px solid ${BORDER.subtle}`,
            transition: TRANSITIONS.normal,
            '&:hover': {
              borderColor: BORDER.default,
              boxShadow: createShadow(isDark, 'md'),
            },
          },
        },
      },

      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: RADII.md,
            fontWeight: 500,
            fontSize: '0.8125rem',
            height: 28,
            transition: TRANSITIONS.fast,
          },
          sizeSmall: {
            height: 24,
            fontSize: '0.75rem',
            borderRadius: RADII.sm,
          },
          filled: {
            '&.MuiChip-colorDefault': {
              backgroundColor: isDark ? NEUTRAL[800] : NEUTRAL[100],
              color: TEXT.primary,
            },
          },
          outlined: {
            borderColor: BORDER.default,
          },
        },
      },

      MuiTextField: {
        defaultProps: {
          size: 'small',
        },
      },

      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: RADII.lg,
            backgroundColor: isDark ? alpha(NEUTRAL[800], 0.4) : '#FFFFFF',
            transition: TRANSITIONS.fast,
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: BORDER.default,
              transition: TRANSITIONS.fast,
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: BORDER.strong,
            },
            '&.Mui-focused': {
              backgroundColor: isDark ? alpha(NEUTRAL[800], 0.6) : '#FFFFFF',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: PRIMARY[500],
                borderWidth: 1,
                boxShadow: `0 0 0 3px ${alpha(PRIMARY[500], isDark ? 0.2 : 0.1)}`,
              },
            },
            '&.Mui-error .MuiOutlinedInput-notchedOutline': {
              borderColor: SEMANTIC.error[500],
            },
          },
          input: {
            padding: '12px 14px',
            fontSize: '0.9375rem',
            '&::placeholder': {
              color: TEXT.tertiary,
              opacity: 1,
            },
          },
          inputSizeSmall: {
            padding: '10px 12px',
            fontSize: '0.875rem',
          },
        },
      },

      MuiFilledInput: {
        styleOverrides: {
          root: {
            borderRadius: RADII.lg,
            backgroundColor: isDark ? NEUTRAL[800] : NEUTRAL[100],
            transition: TRANSITIONS.fast,
            '&::before, &::after': {
              display: 'none',
            },
            '&:hover': {
              backgroundColor: isDark ? NEUTRAL[700] : NEUTRAL[150],
            },
            '&.Mui-focused': {
              backgroundColor: isDark ? NEUTRAL[800] : NEUTRAL[100],
              boxShadow: `inset 0 0 0 1px ${PRIMARY[500]}`,
            },
          },
        },
      },

      MuiInputLabel: {
        styleOverrides: {
          root: {
            fontWeight: 500,
            color: TEXT.secondary,
            '&.Mui-focused': {
              color: PRIMARY[500],
            },
          },
        },
      },

      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottom: `1px solid ${BORDER.subtle}`,
            padding: '14px 16px',
            fontSize: '0.875rem',
          },
          head: {
            fontWeight: 600,
            fontSize: '0.75rem',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: TEXT.secondary,
            backgroundColor: isDark ? NEUTRAL[900] : NEUTRAL[50],
            borderBottom: `1px solid ${BORDER.default}`,
          },
        },
      },

      MuiTableRow: {
        styleOverrides: {
          root: {
            transition: TRANSITIONS.fast,
            '&:hover': {
              backgroundColor: isDark ? alpha(NEUTRAL[800], 0.5) : alpha(NEUTRAL[100], 0.6),
            },
          },
        },
      },

      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: isDark ? NEUTRAL[800] : NEUTRAL[900],
            color: isDark ? TEXT.primary : NEUTRAL[50],
            fontSize: '0.8125rem',
            fontWeight: 500,
            padding: '8px 12px',
            borderRadius: RADII.md,
            boxShadow: createShadow(isDark, 'lg'),
          },
          arrow: {
            color: isDark ? NEUTRAL[800] : NEUTRAL[900],
          },
        },
      },

      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: RADII.lg,
            alignItems: 'center',
          },
          standardSuccess: {
            backgroundColor: alpha(SEMANTIC.success[500], isDark ? 0.15 : 0.1),
            color: isDark ? SEMANTIC.success[400] : SEMANTIC.success[700],
            '& .MuiAlert-icon': {
              color: SEMANTIC.success[500],
            },
          },
          standardError: {
            backgroundColor: alpha(SEMANTIC.error[500], isDark ? 0.15 : 0.1),
            color: isDark ? SEMANTIC.error[400] : SEMANTIC.error[700],
            '& .MuiAlert-icon': {
              color: SEMANTIC.error[500],
            },
          },
          standardWarning: {
            backgroundColor: alpha(SEMANTIC.warning[500], isDark ? 0.15 : 0.1),
            color: isDark ? SEMANTIC.warning[400] : SEMANTIC.warning[700],
            '& .MuiAlert-icon': {
              color: SEMANTIC.warning[500],
            },
          },
          standardInfo: {
            backgroundColor: alpha(SEMANTIC.info[500], isDark ? 0.15 : 0.1),
            color: isDark ? SEMANTIC.info[400] : SEMANTIC.info[700],
            '& .MuiAlert-icon': {
              color: SEMANTIC.info[500],
            },
          },
        },
      },

      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: RADII['2xl'],
            boxShadow: createShadow(isDark, '2xl'),
          },
        },
      },

      MuiDialogTitle: {
        styleOverrides: {
          root: {
            fontSize: '1.125rem',
            fontWeight: 600,
            padding: '20px 24px 12px',
          },
        },
      },

      MuiDialogContent: {
        styleOverrides: {
          root: {
            padding: '16px 24px',
          },
        },
      },

      MuiDialogActions: {
        styleOverrides: {
          root: {
            padding: '16px 24px 20px',
            gap: 12,
          },
        },
      },

      MuiTab: {
        styleOverrides: {
          root: {
            fontWeight: 500,
            fontSize: '0.875rem',
            textTransform: 'none',
            minHeight: 44,
            padding: '12px 16px',
            borderRadius: RADII.md,
            transition: TRANSITIONS.fast,
            '&:hover': {
              backgroundColor: isDark ? alpha(NEUTRAL[700], 0.4) : alpha(NEUTRAL[100], 1),
            },
            '&.Mui-selected': {
              fontWeight: 600,
            },
          },
        },
      },

      MuiTabs: {
        styleOverrides: {
          indicator: {
            height: 2,
            borderRadius: 1,
            backgroundColor: PRIMARY[500],
          },
        },
      },

      MuiIconButton: {
        styleOverrides: {
          root: {
            borderRadius: RADII.md,
            transition: TRANSITIONS.fast,
            '&:hover': {
              backgroundColor: isDark ? alpha(NEUTRAL[700], 0.5) : alpha(NEUTRAL[100], 1),
            },
            '&:focus-visible': {
              outline: `2px solid ${PRIMARY[500]}`,
              outlineOffset: '2px',
            },
          },
          sizeSmall: {
            borderRadius: RADII.sm,
          },
        },
      },

      MuiSwitch: {
        styleOverrides: {
          root: {
            width: 44,
            height: 24,
            padding: 0,
          },
          switchBase: {
            padding: 2,
            '&.Mui-checked': {
              transform: 'translateX(20px)',
              '& + .MuiSwitch-track': {
                backgroundColor: PRIMARY[500],
                opacity: 1,
              },
            },
          },
          thumb: {
            width: 20,
            height: 20,
            backgroundColor: '#FFFFFF',
            boxShadow: createShadow(isDark, 'sm'),
          },
          track: {
            borderRadius: 12,
            backgroundColor: isDark ? NEUTRAL[700] : NEUTRAL[300],
            opacity: 1,
          },
        },
      },

      MuiSkeleton: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? NEUTRAL[800] : NEUTRAL[200],
          },
        },
      },

      MuiDivider: {
        styleOverrides: {
          root: {
            borderColor: BORDER.subtle,
          },
        },
      },

      MuiLinearProgress: {
        styleOverrides: {
          root: {
            height: 4,
            borderRadius: 2,
            backgroundColor: isDark ? NEUTRAL[800] : NEUTRAL[200],
          },
          bar: {
            borderRadius: 2,
          },
        },
      },

      MuiCircularProgress: {
        styleOverrides: {
          circle: {
            strokeLinecap: 'round',
          },
        },
      },

      MuiStepConnector: {
        styleOverrides: {
          line: {
            borderColor: BORDER.default,
          },
        },
      },

      MuiStepIcon: {
        styleOverrides: {
          root: {
            color: isDark ? NEUTRAL[700] : NEUTRAL[300],
            '&.Mui-active': {
              color: PRIMARY[500],
            },
            '&.Mui-completed': {
              color: SEMANTIC.success[500],
            },
          },
        },
      },
    },
  });
};

// Export design tokens for use in components
export const tokens = {
  neutral: NEUTRAL,
  primary: PRIMARY,
  accent: ACCENT,
  semantic: SEMANTIC,
  radii: RADII,
  transitions: TRANSITIONS,
};
