import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AuthSession } from '../auth.types';
import { MemorySessionStore } from './memory-session.store';
import { RedisSessionStore } from './redis-session.store';
import type { SessionStore } from './session-store.interface';

@Injectable()
export class SessionStoreService {
  private readonly logger = new Logger(SessionStoreService.name);
  private readonly activeStore: SessionStore;

  constructor(
    private readonly config: ConfigService,
    private readonly memoryStore: MemorySessionStore,
    private readonly redisStore: RedisSessionStore,
  ) {
    const configuredStore = (this.config.get<string>('SESSION_STORE') || 'memory').trim().toLowerCase();

    if (configuredStore == 'redis') {
      this.activeStore = this.redisStore.isConfigured() ? this.redisStore : this.memoryStore;
      if (!this.redisStore.isConfigured()) {
        this.logger.warn('SESSION_STORE is set to redis but REDIS_URL is not configured. Falling back to memory store.');
      }
    } else {
      this.activeStore = this.memoryStore;
    }

    this.logger.log(`Using ${this.activeStore.kind} session store`);
  }

  kind(): 'memory' | 'redis' {
    return this.activeStore.kind;
  }

  get(token: string): Promise<AuthSession | null> {
    return this.activeStore.get(token);
  }

  set(session: AuthSession): Promise<void> {
    return this.activeStore.set(session);
  }

  delete(token: string): Promise<void> {
    return this.activeStore.delete(token);
  }

  touch(session: AuthSession, ttlMs: number): Promise<AuthSession> {
    return this.activeStore.touch(session, ttlMs);
  }
}
