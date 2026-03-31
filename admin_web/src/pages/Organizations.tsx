import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Snackbar,
  Alert,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useThemeContext } from '../contexts/ThemeContext';
import { organizationService } from '../services/organizationService';
import type { Organization, OrganizationStatus } from '../types/adminManagement';
import {
  labelForOrganizationStatus,
  labelForOrganizationType,
} from '../utils/adminManagementFormatters';
import { ActionMenu } from '../components/shared/ActionMenu';
import { ConfirmDialog } from '../components/shared/ConfirmDialog';
import { EntityTable, type TableColumn } from '../components/shared/EntityTable';
import { FilterBar } from '../components/shared/FilterBar';
import { StatusChip } from '../components/shared/StatusChip';

const PAGE_SIZE = 10;

interface StatusDialogState {
  open: boolean;
  organization: Organization | null;
  targetStatus: OrganizationStatus | null;
  reason: string;
  loading: boolean;
}

const initialCreateForm = {
  name: '',
  short_name: '',
  org_type: 'ngo' as 'ngo' | 'government',
  registration_code: '',
  state: '',
  district: '',
  contact_name: '',
  contact_email: '',
  contact_phone: '',
  website: '',
};

export const Organizations: React.FC = () => {
  const { mode } = useThemeContext();
  const isDark = mode === 'dark';

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [tabValue, setTabValue] = useState<OrganizationStatus>('approved');
  const [orgTypeFilter, setOrgTypeFilter] = useState('all');
  const [stats, setStats] = useState({ total: 0, pendingApproval: 0, activeNgo: 0 });

  const [snack, setSnack] = useState<{ open: boolean; text: string; severity: 'success' | 'error' }>({
    open: false,
    text: '',
    severity: 'success',
  });

  const [statusDialog, setStatusDialog] = useState<StatusDialogState>({
    open: false,
    organization: null,
    targetStatus: null,
    reason: '',
    loading: false,
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createForm, setCreateForm] = useState(initialCreateForm);

  const loadStats = useCallback(async () => {
    try {
      const data = await organizationService.getStats();
      setStats({
        total: data.total,
        pendingApproval: data.pendingApproval,
        activeNgo: data.activeNgo,
      });
    } catch {
      setStats({ total: 0, pendingApproval: 0, activeNgo: 0 });
    }
  }, []);

  const loadOrganizations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await organizationService.getOrganizations({
        page,
        pageSize: PAGE_SIZE,
        status: tabValue,
        orgType: orgTypeFilter === 'all' ? 'all' : (orgTypeFilter as 'government' | 'ngo'),
        search,
      });
      setOrganizations(result.data);
      setTotal(result.total);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load organizations';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [orgTypeFilter, page, search, tabValue]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  useEffect(() => {
    void loadOrganizations();
  }, [loadOrganizations]);

  const openStatusDialog = (organization: Organization, targetStatus: OrganizationStatus) => {
    setStatusDialog({
      open: true,
      organization,
      targetStatus,
      reason: '',
      loading: false,
    });
  };

  const closeStatusDialog = () => {
    setStatusDialog({
      open: false,
      organization: null,
      targetStatus: null,
      reason: '',
      loading: false,
    });
  };

  const confirmStatusChange = async () => {
    if (!statusDialog.organization || !statusDialog.targetStatus) return;

    setStatusDialog((prev) => ({ ...prev, loading: true }));
    try {
      await organizationService.setOrganizationStatus({
        organizationId: statusDialog.organization.id,
        status: statusDialog.targetStatus,
        reason: statusDialog.reason,
      });
      setSnack({
        open: true,
        text: `${statusDialog.organization.short_name} set to ${labelForOrganizationStatus(statusDialog.targetStatus)}.`,
        severity: 'success',
      });
      closeStatusDialog();
      await Promise.all([loadOrganizations(), loadStats()]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update organization';
      setSnack({ open: true, text: message, severity: 'error' });
      setStatusDialog((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleCreateOrganization = async () => {
    if (!createForm.name.trim() || !createForm.short_name.trim() || !createForm.registration_code.trim()) {
      setSnack({ open: true, text: 'Name, short name, and registration code are required.', severity: 'error' });
      return;
    }

    setCreateLoading(true);
    try {
      await organizationService.upsertOrganization({
        name: createForm.name.trim(),
        short_name: createForm.short_name.trim(),
        org_type: createForm.org_type,
        registration_code: createForm.registration_code.trim().toUpperCase(),
        state: createForm.state.trim() || 'Unknown',
        district: createForm.district.trim() || null,
        contact_name: createForm.contact_name.trim() || 'N/A',
        contact_email: createForm.contact_email.trim() || 'noreply@coastsafe.in',
        contact_phone: createForm.contact_phone.trim() || 'N/A',
        website: createForm.website.trim() || null,
        status: 'pending_approval',
      });
      setCreateOpen(false);
      setCreateForm(initialCreateForm);
      setSnack({ open: true, text: 'Organization created successfully.', severity: 'success' });
      await Promise.all([loadOrganizations(), loadStats()]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create organization';
      setSnack({ open: true, text: message, severity: 'error' });
    } finally {
      setCreateLoading(false);
    }
  };

  const columns: TableColumn<Organization>[] = useMemo(
    () => [
      {
        key: 'organization',
        label: 'Organization',
        renderCell: (org) => (
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 700, color: isDark ? '#f8fafc' : '#0f172a' }}>
              {org.name}
            </Typography>
            <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
              {org.registration_code}
            </Typography>
          </Box>
        ),
      },
      {
        key: 'type',
        label: 'Type',
        renderCell: (org) => (
          <Chip
            label={labelForOrganizationType(org.org_type)}
            size="small"
            sx={{ bgcolor: isDark ? 'rgba(100,116,139,0.2)' : '#f1f5f9', borderRadius: 1, height: 24, fontWeight: 600 }}
          />
        ),
      },
      {
        key: 'location',
        label: 'Location',
        renderCell: (org) => (
          <Box>
            <Typography variant="body2" sx={{ color: isDark ? '#cbd5e1' : '#475569' }}>
              {org.state}
            </Typography>
            <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
              {org.district ?? 'N/A'}
            </Typography>
          </Box>
        ),
      },
      {
        key: 'contact',
        label: 'Primary Contact',
        renderCell: (org) => (
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600, color: isDark ? '#e2e8f0' : '#334155' }}>
              {org.contact_name}
            </Typography>
            <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
              {org.contact_email}
            </Typography>
          </Box>
        ),
      },
      {
        key: 'status',
        label: 'Status',
        renderCell: (org) => <StatusChip status={labelForOrganizationStatus(org.status)} />,
      },
      {
        key: 'action',
        label: 'Action',
        width: 70,
        align: 'center',
        renderCell: (org) => {
          const menuItems = [
            {
              label: 'Approve Organization',
              color: 'success' as const,
              onClick: () => openStatusDialog(org, 'approved'),
              disabled: org.status === 'approved',
            },
            {
              label: 'Reject Application',
              color: 'error' as const,
              onClick: () => openStatusDialog(org, 'rejected'),
              disabled: org.status === 'rejected',
            },
            {
              label: 'Suspend Organization',
              color: 'warning' as const,
              onClick: () => openStatusDialog(org, 'suspended'),
              disabled: org.status === 'suspended',
            },
            {
              label: 'Move to Pending',
              onClick: () => openStatusDialog(org, 'pending_approval'),
              disabled: org.status === 'pending_approval',
            },
          ];

          return <ActionMenu id={org.id} items={menuItems} />;
        },
      },
    ],
    [isDark]
  );

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 3, p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, color: isDark ? '#f8fafc' : '#0f172a', fontSize: '1.25rem' }}>
            Organization Management
          </Typography>
          <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b', mt: 0.5, fontSize: '0.8125rem' }}>
            Manage NGO and government partner onboarding, approval, and lifecycle.
          </Typography>
        </Box>
        <Button
          size="small"
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateOpen(true)}
          sx={{ textTransform: 'none', borderRadius: 2, bgcolor: '#2563eb', '&:hover': { bgcolor: '#1d4ed8' } }}
        >
          Add Organization
        </Button>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2 }}>
        <Box sx={{ p: 2, borderRadius: 2, border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, bgcolor: isDark ? '#1e293b' : '#ffffff' }}>
          <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600 }}>Total Organizations</Typography>
          <Typography variant="h5" sx={{ fontWeight: 700, color: isDark ? '#f8fafc' : '#0f172a', mt: 0.5, fontSize: '1.35rem' }}>{stats.total}</Typography>
        </Box>
        <Box sx={{ p: 2, borderRadius: 2, border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, bgcolor: isDark ? '#1e293b' : '#ffffff' }}>
          <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600 }}>Pending Approvals</Typography>
          <Typography variant="h5" sx={{ fontWeight: 700, color: isDark ? '#f8fafc' : '#0f172a', mt: 0.5, fontSize: '1.35rem' }}>{stats.pendingApproval}</Typography>
        </Box>
        <Box sx={{ p: 2, borderRadius: 2, border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, bgcolor: isDark ? '#1e293b' : '#ffffff' }}>
          <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600 }}>Active NGOs</Typography>
          <Typography variant="h5" sx={{ fontWeight: 700, color: isDark ? '#f8fafc' : '#0f172a', mt: 0.5, fontSize: '1.35rem' }}>{stats.activeNgo}</Typography>
        </Box>
      </Box>

      <FilterBar
        tabs={[
          { label: 'Approved Orgs', value: 'approved' },
          { label: 'Pending Approval', value: 'pending_approval' },
          { label: 'Rejected', value: 'rejected' },
          { label: 'Suspended', value: 'suspended' },
        ]}
        activeTab={tabValue}
        onTabChange={(value) => {
          setTabValue(value as OrganizationStatus);
          setPage(0);
        }}
        searchPlaceholder="Search organizations, code, location, or contact..."
        searchValue={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(0);
        }}
        filters={[
          {
            name: 'orgType',
            label: 'Type',
            options: [
              { value: 'government', label: 'Government' },
              { value: 'ngo', label: 'NGO' },
            ],
            defaultValue: 'all',
          },
        ]}
        filterValues={{ orgType: orgTypeFilter }}
        onFilterChange={(name, value) => {
          if (name === 'orgType') {
            setOrgTypeFilter(value);
            setPage(0);
          }
        }}
      />

      <EntityTable<Organization>
        columns={columns}
        rows={organizations}
        total={total}
        page={page}
        pageSize={PAGE_SIZE}
        loading={loading}
        error={error}
        onRetry={loadOrganizations}
        onPageChange={setPage}
        getRowKey={(row) => row.id}
        emptyTitle="No organizations found"
        emptyDescription="There are no organizations for this filter and status."
      />

      <ConfirmDialog
        open={statusDialog.open}
        title={statusDialog.targetStatus ? `Set organization as ${labelForOrganizationStatus(statusDialog.targetStatus)}?` : 'Update organization'}
        description={
          statusDialog.organization
            ? `This will update ${statusDialog.organization.name} and write an organization audit event.`
            : 'Update organization status.'
        }
        confirmLabel="Confirm Update"
        confirmColor={statusDialog.targetStatus === 'rejected' ? 'error' : 'warning'}
        requireReason
        reasonLabel="Decision Reason"
        reasonPlaceholder="Enter reason for approval, rejection, or suspension"
        reasonValue={statusDialog.reason}
        onReasonChange={(value) => setStatusDialog((prev) => ({ ...prev, reason: value }))}
        submitting={statusDialog.loading}
        onCancel={closeStatusDialog}
        onConfirm={confirmStatusChange}
      />

      <Dialog open={createOpen} onClose={createLoading ? undefined : () => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Organization</DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 1.5, pt: 1 }}>
          <TextField size="small" label="Organization Name" value={createForm.name} onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))} />
          <TextField size="small" label="Short Name" value={createForm.short_name} onChange={(e) => setCreateForm((p) => ({ ...p, short_name: e.target.value }))} />
          <TextField size="small" label="Type (government or ngo)" value={createForm.org_type} onChange={(e) => setCreateForm((p) => ({ ...p, org_type: (e.target.value.toLowerCase() === 'government' ? 'government' : 'ngo') }))} />
          <TextField size="small" label="Registration Code" value={createForm.registration_code} onChange={(e) => setCreateForm((p) => ({ ...p, registration_code: e.target.value }))} />
          <TextField size="small" label="State" value={createForm.state} onChange={(e) => setCreateForm((p) => ({ ...p, state: e.target.value }))} />
          <TextField size="small" label="District" value={createForm.district} onChange={(e) => setCreateForm((p) => ({ ...p, district: e.target.value }))} />
          <TextField size="small" label="Contact Name" value={createForm.contact_name} onChange={(e) => setCreateForm((p) => ({ ...p, contact_name: e.target.value }))} />
          <TextField size="small" label="Contact Email" value={createForm.contact_email} onChange={(e) => setCreateForm((p) => ({ ...p, contact_email: e.target.value }))} />
          <TextField size="small" label="Contact Phone" value={createForm.contact_phone} onChange={(e) => setCreateForm((p) => ({ ...p, contact_phone: e.target.value }))} />
          <TextField size="small" label="Website" value={createForm.website} onChange={(e) => setCreateForm((p) => ({ ...p, website: e.target.value }))} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)} disabled={createLoading}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateOrganization} disabled={createLoading}>Create</Button>
        </DialogActions>
      </Dialog>

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
