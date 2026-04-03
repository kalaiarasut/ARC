export type AuditEventKind = 'audit' | 'activity';

export interface AuditEvent {
  id: string;
  event_kind: AuditEventKind;
  entity_type: string;
  entity_id: string;
  action: string;
  actor_user_id: string | null;
  actor_email: string | null;
  reason: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  changed_fields: string[];
  created_at: string;
}
