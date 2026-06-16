import {
  Controller,
  Get,
  Query,
} from '@nestjs/common';

import { GameTraceService } from './game-trace.service';

import { GameTraceDto } from '../../common/dto/lookup.dto';

@Controller('game-trace')
export class GameTraceController {
  constructor(
    private readonly gameTraceService: GameTraceService,
  ) {}

  @Get()
  async getGameTrace(
    @Query() query: GameTraceDto,
  ) {
    return this.gameTraceService.getGameTrace(
      query,
    );
  }
}