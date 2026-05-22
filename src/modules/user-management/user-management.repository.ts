import { Injectable } from '@nestjs/common';
import * as sql from 'mssql';
import { DatabaseService } from '../../database/database.service';
import { PortalUserLookup } from './user-management.types';

@Injectable()
export class UserManagementRepository {
  constructor(private readonly database: DatabaseService) {}

  async findUser(emailAddress?: string, userId?: string): Promise<PortalUserLookup[]> {
    const schema = this.database.schema;

    const normalizedEmail = (emailAddress ?? '').trim();
    const normalizedUserId = (userId ?? '').trim();

    if (!normalizedEmail && !normalizedUserId) {
      return [];
    }

    const emailParam = normalizedEmail || null;
    const userIdParam = normalizedUserId || null;

    const result = await this.database.query(
      (request) =>
        request
          .input('EmailAddress', sql.VarChar(100), emailParam)
          .input('UserId', sql.Char(16), userIdParam),
      `
        EXEC ${schema}.usp_GetPlayerInfo
            @EmailAddress = @EmailAddress,
            @UserId       = @UserId;
      `,
    );

    return result.recordset as PortalUserLookup[] ?? [];
  }

  async findByEmail(emailAddress: string): Promise<PortalUserLookup[]> {
    return this.findUser(emailAddress, undefined);
  }

  async findByUserId(userId: string): Promise<PortalUserLookup[]> {
    return this.findUser(undefined, userId);
  }

  async findByUserIdAndEmail(userId: string, emailAddress: string): Promise<PortalUserLookup[]> {
    return this.findUser(emailAddress, userId);
  }
}
