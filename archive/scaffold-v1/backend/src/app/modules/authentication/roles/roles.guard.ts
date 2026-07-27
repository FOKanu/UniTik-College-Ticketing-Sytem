// Re-exports the shared role guard for module-local, explicit imports within this module's
// routes. Keeps the "roles" concept visible as its own concern inside authentication/, per the
// requested module layout, without duplicating the guard implementation.

export { requireRole, requireAuth } from '../../../middleware/auth.middleware';
export { Role } from '../../../shared/constants/roles';
