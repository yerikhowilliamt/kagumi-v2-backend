import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { LoggerService } from 'src/common/logger/logger.service';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { ResponseService } from 'src/helpers/response/response.service';
import { AuthService } from '../auth/auth.service';

describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
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
              findMany: jest.fn(),
              count: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
            },
          },
        },
        {
          provide: ResponseService,
          useValue: {
            toAuthResponse: jest.fn(),
          },
        },
        {
          provide: AuthService,
          useValue: {
            findUserByEmail: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
