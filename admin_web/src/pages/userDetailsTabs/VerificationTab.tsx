import React from 'react';
import { Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import type { VerificationCase } from '../../types/adminManagement';
import { EmptyState } from '../../components/shared/StateDisplays';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import {
  labelForVerificationCheckType,
  labelForVerificationStatus,
} from '../../utils/adminManagementFormatters';
import { StatusChip } from '../../components/shared/StatusChip';

export const VerificationTab: React.FC<{ isDark: boolean; cases: VerificationCase[] }> = ({ isDark, cases }) => {
  if (cases.length === 0) {
    return (
      <EmptyState
        title="No Verification Records"
        description="This user has not submitted any verification requests yet."
        icon={<VerifiedUserIcon sx={{ fontSize: 64, color: isDark ? '#475569' : '#cbd5e1' }} />}
      />
    );
  }

  return (
    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, bgcolor: isDark ? '#1e293b' : '#ffffff' }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: isDark ? '#f8fafc' : '#0f172a', mb: 2 }}>
        Verification Timeline
      </Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>Submitted At</TableCell>
            <TableCell sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>Check Type</TableCell>
            <TableCell sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>Status</TableCell>
            <TableCell sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>Assigned Admin</TableCell>
            <TableCell sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>Notes</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {cases.map((item) => (
            <TableRow key={item.id}>
              <TableCell sx={{ color: isDark ? '#cbd5e1' : '#475569' }}>{new Date(item.submitted_at).toLocaleString()}</TableCell>
              <TableCell sx={{ color: isDark ? '#e2e8f0' : '#334155', fontWeight: 600 }}>
                {labelForVerificationCheckType(item.check_type)}
              </TableCell>
              <TableCell>
                <StatusChip status={labelForVerificationStatus(item.status)} />
              </TableCell>
              <TableCell sx={{ color: isDark ? '#cbd5e1' : '#475569' }}>
                {item.assigned_admin?.full_name ?? 'Unassigned'}
              </TableCell>
              <TableCell sx={{ color: isDark ? '#cbd5e1' : '#475569' }}>
                {item.notes ?? 'N/A'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
};
