import React from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { AdvisoryStepper, WIZARD_STEPS } from './AdvisoryStepper';
import { AdvisoryContentStep } from './steps/AdvisoryContentStep';
import { LocationContactsStep } from './steps/LocationContactsStep';
import { TranslationsStep } from './steps/TranslationsStep';
import { ReviewPublishStep } from './steps/ReviewPublishStep';
import type { UseAdvisoryFormReturn } from './hooks/useAdvisoryForm';
import type { UseTranslationsReturn } from './hooks/useTranslations';

export interface AdvisoryWizardProps {
  formState: UseAdvisoryFormReturn;
  translationsState: UseTranslationsReturn;
  activeStep: number;
  isPublishing: boolean;
  isGeneratingTranslations: boolean;
  onStepChange: (step: number) => void;
  onGenerateTranslations: () => void;
  onPublish: () => void;
  onReset: () => void;
}

export const AdvisoryWizard: React.FC<AdvisoryWizardProps> = ({
  formState,
  translationsState,
  activeStep,
  isPublishing,
  isGeneratingTranslations,
  onStepChange,
  onGenerateTranslations,
  onPublish,
  onReset,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const { form, updateField, isSourceReady } = formState;
  const {
    translations,
    activeTab,
    setActiveTab,
    updateTranslation,
    markReviewed,
    markEditable,
    allReviewed,
    reviewedCount,
    totalCount,
    languages,
  } = translationsState;

  const handleNext = () => {
    if (activeStep < WIZARD_STEPS.length - 1) {
      onStepChange(activeStep + 1);
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      onStepChange(activeStep - 1);
    }
  };

  const canProceedFromStep = (step: number): boolean => {
    switch (step) {
      case 0:
        return isSourceReady;
      case 1:
        return true; // Location & contacts are optional
      case 2:
        return translations.length > 0; // Must have generated translations
      case 3:
        return allReviewed;
      default:
        return false;
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: '16px',
        overflow: 'hidden',
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: theme.shadows[2],
        bgcolor: 'background.paper',
      }}
    >
      {/* Stepper Header */}
      <AdvisoryStepper
        activeStep={activeStep}
        onStepClick={(step) => onStepChange(step)}
      />

      {/* Step Content */}
      <Box
        sx={{
          p: { xs: 2, sm: 3, md: 4 },
          minHeight: 320,
          transition: 'opacity 0.3s ease',
        }}
      >
        {activeStep === 0 && (
          <AdvisoryContentStep form={form} updateField={updateField} />
        )}

        {activeStep === 1 && (
          <LocationContactsStep form={form} updateField={updateField} />
        )}

        {activeStep === 2 && (
          <TranslationsStep
            title={form.title}
            body={form.body}
            region={form.region}
            translations={translations}
            activeTab={activeTab}
            languages={languages}
            reviewedCount={reviewedCount}
            totalCount={totalCount}
            isSourceReady={isSourceReady}
            isGenerating={isGeneratingTranslations}
            onSetActiveTab={setActiveTab}
            onGenerateTranslations={onGenerateTranslations}
            onUpdateTranslation={updateTranslation}
            onMarkReviewed={markReviewed}
            onMarkEditable={markEditable}
          />
        )}

        {activeStep === 3 && (
          <ReviewPublishStep
            form={form}
            translations={translations}
            languages={languages}
            allReviewed={allReviewed}
          />
        )}
      </Box>

      {/* Navigation Footer */}
      <Box
        sx={{
          px: { xs: 2, sm: 3, md: 4 },
          py: 2.5,
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          bgcolor: isDark
            ? alpha(theme.palette.background.paper, 0.5)
            : alpha(theme.palette.grey[50], 0.5),
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <Button
          variant="text"
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          disabled={activeStep === 0 || isPublishing}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            color: 'text.secondary',
            '&:hover': {
              bgcolor: alpha(theme.palette.grey[500], 0.08),
            },
          }}
        >
          Back
        </Button>

        <Stack direction="row" spacing={1.5}>
          <Button
            variant="text"
            startIcon={<RestartAltIcon />}
            onClick={onReset}
            disabled={isPublishing}
            sx={{
              textTransform: 'none',
              color: 'text.secondary',
              '&:hover': {
                bgcolor: alpha(theme.palette.grey[500], 0.08),
              },
            }}
          >
            Clear
          </Button>

          {activeStep < WIZARD_STEPS.length - 1 ? (
            <Button
              variant="contained"
              endIcon={<ArrowForwardIcon />}
              onClick={handleNext}
              disabled={!canProceedFromStep(activeStep)}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                borderRadius: '12px',
                px: 3,
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                boxShadow: `0 4px 16px ${alpha(theme.palette.primary.main, 0.25)}`,
                '&:hover': {
                  boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.35)}`,
                  transform: 'translateY(-1px)',
                },
                transition: 'all 0.2s ease',
                '&.Mui-disabled': {
                  background: alpha(theme.palette.grey[500], 0.3),
                },
              }}
            >
              Next
            </Button>
          ) : (
            <Button
              variant="contained"
              startIcon={
                isPublishing ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  <SendOutlinedIcon />
                )
              }
              onClick={onPublish}
              disabled={isPublishing || !isSourceReady || !allReviewed}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                borderRadius: '12px',
                px: 3,
                background: `linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.dark})`,
                boxShadow: `0 4px 16px ${alpha(theme.palette.success.main, 0.3)}`,
                '&:hover': {
                  boxShadow: `0 6px 20px ${alpha(theme.palette.success.main, 0.4)}`,
                  transform: 'translateY(-1px)',
                },
                transition: 'all 0.2s ease',
                '&.Mui-disabled': {
                  background: alpha(theme.palette.grey[500], 0.3),
                },
              }}
            >
              {isPublishing ? 'Publishing...' : 'Publish Advisory'}
            </Button>
          )}
        </Stack>
      </Box>
    </Paper>
  );
};
