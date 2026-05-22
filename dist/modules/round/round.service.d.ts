import { RoundRepository } from './round.repository';
import { RoundLookupParams } from './round.types';
export declare class RoundService {
    private readonly repository;
    constructor(repository: RoundRepository);
    private validate;
    private buildDisplayDescription;
    private mapBetTableRows;
    getBetTable(params: RoundLookupParams): Promise<any>;
    getTptTable(params: RoundLookupParams): Promise<any>;
    getCardDetails(params: RoundLookupParams): Promise<any>;
    getGameDetails(params: RoundLookupParams): Promise<any>;
}
