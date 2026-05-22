import { Controller, Get, Query } from '@nestjs/common';
import { UserManagementService } from './user-management.service';

@Controller('user-management')
export class UserManagementController {
  constructor(private readonly service: UserManagementService) {}

  @Get('search')
  async searchUser(
    @Query('emailAddress') emailAddress?: string,
    @Query('userId') userId?: string,
  ) {
    // Validate: frontend must send ONLY ONE
    if (!emailAddress && !userId) {
      return {
        success: false,
        message: 'Either emailAddress or userId is required',
      };
    }

    if (emailAddress && userId) {
      return {
        success: false,
        message: 'Send only one: emailAddress OR userId, not both',
      };
    }

    // If emailAddress provided → search by email
    if (emailAddress) {
      return this.service.findByEmail(emailAddress);
    }

    // If userId provided → search by userId
    return this.service.findByUserId(userId!); // <-- FIX: userId! tells TS it's not undefined
  }
}
