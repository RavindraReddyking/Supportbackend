import { Module } from '@nestjs/common';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { DatabaseModule } from '../../database/database.module';
import { UserManagementController } from './user-management.controller';
import { UserManagementRepository } from './user-management.repository';
import { UserManagementService } from './user-management.service';

@Module({
  imports: [DatabaseModule, AuditLogModule],
  controllers: [UserManagementController],
  providers: [UserManagementRepository, UserManagementService],
})
export class UserManagementModule {}
