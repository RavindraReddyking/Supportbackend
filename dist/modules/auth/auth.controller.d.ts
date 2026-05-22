import type { Request, Response } from 'express';
import { AuditLogService } from '../audit-log/audit-log.service';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
export declare class AuthController {
    private readonly authService;
    private readonly auditLogService;
    constructor(authService: AuthService, auditLogService: AuditLogService);
    getSession(request: Request, response: Response): Promise<{
        success: boolean;
        api: string;
        authenticated: boolean;
        error: string;
        sessionStore: "memory" | "redis";
        idleTimeoutMinutes?: undefined;
        user?: undefined;
    } | {
        success: boolean;
        api: string;
        authenticated: boolean;
        idleTimeoutMinutes: number;
        user: import("./auth.types").SessionUser;
        sessionStore: "memory" | "redis";
        error?: undefined;
    }>;
    loginWithPassword(body: LoginDto, request: Request, response: Response): Promise<{
        success: boolean;
        api: string;
        authenticated: boolean;
        user: import("./auth.types").SessionUser;
        sessionStore: "memory" | "redis";
    }>;
    login(response: Response, returnTo?: string): void;
    callback(request: Request, response: Response): Promise<void>;
    logout(request: Request, response: Response): Promise<void>;
}
