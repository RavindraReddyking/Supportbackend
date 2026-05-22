import type { Request } from 'express';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator';
import { AuthService } from './auth.service';

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const session = await this.authService.resolveSessionFromRequest(request, true);

    if (!session) {
      throw new UnauthorizedException({
        success: false,
        code: 'SESSION_EXPIRED',
        error: 'Session expired. Please log in again.',
      });
    }

    (request as Request & { authUser?: unknown; authSession?: unknown }).authUser = session.user;
    (request as Request & { authUser?: unknown; authSession?: unknown }).authSession = session;

    return true;
  }
}
