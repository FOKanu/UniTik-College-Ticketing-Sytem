-- Reference schema for the audit log (NFR-2.6: all admin actions logged and reviewable).

CREATE TABLE IF NOT EXISTS "AuditLog" (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id    UUID REFERENCES "User"(id),
    action      VARCHAR(100) NOT NULL,   -- e.g. "TICKET_STATUS_CHANGED", "USER_ROLE_UPDATED"
    entity_type VARCHAR(50)  NOT NULL,   -- e.g. "Ticket", "User", "Problem"
    entity_id   UUID,
    metadata    JSONB,                    -- TODO: define per-action metadata shape
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
