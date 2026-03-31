import type {
  OrganizationStatus,
  OrganizationType,
  UserStatus,
  UserType,
  VerificationCheckType,
  VerificationStatus,
  VerificationTier,
} from '../types/adminManagement';

export const labelForUserType = (value: UserType): string => {
  switch (value) {
    case 'system_admin':
      return 'System Admin';
    case 'government_official':
      return 'Government Official';
    case 'ngo_staff':
      return 'NGO Staff';
    default:
      return value;
  }
};

export const labelForUserStatus = (value: UserStatus): string => {
  switch (value) {
    case 'active':
      return 'Active';
    case 'pending_verification':
      return 'Pending Verification';
    case 'suspended':
      return 'Suspended';
    case 'deactivated':
      return 'Deactivated';
    case 'terminated':
      return 'Terminated';
    default:
      return value;
  }
};

export const labelForVerificationTier = (value: VerificationTier): string => {
  switch (value) {
    case 'tier_1':
      return 'Tier 1';
    case 'tier_2':
      return 'Tier 2';
    case 'tier_3':
      return 'Tier 3';
    default:
      return value;
  }
};

export const labelForOrganizationType = (value: OrganizationType): string => {
  switch (value) {
    case 'government':
      return 'Government';
    case 'ngo':
      return 'NGO';
    default:
      return value;
  }
};

export const labelForOrganizationStatus = (value: OrganizationStatus): string => {
  switch (value) {
    case 'approved':
      return 'Approved';
    case 'pending_approval':
      return 'Pending Approval';
    case 'rejected':
      return 'Rejected';
    case 'suspended':
      return 'Suspended';
    default:
      return value;
  }
};

export const labelForVerificationStatus = (value: VerificationStatus): string => {
  switch (value) {
    case 'new_submission':
      return 'New Submission';
    case 'in_review':
      return 'In Review';
    case 'awaiting_rework':
      return 'Awaiting Rework';
    case 'approved':
      return 'Approved';
    case 'rejected':
      return 'Rejected';
    case 'escalated':
      return 'Escalated';
    default:
      return value;
  }
};

export const labelForVerificationCheckType = (value: VerificationCheckType): string => {
  switch (value) {
    case 'identity':
      return 'Identity';
    case 'document':
      return 'Document Verification';
    case 'employment':
      return 'Employment Proof';
    case 'regional_clearance':
      return 'Regional Clearance';
    default:
      return value;
  }
};
