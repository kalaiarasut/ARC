import React from 'react';
import { Box, Stack, Typography, useMediaQuery } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import CheckIcon from '@mui/icons-material/Check';
import EditNoteIcon from '@mui/icons-material/EditNote';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import GTranslateIcon from '@mui/icons-material/GTranslate';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';

export interface WizardStep {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  icon: React.ReactNode;
}

export const WIZARD_STEPS: WizardStep[] = [
  {
    id: 'content',
    label: 'Advisory Content',
    shortLabel: 'Content',
    description: 'Enter title, message, and category',
    icon: <EditNoteIcon />,
  },
  {
    id: 'location',
    label: 'Location & Contacts',
    shortLabel: 'Location',
    description: 'Set geographic targeting and contacts',
    icon: <PlaceOutlinedIcon />,
  },
  {
    id: 'translations',
    label: 'Translations',
    shortLabel: 'Translate',
    description: 'Generate and review translations',
    icon: <GTranslateIcon />,
  },
  {
    id: 'review',
    label: 'Review & Publish',
    shortLabel: 'Publish',
    description: 'Review and publish advisory',
    icon: <SendOutlinedIcon />,
  },
];

export interface AdvisoryStepperProps {
  activeStep: number;
  onStepClick?: (stepIndex: number) => void;
}

export const AdvisoryStepper: React.FC<AdvisoryStepperProps> = ({ activeStep, onStepClick }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const isDark = theme.palette.mode === 'dark';

  const handleStepClick = (index: number) => {
    if (index < activeStep && onStepClick) {
      onStepClick(index);
    }
  };

  return (
    <Box
      role="navigation"
      aria-label="Advisory creation progress"
      sx={{
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 2, md: 3 },
        bgcolor: isDark ? alpha(theme.palette.grey[900], 0.5) : theme.palette.grey[50],
        borderBottom: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        justifyContent="center"
        spacing={{ xs: 1, sm: 0 }}
      >
        {WIZARD_STEPS.map((step, index) => {
          const isCompleted = activeStep > index;
          const isActive = activeStep === index;
          const isClickable = isCompleted && onStepClick;

          return (
            <React.Fragment key={step.id}>
              {/* Step Item */}
              <Box
                onClick={() => handleStepClick(index)}
                aria-current={isActive ? 'step' : undefined}
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'row', sm: 'column' },
                  alignItems: 'center',
                  gap: { xs: 1.5, sm: 1 },
                  cursor: isClickable ? 'pointer' : 'default',
                  px: { xs: 0, sm: 2, md: 3 },
                  py: { xs: 1, sm: 0 },
                  borderRadius: 2,
                  transition: 'all 0.2s ease',
                  '&:hover': isClickable
                    ? {
                        bgcolor: alpha(theme.palette.primary.main, 0.04),
                      }
                    : {},
                }}
              >
                {/* Step Circle */}
                <Box
                  sx={{
                    width: { xs: 40, md: 44 },
                    height: { xs: 40, md: 44 },
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 0.2s ease',
                    background: isCompleted
                      ? `linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.dark})`
                      : isActive
                      ? `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`
                      : isDark
                      ? theme.palette.grey[800]
                      : theme.palette.grey[200],
                    color: isCompleted || isActive ? '#fff' : theme.palette.text.secondary,
                    boxShadow: isActive
                      ? `0 4px 16px ${alpha(theme.palette.primary.main, 0.4)}`
                      : isCompleted
                      ? `0 4px 12px ${alpha(theme.palette.success.main, 0.25)}`
                      : 'none',
                    '& svg': {
                      fontSize: { xs: 18, md: 20 },
                    },
                  }}
                >
                  {isCompleted ? <CheckIcon /> : step.icon}
                </Box>

                {/* Step Label */}
                <Box
                  sx={{
                    textAlign: { xs: 'left', sm: 'center' },
                    flex: { xs: 1, sm: 'none' },
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: isActive ? 700 : 600,
                      fontSize: { xs: '0.875rem', md: '0.8125rem' },
                      color: isActive
                        ? 'primary.main'
                        : isCompleted
                        ? 'success.main'
                        : 'text.secondary',
                      lineHeight: 1.3,
                      transition: 'color 0.2s ease',
                    }}
                  >
                    {isMobile || isTablet ? step.shortLabel : step.label}
                  </Typography>
                  {!isMobile && (
                    <Typography
                      variant="caption"
                      sx={{
                        display: { xs: 'none', md: 'block' },
                        color: 'text.secondary',
                        fontSize: '0.6875rem',
                        mt: 0.25,
                        opacity: isActive ? 1 : 0.7,
                      }}
                    >
                      {step.description}
                    </Typography>
                  )}
                </Box>

                {/* Mobile: Step status badge */}
                {isMobile && (
                  <Typography
                    variant="caption"
                    sx={{
                      px: 1.5,
                      py: 0.5,
                      borderRadius: 1,
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      bgcolor: isCompleted
                        ? alpha(theme.palette.success.main, 0.1)
                        : isActive
                        ? alpha(theme.palette.primary.main, 0.1)
                        : alpha(theme.palette.grey[500], 0.1),
                      color: isCompleted
                        ? 'success.main'
                        : isActive
                        ? 'primary.main'
                        : 'text.secondary',
                    }}
                  >
                    {isCompleted ? 'Done' : isActive ? 'Current' : 'Pending'}
                  </Typography>
                )}
              </Box>

              {/* Progress Connector */}
              {index < WIZARD_STEPS.length - 1 && !isMobile && (
                <Box
                  sx={{
                    flex: 1,
                    height: 4,
                    minWidth: { sm: 40, md: 60 },
                    maxWidth: { sm: 80, md: 120 },
                    mx: { sm: 0.5, md: 1 },
                    borderRadius: 2,
                    background: isCompleted
                      ? `linear-gradient(90deg, ${theme.palette.success.main}, ${
                          activeStep > index + 1
                            ? theme.palette.success.main
                            : theme.palette.primary.main
                        })`
                      : alpha(theme.palette.grey[isDark ? 700 : 300], 0.3),
                    transition: 'background 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: isCompleted
                      ? `0 2px 8px ${alpha(theme.palette.success.main, 0.2)}`
                      : 'none',
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </Stack>

      {/* Mobile Progress Bar */}
      {isMobile && (
        <Box sx={{ mt: 2 }}>
          <Box
            sx={{
              height: 4,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.grey[isDark ? 700 : 300], 0.3),
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                width: `${((activeStep + 1) / WIZARD_STEPS.length) * 100}%`,
                height: '100%',
                borderRadius: 2,
                background: `linear-gradient(90deg, ${theme.palette.success.main}, ${theme.palette.primary.main})`,
                transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            />
          </Box>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 0.75, display: 'block', textAlign: 'center' }}
          >
            Step {activeStep + 1} of {WIZARD_STEPS.length}
          </Typography>
        </Box>
      )}
    </Box>
  );
};
