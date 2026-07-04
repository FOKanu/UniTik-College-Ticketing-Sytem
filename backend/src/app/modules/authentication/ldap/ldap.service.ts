// STUB ONLY — pending confirmation from university IT (Open Issue OI-01: source system, access
// method, and authentication protocol are unconfirmed).
//
// Do NOT import this file from outside the authentication module, and do NOT wire it into
// authentication.service.ts until OI-01 is resolved. Keeping it isolated means the rest of the
// application has zero dependency on LDAP/SSO decisions that are still open.

export interface LdapCredentials {
  username: string;
  password: string;
}

export class LdapService {
  async authenticate(_credentials: LdapCredentials): Promise<never> {
    // TODO: implement once IT confirms source system, bind method, and protocol (OI-01).
    throw new Error('LDAP integration pending IT confirmation (OI-01) — not yet implemented.');
  }
}
