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
      <CardContent sx={{ p: 2.5 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box flex={1}>
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight={700}
              textTransform="uppercase"
              letterSpacing="0.06em"
              sx={{ fontSize: 11 }}
            >
              {title}
            </Typography>
            <Typography
              fontWeight={800}
              sx={{
                color: 'text.primary',
                mt: 0.5,
                mb: 0.5,
                letterSpacing: '-0.02em',
                fontSize: { xs: 26, sm: 30, md: 34 },
                lineHeight: 1.1,
              }}
            >
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary" fontWeight={500} sx={{ fontSize: 11.5 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          {icon && (
            <Box
              sx={{
                p: 1,
                borderRadius: '10px',
                bgcolor: alpha(mainColor, 0.08),
                color: mainColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                '& .MuiSvgIcon-root': { fontSize: 20 },
              }}
            >
              {icon}
            </Box>
          )}
        </Box>
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
      'Tsunami': '#ef4444',
      'High Waves': '#0891b2',
      'Storm': '#f59e0b',
      'Flood': '#088395',
      'Other': '#6b7280',
    };
    return colors[type] || '#6b7280';
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
              size="small"
              sx={{
                fontWeight: 600, borderRadius: '6px',
                bgcolor: alpha(getHazardColor(report.hazard_type), 0.1),
                color: getHazardColor(report.hazard_type),
                border: 'none',
              }}
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
