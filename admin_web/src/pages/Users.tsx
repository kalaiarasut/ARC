import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Snackbar,
  Alert,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DownloadIcon from '@mui/icons-material/Download';
import { useNavigate } from 'react-router-dom';
import { useThemeContext } from '../contexts/ThemeContext';
import { organizationService } from '../services/organizationService';
import { userManagementService } from '../services/userManagementService';
import type {
  AdminUserProfile,
  Organization,
  UserStatus,
} from '../types/adminManagement';
import {
  labelForUserStatus,
  labelForUserType,
  labelForVerificationTier,
} from '../utils/adminManagementFormatters';
import { ActionMenu, type ActionMenuItem } from '../components/shared/ActionMenu';
import { ConfirmDialog } from '../components/shared/ConfirmDialog';
import { EntityTable, type TableColumn } from '../components/shared/EntityTable';
import { FilterBar, type FilterConfig } from '../components/shared/FilterBar';
import { StatusChip, getVerificationColor } from '../components/shared/StatusChip';
import { UserAvatar } from '../components/shared/UserAvatar';

const PAGE_SIZE = 10;

const statusOptions: Array<{ value: UserStatus; label: string }> = [
  { value: 'active', label: 'Active' },
  { value: 'pending_verification', label: 'Pending Verification' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'deactivated', label: 'Deactivated' },
  { value: 'terminated', label: 'Terminated' },
];

const roleOptions = [
  { value: 'system_admin', label: 'System Admin' },
  { value: 'government_official', label: 'Government Official' },
  { value: 'ngo_staff', label: 'NGO Staff' },
];

const tierOptions = [
  { value: 'tier_1', label: 'Tier 1' },
  { value: 'tier_2', label: 'Tier 2' },
  { value: 'tier_3', label: 'Tier 3' },
];

interface StatusDialogState {
  open: boolean;
  user: AdminUserProfile | null;
  targetStatus: UserStatus | null;
  reason: string;
  loading: boolean;
}

export const Users: React.FC = () => {
  const { mode } = useThemeContext();
  const isDark = mode === 'dark';
  const navigate = useNavigate();

  const [users, setUsers] = useState<AdminUserProfile[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [tierFilter, setTierFilter] = useState('all');
  const [orgFilter, setOrgFilter] = useState('all');

  const [snack, setSnack] = useState<{ open: boolean; text: string; severity: 'success' | 'error' }>({
    open: false,
    text: '',
    severity: 'success',
  });

  const [statusDialog, setStatusDialog] = useState<StatusDialogState>({
    open: false,
    user: null,
    targetStatus: null,
    reason: '',
    loading: false,
  });

  const loadOrganizations = useCallback(async () => {
    try {
      const result = await organizationService.getOrganizations({ page: 0, pageSize: 200 });
      setOrganizations(result.data);
    } catch {
      setOrganizations([]);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await userManagementService.getUsers({
        page,
        pageSize: PAGE_SIZE,
        search,
        status: statusFilter === 'all' ? 'all' : (statusFilter as UserStatus),
        userType: roleFilter as 'all' | 'system_admin' | 'government_official' | 'ngo_staff',
        organizationId: orgFilter === 'all' ? 'all' : orgFilter,
        verificationTier: tierFilter as 'all' | 'tier_1' | 'tier_2' | 'tier_3',
      });
      setUsers(result.data);
      setTotalUsers(result.total);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load users';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [orgFilter, page, roleFilter, search, statusFilter, tierFilter]);

  useEffect(() => {
    void loadOrganizations();
  }, [loadOrganizations]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const openStatusDialog = (user: AdminUserProfile, targetStatus: UserStatus) => {
    setStatusDialog({
      open: true,
      user,
      targetStatus,
      reason: '',
      loading: false,
    });
  };

  const closeStatusDialog = () => {
    setStatusDialog({
      open: false,
      user: null,
      targetStatus: null,
      reason: '',
      loading: false,
    });
  };

  const confirmStatusChange = async () => {
    if (!statusDialog.user || !statusDialog.targetStatus) return;
    setStatusDialog((prev) => ({ ...prev, loading: true }));
    try {
      await userManagementService.setUserStatus({
        userId: statusDialog.user.user_id,
        status: statusDialog.targetStatus,
        reason: statusDialog.reason,
      });
      setSnack({
        open: true,
        text: `${statusDialog.user.full_name} updated to ${labelForUserStatus(statusDialog.targetStatus)}.`,
        severity: 'success',
      });
      closeStatusDialog();
      await loadUsers();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update user status';
      setSnack({ open: true, text: message, severity: 'error' });
      setStatusDialog((prev) => ({ ...prev, loading: false }));
    }
  };

  const exportVisibleCsv = () => {
    const lines = [
      ['User ID', 'Full Name', 'Email', 'Role', 'Organization', 'Verification Tier', 'Status', 'State', 'Created At'].join(','),
      ...users.map((u) =>
        [
          u.user_id,
          `"${u.full_name}"`,
          u.email,
          labelForUserType(u.user_type),
          `"${u.organization?.name ?? 'Unassigned'}"`,
          labelForVerificationTier(u.verification_tier),
          labelForUserStatus(u.status),
          u.state,
          u.created_at,
        ].join(',')
      ),
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'users_export.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const filterConfig: FilterConfig[] = useMemo(
    () => [
      { name: 'status', label: 'Status', options: statusOptions, defaultValue: 'all' },
      { name: 'role', label: 'Role', options: roleOptions, defaultValue: 'all' },
      { name: 'tier', label: 'Tier', options: tierOptions, defaultValue: 'all' },
      {
        name: 'organization',
        label: 'Organization',
        options: organizations.map((org) => ({ value: org.id, label: org.short_name })),
        defaultValue: 'all',
      },
    ],
    [organizations]
  );

  const columns: TableColumn<AdminUserProfile>[] = useMemo(
    () => [
      {
        key: 'identity',
        label: 'User & Contact',
        renderCell: (user) => (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <UserAvatar name={user.full_name} src={user.avatar_url} size={34} />
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 700, color: isDark ? '#f8fafc' : '#0f172a' }}>
                {user.full_name}
              </Typography>
              <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                {user.email}
              </Typography>
            </Box>
          </Box>
        ),
      },
      {
        key: 'roleOrg',
        label: 'Role & Org',
        renderCell: (user) => (
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600, color: isDark ? '#e2e8f0' : '#334155' }}>
              {labelForUserType(user.user_type)}
            </Typography>
            <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
              {user.organization?.name ?? 'Unassigned'}
            </Typography>
          </Box>
        ),
      },
      {
        key: 'verification',
        label: 'Verification',
        renderCell: (user) => {
          const tierLabel = labelForVerificationTier(user.verification_tier);
          const colors = getVerificationColor(tierLabel, isDark);
          return (
            <Chip
              label={tierLabel}
              size="small"
              sx={{ bgcolor: colors.bg, color: colors.color, fontWeight: 600, borderRadius: 1, height: 24 }}
            />
          );
        },
      },
      {
        key: 'location',
        label: 'State / District',
        renderCell: (user) => (
          <Box>
            <Typography variant="body2" sx={{ color: isDark ? '#cbd5e1' : '#475569' }}>
              {user.state}
            </Typography>
            <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
              {user.district ?? 'N/A'}
            </Typography>
          </Box>
        ),
      },
      {
        key: 'status',
        label: 'Status',
        renderCell: (user) => <StatusChip status={labelForUserStatus(user.status)} />,
      },
      {
        key: 'actions',
        label: 'Action',
        width: 70,
        align: 'center',
        renderCell: (user) => {
          const menuItems: ActionMenuItem[] = [
            {
              label: 'View Details',
              onClick: () => navigate(`/users/${user.user_id}`),
            },
            {
              label: 'Edit User',
              onClick: () => navigate(`/users/${user.user_id}/edit`),
            },
          ];

          if (user.status === 'active') {
            menuItems.push({
              label: 'Suspend User',
              color: 'warning' as const,
              onClick: () => openStatusDialog(user, 'suspended'),
            });
          } else if (user.status === 'suspended' || user.status === 'deactivated') {
            menuItems.push({
              label: 'Activate User',
              color: 'success' as const,
              onClick: () => openStatusDialog(user, 'active'),
            });
          } else if (user.status === 'pending_verification') {
            menuItems.push({
              label: 'Deactivate User',
              color: 'warning' as const,
              onClick: () => openStatusDialog(user, 'deactivated'),
            });
          }

          if (user.status !== 'terminated') {
            menuItems.push({
              label: 'Terminate User',
              color: 'error' as const,
              onClick: () => openStatusDialog(user, 'terminated'),
            });
          }

          return <ActionMenu id={user.user_id} items={menuItems} />;
        },
      },
    ],
    [isDark, navigate]
  );

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 3, p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "text.primary" }}>
            User Management
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
            Manage platform users, roles, verification, suspension, and lifecycle actions.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button size="small" variant="outlined" startIcon={<DownloadIcon />} onClick={exportVisibleCsv} sx={{ textTransform: 'none', borderRadius: 2 }}>
            Export CSV
          </Button>
          <Button
            size="small"
            variant="contained"
            onClick={() => navigate('/users/create')}
            startIcon={<AddIcon />}
            sx={{ textTransform: 'none', borderRadius: 2, bgcolor: '#0D9488', '&:hover': { bgcolor: '#0F766E' } }}
          >
            Add New User
          </Button>
        </Box>
      </Box>

      <FilterBar
        searchPlaceholder="Search by name, email, phone, state, or designation..."
        searchValue={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(0);
        }}
        filters={filterConfig}
        filterValues={{
          status: statusFilter,
          role: roleFilter,
          tier: tierFilter,
          organization: orgFilter,
        }}
        onFilterChange={(name, value) => {
          setPage(0);
          if (name === 'status') setStatusFilter(value);
          if (name === 'role') setRoleFilter(value);
          if (name === 'tier') setTierFilter(value);
          if (name === 'organization') setOrgFilter(value);
        }}
      />

      <EntityTable<AdminUserProfile>
        columns={columns}
        rows={users}
        total={totalUsers}
        page={page}
        pageSize={PAGE_SIZE}
        loading={loading}
        error={error}
        onRetry={loadUsers}
        onPageChange={setPage}
        getRowKey={(row) => row.user_id}
        onRowDoubleClick={(row) => navigate(`/users/${row.user_id}`)}
        emptyTitle="No users found"
        emptyDescription="Try changing filters or add a new user to get started."
      />

      <ConfirmDialog
        open={statusDialog.open}
        title={statusDialog.targetStatus ? `Set user as ${labelForUserStatus(statusDialog.targetStatus)}?` : 'Update user status'}
        description={
          statusDialog.user
            ? `This action will update ${statusDialog.user.full_name}'s lifecycle status and write an audit entry.`
            : 'This action updates user lifecycle status.'
        }
        confirmLabel="Confirm Update"
        confirmColor={statusDialog.targetStatus === 'terminated' ? 'error' : 'warning'}
        requireReason
        reasonLabel="Change Reason"
        reasonPlaceholder="Enter a brief reason for audit trail"
        reasonValue={statusDialog.reason}
        onReasonChange={(value) => setStatusDialog((prev) => ({ ...prev, reason: value }))}
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
        <Alert
          severity={snack.severity}
          variant="filled"
          onClose={() => setSnack((prev) => ({ ...prev, open: false }))}
        >
          {snack.text}
        </Alert>
      </Snackbar>
    </Box>
  );
};
