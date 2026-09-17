import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';
import { ReorderTaskDto } from './dto/reorder-task.dto.js';
import { MoveTaskDto } from './dto/move-task.dto.js';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  private async verifyColumnOwnership(columnId: string, userId: string) {
    const column = await this.prisma.column.findFirst({
      where: { id: columnId, board: { userId } },
    });
    if (!column) {
      throw new NotFoundException('Column not found');
    }
    return column;
  }

  async findOneOwned(taskId: string, userId: string) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, column: { board: { userId } } },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  async create(userId: string, dto: CreateTaskDto) {
    await this.verifyColumnOwnership(dto.columnId, userId);

    const taskCount = await this.prisma.task.count({
      where: { columnId: dto.columnId },
    });

    return this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description,
        priority: dto.priority,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        order: taskCount,
        columnId: dto.columnId,
      },
    });
  }

  async update(taskId: string, userId: string, dto: UpdateTaskDto) {
    await this.findOneOwned(taskId, userId);

    return this.prisma.task.update({
      where: { id: taskId },
      data: {
        ...dto,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
    });
  }

  async remove(taskId: string, userId: string) {
    const task = await this.findOneOwned(taskId, userId);

    return this.prisma.$transaction(async (tx) => {
      await tx.task.delete({ where: { id: taskId } });

      const remainingTasks = await tx.task.findMany({
        where: { columnId: task.columnId },
        orderBy: { order: 'asc' },
      });

      await Promise.all(
        remainingTasks.map((t, index) =>
          tx.task.update({ where: { id: t.id }, data: { order: index } }),
        ),
      );

      return { id: taskId };
    });
  }

  async reorder(taskId: string, userId: string, dto: ReorderTaskDto) {
    const task = await this.findOneOwned(taskId, userId);

    return this.prisma.$transaction(async (tx) => {
      const siblingTasks = await tx.task.findMany({
        where: { columnId: task.columnId },
        orderBy: { order: 'asc' },
      });

      const withoutMoved = siblingTasks.filter((t) => t.id !== taskId);
      const clampedIndex = Math.max(
        0,
        Math.min(dto.newOrder, withoutMoved.length),
      );
      withoutMoved.splice(clampedIndex, 0, task);

      await Promise.all(
        withoutMoved.map((t, index) =>
          tx.task.update({ where: { id: t.id }, data: { order: index } }),
        ),
      );

      return tx.task.findMany({
        where: { columnId: task.columnId },
        orderBy: { order: 'asc' },
      });
    });
  }

  async move(taskId: string, userId: string, dto: MoveTaskDto) {
    const task = await this.findOneOwned(taskId, userId);
    await this.verifyColumnOwnership(dto.targetColumnId, userId);

    const sourceColumnId = task.columnId;
    const isSameColumn = sourceColumnId === dto.targetColumnId;

    return this.prisma.$transaction(async (tx) => {
      if (isSameColumn) {
        const siblingTasks = await tx.task.findMany({
          where: { columnId: sourceColumnId },
          orderBy: { order: 'asc' },
        });
        const withoutMoved = siblingTasks.filter((t) => t.id !== taskId);
        const clampedIndex = Math.max(
          0,
          Math.min(dto.newOrder, withoutMoved.length),
        );
        withoutMoved.splice(clampedIndex, 0, task);

        await Promise.all(
          withoutMoved.map((t, index) =>
            tx.task.update({ where: { id: t.id }, data: { order: index } }),
          ),
        );
      } else {
        // Rapikan urutan di Column asal (task sudah pindah keluar)
        const sourceTasks = await tx.task.findMany({
          where: { columnId: sourceColumnId, id: { not: taskId } },
          orderBy: { order: 'asc' },
        });
        await Promise.all(
          sourceTasks.map((t, index) =>
            tx.task.update({ where: { id: t.id }, data: { order: index } }),
          ),
        );

        // Sisipkan task ke Column tujuan pada posisi yang diminta
        const targetTasks = await tx.task.findMany({
          where: { columnId: dto.targetColumnId },
          orderBy: { order: 'asc' },
        });
        const clampedIndex = Math.max(
          0,
          Math.min(dto.newOrder, targetTasks.length),
        );
        targetTasks.splice(clampedIndex, 0, { ...task, columnId: dto.targetColumnId });

        await Promise.all(
          targetTasks.map((t, index) =>
            tx.task.update({
              where: { id: t.id },
              data: { order: index, columnId: dto.targetColumnId },
            }),
          ),
        );
      }

      return tx.task.findUnique({ where: { id: taskId } });
    });
  }
}