import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Chip,
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import {
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  PendingActions as PendingIcon,
  Assessment as AssessmentIcon,
  Timeline as TimelineIcon,
  Hub as HubIcon,
  GppMaybe as GppMaybeIcon,
  Schedule as ScheduleIcon,
  EmojiEvents as EmojiEventsIcon,
} from '@mui/icons-material';
import { StatCard } from '../components/ReportCard';
import { RecentReportsTable } from '../components/RecentReportsTable';
import { hazardService } from '../services/hazardService';
import { isSupabaseConfigured, supabase } from '../core/supabase_config';
import type { HazardReport, DashboardStats } from '../types/hazard';

interface LeaderboardEntry {
  user_id: string;
  user_name: string;
  total_points: number;
  report_count: number;
  rank: number;
}

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentReports, setRecentReports] = useState<HazardReport[]>([]);
  const [topCitizens, setTopCitizens] = useState<LeaderboardEntry[]>([]);
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

      // Fetch top citizens (non-blocking)
      try {
        const { data: leaderboard } = await supabase.rpc('get_leaderboard', { p_limit: 5 });
        if (Array.isArray(leaderboard)) {
          setTopCitizens(leaderboard);
        }
      } catch {
        // Non-critical, silently fail
      }
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

        {/* Analytics Metrics */}
        <Grid container spacing={3} mb={4}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Weekly Trend"
              value={`${stats.weeklyTrendPercent >= 0 ? '+' : ''}${stats.weeklyTrendPercent.toFixed(1)}%`}
              subtitle="vs previous week"
              color={stats.weeklyTrendPercent >= 0 ? 'success' : 'warning'}
              icon={<TimelineIcon />}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Hotspot Clusters"
              value={stats.hotspotClusters}
              subtitle="Weekly cells with 3+ reports"
              color="warning"
              icon={<HubIcon />}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="False-Positive Rate"
              value={`${stats.falsePositiveRate.toFixed(1)}%`}
              subtitle="Rejected ÷ total reports"
              color="error"
              icon={<GppMaybeIcon />}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Avg Verification Time"
              value={`${stats.avgVerificationHours.toFixed(1)}h`}
              subtitle="Avg age of verified/resolved"
              color="info"
              icon={<ScheduleIcon />}
            />
          </Grid>
        </Grid>

        {/* Breakdown Cards */}
        <Grid container spacing={3} mb={4}>
          {/* By Hazard Type */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Box
              sx={{
                p: 0,
                borderRadius: '16px',
                bgcolor: 'background.paper',
                height: '100%',
                boxShadow: `0 1px 3px ${alpha(theme.palette.common.black, 0.06)}, 0 4px 16px ${alpha(theme.palette.common.black, 0.04)}`,
                overflow: 'hidden',
                transition: 'box-shadow 0.3s, transform 0.3s',
                '&:hover': {
                  boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.1)}`,
                  transform: 'translateY(-3px)',
                }
              }}
            >
              <Box sx={{ px: 2.5, pt: 2.5, pb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 4, height: 20, borderRadius: 2, bgcolor: theme.palette.primary.main }} />
                <Typography variant="subtitle1" fontWeight={700} color="text.primary" letterSpacing="0.01em">
                  By Hazard Type
                </Typography>
              </Box>
              <Box sx={{ px: 2.5, pb: 2.5 }}>
                {Object.entries(stats.byHazardType).map(([type, count]) => {
                  const pct = stats.totalReports ? Math.round((count / stats.totalReports) * 100) : 0;
                  const barColor = type === 'Tsunami' ? theme.palette.error.main :
                    type === 'High Waves' ? theme.palette.secondary.main :
                      type === 'Storm' ? theme.palette.info.main :
                        type === 'Flood' ? theme.palette.primary.main : theme.palette.grey[500];
                  return (
                    <Box key={type} sx={{ py: 1, '&:not(:last-child)': { borderBottom: `1px solid ${alpha(theme.palette.divider, 0.06)}` } }}>
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box display="flex" alignItems="center" gap={1.2}>
                          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: barColor, flexShrink: 0, boxShadow: `0 0 0 3px ${alpha(barColor, 0.15)}` }} />
                          <Typography variant="body2" fontWeight={600} color="text.primary">
                            {type}
                          </Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="caption" fontWeight={600} sx={{ color: alpha(theme.palette.text.secondary, 0.7), fontSize: 11 }}>
                            {pct}%
                          </Typography>
                          <Box sx={{ bgcolor: alpha(barColor, 0.1), color: barColor, px: 1.2, py: 0.2, borderRadius: '8px', minWidth: 32, textAlign: 'center' }}>
                            <Typography variant="caption" fontWeight={800} sx={{ fontSize: 12.5 }}>
                              {count}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                      <Box sx={{ mt: 0.8, height: 5, bgcolor: alpha(theme.palette.grey[300], 0.3), borderRadius: 3, overflow: 'hidden' }}>
                        <Box sx={{ width: `${pct}%`, height: '100%', borderRadius: 3, background: `linear-gradient(90deg, ${barColor}, ${alpha(barColor, 0.7)})`, transition: 'width 1s cubic-bezier(0.4,0,0.2,1)' }} />
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          </Grid>

          {/* By Status */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Box
              sx={{
                p: 0,
                borderRadius: '16px',
                bgcolor: 'background.paper',
                height: '100%',
                boxShadow: `0 1px 3px ${alpha(theme.palette.common.black, 0.06)}, 0 4px 16px ${alpha(theme.palette.common.black, 0.04)}`,
                overflow: 'hidden',
                transition: 'box-shadow 0.3s, transform 0.3s',
                '&:hover': {
                  boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.1)}`,
                  transform: 'translateY(-3px)',
                }
              }}
            >
              <Box sx={{ px: 2.5, pt: 2.5, pb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 4, height: 20, borderRadius: 2, bgcolor: theme.palette.info.main }} />
                <Typography variant="subtitle1" fontWeight={700} color="text.primary" letterSpacing="0.01em">
                  By Status
                </Typography>
              </Box>
              <Box sx={{ px: 2.5, pb: 2.5 }}>
                {Object.entries(stats.byStatus).map(([status, count]) => {
                  const pct = stats.totalReports ? Math.round((count / stats.totalReports) * 100) : 0;
                  const barColor = status === 'resolved' ? theme.palette.success.main :
                    status === 'verified' ? theme.palette.info.main :
                      status === 'rejected' ? theme.palette.error.main : theme.palette.grey[400];
                  return (
                    <Box key={status} sx={{ py: 1, '&:not(:last-child)': { borderBottom: `1px solid ${alpha(theme.palette.divider, 0.06)}` } }}>
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box display="flex" alignItems="center" gap={1.2}>
                          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: barColor, flexShrink: 0, boxShadow: `0 0 0 3px ${alpha(barColor, 0.15)}` }} />
                          <Typography variant="body2" fontWeight={600} color="text.primary" textTransform="capitalize">
                            {status}
                          </Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="caption" fontWeight={600} sx={{ color: alpha(theme.palette.text.secondary, 0.7), fontSize: 11 }}>
                            {pct}%
                          </Typography>
                          <Box sx={{ bgcolor: alpha(barColor, 0.1), color: barColor, px: 1.2, py: 0.2, borderRadius: '8px', minWidth: 32, textAlign: 'center' }}>
                            <Typography variant="caption" fontWeight={800} sx={{ fontSize: 12.5 }}>
                              {count}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                      <Box sx={{ mt: 0.8, height: 5, bgcolor: alpha(theme.palette.grey[300], 0.3), borderRadius: 3, overflow: 'hidden' }}>
                        <Box sx={{ width: `${pct}%`, height: '100%', borderRadius: 3, background: `linear-gradient(90deg, ${barColor}, ${alpha(barColor, 0.7)})`, transition: 'width 1s cubic-bezier(0.4,0,0.2,1)' }} />
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          </Grid>

          {/* By Urgency */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Box
              sx={{
                p: 0,
                borderRadius: '16px',
                bgcolor: 'background.paper',
                height: '100%',
                boxShadow: `0 1px 3px ${alpha(theme.palette.common.black, 0.06)}, 0 4px 16px ${alpha(theme.palette.common.black, 0.04)}`,
                overflow: 'hidden',
                transition: 'box-shadow 0.3s, transform 0.3s',
                '&:hover': {
                  boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.1)}`,
                  transform: 'translateY(-3px)',
                }
              }}
            >
              <Box sx={{ px: 2.5, pt: 2.5, pb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 4, height: 20, borderRadius: 2, bgcolor: theme.palette.warning.main }} />
                <Typography variant="subtitle1" fontWeight={700} color="text.primary" letterSpacing="0.01em">
                  By Urgency Level
                </Typography>
              </Box>
              <Box sx={{ px: 2.5, pb: 2.5 }}>
                {Object.entries(stats.byUrgency).map(([level, count]) => {
                  const pct = stats.totalReports ? Math.round((count / stats.totalReports) * 100) : 0;
                  const barColor = level === 'High' ? theme.palette.error.main :
                    level === 'Medium' ? theme.palette.warning.main : theme.palette.success.main;
                  return (
                    <Box key={level} sx={{ py: 1, '&:not(:last-child)': { borderBottom: `1px solid ${alpha(theme.palette.divider, 0.06)}` } }}>
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box display="flex" alignItems="center" gap={1.2}>
                          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: barColor, flexShrink: 0, boxShadow: `0 0 0 3px ${alpha(barColor, 0.15)}` }} />
                          <Typography variant="body2" fontWeight={600} color="text.primary">
                            {level}
                          </Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="caption" fontWeight={600} sx={{ color: alpha(theme.palette.text.secondary, 0.7), fontSize: 11 }}>
                            {pct}%
                          </Typography>
                          <Box sx={{ bgcolor: alpha(barColor, 0.1), color: barColor, px: 1.2, py: 0.2, borderRadius: '8px', minWidth: 32, textAlign: 'center' }}>
                            <Typography variant="caption" fontWeight={800} sx={{ fontSize: 12.5 }}>
                              {count}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                      <Box sx={{ mt: 0.8, height: 5, bgcolor: alpha(theme.palette.grey[300], 0.3), borderRadius: 3, overflow: 'hidden' }}>
                        <Box sx={{ width: `${pct}%`, height: '100%', borderRadius: 3, background: `linear-gradient(90deg, ${barColor}, ${alpha(barColor, 0.7)})`, transition: 'width 1s cubic-bezier(0.4,0,0.2,1)' }} />
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          </Grid>
        </Grid>

        {/* Top Citizens */}
        {topCitizens.length > 0 && (
          <Box
            sx={{
              mb: 3,
              p: 3,
              bgcolor: 'white',
              borderRadius: 3,
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <EmojiEventsIcon sx={{ color: '#FFD700', mr: 1 }} />
              <Typography variant="h6" fontWeight={700}>
                Top Citizens
              </Typography>
            </Box>
            {topCitizens.map((citizen, i) => (
              <Box
                key={citizen.user_id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  py: 1.2,
                  px: 1,
                  borderBottom: i < topCitizens.length - 1 ? '1px solid' : 'none',
                  borderColor: 'divider',
                }}
              >
                <Typography
                  sx={{
                    width: 28,
                    fontWeight: 800,
                    fontSize: citizen.rank <= 3 ? 18 : 14,
                    color: citizen.rank === 1 ? '#FFD700' : citizen.rank === 2 ? '#C0C0C0' : citizen.rank === 3 ? '#CD7F32' : 'text.secondary',
                  }}
                >
                  {citizen.rank <= 3 ? ['🥇', '🥈', '🥉'][citizen.rank - 1] : `#${citizen.rank}`}
                </Typography>
                <Box sx={{ flex: 1, ml: 1 }}>
                  <Typography variant="body2" fontWeight={600}>
                    {citizen.user_name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {citizen.report_count} reports
                  </Typography>
                </Box>
                <Chip
                  label={`${citizen.total_points} pts`}
                  size="small"
                  sx={{
                    fontWeight: 700,
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main,
                  }}
                />
              </Box>
            ))}
          </Box>
        )}

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
