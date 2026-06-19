import { Test, TestingModule } from '@nestjs/testing';
import { CookieService } from './cookie.service';
import { ConfigService } from '@nestjs/config';

describe('CookieService', () => {
  let service: CookieService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CookieService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('development'),
          },
        },
      ],
    }).compile();

    service = module.get<CookieService>(CookieService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
