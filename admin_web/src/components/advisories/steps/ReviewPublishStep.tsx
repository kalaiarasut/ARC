import React from 'react';
import {
  Alert,
  Box,
  Chip,
  Grid,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import GTranslateIcon from '@mui/icons-material/GTranslate';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import type { AdvisoryTranslationDraft } from '../../../types/advisory';
import type { AdvisoryFormState } from '../hooks/useAdvisoryForm';
import type { TARGET_LANGUAGES } from '../hooks/useTranslations';
import { CATEGORIES, SEVERITIES } from './AdvisoryContentStep';

export interface ReviewPublishStepProps {
  form: AdvisoryFormState;
  translations: AdvisoryTranslationDraft[];
  languages: typeof TARGET_LANGUAGES;
  allReviewed: boolean;
}

export const ReviewPublishStep: React.FC<ReviewPublishStepProps> = ({
  form,
  translations,
  languages,
  allReviewed,
}) => {
  const theme = useTheme();

  const categoryMeta = CATEGORIES.find((c) => c.value === form.category);
  const severityMeta = SEVERITIES.find((s) => s.value === form.severity);

  const cardSx = (color: string) => ({
    p: 2.5,
    borderRadius: '16px',
    bgcolor: alpha(color, 0.02),
    border: `1px solid ${alpha(color, 0.12)}`,
    height: '100%',
  });

  return (
    <Box data-step="3">
      <Grid container spacing={2.5}>
        {/* Advisory Details Card */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={0} sx={cardSx(theme.palette.primary.main)}>
            <Stack direction="row" alignItems="center" mb={2}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: 'primary.main',
                  mr: 1.5,
                }}
              >
                <ArticleOutlinedIcon sx={{ fontSize: 18 }} />
              </Box>
              <Typography variant="subtitle2" fontWeight={700}>
                Advisory Details
              </Typography>
            </Stack>

            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  Title
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {form.title || '—'}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  Message
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ whiteSpace: 'pre-wrap' }}
                >
                  {form.body
                    ? form.body.length > 200
                      ? form.body.slice(0, 200) + '...'
                      : form.body
                    : '—'}
                </Typography>
              </Box>

              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip
                  size="small"
                  label={categoryMeta?.label ?? form.category}
                  sx={{
                    fontWeight: 600,
                    bgcolor: alpha(categoryMeta?.color ?? theme.palette.grey[500], 0.1),
                    color: categoryMeta?.color ?? 'text.secondary',
                    borderRadius: '6px',
                  }}
                />
                <Chip
                  size="small"
                  label={severityMeta?.label ?? form.severity}
                  sx={{
                    fontWeight: 600,
                    bgcolor: alpha(severityMeta?.color ?? theme.palette.grey[500], 0.1),
                    color: severityMeta?.color ?? 'text.secondary',
                    borderRadius: '6px',
                  }}
                />
              </Stack>

              {form.region && (
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    Region
                  </Typography>
                  <Typography variant="body2">{form.region}</Typography>
                </Box>
              )}
            </Stack>
          </Paper>
        </Grid>

        {/* Location & Contacts Cards */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Stack spacing={2} sx={{ height: '100%' }}>
            {/* Location Target */}
            {(form.lat || form.lng) && (
              <Paper elevation={0} sx={cardSx(theme.palette.info.main)}>
                <Stack direction="row" alignItems="center" mb={1.5}>
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: alpha(theme.palette.info.main, 0.1),
                      color: 'info.main',
                      mr: 1,
                    }}
                  >
                    <PlaceOutlinedIcon sx={{ fontSize: 16 }} />
                  </Box>
                  <Typography variant="body2" fontWeight={700}>
                    Location Target
                  </Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  {form.lat}, {form.lng}
                  {form.radius ? ` (${form.radius} km radius)` : ''}
                </Typography>
              </Paper>
            )}

            {/* Emergency Contacts */}
            {(form.phone || form.whatsapp || form.hotline) && (
              <Paper elevation={0} sx={cardSx(theme.palette.warning.main)}>
                <Stack direction="row" alignItems="center" mb={1.5}>
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: alpha(theme.palette.warning.main, 0.1),
                      color: 'warning.main',
                      mr: 1,
                    }}
                  >
                    <PhoneOutlinedIcon sx={{ fontSize: 16 }} />
                  </Box>
                  <Typography variant="body2" fontWeight={700}>
                    Emergency Contacts
                  </Typography>
                </Stack>
                <Stack spacing={0.5}>
                  {form.phone && (
                    <Typography variant="body2" color="text.secondary">
                      Phone: {form.phone}
                    </Typography>
                  )}
                  {form.whatsapp && (
                    <Typography variant="body2" color="text.secondary">
                      WhatsApp: {form.whatsapp}
                    </Typography>
                  )}
                  {form.hotline && (
                    <Typography variant="body2" color="text.secondary">
                      Hotline: {form.hotline}
                    </Typography>
                  )}
                </Stack>
              </Paper>
            )}

            {/* Translation Status */}
            <Paper
              elevation={0}
              sx={{
                ...cardSx(allReviewed ? theme.palette.success.main : theme.palette.grey[500]),
                flex: 1,
              }}
            >
              <Stack direction="row" alignItems="center" mb={1.5}>
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: alpha(
                      allReviewed ? theme.palette.success.main : theme.palette.grey[500],
                      0.1
                    ),
                    color: allReviewed ? 'success.main' : 'text.secondary',
                    mr: 1,
                  }}
                >
                  <GTranslateIcon sx={{ fontSize: 16 }} />
                </Box>
                <Typography
                  variant="body2"
                  fontWeight={700}
                  color={allReviewed ? 'success.main' : 'text.primary'}
                >
                  Translation Status
                </Typography>
              </Stack>

              <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                {languages.map((lang) => {
                  const draft = translations.find((t) => t.language_code === lang.code);
                  const isLangReviewed = draft?.translation_status === 'reviewed';
                  return (
                    <Chip
                      key={lang.code}
                      size="small"
                      label={lang.label}
                      color={isLangReviewed ? 'success' : 'default'}
                      variant={isLangReviewed ? 'filled' : 'outlined'}
                      icon={isLangReviewed ? <CheckCircleOutlineIcon /> : undefined}
                      sx={{
                        fontWeight: 600,
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                      }}
                    />
                  );
                })}
              </Stack>

              {!allReviewed && (
                <Alert
                  severity="warning"
                  sx={{
                    mt: 2,
                    borderRadius: '10px',
                    py: 0.5,
                    '& .MuiAlert-icon': { py: 0.75 },
                    '& .MuiAlert-message': { py: 0.75 },
                  }}
                >
                  <Typography variant="caption" fontWeight={500}>
                    All translations must be reviewed before publishing.
                  </Typography>
                </Alert>
              )}

              {allReviewed && (
                <Typography
                  variant="caption"
                  color="success.main"
                  fontWeight={600}
                  sx={{ display: 'block', mt: 1.5 }}
                >
                  All translations reviewed — ready to publish!
                </Typography>
              )}
            </Paper>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
};
