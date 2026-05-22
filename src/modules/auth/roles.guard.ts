import type { Request } from 'express';
import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator';
import { ROLES_KEY } from '../../common/decorators/roles.decorator';
import type { SessionUserRole } from './auth.types';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const requiredRoles = this.reflector.getAllAndOverride<SessionUserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request & { authUser?: { role?: string } }>();
    const role = request.authUser?.role;
console.log(role)
    if (role && requiredRoles.includes(role as SessionUserRole)) {
      return true;
    }
console.log(role)
console.log(requiredRoles)
    throw new ForbiddenException({
      success: false,
      code: 'FORBIDDEN',
      error: 'You do not have access to this resource.',
    });
  }
}
