import { DatabaseService } from '../../database/database.service';
import { PortalUserLookup } from './user-management.types';
export declare class UserManagementRepository {
    private readonly database;
    constructor(database: DatabaseService);
    findUser(emailAddress?: string, userId?: string): Promise<PortalUserLookup[]>;
    findByEmail(emailAddress: string): Promise<PortalUserLookup[]>;
    findByUserId(userId: string): Promise<PortalUserLookup[]>;
    findByUserIdAndEmail(userId: string, emailAddress: string): Promise<PortalUserLookup[]>;
}
