import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { TasksService } from './tasks.service.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';
import { ReorderTaskDto } from './dto/reorder-task.dto.js';
import { MoveTaskDto } from './dto/move-task.dto.js';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateTaskDto) {
    return this.tasksService.create(user.id, dto);
  }

  @Get(':id')
  findOne(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.tasksService.findOneOwned(id, user.id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasksService.update(id, user.id, dto);
  }

  @Patch(':id/reorder')
  reorder(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() dto: ReorderTaskDto,
  ) {
    return this.tasksService.reorder(id, user.id, dto);
  }

  @Patch(':id/move')
  move(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() dto: MoveTaskDto,
  ) {
    return this.tasksService.move(id, user.id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.tasksService.remove(id, user.id);
  }
}