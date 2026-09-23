import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TasksService } from './tasks.service.js';

describe('TasksService', () => {
  const prisma = { column: { findFirst: vi.fn() }, task: { findFirst: vi.fn(), count: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), findMany: vi.fn(), findUnique: vi.fn() }, $transaction: vi.fn() };
  let service: TasksService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new TasksService(prisma as never);
  });

  it('rejects creating a task in another user column', async () => {
    prisma.column.findFirst.mockResolvedValue(null);
    await expect(service.create('user-2', { columnId: 'column-1', title: 'Blocked' } as never)).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.task.create).not.toHaveBeenCalled();
  });

  it('rejects updating a task that is not owned', async () => {
    prisma.task.findFirst.mockResolvedValue(null);
    await expect(service.update('task-1', 'user-2', { title: 'Blocked' } as never)).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.task.update).not.toHaveBeenCalled();
  });

  it('checks both task ownership and target column ownership before moving', async () => {
    prisma.task.findFirst.mockResolvedValue({ id: 'task-1', columnId: 'column-1' });
    prisma.column.findFirst.mockResolvedValue(null);
    await expect(service.move('task-1', 'user-1', { targetColumnId: 'column-2', newOrder: 0 } as never)).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});