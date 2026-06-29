import {
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  Patch,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { LoggerService } from 'src/common/logger/logger.service';
import { UserService } from './user.service';
import { ResponseService } from 'src/helpers/response/response.service';
import { CookieService } from 'src/helpers/cookie/cookie.service';
import { JwtAccessAuthGuard } from '../auth/guards/jwt-access.guard';
import { RoleGuard } from '../auth/guards/role.guard';
import { Roles } from '../auth/decorators/role.decorator';
import { Auth } from '../auth/decorators/auth.decorator';
import { User } from 'src/generated/prisma/client';
import WebResponse from 'src/models/web.model';
import { UserResponse } from 'src/models/user.model';
import { generateMessage } from 'src/common/utils/message.util';
import { FileInterceptor } from '@nestjs/platform-express';
import { ZodBody, ZodQuery } from 'src/common/validation/validation.decorator';
import { UserValidation } from './user.validation';
import { UpdateProfileRequest } from './dto/update-profile.dto';
import { UpdatePasswordRequest } from './dto/update-password.dto';
import { Response } from 'express';
import { PaginationRequest } from 'src/models/pagination.model';
import { PaginationValidation } from 'src/common/validation/pagination.validation';

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(
    private readonly loggerService: LoggerService,
    private readonly userService: UserService,
    private readonly responseService: ResponseService,
    private readonly cookies: CookieService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAccessAuthGuard, RoleGuard)
  @Roles('ADMIN')
  async list(
    @Auth() user: User,
    @ZodQuery(PaginationValidation.QUERY) request: PaginationRequest,
  ): Promise<WebResponse<UserResponse[]>> {
    this.loggerService.info('USER', 'CONTROLLER', 'Fetching users initiated', {
      performed_by: user.email,
      request,
    });

    const result = await this.userService.list(request);
    const message = generateMessage({ action: 'fetch', subject: 'user' });

    this.loggerService.info(
      'USER',
      'CONTROLLER',
      'Users fetched successfully',
      {
        performed_by: user.email,
        total_data: result.paging?.totalData,
        response_status: 200,
      },
    );

    return this.responseService.success({
      data: result.data as UserResponse[],
      status: result.status,
      message,
      paging: result.paging,
    });
  }

  @Get('stats')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAccessAuthGuard, RoleGuard)
  @Roles('ADMIN')
  async getStats(): Promise<WebResponse<any>> {
    this.loggerService.info('USER', 'CONTROLLER', 'Fetch user stats request received');
    const result = await this.userService.getStats();

    this.loggerService.info('USER', 'CONTROLLER', 'User stats fetched successfully');
    return this.responseService.success({
      data: result,
      status: HttpStatus.OK,
      message: 'User stats fetched successfully',
    });
  }

  @Get('current')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAccessAuthGuard)
  async get(@Auth() user: User): Promise<WebResponse<UserResponse>> {
    this.loggerService.info('USER', 'CONTROLLER', 'Fetching user initiated', {
      user_id: user.id,
    });
    const result = await this.userService.detail(user.id, user.email);
    const message = generateMessage({
      action: 'fetch',
      subject: 'user',
    });

    this.loggerService.info('USER', 'CONTROLLER', 'User fetched successfully', {
      user_id: result.id,
    });
    return this.responseService.success({
      data: result,
      status: 200,
      message,
    });
  }

  @Patch('current/profile')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAccessAuthGuard)
  @UseInterceptors(FileInterceptor('image'))
  async profile(
    @Auth() user: User,
    @ZodBody(UserValidation.PROFILE) request: UpdateProfileRequest,
    @UploadedFile() image?: any,
  ): Promise<WebResponse<UserResponse>> {
    this.loggerService.debug('USER', 'CONTROLLER', 'Updating user initiated', {
      user_id: user.id,
      request,
    });
    this.loggerService.info('USER', 'CONTROLLER', 'Updating user initiated', {
      user_id: user.id,
    });
    const result = await this.userService.updateProfile(
      user.id,
      user.email,
      request,
      image,
    );
    const message = generateMessage({
      action: 'update',
      subject: 'User profile',
    });

    this.loggerService.info('USER', 'CONTROLLER', 'User updated successfully', {
      user_id: result.id,
    });
    return this.responseService.success({
      data: result,
      status: 200,
      message,
    });
  }

  @Patch('current/password')
  @UseGuards(JwtAccessAuthGuard)
  @HttpCode(HttpStatus.OK)
  async password(
    @Auth() user: User,
    @ZodBody(UserValidation.PASSWORD) request: UpdatePasswordRequest,
  ): Promise<WebResponse<UserResponse>> {
    this.loggerService.debug('USER', 'CONTROLLER', 'Updating user initiated', {
      user_id: user.id,
      request,
    });
    this.loggerService.info('USER', 'CONTROLLER', 'Updating user initiated', {
      user_id: user.id,
    });
    const result = await this.userService.updatePassword(user, request);
    const message = generateMessage({
      action: 'update',
      subject: 'Password',
    });

    this.loggerService.info('USER', 'CONTROLLER', 'User updated successfully', {
      user_id: result.id,
    });
    return this.responseService.success({
      data: result,
      status: 200,
      message,
    });
  }

  @Delete('logout')
  @UseGuards(JwtAccessAuthGuard)
  async logout(
    @Auth() user: User,
    @Res({ passthrough: true }) res: Response,
  ): Promise<WebResponse<null>> {
    this.loggerService.info('USER', 'CONTROLLER', 'Logout user intiated', {
      user_id: user.id,
    });
    const result = await this.userService.logout(user.email);

    this.cookies.clearCookies(res);

    this.loggerService.info('USER', 'CONTROLLER', 'User logout successfully', {
      user_id: user.id,
    });

    return this.responseService.success({
      data: null,
      status: 200,
      message: result.message,
    });
  }
}
