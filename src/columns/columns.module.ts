import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ColumnsController } from './columns.controller.js';
import { ColumnsService } from './columns.service.js';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [ColumnsController],
  providers: [ColumnsService],
})
export class ColumnsModule {}