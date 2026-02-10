import { Card, CardContent, Typography, Box, Chip, useTheme, alpha } from '@mui/material';
import type { HazardReport } from '../types/hazard';
import { format } from 'date-fns';
import {
  Warning as WarningIcon,
  Schedule as TimeIcon,
  Place as PlaceIcon,
  People as PeopleIcon,
  Image as ImageIcon
} from '@mui/icons-material';

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  color?: 'primary' | 'error' | 'warning' | 'success' | 'info';
  icon?: React.ReactNode;
}

export function StatCard({ title, value, subtitle, color = 'primary', icon }: StatCardProps) {
  const theme = useTheme();

  const getColor = (colorName: string) => {
    switch (colorName) {
      case 'primary': return theme.palette.primary.main;
      case 'error': return theme.palette.error.main;
      case 'warning': return theme.palette.warning.main;
      case 'success': return theme.palette.success.main;
      case 'info': return theme.palette.info.main;
      default: return theme.palette.primary.main;
    }
  };

  const mainColor = getColor(color);

  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[4],
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box flex={1} zIndex={1}>
            <Typography variant="body2" color="text.secondary" fontWeight={600} gutterBottom textTransform="uppercase" letterSpacing="0.05em">
              {title}
            </Typography>
            <Typography variant="h3" fontWeight={800} sx={{ color: 'text.primary', my: 1, letterSpacing: '-0.02em' }}>
              {value}
            </Typography>
            {subtitle && (
              <Box display="flex" alignItems="center" gap={0.5}>
                {/* Simulated trend indicator if needed, for now just text */}
                <Typography variant="body2" color="text.secondary" fontWeight={500}>
                  {subtitle}
                </Typography>
              </Box>
            )}
          </Box>
          {icon && (
            <Box
              sx={{
                p: 1.5,
                borderRadius: '12px',
                bgcolor: alpha(mainColor, 0.1),
                color: mainColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {icon}
            </Box>
          )}
        </Box>

        {/* Decorative background element */}
        <Box
          sx={{
            position: 'absolute',
            bottom: -20,
            right: -20,
            width: 100,
            height: 100,
            borderRadius: '50%',
            bgcolor: alpha(mainColor, 0.05),
            zIndex: 0,
          }}
        />
      </CardContent>
    </Card>
  );
}

interface ReportCardProps {
  report: HazardReport;
  onClick?: () => void;
}

export function ReportCard({ report, onClick }: ReportCardProps) {
  const theme = useTheme();

  const getHazardColor = (type: string) => {
    const colors: Record<string, string> = {
      'Tsunami': 'error',
      'High Waves': 'secondary',
      'Storm': 'info',
      'Flood': 'primary',
      'Other': 'default',
    };
    return colors[type] || 'default';
  };

  const getUrgencyColor = (level: string | null) => {
    if (!level) return 'default';
    const colors: Record<string, 'error' | 'warning' | 'success'> = {
      'High': 'error',
      'Medium': 'warning',
      'Low': 'success',
    };
    return colors[level] || 'default';
  };

  return (
    <Card
      elevation={0}
      onClick={onClick}
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease-in-out',
        border: `1px solid ${theme.palette.divider}`,
        bgcolor: report.is_high_risk ? alpha(theme.palette.error.main, 0.02) : 'background.paper',
        '&:hover': onClick ? {
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[3],
          borderColor: theme.palette.primary.light,
        } : {},
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box display="flex" gap={1} flexWrap="wrap" flex={1}>
            <Chip
              label={report.hazard_type}
              color={getHazardColor(report.hazard_type) as any}
              size="small"
              sx={{ fontWeight: 600, borderRadius: '6px' }}
            />
            {report.urgency_level && report.urgency_level !== 'Low' && (
              <Chip
                label={report.urgency_level}
                color={getUrgencyColor(report.urgency_level)}
                size="small"
                variant="outlined"
                sx={{ fontWeight: 600, border: '1px solid' }}
              />
            )}
            {report.is_high_risk && (
              <Chip
                icon={<WarningIcon style={{ fontSize: 16 }} />}
                label="HIGH RISK"
                color="error"
                size="small"
                sx={{ fontWeight: 700, borderRadius: '6px' }}
              />
            )}
          </Box>
          <Box display="flex" alignItems="center" gap={0.5} color="text.secondary">
            <TimeIcon sx={{ fontSize: 14 }} />
            <Typography variant="caption" fontWeight={500}>
              {format(new Date(report.created_at), 'MMM dd, HH:mm')}
            </Typography>
          </Box>
        </Box>

        <Typography variant="body1" color="text.primary" sx={{ mb: 2, lineHeight: 1.6, fontWeight: 500 }}>
          {report.description.length > 120
            ? `${report.description.substring(0, 120)}...`
            : report.description}
        </Typography>

        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          flexWrap="wrap"
          gap={1}
          pt={2}
          borderTop={`1px solid ${theme.palette.divider}`}
        >
          <Box display="flex" gap={2} flexWrap="wrap">
            <Box display="flex" alignItems="center" gap={0.5}>
              <PlaceIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary" fontWeight={500}>
                {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}
              </Typography>
            </Box>

            {report.people_at_risk && report.people_at_risk > 0 && (
              <Box display="flex" alignItems="center" gap={0.5}>
                <PeopleIcon sx={{ fontSize: 16, color: theme.palette.error.main }} />
                <Typography variant="caption" color="error.main" fontWeight={700}>
                  {report.people_at_risk} at risk
                </Typography>
              </Box>
            )}

            {report.media_urls && report.media_urls.length > 0 && (
              <Box display="flex" alignItems="center" gap={0.5}>
                <ImageIcon sx={{ fontSize: 16, color: theme.palette.primary.main }} />
                <Typography variant="caption" color="primary.main" fontWeight={600}>
                  {report.media_urls.length} media
                </Typography>
              </Box>
            )}
          </Box>

          <Chip
            label={report.status}
            size="small"
            sx={{
              fontWeight: 600,
              textTransform: 'uppercase',
              fontSize: '0.7rem',
              height: '24px',
              bgcolor: report.status === 'resolved' ? alpha(theme.palette.success.main, 0.1) :
                report.status === 'verified' ? alpha(theme.palette.info.main, 0.1) :
                  alpha(theme.palette.grey[500], 0.1),
              color: report.status === 'resolved' ? theme.palette.success.main :
                report.status === 'verified' ? theme.palette.info.main :
                  theme.palette.grey[700],
            }}
          />
        </Box>
      </CardContent>
    </Card>
  );
}
