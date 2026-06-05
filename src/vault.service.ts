import { Injectable } from '@nestjs/common';
const vault = require('node-vault');

@Injectable()
export class VaultService {
  private client = vault({
    endpoint: process.env.VAULT_ADDR,   // Make sure this exists in .env
    token: process.env.VAULT_TOKEN,     // Make sure this exists in .env
  });

  async getSecrets(): Promise<Record<string, any>> {
    try {
      const secretPath = process.env.VAULT_SECRET_PATH;

      if (!secretPath) {
        throw new Error('VAULT_SECRET_PATH is not defined in .env');
      }

      console.log('Fetching secrets from Vault...');

      const res = await this.client.read(secretPath);

      console.log('Vault response received');

      // KV v2 structure
      return res.data.data;

    }
catch (error) {
  if (error instanceof Error) {
    console.error('Error fetching secrets from Vault:', error.message);
  } else {
    console.error('Unknown error:', error);
  }
  throw error;
}
  }
}