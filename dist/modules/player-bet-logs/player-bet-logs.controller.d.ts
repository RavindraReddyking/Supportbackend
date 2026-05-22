import { PlayerBetLogsService } from './player-bet-logs.service';
import { GameType } from './player-bet-logs.types';
export declare class PlayerBetLogsController {
    private readonly service;
    constructor(service: PlayerBetLogsService);
    getPlayerBetLogs(roundId?: string, gameId?: string, userId?: string, from?: string, to?: string): Promise<{
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
    getTransactionLogs(roundId?: string, from?: string, to?: string): Promise<{
        success: boolean;
        roundId: string;
        lcTransactionLogs: import("./player-bet-logs.types").TransactionLogItem[];
        platformLogs: import("./player-bet-logs.types").TransactionLogItem[];
    }>;
    getGameLogs(gameId?: string, userId?: string, gameType?: string, from?: string, to?: string): Promise<{
        success: boolean;
        gameId: string;
        userId: string;
        gameType: GameType;
        gameLogs: import("./player-bet-logs.types").GameLogItem[];
    }>;
}
