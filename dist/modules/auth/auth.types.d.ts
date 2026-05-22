export type SessionUserRole = 'ADMIN' | 'USER';
export type SessionUser = {
    email: string;
    name: string;
    role: SessionUserRole;
};
export type AuthSession = {
    token: string;
    user: SessionUser;
    createdAt: number;
    lastActivityAt: number;
    expiresAt: number;
};
