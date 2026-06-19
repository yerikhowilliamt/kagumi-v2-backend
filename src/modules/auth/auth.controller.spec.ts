import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoggerService } from 'src/common/logger/logger.service';
import { ResponseService } from 'src/helpers/response/response.service';
import { TokenService } from 'src/helpers/token/token.service';
import { CookieService } from 'src/helpers/cookie/cookie.service';

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn(),
            login: jest.fn(),
            validateGoogleAccount: jest.fn(),
          },
        },
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
          provide: ResponseService,
          useValue: {
            success: jest.fn(),
          },
        },
        {
          provide: TokenService,
          useValue: {
            generateNewAccessToken: jest.fn(),
          },
        },
        {
          provide: CookieService,
          useValue: {
            setAccessToken: jest.fn(),
            setRefreshToken: jest.fn(),
            clearCookies: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
