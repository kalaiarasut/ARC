import React from 'react';
import { Box, Chip, Divider, Paper, Typography } from '@mui/material';
import type { AdminUserProfile, VerificationCase } from '../../types/adminManagement';
import {
  labelForUserStatus,
  labelForUserType,
  labelForVerificationTier,
} from '../../utils/adminManagementFormatters';

const InfoRow = ({ label, value, isDark }: { label: string; value: React.ReactNode; isDark: boolean }) => (
  <Box sx={{ mb: 2 }}>
    <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', display: 'block', mb: 0.5, fontWeight: 500 }}>
      {label}
    </Typography>
    <Typography variant="body2" sx={{ color: isDark ? '#f8fafc' : '#0f172a', fontWeight: 500 }}>
      {value}
    </Typography>
  </Box>
);

export const OverviewTab: React.FC<{
  isDark: boolean;
  user: AdminUserProfile;
  verificationCases: VerificationCase[];
}> = ({ isDark, user, verificationCases }) => {
  const openCases = verificationCases.filter((item) => !['approved', 'rejected', 'escalated'].includes(item.status)).length;
  const approvedCases = verificationCases.filter((item) => item.status === 'approved').length;

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '7fr 5fr' }, gap: 3 }}>
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, bgcolor: isDark ? '#1e293b' : '#ffffff' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: isDark ? '#f8fafc' : '#0f172a' }}>
          Identity & Contact
        </Typography>
        <Divider sx={{ mb: 2.5, borderColor: isDark ? '#334155' : '#f1f5f9' }} />
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
          <Box>
            <InfoRow label="Full Name" value={user.full_name} isDark={isDark} />
            <InfoRow label="Email Address" value={user.email} isDark={isDark} />
            <InfoRow label="Phone Number" value={user.phone ?? 'N/A'} isDark={isDark} />
            <InfoRow label="Designation" value={user.designation ?? 'N/A'} isDark={isDark} />
          </Box>
          <Box>
            <InfoRow label="Role" value={labelForUserType(user.user_type)} isDark={isDark} />
            <InfoRow label="State / District" value={`${user.state}${user.district ? `, ${user.district}` : ''}`} isDark={isDark} />
            <InfoRow label="Created At" value={new Date(user.created_at).toLocaleString()} isDark={isDark} />
            <InfoRow label="Last Login" value={user.last_login_at ? new Date(user.last_login_at).toLocaleString() : 'Never'} isDark={isDark} />
          </Box>
        </Box>
      </Paper>

      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, bgcolor: isDark ? '#1e293b' : '#ffffff' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: isDark ? '#f8fafc' : '#0f172a' }}>
          Account Snapshot
        </Typography>
        <Divider sx={{ mb: 2.5, borderColor: isDark ? '#334155' : '#f1f5f9' }} />
        <InfoRow label="Account Status" value={<Chip label={labelForUserStatus(user.status)} size="small" />} isDark={isDark} />
        <InfoRow label="Verification Tier" value={<Chip label={labelForVerificationTier(user.verification_tier)} size="small" />} isDark={isDark} />
        <InfoRow label="Open Verification Cases" value={openCases} isDark={isDark} />
        <InfoRow label="Approved Cases" value={approvedCases} isDark={isDark} />
        <InfoRow label="Organization" value={user.organization?.name ?? 'Unassigned'} isDark={isDark} />
      </Paper>
    </Box>
  );
};
