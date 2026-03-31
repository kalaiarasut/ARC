import React from 'react';
import { Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import type { AuditEvent } from '../../types/adminManagement';
import { EmptyState } from '../../components/shared/StateDisplays';
import HistoryIcon from '@mui/icons-material/History';

export const ActivityTab: React.FC<{ isDark: boolean; audits: AuditEvent[] }> = ({ isDark, audits }) => {
  if (audits.length === 0) {
    return (
      <EmptyState
        title="No Activity Record"
        description="There are no lifecycle status or audit logs associated with this user."
        icon={<HistoryIcon sx={{ fontSize: 64, color: isDark ? '#475569' : '#cbd5e1' }} />}
      />
    );
  }

  return (
    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, bgcolor: isDark ? '#1e293b' : '#ffffff' }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: isDark ? '#f8fafc' : '#0f172a', mb: 2 }}>
        User Status Audit Trail
      </Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>Timestamp</TableCell>
            <TableCell sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>Old Status</TableCell>
            <TableCell sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>New Status</TableCell>
            <TableCell sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>Reason</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {audits.map((item) => (
            <TableRow key={item.id}>
              <TableCell sx={{ color: isDark ? '#cbd5e1' : '#475569' }}>{new Date(item.changed_at).toLocaleString()}</TableCell>
              <TableCell sx={{ color: isDark ? '#cbd5e1' : '#475569' }}>{item.old_status ?? 'N/A'}</TableCell>
              <TableCell sx={{ color: isDark ? '#e2e8f0' : '#334155', fontWeight: 600 }}>{item.new_status}</TableCell>
              <TableCell sx={{ color: isDark ? '#cbd5e1' : '#475569' }}>{item.reason}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
};
