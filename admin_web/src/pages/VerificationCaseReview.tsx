import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Link,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Snackbar,
  TextField,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import ReportGmailerrorredOutlinedIcon from '@mui/icons-material/ReportGmailerrorredOutlined';
import AssignmentTurnedInOutlinedIcon from '@mui/icons-material/AssignmentTurnedInOutlined';
import { useThemeContext } from '../contexts/ThemeContext';
import { verificationService } from '../services/verificationService';
import type {
  AuditEvent,
  VerificationCaseDetail,
  VerificationDocument,
  VerificationStatus,
} from '../types/adminManagement';
import {
  labelForUserStatus,
  labelForUserType,
  labelForVerificationCheckType,
  labelForVerificationStatus,
  labelForVerificationTier,
} from '../utils/adminManagementFormatters';
import { ConfirmDialog } from '../components/shared/ConfirmDialog';
import { EmptyState, ErrorState, LoadingState } from '../components/shared/StateDisplays';
import { StatusChip } from '../components/shared/StatusChip';
import { UserAvatar } from '../components/shared/UserAvatar';

interface DecisionState {
  open: boolean;
  status: VerificationStatus | null;
  reason: string;
  internalNotes: string;
  loading: boolean;
}

const isPreviewableImage = (url: string) => /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(url);
const isPreviewablePdf = (url: string) => /\.pdf(\?.*)?$/i.test(url);

const formatDate = (value?: string | null) => (value ? new Date(value).toLocaleString() : 'N/A');

const InfoLine = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <Box>
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="body2" sx={{ fontWeight: 600 }}>
      {value}
    </Typography>
  </Box>
);

const VerificationCaseReview: React.FC = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const { mode } = useThemeContext();
  const isDark = mode === 'dark';

  const [caseDetail, setCaseDetail] = useState<VerificationCaseDetail | null>(null);
  const [documents, setDocuments] = useState<VerificationDocument[]>([]);
  const [audits, setAudits] = useState<AuditEvent[]>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snack, setSnack] = useState<{ open: boolean; text: string; severity: 'success' | 'error' }>({
    open: false,
    text: '',
    severity: 'success',
  });
  const [decision, setDecision] = useState<DecisionState>({
    open: false,
    status: null,
    reason: '',
    internalNotes: '',
    loading: false,
  });

  const loadCase = useCallback(async () => {
    if (!caseId) {
      setError('Verification case ID is missing.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [caseResult, docsResult, auditResult] = await Promise.all([
        verificationService.getVerificationCaseById(caseId),
        verificationService.getVerificationDocuments(caseId),
        verificationService.getVerificationAudit(caseId),
      ]);

      if (!caseResult) {
        setCaseDetail(null);
        setDocuments([]);
        setAudits([]);
        setError('Verification case not found.');
        return;
      }

      setCaseDetail(caseResult);
      setDocuments(docsResult);
      setAudits(auditResult);
      setSelectedDocumentId(docsResult[0]?.id ?? null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load verification case.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    void loadCase();
  }, [loadCase]);

  const selectedDocument = useMemo(
    () => documents.find((item) => item.id === selectedDocumentId) ?? documents[0] ?? null,
    [documents, selectedDocumentId]
  );

  const openDecision = (status: VerificationStatus) => {
    setDecision({
      open: true,
      status,
      reason: '',
      internalNotes: caseDetail?.notes ?? '',
      loading: false,
    });
  };

  const closeDecision = () => {
    setDecision({
      open: false,
      status: null,
      reason: '',
      internalNotes: '',
      loading: false,
    });
  };

  const applyDecision = async () => {
    if (!caseDetail || !decision.status) return;

    setDecision((prev) => ({ ...prev, loading: true }));
    try {
      await verificationService.setVerificationStatus({
        caseId: caseDetail.id,
        status: decision.status,
        reason: decision.reason,
        notes: decision.internalNotes,
      });
      setSnack({
        open: true,
        text: `Case updated to ${labelForVerificationStatus(decision.status)}.`,
        severity: 'success',
      });
      closeDecision();
      await loadCase();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to apply verification decision.';
      setSnack({ open: true, text: message, severity: 'error' });
      setDecision((prev) => ({ ...prev, loading: false }));
    }
  };

  if (loading) {
    return <LoadingState type="details" message="Loading verification case..." />;
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <ErrorState error={error} onRetry={() => void loadCase()} />
      </Box>
    );
  }

  if (!caseDetail) {
    return (
      <Box sx={{ p: 2 }}>
        <EmptyState title="Case Not Found" description="This verification case could not be loaded." onAction={() => navigate('/verifications')} actionLabel="Back to Verifications" />
      </Box>
    );
  }

  const previewUrl = selectedDocument?.file_url ?? null;
  const canRenderImage = previewUrl ? isPreviewableImage(previewUrl) : false;
  const canRenderPdf = previewUrl ? isPreviewablePdf(previewUrl) : false;

  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 3, p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/verifications')} sx={{ textTransform: 'none' }}>
            Back
          </Button>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
              Verification Review
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Review submitted evidence, record findings, and apply a final decision.
            </Typography>
          </Box>
        </Box>
        <StatusChip status={labelForVerificationStatus(caseDetail.status)} />
      </Box>

      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}` }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', mb: 2 }}>
          <UserAvatar name={caseDetail.user?.full_name ?? 'Unknown User'} src={caseDetail.user?.avatar_url} size={52} />
          <Box sx={{ flex: 1, minWidth: 220 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {caseDetail.user?.full_name ?? 'Unknown User'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Case ID: {caseDetail.id}
            </Typography>
          </Box>
          <Chip label={labelForVerificationCheckType(caseDetail.check_type)} size="small" />
          {caseDetail.user?.verification_tier ? (
            <Chip label={labelForVerificationTier(caseDetail.user.verification_tier)} size="small" />
          ) : null}
        </Box>

        <Divider sx={{ mb: 2 }} />

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' }, gap: 2 }}>
          <InfoLine label="Applicant Role" value={caseDetail.user?.user_type ? labelForUserType(caseDetail.user.user_type) : 'N/A'} />
          <InfoLine label="Applicant Status" value={caseDetail.user?.status ? labelForUserStatus(caseDetail.user.status) : 'N/A'} />
          <InfoLine label="Organization" value={caseDetail.user?.organization?.name ?? 'Unassigned'} />
          <InfoLine label="Assigned Admin" value={caseDetail.assigned_admin?.full_name ?? 'Unassigned'} />
          <InfoLine label="State / District" value={`${caseDetail.user?.state ?? 'N/A'}${caseDetail.user?.district ? `, ${caseDetail.user.district}` : ''}`} />
          <InfoLine label="Submitted At" value={formatDate(caseDetail.submitted_at)} />
          <InfoLine label="Resolved At" value={formatDate(caseDetail.resolved_at)} />
          <InfoLine label="Documents" value={documents.length} />
        </Box>
      </Paper>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '360px 1fr 340px' }, gap: 3 }}>
        <Paper elevation={0} sx={{ borderRadius: 3, border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, overflow: 'hidden' }}>
          <Box sx={{ p: 2.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Submitted Documents
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Select a document to preview or open externally.
            </Typography>
          </Box>
          <Divider />
          {documents.length === 0 ? (
            <Box sx={{ p: 2.5 }}>
              <Alert severity="warning">No documents uploaded for this case.</Alert>
            </Box>
          ) : (
            <List disablePadding>
              {documents.map((document) => (
                <ListItemButton
                  key={document.id}
                  selected={selectedDocument?.id === document.id}
                  onClick={() => setSelectedDocumentId(document.id)}
                  sx={{ alignItems: 'flex-start', py: 1.75 }}
                >
                  <DescriptionOutlinedIcon sx={{ mr: 1.5, mt: 0.25, color: 'text.secondary' }} />
                  <ListItemText
                    primary={document.doc_type.replace(/_/g, ' ')}
                    secondary={`Uploaded ${formatDate(document.created_at)}`}
                    primaryTypographyProps={{ sx: { textTransform: 'capitalize', fontWeight: 600 } }}
                  />
                </ListItemButton>
              ))}
            </List>
          )}
        </Paper>

        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, minHeight: 540 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, mb: 2 }}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Document Preview
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedDocument ? selectedDocument.doc_type.replace(/_/g, ' ') : 'No document selected'}
              </Typography>
            </Box>
            {selectedDocument ? (
              <Link href={selectedDocument.file_url} target="_blank" rel="noreferrer" underline="none">
                <Button size="small" variant="outlined" startIcon={<OpenInNewIcon />} sx={{ textTransform: 'none' }}>
                  Open
                </Button>
              </Link>
            ) : null}
          </Box>

          <Divider sx={{ mb: 2 }} />

          {!selectedDocument ? (
            <EmptyState
              title="No Document Selected"
              description="Choose a document from the list to preview it here."
            />
          ) : canRenderImage ? (
            <Box
              component="img"
              src={previewUrl ?? undefined}
              alt={selectedDocument.doc_type}
              sx={{ width: '100%', maxHeight: 620, objectFit: 'contain', borderRadius: 2, bgcolor: isDark ? '#0f172a' : '#f8fafc' }}
            />
          ) : canRenderPdf ? (
            <Box
              component="iframe"
              src={previewUrl ?? undefined}
              title={selectedDocument.doc_type}
              sx={{ width: '100%', minHeight: 620, border: 'none', borderRadius: 2, bgcolor: isDark ? '#0f172a' : '#f8fafc' }}
            />
          ) : (
            <Alert severity="info">
              Inline preview is not available for this file type. Use the Open button to review the document.
            </Alert>
          )}
        </Paper>

        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}` }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Review Actions
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Apply a final case decision with an auditable reason.
          </Typography>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
            <Button
              variant="contained"
              color="success"
              startIcon={<CheckCircleOutlineIcon />}
              onClick={() => openDecision('approved')}
              disabled={caseDetail.status === 'approved'}
              sx={{ textTransform: 'none' }}
            >
              Approve
            </Button>
            <Button
              variant="outlined"
              color="warning"
              startIcon={<AssignmentTurnedInOutlinedIcon />}
              onClick={() => openDecision('awaiting_rework')}
              disabled={caseDetail.status === 'awaiting_rework'}
              sx={{ textTransform: 'none' }}
            >
              Request Rework
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<CancelOutlinedIcon />}
              onClick={() => openDecision('rejected')}
              disabled={caseDetail.status === 'rejected'}
              sx={{ textTransform: 'none' }}
            >
              Reject
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<ReportGmailerrorredOutlinedIcon />}
              onClick={() => openDecision('escalated')}
              disabled={caseDetail.status === 'escalated'}
              sx={{ textTransform: 'none' }}
            >
              Escalate
            </Button>
            <Button
              variant="text"
              onClick={() => openDecision('in_review')}
              disabled={caseDetail.status === 'in_review'}
              sx={{ textTransform: 'none' }}
            >
              Move To In Review
            </Button>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
            Latest Audit
          </Typography>
          {audits.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No audit entries recorded yet.
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {audits.slice(0, 5).map((audit) => (
                <Box key={audit.id} sx={{ p: 1.5, borderRadius: 2, bgcolor: isDark ? '#0f172a' : '#f8fafc' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {audit.old_status ?? 'N/A'} {' -> '} {audit.new_status}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                    {formatDate(audit.changed_at)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    Actor: {audit.changed_by ?? 'System'}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.75 }}>
                    {audit.reason}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}

          <Divider sx={{ my: 2 }} />

          <TextField
            label="Current Reviewer Notes"
            value={caseDetail.notes ?? ''}
            fullWidth
            size="small"
            multiline
            minRows={3}
            disabled
          />
        </Paper>
      </Box>

      <ConfirmDialog
        open={decision.open}
        title={decision.status ? `Set case as ${labelForVerificationStatus(decision.status)}?` : 'Update case'}
        description="This decision will update the verification workflow and append an audit record."
        confirmLabel="Apply Decision"
        confirmColor={decision.status === 'approved' ? 'success' : decision.status === 'rejected' || decision.status === 'escalated' ? 'error' : 'warning'}
        requireReason
        reasonLabel="Decision Reason"
        reasonPlaceholder="Enter the rationale for this verification decision"
        reasonValue={decision.reason}
        onReasonChange={(value) => setDecision((prev) => ({ ...prev, reason: value }))}
        requireInternalNotes
        internalNotesLabel="Internal Notes"
        internalNotesPlaceholder="Optional notes saved on the case"
        internalNotesValue={decision.internalNotes}
        onInternalNotesChange={(value) => setDecision((prev) => ({ ...prev, internalNotes: value }))}
        submitting={decision.loading}
        onCancel={closeDecision}
        onConfirm={applyDecision}
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

export default VerificationCaseReview;
