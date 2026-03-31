export type OrganizationType = 'government' | 'ngo';

export type OrganizationStatus = 'approved' | 'pending_approval' | 'rejected' | 'suspended';

export interface Organization {
  id: string;
  name: string;
  short_name: string;
  domain: string;
  org_type: OrganizationType;
  status: OrganizationStatus;
  registration_code: string;
  state: string;
  district: string | null;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  website: string | null;
  created_at: string;
  updated_at: string;
}

export type UserType = 'system_admin' | 'government_official' | 'ngo_staff';

export type UserStatus = 'active' | 'pending_verification' | 'suspended' | 'deactivated' | 'terminated';

export type VerificationTier = 'tier_1' | 'tier_2' | 'tier_3';

export interface AdminUserProfile {
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  user_type: UserType;
  status: UserStatus;
  verification_tier: VerificationTier;
  organization_id: string | null;
  avatar_url: string | null;
  state: string;
  district: string | null;
  designation: string | null;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
  organization?: Pick<Organization, 'id' | 'name' | 'short_name' | 'org_type' | 'status'> | null;
}

export type VerificationCheckType = 'identity' | 'document' | 'employment' | 'regional_clearance';

export type VerificationStatus =
  | 'new_submission'
  | 'in_review'
  | 'awaiting_rework'
  | 'approved'
  | 'rejected'
  | 'escalated';

export interface VerificationCase {
  id: string;
  user_id: string;
  check_type: VerificationCheckType;
  status: VerificationStatus;
  assigned_admin_id: string | null;
  notes: string | null;
  submitted_at: string;
  resolved_at: string | null;
  user?: Pick<AdminUserProfile, 'user_id' | 'full_name' | 'email' | 'avatar_url' | 'status' | 'verification_tier'> | null;
  assigned_admin?: Pick<AdminUserProfile, 'user_id' | 'full_name' | 'email'> | null;
}

export interface VerificationDocument {
  id: string;
  case_id: string;
  doc_type: string;
  file_url: string;
  review_notes: string | null;
  created_at: string;
}

export interface AuditEvent {
  id: string;
  changed_by: string | null;
  old_status: string | null;
  new_status: string;
  reason: string;
  changed_at: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
}

export interface ListQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  state?: string;
}

export interface UserListQuery extends ListQuery {
  status?: UserStatus | 'all';
  userType?: UserType | 'all';
  organizationId?: string | 'all';
  verificationTier?: VerificationTier | 'all';
}

export interface OrganizationListQuery extends ListQuery {
  status?: OrganizationStatus | 'all';
  orgType?: OrganizationType | 'all';
}

export interface VerificationListQuery extends ListQuery {
  status?: VerificationStatus | 'all';
  checkType?: VerificationCheckType | 'all';
  assignedAdminId?: string | 'all';
}

export interface UpsertUserInput {
  user_id?: string | null;
  full_name: string;
  email: string;
  phone?: string | null;
  user_type: UserType;
  status: UserStatus;
  verification_tier: VerificationTier;
  organization_id?: string | null;
  state: string;
  district?: string | null;
  designation?: string | null;
  avatar_url?: string | null;
  temp_password?: string;
  reason?: string;
}

export interface UserStatusUpdateInput {
  userId: string;
  status: UserStatus;
  reason: string;
}

export interface OrganizationStatusUpdateInput {
  organizationId: string;
  status: OrganizationStatus;
  reason: string;
}

export interface VerificationStatusUpdateInput {
  caseId: string;
  status: VerificationStatus;
  reason: string;
  notes?: string;
}
