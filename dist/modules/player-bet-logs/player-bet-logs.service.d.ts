import { PlayerBetLogsRepository } from './player-bet-logs.repository';
import { GameLogsParams, GameLogItem, TransactionLogItem, TransactionLogsParams } from './player-bet-logs.types';
export declare class PlayerBetLogsService {
    private readonly repo;
    constructor(repo: PlayerBetLogsRepository);
    getPlayerBetLogs(params: {
        roundId: string;
        gameId: string;
        userId: string;
        from: string;
        to: string;
    }): Promise<{
        success: boolean;
        count: number;
        data: {
            roundId: string;
            gameId: string;
            userId: string;
            from: string;
            to: string;
            logs: any[];
        }[];
    }>;
    getTransactionLogs(params: TransactionLogsParams): Promise<{
        success: boolean;
        roundId: string;
        lcTransactionLogs: TransactionLogItem[];
        platformLogs: TransactionLogItem[];
    }>;
    getGameLogs(params: GameLogsParams): Promise<{
        success: boolean;
        gameId: string;
        userId: string;
        gameType: import("./player-bet-logs.types").GameType;
        gameLogs: GameLogItem[];
    }>;
    private mapGameApiLogs;
    private mapPlatformLogs;
    private mapGameLogs;
    private pickPlatformMessage;
    private extractJsonFromMessage;
    private getTimestamp;
    private getApp;
    private getMessage;
    private readFirst;
    private dedupeByTimestampAndMessage;
}
