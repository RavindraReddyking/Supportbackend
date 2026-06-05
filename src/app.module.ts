import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AuditLogModule } from './modules/audit-log/audit-log.module';
import { AuthModule } from './modules/auth/auth.module';
import { CasinoModule } from './modules/casino/casino.module';
import { HealthModule } from './modules/health/health.module';
import { PlayerBetsModule } from './modules/player-bets/player-bets.module';
import { RoundModule } from './modules/round/round.module';
import { UserManagementModule } from './modules/user-management/user-management.module';
import { PlayerBetLogsModule } from './modules/player-bet-logs/player-bet-logs.module';

// ✅ ADD THESE
import { VaultService } from './vault.service';
import { VaultLoaderService } from './vault-loader.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    HealthModule,
    AuditLogModule,
    AuthModule,
    RoundModule,
    PlayerBetsModule,
    PlayerBetLogsModule,
    CasinoModule,
    UserManagementModule,
  ],

  // ✅ ADD THIS BLOCK
  providers: [VaultService, VaultLoaderService],
})
export class AppModule {}