import { describe, expect, it } from 'vitest';
import { loginService } from '../services/login.service';

describe('loginService (scaffold)', () => {
  it('exposes a login function', () => {
    expect(typeof loginService.login).toBe('function');
  });

  // TODO: replace with real tests (mocking apiClient) once authentication module is implemented.
});
