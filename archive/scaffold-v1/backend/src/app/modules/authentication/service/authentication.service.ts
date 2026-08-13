// Orchestrates repository + jwt/. Does NOT call ldap/ yet — see README.md and OI-01.
// TODO: replace mock login/register with real credential verification and user creation.

import { AuthenticationRepository } from '../repository/authentication.repository';
import { JwtService } from '../jwt/jwt.service';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { Role } from '../../../shared/constants/roles';

export class AuthenticationService {
  constructor(
    private readonly repository: AuthenticationRepository = new AuthenticationRepository(),
    private readonly jwtService: JwtService = new JwtService(),
  ) {}

  async login(dto: LoginDto): Promise<{ token: string }> {
    // TODO: verify credentials via this.repository once implemented; currently mock-issues a token.
    void this.repository;
    const token = this.jwtService.sign({ sub: 'mock-user-id', role: Role.STUDENT, email: dto.email });
    return { token };
  }

  async register(dto: RegisterDto): Promise<{ id: string; email: string; displayName: string }> {
    // TODO: hash password and persist via this.repository once implemented.
    return { id: 'mock-user-id', email: dto.email, displayName: dto.displayName };
  }

  async me(userId: string): Promise<{ id: string }> {
    // TODO: look up real user by id.
    return { id: userId };
  }
}
