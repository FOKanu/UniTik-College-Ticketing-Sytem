-- Reference schema for the "user" domain. Source of truth is backend/prisma/schema.prisma.
-- TODO: finalize once SSO/LDAP integration (OI-01) is confirmed with IT.

CREATE TABLE IF NOT EXISTS "User" (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email         VARCHAR(255) NOT NULL UNIQUE,
    display_name  VARCHAR(255) NOT NULL,
    role          VARCHAR(20)  NOT NULL DEFAULT 'STUDENT', -- STUDENT | STAFF | ADMIN
    department    VARCHAR(255),                             -- for staff routing (facility, IT, etc.)
    password_hash VARCHAR(255),                              -- nullable: SSO-only users may have none
    external_id   VARCHAR(255),                              -- TODO: LDAP/SSO subject id, pending OI-01
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
