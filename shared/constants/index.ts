export const SUPPORTED_LANGUAGES = ['en', 'de'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

// TODO: move department names here once confirmed with the university (facility, IT, registrar, etc.)
export const DEPARTMENTS_PLACEHOLDER = ['IT', 'FACILITY', 'REGISTRAR'] as const;
