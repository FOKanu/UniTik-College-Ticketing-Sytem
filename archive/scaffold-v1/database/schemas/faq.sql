-- Reference schema for the knowledge-base / FAQ domain.

CREATE TABLE IF NOT EXISTS "FaqEntry" (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question      TEXT NOT NULL,
    answer        TEXT NOT NULL,
    language      VARCHAR(5) NOT NULL DEFAULT 'en', -- 'en' | 'de'
    category      VARCHAR(100),
    context_blob  TEXT, -- TODO: NFR-2.7.3 context engine — page-info blob for retrieval, format TBD
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
