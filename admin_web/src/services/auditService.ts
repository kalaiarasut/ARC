import { supabase } from '../config/supabase';
import { isSupabaseConfigured } from '../core/supabase_config';
import type { AuditEvent, AuditEventKind } from '../types/audit';

const normalizeAuditEvent = (row: any): AuditEvent => ({
  id: String(row?.id ?? ''),
  event_kind: row?.event_kind === 'activity' ? 'activity' : 'audit',
  entity_type: String(row?.entity_type ?? ''),
  entity_id: String(row?.entity_id ?? ''),
  action: String(row?.action ?? ''),
  actor_user_id: row?.actor_user_id ?? null,
  actor_email: row?.actor_email ?? null,
  reason: row?.reason ?? null,
  old_data: (row?.old_data as Record<string, unknown> | null) ?? null,
  new_data: (row?.new_data as Record<string, unknown> | null) ?? null,
  metadata: (row?.metadata as Record<string, unknown> | null) ?? null,
  changed_fields: Array.isArray(row?.changed_fields)
    ? row.changed_fields.map((item: unknown) => String(item))
    : [],
  created_at: String(row?.created_at ?? ''),
});

export const auditService = {
  async listEvents(params?: {
    limit?: number;
    offset?: number;
    search?: string;
    entityType?: string | null;
    action?: string | null;
    eventKind?: AuditEventKind | null;
  }): Promise<AuditEvent[]> {
    if (!isSupabaseConfigured()) {
      return [];
    }

    const { data, error } = await supabase.rpc('admin_list_audit_events', {
      p_limit: Math.max(1, Math.min(params?.limit ?? 250, 1000)),
      p_offset: Math.max(0, params?.offset ?? 0),
      p_search: params?.search?.trim() || null,
      p_entity_type: params?.entityType?.trim() || null,
      p_action: params?.action?.trim() || null,
      p_event_kind: params?.eventKind ?? null,
    });

    if (error) {
      throw error;
    }

    return ((data as any[]) ?? []).map(normalizeAuditEvent);
  },

  async getEntityHistory(entityType: string, entityId: string, limit = 100): Promise<AuditEvent[]> {
    if (!isSupabaseConfigured() || !entityType || !entityId) {
      return [];
    }

    const { data, error } = await supabase.rpc('admin_get_entity_audit_history', {
      p_entity_type: entityType,
      p_entity_id: entityId,
      p_limit: Math.max(1, Math.min(limit, 500)),
    });

    if (error) {
      throw error;
    }

    return ((data as any[]) ?? []).map(normalizeAuditEvent);
  },
};
