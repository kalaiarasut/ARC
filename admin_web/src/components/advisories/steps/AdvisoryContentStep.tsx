import React from 'react';
import {
  Box,
  Grid,
  TextField,
  Typography,
  InputAdornment,
  Chip,
  Stack,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import TitleIcon from '@mui/icons-material/Title';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import PublicIcon from '@mui/icons-material/Public';
import type { AdvisoryCategory, AdvisorySeverity } from '../../../types/advisory';
import type { AdvisoryFormState } from '../hooks/useAdvisoryForm';

export const CATEGORIES: { value: AdvisoryCategory; label: string; color: string }[] = [
  { value: 'food', label: 'Food', color: '#10b981' },
  { value: 'shelter', label: 'Shelter', color: '#6366f1' },
  { value: 'medical', label: 'Medical', color: '#ef4444' },
  { value: 'rescue', label: 'Rescue', color: '#f59e0b' },
  { value: 'roadblock', label: 'Roadblock', color: '#64748b' },
  { value: 'warning', label: 'Warning', color: '#eab308' },
  { value: 'evacuation', label: 'Evacuation', color: '#dc2626' },
];

export const SEVERITIES: { value: AdvisorySeverity; label: string; color: string }[] = [
  { value: 'info', label: 'Informational', color: '#3b82f6' },
  { value: 'watch', label: 'Watch', color: '#f59e0b' },
  { value: 'warning', label: 'Warning', color: '#ef4444' },
];

export interface AdvisoryContentStepProps {
  form: AdvisoryFormState;
  updateField: <K extends keyof AdvisoryFormState>(field: K, value: AdvisoryFormState[K]) => void;
}

export const AdvisoryContentStep: React.FC<AdvisoryContentStepProps> = ({
  form,
  updateField,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const textFieldSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '12px',
      bgcolor: isDark ? alpha(theme.palette.background.paper, 0.6) : 'background.paper',
      transition: 'all 0.2s ease',
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: alpha(theme.palette.divider, 0.8),
      },
      '&:hover': {
        bgcolor: isDark ? alpha(theme.palette.background.paper, 0.8) : alpha(theme.palette.grey[50], 0.8),
        '& .MuiOutlinedInput-notchedOutline': {
          borderColor: theme.palette.primary.main,
        },
      },
      '&.Mui-focused': {
        bgcolor: 'background.paper',
        '& .MuiOutlinedInput-notchedOutline': {
          borderWidth: 2,
          borderColor: theme.palette.primary.main,
        },
      },
    },
    '& .MuiInputLabel-root': {
      fontWeight: 500,
    },
    '& .MuiInputLabel-root.Mui-focused': {
      fontWeight: 600,
    },
  };

  return (
    <Box data-step="0">
      <Stack spacing={3}>
        {/* Title Field */}
        <Box>
          <TextField
            label="Advisory Title"
            value={form.title}
            onChange={(e) => updateField('title', e.target.value)}
            fullWidth
            required
            placeholder="Enter a clear, concise title for this advisory..."
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <TitleIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
            sx={textFieldSx}
          />
        </Box>

        {/* Message Field */}
        <Box>
          <TextField
            label="Advisory Message"
            value={form.body}
            onChange={(e) => updateField('body', e.target.value)}
            fullWidth
            required
            multiline
            rows={7}
            placeholder="Provide detailed information about the advisory, including actions people should take..."
            InputProps={{
              startAdornment: (
                <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1.5 }}>
                  <DescriptionOutlinedIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
            sx={textFieldSx}
          />
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 0.75, display: 'block', textAlign: 'right' }}
          >
            {form.body.length} characters
          </Typography>
        </Box>

        {/* Category, Severity, Region Row */}
        <Grid container spacing={2.5}>
          {/* Category Selection */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Box>
              <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
                <CategoryOutlinedIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                <Typography variant="body2" fontWeight={600}>
                  Category
                </Typography>
              </Stack>
              <Stack direction="row" flexWrap="wrap" gap={1}>
                {CATEGORIES.map((cat) => (
                  <Chip
                    key={cat.value}
                    label={cat.label}
                    size="small"
                    onClick={() => updateField('category', cat.value)}
                    sx={{
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      height: 32,
                      borderRadius: '8px',
                      bgcolor:
                        form.category === cat.value
                          ? alpha(cat.color, 0.15)
                          : alpha(theme.palette.grey[500], 0.08),
                      color: form.category === cat.value ? cat.color : 'text.secondary',
                      border: `1.5px solid ${
                        form.category === cat.value ? cat.color : 'transparent'
                      }`,
                      transition: 'all 0.2s ease',
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: alpha(cat.color, 0.1),
                        borderColor: alpha(cat.color, 0.5),
                      },
                    }}
                  />
                ))}
              </Stack>
            </Box>
          </Grid>

          {/* Severity Selection */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Box>
              <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
                <WarningAmberIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                <Typography variant="body2" fontWeight={600}>
                  Severity Level
                </Typography>
              </Stack>
              <Stack direction="row" gap={1}>
                {SEVERITIES.map((sev) => (
                  <Chip
                    key={sev.value}
                    label={sev.label}
                    size="small"
                    onClick={() => updateField('severity', sev.value)}
                    sx={{
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      height: 32,
                      borderRadius: '8px',
                      bgcolor:
                        form.severity === sev.value
                          ? alpha(sev.color, 0.15)
                          : alpha(theme.palette.grey[500], 0.08),
                      color: form.severity === sev.value ? sev.color : 'text.secondary',
                      border: `1.5px solid ${
                        form.severity === sev.value ? sev.color : 'transparent'
                      }`,
                      transition: 'all 0.2s ease',
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: alpha(sev.color, 0.1),
                        borderColor: alpha(sev.color, 0.5),
                      },
                    }}
                  />
                ))}
              </Stack>
            </Box>
          </Grid>

          {/* Region Field */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Box>
              <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
                <PublicIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                <Typography variant="body2" fontWeight={600}>
                  Region (Optional)
                </Typography>
              </Stack>
              <TextField
                value={form.region}
                onChange={(e) => updateField('region', e.target.value)}
                fullWidth
                size="small"
                placeholder="e.g. Chennai Coast, Kerala"
                sx={{
                  ...textFieldSx,
                  '& .MuiOutlinedInput-root': {
                    ...textFieldSx['& .MuiOutlinedInput-root'],
                    height: 42,
                  },
                }}
              />
            </Box>
          </Grid>
        </Grid>
      </Stack>
    </Box>
  );
};
