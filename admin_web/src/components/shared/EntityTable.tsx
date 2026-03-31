import React from 'react';
import {
  Box,
  Paper,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Skeleton,
} from '@mui/material';
import { useThemeContext } from '../../contexts/ThemeContext';
import { EmptyState, ErrorState } from './StateDisplays';

export interface TableColumn<T> {
  key: string;
  label: string;
  width?: number | string;
  align?: 'left' | 'right' | 'center';
  renderCell: (row: T) => React.ReactNode;
}

export interface EntityTableProps<T extends { id?: string; user_id?: string }> {
  columns: TableColumn<T>[];
  rows: T[];
  total: number;
  page: number;
  pageSize: number;
  loading?: boolean;
  error?: string | null;
  emptyTitle?: string;
  emptyDescription?: string;
  onPageChange: (page: number) => void;
  onRetry?: () => void;
  getRowKey?: (row: T) => string;
  onRowDoubleClick?: (row: T) => void;
}

export const EntityTable = <T extends { id?: string; user_id?: string }>({
  columns,
  rows,
  total,
  page,
  pageSize,
  loading = false,
  error = null,
  emptyTitle = 'No records found',
  emptyDescription = 'Try adjusting filters or adding new records.',
  onPageChange,
  onRetry,
  getRowKey,
  onRowDoubleClick,
}: EntityTableProps<T>) => {
  const { mode } = useThemeContext();
  const isDark = mode === 'dark';

  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  return (
    <TableContainer
      component={Paper}
      elevation={0}
      sx={{
        borderRadius: 3,
        border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
        bgcolor: isDark ? '#1e293b' : '#ffffff',
        overflow: 'hidden',
      }}
    >
      <Table>
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell
                key={column.key}
                align={column.align ?? 'left'}
                sx={{
                  fontWeight: 600,
                  color: isDark ? '#94a3b8' : '#64748b',
                  fontSize: '0.8125rem',
                  py: 1.5,
                  width: column.width,
                  bgcolor: isDark ? '#0f172a' : '#f8fafc',
                }}
              >
                {column.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            [...Array(pageSize || 5)].map((_, i) => (
              <TableRow key={`loading-${i}`} sx={{ '&:last-child td': { borderBottom: 0 } }}>
                {columns.map((column) => (
                  <TableCell key={`col-${column.key}`} align={column.align ?? 'left'} sx={{ py: 1.5 }}>
                    <Skeleton animation="wave" sx={{ bgcolor: isDark ? '#334155' : '#e2e8f0', borderRadius: 1 }} height={24} width={column.width === 50 ? 28 : (column.key === 'actions' ? 60 : '80%')} />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : error ? (
            <TableRow>
              <TableCell colSpan={columns.length} align="center" sx={{ borderBottom: 0 }}>
                <ErrorState error={error} onRetry={onRetry} />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} align="center" sx={{ borderBottom: 0 }}>
                <EmptyState title={emptyTitle} description={emptyDescription} />
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, index) => {
              const key = getRowKey?.(row) ?? row.id ?? row.user_id ?? `row-${index}`;
              return (
                <TableRow
                  key={key}
                  hover
                  sx={{
                    '&:last-child td': { borderBottom: 0 },
                    cursor: onRowDoubleClick ? 'pointer' : 'default',
                  }}
                  onDoubleClick={() => onRowDoubleClick?.(row)}
                >
                  {columns.map((column) => (
                    <TableCell key={column.key} align={column.align ?? 'left'} sx={{ py: 1.5 }}>
                      {column.renderCell(row)}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
      
      {!loading && !error && rows.length > 0 && pageCount > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, borderTop: `1px solid ${isDark ? '#334155' : '#e2e8f0'}` }}>
          <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
            Showing {(page * pageSize) + 1} to {Math.min((page + 1) * pageSize, total)} of {total} entries
          </Typography>
          <Pagination
            count={pageCount}
            page={page + 1}
            onChange={(_, p) => onPageChange(p - 1)}
            shape="rounded"
            color="primary"
          />
        </Box>
      )}
    </TableContainer>
  );
};
