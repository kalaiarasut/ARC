import { useState, useEffect } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination, TextField, InputAdornment,
  CircularProgress, IconButton, Chip, useTheme, alpha, Tooltip, Stack,
} from '@mui/material';
import {
  Search as SearchIcon, Close as CloseIcon, Refresh as RefreshIcon,
  AdminPanelSettings as AdminIcon, CheckCircle as VerifiedIcon,
  Cancel as RejectedIcon, TaskAlt as ResolvedIcon, Schedule as PendingIcon,
  NavigateNext as ArrowIcon, ContentCopy as CopyIcon,
} from '@mui/icons-material';
import { hazardService } from '../services/hazardService';
import { format } from 'date-fns';
import type { ReportAuditLog, ReportStatus } from '../types/hazard';

// Stat Card Component
const StatCard = ({ value, label, color, icon, total }: { value: number; label: string; color: string; icon: React.ReactNode; total: number }) => {
  const theme = useTheme();
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <Box sx={{
      flex: 1,
      minWidth: 140,
      p: 2,
      borderRadius: '14px',
      border: `1px solid ${alpha(theme.palette.divider, 0.06)}`,
      bgcolor: alpha(color, 0.03),
      position: 'relative',
      overflow: 'hidden',
    }}>
      <Stack spacing={0.75}>
        <Box sx={{ width: 32, height: 32, borderRadius: '10px', bgcolor: alpha(color, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
          {icon}
        </Box>
        <Typography variant="h5" fontWeight={800} sx={{ color: alpha(theme.palette.text.primary, 0.85), lineHeight: 1 }}>
          {value.toLocaleString()}
        </Typography>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="caption" sx={{ color: alpha(theme.palette.text.secondary, 0.6), fontWeight: 600, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {label}
          </Typography>
          {total > 0 && value > 0 && (
            <Typography variant="caption" sx={{ color: alpha(color, 0.8), fontWeight: 700, fontSize: '0.65rem' }}>
              {pct}%
            </Typography>
          )}
        </Stack>
        {/* Progress bar */}
        <Box sx={{ height: 3, borderRadius: 2, bgcolor: alpha(color, 0.08), overflow: 'hidden' }}>
          <Box sx={{ height: '100%', width: `${pct}%`, borderRadius: 2, bgcolor: alpha(color, 0.5), transition: 'width 0.6s ease' }} />
        </Box>
      </Stack>
    </Box>
  );
};

export function AuditLogs() {
  const theme = useTheme();
  const [logs, setLogs] = useState<ReportAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({ total: 0, toVerified: 0, toRejected: 0, toResolved: 0, toPending: 0 });

  const loadData = async () => {
    try {
      setLoading(true);
      const statsData = await hazardService.getAuditStats();
      setStats(statsData);
      const logsData = await hazardService.getAuditLogs(page, rowsPerPage, { email: searchQuery || undefined });
      setLogs(logsData.data);
      setTotalCount(logsData.total);
    } catch (err) {
      console.error(err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [page, rowsPerPage]);
  useEffect(() => {
    const timer = setTimeout(() => { setPage(0); loadData(); }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const getStatusColor = (status: ReportStatus) => {
    switch (status) {
      case 'verified': return theme.palette.info.main;
      case 'rejected': return theme.palette.error.main;
      case 'resolved': return theme.palette.success.main;
      case 'pending': default: return theme.palette.grey[500];
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return <VerifiedIcon sx={{ fontSize: '0.75rem' }} />;
      case 'rejected': return <RejectedIcon sx={{ fontSize: '0.75rem' }} />;
      case 'resolved': return <ResolvedIcon sx={{ fontSize: '0.75rem' }} />;
      default: return <PendingIcon sx={{ fontSize: '0.75rem' }} />;
    }
  };

  const getStatusLabel = (status: string) => status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', px: { xs: 1.5, sm: 2.5 }, py: 2 }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="subtitle1" fontWeight={700} sx={{ fontSize: '1.1rem', lineHeight: 1.2 }}>
            Audit Trail
          </Typography>
          <Typography variant="caption" sx={{ color: alpha(theme.palette.text.secondary, 0.5), fontSize: '0.7rem' }}>
            Track all status changes made by administrators
          </Typography>
        </Box>
        <IconButton
          onClick={loadData}
          disabled={loading}
          size="small"
          sx={{
            bgcolor: theme.palette.primary.main,
            color: 'white',
            width: 34, height: 34,
            borderRadius: '10px',
            '&:hover': { bgcolor: theme.palette.primary.dark },
            '&.Mui-disabled': { bgcolor: alpha(theme.palette.primary.main, 0.4), color: 'white' },
          }}
        >
          <RefreshIcon sx={{ fontSize: '1.1rem' }} />
        </IconButton>
      </Stack>

      {/* Stat Cards */}
      <Stack direction="row" spacing={1.5} sx={{ mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
        <StatCard value={stats.total} label="Total Changes" color={theme.palette.primary.main} icon={<AdminIcon sx={{ fontSize: '1rem' }} />} total={stats.total || 1} />
        <StatCard value={stats.toVerified} label="Verified" color={theme.palette.info.main} icon={<VerifiedIcon sx={{ fontSize: '1rem' }} />} total={stats.total} />
        <StatCard value={stats.toRejected} label="Rejected" color={theme.palette.error.main} icon={<RejectedIcon sx={{ fontSize: '1rem' }} />} total={stats.total} />
        <StatCard value={stats.toResolved} label="Resolved" color={theme.palette.success.main} icon={<ResolvedIcon sx={{ fontSize: '1rem' }} />} total={stats.total} />
        <StatCard value={stats.toPending} label="Pending" color={theme.palette.grey[500]} icon={<PendingIcon sx={{ fontSize: '1rem' }} />} total={stats.total} />
      </Stack>

      {/* Search Bar */}
      <Box sx={{
        p: 1.25,
        mb: 1.5,
        borderRadius: '14px',
        bgcolor: 'background.paper',
        border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
        boxShadow: `0 1px 4px ${alpha(theme.palette.common.black, 0.04)}`,
      }}>
        <TextField
          fullWidth
          placeholder="Search by admin email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '10px',
              bgcolor: alpha(theme.palette.grey[100], 0.4),
              fontSize: '0.875rem',
              '& fieldset': { borderColor: alpha(theme.palette.divider, 0.12) },
              '&:hover': { bgcolor: alpha(theme.palette.grey[100], 0.7), '& fieldset': { borderColor: alpha(theme.palette.divider, 0.25) } },
              '&.Mui-focused': { bgcolor: 'background.paper', '& fieldset': { borderColor: theme.palette.primary.main, borderWidth: '1.5px' } },
            },
          }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: alpha(theme.palette.text.secondary, 0.5), fontSize: '1.2rem' }} /></InputAdornment>,
            endAdornment: searchQuery && (
              <InputAdornment position="end">
                <IconButton onClick={() => setSearchQuery('')} size="small" sx={{ color: 'text.secondary' }}>
                  <CloseIcon sx={{ fontSize: '1rem' }} />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Table */}
      <Box sx={{
        borderRadius: '16px',
        overflow: 'hidden',
        border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
        bgcolor: 'background.paper',
        boxShadow: `0 1px 4px ${alpha(theme.palette.common.black, 0.04)}, 0 4px 20px ${alpha(theme.palette.common.black, 0.02)}`,
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
      }}>
        <TableContainer sx={{ flex: 1, minHeight: 0, overflowX: 'hidden' }}>
          <Table stickyHeader size="small" sx={{
            tableLayout: 'fixed',
            '& .MuiTableCell-root': {
              py: 1.125, px: 1.5, lineHeight: 1.4,
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.06)}`,
            },
            '& .MuiTableCell-head': {
              py: 1.25, fontSize: '0.6875rem', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.06em',
              color: alpha(theme.palette.text.secondary, 0.7),
              bgcolor: alpha(theme.palette.grey[50], 0.6),
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            },
          }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 140 }}>Date & Time</TableCell>
                <TableCell>Admin</TableCell>
                <TableCell>Report ID</TableCell>
                <TableCell>Status Change</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 6, border: 'none' }}>
                    <CircularProgress size={28} thickness={3} />
                    <Typography variant="caption" sx={{ mt: 1.5, display: 'block', color: alpha(theme.palette.text.secondary, 0.5) }}>
                      Loading audit logs...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 6, border: 'none' }}>
                    <Typography variant="body2" sx={{ color: alpha(theme.palette.text.secondary, 0.5) }}>
                      No audit logs found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log, index) => (
                  <TableRow key={log.id} sx={{
                    bgcolor: index % 2 === 0 ? 'transparent' : alpha(theme.palette.grey[50], 0.35),
                    transition: 'background-color 0.15s ease',
                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) },
                  }}>
                    <TableCell>
                      <Stack spacing={0}>
                        <Typography variant="caption" sx={{ fontSize: '0.6875rem', fontWeight: 500, color: alpha(theme.palette.text.primary, 0.75) }}>
                          {format(new Date(log.changed_at), 'MMM dd, yyyy')}
                        </Typography>
                        <Typography variant="caption" sx={{ fontSize: '0.6rem', color: alpha(theme.palette.text.secondary, 0.5) }}>
                          {format(new Date(log.changed_at), 'HH:mm:ss')}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={0.75}>
                        <Box sx={{
                          width: 26, height: 26, borderRadius: '8px',
                          bgcolor: alpha(theme.palette.primary.main, 0.08),
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <AdminIcon sx={{ fontSize: '0.85rem', color: alpha(theme.palette.primary.main, 0.6) }} />
                        </Box>
                        <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 500, color: alpha(theme.palette.text.primary, 0.85) }}>
                          {log.admin_email}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Click to copy" arrow>
                        <Stack direction="row" alignItems="center" spacing={0.5} sx={{ cursor: 'pointer' }}
                          onClick={() => navigator.clipboard.writeText(log.report_id)}
                        >
                          <Typography variant="caption" sx={{
                            fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                            fontSize: '0.65rem', fontWeight: 500,
                            bgcolor: alpha(theme.palette.grey[200], 0.35),
                            color: alpha(theme.palette.text.secondary, 0.7),
                            px: 0.75, py: 0.25, borderRadius: '6px',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            maxWidth: 180, display: 'inline-block',
                          }}>
                            {log.report_id.length > 18 ? `${log.report_id.slice(0, 8)}...${log.report_id.slice(-4)}` : log.report_id}
                          </Typography>
                          <CopyIcon sx={{ fontSize: '0.7rem', color: alpha(theme.palette.text.secondary, 0.3) }} />
                        </Stack>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <Chip
                          icon={getStatusIcon(log.old_status)}
                          label={getStatusLabel(log.old_status)}
                          size="small"
                          sx={{
                            height: 22, fontSize: '0.625rem', fontWeight: 600,
                            bgcolor: alpha(getStatusColor(log.old_status as ReportStatus), 0.06),
                            color: alpha(getStatusColor(log.old_status as ReportStatus), 0.7),
                            border: 'none',
                            '& .MuiChip-icon': { color: 'inherit' },
                          }}
                        />
                        <ArrowIcon sx={{ fontSize: '0.85rem', color: alpha(theme.palette.text.secondary, 0.3) }} />
                        <Chip
                          icon={getStatusIcon(log.new_status)}
                          label={getStatusLabel(log.new_status)}
                          size="small"
                          sx={{
                            height: 22, fontSize: '0.625rem', fontWeight: 700,
                            bgcolor: alpha(getStatusColor(log.new_status as ReportStatus), 0.1),
                            color: getStatusColor(log.new_status as ReportStatus),
                            border: 'none',
                            '& .MuiChip-icon': { color: 'inherit' },
                          }}
                        />
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <Box sx={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          px: 2, py: 0.75,
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.06)}`,
          bgcolor: alpha(theme.palette.grey[50], 0.3),
        }}>
          <Typography variant="caption" fontWeight={600} sx={{ color: alpha(theme.palette.text.secondary, 0.6), fontSize: '0.75rem' }}>
            {totalCount.toLocaleString()} entries
          </Typography>
          <TablePagination
            component="div"
            count={totalCount}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            rowsPerPageOptions={[10, 25, 50, 100]}
            sx={{ border: 'none', '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': { fontSize: '0.75rem', color: alpha(theme.palette.text.secondary, 0.7) } }}
          />
        </Box>
      </Box>
    </Box>
  );
}
