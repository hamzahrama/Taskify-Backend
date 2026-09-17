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
import { ColumnsService } from './columns.service.js';
import { CreateColumnDto } from './dto/create-column.dto.js';
import { UpdateColumnDto } from './dto/update-column.dto.js';
import { ReorderColumnDto } from './dto/reorder-column.dto.js';

@Controller('columns')
@UseGuards(JwtAuthGuard)
export class ColumnsController {
  constructor(private readonly columnsService: ColumnsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateColumnDto) {
    return this.columnsService.create(user.id, dto);
  }

  @Get(':id')
  findOne(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.columnsService.findOneOwned(id, user.id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() dto: UpdateColumnDto,
  ) {
    return this.columnsService.update(id, user.id, dto);
  }

  @Patch(':id/reorder')
  reorder(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() dto: ReorderColumnDto,
  ) {
    return this.columnsService.reorder(id, user.id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.columnsService.remove(id, user.id);
  }
}