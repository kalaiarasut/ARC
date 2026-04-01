import { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Stack, TextField, InputAdornment,
  IconButton, Chip, useTheme, alpha, Select, MenuItem, Avatar, Paper,
  Divider
} from '@mui/material';
import {
  Search as SearchIcon, Refresh as RefreshIcon,
  CompareArrows as DiffIcon, FilterList as FilterIcon,
} from '@mui/icons-material';
import { DataGrid, GridToolbarContainer } from '@mui/x-data-grid';
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { format } from 'date-fns';
import { HistoryDrawer } from '../components/audit/HistoryDrawer';

// Simulated API Service function for audit
const mockAuditData = [
  { id: 'ev_1', action: 'update', entity_type: 'advisory', entity_id: 'adv_901', admin_email: 'ops@hq.local', changed_at: new Date(Date.now() - 3600000).toISOString(), old_data: { severity: 'moderate' }, new_data: { severity: 'severe' }, reason: 'Escalation requested by field op' },
  { id: 'ev_2', action: 'create', entity_type: 'user', entity_id: 'usr_44', admin_email: 'admin@hq.local', changed_at: new Date(Date.now() - 86400000).toISOString(), new_data: { role: 'operator', status: 'active' } },
  { id: 'ev_3', action: 'transition', entity_type: 'monitoring_zone', entity_id: 'mz_09', admin_email: 'system@auto', changed_at: new Date(Date.now() - 172800000).toISOString(), old_data: { state: 'inactive' }, new_data: { state: 'active' } },
];

export function AuditLogs() {
  const theme = useTheme();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [entityFilter, setEntityFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  
  // Drawer State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<{ id: string; type: string; name: string } | null>(null);
  const [entityHistory, setEntityHistory] = useState<any[]>([]);

  const loadData = async () => {
    try {
      setLoading(true);
      setTimeout(() => {
        setLogs(mockAuditData);
        setLoading(false);
      }, 500);
    } catch (err) {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleRowClick = (params: any) => {
    const row = params.row;
    setSelectedEntity({
      id: row.entity_id,
      type: row.entity_type,
      name: `${row.entity_type.toUpperCase()} #${row.entity_id.split('_')[1] || row.entity_id}`,
    });
    setEntityHistory(logs.filter(l => l.entity_id === row.entity_id));
    setDrawerOpen(true);
  };

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchSearch = log.admin_email.toLowerCase().includes(searchQuery.toLowerCase()) || log.entity_id.includes(searchQuery);
      const matchEntity = entityFilter === 'all' || log.entity_type === entityFilter;
      const matchAction = actionFilter === 'all' || log.action === actionFilter;
      return matchSearch && matchEntity && matchAction;
    });
  }, [logs, searchQuery, entityFilter, actionFilter]);

  const columns: GridColDef[] = [
    {
      field: 'changed_at',
      headerName: 'TIMESTAMP',
      width: 150,
      renderCell: (params: GridRenderCellParams) => (
        <Stack spacing={0.5} justifyContent="center" height="100%">
          <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', lineHeight: 1 }}>
            {format(new Date(params.value), 'MMM dd, yyyy')}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, lineHeight: 1 }}>
            {format(new Date(params.value), 'HH:mm:ss')}
          </Typography>
        </Stack>
      )
    },
    {
      field: 'action',
      headerName: 'ACTION',
      width: 130,
      renderCell: (params: GridRenderCellParams) => {
        let color = theme.palette.info;
        if (params.value === 'create') color = theme.palette.success;
        if (params.value === 'delete') color = theme.palette.error;
        if (params.value === 'transition') color = theme.palette.warning;

        return (
          <Chip 
            label={params.value.toUpperCase()} 
            size="small" 
            sx={{ 
              bgcolor: alpha(color.main, 0.1), 
              color: color.dark, 
              fontWeight: 700, 
              fontSize: '0.65rem', 
              letterSpacing: '0.05em',
              borderRadius: '6px',
              border: `1px solid ${alpha(color.main, 0.3)}`
            }} 
          />
        );
      }
    },
    {
      field: 'entity_type',
      headerName: 'ENTITY TYPE',
      width: 150,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', textTransform: 'capitalize' }}>
          {params.value.replace('_', ' ')}
        </Typography>
      )
    },
    {
      field: 'entity_id',
      headerName: 'REFERENCE ID',
      width: 160,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="caption" sx={{ 
          fontFamily: 'monospace', 
          fontWeight: 600,
          color: theme.palette.primary.dark,
          bgcolor: alpha(theme.palette.primary.main, 0.08), 
          px: 1.2, 
          py: 0.6, 
          borderRadius: '6px',
          border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`
        }}>
          {params.value}
        </Typography>
      )
    },
    {
      field: 'admin_email',
      headerName: 'ACTOR',
      flex: 1,
      minWidth: 200,
      renderCell: (params: GridRenderCellParams) => (
        <Stack direction="row" spacing={1.5} alignItems="center" height="100%">
          <Avatar sx={{ 
            width: 28, height: 28, 
            fontSize: '0.75rem', 
            bgcolor: theme.palette.grey[900], 
            color: '#fff', 
            fontWeight: 700 
          }}>
            {params.value.charAt(0).toUpperCase()}
          </Avatar>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>{params.value}</Typography>
        </Stack>
      )
    },
    {
      field: 'diff',
      headerName: '',
      width: 60,
      sortable: false,
      renderCell: () => (
        <IconButton size="small" sx={{ color: theme.palette.text.secondary, '&:hover': { color: theme.palette.primary.main, bgcolor: alpha(theme.palette.primary.main, 0.1) } }}>
          <DiffIcon fontSize="small" />
        </IconButton>
      )
    }
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', px: { xs: 2, sm: 4 }, py: 4, bgcolor: '#f8fafc' }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-end" sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: "text.primary", letterSpacing: '-0.02em', mb: 0.5 }}>
            Audit Trail
          </Typography>
          <Typography variant="body1" sx={{ color: "text.secondary", fontWeight: 500 }}>
            Unified cross-project tracking for operations, changes, and incidents.
          </Typography>
        </Box>
        <IconButton
          onClick={loadData}
          disabled={loading}
          sx={{
            bgcolor: 'white',
            border: `1px solid ${theme.palette.divider}`,
            color: 'text.primary',
            width: 40, height: 40, borderRadius: '10px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            '&:hover': { bgcolor: theme.palette.action.hover },
          }}
        >
          <RefreshIcon />
        </IconButton>
      </Stack>

      {/* Unified Toolbar Filter */}
      <Paper elevation={0} sx={{
        display: 'flex', alignItems: 'center', mb: 3, 
        borderRadius: '12px', border: `1px solid ${theme.palette.divider}`,
        overflow: 'hidden', p: 0.5, bgcolor: 'white',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)'
      }}>
        <TextField
          placeholder="Search actor or reference ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          variant="standard"
          sx={{ minWidth: 260, flex: 1, px: 2, '& .MuiInput-underline:before': { borderBottom: 'none' }, '& .MuiInput-underline:after': { borderBottom: 'none' }, '& .MuiInput-underline:hover:not(.Mui-disabled):before': { borderBottom: 'none' } }}
          InputProps={{
            disableUnderline: true,
            startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: 'text.disabled' }} /></InputAdornment>,
          }}
        />
        
        <Divider orientation="vertical" flexItem sx={{ borderRightWidth: 2, my: 1 }} />
        
        <Stack direction="row" alignItems="center" sx={{ px: 2, gap: 1 }}>
          <FilterIcon sx={{ color: 'text.disabled', fontSize: 20 }} />
          <Select 
            value={entityFilter} 
            onChange={(e) => setEntityFilter(e.target.value)}
            variant="standard"
            disableUnderline
            sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.875rem', minWidth: 130 }}
          >
            <MenuItem value="all">All Entities</MenuItem>
            <MenuItem value="advisory">Advisories</MenuItem>
            <MenuItem value="report">Reports</MenuItem>
            <MenuItem value="user">Users</MenuItem>
            <MenuItem value="monitoring_zone">Zones</MenuItem>
          </Select>
        </Stack>

        <Divider orientation="vertical" flexItem sx={{ borderRightWidth: 2, my: 1 }} />

        <Box sx={{ px: 2 }}>
          <Select 
            value={actionFilter} 
            onChange={(e) => setActionFilter(e.target.value)}
            variant="standard"
            disableUnderline
            sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.875rem', minWidth: 120 }}
          >
            <MenuItem value="all">All Actions</MenuItem>
            <MenuItem value="create">Created</MenuItem>
            <MenuItem value="update">Updated</MenuItem>
            <MenuItem value="delete">Deleted</MenuItem>
            <MenuItem value="transition">Transitioned</MenuItem>
          </Select>
        </Box>
      </Paper>

      {/* Data Grid */}
      <Paper elevation={0} sx={{
        flex: 1, minHeight: 0,
        borderRadius: '16px', overflow: 'hidden',
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.02)',
        bgcolor: 'white',
        '& .MuiDataGrid-root': { border: 'none' },
        '& .MuiDataGrid-columnHeaders': { 
          bgcolor: '#f1f5f9', 
          borderBottom: `1px solid ${theme.palette.divider}`,
          color: theme.palette.text.secondary,
        },
        '& .MuiDataGrid-columnHeaderTitle': {
          fontWeight: 700,
          fontSize: '0.7rem',
          letterSpacing: '0.08em',
        },
        '& .MuiDataGrid-cell': { 
          borderBottom: `1px solid ${theme.palette.divider}`, 
          display: 'flex', alignItems: 'center' 
        },
        '& .MuiDataGrid-row': {
          transition: 'all 0.2s',
          '&:hover': { bgcolor: '#f8fafc', cursor: 'pointer', transform: 'translateY(-1px)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' },
        },
      }}>
        <DataGrid
          rows={filteredLogs}
          columns={columns}
          loading={loading}
          onRowClick={handleRowClick}
          initialState={{
            pagination: { paginationModel: { pageSize: 25 } },
            sorting: { sortModel: [{ field: 'changed_at', sort: 'desc' }] }
          }}
          pageSizeOptions={[15, 25, 50, 100]}
          disableRowSelectionOnClick
          rowHeight={64}
          columnHeaderHeight={48}
        />
      </Paper>

      <HistoryDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        entityName={selectedEntity?.name || ''}
        events={entityHistory}
      />
    </Box>
  );
}
