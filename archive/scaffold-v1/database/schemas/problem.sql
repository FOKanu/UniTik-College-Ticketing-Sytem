-- Reference schema for ITIL-style Problem Management (clusters related tickets under a root cause).

CREATE TABLE IF NOT EXISTS "Problem" (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title            VARCHAR(255) NOT NULL,
    root_cause       TEXT,                 -- TODO: populated once root-cause analysis workflow exists
    status           VARCHAR(20) NOT NULL DEFAULT 'OPEN', -- OPEN | INVESTIGATING | RESOLVED
    owner_id         UUID REFERENCES "User"(id), -- the Problem Manager
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
