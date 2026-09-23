import { ConflictException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ColumnsService } from './columns.service.js';

describe('ColumnsService', () => {
  const prisma = { board: { findFirst: vi.fn() }, column: { findFirst: vi.fn(), count: vi.fn(), create: vi.fn(), delete: vi.fn(), findMany: vi.fn(), update: vi.fn() }, task: { count: vi.fn() }, $transaction: vi.fn() };
  let service: ColumnsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ColumnsService(prisma as never);
  });

  it('rejects creating a column on another user board', async () => {
    prisma.board.findFirst.mockResolvedValue(null);
    await expect(service.create('user-2', { boardId: 'board-1', title: 'Blocked' } as never)).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.column.create).not.toHaveBeenCalled();
  });

  it('rejects deleting a non-empty owned column', async () => {
    prisma.column.findFirst.mockResolvedValue({ id: 'column-1', boardId: 'board-1', tasks: [] });
    prisma.task.count.mockResolvedValue(2);
    await expect(service.remove('column-1', 'user-1')).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.column.delete).not.toHaveBeenCalled();
  });

  it('rejects updating a column that is not owned', async () => {
    prisma.column.findFirst.mockResolvedValue(null);
    await expect(service.update('column-1', 'user-2', { title: 'Blocked' } as never)).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.column.update).not.toHaveBeenCalled();
  });
});