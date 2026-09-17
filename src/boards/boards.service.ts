import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateBoardDto } from './dto/create-board.dto.js';
import { UpdateBoardDto } from './dto/update-board.dto.js';

const DEFAULT_COLUMNS = ['To Do', 'In Progress', 'Done'];

@Injectable()
export class BoardsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateBoardDto) {
    return this.prisma.$transaction(async (tx) => {
      const board = await tx.board.create({
        data: {
          title: dto.title,
          userId,
        },
      });

      await tx.column.createMany({
        data: DEFAULT_COLUMNS.map((title, index) => ({
          title,
          order: index,
          boardId: board.id,
        })),
      });

      return tx.board.findUnique({
        where: { id: board.id },
        include: { columns: true },
      });
    });
  }

  async findAllByUser(userId: string) {
    return this.prisma.board.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneOwned(boardId: string, userId: string) {
    const board = await this.prisma.board.findFirst({
      where: { id: boardId, userId },
      include: {
        columns: {
          orderBy: { order: 'asc' },
          include: {
            tasks: { orderBy: { order: 'asc' } },
          },
        },
      },
    });

    if (!board) {
      throw new NotFoundException('Board not found');
    }

    return board;
  }

  async update(boardId: string, userId: string, dto: UpdateBoardDto) {
    await this.findOneOwned(boardId, userId);

    return this.prisma.board.update({
      where: { id: boardId },
      data: dto,
    });
  }

  async remove(boardId: string, userId: string) {
    await this.findOneOwned(boardId, userId);

    await this.prisma.board.delete({ where: { id: boardId } });

    return { id: boardId };
  }
}