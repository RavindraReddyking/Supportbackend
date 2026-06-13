import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import axios from 'axios';
import * as crypto from 'crypto';

import { GameLaunchRepository } from './gamelaunch.repository';

@Injectable()
export class GameLaunchService {
  constructor(
    private readonly repository: GameLaunchRepository,
  ) {}

  private readonly rgsSecret =
    process.env.RGS_SECRET || '';

  private extractCasinoId(
    casinoId: string,
  ): string {
    const numericPart =
      casinoId.replace(/\D/g, '');

    let startIndex =
      numericPart.length - 4;

    while (
      startIndex > 0 &&
      numericPart[startIndex] === '0'
    ) {
      startIndex--;
    }

    return numericPart.substring(startIndex);
  }

  async getCasinoGames(
    casinoId: string,
  ) {
    // DB QUERY
    const casinoData: any =
      await this.repository.getCasinoDetails(
        casinoId,
      );

    const data =
      casinoData?.recordset?.[0];

    if (!data) {
      throw new NotFoundException(
        'Casino not found',
      );
    }

    // CLEAN VALUES
    const login = String(
      data.login,
    ).trim();

    const env = String(
      data.env,
    ).trim();

    const UCID = data.UCID;

    // CUSTOM CASINO ID
    const finalCasinoId =
      this.extractCasinoId(casinoId);

    // API PATH
    const path =
      `/RGSGateway/GameAPI/getCasinoGames/${finalCasinoId}/`;

    // FULL URL
    const url =
      `https://api-${env}.ppgames.net${path}`;

    // TIMESTAMP
    const timestamp = Math.round(
      new Date().getTime() / 1000,
    ).toString();

    // PATH FOR HMAC
    const pathForHmac =
      path.toUpperCase();

    // STRING FOR HMAC
    const strForHmac =
      `GET-${timestamp}-${pathForHmac}`;

    // HMAC MD5
    const hmacMd5 = crypto
      .createHmac(
        'md5',
        this.rgsSecret,
      )
      .update(strForHmac)
      .digest('hex');

    // BASE64
    const rgsHash = Buffer.from(
      hmacMd5,
      'utf8',
    ).toString('base64');

    // HEADERS
    const headers = {
      'Content-Type':
        'application/x-www-form-urlencoded',

      authentication:
        `hmac ${login}:${rgsHash}`,

      timestamp,
    };

    try {
      const response = await axios.get(
        url,
        {
          headers,
        },
      );

      return {
        success: true,
        requestedUrl: url,
        casinoId: finalCasinoId,
        env,
        UCID,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
        response:
          error.response?.data || null,
      };
    }
  }
}