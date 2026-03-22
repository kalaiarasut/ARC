import React from 'react';
import { Box, Typography } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';

export interface TranslationProgressBarProps {
  reviewedCount: number;
  totalCount: number;
}

export const TranslationProgressBar: React.FC<TranslationProgressBarProps> = ({
  reviewedCount,
  totalCount,
}) => {
  const theme = useTheme();
  const percentage = (reviewedCount / totalCount) * 100;

  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <Typography variant="body2" fontWeight={600}>
          Translation Progress
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {reviewedCount}/{totalCount} reviewed
        </Typography>
      </Box>
      <Box
        sx={{
          height: 6,
          borderRadius: 3,
          bgcolor: alpha(theme.palette.grey[300], 0.5),
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            width: `${percentage}%`,
            height: '100%',
            borderRadius: 3,
            background: `linear-gradient(90deg, ${theme.palette.success.light}, ${theme.palette.success.main})`,
            transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      </Box>
    </Box>
  );
};
