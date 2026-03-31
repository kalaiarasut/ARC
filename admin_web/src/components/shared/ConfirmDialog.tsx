import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  TextField,
} from '@mui/material';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmColor?: 'primary' | 'error' | 'warning' | 'success';
  requireReason?: boolean;
  reasonLabel?: string;
  reasonPlaceholder?: string;
  reasonValue?: string;
  onReasonChange?: (value: string) => void;
  expectedMatch?: string;
  matchLabel?: string;
  submitting?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmColor = 'primary',
  requireReason = false,
  reasonLabel = 'Reason',
  reasonPlaceholder = 'Enter reason',
  reasonValue = '',
  onReasonChange,
  expectedMatch,
  matchLabel = 'Type to confirm',
  submitting = false,
  onCancel,
  onConfirm,
}) => {
  const [matchValue, setMatchValue] = React.useState('');

  React.useEffect(() => {
    if (open) {
      setMatchValue('');
    }
  }, [open]);

  const isReasonValid = !requireReason || reasonValue.trim().length >= 3;
  const isMatchValid = !expectedMatch || matchValue === expectedMatch;
  const canConfirm = isReasonValid && isMatchValid;

  return (
    <Dialog open={open} onClose={submitting ? undefined : onCancel} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: (requireReason || expectedMatch) ? 2 : 0 }}>{description}</DialogContentText>
        
        {expectedMatch && (
          <TextField
            autoFocus={!requireReason}
            fullWidth
            size="small"
            label={matchLabel}
            placeholder={`Type "${expectedMatch}" to confirm`}
            value={matchValue}
            onChange={(e) => setMatchValue(e.target.value)}
            sx={{ mb: 2 }}
          />
        )}

        {requireReason && (
          <TextField
            autoFocus={!expectedMatch && requireReason}
            fullWidth
            size="small"
            label={reasonLabel}
            placeholder={reasonPlaceholder}
            value={reasonValue}
            onChange={(e) => onReasonChange?.(e.target.value)}
            multiline
            minRows={2}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={submitting}>
          {cancelLabel}
        </Button>
        <Button
          variant="contained"
          color={confirmColor}
          onClick={onConfirm}
          disabled={!canConfirm || submitting}
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
