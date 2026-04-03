import { useEffect, useMemo, useState } from 'react';
import {
  Avatar,
  Box,
  Chip,
  Divider,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
  useTheme,
  alpha,
} from '@mui/material';
import {
  CompareArrows as DiffIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { format } from 'date-fns';
import { HistoryDrawer } from '../components/audit/HistoryDrawer';
import { auditService } from '../services/auditService';
import type { AuditEvent, AuditEventKind } from '../types/audit';

const formatLabel = (value: string) =>
  value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

const getEntityDisplayName = (event: AuditEvent) => {
  const metadata = event.metadata ?? {};
  const entityLabel = typeof metadata.entity_label === 'string' ? metadata.entity_label : null;
  const zoneName = typeof metadata.zone_name === 'string' ? metadata.zone_name : null;
  const incidentId = typeof metadata.incident_id === 'string' ? metadata.incident_id : null;

  if (entityLabel) return entityLabel;
  if (zoneName) return zoneName;
  if (incidentId) return incidentId;
  return `${formatLabel(event.entity_type)} ${event.entity_id}`;
};

export function AuditLogs() {
  const theme = useTheme();
  const [logs, setLogs] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [entityFilter, setEntityFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [kindFilter, setKindFilter] = useState<'all' | AuditEventKind>('all');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<{ id: string; type: string; name: string } | null>(null);
  const [entityHistory, setEntityHistory] = useState<AuditEvent[]>([]);

  const loadData = async (params?: {
    search?: string;
    entityType?: string;
    action?: string;
    eventKind?: 'all' | AuditEventKind;
  }) => {
    try {
      setLoading(true);
      const data = await auditService.listEvents({
        limit: 500,
        search: params?.search?.trim() || undefined,
        entityType: params?.entityType && params.entityType !== 'all' ? params.entityType : null,
        action: params?.action && params.action !== 'all' ? params.action : null,
        eventKind: params?.eventKind && params.eventKind !== 'all' ? params.eventKind : null,
      });
      setLogs(data);
    } catch (error) {
      console.error('Failed to load audit events:', error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadData({
        search: searchQuery,
        entityType: entityFilter,
        action: actionFilter,
        eventKind: kindFilter,
      });
    }, 200);

    return () => window.clearTimeout(timeoutId);
  }, [searchQuery, entityFilter, actionFilter, kindFilter]);

  const handleRefresh = () => {
    void loadData({
      search: searchQuery,
      entityType: entityFilter,
      action: actionFilter,
      eventKind: kindFilter,
    });
  };

  const handleRowClick = async (params: { row: AuditEvent }) => {
    const row = params.row;
    setSelectedEntity({
      id: row.entity_id,
      type: row.entity_type,
      name: getEntityDisplayName(row),
    });
    setDrawerOpen(true);
    setHistoryLoading(true);

    try {
      const history = await auditService.getEntityHistory(row.entity_type, row.entity_id, 150);
      setEntityHistory(history);
    } catch (error) {
      console.error('Failed to load entity history:', error);
      setEntityHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const availableEntityTypes = useMemo(
    () => Array.from(new Set(logs.map((log) => log.entity_type))).sort(),
    [logs],
  );

  const availableActions = useMemo(
    () => Array.from(new Set(logs.map((log) => log.action))).sort(),
    [logs],
  );

  const columns: GridColDef<AuditEvent>[] = [
    {
      field: 'created_at',
      headerName: 'Timestamp',
      width: 160,
      renderCell: (params: GridRenderCellParams<AuditEvent, string>) => (
        <Stack spacing={0.5} justifyContent="center" height="100%">
          <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', lineHeight: 1 }}>
            {format(new Date(params.value ?? ''), 'MMM dd, yyyy')}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, lineHeight: 1 }}>
            {format(new Date(params.value ?? ''), 'HH:mm:ss')}
          </Typography>
        </Stack>
      ),
    },
    {
      field: 'event_kind',
      headerName: 'Kind',
      width: 110,
      renderCell: (params: GridRenderCellParams<AuditEvent, AuditEventKind>) => {
        const isActivity = params.value === 'activity';
        return (
          <Chip
            size="small"
            label={isActivity ? 'Activity' : 'Audit'}
            sx={{
              bgcolor: alpha(isActivity ? theme.palette.warning.main : theme.palette.primary.main, 0.1),
              color: theme.palette.mode === 'dark' ? (isActivity ? theme.palette.warning.main : theme.palette.primary.main) : (isActivity ? theme.palette.warning.dark : theme.palette.primary.dark),
              border: `1px solid ${alpha(isActivity ? theme.palette.warning.main : theme.palette.primary.main, 0.2)}`,
              fontWeight: 700,
            }}
          />
        );
      },
    },
    {
      field: 'action',
      headerName: 'Action',
      width: 160,
      renderCell: (params: GridRenderCellParams<AuditEvent, string>) => (
        <Chip
          label={formatLabel(params.value ?? '')}
          size="small"
          sx={{
            bgcolor: alpha(theme.palette.info.main, 0.1),
            color: theme.palette.info.dark,
            fontWeight: 700,
            borderRadius: '6px',
            border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
          }}
        />
      ),
    },
    {
      field: 'entity_type',
      headerName: 'Entity',
      width: 170,
      renderCell: (params: GridRenderCellParams<AuditEvent, string>) => (
        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
          {formatLabel(params.value ?? '')}
        </Typography>
      ),
    },
    {
      field: 'entity_id',
      headerName: 'Reference',
      flex: 1,
      minWidth: 220,
      renderCell: (params: GridRenderCellParams<AuditEvent>) => (
        <Stack spacing={0.5} justifyContent="center" height="100%">
          <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
            {getEntityDisplayName(params.row)}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              fontFamily: 'monospace',
              color: theme.palette.primary.dark,
              bgcolor: alpha(theme.palette.primary.main, 0.08),
              px: 1,
              py: 0.4,
              borderRadius: '6px',
              width: 'fit-content',
            }}
          >
            {params.row.entity_id}
          </Typography>
        </Stack>
      ),
    },
    {
      field: 'actor_email',
      headerName: 'Actor',
      width: 220,
      renderCell: (params: GridRenderCellParams<AuditEvent, string | null>) => {
        const actor = params.value ?? 'System';
        return (
          <Stack direction="row" spacing={1.5} alignItems="center" height="100%">
            <Avatar
              sx={{
                width: 28,
                height: 28,
                fontSize: '0.75rem',
                bgcolor: theme.palette.grey[900],
                color: theme.palette.primary.contrastText,
                fontWeight: 700,
              }}
            >
              {actor.charAt(0).toUpperCase()}
            </Avatar>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {actor}
            </Typography>
          </Stack>
        );
      },
    },
    {
      field: 'reason',
      headerName: 'Reason',
      width: 260,
      renderCell: (params: GridRenderCellParams<AuditEvent, string | null>) => (
        <Typography variant="body2" sx={{ color: params.value ? 'text.primary' : 'text.secondary' }}>
          {params.value ?? 'No explicit reason'}
        </Typography>
      ),
    },
    {
      field: 'diff',
      headerName: '',
      width: 60,
      sortable: false,
      filterable: false,
      renderCell: () => (
        <IconButton size="small" sx={{ color: theme.palette.text.secondary }}>
          <DiffIcon fontSize="small" />
        </IconButton>
      ),
    },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', px: { xs: 2, sm: 4 }, py: 4, bgcolor: 'background.default' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-end" sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em', mb: 0.5 }}>
            Audit Trail
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 500 }}>
            Unified cross-project tracking for operator changes and monitored activity.
          </Typography>
        </Box>
        <IconButton
          onClick={handleRefresh}
          disabled={loading}
          sx={{
            bgcolor: 'background.paper',
            border: `1px solid ${theme.palette.divider}`,
            color: 'text.primary',
            width: 40,
            height: 40,
            borderRadius: '10px',
            boxShadow: theme.palette.mode === 'dark' ? 'none' : '0 1px 3px rgba(0,0,0,0.05)',
            '&:hover': { bgcolor: theme.palette.action.hover },
          }}
        >
          <RefreshIcon />
        </IconButton>
      </Stack>

      <Paper
        elevation={0}
        sx={{
          display: 'flex',
          alignItems: 'center',
          mb: 3,
          borderRadius: '12px',
          border: `1px solid ${theme.palette.divider}`,
          overflow: 'hidden',
          p: 0.5,
          bgcolor: 'background.paper',
          boxShadow: theme.palette.mode === 'dark' ? 'none' : '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
          gap: 1,
          flexWrap: 'wrap',
        }}
      >
        <TextField
          placeholder="Search actor, entity, reason, or incident..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          variant="standard"
          sx={{
            minWidth: 260,
            flex: 1,
            px: 2,
            '& .MuiInput-underline:before': { borderBottom: 'none' },
            '& .MuiInput-underline:after': { borderBottom: 'none' },
            '& .MuiInput-underline:hover:not(.Mui-disabled):before': { borderBottom: 'none' },
          }}
          InputProps={{
            disableUnderline: true,
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'text.disabled' }} />
              </InputAdornment>
            ),
          }}
        />

        <Divider orientation="vertical" flexItem sx={{ borderRightWidth: 2, my: 1 }} />

        <Stack direction="row" alignItems="center" sx={{ px: 2, gap: 1 }}>
          <FilterIcon sx={{ color: 'text.disabled', fontSize: 20 }} />
          <Select
            value={entityFilter}
            onChange={(event) => setEntityFilter(event.target.value)}
            variant="standard"
            disableUnderline
            sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.875rem', minWidth: 150 }}
          >
            <MenuItem value="all">All Entities</MenuItem>
            {availableEntityTypes.map((entityType) => (
              <MenuItem key={entityType} value={entityType}>
                {formatLabel(entityType)}
              </MenuItem>
            ))}
          </Select>
        </Stack>

        <Divider orientation="vertical" flexItem sx={{ borderRightWidth: 2, my: 1 }} />

        <Box sx={{ px: 2 }}>
          <Select
            value={actionFilter}
            onChange={(event) => setActionFilter(event.target.value)}
            variant="standard"
            disableUnderline
            sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.875rem', minWidth: 150 }}
          >
            <MenuItem value="all">All Actions</MenuItem>
            {availableActions.map((action) => (
              <MenuItem key={action} value={action}>
                {formatLabel(action)}
              </MenuItem>
            ))}
          </Select>
        </Box>

        <Divider orientation="vertical" flexItem sx={{ borderRightWidth: 2, my: 1 }} />

        <Box sx={{ px: 2 }}>
          <Select
            value={kindFilter}
            onChange={(event) => setKindFilter(event.target.value as 'all' | AuditEventKind)}
            variant="standard"
            disableUnderline
            sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.875rem', minWidth: 120 }}
          >
            <MenuItem value="all">All Kinds</MenuItem>
            <MenuItem value="audit">Audit</MenuItem>
            <MenuItem value="activity">Activity</MenuItem>
          </Select>
        </Box>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          flex: 1,
          minHeight: 0,
          borderRadius: '16px',
          overflow: 'hidden',
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: theme.palette.mode === 'dark' ? 'none' : '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.02)',
          bgcolor: 'background.paper',
          '& .MuiDataGrid-root': { border: 'none' },
          '& .MuiDataGrid-columnHeaders': {
            bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.text.primary, 0.02) : '#f1f5f9',
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
            display: 'flex',
            alignItems: 'center',
          },
          '& .MuiDataGrid-row': {
            transition: 'all 0.2s',
            '&:hover': {
              bgcolor: 'background.default',
              cursor: 'pointer',
              transform: 'translateY(-1px)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            },
          },
        }}
      >
        <DataGrid
          rows={logs}
          columns={columns}
          loading={loading}
          onRowClick={handleRowClick}
          getRowId={(row) => row.id}
          initialState={{
            pagination: { paginationModel: { pageSize: 25 } },
            sorting: { sortModel: [{ field: 'created_at', sort: 'desc' }] },
          }}
          pageSizeOptions={[15, 25, 50, 100]}
          disableRowSelectionOnClick
          rowHeight={72}
          columnHeaderHeight={48}
        />
      </Paper>

      <HistoryDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        entityName={selectedEntity?.name || ''}
        events={entityHistory}
        loading={historyLoading}
      />
    </Box>
  );
}
