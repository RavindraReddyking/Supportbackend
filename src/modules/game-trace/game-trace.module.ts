import { Module } from '@nestjs/common';

import { GameTraceController } from './game-trace.controller';
import { GameTraceService } from './game-trace.service';
import { GameTraceRepository } from './game-trace.repository';

@Module({
  controllers: [GameTraceController],

  providers: [
    GameTraceService,
    GameTraceRepository,
  ],
})
export class GameTraceModule {}