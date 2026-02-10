import React from 'react';
import {
  Box,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Button,
  useTheme,
  alpha,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Skeleton,
} from '@mui/material';
import {
  Visibility as ViewIcon,
  VerifiedUser as VerifyIcon,
  Warning as WarningIcon,
  Schedule as TimeIcon,
  Place as PlaceIcon,
  Waves as WavesIcon,
  Flood as FloodIcon,
  Thunderstorm as StormIcon,
  Tsunami as TsunamiIcon,
  ReportProblem as OtherIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { format, formatDistanceToNow } from 'date-fns';
import type { HazardReport } from '../types/hazard';

interface RecentReportsTableProps {
  reports: HazardReport[];
  loading?: boolean;
  onViewReport?: (report: HazardReport) => void;
}

// Get hazard icon based on type
const getHazardIcon = (type: string) => {
  switch (type) {
    case 'Tsunami':
      return <TsunamiIcon />;
    case 'High Waves':
      return <WavesIcon />;
    case 'Storm':
      return <StormIcon />;
    case 'Flood':
      return <FloodIcon />;
    default:
      return <OtherIcon />;
  }
};

// Get hazard color based on type
const getHazardColor = (type: string) => {
  const colors: Record<string, string> = {
    'Tsunami': '#ef4444',
    'High Waves': '#0891b2',
    'Storm': '#3b82f6',
    'Flood': '#6366f1',
    'Other': '#64748b',
  };
  return colors[type] || '#64748b';
};

// Get status styling
const getStatusStyle = (status: string, theme: any) => {
  switch (status) {
    case 'resolved':
      return {
        bgcolor: alpha(theme.palette.success.main, 0.1),
        color: theme.palette.success.main,
        borderColor: alpha(theme.palette.success.main, 0.3),
      };
    case 'verified':
      return {
        bgcolor: alpha(theme.palette.info.main, 0.1),
        color: theme.palette.info.main,
        borderColor: alpha(theme.palette.info.main, 0.3),
      };
    case 'rejected':
      return {
        bgcolor: alpha(theme.palette.error.main, 0.1),
        color: theme.palette.error.main,
        borderColor: alpha(theme.palette.error.main, 0.3),
      };
    default: // pending
      return {
        bgcolor: alpha(theme.palette.grey[500], 0.1),
        color: theme.palette.grey[600],
        borderColor: alpha(theme.palette.grey[500], 0.3),
      };
  }
};

// Get urgency styling
const getUrgencyStyle = (level: string | null, theme: any) => {
  if (!level) return null;
  switch (level) {
    case 'High':
      return {
        bgcolor: alpha(theme.palette.error.main, 0.12),
        color: theme.palette.error.main,
        icon: '🔴',
      };
    case 'Medium':
      return {
        bgcolor: alpha(theme.palette.warning.main, 0.12),
        color: theme.palette.warning.main,
        icon: '🟡',
      };
    case 'Low':
      return {
        bgcolor: alpha(theme.palette.success.main, 0.12),
        color: theme.palette.success.main,
        icon: '🟢',
      };
    default:
      return null;
  }
};

// Skeleton loading row
const SkeletonRow = () => (
  <TableRow>
    <TableCell><Skeleton variant="circular" width={40} height={40} /></TableCell>
    <TableCell><Skeleton variant="text" width={120} /></TableCell>
    <TableCell><Skeleton variant="text" width={200} /></TableCell>
    <TableCell><Skeleton variant="text" width={100} /></TableCell>
    <TableCell><Skeleton variant="rounded" width={80} height={24} /></TableCell>
    <TableCell><Skeleton variant="text" width={80} /></TableCell>
    <TableCell><Skeleton variant="circular" width={32} height={32} /></TableCell>
  </TableRow>
);

export const RecentReportsTable: React.FC<RecentReportsTableProps> = ({
  reports,
  loading = false,
  onViewReport,
}) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        borderRadius: '20px',
        overflow: 'hidden',
        border: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
        bgcolor: 'background.paper',
        boxShadow: `0 4px 24px ${alpha(theme.palette.common.black, 0.04)}`,
      }}
    >
      {/* Premium Header with Glassmorphism */}
      <Box
        sx={{
          px: 3,
          py: 2.5,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.03)} 0%, ${alpha(theme.palette.background.paper, 1)} 100%)`,
          backdropFilter: 'blur(10px)',
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <Box
              sx={{
                width: 4,
                height: 24,
                borderRadius: 2,
                background: `linear-gradient(180deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              }}
            />
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: 'text.primary',
                letterSpacing: '-0.02em',
              }}
            >
              Recent Reports
            </Typography>
          </Box>
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              pl: 2.5,
              fontSize: '0.8125rem',
            }}
          >
            Latest hazard reports from the field
          </Typography>
        </Box>

        <Button
          variant="text"
          href="/reports"
          endIcon={<ArrowForwardIcon sx={{ fontSize: 18 }} />}
          sx={{
            color: theme.palette.primary.main,
            fontWeight: 600,
            fontSize: '0.875rem',
            px: 2,
            py: 1,
            borderRadius: '10px',
            bgcolor: alpha(theme.palette.primary.main, 0.06),
            '&:hover': {
              bgcolor: alpha(theme.palette.primary.main, 0.12),
            },
          }}
        >
          View All
        </Button>
      </Box>

      {/* Table */}
      <TableContainer>
        <Table sx={{ minWidth: 700 }}>
          <TableHead>
            <TableRow
              sx={{
                bgcolor: alpha(theme.palette.grey[50], 0.8),
                '& th': {
                  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                  py: 1.75,
                  px: 2,
                },
              }}
            >
              <TableCell sx={{ width: 60 }}></TableCell>
              <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Hazard Type
              </TableCell>
              <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Description
              </TableCell>
              <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Location
              </TableCell>
              <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Status
              </TableCell>
              <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Reported
              </TableCell>
              <TableCell sx={{ width: 80 }}></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              // Skeleton loading state
              Array.from({ length: 5 }).map((_, index) => (
                <SkeletonRow key={index} />
              ))
            ) : reports.length === 0 ? (
              // Empty state
              <TableRow>
                <TableCell colSpan={7} sx={{ py: 8, textAlign: 'center' }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                    <WavesIcon sx={{ fontSize: 48, color: 'text.disabled', opacity: 0.5 }} />
                    <Typography color="text.secondary" fontWeight={500}>
                      No recent reports
                    </Typography>
                    <Typography variant="body2" color="text.disabled">
                      Reports will appear here when submitted
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              // Data rows
              reports.map((report, index) => {
                const hazardColor = getHazardColor(report.hazard_type);
                const statusStyle = getStatusStyle(report.status, theme);
                const urgencyStyle = getUrgencyStyle(report.urgency_level, theme);

                return (
                  <TableRow
                    key={report.id}
                    sx={{
                      cursor: onViewReport ? 'pointer' : 'default',
                      bgcolor: report.is_high_risk
                        ? alpha(theme.palette.error.main, 0.02)
                        : index % 2 === 0
                        ? 'transparent'
                        : alpha(theme.palette.grey[50], 0.5),
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.04),
                        transform: 'scale(1.002)',
                        boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.06)}`,
                        '& .action-buttons': {
                          opacity: 1,
                        },
                      },
                      '& td': {
                        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.4)}`,
                        py: 2,
                        px: 2,
                      },
                      // Add left border for high-risk items
                      ...(report.is_high_risk && {
                        borderLeft: `3px solid ${theme.palette.error.main}`,
                      }),
                    }}
                    onClick={() => onViewReport?.(report)}
                  >
                    {/* Hazard Icon */}
                    <TableCell>
                      <Avatar
                        sx={{
                          width: 42,
                          height: 42,
                          bgcolor: alpha(hazardColor, 0.12),
                          color: hazardColor,
                          boxShadow: `0 2px 8px ${alpha(hazardColor, 0.2)}`,
                        }}
                      >
                        {getHazardIcon(report.hazard_type)}
                      </Avatar>
                    </TableCell>

                    {/* Hazard Type */}
                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography
                            sx={{
                              fontWeight: 600,
                              color: 'text.primary',
                              fontSize: '0.875rem',
                            }}
                          >
                            {report.hazard_type}
                          </Typography>
                          {report.is_high_risk && (
                            <Chip
                              icon={<WarningIcon sx={{ fontSize: '14px !important' }} />}
                              label="HIGH RISK"
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                bgcolor: alpha(theme.palette.error.main, 0.12),
                                color: theme.palette.error.main,
                                '& .MuiChip-icon': {
                                  color: theme.palette.error.main,
                                },
                              }}
                            />
                          )}
                        </Box>
                        {urgencyStyle && (
                          <Chip
                            label={`${urgencyStyle.icon} ${report.urgency_level}`}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              bgcolor: urgencyStyle.bgcolor,
                              color: urgencyStyle.color,
                              width: 'fit-content',
                            }}
                          />
                        )}
                      </Box>
                    </TableCell>

                    {/* Description */}
                    <TableCell>
                      <Typography
                        sx={{
                          fontSize: '0.8125rem',
                          color: 'text.primary',
                          lineHeight: 1.5,
                          maxWidth: 280,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {report.description}
                      </Typography>
                      {report.people_at_risk && report.people_at_risk > 0 && (
                        <Box
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 0.5,
                            mt: 0.5,
                            px: 1,
                            py: 0.25,
                            borderRadius: 1,
                            bgcolor: alpha(theme.palette.error.main, 0.08),
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              color: theme.palette.error.main,
                              fontWeight: 700,
                              fontSize: '0.7rem',
                            }}
                          >
                            👥 {report.people_at_risk} at risk
                          </Typography>
                        </Box>
                      )}
                    </TableCell>

                    {/* Location */}
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <PlaceIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                        <Typography
                          variant="body2"
                          sx={{
                            color: 'text.secondary',
                            fontSize: '0.8125rem',
                            fontFamily: 'monospace',
                          }}
                        >
                          {report.latitude.toFixed(3)}, {report.longitude.toFixed(3)}
                        </Typography>
                      </Box>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <Chip
                        label={report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                        size="small"
                        sx={{
                          ...statusStyle,
                          border: `1px solid`,
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          height: 26,
                          px: 0.5,
                        }}
                      />
                    </TableCell>

                    {/* Time */}
                    <TableCell>
                      <Tooltip
                        title={format(new Date(report.created_at), 'PPpp')}
                        arrow
                        placement="top"
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            cursor: 'help',
                          }}
                        >
                          <TimeIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                          <Typography
                            variant="body2"
                            sx={{
                              color: 'text.secondary',
                              fontSize: '0.8125rem',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                          </Typography>
                        </Box>
                      </Tooltip>
                    </TableCell>

                    {/* Actions */}
                    <TableCell>
                      <Box
                        className="action-buttons"
                        sx={{
                          display: 'flex',
                          gap: 0.5,
                          opacity: 0.4,
                          transition: 'opacity 0.2s ease',
                        }}
                      >
                        <Tooltip title="View Details" arrow>
                          <IconButton
                            size="small"
                            sx={{
                              color: theme.palette.primary.main,
                              bgcolor: alpha(theme.palette.primary.main, 0.08),
                              '&:hover': {
                                bgcolor: alpha(theme.palette.primary.main, 0.16),
                              },
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              onViewReport?.(report);
                            }}
                          >
                            <ViewIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                        {report.status === 'pending' && (
                          <Tooltip title="Quick Verify" arrow>
                            <IconButton
                              size="small"
                              sx={{
                                color: theme.palette.success.main,
                                bgcolor: alpha(theme.palette.success.main, 0.08),
                                '&:hover': {
                                  bgcolor: alpha(theme.palette.success.main, 0.16),
                                },
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                // TODO: Add quick verify action
                              }}
                            >
                              <VerifyIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Footer with summary */}
      {!loading && reports.length > 0 && (
        <Box
          sx={{
            px: 3,
            py: 2,
            borderTop: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
            bgcolor: alpha(theme.palette.grey[50], 0.5),
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Showing <strong>{reports.length}</strong> most recent reports
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: theme.palette.warning.main,
                }}
              />
              <Typography variant="caption" color="text.secondary">
                {reports.filter((r) => r.status === 'pending').length} Pending
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: theme.palette.error.main,
                }}
              />
              <Typography variant="caption" color="text.secondary">
                {reports.filter((r) => r.is_high_risk).length} High Risk
              </Typography>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};
