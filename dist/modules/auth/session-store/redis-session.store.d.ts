import { OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AuthSession } from '../auth.types';
import type { SessionStore } from './session-store.interface';
export declare class RedisSessionStore implements SessionStore, OnModuleDestroy {
    private readonly config;
    readonly kind: "redis";
    private readonly logger;
    private client;
    private connectPromise;
    constructor(config: ConfigService);
    isConfigured(): boolean;
    private getPrefix;
    private getKey;
    private getClient;
    get(token: string): Promise<AuthSession | null>;
    set(session: AuthSession): Promise<void>;
    delete(token: string): Promise<void>;
    touch(session: AuthSession, ttlMs: number): Promise<AuthSession>;
    onModuleDestroy(): Promise<void>;
}
