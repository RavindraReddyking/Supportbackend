import { Module } from '@nestjs/common';

import { GameLaunchController } from './gamelaunch.controller';
import { GameLaunchService } from './gamelaunch.service';
import { GameLaunchRepository } from './gamelaunch.repository';

import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],

  controllers: [GameLaunchController],

  providers: [
    GameLaunchService,
    GameLaunchRepository,
  ],
})
export class GameLaunchModule {}