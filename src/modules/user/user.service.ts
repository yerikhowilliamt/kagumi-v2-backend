import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { LoggerService } from 'src/common/logger/logger.service';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { ResponseService } from 'src/helpers/response/response.service';
import { AuthService } from '../auth/auth.service';
import { CloudinaryService } from 'src/common/cloudinary/cloudinary.service';
import WebResponse, { Paging, response } from 'src/models/web.model';
import { UserResponse } from 'src/models/user.model';
import { UpdateProfileRequest } from './dto/update-profile.dto';
import {
  Account,
  Order,
  Payment,
  Prisma,
  User,
} from 'src/generated/prisma/client';
import { UpdatePasswordRequest } from './dto/update-password.dto';
import * as bcrypt from 'bcryptjs';
import { PaginationRequest } from 'src/models/pagination.model';

@Injectable()
export class UserService {
  constructor(
    private readonly loggerService: LoggerService,
    private readonly prismaService: PrismaService,
    private readonly responseService: ResponseService,
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  private userInclude = {
    accounts: true,
    orders: true,
    payments: true,
  };

  async getStats() {
    this.loggerService.info('USER', 'SERVICE', 'Fetching user stats initiated');

    const totalCustomers = await this.prismaService.user.count({
      where: { role: 'USER' },
    });

    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const newCustomersThisMonth = await this.prismaService.user.count({
      where: {
        role: 'USER',
        createdAt: { gte: oneMonthAgo },
      },
    });

    return {
      totalCustomers,
      newCustomersThisMonth,
    };
  }

  async list(request: PaginationRequest): Promise<WebResponse<UserResponse>> {
    this.loggerService.info('USER', 'SERVICE', 'Fetching users data initiated', { request });

    const skip = (request.page - 1) * request.size;

    const where: Prisma.UserWhereInput = {};
    if (request.search) {
      where.OR = [
        { name: { contains: request.search, mode: 'insensitive' } },
        { email: { contains: request.search, mode: 'insensitive' } }
      ];
    }

    const orderBy: Prisma.UserOrderByWithRelationInput = {};
    if (request.sortBy) {
      orderBy[request.sortBy] = request.sortOrder;
    } else {
      orderBy.id = 'desc';
    }

    const [users, totalData] = await Promise.all([
      this.prismaService.user.findMany({
        where,
        skip,
        take: request.size,
        orderBy,
        include: this.userInclude,
      }),
      this.prismaService.user.count({ where }),
    ]);

    const totalPage = Math.ceil(totalData / request.size);

    this.loggerService.info('USER', 'SERVICE', 'User fetched successfully', { count: users.length, totalData });

    return response<UserResponse>({
      success: true,
      pagination: true,
      data: users.map((user) => this.responseService.toAuthResponse(user as any)),
      paging: new Paging({
        size: request.size,
        totalData: totalData,
        currentPage: request.page,
        totalPage: totalPage,
      }),
      status: 200,
      message: 'User fetched successfully',
    });
  }

  async detail(id: number, email: string): Promise<UserResponse> {
    this.loggerService.info('USER', 'SERVICE', 'Fetching user data initiated');

    const currentUser = await this.authService.findUserByEmail(email);

    this.loggerService.info('USER', 'SERVICE', 'Fetching user data success', {
      user_id: currentUser.id,
    });

    return this.responseService.toAuthResponse(currentUser);
  }

  async updateProfile(
    userId: number,
    email: string,
    updateRequest: UpdateProfileRequest,
    image?: any,
  ): Promise<UserResponse> {
    this.loggerService.info(
      'USER',
      'SERVICE',
      'Updating user profile initiated',
      {
        user_id: userId,
      },
    );

    const user = await this.prismaService.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (updateRequest.phone) {
      const existingPhone = await this.prismaService.user.findUnique({
        where: {
          phone: updateRequest.phone,
        },
      });

      if (existingPhone && existingPhone.phone !== (user && user.phone))
        throw new BadRequestException('Phone number already registered');
    }

    if (updateRequest.email) {
      const isEmailExists = await this.prismaService.user.findUnique({
        where: {
          email: updateRequest.email,
        },
      });

      if (isEmailExists && isEmailExists.email !== (user && user.email))
        throw new BadRequestException('Email already registered.');
    }

    const existingUser = await this.checkExistingUser(email);
    const updatedUserData = this.updatedUserData(updateRequest);

    if (image) {
      // Jika pengguna sudah memiliki gambar profile (dari cloudinary), hapus terlebih dahulu
      if (existingUser.imageUrl) {
        try {
          const urlParts = existingUser.imageUrl.split('/');
          const filename = urlParts[urlParts.length - 1];
          const publicId = filename.split('.')[0];
          if (publicId && existingUser.imageUrl.includes('cloudinary')) {
            await this.cloudinaryService.destroyFile(publicId);
          }
        } catch (error) {
          this.loggerService.warn('USER', 'SERVICE', 'Failed to delete old image from Cloudinary', { error });
        }
      }
      const uploadResult = await this.cloudinaryService.uploadFile(image);
      updatedUserData.imageUrl = uploadResult.secure_url;
    }

    const updatedUser = await this.prismaService.user.update({
      where: { email: existingUser.email },
      data: updatedUserData,
      include: {
        accounts: true,
        orders: true,
        payments: true,
      },
    });

    this.loggerService.info(
      'USER',
      'SERVICE',
      'Updating user profile success',
      {
        id: existingUser.id,
        email: existingUser.email,
      },
    );

    return this.responseService.toAuthResponse(updatedUser);
  }

  async updatePassword(
    user: User,
    updateRequest: UpdatePasswordRequest,
  ): Promise<UserResponse> {
    this.loggerService.info('USER', 'SERVICE', 'Updating user data initiated', {
      user_id: user.id,
    });

    const existingUser = await this.checkExistingUser(user.email);
    const hashedPassword = await bcrypt.hash(updateRequest.password, 10);

    if (!existingUser.password && existingUser.accounts.length > 0) {
      const updatedUser = await this.prismaService.user.update({
        where: { email: existingUser.email },
        data: {
          password: hashedPassword,
        },
        include: this.userInclude,
      });

      this.loggerService.info(
        'USER',
        'SERVICE',
        'Password created for OAuth user',
        {
          id: updatedUser.id,
          email: updatedUser.email,
        },
      );

      return this.responseService.toAuthResponse(updatedUser);
    }

    const isPasswordValid = await bcrypt.compare(
      updateRequest.currentPassword,
      existingUser.password ?? '',
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password.');
    }

    const updatedUser = await this.prismaService.user.update({
      where: { email: existingUser.email },
      data: {
        password: hashedPassword,
      },
      include: this.userInclude,
    });

    this.loggerService.info(
      'USER',
      'SERVICE',
      'Updating user password success',
      {
        id: existingUser.id,
        email: existingUser.email,
      },
    );

    return this.responseService.toAuthResponse(updatedUser);
  }

  async logout(email: string): Promise<{ message: string; success: boolean }> {
    this.loggerService.info('USER', 'SERVICE', 'User logout initiated');
    await this.checkExistingUser(email);

    await this.prismaService.user.update({
      where: { email },
      data: { refreshToken: null },
    });

    this.loggerService.info('USER', 'SERVICE', 'Logged out success');

    return {
      message: 'Log out successful',
      success: true,
    };
  }

  async checkExistingUser(email: string): Promise<
    User & {
      accounts: Account[];
      orders: Order[];
      payments: Payment[];
    }
  > {
    this.loggerService.info(
      'USER',
      'SERVICE',
      'Checking user existence initiated',
      { email },
    );

    if (!email) {
      this.loggerService.warn(
        'USER',
        'SERVICE',
        'Checking for existing user failed - User email is required',
        {
          email,
        },
      );
      throw new BadRequestException('Please insert User email');
    }

    const user = await this.prismaService.user.findUnique({
      where: { email },
      include: this.userInclude,
    });

    if (!user) {
      this.loggerService.info(
        'USER',
        'SERVICE',
        'Checking for existing user failed - User not found',
        {
          email,
        },
      );

      throw new NotFoundException('User not found');
    }

    this.loggerService.info('USER', 'SERVICE', 'User existence verified', {
      id: user.id,
      email: user.email,
    });

    return user;
  }

  private updatedUserData(
    request: UpdateProfileRequest,
  ): Prisma.UserUpdateInput {
    const data: Prisma.UserUpdateInput = {};

    if (request.name !== undefined) {
      data.name = request.name;
    }
    if (request.email !== undefined) {
      data.email = request.email;
    }
    if (request.address !== undefined) {
      data.address = request.address;
    }
    if (request.phone !== undefined) {
      data.phone = request.phone;
    }
    if (request.image !== undefined) {
      data.imageUrl = request.image;
    }
    return data;
  }

  async findUserById(id: number): Promise<User> {
    const user = await this.prismaService.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}
