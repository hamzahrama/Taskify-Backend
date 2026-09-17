import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { BoardsController } from './boards.controller.js';
import { BoardsService } from './boards.service.js';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [BoardsController],
  providers: [BoardsService],
})
export class BoardsModule {}  