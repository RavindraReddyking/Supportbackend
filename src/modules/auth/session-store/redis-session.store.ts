import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, type RedisClientType } from 'redis';
import type { AuthSession } from '../auth.types';
import type { SessionStore } from './session-store.interface';

@Injectable()
export class RedisSessionStore implements SessionStore, OnModuleDestroy {
  readonly kind = 'redis' as const;
  private readonly logger = new Logger(RedisSessionStore.name);
  private client: RedisClientType | null = null;
  private connectPromise: Promise<void> | null = null;

  constructor(private readonly config: ConfigService) {}

  isConfigured(): boolean {
    return Boolean(this.config.get<string>('REDIS_URL'));
  }

  private getPrefix(): string {
    return this.config.get<string>('REDIS_SESSION_PREFIX', 'support-portal:session:');
  }

  private getKey(token: string): string {
    return `${this.getPrefix()}${token}`;
  }

  private async getClient(): Promise<RedisClientType> {
    if (!this.client) {
      const url = this.config.get<string>('REDIS_URL');
      if (!url) {
        throw new Error('REDIS_URL is not configured');
      }

      this.client = createClient({ url });
      this.client.on('error', (error) => {
        this.logger.error(`Redis session store error: ${error instanceof Error ? error.message : String(error)}`);
      });
    }

    if (!this.client.isOpen) {
      this.connectPromise ??= this.client.connect().then(() => undefined).finally(() => {
        this.connectPromise = null;
      });
      await this.connectPromise;
    }

    return this.client;
  }

  async get(token: string): Promise<AuthSession | null> {
    const client = await this.getClient();
    const value = await client.get(this.getKey(token));
    if (!value) return null;
    return JSON.parse(value) as AuthSession;
  }

  async set(session: AuthSession): Promise<void> {
    const client = await this.getClient();
    const ttlSeconds = Math.max(1, Math.ceil(Math.max(0, session.expiresAt - Date.now()) / 1000));
    await client.set(this.getKey(session.token), JSON.stringify(session), { EX: ttlSeconds });
  }

  async delete(token: string): Promise<void> {
    const client = await this.getClient();
    await client.del(this.getKey(token));
  }

  async touch(session: AuthSession, ttlMs: number): Promise<AuthSession> {
    const now = Date.now();
    const updated: AuthSession = {
      ...session,
      lastActivityAt: now,
      expiresAt: now + ttlMs,
    };

    await this.set(updated);
    return updated;
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client?.isOpen) {
      await this.client.quit();
    }
  }
}
