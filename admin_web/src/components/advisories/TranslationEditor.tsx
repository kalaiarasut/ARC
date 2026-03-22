import React from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import EditIcon from '@mui/icons-material/Edit';
import type { AdvisoryTranslationDraft } from '../../types/advisory';
import type { TARGET_LANGUAGES } from './hooks/useTranslations';

export interface TranslationEditorProps {
  language: (typeof TARGET_LANGUAGES)[number];
  draft: AdvisoryTranslationDraft;
  onUpdate: (patch: Partial<AdvisoryTranslationDraft>) => void;
  onMarkReviewed: () => boolean;
  onMarkEditable: () => void;
}

export const TranslationEditor: React.FC<TranslationEditorProps> = ({
  language,
  draft,
  onUpdate,
  onMarkReviewed,
  onMarkEditable,
}) => {
  const theme = useTheme();
  const isReviewed = draft.translation_status === 'reviewed';
  const isFailed = draft.translation_status === 'failed';

  const textFieldSx = {
    '& .MuiFilledInput-root': {
      borderRadius: '12px',
      bgcolor: isReviewed
        ? alpha(theme.palette.success.main, 0.03)
        : alpha(theme.palette.grey[500], 0.04),
      transition: 'all 0.2s ease',
      '&::before': { display: 'none' },
      '&::after': { display: 'none' },
      '&:hover': {
        bgcolor: isReviewed
          ? alpha(theme.palette.success.main, 0.05)
          : alpha(theme.palette.grey[500], 0.06),
      },
      '&.Mui-focused': {
        bgcolor: alpha(theme.palette.primary.main, 0.03),
      },
    },
    '& .MuiInputLabel-root': {
      fontWeight: 500,
    },
  };

  const handleUpdate = (field: 'title' | 'body' | 'region', value: string) => {
    onUpdate({
      [field]: field === 'region' ? (value || null) : value,
      error: undefined,
    });
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: '16px',
        border: `1px solid ${
          isReviewed
            ? alpha(theme.palette.success.main, 0.4)
            : isFailed
            ? alpha(theme.palette.error.main, 0.4)
            : alpha(theme.palette.divider, 0.6)
        }`,
        bgcolor: isReviewed
          ? alpha(theme.palette.success.main, 0.02)
          : 'background.paper',
        boxShadow: isReviewed
          ? `0 4px 20px ${alpha(theme.palette.success.main, 0.1)}`
          : `0 2px 12px ${alpha(theme.palette.common.black, 0.04)}`,
        transition: 'all 0.3s ease',
        position: 'relative',
        overflow: 'hidden',
        // Top success bar when reviewed
        '&::before': isReviewed
          ? {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 3,
              background: `linear-gradient(90deg, ${theme.palette.success.light}, ${theme.palette.success.main})`,
            }
          : {},
      }}
    >
      <Stack spacing={2.5}>
        {/* Header */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
          flexWrap="wrap"
          gap={1}
        >
          <Box>
            <Typography
              variant="subtitle1"
              fontWeight={800}
              sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            >
              {language.nativeLabel}
              <Typography component="span" variant="body2" color="text.secondary" fontWeight={600}>
                ({language.label})
              </Typography>
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
              Provider: {draft.provider ?? 'sarvam'} • Model: {draft.model ?? 'n/a'}
            </Typography>
          </Box>
          <Chip
            label={draft.translation_status.toUpperCase()}
            size="small"
            color={isReviewed ? 'success' : isFailed ? 'error' : 'warning'}
            sx={{
              fontWeight: 700,
              borderRadius: '6px',
              fontSize: '0.6875rem',
              letterSpacing: '0.05em',
            }}
          />
        </Stack>

        {/* Error Alert */}
        {draft.error && (
          <Alert severity="error" sx={{ borderRadius: '12px' }}>
            {draft.error}
          </Alert>
        )}

        {/* Title Field */}
        <TextField
          label="Translated Title"
          value={draft.title}
          onChange={(e) => handleUpdate('title', e.target.value)}
          fullWidth
          variant="filled"
          InputProps={{
            readOnly: isReviewed,
          }}
          sx={textFieldSx}
        />

        {/* Body Field */}
        <TextField
          label="Translated Body"
          value={draft.body}
          onChange={(e) => handleUpdate('body', e.target.value)}
          fullWidth
          multiline
          rows={6}
          variant="filled"
          InputProps={{
            readOnly: isReviewed,
          }}
          sx={textFieldSx}
        />

        {/* Region Field */}
        <TextField
          label="Translated Region"
          value={draft.region ?? ''}
          onChange={(e) => handleUpdate('region', e.target.value)}
          fullWidth
          variant="filled"
          placeholder="Optional"
          InputProps={{
            readOnly: isReviewed,
          }}
          sx={textFieldSx}
        />

        {/* Action Buttons */}
        <Stack direction="row" spacing={1.5} justifyContent="flex-end">
          {isReviewed ? (
            <Button
              variant="outlined"
              size="small"
              startIcon={<EditIcon />}
              onClick={onMarkEditable}
              sx={{
                borderRadius: '10px',
                textTransform: 'none',
                fontWeight: 600,
                px: 2.5,
              }}
            >
              Edit Translation
            </Button>
          ) : (
            <Button
              variant="contained"
              color="success"
              size="small"
              startIcon={<TaskAltIcon />}
              onClick={onMarkReviewed}
              sx={{
                borderRadius: '10px',
                textTransform: 'none',
                fontWeight: 700,
                px: 3,
                background: `linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.dark})`,
                boxShadow: `0 4px 12px ${alpha(theme.palette.success.main, 0.3)}`,
                '&:hover': {
                  boxShadow: `0 6px 16px ${alpha(theme.palette.success.main, 0.4)}`,
                },
              }}
            >
              Mark as Reviewed
            </Button>
          )}
        </Stack>
      </Stack>
    </Paper>
  );
};
