import React from 'react';
import { Box, Typography, alpha } from '@mui/material';
import { useTheme } from '@mui/material/styles';

export interface FormSectionProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  color?: 'primary' | 'info' | 'warning' | 'success' | 'error';
  children: React.ReactNode;
}

export const FormSection: React.FC<FormSectionProps> = ({
  icon,
  title,
  description,
  color = 'primary',
  children,
}) => {
  const theme = useTheme();

  const colorMap = {
    primary: theme.palette.primary,
    info: theme.palette.info,
    warning: theme.palette.warning,
    success: theme.palette.success,
    error: theme.palette.error,
  };

  const selectedColor = colorMap[color];

  return (
    <Box
      sx={{
        pt: 3,
        pb: 2,
        px: 3,
        borderRadius: 2,
        border: `1px solid ${alpha(selectedColor.main, 0.12)}`,
        backgroundColor: alpha(selectedColor.main, 0.02),
        transition: 'all 0.2s ease',
        '&:hover': {
          backgroundColor: alpha(selectedColor.main, 0.04),
          borderColor: alpha(selectedColor.main, 0.2),
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2, gap: 2 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 36,
            height: 36,
            borderRadius: 1,
            backgroundColor: alpha(selectedColor.main, 0.1),
            color: selectedColor.main,
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              fontSize: '0.95rem',
              mb: description ? 0.5 : 0,
              color: 'text.primary',
            }}
          >
            {title}
          </Typography>
          {description && (
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                fontSize: '0.8rem',
              }}
            >
              {description}
            </Typography>
          )}
        </Box>
      </Box>
      <Box sx={{ pl: 7 }}>
        {children}
      </Box>
    </Box>
  );
};
