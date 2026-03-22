import React from 'react';
import { Box, Paper, Stack, Typography } from '@mui/material';
import { alpha, useTheme, type Theme } from '@mui/material/styles';

export interface FormSectionProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  color?: 'primary' | 'info' | 'warning' | 'success' | 'error';
  children: React.ReactNode;
  noPadding?: boolean;
}

const getColorValue = (theme: Theme, color: FormSectionProps['color']) => {
  switch (color) {
    case 'info':
      return theme.palette.info.main;
    case 'warning':
      return theme.palette.warning.main;
    case 'success':
      return theme.palette.success.main;
    case 'error':
      return theme.palette.error.main;
    case 'primary':
    default:
      return theme.palette.primary.main;
  }
};

export const FormSection: React.FC<FormSectionProps> = ({
  icon,
  title,
  description,
  color = 'primary',
  children,
  noPadding = false,
}) => {
  const theme = useTheme();
  const colorValue = getColorValue(theme, color);

  return (
    <Paper
      elevation={0}
      sx={{
        p: noPadding ? 0 : 3,
        borderRadius: '16px',
        bgcolor: alpha(colorValue, 0.02),
        border: `1px solid ${alpha(colorValue, 0.12)}`,
        transition: 'all 0.2s ease',
        overflow: 'hidden',
        '&:hover': {
          bgcolor: alpha(colorValue, 0.035),
          borderColor: alpha(colorValue, 0.2),
        },
      }}
    >
      <Box sx={{ p: noPadding ? 3 : 0, pb: noPadding ? 0 : undefined }}>
        <Stack direction="row" alignItems="center" spacing={1.5} mb={2.5}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: alpha(colorValue, 0.1),
              color: colorValue,
              flexShrink: 0,
              '& svg': {
                fontSize: 20,
              },
            }}
          >
            {icon}
          </Box>
          <Box>
            <Typography
              variant="subtitle2"
              fontWeight={700}
              color="text.primary"
              sx={{ lineHeight: 1.3 }}
            >
              {title}
            </Typography>
            {description && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ lineHeight: 1.4, display: 'block', mt: 0.25 }}
              >
                {description}
              </Typography>
            )}
          </Box>
        </Stack>
      </Box>
      <Box sx={{ px: noPadding ? 3 : 0, pb: noPadding ? 3 : 0 }}>
        {children}
      </Box>
    </Paper>
  );
};
