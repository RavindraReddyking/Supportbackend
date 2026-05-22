import { createHash, randomUUID } from 'crypto';
import type { Request, Response } from 'express';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CookieOptions } from 'express';
import { AuthSession, SessionUser } from './auth.types';
import { SessionStoreService } from './session-store/session-store.service';
import { AuthRepository } from './auth.repository';

@Injectable()
export class AuthService {
  constructor(
    private readonly config: ConfigService,
    private readonly sessionStore: SessionStoreService,
    private readonly authRepository: AuthRepository,
  ) {}

  getCookieName(): string {
    return this.config.get<string>('COOKIE_NAME', 'JSESSIONID');
  }

  // Idle timeout from .env (default = 1 hour)
  getIdleTimeoutMs(): number {
    return this.config.get<number>('SESSION_IDLE_TIMEOUT_MS', 3600000);
  }

  getSessionStoreKind(): 'memory' | 'redis' {
    return this.sessionStore.kind();
  }

  isProduction(): boolean {
    return this.config.get<string>('NODE_ENV', 'development') === 'production';
  }

  private getCookieSecure(): boolean {
    const value = this.config.get<string>('COOKIE_SECURE');

    if (typeof value === 'string' && value.trim() !== '') {
      return value.trim().toLowerCase() === 'true';
    }

    return this.isProduction();
  }

  private getCookieSameSite(): 'lax' | 'none' | 'strict' {
    const value = (this.config.get<string>('COOKIE_SAMESITE', 'lax') || 'lax')
      .trim()
      .toLowerCase();

    if (value === 'none') return 'none';
    if (value === 'strict') return 'strict';

    return 'lax';
  }

  private getCookieDomain(): string | undefined {
    const value = (this.config.get<string>('COOKIE_DOMAIN', '') || '').trim();

    return value || undefined;
  }

  private getCookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      sameSite: this.getCookieSameSite(),
      secure: this.getCookieSecure(),
      path: '/',
      signed: true,
      maxAge: this.getIdleTimeoutMs(),
    };
  }

  // Mock user for local/dev login
  getMockUser(): SessionUser {
    const email = this.config.get<string>(
      'AUTH_MOCK_EMAIL',
      'ravindra.munnangi@arrise.co',
    );

    return {
      email,
      name: this.config.get<string>(
        'AUTH_MOCK_NAME',
        'Ravindra Munnangi',
      ),
      role: 'USER',
    };
  }

  hashPassword(password: string): string {
    return createHash('sha1')
      .update(password, 'utf8')
      .digest('hex')
      .toLowerCase();
  }

  // Validate portal user
  async validatePortalUser(
    email: string,
    password: string,
  ): Promise<SessionUser | null> {
    const identifier = (email || '').trim();

    const user = await this.authRepository.findByEmail(identifier);

    if (!user?.emailAddress || !user?.passhash) {
      return null;
    }

    const hashedInput = this.hashPassword((password || '').trim());

    if (hashedInput !== String(user.passhash).trim().toLowerCase()) {
      return null;
    }

    const normalizedEmail = user.emailAddress?.trim().toLowerCase();

    return {
      email: normalizedEmail || user.screenName?.trim() || identifier,
      name: user.screenName?.trim() || normalizedEmail || identifier,
      role: 'USER',
    };
  }

  private getSignedToken(request: Request): string | null {
    const cookieName = this.getCookieName();

    const signed = request.signedCookies?.[cookieName];

    if (typeof signed === 'string' && signed.trim()) {
      return signed.trim();
    }

    const fallback = request.cookies?.[cookieName];

    return typeof fallback === 'string' && fallback.trim()
      ? fallback.trim()
      : null;
  }

  async resolveSessionFromRequest(
    request: Request,
    touch: boolean,
  ): Promise<AuthSession | null> {
    const token = this.getSignedToken(request);

    if (!token) return null;

    const session = await this.sessionStore.get(token);

    if (!session) return null;

    if (session.expiresAt <= Date.now()) {
      await this.sessionStore.delete(token);
      return null;
    }

    if (touch) {
      return this.sessionStore.touch(
        session,
        this.getIdleTimeoutMs(),
      );
    }

    return session;
  }

  async createSession(user: SessionUser): Promise<AuthSession> {
    const now = Date.now();

    const session: AuthSession = {
      token: randomUUID(),
      user,
      createdAt: now,
      lastActivityAt: now,
      expiresAt: now + this.getIdleTimeoutMs(),
    };

    await this.sessionStore.set(session);

    return session;
  }

  attachSessionCookie(response: Response, session: AuthSession) {
    response.cookie(
      this.getCookieName(),
      session.token,
      this.getCookieOptions(),
    );
  }

  async clearSession(response: Response, request?: Request) {
    const token = request
      ? this.getSignedToken(request)
      : null;

    if (token) {
      await this.sessionStore.delete(token);
    }

    response.clearCookie(
      this.getCookieName(),
      this.getCookieOptions(),
    );
  }

  getAzureAuthorizeUrl(returnTo?: string): string {
    const tenantId = this.config.get<string>(
      'AZURE_TENANT_ID',
      '',
    );

    const clientId = this.config.get<string>(
      'AZURE_CLIENT_ID',
      '',
    );

    const redirectUri = this.config.get<string>(
      'AZURE_REDIRECT_URI',
      '',
    );

    const state = Buffer.from(
      JSON.stringify({
        returnTo: returnTo || '/home',
      }),
      'utf8',
    ).toString('base64url');

    if (!tenantId || !clientId || !redirectUri) {
      const callbackUrl = `${this.getBackendBaseUrl()}/api/auth/azure/callback`;

      return `${callbackUrl}?state=${encodeURIComponent(state)}`;
    }

    const base = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize`;

    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      redirect_uri: redirectUri,
      response_mode: 'query',
      scope: 'openid profile email',
      state,
    });

    return `${base}?${params.toString()}`;
  }

  parseReturnTo(rawState?: string): string {
    if (!rawState) {
      return '/home';
    }

    try {
      const decoded = JSON.parse(
        Buffer.from(rawState, 'base64url').toString('utf8'),
      ) as {
        returnTo?: unknown;
      };

      return typeof decoded.returnTo === 'string' &&
        decoded.returnTo.startsWith('/')
        ? decoded.returnTo
        : '/home';
    } catch {
      return '/home';
    }
  }

  getFrontendBaseUrl(): string {
    return this.config
      .get<string>('FRONTEND_URL', 'http://localhost:3000')
      .replace(/\/$/, '');
  }

  getBackendBaseUrl(): string {
    return this.config
      .get<string>('BACKEND_URL', 'http://localhost:3001')
      .replace(/\/$/, '');
  }
}