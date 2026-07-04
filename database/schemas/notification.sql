-- Reference schema for notifications (v2 priority per requirements).

CREATE TABLE IF NOT EXISTS "Notification" (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES "User"(id),
    ticket_id   UUID REFERENCES "Ticket"(id),
    channel     VARCHAR(20) NOT NULL DEFAULT 'EMAIL', -- EMAIL | IN_APP
    message     TEXT NOT NULL,
    read_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
