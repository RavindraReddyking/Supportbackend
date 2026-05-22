import { ConfigService } from '@nestjs/config';
import type { AuthSession } from '../auth.types';
import { MemorySessionStore } from './memory-session.store';
import { RedisSessionStore } from './redis-session.store';
export declare class SessionStoreService {
    private readonly config;
    private readonly memoryStore;
    private readonly redisStore;
    private readonly logger;
    private readonly activeStore;
    constructor(config: ConfigService, memoryStore: MemorySessionStore, redisStore: RedisSessionStore);
    kind(): 'memory' | 'redis';
    get(token: string): Promise<AuthSession | null>;
    set(session: AuthSession): Promise<void>;
    delete(token: string): Promise<void>;
    touch(session: AuthSession, ttlMs: number): Promise<AuthSession>;
}
