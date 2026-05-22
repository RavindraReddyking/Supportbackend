import { UserManagementService } from './user-management.service';
export declare class UserManagementController {
    private readonly service;
    constructor(service: UserManagementService);
    searchUser(emailAddress?: string, userId?: string): Promise<{
        success: boolean;
        api: string;
        count: number;
        data: import("./user-management.types").PortalUserLookup[];
    } | {
        success: boolean;
        message: string;
    }>;
}
