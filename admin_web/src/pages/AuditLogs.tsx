import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  CircularProgress,
  IconButton,
  Chip,
  useTheme,
  alpha,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  AdminPanelSettings as AdminIcon,
} from '@mui/icons-material';
import { hazardService } from '../services/hazardService';
import { format } from 'date-fns';
import type { ReportAuditLog, ReportStatus } from '../types/hazard';

// Custom Ring Component
const StatRing = ({ 
  value, 
  label, 
  color, 
  total,
}: { 
  value: number; 
  label: string; 
  color: string; 
  total: number;
}) => {
  const theme = useTheme();
  // Ensure we don't divide by zero
  const percentage = total > 0 ? (value / total) * 100 : 0;
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 1 }}>
      <Box sx={{ position: 'relative', display: 'inline-flex', mb: 1 }}>
        <CircularProgress
          variant="determinate"
          value={100}
          size={80}
          thickness={4}
          sx={{ color: alpha(theme.palette.grey[300], 0.5) }}
        />
        <CircularProgress
          variant="determinate"
          value={percentage}
          size={80}
          thickness={4}
          sx={{
            color: color,
            position: 'absolute',
            left: 0,
            '& .MuiCircularProgress-circle': { strokeLinecap: 'round' },
          }}
        />
        <Box
          sx={{
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            position: 'absolute',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
          }}
        >
          <Typography variant="h6" component="div" color="text.primary" fontWeight={700}>
            {value}
          </Typography>
        </Box>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color }} />
        <Typography variant="body2" color="text.secondary" fontWeight={500}>
          {label}
        </Typography>
      </Box>
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
  
  const [stats, setStats] = useState({
    total: 0,
    toVerified: 0,
    toRejected: 0,
    toResolved: 0,
    toPending: 0
  });

  const loadData = async () => {
    try {
      setLoading(true);
      
      const statsData = await hazardService.getAuditStats();
      setStats(statsData);
      
      const logsData = await hazardService.getAuditLogs(page, rowsPerPage, { 
        email: searchQuery || undefined 
      });
      
      setLogs(logsData.data);
      setTotalCount(logsData.total);
    } catch (err) {
      console.error(err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage]);
  
  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(0);
      loadData();
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const getStatusColor = (status: ReportStatus) => {
    switch (status) {
      case 'verified': return theme.palette.info.main;
      case 'rejected': return theme.palette.error.main;
      case 'resolved': return theme.palette.success.main;
      case 'pending': default: return theme.palette.grey[500];
    }
  };

  const getStatusLabel = (status: string) => status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>
          Audit Logs
        </Typography>
        <IconButton onClick={loadData} disabled={loading} color="primary" sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
          <RefreshIcon />
        </IconButton>
      </Box>

      {/* Top Rings Section */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 3, 
          mb: 3, 
          borderRadius: 3, 
          border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2
        }}
      >
        <StatRing 
          value={stats.total} 
          label="All Changes" 
          color={theme.palette.primary.main} 
          total={stats.total || 1} 
        />
        <StatRing 
          value={stats.toVerified} 
          label="To Verified" 
          color={theme.palette.info.main} 
          total={stats.total} 
        />
        <StatRing 
          value={stats.toRejected} 
          label="To Rejected" 
          color={theme.palette.error.main} 
          total={stats.total} 
        />
        <StatRing 
          value={stats.toResolved} 
          label="To Resolved" 
          color={theme.palette.success.main} 
          total={stats.total} 
        />
        <StatRing 
          value={stats.toPending} 
          label="To Pending" 
          color={theme.palette.grey[500]} 
          total={stats.total} 
        />
      </Paper>

      {/* Search Bar */}
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          placeholder="Search by Admin Email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
            endAdornment: searchQuery && (
              <InputAdornment position="end">
                <IconButton onClick={() => setSearchQuery('')} edge="end" size="small">
                  <CloseIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            )
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '12px',
              bgcolor: 'background.paper',
            }
          }}
        />
      </Box>

      {/* Main Table */}
      <Paper 
        elevation={0} 
        sx={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          overflow: 'hidden',
          borderRadius: 3,
          border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
        }}
      >
        <TableContainer sx={{ flex: 1 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell width={180}>Date & Time</TableCell>
                <TableCell>Admin</TableCell>
                <TableCell width={300}>Report ID</TableCell>
                <TableCell width={120}>Old Status</TableCell>
                <TableCell width={120}>New Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                    <Typography color="text.secondary">No audit logs found.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {format(new Date(log.changed_at), 'MMM dd, yyyy')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {format(new Date(log.changed_at), 'hh:mm:ss a')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AdminIcon color="action" fontSize="small" />
                        <Typography variant="body2">{log.admin_email}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Copy ID">
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            fontFamily: 'monospace', 
                            bgcolor: alpha(theme.palette.grey[200], 0.5),
                            p: 0.5,
                            borderRadius: 1,
                            cursor: 'pointer'
                          }}
                          onClick={() => navigator.clipboard.writeText(log.report_id)}
                        >
                          {log.report_id}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={getStatusLabel(log.old_status)} 
                        size="small" 
                        variant="outlined"
                        sx={{ color: getStatusColor(log.old_status as ReportStatus), borderColor: getStatusColor(log.old_status as ReportStatus) }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={getStatusLabel(log.new_status)} 
                        size="small"
                        sx={{ 
                          bgcolor: alpha(getStatusColor(log.new_status as ReportStatus), 0.1), 
                          color: getStatusColor(log.new_status as ReportStatus),
                          fontWeight: 600
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 25, 50, 100]}
          sx={{ borderTop: `1px solid ${alpha(theme.palette.divider, 0.6)}` }}
        />
      </Paper>
    </Box>
  );
}
