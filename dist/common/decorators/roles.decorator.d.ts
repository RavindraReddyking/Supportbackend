import type { SessionUserRole } from '../../modules/auth/auth.types';
export declare const ROLES_KEY = "roles";
export declare const Roles: (...roles: SessionUserRole[]) => import("@nestjs/common").CustomDecorator<string>;
