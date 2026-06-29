import {
  Global,
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { LoggerService } from './logger/logger.service';
import { ErrorService } from './error/error.service';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from './prisma/prisma.service';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ErrorFilter } from './error/error.filter';
import { LoggerInterceptor } from './logger/logger.interceptor';
import { JwtUtilService } from './utils/jwt-util.service';
import { ParseOptionalIntPipe } from './pipe/parse-optional-int.pipe';
import { AuthMiddleware } from './middleware/auth.middleware';

@Global()
@Module({
  imports: [
    WinstonModule.forRoot({
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.json(),
      ),
      transports: [
        new winston.transports.Console({
          // level: 'debug',
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(({ level, message, timestamp, ...meta }) => {
              const colors = {
                red: (t: string) => `\x1b[31m${t}\x1b[0m`,
                green: (t: string) => `\x1b[32m${t}\x1b[0m`,
                yellow: (t: string) => `\x1b[33m${t}\x1b[0m`,
                blue: (t: string) => `\x1b[36m${t}\x1b[0m`,
                magenta: (t: string) => `\x1b[35m${t}\x1b[0m`,
                gray: (t: string) => `\x1b[90m${t}\x1b[0m`,
              };

              const timestampStr = String(timestamp);
              const ts = colors.blue(timestampStr);

              let msgColor = colors.gray;
              if (level.includes('info')) msgColor = colors.green;
              else if (level.includes('warn')) msgColor = colors.yellow;
              else if (level.includes('error')) msgColor = colors.red;
              else if (level.includes('debug')) msgColor = colors.magenta;

              const messageStr = String(message);
              const msg = msgColor(messageStr);

              // Pretty print meta (rapi + indent)
              const metaFormatted =
                Object.keys(meta).length > 0
                  ? '\n' + JSON.stringify(meta, null, 2)
                  : '';

              return `[${ts}] [${level}] ${msg}${metaFormatted}\n`;
            }),
          ),
        }),
      ],
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: '15m',
        },
      }),
    }),
  ],
  providers: [
    PrismaService,
    LoggerService,
    {
      provide: APP_FILTER,
      useClass: ErrorFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggerInterceptor,
    },
    ErrorService,
    JwtUtilService,
    ParseOptionalIntPipe,
  ],
  exports: [
    PrismaService,
    LoggerService,
    ErrorService,
    JwtUtilService,
    JwtModule,
    ParseOptionalIntPipe,
  ],
})
export class CommonModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .exclude(
        { path: '/api/auth/login', method: RequestMethod.POST },
        { path: '/api/auth/register', method: RequestMethod.POST },
        { path: '/api/*patch', method: RequestMethod.GET }
      )
      .forRoutes({ path: '/api/*path', method: RequestMethod.ALL });
  }
}
