import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { User } from 'src/generated/prisma/client';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from 'src/models/web.model';
import { CryptoService } from 'src/helpers/crypto/crypto.service';
import { UserService } from 'src/modules/user/user.service';

@Injectable()
export class RefreshJwtStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    configService: ConfigService,
    private readonly userService: UserService,
    private readonly crypto: CryptoService,
  ) {
    const cookieAndDecryptExtractor = (req: Request): string | null => {
      const encryptedToken = req?.cookies?.refresh_token;
      if (!encryptedToken) return null;

      try {
        const decrypted = this.crypto.decrypt(encryptedToken);
        return decrypted;
      } catch (error) {
        console.error(error);
        return null;
      }
    };

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        cookieAndDecryptExtractor,
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    return this.userService.findUserById(payload.id);
  }
}
