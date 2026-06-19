import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../logger/logger.service';
import { NextFunction, Response } from 'express';
import { CustomRequest } from 'src/types/index.type';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(
    private jwtService: JwtService,
    private prismaService: PrismaService,
    private configService: ConfigService,
    private loggerService: LoggerService,
  ) {}

  async use(req: CustomRequest, res: Response, next: NextFunction) {
    const accessToken = req.cookies?.access_token;
    const refreshToken = req.cookies?.refresh_token;

    this.loggerService.info('AUTH', 'MIDDLEWARE', 'Middleware executed');

    if (!accessToken || !refreshToken) {
      this.loggerService.warn(
        'AUTH',
        'MIDDLEWARE',
        'Missing access or refresh token',
      );
      throw new UnauthorizedException('Missing access or refresh token');
    }

    try {
      const payload = this.jwtService.verify(accessToken, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      });

      const user = await this.prismaService.user.findUnique({
        where: { id: payload.userId },
      });

      if (!user) {
        this.loggerService.warn(
          'AUTH',
          'MIDDLEWARE',
          'User not found in database',
        );
        throw new UnauthorizedException('User not found');
      }

      req.user = user;
      return next();
    } catch (error) {
      const err = error as Error;
      this.loggerService.error('AUTH', 'MIDDLEWARE', 'Invalid access token', {
        error: err.message,
        stack: err.stack,
      });
      throw new UnauthorizedException('Invalid access token');
    }
  }
}
