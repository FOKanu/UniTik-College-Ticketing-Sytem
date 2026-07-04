// Application-level configuration constants that are not secrets (those live in env.ts).
// TODO: move module-specific config (e.g. pagination defaults, upload limits) here as modules need it.

export const appConfig = {
  apiPrefix: '/api/v1',
  pagination: {
    defaultPageSize: 20,
    maxPageSize: 100,
  },
  uploads: {
    maxFileSizeMb: 10, // NFR-1.2.3 attachment support
    allowedMimeTypes: ['application/pdf', 'image/png', 'image/jpeg'],
  },
};
