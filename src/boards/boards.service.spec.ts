import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BoardsService } from './boards.service.js';

describe('BoardsService', () => {
  const prisma = { board: { findFirst: vi.fn(), findMany: vi.fn(), update: vi.fn(), delete: vi.fn(), create: vi.fn() }, column: { createMany: vi.fn() }, $transaction: vi.fn() };
  let service: BoardsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new BoardsService(prisma as never);
  });

  it('does not expose a board owned by another user', async () => {
    prisma.board.findFirst.mockResolvedValue(null);
    await expect(service.findOneOwned('board-1', 'user-2')).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.board.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'board-1', userId: 'user-2' } }));
  });

  it('checks ownership before updating a board', async () => {
    prisma.board.findFirst.mockResolvedValue(null);
    await expect(service.update('board-1', 'user-2', { title: 'Changed' } as never)).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.board.update).not.toHaveBeenCalled();
  });

  it('creates the default columns inside the board transaction', async () => {
    const tx = { board: { create: vi.fn().mockResolvedValue({ id: 'board-1' }), findUnique: vi.fn().mockResolvedValue({ id: 'board-1', columns: [] }) }, column: { createMany: vi.fn() } };
    prisma.$transaction.mockImplementation((callback: (client: typeof tx) => unknown) => callback(tx));
    await service.create('user-1', { title: 'Sprint' } as never);
    expect(tx.column.createMany).toHaveBeenCalledWith(expect.objectContaining({ data: expect.arrayContaining([expect.objectContaining({ title: 'To Do', order: 0, boardId: 'board-1' })]) }));
  });
});