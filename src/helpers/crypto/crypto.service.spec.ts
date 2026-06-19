import { Test, TestingModule } from '@nestjs/testing';
import { CryptoService } from './crypto.service';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from 'src/common/logger/logger.service';

describe('CryptoService', () => {
  let service: CryptoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CryptoService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              if (key === 'CRYPTO_ALGORITHM') return 'aes-256-cbc';
              if (key === 'CRYPTO_SECRET_KEY')
                return '5d7b637c0e88656b347a2b86d1d1a466b251981a191a023a18af00ecb457f88e';
              return null;
            }),
          },
        },
        {
          provide: LoggerService,
          useValue: {
            warn: jest.fn(),
            info: jest.fn(),
            error: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CryptoService>(CryptoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
