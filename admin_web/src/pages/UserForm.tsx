import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Divider,
  FormControl,
  InputLabel,
  Link as MuiLink,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  TextField,
  Typography,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { useThemeContext } from '../contexts/ThemeContext';
import { LoadingState } from '../components/shared/StateDisplays';
import { organizationService } from '../services/organizationService';
import { userManagementService } from '../services/userManagementService';
import type {
  Organization,
  UpsertUserInput,
  UserStatus,
  UserType,
  VerificationTier,
} from '../types/adminManagement';

interface UserFormState {
  full_name: string;
  email: string;
  phone: string;
  user_type: UserType;
  status: UserStatus;
  verification_tier: VerificationTier;
  organization_id: string;
  state: string;
  district: string;
  designation: string;
  avatar_url: string;
  temp_password: string;
}

const initialFormState: UserFormState = {
  full_name: '',
  email: '',
  phone: '',
  user_type: 'government_official',
  status: 'pending_verification',
  verification_tier: 'tier_1',
  organization_id: '',
  state: '',
  district: '',
  designation: '',
  avatar_url: '',
  temp_password: 'Welcome@123',
};

export const UserForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { mode } = useThemeContext();
  const isDark = mode === 'dark';

  const [form, setForm] = useState<UserFormState>(initialFormState);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [snack, setSnack] = useState<{ open: boolean; text: string; severity: 'success' | 'error' }>({
    open: false,
    text: '',
    severity: 'success',
  });

  const organizationOptions = useMemo(
    () => organizations.filter((org) => org.status === 'approved' || org.status === 'pending_approval'),
    [organizations]
  );

  const loadOrganizations = useCallback(async () => {
    try {
      const result = await organizationService.getOrganizations({ page: 0, pageSize: 200 });
      setOrganizations(result.data);
    } catch {
      setOrganizations([]);
    }
  }, []);

  const loadEditUser = useCallback(async () => {
    if (!isEdit || !id) return;
    setInitialLoading(true);
    try {
      const user = await userManagementService.getUserById(id);
      if (!user) {
        setSnack({ open: true, text: 'User not found.', severity: 'error' });
        navigate('/users');
        return;
      }
      setForm({
        full_name: user.full_name,
        email: user.email,
        phone: user.phone ?? '',
        user_type: user.user_type,
        status: user.status,
        verification_tier: user.verification_tier,
        organization_id: user.organization_id ?? '',
        state: user.state,
        district: user.district ?? '',
        designation: user.designation ?? '',
        avatar_url: user.avatar_url ?? '',
        temp_password: 'Welcome@123',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load user details';
      setSnack({ open: true, text: message, severity: 'error' });
    } finally {
      setInitialLoading(false);
    }
  }, [id, isEdit, navigate]);

  useEffect(() => {
    void loadOrganizations();
  }, [loadOrganizations]);

  useEffect(() => {
    void loadEditUser();
  }, [loadEditUser]);

  const handleInput = <K extends keyof UserFormState>(key: K, value: UserFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.full_name.trim() || !form.email.trim() || !form.state.trim()) {
      setSnack({ open: true, text: 'Full name, email, and state are required.', severity: 'error' });
      return;
    }

    setLoading(true);
    try {
      const payload: UpsertUserInput = {
        user_id: id ?? null,
        full_name: form.full_name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim() || null,
        user_type: form.user_type,
        status: form.status,
        verification_tier: form.verification_tier,
        organization_id: form.organization_id || null,
        state: form.state.trim(),
        district: form.district.trim() || null,
        designation: form.designation.trim() || null,
        avatar_url: form.avatar_url.trim() || null,
        temp_password: form.temp_password.trim() || 'Welcome@123',
        reason: isEdit ? 'profile_edit' : 'new_user_invite',
      };

      await userManagementService.upsertUser(payload);
      setSnack({
        open: true,
        text: isEdit ? 'User updated successfully.' : 'User created successfully.',
        severity: 'success',
      });
      navigate('/users');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save user';
      setSnack({ open: true, text: message, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 3, p: { xs: 2, md: 4 }, maxWidth: '900px', mx: 'auto' }}>
        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} aria-label="breadcrumb" sx={{ mb: -1 }}>
          <MuiLink underline="hover" color="inherit" onClick={() => navigate('/users')} sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: '0.875rem' }}>
            User List
          </MuiLink>
          <Typography color="text.primary" sx={{ fontSize: '0.875rem', fontWeight: 600 }}>
            {isEdit ? 'Edit User' : 'Create User'}
          </Typography>
        </Breadcrumbs>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, color: isDark ? '#f8fafc' : '#0f172a', mb: 0.5, fontSize: '1.25rem' }}>
            {isEdit ? 'Edit User Profile' : 'Add New User'}
          </Typography>
          <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: '0.8125rem' }}>
            {isEdit ? 'Update user identity, organization mapping, and lifecycle metadata.' : 'Create a new platform user with role, verification tier, and organization mapping.'}
          </Typography>
        </Box>
        <LoadingState type="form" message="Loading user details..." />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 3, p: { xs: 2, md: 4 }, maxWidth: '900px', mx: 'auto' }}>
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} aria-label="breadcrumb" sx={{ mb: -1 }}>
        <MuiLink underline="hover" color="inherit" onClick={() => navigate('/users')} sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: '0.875rem' }}>
          User List
        </MuiLink>
        <Typography color="text.primary" sx={{ fontSize: '0.875rem', fontWeight: 600 }}>
          {isEdit ? 'Edit User' : 'Create User'}
        </Typography>
      </Breadcrumbs>

      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, color: isDark ? '#f8fafc' : '#0f172a', mb: 0.5, fontSize: '1.25rem' }}>
          {isEdit ? 'Edit User Profile' : 'Add New User'}
        </Typography>
        <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: '0.8125rem' }}>
          {isEdit ? 'Update user identity, organization mapping, and lifecycle metadata.' : 'Create a new platform user with role, verification tier, and organization mapping.'}
        </Typography>
      </Box>

      <Paper component="form" onSubmit={handleSave} elevation={0} sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 3, border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, bgcolor: isDark ? '#1e293b' : '#ffffff' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: isDark ? '#e2e8f0' : '#1e293b' }}>Identity & Contact</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5 }}>
          <TextField required size="small" label="Full Name" value={form.full_name} onChange={(e) => handleInput('full_name', e.target.value)} />
          <TextField required size="small" type="email" label="Email Address" value={form.email} onChange={(e) => handleInput('email', e.target.value)} />
          <TextField size="small" label="Phone Number" value={form.phone} onChange={(e) => handleInput('phone', e.target.value)} />
          <TextField size="small" label="Designation" value={form.designation} onChange={(e) => handleInput('designation', e.target.value)} />
          <TextField required size="small" label="State" value={form.state} onChange={(e) => handleInput('state', e.target.value)} />
          <TextField size="small" label="District" value={form.district} onChange={(e) => handleInput('district', e.target.value)} />
          <TextField
            size="small"
            label="Avatar URL"
            value={form.avatar_url}
            onChange={(e) => handleInput('avatar_url', e.target.value)}
            placeholder="https://api.dicebear.com/7.x/notionists/svg?seed=..."
          />
          {!isEdit && (
            <TextField
              size="small"
              label="Temporary Password"
              value={form.temp_password}
              onChange={(e) => handleInput('temp_password', e.target.value)}
              helperText="User can reset this after first sign-in."
            />
          )}
        </Box>

        <Divider sx={{ my: 2.5, borderColor: isDark ? '#334155' : '#f1f5f9' }} />

        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: isDark ? '#e2e8f0' : '#1e293b' }}>Role, Organization & Verification</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5 }}>
          <FormControl fullWidth required size="small">
            <InputLabel>Platform Role</InputLabel>
            <Select label="Platform Role" value={form.user_type} onChange={(e) => handleInput('user_type', e.target.value as UserType)}>
              <MenuItem value="system_admin">System Admin</MenuItem>
              <MenuItem value="government_official">Government Official</MenuItem>
              <MenuItem value="ngo_staff">NGO Staff</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth size="small">
            <InputLabel>Organization Assignment</InputLabel>
            <Select label="Organization Assignment" value={form.organization_id} onChange={(e) => handleInput('organization_id', e.target.value)}>
              <MenuItem value="">Unassigned</MenuItem>
              {organizationOptions.map((org) => (
                <MenuItem key={org.id} value={org.id}>
                  {org.short_name} - {org.state}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth required size="small">
            <InputLabel>Account Status</InputLabel>
            <Select label="Account Status" value={form.status} onChange={(e) => handleInput('status', e.target.value as UserStatus)}>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="pending_verification">Pending Verification</MenuItem>
              <MenuItem value="suspended">Suspended</MenuItem>
              <MenuItem value="deactivated">Deactivated</MenuItem>
              <MenuItem value="terminated">Terminated</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth required size="small">
            <InputLabel>Verification Tier</InputLabel>
            <Select label="Verification Tier" value={form.verification_tier} onChange={(e) => handleInput('verification_tier', e.target.value as VerificationTier)}>
              <MenuItem value="tier_1">Tier 1</MenuItem>
              <MenuItem value="tier_2">Tier 2</MenuItem>
              <MenuItem value="tier_3">Tier 3</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}>
          <Button variant="outlined" onClick={() => navigate('/users')} sx={{ textTransform: 'none', borderRadius: 2 }} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" sx={{ textTransform: 'none', borderRadius: 2, bgcolor: '#0D9488', '&:hover': { bgcolor: '#0F766E' } }} disabled={loading}>
            {isEdit ? 'Save Changes' : 'Create User'}
          </Button>
        </Box>
      </Paper>

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
