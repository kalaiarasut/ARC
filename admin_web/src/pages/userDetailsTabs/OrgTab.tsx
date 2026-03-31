import React from 'react';
import { Box, Paper, Typography, Divider } from '@mui/material';
import type { AdminUserProfile } from '../../types/adminManagement';
import { labelForOrganizationStatus, labelForOrganizationType } from '../../utils/adminManagementFormatters';

const DetailLine = ({ label, value, isDark }: { label: string; value: string; isDark: boolean }) => (
  <Box sx={{ mb: 1.5 }}>
    <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontWeight: 500 }}>
      {label}
    </Typography>
    <Typography variant="body2" sx={{ color: isDark ? '#f8fafc' : '#0f172a', fontWeight: 600 }}>
      {value}
    </Typography>
  </Box>
);

export const OrgTab: React.FC<{ isDark: boolean; user: AdminUserProfile }> = ({ isDark, user }) => {
  if (!user.organization) {
    return (
      <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, bgcolor: isDark ? '#1e293b' : '#ffffff' }}>
        <Typography variant="body1" sx={{ color: isDark ? '#cbd5e1' : '#475569', textAlign: 'center' }}>
          This user is currently not assigned to any organization.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, bgcolor: isDark ? '#1e293b' : '#ffffff' }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: isDark ? '#f8fafc' : '#0f172a', mb: 2 }}>
        Organization Mapping
      </Typography>
      <Divider sx={{ mb: 2, borderColor: isDark ? '#334155' : '#f1f5f9' }} />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
        <DetailLine label="Organization" value={user.organization.name} isDark={isDark} />
        <DetailLine label="Short Name" value={user.organization.short_name} isDark={isDark} />
        <DetailLine label="Organization Type" value={labelForOrganizationType(user.organization.org_type)} isDark={isDark} />
        <DetailLine label="Organization Status" value={labelForOrganizationStatus(user.organization.status)} isDark={isDark} />
      </Box>
    </Paper>
  );
};
