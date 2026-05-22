import type { AuthSession } from '../auth.types';

export interface SessionStore {
  readonly kind: 'memory' | 'redis';
  get(token: string): Promise<AuthSession | null>;
  set(session: AuthSession): Promise<void>;
  delete(token: string): Promise<void>;
  touch(session: AuthSession, ttlMs: number): Promise<AuthSession>;
}
