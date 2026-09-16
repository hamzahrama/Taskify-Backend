import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { UsersModule } from '../users/users.module.js';

@Module({
  imports: [
    UsersModule,
    JwtModule.register({}), // secret di-set manual per-token, bukan global
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}