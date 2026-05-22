import type { AuthSession } from '../auth.types';
import type { SessionStore } from './session-store.interface';
export declare class MemorySessionStore implements SessionStore {
    readonly kind: "memory";
    private readonly sessions;
    get(token: string): Promise<AuthSession | null>;
    set(session: AuthSession): Promise<void>;
    delete(token: string): Promise<void>;
    touch(session: AuthSession, ttlMs: number): Promise<AuthSession>;
}
