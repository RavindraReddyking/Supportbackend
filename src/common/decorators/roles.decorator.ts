import { SetMetadata } from '@nestjs/common';
import type { SessionUserRole } from '../../modules/auth/auth.types';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: SessionUserRole[]) => SetMetadata(ROLES_KEY, roles);
