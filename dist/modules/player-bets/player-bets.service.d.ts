import { PlayerRangeDto } from '../../common/dto/lookup.dto';
import { ApiListResponse } from '../../common/types/api-response';
import { PlayerBetsRepository } from './player-bets.repository';
export declare class PlayerBetsService {
    private readonly repository;
    constructor(repository: PlayerBetsRepository);
    getInfo(dto: PlayerRangeDto): Promise<ApiListResponse<any>>;
}
