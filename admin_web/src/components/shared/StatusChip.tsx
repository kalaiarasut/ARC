import React from 'react';
import { Chip, alpha } from '@mui/material';
import { useThemeContext } from '../../contexts/ThemeContext';

export type StatusType = 
  | 'Active' | 'Approved' | 'Verified' 
  | 'Suspended' | 'Rejected' | 'Locked' | 'Candidate' | 'Escalated' | 'Error'
  | 'Pending Verification' | 'Pending Approval' | 'Awaiting Rework' | 'Warning'
  | 'Deactivated' | 'Terminated' | 'Default'
  | 'New Submission' | 'In Review' | 'Info' 
  | string;

export interface StatusChipProps {
  status: StatusType;
  size?: 'small' | 'medium';
}

export const getStatusColors = (status: string, isDark: boolean) => {
  const normalizedStatus = status.toLowerCase().replace(/_/g, ' ');

  // Success / Positive
  if (['active', 'approved', 'success', 'verified', 'sent'].includes(normalizedStatus)) {
    return { bg: isDark ? alpha('#10b981', 0.1) : '#dcfce7', color: isDark ? '#34d399' : '#166534' };
  }
  // Error / Negative
  if (['suspended', 'rejected', 'escalated', 'error', 'terminated', 'failed'].includes(normalizedStatus)) {
    return { bg: isDark ? alpha('#ef4444', 0.1) : '#fee2e2', color: isDark ? '#f87171' : '#991b1b' };
  }
  // Warning / Pending
  if (['pending verification', 'pending approval', 'awaiting rework', 'warning', 'pending', 'deactivated', 'locked', 'skipped', 'queued'].includes(normalizedStatus)) {
    return { bg: isDark ? alpha('#f59e0b', 0.1) : '#fef3c7', color: isDark ? '#fbbf24' : '#92400e' };
  }
  // Info / Blue
  if (['new submission', 'in review', 'info', 'candidate'].includes(normalizedStatus)) {
    return { bg: isDark ? alpha('#3b82f6', 0.1) : '#eff6ff', color: isDark ? '#60a5fa' : '#2563eb' };
  }
  
  // Default / Neutral
  return { bg: isDark ? alpha('#6b7280', 0.1) : '#f3f4f6', color: isDark ? '#9ca3af' : '#1f2937' };
};

export const getVerificationColor = (tier: string, isDark: boolean) => {
  const normalizedTier = tier.toLowerCase().replace(/_/g, ' ');
  if (normalizedTier === 'tier 3') return { color: '#0ea5e9', bg: isDark ? alpha('#0ea5e9', 0.1) : '#e0f2fe' };
  if (normalizedTier === 'tier 2') return { color: '#8b5cf6', bg: isDark ? alpha('#8b5cf6', 0.1) : '#f3e8ff' };
  return { color: '#64748b', bg: isDark ? alpha('#64748b', 0.1) : '#f1f5f9' };
};

export const StatusChip: React.FC<StatusChipProps> = ({ status, size = 'small' }) => {
  const { mode } = useThemeContext();
  const isDark = mode === 'dark';
  const colors = getStatusColors(status, isDark);

  return (
    <Chip 
      label={status} 
      size={size} 
      sx={{ 
        bgcolor: colors.bg, 
        color: colors.color, 
        fontWeight: 600, 
        height: size === 'small' ? 24 : 32, 
        fontSize: size === 'small' ? '0.75rem' : '0.875rem',
        borderRadius: size === 'small' ? 2 : 3,
        px: size === 'small' ? 0.5 : 1
      }} 
    />
  );
};
