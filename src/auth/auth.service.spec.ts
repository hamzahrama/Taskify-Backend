import { ConflictException, UnauthorizedException } from '@nestjs/common';
import bcrypt from 'bcrypt';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from './auth.service.js';

describe('AuthService', () => {
  const users = { findByEmail: vi.fn(), create: vi.fn() };
  const prisma = { refreshToken: { findFirst: vi.fn(), update: vi.fn(), create: vi.fn(), updateMany: vi.fn() } };
  const jwt = { sign: vi.fn(() => 'access-token') };
  let service: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AuthService(users as never, prisma as never, jwt as never);
  });

  it('rejects duplicate registration', async () => {
    users.findByEmail.mockResolvedValue({ id: 'existing' });
    await expect(service.register({ name: 'A', email: 'a@example.com', password: 'secret123' } as never)).rejects.toBeInstanceOf(ConflictException);
    expect(users.create).not.toHaveBeenCalled();
  });

  it('hashes password and creates a safe user on registration', async () => {
    users.findByEmail.mockResolvedValue(null);
    users.create.mockResolvedValue({ id: 'u1', name: 'A', email: 'a@example.com' });
    vi.spyOn(bcrypt, 'hash').mockResolvedValue('hashed' as never);
    await service.register({ name: 'A', email: 'a@example.com', password: 'secret123' } as never);
    expect(users.create).toHaveBeenCalledWith({ name: 'A', email: 'a@example.com', password: 'hashed' });
  });

  it('rejects an invalid login without issuing tokens', async () => {
    users.findByEmail.mockResolvedValue(null);
    await expect(service.login({ email: 'a@example.com', password: 'wrong' } as never)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(jwt.sign).not.toHaveBeenCalled();
  });

  it('rotates a valid refresh token and revokes the old token', async () => {
    prisma.refreshToken.findFirst.mockResolvedValue({ id: 'rt1', userId: 'u1', expiresAt: new Date(Date.now() + 60_000) });
    prisma.refreshToken.create.mockResolvedValue({});
    const result = await service.refresh('refresh-token');
    expect(prisma.refreshToken.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'rt1' }, data: { revokedAt: expect.any(Date) } }));
    expect(result.accessToken).toBe('access-token');
    expect(prisma.refreshToken.create).toHaveBeenCalled();
  });
});