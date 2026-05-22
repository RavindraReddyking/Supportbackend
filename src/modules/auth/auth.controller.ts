import type { Request, Response } from 'express';
import { Body, Controller, Get, HttpCode, Post, Query, Req, Res, UnauthorizedException } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { AuditLogService } from '../audit-log/audit-log.service';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Public()
  @Get('session')
  async getSession(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const session = await this.authService.resolveSessionFromRequest(request, true);

    if (!session) {
      await this.authService.clearSession(response, request);
      return {
        success: false,
        api: '/api/auth/session',
        authenticated: false,
        error: 'Session expired. Please log in again.',
        sessionStore: this.authService.getSessionStoreKind(),
      };
    }

    this.authService.attachSessionCookie(response, session);

    return {
      success: true,
      api: '/api/auth/session',
      authenticated: true,
      idleTimeoutMinutes: 60,   // ⬅️ UPDATED FROM 20 TO 60
      user: session.user,
      sessionStore: this.authService.getSessionStoreKind(),
    };
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  async loginWithPassword(
    @Body() body: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const user = await this.authService.validatePortalUser(body.email, body.password);

    if (!user) {
      this.auditLogService.capture(request, {
        action: 'LOGIN',
        entityType: 'auth',
        entityValue: body.email,
        status: 'FAILED',
        metadata: { provider: 'password', reason: 'INVALID_CREDENTIALS' },
      });

      throw new UnauthorizedException({
        success: false,
        api: '/api/auth/login',
        error: 'Invalid email or password.',
      });
    }

    const session = await this.authService.createSession(user);
    this.authService.attachSessionCookie(response, session);

    this.auditLogService.capture(request, {
      action: 'LOGIN',
      entityType: 'auth',
      entityValue: session.user.email,
      status: 'SUCCESS',
      metadata: {
        provider: 'password',
        mode: 'session-cookie',
        sessionStore: this.authService.getSessionStoreKind(),
        role: session.user.role,
      },
    });

    return {
      success: true,
      api: '/api/auth/login',
      authenticated: true,
      user: session.user,
      sessionStore: this.authService.getSessionStoreKind(),
    };
  }

  @Public()
  @Get('azure/login')
  login(@Res() response: Response, @Query('returnTo') returnTo?: string) {
    const safeReturnTo = typeof returnTo === 'string' && returnTo.startsWith('/') ? returnTo : '/home';
    return response.redirect(this.authService.getAzureAuthorizeUrl(safeReturnTo));
  }

  @Public()
  @Get('azure/callback')
  async callback(@Req() request: Request, @Res() response: Response) {
    const session = await this.authService.createSession(this.authService.getMockUser());
    this.authService.attachSessionCookie(response, session);

    this.auditLogService.capture(request, {
      action: 'LOGIN',
      entityType: 'auth',
      entityValue: session.user.email,
      status: 'SUCCESS',
      metadata: {
        provider: 'azure',
        mode: 'session-cookie',
        sessionStore: this.authService.getSessionStoreKind(),
      },
    });

    const returnTo = this.authService.parseReturnTo(request.query?.state?.toString());
    return response.redirect(`${this.authService.getFrontendBaseUrl()}${returnTo}`);
  }

  @Post('logout')
  async logout(@Req() request: Request, @Res() response: Response) {
    const session = await this.authService.resolveSessionFromRequest(request, false);

    if (session) {
      this.auditLogService.capture(request, {
        action: 'LOGOUT',
        entityType: 'auth',
        entityValue: session.user.email,
        status: 'SUCCESS',
      });
    }

    await this.authService.clearSession(response, request);
    return response.redirect(this.authService.getFrontendBaseUrl());
  }
}
