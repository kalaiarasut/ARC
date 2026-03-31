import React from 'react';
import { Box, Container, Grid, Typography, Button, CircularProgress, Skeleton, alpha } from '@mui/material';
import FolderOffOutlinedIcon from '@mui/icons-material/FolderOffOutlined';
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined';
import { useThemeContext } from '../../contexts/ThemeContext';

export interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No Data Found',
  description = 'There are currently no records to display.',
  actionLabel,
  onAction,
  icon
}) => {
  const { mode } = useThemeContext();
  const isDark = mode === 'dark';

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      p: 4, 
      m: 2,
      textAlign: 'center',
      bgcolor: isDark ? '#1e293b' : '#ffffff',
      borderRadius: 3,
      boxShadow: isDark ? '0 4px 6px -1px rgb(0 0 0 / 0.3), 0 2px 4px -2px rgb(0 0 0 / 0.3)' : '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      minHeight: 250
    }}>
      <Box sx={{ 
        color: isDark ? '#475569' : '#cbd5e1', 
        mb: 2,
        '& svg': { fontSize: 64, mb: 1 } 
      }}>
        {icon || <FolderOffOutlinedIcon />}
      </Box>
      <Typography variant="h6" sx={{ fontWeight: 600, color: isDark ? '#f8fafc' : '#1e293b', mb: 1 }}>
        {title}
      </Typography>
      <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b', maxWidth: 400, mb: 3 }}>
        {description}
      </Typography>
      {actionLabel && onAction && (
        <Button 
          variant="outlined" 
          onClick={onAction}
          sx={{ textTransform: 'none', borderRadius: 2 }}
        >
          {actionLabel}
        </Button>
      )}
    </Box>
  );
};

export const LoadingState: React.FC<{ message?: string; type?: 'spinner' | 'table' | 'form' | 'details' | 'dashboard' }> = ({ message = 'Loading data...', type = 'table' }) => {
  const { mode } = useThemeContext();
  const isDark = mode === 'dark';

  if (type === 'dashboard') {
    return (
      <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', p: 3, pt: 0, '& .MuiSkeleton-root': { animationDelay: '0ms !important', animationDuration: '1.5s !important' } }}>
        <Container maxWidth="xl" sx={{ mt: 3, mb: 4, pt: 4 }}>
          {/* Row 1: Key Metrics */}
          <Grid container spacing={3} mb={4}>
            {[...Array(4)].map((_, i) => (
              <Grid key={`stat1-${i}`} size={{ xs: 12, sm: 6, md: 3 }}>
                <Skeleton variant="rounded" height={136} sx={{ borderRadius: '16px', boxShadow: `0 1px 3px ${alpha('#000', 0.05)}`, bgcolor: isDark ? 'rgba(255,255,255,0.05)' : undefined }} />
              </Grid>
            ))}
          </Grid>

          {/* Row 2: Analytics Metrics */}
          <Grid container spacing={3} mb={4}>
            {[...Array(4)].map((_, i) => (
              <Grid key={`stat2-${i}`} size={{ xs: 12, sm: 6, md: 3 }}>
                <Skeleton variant="rounded" height={136} sx={{ borderRadius: '16px', boxShadow: `0 1px 3px ${alpha('#000', 0.05)}`, bgcolor: isDark ? 'rgba(255,255,255,0.05)' : undefined }} />
              </Grid>
            ))}
          </Grid>

          {/* Row 3: Breakdown Cards */}
          <Grid container spacing={3} mb={4}>
            {[...Array(3)].map((_, i) => (
              <Grid key={`breakdown-${i}`} size={{ xs: 12, md: 4 }}>
                <Skeleton variant="rounded" height={360} sx={{ borderRadius: '16px', boxShadow: `0 1px 3px ${alpha('#000', 0.05)}`, bgcolor: isDark ? 'rgba(255,255,255,0.05)' : undefined }} />
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>
    );
  }

  if (type === 'table') {
    return (
      <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', '& .MuiSkeleton-root': { animationDelay: '0ms !important', animationDuration: '1.5s !important' } }}>
        {[...Array(5)].map((_, i) => (
          <Box key={i} sx={{ display: 'flex', gap: 2, p: 2, borderBottom: `1px solid ${isDark ? '#334155' : '#e2e8f0'}` }}>
            <Skeleton variant="circular" width={32} height={32} sx={{ bgcolor: isDark ? '#334155' : '#e2e8f0' }} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="30%" height={20} sx={{ bgcolor: isDark ? '#334155' : '#e2e8f0' }} />
              <Skeleton variant="text" width="60%" height={20} sx={{ bgcolor: isDark ? '#334155' : '#e2e8f0' }} />
            </Box>
            <Box sx={{ flex: 1, display: { xs: 'none', sm: 'block' } }}>
              <Skeleton variant="text" width="50%" height={20} sx={{ bgcolor: isDark ? '#334155' : '#e2e8f0' }} />
            </Box>
            <Skeleton variant="rectangular" width={60} height={24} sx={{ borderRadius: 1, bgcolor: isDark ? '#334155' : '#e2e8f0' }} />
          </Box>
        ))}
      </Box>
    );
  }

  if (type === 'form') {
    return (
      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3, '& .MuiSkeleton-root': { animationDelay: '0ms !important', animationDuration: '1.5s !important' } }}>
        <Skeleton variant="text" width="40%" height={32} sx={{ bgcolor: isDark ? '#334155' : '#e2e8f0' }} />
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3 }}>
          <Skeleton variant="rounded" height={40} sx={{ borderRadius: 1, bgcolor: isDark ? '#334155' : '#e2e8f0' }} />
          <Skeleton variant="rounded" height={40} sx={{ borderRadius: 1, bgcolor: isDark ? '#334155' : '#e2e8f0' }} />
          <Skeleton variant="rounded" height={40} sx={{ borderRadius: 1, bgcolor: isDark ? '#334155' : '#e2e8f0' }} />
          <Skeleton variant="rounded" height={40} sx={{ borderRadius: 1, bgcolor: isDark ? '#334155' : '#e2e8f0' }} />
        </Box>
      </Box>
    );
  }

  if (type === 'details') {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, '& .MuiSkeleton-root': { animationDelay: '0ms !important', animationDuration: '1.5s !important' } }}>
        {/* Top Profile Card */}
        <Box sx={{ 
          p: 3, 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' }, 
          gap: 3, 
          alignItems: { xs: 'flex-start', sm: 'center' }, 
          bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#ffffff',
          borderRadius: 4,
          border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
          justifyContent: 'space-between'
        }}>
          <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
            <Skeleton variant="circular" width={80} height={80} sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.05)' : undefined }} />
            <Box>
              <Skeleton variant="text" width={200} height={40} sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.05)' : undefined, mb: 0.5 }} />
              <Skeleton variant="text" width={300} height={24} sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.05)' : undefined }} />
            </Box>
          </Box>
          <Skeleton variant="rounded" width={140} height={36} sx={{ borderRadius: 4, bgcolor: isDark ? 'rgba(255,255,255,0.05)' : undefined }} />
        </Box>

        {/* Tabs */}
        <Box sx={{ display: 'flex', gap: 4, borderBottom: 1, borderColor: isDark ? '#334155' : 'divider', px: 2, pb: 1 }}>
          {[...Array(5)].map((_, i) => (
             <Skeleton key={i} variant="text" width={80} height={32} sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.05)' : undefined }} />
          ))}
        </Box>

        {/* Content Cards */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
          <Skeleton variant="rounded" sx={{ flex: 2, height: 350, borderRadius: 4, bgcolor: isDark ? 'rgba(255,255,255,0.05)' : undefined }} />
          <Skeleton variant="rounded" sx={{ flex: 1, height: 350, borderRadius: 4, bgcolor: isDark ? 'rgba(255,255,255,0.05)' : undefined }} />
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      p: 6, 
      minHeight: 300 
    }}>
      <CircularProgress size={40} thickness={4} sx={{ color: '#0D9488', mb: 2 }} />
      <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
        {message}
      </Typography>
    </Box>
  );
};

export const ErrorState: React.FC<{ error?: string; onRetry?: () => void }> = ({ 
  error = 'An error occurred while loading data.', 
  onRetry 
}) => {
  const { mode } = useThemeContext();
  const isDark = mode === 'dark';

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      p: 6, 
      textAlign: 'center',
      bgcolor: isDark ? 'rgba(239, 68, 68, 0.05)' : '#fef2f2',
      borderRadius: 3,
      border: `1px solid ${isDark ? 'rgba(239, 68, 68, 0.2)' : '#fecaca'}`,
      minHeight: 300
    }}>
      <ErrorOutlineOutlinedIcon sx={{ fontSize: 48, color: isDark ? '#f87171' : '#dc2626', mb: 2 }} />
      <Typography variant="h6" sx={{ fontWeight: 600, color: isDark ? '#f8fafc' : '#1e293b', mb: 1 }}>
        Unable to Load Data
      </Typography>
      <Typography variant="body2" sx={{ color: isDark ? '#f87171' : '#dc2626', maxWidth: 400, mb: 3 }}>
        {error}
      </Typography>
      {onRetry && (
        <Button 
          variant="contained" 
          onClick={onRetry}
          color="error"
          sx={{ textTransform: 'none', borderRadius: 2 }}
        >
          Try Again
        </Button>
      )}
    </Box>
  );
};
