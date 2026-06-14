import { Module } from '@nestjs/common';

import { GameLaunchController } from './gamelaunch.controller';
import { GameLaunchService } from './gamelaunch.service';
import { GameLaunchRepository } from './gamelaunch.repository';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule,AuditLogModule],

  controllers: [
    GameLaunchController,
  ],

  providers: [
    GameLaunchService,
    GameLaunchRepository,
  ],
})
export class GameLaunchModule {}