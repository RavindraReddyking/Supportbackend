import { Controller, Get, Query } from '@nestjs/common';
import { GameLaunchService } from './gamelaunch.service';
import { CasinoLookupDto } from '../../common/dto/lookup.dto';

@Controller('gamelaunch')
export class GameLaunchController {
  constructor(
    private readonly service: GameLaunchService,
  ) {}

  @Get('games')
  async getGames(
    @Query() query: CasinoLookupDto,
  ) {
    return this.service.getCasinoGames(
      query.casinoid,
    );
  }
}