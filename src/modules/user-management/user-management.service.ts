import { Injectable } from '@nestjs/common';
import { UserManagementRepository } from './user-management.repository';

@Injectable()
export class UserManagementService {
  constructor(private readonly repository: UserManagementRepository) {}

  async findByEmail(emailAddress: string) {
    const rows = await this.repository.findByEmail(emailAddress);

    return {
      success: true,
      api: 'user-management/search',
      count: rows.length,
      data: rows,
    };
  }

  async findByUserId(userId: string) {
    const rows = await this.repository.findByUserId(userId);

    return {
      success: true,
      api: 'user-management/search',
      count: rows.length,
      data: rows,
    };
  }

  async findUser(emailAddress?: string, userId?: string) {
    const rows = await this.repository.findUser(emailAddress, userId);

    return {
      success: true,
      api: 'user-management/search',
      count: rows.length,
      data: rows,
    };
  }
}
