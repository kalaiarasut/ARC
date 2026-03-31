import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Chip,
  Paper,
  Snackbar,
  Typography,
  useTheme,
  alpha
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { useThemeContext } from '../contexts/ThemeContext';
import { userManagementService } from '../services/userManagementService';
import type { AdminUserProfile, AuditEvent, UserStatus, VerificationCase } from '../types/adminManagement';
import { labelForUserType } from '../utils/adminManagementFormatters';
import { ConfirmDialog } from '../components/shared/ConfirmDialog';
import { DetailTabs } from '../components/shared/DetailTabs';
import { UserAvatar } from '../components/shared/UserAvatar';
import { LoadingState } from '../components/shared/StateDisplays';
import { OverviewTab } from './userDetailsTabs/OverviewTab';
import { OrgTab } from './userDetailsTabs/OrgTab';
import { VerificationTab } from './userDetailsTabs/VerificationTab';
import { ActivityTab } from './userDetailsTabs/ActivityTab';
import { LifecycleTab } from './userDetailsTabs/LifecycleTab';

interface StatusDialogState {
  open: boolean;
  targetStatus: UserStatus | null;
  reason: string;
  loading: boolean;
}

export const UserDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const { mode } = useThemeContext();
  const isDark = mode === 'dark';

  const [activeTab, setActiveTab] = useState('overview');
  const [user, setUser] = useState<AdminUserProfile | null>(null);
  const [verificationCases, setVerificationCases] = useState<VerificationCase[]>([]);
  const [audits, setAudits] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusDialog, setStatusDialog] = useState<StatusDialogState>({
    open: false,
    targetStatus: null,
    reason: '',
    loading: false,
  });

  const [snack, setSnack] = useState<{ open: boolean; text: string; severity: 'success' | 'error' }>({
    open: false,
    text: '',
    severity: 'success',
  });

  const loadUserData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [profile, cases, statusAudit] = await Promise.all([
        userManagementService.getUserById(id),
        userManagementService.getUserVerificationCases(id),
        userManagementService.getUserStatusAudit(id),
      ]);

      if (!profile) {
        setError('User not found.');
        setUser(null);
        return;
      }

      setUser(profile);
      setVerificationCases(cases);
      setAudits(statusAudit);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load user details';
      setError(message);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadUserData();
  }, [loadUserData]);

  const openStatusDialog = (targetStatus: UserStatus) => {
    setStatusDialog({
      open: true,
      targetStatus,
      reason: '',
      loading: false,
    });
  };

  const closeStatusDialog = () => {
    setStatusDialog({
      open: false,
      targetStatus: null,
      reason: '',
      loading: false,
    });
  };

  const confirmStatusChange = async () => {
    if (!user || !statusDialog.targetStatus) return;
    setStatusDialog((prev) => ({ ...prev, loading: true }));
    try {
      await userManagementService.setUserStatus({
        userId: user.user_id,
        status: statusDialog.targetStatus,
        reason: statusDialog.reason,
      });
      setSnack({ open: true, text: 'User lifecycle updated successfully.', severity: 'success' });
      closeStatusDialog();
      await loadUserData();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update lifecycle status';
      setSnack({ open: true, text: message, severity: 'error' });
      setStatusDialog((prev) => ({ ...prev, loading: false }));
    }
  };

  const tabs = useMemo(() => {
    if (!user) return [];
    return [
      { label: 'Overview', value: 'overview', content: <OverviewTab isDark={isDark} user={user} verificationCases={verificationCases} /> },
      { label: 'Organization', value: 'organization', content: <OrgTab isDark={isDark} user={user} /> },
      { label: 'Verification', value: 'verification', content: <VerificationTab isDark={isDark} cases={verificationCases} /> },
      { label: 'Activity', value: 'activity', content: <ActivityTab isDark={isDark} audits={audits} /> },
      { label: 'Lifecycle', value: 'lifecycle', content: <LifecycleTab isDark={isDark} user={user} onStatusAction={openStatusDialog} /> },
    ];
  }, [audits, isDark, user, verificationCases]);

  if (loading) {
    return (
      <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 3, p: { xs: 2, md: 4 }, maxWidth: '1200px', mx: 'auto' }}>
        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} aria-label="breadcrumb" sx={{ mb: -1 }}>
          <Typography component="button" color="inherit" onClick={() => navigate('/users')} sx={{ cursor: 'pointer', border: 'none', background: 'none', p: 0, fontSize: '0.875rem', '&:hover': { color: 'primary.main', textDecoration: 'underline' } }}>
            User List
          </Typography>
          <Typography color="text.primary" sx={{ fontSize: '0.875rem', fontWeight: 600 }}>User Details</Typography>
        </Breadcrumbs>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: isDark ? '#f8fafc' : '#0f172a', mb: 0.5 }}>
              User Details
            </Typography>
            <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
              Live profile, verification, and lifecycle audit state.
            </Typography>
          </Box>
        </Box>
        <LoadingState type="details" message="Loading user details..." />
      </Box>
    );
  }

  if (error || !user) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>Unable to Load User</Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>{error ?? 'User not found.'}</Typography>
        <Button variant="contained" onClick={() => navigate('/users')}>Back to Users</Button>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 3, p: { xs: 2, md: 4 }, maxWidth: '1200px', mx: 'auto' }}>
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} aria-label="breadcrumb" sx={{ mb: -1 }}>
        <Typography component="button" color="inherit" onClick={() => navigate('/users')} sx={{ cursor: 'pointer', border: 'none', background: 'none', p: 0, fontSize: '0.875rem', '&:hover': { color: 'primary.main', textDecoration: 'underline' } }}>
          User List
        </Typography>
        <Typography color="text.primary" sx={{ fontSize: '0.875rem', fontWeight: 600 }}>User Details</Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: isDark ? '#f8fafc' : '#0f172a', mb: 0.5 }}>
            User Details
          </Typography>
          <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
            Live profile, verification, and lifecycle audit state.
          </Typography>
        </Box>
        <Button
          variant="contained"
          endIcon={<KeyboardArrowDownIcon />}
          onClick={() => navigate(`/users/${user.user_id}/edit`)}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: '10px',
            color: theme.palette.primary.main,
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            boxShadow: 'none',
            '&:hover': {
              bgcolor: alpha(theme.palette.primary.main, 0.2),
              boxShadow: 'none',
            },
            px: 3, 
            py: 1
          }}
        >
          Edit Profile
        </Button>
      </Box>

      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, bgcolor: isDark ? '#1e293b' : '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <UserAvatar name={user.full_name} src={user.avatar_url} size={64} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: isDark ? '#f8fafc' : '#0f172a', mb: 0.25 }}>{user.full_name}</Typography>
            <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
              User ID: {user.user_id}
            </Typography>
          </Box>
        </Box>
        <Chip label={labelForUserType(user.user_type)} sx={{ bgcolor: isDark ? 'rgba(59,130,246,0.1)' : '#eff6ff', color: '#3b82f6', fontWeight: 600, borderRadius: 2, height: 28 }} />
      </Paper>

      <DetailTabs tabs={tabs} value={activeTab} onChange={setActiveTab} />

      <ConfirmDialog
        open={statusDialog.open}
        title={statusDialog.targetStatus ? `Set status to ${statusDialog.targetStatus}?` : 'Update lifecycle status'}
        description="This action updates the lifecycle state and records an audit entry."
        confirmLabel="Apply Status"
        confirmColor={statusDialog.targetStatus === 'terminated' ? 'error' : 'warning'}
        requireReason
        reasonLabel="Lifecycle Reason"
        reasonPlaceholder="Enter reason for status transition"
        reasonValue={statusDialog.reason}
        onReasonChange={(value) => setStatusDialog((prev) => ({ ...prev, reason: value }))}
        expectedMatch={statusDialog.targetStatus === 'terminated' || statusDialog.targetStatus === 'suspended' ? user?.full_name : undefined}
        matchLabel={`Type "${user?.full_name}" to confirm`}
        submitting={statusDialog.loading}
        onCancel={closeStatusDialog}
        onConfirm={confirmStatusChange}
      />

      <Snackbar
        open={snack.open}
        autoHideDuration={3500}
        onClose={() => setSnack((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snack.severity} variant="filled" onClose={() => setSnack((prev) => ({ ...prev, open: false }))}>
          {snack.text}
        </Alert>
      </Snackbar>
    </Box>
  );
};
