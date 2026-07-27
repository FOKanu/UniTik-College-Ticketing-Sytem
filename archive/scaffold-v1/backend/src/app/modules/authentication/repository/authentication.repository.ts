// TODO: implement real credential lookup + password hash comparison against Prisma's User model.

import { prisma } from '../../../database/prisma';

export class AuthenticationRepository {
  async findUserByEmail(_email: string): Promise<null> {
    // TODO: replace with prisma.user.findUnique({ where: { email } })
    void prisma;
    return null;
  }
}
