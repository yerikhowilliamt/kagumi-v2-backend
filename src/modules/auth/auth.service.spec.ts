import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { LoggerService } from 'src/common/logger/logger.service';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { TokenService } from 'src/helpers/token/token.service';
import { ResponseService } from 'src/helpers/response/response.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: LoggerService,
          useValue: {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            debug: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            account: {
              upsert: jest.fn(),
              findFirst: jest.fn(),
            },
          },
        },
        {
          provide: TokenService,
          useValue: {
            issueTokens: jest.fn(),
          },
        },
        {
          provide: ResponseService,
          useValue: {
            toAuthResponse: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
