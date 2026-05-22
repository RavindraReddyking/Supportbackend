export declare class RoundLookupDto {
    roundId?: string;
    RoundId?: string;
    gameId?: string;
    GameId?: string;
    userId?: string;
    UserId?: string;
    normalized(): {
        roundId: string | undefined;
        gameId: string | undefined;
        userId: string | undefined;
    };
}
export declare class PlayerRangeDto {
    UserId: string;
    StartTime: string;
    EndTime: string;
}
export declare class CasinoLookupDto {
    casinoid: string;
}
export declare class UserEmailLookupDto {
    email: string;
}
