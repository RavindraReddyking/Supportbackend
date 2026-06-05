import { Injectable, OnModuleInit } from '@nestjs/common';
import { VaultService } from './vault.service';

@Injectable()
export class VaultLoaderService implements OnModuleInit {
  constructor(private vaultService: VaultService) {}

  async onModuleInit() {
    try {
      console.log('Loading secrets from Vault...');

      const secrets = await this.vaultService.getSecrets();

      for (const key of Object.keys(secrets)) {
        process.env[key] = secrets[key];
      }

      console.log('Vault secrets loaded');
    } catch (err) {
      console.log('Vault failed, using .env only');
    }
  }
}