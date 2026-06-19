import { Test, TestingModule } from '@nestjs/testing';
import { LoggerService } from './logger.service';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';

describe('LoggerService', () => {
  let service: LoggerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoggerService,
        {
          provide: WINSTON_MODULE_PROVIDER,
          useValue: {
            log: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<LoggerService>(LoggerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
