import { Injectable } from '@nestjs/common';
import { BadRequestException } from '@nestjs/common/exceptions';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'node:crypto';
import { LoggerService } from 'src/common/logger/logger.service';

@Injectable()
export class CryptoService {
    constructor(
    private readonly config: ConfigService,
    private readonly loggerService: LoggerService,
  ) {}

  encrypt(token: string): string {
    if (!token) {
      this.loggerService.warn(
        'AUTH',
        'SERVICE',
        'Encrypt token failed - Token is required',
        {
          token,
        },
      );

      throw new BadRequestException('Token is required');
    }

    const algorithm = this.config.get<string>('CRYPTO_ALGORITHM')!;
    const secretKey = Buffer.from(
      this.config.get<string>('CRYPTO_SECRET_KEY')!,
      'hex',
    );

    console.log('ALGO:', this.config.get('CRYPTO_ALGORITHM'));
    console.log('KEY:', this.config.get('CRYPTO_SECRET_KEY'));

    if (secretKey.length !== 32) {
        this.loggerService.warn(
          'AUTH',
          'SERVICE',
          'Encrypt token failed - Secret key must be 32 bytes for AES-256',
          {
            secretKey_length: secretKey.length,
          },
        );
      throw new Error('Secret key must be 32 bytes for AES-256');
    }

    // ✅ RANDOM IV (IMPORTANT 🔥)
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(algorithm, secretKey, iv);

    let encrypted = cipher.update(token, 'utf-8', 'hex');
    encrypted += cipher.final('hex');

    return `${iv.toString('hex')}:${encrypted}`;
  }

  decrypt(encryptedToken: string): string {
    if (!encryptedToken) {
      this.loggerService.warn(
        'AUTH',
        'SERVICE',
        'Decrypt token failed - Token is required',
        {
          encryptedToken,
        },
      );

      throw new BadRequestException('Encrypted token is required');
    }

    const algorithm = this.config.get<string>('CRYPTO_ALGORITHM')!;
    const secretKey = Buffer.from(
      this.config.get<string>('CRYPTO_SECRET_KEY')!,
      'hex',
    );

    const [ivHex, encrypted] = encryptedToken.split(':');

    if (!ivHex || !encrypted) {
      this.loggerService.warn(
        'AUTH',
        'SERVICE',
        'Decrypt token failed - Invalid encrypted token format',
        {
          ivHex,
          encrypted,
        },
      );

      throw new BadRequestException('Invalid encrypted token format');
    }

    const iv = Buffer.from(ivHex, 'hex');

    const decipher = crypto.createDecipheriv(algorithm, secretKey, iv);

    let decrypted = decipher.update(encrypted, 'hex', 'utf-8');
    decrypted += decipher.final('utf-8');

    return decrypted;
  }
}
