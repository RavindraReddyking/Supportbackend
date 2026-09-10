import { Injectable } from '@nestjs/common';
import { UserManagementRepository } from './user-management.repository';

@Injectable()
export class UserManagementService {
  constructor(private readonly repository: UserManagementRepository) {}

  private convertKeysToSnakeCase(rows: any[]) {
    return rows.map((row) =>
      Object.fromEntries(
        Object.entries(row).map(([key, value]) => [
          key
            .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
            .toLowerCase(),
          value,
        ]),
      ),
    );
  }

  async findByEmail(emailAddress: string) {
    const rows = await this.repository.findByEmail(emailAddress);

    return {
      success: true,
      api: 'user-management/search',
      count: rows.length,
      data: this.convertKeysToSnakeCase(rows),
    };
  }

  async findByUserId(userId: string) {
    const rows = await this.repository.findByUserId(userId);

    return {
      success: true,
      api: 'user-management/search',
      count: rows.length,
      data: this.convertKeysToSnakeCase(rows),
    };
  }

  async findUser(emailAddress?: string, userId?: string) {
    const rows = await this.repository.findUser(emailAddress, userId);

    return {
      success: true,
      api: 'user-management/search',
      count: rows.length,
      data: this.convertKeysToSnakeCase(rows),
    };
  }
}