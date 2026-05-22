import { DatabaseService } from '../../database/database.service';
export type AuthPortalUser = {
    userId: string | null;
    emailAddress: string | null;
    screenName: string | null;
    casinoId: string | null;
    passhash: string | null;
    status: string | null;
};
export declare class AuthRepository {
    private readonly database;
    constructor(database: DatabaseService);
    findByEmail(emailAddress: string): Promise<AuthPortalUser | null>;
}
