import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  Alert,
  alpha,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TextSnippetIcon from '@mui/icons-material/TextSnippet';
import type { AdvisoryTranslationDraft } from '../../types/advisory';

export interface TranslationEditorProps {
  draft: AdvisoryTranslationDraft;
  language: {
    code: string;
    label: string;
    nativeLabel: string;
  };
  source: {
    title: string;
    body: string;
    region: string | null;
  };
  onUpdate: (patch: Partial<AdvisoryTranslationDraft>) => void;
  onMarkReviewed: () => void;
  onMarkEditable: () => void;
}

export const TranslationEditor: React.FC<TranslationEditorProps> = ({
  draft,
  language,
  source,
  onUpdate,
  onMarkReviewed,
  onMarkEditable,
}) => {
  const theme = useTheme();
  const isReviewed = draft.translation_status === 'reviewed';
  const [showSourceDialog, setShowSourceDialog] = useState(false);

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
          pb: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '0.95rem' }}>
            {language.nativeLabel}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
            {language.label}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Tooltip title="View original source message">
            <IconButton size="small" onClick={() => setShowSourceDialog(true)}>
              <TextSnippetIcon sx={{ fontSize: '1rem' }} />
            </IconButton>
          </Tooltip>
          {isReviewed && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'success.main' }}>
              <CheckCircleIcon sx={{ fontSize: '1.2rem' }} />
              <Typography sx={{ fontSize: '0.8rem', fontWeight: 500 }}>Reviewed</Typography>
            </Box>
          )}
        </Box>
      </Box>

      <Dialog open={showSourceDialog} onClose={() => setShowSourceDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Original source message</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Title
              </Typography>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {source.title || '-'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Body
              </Typography>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {source.body || '-'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Region
              </Typography>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {source.region?.trim() || '-'}
              </Typography>
            </Box>
          </Stack>
        </DialogContent>
      </Dialog>

      {draft.error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {draft.error}
        </Alert>
      )}

      <Stack spacing={2} sx={{ mb: 2 }}>
        <TextField
          fullWidth
          label="Title"
          value={draft.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          disabled={isReviewed}
          variant="filled"
          size="small"
          multiline
          maxRows={3}
          sx={{
            '& .MuiFilledInput-root': {
              backgroundColor: isReviewed
                ? alpha(theme.palette.action.selected, 0.05)
                : undefined,
            },
          }}
        />
        <TextField
          fullWidth
          label="Body"
          value={draft.body}
          onChange={(e) => onUpdate({ body: e.target.value })}
          disabled={isReviewed}
          variant="filled"
          size="small"
          multiline
          minRows={6}
          maxRows={12}
          sx={{
            '& .MuiFilledInput-root': {
              backgroundColor: isReviewed
                ? alpha(theme.palette.action.selected, 0.05)
                : undefined,
            },
          }}
        />
      </Stack>

      <Stack direction="row" spacing={1.5} sx={{ pt: 1.5 }}>
        {isReviewed ? (
          <Button
            size="small"
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={onMarkEditable}
            sx={{
              textTransform: 'none',
              fontWeight: 500,
            }}
          >
            Edit
          </Button>
        ) : (
          <Button
            size="small"
            variant="contained"
            startIcon={<CheckCircleIcon />}
            onClick={onMarkReviewed}
            sx={{
              textTransform: 'none',
              fontWeight: 500,
            }}
          >
            Mark as Reviewed
          </Button>
        )}
      </Stack>
    </Box>
  );
};
