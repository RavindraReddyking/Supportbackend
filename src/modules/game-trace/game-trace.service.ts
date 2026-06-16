import { Injectable } from '@nestjs/common';

import { GameTraceRepository } from './game-trace.repository';

@Injectable()
export class GameTraceService {
  constructor(
    private readonly gameTraceRepository: GameTraceRepository,
  ) {}

  async getGameTrace(params: any) {
    return this.gameTraceRepository.searchGameTrace(
      params,
    );
  }
}