import { Injectable } from '@nestjs/common';
import { PlayerBetLogsRepository } from './player-bet-logs.repository';
import {
  GameLogsParams,
  GameLogItem,
  TransactionLogItem,
  TransactionLogsParams,
} from './player-bet-logs.types';

@Injectable()
export class PlayerBetLogsService {
  constructor(private readonly repo: PlayerBetLogsRepository) {}

  async getPlayerBetLogs(params: {
    roundId: string;
    gameId: string;
    userId: string;
    from: string;
    to: string;
  }) {
    const [roundLogs, lateLogs] = await Promise.all([
      this.repo.searchRoundLogs({
        roundId: params.roundId,
        from: params.from,
        to: params.to,
      }),
      this.repo.searchLateBetLogs({
        gameId: params.gameId,
        userId: params.userId,
        from: params.from,
        to: params.to,
      }),
    ]);

    return {
      success: true,
      count: 1,
      data: [
        {
          roundId: params.roundId,
          gameId: params.gameId,
          userId: params.userId,
          from: params.from,
          to: params.to,
          logs: [...roundLogs, ...lateLogs],
        },
      ],
    };
  }

  async getTransactionLogs(params: TransactionLogsParams) {
    const rawLogs = await this.repo.searchRoundLogs(params);

    return {
      success: true,
      roundId: params.roundId,
      lcTransactionLogs: this.mapGameApiLogs(rawLogs),
      platformLogs: this.mapPlatformLogs(rawLogs),
    };
  }

  async getGameLogs(params: GameLogsParams) {
    let rawLogs: any[] = [];

    switch (params.gameType) {
      case 'BLACKJACK':
        rawLogs = await this.repo.searchBlackjackGameLogs(params);
        break;
      case 'BACCARAT':
        rawLogs = await this.repo.searchBaccaratGameLogs(params);
        break;
      case 'CRASH':
        rawLogs = await this.repo.searchCrashGameLogs(params);
        break;
      default:
        rawLogs = await this.repo.searchGenericGameLogs(params);
        break;
    }

    return {
      success: true,
      gameId: params.gameId,
      userId: params.userId,
      gameType: params.gameType,
      gameLogs: this.mapGameLogs(rawLogs),
    };
  }

  private mapGameApiLogs(logs: any[]): TransactionLogItem[] {
    return this.dedupeByTimestampAndMessage(
      logs
        .filter((log) =>
          /\/GameAPI\/(bet|win|refund|adjusted)/i.test(this.getMessage(log)),
        )
        .map((log) => ({
          timestamp: this.getTimestamp(log),
          app: this.getApp(log),
          message: this.getMessage(log),
          raw: log,
        })),
    );
  }

  private mapPlatformLogs(logs: any[]): TransactionLogItem[] {
    return this.dedupeByTimestampAndMessage(
      logs
        .map((log) => {
          const message = this.getMessage(log);
          const parsedMessageJson = this.extractJsonFromMessage(message);

          const serviceMethod =
            this.readFirst(log, [
              'serviceMethod',
              'responseLog.serviceMethod',
              'requestLog.serviceMethod',
            ]) ||
            this.readFirst(parsedMessageJson, ['serviceMethod']);

          const stage =
            this.readFirst(log, [
              'stage',
              'responseLog.stage',
              'requestLog.stage',
            ]) ||
            this.readFirst(parsedMessageJson, [
              'stage',
              'httpMethod',
              'responseLog.stage',
              'requestLog.stage',
            ]);

          const error =
            this.readFirst(log, [
              'error',
              'responseLog.error',
              'requestLog.error',
            ]) ||
            this.readFirst(parsedMessageJson, [
              'error',
              'responseLog.error',
              'requestLog.error',
              'responseLog.description',
              'httpErrorCode',
            ]);

          return {
            timestamp: this.getTimestamp(log),
            app: this.getApp(log),
            serviceMethod,
            stage,
            error,
            message: this.pickPlatformMessage(log),
            raw: log,
          };
        })
        .filter((log) => Boolean(log.serviceMethod)),
);
  }

  private mapGameLogs(logs: any[]): GameLogItem[] {
    return this.dedupeByTimestampAndMessage(
      logs.map((log) => ({
        timestamp: this.getTimestamp(log),
        app: this.getApp(log),
        serviceName: this.readFirst(log, ['serviceName', 'service', 'app']),
        logLevel: this.readFirst(log, ['log.level', 'logLevel']),
        message: this.getMessage(log),
        raw: log,
      })),
    );
  }

  private pickPlatformMessage(log: any) {
    const values = [
      this.getMessage(log),
      this.readFirst(log, ['responseLog.description']),
      this.readFirst(log, ['responseLog.message']),
      this.readFirst(log, ['requestLog.message']),
      this.readFirst(log, ['responseLog']),
      this.readFirst(log, ['requestLog']),
    ].filter(Boolean);

    return String(values[0] ?? '');
  }

  private extractJsonFromMessage(message: string): any {
    try {
      if (!message || !message.includes('|JSON|')) {
        return {};
      }

      const jsonPart = message.split('|JSON|')[1]?.trim();
      if (!jsonPart) {
        return {};
      }

      return JSON.parse(jsonPart);
    } catch {
      return {};
    }
  }

  private getTimestamp(log: any) {
    return String(log?.['@timestamp'] ?? log?.timestamp ?? '');
  }

  private getApp(log: any) {
    return String(log?.app ?? log?.serviceName ?? log?.service ?? '');
  }

  private getMessage(log: any) {
    return String(log?.message ?? '');
  }

  private readFirst(obj: any, paths: string[]) {
    for (const path of paths) {
      const value = path.split('.').reduce((acc, key) => acc?.[key], obj);
      if (value !== undefined && value !== null && `${value}`.trim() !== '') {
        return String(value);
      }
    }

    return '';
  }

  private dedupeByTimestampAndMessage<
    T extends { timestamp: string; message: string },
  >(items: T[]): T[] {
    const seen = new Set<string>();
    const result: T[] = [];

    for (const item of items) {
      const key = `${item.timestamp}__${item.message}`;
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(item);
    }

    return result;
  }
}
