import { AuthenticationService } from '../service/authentication.service';

describe('AuthenticationService (scaffold)', () => {
  const service = new AuthenticationService();

  it('issues a mock token on login', async () => {
    const result = await service.login({ email: 'student@uni.edu', password: 'placeholder' });
    expect(typeof result.token).toBe('string');
  });

  // TODO: replace with real credential-verification tests once implemented.
});
