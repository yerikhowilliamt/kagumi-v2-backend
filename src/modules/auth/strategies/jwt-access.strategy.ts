import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { User } from 'src/generated/prisma/client';
import { JwtPayload } from 'src/models/web.model';
import { UserService } from 'src/modules/user/user.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt-access') {
  constructor(
    configService: ConfigService,
    private readonly userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        // 1️⃣ Ambil token dari cookie lebih dulu
        (req: Request) => {
          const token = req?.cookies?.access_token;
          if (token) {
            // Debug log
            // console.log(
            //   '[JwtStrategy] Found token in cookie:',
            //   token.slice(0, 20) + '...',
            // );
            return token;
          }
          // 2️⃣ Kalau gak ada, fallback ke Authorization header
          const authHeader = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
          if (authHeader) {
            console.log('[JwtStrategy] Found token in header');
          }
          return authHeader;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    return this.userService.findUserById(payload.id);
  }
}
