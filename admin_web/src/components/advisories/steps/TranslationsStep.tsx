import React from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import GTranslateIcon from '@mui/icons-material/GTranslate';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import { TranslationProgressBar } from '../TranslationProgressBar';
import { TranslationEditor } from '../TranslationEditor';
import type { AdvisoryTranslationDraft } from '../../../types/advisory';
import type { TARGET_LANGUAGES } from '../hooks/useTranslations';

type AdvisoryTranslationLanguageCode = AdvisoryTranslationDraft['language_code'];

export interface TranslationsStepProps {
  title: string;
  body: string;
  region: string;
  translations: AdvisoryTranslationDraft[];
  activeTab: AdvisoryTranslationLanguageCode;
  languages: typeof TARGET_LANGUAGES;
  reviewedCount: number;
  totalCount: number;
  isSourceReady: boolean;
  isGenerating: boolean;
  onSetActiveTab: (code: AdvisoryTranslationLanguageCode) => void;
  onGenerateTranslations: () => void;
  onUpdateTranslation: (
    languageCode: AdvisoryTranslationLanguageCode,
    patch: Partial<AdvisoryTranslationDraft>
  ) => void;
  onMarkReviewed: (languageCode: AdvisoryTranslationLanguageCode) => boolean;
  onMarkEditable: (languageCode: AdvisoryTranslationLanguageCode) => void;
}

export const TranslationsStep: React.FC<TranslationsStepProps> = ({
  title,
  body,
  region,
  translations,
  activeTab,
  languages,
  reviewedCount,
  totalCount,
  isSourceReady,
  isGenerating,
  onSetActiveTab,
  onGenerateTranslations,
  onUpdateTranslation,
  onMarkReviewed,
  onMarkEditable,
}) => {
  const theme = useTheme();

  const activeDraft = translations.find((t) => t.language_code === activeTab);
  const activeLanguage = languages.find((l) => l.code === activeTab);

  return (
    <Box data-step="2">
      {/* Generate Button */}
      <Stack direction="row" justifyContent="flex-end" mb={3}>
        <Button
          variant="contained"
          startIcon={
            isGenerating ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              <GTranslateIcon />
            )
          }
          onClick={onGenerateTranslations}
          disabled={isGenerating || !isSourceReady}
          sx={{
            textTransform: 'none',
            borderRadius: '12px',
            fontWeight: 700,
            px: 3,
            py: 1,
            background: `linear-gradient(135deg, ${theme.palette.secondary.main}, ${theme.palette.secondary.dark})`,
            boxShadow: `0 4px 16px ${alpha(theme.palette.secondary.main, 0.3)}`,
            '&:hover': {
              boxShadow: `0 6px 20px ${alpha(theme.palette.secondary.main, 0.4)}`,
            },
            '&.Mui-disabled': {
              background: alpha(theme.palette.grey[500], 0.3),
            },
          }}
        >
          {isGenerating ? 'Generating...' : 'Generate Translations'}
        </Button>
      </Stack>

      {translations.length === 0 ? (
        <Alert
          severity="info"
          sx={{
            borderRadius: '16px',
            border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
            bgcolor: alpha(theme.palette.info.main, 0.04),
            '& .MuiAlert-icon': {
              color: theme.palette.info.main,
            },
          }}
        >
          Click "Generate Translations" to create AI-powered translation previews for all supported
          languages. Make sure you've entered the advisory title and message in Step 1.
        </Alert>
      ) : (
        <>
          {/* Progress Bar */}
          <TranslationProgressBar reviewedCount={reviewedCount} totalCount={totalCount} />

          <Grid container spacing={3}>
            {/* Original Content Panel */}
            <Grid size={{ xs: 12, lg: 5 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: '16px',
                  background: `linear-gradient(145deg, ${alpha(
                    theme.palette.primary.main,
                    0.02
                  )} 0%, ${alpha(theme.palette.background.paper, 1)} 100%)`,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
                  position: { lg: 'sticky' },
                  top: { lg: 24 },
                  height: 'fit-content',
                }}
              >
                <Stack direction="row" alignItems="center" mb={2.5}>
                  <Box
                    sx={{
                      width: 4,
                      height: 20,
                      borderRadius: 2,
                      bgcolor: 'primary.main',
                      mr: 1.5,
                    }}
                  />
                  <Typography
                    variant="overline"
                    color="primary"
                    fontWeight={800}
                    sx={{ letterSpacing: '0.1em' }}
                  >
                    Original (English)
                  </Typography>
                </Stack>

                <Stack spacing={2.5}>
                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      fontWeight={700}
                      gutterBottom
                      display="block"
                      sx={{ letterSpacing: '0.05em', textTransform: 'uppercase' }}
                    >
                      Title
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {title || '—'}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      fontWeight={700}
                      gutterBottom
                      display="block"
                      sx={{ letterSpacing: '0.05em', textTransform: 'uppercase' }}
                    >
                      Body
                    </Typography>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        bgcolor: alpha(theme.palette.grey[500], 0.03),
                        borderRadius: '12px',
                        border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                        maxHeight: 200,
                        overflow: 'auto',
                      }}
                    >
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}
                      >
                        {body || '—'}
                      </Typography>
                    </Paper>
                  </Box>

                  {region && (
                    <Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        fontWeight={700}
                        gutterBottom
                        display="block"
                        sx={{ letterSpacing: '0.05em', textTransform: 'uppercase' }}
                      >
                        Region
                      </Typography>
                      <Chip
                        label={region}
                        size="small"
                        variant="outlined"
                        sx={{
                          fontWeight: 600,
                          color: theme.palette.primary.dark,
                          borderColor: alpha(theme.palette.primary.main, 0.3),
                        }}
                      />
                    </Box>
                  )}
                </Stack>
              </Paper>
            </Grid>

            {/* Translation Editor Panel */}
            <Grid size={{ xs: 12, lg: 7 }}>
              <Stack spacing={2}>
                {/* Language Tab Bar */}
                <Box
                  role="tablist"
                  aria-label="Translation languages"
                  sx={{
                    display: 'flex',
                    gap: 1,
                    flexWrap: 'wrap',
                    p: 0.75,
                    bgcolor: alpha(theme.palette.grey[500], 0.04),
                    borderRadius: '14px',
                    border: `1px solid ${alpha(theme.palette.divider, 0.4)}`,
                  }}
                >
                  {languages.map((language) => {
                    const draft = translations.find((t) => t.language_code === language.code);
                    const isSelected = activeTab === language.code;
                    const isLangReviewed = draft?.translation_status === 'reviewed';

                    return (
                      <Button
                        key={language.code}
                        role="tab"
                        aria-selected={isSelected}
                        aria-controls={`translation-panel-${language.code}`}
                        id={`translation-tab-${language.code}`}
                        onClick={() => onSetActiveTab(language.code)}
                        sx={{
                          position: 'relative',
                          flexGrow: { xs: 1, sm: 0 },
                          minWidth: { xs: 'auto', sm: 120 },
                          borderRadius: '10px',
                          py: 1,
                          px: 2,
                          textTransform: 'none',
                          transition: 'all 0.25s ease',
                          bgcolor: isSelected ? 'background.paper' : 'transparent',
                          color: isSelected ? 'text.primary' : 'text.secondary',
                          fontWeight: isSelected ? 700 : 500,
                          fontSize: '0.875rem',
                          boxShadow: isSelected
                            ? `0 2px 8px ${alpha(theme.palette.common.black, 0.06)}`
                            : 'none',
                          border: isSelected
                            ? `1px solid ${alpha(theme.palette.divider, 0.6)}`
                            : '1px solid transparent',
                          '&:hover': {
                            bgcolor: isSelected
                              ? 'background.paper'
                              : alpha(theme.palette.grey[500], 0.06),
                          },
                        }}
                      >
                        <Stack direction="row" alignItems="center" spacing={0.75}>
                          <span>{language.label}</span>
                          {isLangReviewed && (
                            <TaskAltIcon sx={{ fontSize: 16, color: 'success.main' }} />
                          )}
                        </Stack>
                        {/* Status indicator dot */}
                        {isLangReviewed && (
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 6,
                              right: 6,
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              bgcolor: 'success.main',
                              boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
                            }}
                          />
                        )}
                      </Button>
                    );
                  })}
                </Box>

                {/* Translation Editor */}
                {activeDraft && activeLanguage && (
                  <Box
                    role="tabpanel"
                    id={`translation-panel-${activeTab}`}
                    aria-labelledby={`translation-tab-${activeTab}`}
                  >
                    <TranslationEditor
                      language={activeLanguage}
                      draft={activeDraft}
                      onUpdate={(patch) => onUpdateTranslation(activeTab, patch)}
                      onMarkReviewed={() => onMarkReviewed(activeTab)}
                      onMarkEditable={() => onMarkEditable(activeTab)}
                    />
                  </Box>
                )}
              </Stack>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
};
