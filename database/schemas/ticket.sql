-- Reference schema for the "ticket" domain. Source of truth is backend/prisma/schema.prisma.

CREATE TABLE IF NOT EXISTS "Ticket" (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject        VARCHAR(255) NOT NULL,
    description    TEXT NOT NULL,
    status         VARCHAR(20) NOT NULL DEFAULT 'OPEN', -- OPEN | IN_PROGRESS | RESOLVED | CLOSED
    category       VARCHAR(100),                          -- TODO: set by AI classification module
    department     VARCHAR(255),                          -- assigned department (facility, IT, registrar...)
    priority       VARCHAR(20) DEFAULT 'MEDIUM',
    created_by     UUID NOT NULL REFERENCES "User"(id),
    assigned_to    UUID REFERENCES "User"(id),
    problem_id     UUID,                                  -- FK to Problem, nullable, see problem.sql
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- NEG-3 / NEG-4: enforce row-level access (students see only their own tickets, never staff-only notes)
-- at the application/repository layer. TODO: consider Postgres RLS policies as a defense-in-depth layer.
