import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { DatabaseModule } from '../../database/database.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SessionAuthGuard } from './session-auth.guard';
import { MemorySessionStore } from './session-store/memory-session.store';
import { RedisSessionStore } from './session-store/redis-session.store';
import { SessionStoreService } from './session-store/session-store.service';
import { AuthRepository } from './auth.repository';
import { RolesGuard } from './roles.guard';

@Module({
  imports: [AuditLogModule, DatabaseModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    MemorySessionStore,
    RedisSessionStore,
    SessionStoreService,
    AuthRepository,
    {
      provide: APP_GUARD,
      useClass: SessionAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
  exports: [AuthService, SessionStoreService],
})
export class AuthModule {}
