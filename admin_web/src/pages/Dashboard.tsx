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
import { StatCard, ReportCard } from '../components/ReportCard';
import { Header } from '../components/Header';
// import { hazardService } from '../services/hazardService';
import type { HazardReport, DashboardStats } from '../types/hazard';

const STATIC_DASHBOARD_STATS: DashboardStats = {
  totalReports: 1250,
  pendingReports: 45,
  highRiskReports: 12,
  reportsToday: 8,
  reportsThisWeek: 42,
  byHazardType: {
    'High Waves': 450,
    'Tsunami': 2,
    'Storm': 310,
    'Flood': 280,
    'Other': 208,
  },
  byUrgency: {
    'High': 120,
    'Medium': 450,
    'Low': 680,
  },
  byStatus: {
    'pending': 45,
    'verified': 890,
    'resolved': 315,
  }
};

const STATIC_RECENT_REPORTS: HazardReport[] = [
  {
    id: '1',
    client_id: 'c1',
    user_id: 'u1',
    user_phone: '9876543210',
    user_name: 'John Doe',
    hazard_type: 'High Waves',
    description: 'Waves exceeding 4m height near the lighthouse. Small vessels advised to return.',
    latitude: 13.0827,
    longitude: 80.2707,
    is_high_risk: true,
    people_at_risk: 12,
    urgency_level: 'High',
    media_urls: [],
    upload_complete: true,
    status: 'pending',
    event_time: new Date().toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    client_id: 'c2',
    user_id: 'u2',
    user_phone: '9123456789',
    user_name: 'Jane Smith',
    hazard_type: 'Storm',
    description: 'Heavy wind gusts uprooting trees. Power outage in the coastal block.',
    latitude: 12.9716,
    longitude: 77.5946,
    is_high_risk: true,
    people_at_risk: 50,
    urgency_level: 'High',
    media_urls: ['url1'],
    upload_complete: true,
    status: 'verified',
    event_time: new Date(Date.now() - 3600000).toISOString(),
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: '3',
    client_id: 'c3',
    user_id: 'u3',
    user_phone: '8888888888',
    user_name: 'Bob Wilson',
    hazard_type: 'Flood',
    description: 'Water logging in low lying areas. 2 feet water on the main road.',
    latitude: 19.0760,
    longitude: 72.8777,
    is_high_risk: false,
    people_at_risk: null,
    urgency_level: 'Medium',
    media_urls: [],
    upload_complete: true,
    status: 'resolved',
    event_time: new Date(Date.now() - 7200000).toISOString(),
    created_at: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: '4',
    client_id: 'c4',
    user_id: 'u4',
    user_phone: '7777777777',
    user_name: 'Alice Brown',
    hazard_type: 'Other',
    description: 'Unusual rapid retreat of sea water observed.',
    latitude: 9.9252,
    longitude: 78.1198,
    is_high_risk: true,
    people_at_risk: 100,
    urgency_level: 'High',
    media_urls: [],
    upload_complete: true,
    status: 'verified',
    event_time: new Date(Date.now() - 86400000).toISOString(),
    created_at: new Date(Date.now() - 86400000).toISOString(),
  }
];

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentReports, setRecentReports] = useState<HazardReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Loading static dashboard data...');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay

      setStats(STATIC_DASHBOARD_STATS);
      setRecentReports(STATIC_RECENT_REPORTS);
    } catch (err) {
      setError('Failed to load dashboard data');
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
      </Container>
    );
  }

  return (
    <Box>
      <Header title="Dashboard Overview" category="Dashboard" />
      <Container maxWidth="xl" sx={{ py: 4 }}>

        {/* Key Metrics */}
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Reports"
              value={stats.totalReports}
              subtitle="All time"
              color="primary"
              icon={<AssessmentIcon />}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Pending Review"
              value={stats.pendingReports}
              subtitle="Awaiting verification"
              color="warning"
              icon={<PendingIcon />}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="High Risk Alerts"
              value={stats.highRiskReports}
              subtitle="Critical attention needed"
              color="error"
              icon={<WarningIcon />}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
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
          <Grid item xs={12} md={4}>
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
                              type === 'High Waves' ? theme.palette.warning.main :
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
          <Grid item xs={12} md={4}>
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
          <Grid item xs={12} md={4}>
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
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Box>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Recent Reports
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Latest 10 hazard reports from the field
              </Typography>
            </Box>
            <Button
              variant="outlined"
              href="/reports"
              endIcon={<TrendingUpIcon />}
              sx={{ textTransform: 'none' }}
            >
              View All Reports
            </Button>
          </Box>
          <Grid container spacing={2}>
            {recentReports.map((report) => (
              <Grid item xs={12} key={report.id}>
                <ReportCard report={report} />
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>
    </Box>
  );
}
