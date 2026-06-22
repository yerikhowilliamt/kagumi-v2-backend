import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { LoggerService } from 'src/common/logger/logger.service';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CryptoService } from '../crypto/crypto.service';
import { JwtPayload } from 'src/models/web.model';
import { User } from 'src/generated/prisma/client';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class TokenService {
  constructor(
    private readonly loggerService: LoggerService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
    private readonly cryptoService: CryptoService,
  ) {}

  public async generateAccessToken(
    userId: number,
    email: string,
    role: string,
  ): Promise<string> {
    this.loggerService.info('AUTH', 'SERVICE', 'Created access token', {
      user_id: userId,
    });

    if (!userId || !email || !role) {
      this.loggerService.warn(
        'AUTH',
        'SERVICE',
        'Generate access token failed - User ID or email or role is required',
        {
          userId,
          email,
          role,
        },
      );
      throw new BadRequestException('User ID or email or role is required');
    }

    return this.jwtService.signAsync(
      { id: userId, email, role },
      {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: '1h',
      },
    );
  }

  public async generateRefreshToken(
    userId: number,
    email: string,
    role: string,
  ): Promise<string> {
    this.loggerService.info('AUTH', 'SERVICE', 'Created refresh token', {
      user_id: userId,
    });

    if (!userId || !email || !role) {
      this.loggerService.warn(
        'AUTH',
        'SERVICE',
        'Generate refresh token failed - User ID or email or role is required',
        {
          userId,
          email,
          role,
        },
      );
      throw new BadRequestException('User ID or email or role is required');
    }

    return this.jwtService.signAsync(
      { id: userId, email, role },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: '30d',
      },
    );
  }

  public async generateNewAccessToken(refreshToken: string) {
    this.loggerService.info(
      'AUTH',
      'SERVICE',
      'Generate new access token initiated',
      {
        refresh_token: refreshToken,
      },
    );

    if (!refreshToken) {
      this.loggerService.warn(
        'AUTH',
        'SERVICE',
        'Generate new access token failed - Refresh token is required',
        {
          refresh_token: refreshToken,
        },
      );
      throw new BadRequestException('Refresh token is required');
    }

    const decryptToken = this.cryptoService.decrypt(refreshToken);

    const payload = this.jwtService.verify<JwtPayload>(decryptToken, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
    });

    this.loggerService.warn('AUTH', 'SERVICE', 'Payload ID', {
      id: payload.id,
    });

    const user = await this.prismaService.user.findUnique({
      where: {
        id: payload.id,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    const refreshTokenDB = user.refreshToken;

    const isRefreshTokenMatched = await bcrypt.compare(
      decryptToken,
      refreshTokenDB,
    );

    if (!isRefreshTokenMatched) {
      this.loggerService.error('AUTH', 'SERVICE', 'Refresh token not match');
      throw new UnauthorizedException('Invalid refresh token');
    }

    const newAccessToken = await this.generateAccessToken(
      user.id,
      user.email,
      user.role,
    );

    this.loggerService.debug(
      'AUTH',
      'SERVICE',
      'Generated new access token success',
      {
        access_token: newAccessToken,
      },
    );
    this.loggerService.info(
      'AUTH',
      'SERVICE',
      'Generated new access token success',
    );
    return {
      accessToken: newAccessToken,
    };
  }

  public async issueTokens(user: User) {
    const accessToken = await this.generateAccessToken(
      user.id,
      user.email,
      user.role,
    );

    const refreshToken = await this.generateRefreshToken(
      user.id,
      user.email,
      user.role,
    );

    const encryptedToken = this.cryptoService.encrypt(refreshToken);
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

    await this.prismaService.user.update({
      where: { id: user.id },
      data: { refreshToken: hashedRefreshToken },
    });

    return {
      accessToken,
      refreshToken: encryptedToken,
    };
  }
}
