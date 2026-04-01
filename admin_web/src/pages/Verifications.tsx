import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Snackbar,
  Alert,
  Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useThemeContext } from '../contexts/ThemeContext';
import { userManagementService } from '../services/userManagementService';
import { verificationService } from '../services/verificationService';
import type {
  AdminUserProfile,
  VerificationCase,
  VerificationCheckType,
  VerificationStatus,
} from '../types/adminManagement';
import {
  labelForVerificationCheckType,
  labelForVerificationStatus,
} from '../utils/adminManagementFormatters';
import { ActionMenu } from '../components/shared/ActionMenu';
import { ConfirmDialog } from '../components/shared/ConfirmDialog';
import { EntityTable, type TableColumn } from '../components/shared/EntityTable';
import { FilterBar } from '../components/shared/FilterBar';
import { StatusChip } from '../components/shared/StatusChip';
import { UserAvatar } from '../components/shared/UserAvatar';

const PAGE_SIZE = 10;

interface DecisionDialogState {
  open: boolean;
  targetCase: VerificationCase | null;
  targetStatus: VerificationStatus | null;
  reason: string;
  notes: string;
  loading: boolean;
}

export const Verifications: React.FC = () => {
  const { mode } = useThemeContext();
  const isDark = mode === 'dark';
  const navigate = useNavigate();

  const [cases, setCases] = useState<VerificationCase[]>([]);
  const [admins, setAdmins] = useState<AdminUserProfile[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    newSubmission: 0,
    awaitingRework: 0,
    escalated: 0,
    approved: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [checkTypeTab, setCheckTypeTab] = useState<VerificationCheckType>('identity');
  const [statusFilter, setStatusFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState('all');

  const [snack, setSnack] = useState<{ open: boolean; text: string; severity: 'success' | 'error' }>({
    open: false,
    text: '',
    severity: 'success',
  });

  const [decisionDialog, setDecisionDialog] = useState<DecisionDialogState>({
    open: false,
    targetCase: null,
    targetStatus: null,
    reason: '',
    notes: '',
    loading: false,
  });

  const loadCases = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await verificationService.getVerificationCases({
        page,
        pageSize: PAGE_SIZE,
        search,
        checkType: checkTypeTab,
        status: statusFilter === 'all' ? 'all' : (statusFilter as VerificationStatus),
        assignedAdminId: assigneeFilter,
        dateRange: dateRangeFilter as 'all' | 'last_7_days' | 'last_30_days',
      });
      setCases(result.data);
      setTotal(result.total);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load verification queue';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [assigneeFilter, checkTypeTab, dateRangeFilter, page, search, statusFilter]);

  const loadMeta = useCallback(async () => {
    try {
      const [statsResult, adminResult] = await Promise.all([
        verificationService.getStats(),
        userManagementService.getUsers({ page: 0, pageSize: 200, userType: 'system_admin' }),
      ]);
      setStats(statsResult);
      setAdmins(adminResult.data);
    } catch {
      setStats({
        total: 0,
        newSubmission: 0,
        awaitingRework: 0,
        escalated: 0,
        approved: 0,
      });
      setAdmins([]);
    }
  }, []);

  useEffect(() => {
    void loadCases();
  }, [loadCases]);

  useEffect(() => {
    void loadMeta();
  }, [loadMeta]);

  const clearFilters = () => {
    setPage(0);
    setSearch('');
    setStatusFilter('all');
    setAssigneeFilter('all');
    setDateRangeFilter('all');
  };

  const openDecisionDialog = (targetCase: VerificationCase, targetStatus: VerificationStatus) => {
    setDecisionDialog({
      open: true,
      targetCase,
      targetStatus,
      reason: '',
      notes: targetCase.notes ?? '',
      loading: false,
    });
  };

  const closeDecisionDialog = () => {
    setDecisionDialog({
      open: false,
      targetCase: null,
      targetStatus: null,
      reason: '',
      notes: '',
      loading: false,
    });
  };

  const confirmDecision = async () => {
    if (!decisionDialog.targetCase || !decisionDialog.targetStatus) return;
    setDecisionDialog((prev) => ({ ...prev, loading: true }));
    try {
      await verificationService.setVerificationStatus({
        caseId: decisionDialog.targetCase.id,
        status: decisionDialog.targetStatus,
        reason: decisionDialog.reason,
        notes: decisionDialog.notes,
      });
      setSnack({
        open: true,
        text: `Verification case updated to ${labelForVerificationStatus(decisionDialog.targetStatus)}.`,
        severity: 'success',
      });
      closeDecisionDialog();
      await Promise.all([loadCases(), loadMeta()]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update verification decision';
      setSnack({ open: true, text: message, severity: 'error' });
      setDecisionDialog((prev) => ({ ...prev, loading: false }));
    }
  };

  const columns: TableColumn<VerificationCase>[] = useMemo(
    () => [
      {
        key: 'user',
        label: 'Submitting User',
        renderCell: (item) => (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <UserAvatar name={item.user?.full_name ?? 'Unknown User'} src={item.user?.avatar_url} size={34} />
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 700, color: isDark ? '#f8fafc' : '#0f172a' }}>
                {item.user?.full_name ?? 'Unknown User'}
              </Typography>
              <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                {item.user?.email ?? 'N/A'}
              </Typography>
            </Box>
          </Box>
        ),
      },
      {
        key: 'date',
        label: 'Submission Date',
        renderCell: (item) => (
          <Typography variant="body2" sx={{ color: isDark ? '#cbd5e1' : '#475569' }}>
            {new Date(item.submitted_at).toLocaleString()}
          </Typography>
        ),
      },
      {
        key: 'checkType',
        label: 'Check Type',
        renderCell: (item) => (
          <Typography variant="body2" sx={{ color: isDark ? '#e2e8f0' : '#334155', fontWeight: 600 }}>
            {labelForVerificationCheckType(item.check_type)}
          </Typography>
        ),
      },
      {
        key: 'status',
        label: 'Status',
        renderCell: (item) => <StatusChip status={labelForVerificationStatus(item.status)} />,
      },
      {
        key: 'assignee',
        label: 'Assigned Admin',
        renderCell: (item) => (
          <Typography variant="body2" sx={{ color: isDark ? '#cbd5e1' : '#475569' }}>
            {item.assigned_admin?.full_name ?? 'Unassigned'}
          </Typography>
        ),
      },
      {
        key: 'action',
        label: 'Action',
        width: 70,
        align: 'center',
        renderCell: (item) => {
          const menuItems = [
            {
              label: 'Open Review',
              onClick: () => navigate(`/verifications/${item.id}`),
            },
            {
              label: 'Move to In Review',
              color: 'info' as const,
              onClick: () => openDecisionDialog(item, 'in_review'),
              disabled: item.status === 'in_review' || item.status === 'approved' || item.status === 'rejected',
            },
            {
              label: 'Approve Application',
              color: 'success' as const,
              onClick: () => openDecisionDialog(item, 'approved'),
              disabled: item.status === 'approved',
            },
            {
              label: 'Request Rework',
              color: 'warning' as const,
              onClick: () => openDecisionDialog(item, 'awaiting_rework'),
              disabled: item.status === 'awaiting_rework',
            },
            {
              label: 'Reject Application',
              color: 'error' as const,
              onClick: () => openDecisionDialog(item, 'rejected'),
              disabled: item.status === 'rejected',
            },
            {
              label: 'Escalate Case',
              color: 'error' as const,
              onClick: () => openDecisionDialog(item, 'escalated'),
              disabled: item.status === 'escalated',
            },
          ];
          return <ActionMenu id={item.id} items={menuItems} />;
        },
      },
    ],
    [isDark, navigate]
  );

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 3, p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, color: isDark ? '#f8fafc' : '#0f172a', fontSize: '1.25rem' }}>
            Verification Workflow
          </Typography>
          <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b', mt: 0.5, fontSize: '0.8125rem' }}>
            Review, approve, rework, reject, and escalate identity and compliance checks.
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2 }}>
        {[
          { label: 'Total Cases', count: stats.total.toString(), color: '#3b82f6' },
          { label: 'New Submission', count: stats.newSubmission.toString(), color: '#eab308' },
          { label: 'Awaiting Rework', count: stats.awaitingRework.toString(), color: '#f97316' },
          { label: 'Escalated', count: stats.escalated.toString(), color: '#ef4444' }
        ].map(stat => (
          <Box key={stat.label} sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: isDark ? '#1e293b' : '#fff' }}>
            <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600 }}>{stat.label}</Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: stat.color, mt: 0.5, fontSize: '1.35rem' }}>{stat.count}</Typography>
          </Box>
        ))}
      </Box>

      <FilterBar
        tabs={[
          { label: 'Identity Queue', value: 'identity' },
          { label: 'Document Verification', value: 'document' },
          { label: 'Employment Proof', value: 'employment' },
          { label: 'Regional Clearance', value: 'regional_clearance' },
        ]}
        activeTab={checkTypeTab}
        onTabChange={(value) => {
          setCheckTypeTab(value as VerificationCheckType);
          setPage(0);
        }}
        searchPlaceholder="Search verification notes or check type..."
        searchValue={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(0);
        }}
        filters={[
          {
            name: 'status',
            label: 'Status',
            options: [
              { value: 'new_submission', label: 'New Submission' },
              { value: 'in_review', label: 'In Review' },
              { value: 'awaiting_rework', label: 'Awaiting Rework' },
              { value: 'approved', label: 'Approved' },
              { value: 'rejected', label: 'Rejected' },
              { value: 'escalated', label: 'Escalated' },
            ],
            defaultValue: 'all',
          },
          {
            name: 'assignee',
            label: 'Assignee',
            type: 'select',
            options: [
              { value: 'all', label: 'Any Assignee' },
              { value: 'unassigned', label: 'Unassigned' },
              ...admins.map((admin) => ({ value: admin.user_id, label: admin.full_name })),
            ],
            defaultValue: 'all',
            isSecondary: true,
          },
          {
            name: 'dateRange',
            label: 'Date Range',
            type: 'select',
            options: [
              { value: 'all', label: 'All Time' },
              { value: 'last_7_days', label: 'Last 7 Days' },
              { value: 'last_30_days', label: 'Last 30 Days' },
            ],
            defaultValue: 'all',
            isSecondary: true,
          },
        ]}
        filterValues={{ status: statusFilter, assignee: assigneeFilter, dateRange: dateRangeFilter }}
        onFilterChange={(name, value) => {
          if (name === 'status') {
            setStatusFilter(value);
            setPage(0);
          }
          if (name === 'assignee') {
            setAssigneeFilter(value);
            setPage(0);
          }
          if (name === 'dateRange') {
            setDateRangeFilter(value);
            setPage(0);
          }
        }}
        onClearFilters={clearFilters}
      />

      <EntityTable<VerificationCase>
        columns={columns}
        rows={cases}
        total={total}
        page={page}
        pageSize={PAGE_SIZE}
        loading={loading}
        error={error}
        onRetry={loadCases}
        onPageChange={setPage}
        getRowKey={(row) => row.id}
        emptyTitle="No verification cases found"
        emptyDescription="There are no cases in this queue right now."
      />

      <ConfirmDialog
        open={decisionDialog.open}
        title={decisionDialog.targetStatus ? `Set verification as ${labelForVerificationStatus(decisionDialog.targetStatus)}?` : 'Update verification decision'}
        description={
          decisionDialog.targetCase
            ? `Case ${decisionDialog.targetCase.id.slice(0, 8)} will be updated and audited.`
            : 'Update verification status.'
        }
        confirmLabel="Apply Decision"
        confirmColor={
          decisionDialog.targetStatus === 'approved'
            ? 'success'
            : decisionDialog.targetStatus === 'rejected' || decisionDialog.targetStatus === 'escalated'
            ? 'error'
            : 'warning'
        }
        requireReason
        reasonLabel="Decision Reason"
        reasonPlaceholder="Enter reason for this verification decision"
        reasonValue={decisionDialog.reason}
        onReasonChange={(value) => setDecisionDialog((prev) => ({ ...prev, reason: value }))}
        submitting={decisionDialog.loading}
        onCancel={closeDecisionDialog}
        onConfirm={confirmDecision}
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
