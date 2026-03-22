import React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';

export interface TranslationProgressBarProps {
  reviewedCount: number;
  totalCount: number;
}

export const TranslationProgressBar: React.FC<TranslationProgressBarProps> = ({
  reviewedCount,
  totalCount,
}) => {
  const theme = useTheme();
  const percentage = totalCount > 0 ? (reviewedCount / totalCount) * 100 : 0;
  const isComplete = reviewedCount === totalCount;

  return (
    <Box sx={{ mb: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="body2" fontWeight={600} color="text.primary">
          Translation Progress
        </Typography>
        <Typography
          variant="body2"
          fontWeight={600}
          sx={{
            color: isComplete ? 'success.main' : 'text.secondary',
          }}
        >
          {reviewedCount} of {totalCount} reviewed
        </Typography>
      </Stack>
      <Box
        sx={{
          height: 8,
          borderRadius: 4,
          bgcolor: alpha(theme.palette.grey[500], 0.15),
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <Box
          sx={{
            width: `${percentage}%`,
            height: '100%',
            borderRadius: 4,
            background: isComplete
              ? `linear-gradient(90deg, ${theme.palette.success.main}, ${theme.palette.success.light})`
              : `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
            transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: percentage > 0
              ? `0 2px 8px ${alpha(
                  isComplete ? theme.palette.success.main : theme.palette.primary.main,
                  0.3
                )}`
              : 'none',
          }}
        />
      </Box>
      {isComplete && (
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            mt: 0.75,
            color: 'success.main',
            fontWeight: 600,
          }}
        >
          All translations reviewed - ready to publish
        </Typography>
      )}
    </Box>
  );
};
