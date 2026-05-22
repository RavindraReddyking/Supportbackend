export type PlayerBetLogsParams = {
    roundId: string;
    gameId: string;
    userId: string;
    from: string;
    to: string;
};
export type TransactionLogsParams = {
    roundId: string;
    from: string;
    to: string;
};
export type GameType = 'BLACKJACK' | 'BACCARAT' | 'CRASH' | 'OTHER';
export type GameLogsParams = {
    gameId: string;
    userId: string;
    gameType: GameType;
    from: string;
    to: string;
};
export type TransactionLogItem = {
    timestamp: string;
    app: string;
    serviceMethod?: string;
    stage?: string;
    error?: string;
    message: string;
    raw: any;
};
export type GameLogItem = {
    timestamp: string;
    app: string;
    serviceName?: string;
    logLevel?: string;
    message: string;
    raw: any;
};
