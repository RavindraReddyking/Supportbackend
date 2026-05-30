export type RoundLookupParams = {
  roundId?: string;
  gameId?: string;
  userId?: string;
};

export type CrashGameParams = RoundLookupParams & {
  gameType: string;
};
