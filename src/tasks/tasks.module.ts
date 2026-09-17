import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TasksController } from './tasks.controller.js';
import { TasksService } from './tasks.service.js';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}