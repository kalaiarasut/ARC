import { memo } from 'react';
import {
  Box,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined';
import ScheduleIcon from '@mui/icons-material/Schedule';
import { format } from 'date-fns';
import type { OfficialAdvisory } from '../../types/advisory';
import { CATEGORIES, SEVERITIES } from './steps/AdvisoryContentStep';

export interface AdvisoriesTableProps {
  items: OfficialAdvisory[];
  loading: boolean;
  totalCount: number;
  page: number;
  rowsPerPage: number;
  isAdmin: boolean;
  deletingId: string | null;
  onDelete: (id: string) => void;
  onPageChange: (newPage: number) => void;
  onRowsPerPageChange: (newRowsPerPage: number) => void;
}

const formatDateTime = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '—';
  try {
    return format(new Date(dateStr), 'MMM d, yyyy HH:mm');
  } catch {
    return '—';
  }
};

const TableSkeleton = () => {
  return (
    <>
      {[1, 2, 3, 4, 5].map((i) => (
        <TableRow key={i}>
          <TableCell>
            <Skeleton variant="text" width={100} />
          </TableCell>
          <TableCell>
            <Skeleton variant="rounded" width={60} height={24} sx={{ borderRadius: 1.5 }} />
          </TableCell>
          <TableCell>
            <Skeleton variant="rounded" width={50} height={24} sx={{ borderRadius: 1.5 }} />
          </TableCell>
          <TableCell>
            <Skeleton variant="text" width={200} />
            <Skeleton variant="text" width={120} sx={{ mt: 0.5 }} />
          </TableCell>
          <TableCell>
            <Skeleton variant="text" width={80} />
          </TableCell>
          <TableCell>
            <Skeleton variant="text" width={100} />
            <Skeleton variant="text" width={100} sx={{ mt: 0.5 }} />
          </TableCell>
          <TableCell align="right">
            <Skeleton variant="circular" width={32} height={32} />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
};

export const AdvisoriesTable = memo(function AdvisoriesTable({
  items,
  loading,
  totalCount,
  page,
  rowsPerPage,
  isAdmin,
  deletingId,
  onDelete,
  onPageChange,
  onRowsPerPageChange,
}: AdvisoriesTableProps) {
  const theme = useTheme();

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: '20px',
        overflow: 'hidden',
        border: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
        bgcolor: 'background.paper',
        boxShadow: `0 4px 24px ${alpha(theme.palette.common.black, 0.04)}`,
      }}
    >
      {/* Table Header */}
      <Box
        sx={{
          px: 3,
          py: 2.5,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: `linear-gradient(135deg,
            ${alpha(theme.palette.primary.main, 0.03)} 0%,
            ${alpha(theme.palette.background.paper, 1)} 100%)`,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              width: 4,
              height: 24,
              borderRadius: 2,
              background: `linear-gradient(180deg,
                ${theme.palette.primary.main} 0%,
                ${theme.palette.primary.dark} 100%)`,
            }}
          />
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              color: 'primary.main',
            }}
          >
            <CampaignOutlinedIcon sx={{ fontSize: 20 }} />
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight={700}>
              Recent Updates
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {totalCount} total {totalCount === 1 ? 'advisory' : 'advisories'}
            </Typography>
          </Box>
        </Stack>
      </Box>

      {/* Table */}
      <TableContainer>
        <Table size="medium">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Published</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Severity</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Title</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Region</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Validity</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableSkeleton />
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                  <Stack alignItems="center" spacing={1}>
                    <CampaignOutlinedIcon
                      sx={{ fontSize: 48, color: 'text.disabled', opacity: 0.5 }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      No official updates published yet.
                    </Typography>
                  </Stack>
                </TableCell>
              </TableRow>
            ) : (
              items.map((item, index) => {
                const categoryMeta = CATEGORIES.find((c) => c.value === item.category);
                const severityMeta = SEVERITIES.find((s) => s.value === item.severity);
                const isDeleting = deletingId === item.id;

                return (
                  <TableRow
                    key={item.id}
                    hover
                    sx={{
                      transition: 'all 0.2s ease',
                      bgcolor: index % 2 === 0 ? 'transparent' : alpha(theme.palette.grey[50], 0.5),
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.04),
                        '& .action-buttons': {
                          opacity: 1,
                        },
                      },
                    }}
                  >
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <ScheduleIcon
                          sx={{ fontSize: 16, color: 'text.secondary', opacity: 0.7 }}
                        />
                        <Typography variant="body2" fontWeight={500}>
                          {formatDateTime(item.published_at)}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={categoryMeta?.label ?? item.category}
                        sx={{
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          height: 26,
                          borderRadius: '6px',
                          bgcolor: alpha(categoryMeta?.color ?? theme.palette.grey[500], 0.1),
                          color: categoryMeta?.color ?? 'text.secondary',
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={severityMeta?.label ?? item.severity}
                        sx={{
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          height: 26,
                          borderRadius: '6px',
                          bgcolor: alpha(severityMeta?.color ?? theme.palette.grey[500], 0.1),
                          color: severityMeta?.color ?? 'text.secondary',
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Stack spacing={0.5}>
                        <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.4 }}>
                          {item.title}
                        </Typography>
                        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                          <Chip
                            size="small"
                            label={`Source: ${item.source_language.toUpperCase()}`}
                            variant="outlined"
                            sx={{
                              height: 20,
                              fontSize: '0.6875rem',
                              borderRadius: '4px',
                              '& .MuiChip-label': { px: 0.75 },
                            }}
                          />
                          {item.latitude !== null && item.longitude !== null && (
                            <Chip
                              size="small"
                              label={`Targeted${item.radius_km ? ` · ${item.radius_km} km` : ''}`}
                              variant="outlined"
                              sx={{
                                height: 20,
                                fontSize: '0.6875rem',
                                borderRadius: '4px',
                                '& .MuiChip-label': { px: 0.75 },
                              }}
                            />
                          )}
                        </Stack>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {item.region || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Stack spacing={0.25}>
                        <Typography variant="caption" color="text.secondary">
                          Start: {formatDateTime(item.starts_at)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          End: {formatDateTime(item.expires_at)}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title={isAdmin ? 'Delete update' : 'Admin access required'}>
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => onDelete(item.id)}
                            disabled={!isAdmin || isDeleting}
                            className="action-buttons"
                            sx={{
                              color: 'error.main',
                              opacity: { xs: 1, md: 0.6 },
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                bgcolor: alpha(theme.palette.error.main, 0.1),
                                opacity: 1,
                              },
                            }}
                          >
                            {isDeleting ? (
                              <CircularProgress size={18} color="inherit" />
                            ) : (
                              <DeleteOutlineIcon sx={{ fontSize: 20 }} />
                            )}
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <TablePagination
        component="div"
        count={totalCount}
        page={page}
        onPageChange={(_, newPage) => onPageChange(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(event) => {
          onRowsPerPageChange(parseInt(event.target.value, 10));
        }}
        rowsPerPageOptions={[10, 25, 50, 100]}
        sx={{
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
          '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
            fontWeight: 500,
          },
        }}
      />
    </Paper>
  );
});
