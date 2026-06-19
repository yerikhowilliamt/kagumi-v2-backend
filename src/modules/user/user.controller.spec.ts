import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { LoggerService } from 'src/common/logger/logger.service';
import { ResponseService } from 'src/helpers/response/response.service';
import { CookieService } from 'src/helpers/cookie/cookie.service';
import { Roles } from 'src/generated/prisma/client';

describe('UserController', () => {
  let controller: UserController;
  let userService: UserService;
  let responseService: ResponseService;

  const mockUser = {
    id: 1,
    name: 'Admin',
    email: 'admin@mail.com',
    role: Roles.ADMIN,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUsersListResponse = {
    success: true,
    data: [
      {
        id: 1,
        name: 'Admin',
        email: 'admin@mail.com',
        role: 'ADMIN',
        createdAt: new Date().toString(),
        updatedAt: new Date().toString(),
        accounts: [],
        orders: [],
        payments: [],
      },
    ],
    status: 200,
    message: 'User fetched successfully',
    paging: {
      size: 10,
      totalData: 1,
      currentPage: 1,
      totalPage: 1,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: {
            list: jest.fn().mockResolvedValue(mockUsersListResponse),
          },
        },
        {
          provide: LoggerService,
          useValue: {
            info: jest.fn(),
            debug: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
          },
        },
        {
          provide: ResponseService,
          useValue: {
            success: jest.fn().mockImplementation((params) => ({
              success: true,
              data: params.data,
              status: params.status,
              message: params.message,
              paging: params.paging,
            })),
          },
        },
        {
          provide: CookieService,
          useValue: {
            clearCookies: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    userService = module.get<UserService>(UserService);
    responseService = module.get<ResponseService>(ResponseService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('list', () => {
    it('should return a list of users successfully', async () => {
      const page = 1;
      const limit = 10;

      const response = await controller.list(mockUser as any, page, limit);

      expect(userService.list).toHaveBeenCalledWith(limit, page);
      expect(responseService.success).toHaveBeenCalled();
      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockUsersListResponse.data);
    });
  });
});
