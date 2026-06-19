import { Test, TestingModule } from '@nestjs/testing';
import { TokenService } from './token.service';
import { LoggerService } from 'src/common/logger/logger.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CryptoService } from '../crypto/crypto.service';

describe('TokenService', () => {
  let service: TokenService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenService,
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
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
            verify: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
          },
        },
        {
          provide: CryptoService,
          useValue: {
            encrypt: jest.fn(),
            decrypt: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TokenService>(TokenService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
