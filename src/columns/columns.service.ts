import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateColumnDto } from './dto/create-column.dto.js';
import { UpdateColumnDto } from './dto/update-column.dto.js';
import { ReorderColumnDto } from './dto/reorder-column.dto.js';

@Injectable()
export class ColumnsService {
  constructor(private readonly prisma: PrismaService) {}

  private async verifyBoardOwnership(boardId: string, userId: string) {
    const board = await this.prisma.board.findFirst({
      where: { id: boardId, userId },
    });
    if (!board) {
      throw new NotFoundException('Board not found');
    }
    return board;
  }

  async findOneOwned(columnId: string, userId: string) {
    const column = await this.prisma.column.findFirst({
      where: { id: columnId, board: { userId } },
      include: { tasks: { orderBy: { order: 'asc' } } },
    });

    if (!column) {
      throw new NotFoundException('Column not found');
    }

    return column;
  }

  async create(userId: string, dto: CreateColumnDto) {
    await this.verifyBoardOwnership(dto.boardId, userId);

    const columnCount = await this.prisma.column.count({
      where: { boardId: dto.boardId },
    });

    return this.prisma.column.create({
      data: {
        title: dto.title,
        order: columnCount,
        boardId: dto.boardId,
      },
    });
  }

  async update(columnId: string, userId: string, dto: UpdateColumnDto) {
    await this.findOneOwned(columnId, userId);

    return this.prisma.column.update({
      where: { id: columnId },
      data: { title: dto.title },
    });
  }

  async remove(columnId: string, userId: string) {
    const column = await this.findOneOwned(columnId, userId);

    const taskCount = await this.prisma.task.count({
      where: { columnId },
    });

    if (taskCount > 0) {
      throw new ConflictException({
        message: 'Cannot delete a column that still contains tasks',
        error: 'COLUMN_NOT_EMPTY',
      });
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.column.delete({ where: { id: columnId } });

      const remainingColumns = await tx.column.findMany({
        where: { boardId: column.boardId },
        orderBy: { order: 'asc' },
      });

      await Promise.all(
        remainingColumns.map((col, index) =>
          tx.column.update({
            where: { id: col.id },
            data: { order: index },
          }),
        ),
      );

      return { id: columnId };
    });
  }

  async reorder(columnId: string, userId: string, dto: ReorderColumnDto) {
    const column = await this.findOneOwned(columnId, userId);

    return this.prisma.$transaction(async (tx) => {
      const siblingColumns = await tx.column.findMany({
        where: { boardId: column.boardId },
        orderBy: { order: 'asc' },
      });

      const withoutMoved = siblingColumns.filter((c) => c.id !== columnId);

      const clampedIndex = Math.max(
        0,
        Math.min(dto.newOrder, withoutMoved.length),
      );

      withoutMoved.splice(clampedIndex, 0, column);

      await Promise.all(
        withoutMoved.map((col, index) =>
          tx.column.update({
            where: { id: col.id },
            data: { order: index },
          }),
        ),
      );

      return tx.column.findMany({
        where: { boardId: column.boardId },
        orderBy: { order: 'asc' },
      });
    });
  }
}