import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import {
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  PendingActions as PendingIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { StatCard } from '../components/ReportCard';
import { RecentReportsTable } from '../components/RecentReportsTable';
import { hazardService } from '../services/hazardService';
import { isSupabaseConfigured } from '../core/supabase_config';
import type { HazardReport, DashboardStats } from '../types/hazard';

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentReports, setRecentReports] = useState<HazardReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!isSupabaseConfigured()) {
        throw new Error('Supabase not configured');
      }

      const [nextStats, recent] = await Promise.all([
        hazardService.getDashboardStats(),
        hazardService.getReportsWithCount(undefined, 0, 10),
      ]);

      setStats(nextStats);
      setRecentReports(recent.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load dashboard data';
      setError(message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const theme = useTheme();

  useEffect(() => {
    loadDashboardData();
  }, []);

  /*
  useEffect(() => {
    const channel = hazardService.subscribeToReports((newReport) => {
      setRecentReports(prev => [newReport, ...prev.slice(0, 9)]);
      // Update stats
      if (stats) {
        setStats({
          ...stats,
          totalReports: stats.totalReports + 1,
          pendingReports: newReport.status === 'pending' ? stats.pendingReports + 1 : stats.pendingReports,
          highRiskReports: newReport.is_high_risk ? stats.highRiskReports + 1 : stats.highRiskReports,
        });
      }
    });

    return () => {
      channel.unsubscribe();
    };
  }, [stats]);
  */

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 8, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Box textAlign="center">
          <CircularProgress size={60} />
          <Typography variant="h6" color="text.secondary" sx={{ mt: 2 }}>
            Loading Dashboard...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (error || !stats) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error" onClose={() => setError(null)}>
          {error || 'Failed to load dashboard data'}
        </Alert>
        {!isSupabaseConfigured() && (
          <Button sx={{ mt: 2 }} variant="contained" href="/reports">
            Open Reports
          </Button>
        )}
      </Container>
    );
  }

  return (
    <Box>
      {/* Header removed */}
      <Container maxWidth="xl" sx={{ py: 4 }}>

        {/* Key Metrics */}
        <Grid container spacing={3} mb={4}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Total Reports"
              value={stats.totalReports}
              subtitle="All time"
              color="primary"
              icon={<AssessmentIcon />}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Pending Review"
              value={stats.pendingReports}
              subtitle="Awaiting verification"
              color="warning"
              icon={<PendingIcon />}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="High Risk Alerts"
              value={stats.highRiskReports}
              subtitle="Critical attention needed"
              color="error"
              icon={<WarningIcon />}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Reports Today"
              value={stats.reportsToday}
              subtitle={`${stats.reportsThisWeek} this week`}
              color="success"
              icon={<TrendingUpIcon />}
            />
          </Grid>
        </Grid>

        {/* Breakdown Cards */}
        <Grid container spacing={3} mb={4}>
          {/* By Hazard Type */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Box
              sx={{
                p: 3,
                borderRadius: '16px',
                border: `1px solid ${theme.palette.divider}`,
                bgcolor: 'background.paper',
                height: '100%',
                boxShadow: theme.shadows[1],
                transition: 'box-shadow 0.3s',
                '&:hover': {
                  boxShadow: theme.shadows[4],
                }
              }}
            >
              <Typography variant="h6" fontWeight={700} gutterBottom>
                By Hazard Type
              </Typography>
              <Box mt={3} display="flex" flexDirection="column" gap={2}>
                {Object.entries(stats.byHazardType).map(([type, count]) => (
                  <Box key={type} display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                      {type}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1.5} flex={1} ml={2}>
                      <Box
                        sx={{
                          flex: 1,
                          height: 8,
                          bgcolor: alpha(theme.palette.grey[200], 0.5),
                          borderRadius: 4,
                          overflow: 'hidden',
                        }}
                      >
                        <Box
                          sx={{
                            width: `${(count / stats.totalReports) * 100}%`,
                            height: '100%',
                            bgcolor: type === 'Tsunami' ? theme.palette.error.main :
                              type === 'High Waves' ? theme.palette.secondary.main :
                                type === 'Storm' ? theme.palette.info.main : theme.palette.primary.main,
                            borderRadius: 4,
                            transition: 'width 1s ease-in-out',
                          }}
                        />
                      </Box>
                      <Typography variant="body2" fontWeight={700} minWidth={30} textAlign="right">
                        {count}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </Grid>

          {/* By Status */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Box
              sx={{
                p: 3,
                borderRadius: '16px',
                border: `1px solid ${theme.palette.divider}`,
                bgcolor: 'background.paper',
                height: '100%',
                boxShadow: theme.shadows[1],
                transition: 'box-shadow 0.3s',
                '&:hover': {
                  boxShadow: theme.shadows[4],
                }
              }}
            >
              <Typography variant="h6" fontWeight={700} gutterBottom>
                By Status
              </Typography>
              <Box mt={3} display="flex" flexDirection="column" gap={2}>
                {Object.entries(stats.byStatus).map(([status, count]) => (
                  <Box key={status} display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="text.secondary" textTransform="capitalize" fontWeight={500}>
                      {status}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1.5} flex={1} ml={2}>
                      <Box
                        sx={{
                          flex: 1,
                          height: 8,
                          bgcolor: alpha(theme.palette.grey[200], 0.5),
                          borderRadius: 4,
                          overflow: 'hidden',
                        }}
                      >
                        <Box
                          sx={{
                            width: `${(count / stats.totalReports) * 100}%`,
                            height: '100%',
                            bgcolor: status === 'resolved' ? theme.palette.success.main :
                              status === 'verified' ? theme.palette.info.main : theme.palette.grey[400],
                            borderRadius: 4,
                            transition: 'width 1s ease-in-out',
                          }}
                        />
                      </Box>
                      <Typography variant="body2" fontWeight={700} minWidth={30} textAlign="right">
                        {count}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </Grid>

          {/* By Urgency */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Box
              sx={{
                p: 3,
                borderRadius: '16px',
                border: `1px solid ${theme.palette.divider}`,
                bgcolor: 'background.paper',
                height: '100%',
                boxShadow: theme.shadows[1],
                transition: 'box-shadow 0.3s',
                '&:hover': {
                  boxShadow: theme.shadows[4],
                }
              }}
            >
              <Typography variant="h6" fontWeight={700} gutterBottom>
                By Urgency Level
              </Typography>
              <Box mt={3} display="flex" flexDirection="column" gap={2}>
                {Object.entries(stats.byUrgency).map(([level, count]) => (
                  <Box key={level} display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                      {level}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1.5} flex={1} ml={2}>
                      <Box
                        sx={{
                          flex: 1,
                          height: 8,
                          bgcolor: alpha(theme.palette.grey[200], 0.5),
                          borderRadius: 4,
                          overflow: 'hidden',
                        }}
                      >
                        <Box
                          sx={{
                            width: `${(count / stats.totalReports) * 100}%`,
                            height: '100%',
                            bgcolor: level === 'High' ? theme.palette.error.main :
                              level === 'Medium' ? theme.palette.warning.main : theme.palette.success.main,
                            borderRadius: 4,
                            transition: 'width 1s ease-in-out',
                          }}
                        />
                      </Box>
                      <Typography variant="body2" fontWeight={700} minWidth={30} textAlign="right">
                        {count}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </Grid>
        </Grid>

        {/* Recent Reports */}
        <RecentReportsTable
          reports={recentReports}
          loading={loading}
          onViewReport={(report) => {
            window.location.href = `/reports?id=${report.id}`;
          }}
        />
      </Container>
    </Box>
  );
}
