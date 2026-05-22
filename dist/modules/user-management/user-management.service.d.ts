import { UserManagementRepository } from './user-management.repository';
export declare class UserManagementService {
    private readonly repository;
    constructor(repository: UserManagementRepository);
    findByEmail(emailAddress: string): Promise<{
        success: boolean;
        api: string;
        count: number;
        data: import("./user-management.types").PortalUserLookup[];
    }>;
    findByUserId(userId: string): Promise<{
        success: boolean;
        api: string;
        count: number;
        data: import("./user-management.types").PortalUserLookup[];
    }>;
    findUser(emailAddress?: string, userId?: string): Promise<{
        success: boolean;
        api: string;
        count: number;
        data: import("./user-management.types").PortalUserLookup[];
    }>;
}
