import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { LoggerService } from 'src/common/logger/logger.service';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { ResponseService } from 'src/helpers/response/response.service';
import { TokenService } from 'src/helpers/token/token.service';
import { LogLevel } from 'src/types/index.type';
import { RegisterAuthRequest } from './dto/register.dto';
import * as bcrypt from 'bcryptjs';
import { UserResponse } from 'src/models/user.model';
import { LoginAuthRequest } from './dto/login.dto';
import { ValidateAuthRequest } from './dto/validate';
import { Account, Order, Payment, User } from 'src/generated/prisma/client';

@Injectable()
export class AuthService {
    constructor(
    private readonly loggerService: LoggerService,
    private readonly prismaService: PrismaService,
    private readonly token: TokenService,
    private readonly response: ResponseService,
  ) {}

  private userInclude = {
    accounts: true,
    orders: true,
    payments: true,
  };

  private log(level: LogLevel, message: string, meta?: Record<string, any>) {
    this.loggerService[level]('AUTH', 'SERVICE', message, meta);
  }

  async register(registerRequest: RegisterAuthRequest): Promise<UserResponse> {
    this.log('info', 'Create user initiated');

    await this.checkExistingUserEmail(registerRequest.email);
    await this.checkExistingUserPhone(registerRequest.phone);

    const hashedPassword = await bcrypt.hash(registerRequest.password, 10);

    const user = await this.prismaService.user.create({
      data: {
        name: registerRequest.name,
        email: registerRequest.email,
        password: hashedPassword,
        address: registerRequest.address,
        phone: registerRequest.phone,
      },
      include: this.userInclude,
    });

    this.log('info', 'Created user succcess', {
      id: user.id,
      name: user.email,
    });

    return this.response.toAuthResponse(user);
  }

    async login(loginRequest: LoginAuthRequest): Promise<
    UserResponse & {
      accessToken: string;
      refreshToken: string;
    }
  > {
    this.log('info', 'User login attempt', {
      email: loginRequest.email,
    });

    const user = await this.prismaService.user.findUnique({
      where: { email: loginRequest.email },
      include: this.userInclude,
    });

    if (!user) {
      this.log('warn', 'User not found', { email: loginRequest.email });
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (user.password !== null) {
      const isPasswordValid = await bcrypt.compare(
        loginRequest.password,
        user.password,
      );

      if (!isPasswordValid) {
        this.log('warn', 'Invalid password', { email: loginRequest.email });
        throw new UnauthorizedException('Invalid email or password.');
      }
    }

    const tokens = await this.token.issueTokens(user);

    this.log('info', 'User logged in success', { user_id: user.id });

    return {
      ...this.response.toAuthResponse(user),
      ...tokens,
    };
  }

  async validateUser(email: string, password: string) {
    const user = await this.prismaService.user.findUnique({
      where: { email },
      include: this.userInclude,
    });

    if (!user) {
      this.log('warn', 'User not found', { email });
      throw new UnauthorizedException('Invalid email or password.');
    }

    const isMatch = await bcrypt.compare(password, user.password!);
    if (!isMatch) return null;

    // Hilangkan password sebelum return
    const { password: _, ...result } = user;
    return result;
  }

  async validateGoogleAccount(validatedRequest: ValidateAuthRequest): Promise<
    UserResponse & {
      accessToken: string;
    }
  > {
    const account = await this.upsertAccount(validatedRequest);
    const tokens = await this.token.issueTokens(account.user);

    return {
      ...this.response.toAuthResponse(account.user),
      ...tokens,
      emailVerified: !!account.user.emailVerified,
    };
  }

  private async checkExistingUserEmail(email: string): Promise<void> {
    this.log('info', 'Checking existing user email initiated', { email });

    const user = await this.prismaService.user.findUnique({
      where: { email },
    });

    if (user) {
      this.log('warn', 'Email already registered');
      throw new BadRequestException('This email is already registered.');
    }
  }

  async checkExistingUserPhone(phone: string): Promise<void> {
    const user = await this.prismaService.user.findUnique({
      where: { phone },
    });

    if (user) {
      this.log('warn', 'Phone number already registered');
      throw new BadRequestException('This phone number is already registered.');
    }
  }

  async findUserByEmail(email: string): Promise<
    User & {
      accounts: Account[];
      orders: Order[];
      payments: Payment[];
    }
  > {
    this.log('info', 'Finding user by email initiated', { email });

    if (!email) {
      this.log('warn', 'Finding an user failed - Email is required', { email });
      throw new BadRequestException('Email is required');
    }

    const user = await this.prismaService.user.findUnique({
      where: { email },
      include: this.userInclude,
    });

    if (!user) {
      this.log('warn', 'User not found', { email });
      throw new UnauthorizedException('User not found.');
    }

    this.log('info', 'Finding user by email success', { email });
    return user;
  }

  private async upsertAccount(request: ValidateAuthRequest) {
    const {
      refreshToken,
      accessToken,
      providerAccountId,
      emailVerified,
      ...reqLog
    } = request;
    this.log('info', 'Upserting account initiated', { reqLog });

    return this.prismaService.account.upsert({
      where: {
        provider_providerAccountId: {
          provider: request.provider,
          providerAccountId: request.providerAccountId,
        },
      },
      update: {
        ...(request.refreshToken ? { refreshToken: request.refreshToken } : {}),
      },
      create: {
        user: {
          connectOrCreate: {
            where: { email: request.email },
            create: {
              email: request.email,
              name: request.name,
              imageUrl: request.image,
              emailVerified: new Date(),
            },
          },
        },
        refreshToken: request.refreshToken,
        provider: request.provider,
        providerAccountId: request.providerAccountId,
      },
      include: {
        user: {
          include: this.userInclude,
        },
      },
    });
  }

  async findAccount(userId: number): Promise<
    UserResponse & {
      accessToken: string;
      refreshToken: string;
    }
  > {
    this.log('info', 'Finding existing account initiated', { user_id: userId });

    if (!userId) {
      this.log(
        'warn',
        'Finding an account failed - Account provider or provider account ID is required',
      );
      throw new BadRequestException('User ID is required');
    }

    const account = await this.prismaService.account.findFirst({
      where: { userId },
      include: {
        user: {
          include: this.userInclude,
        },
      },
    });

    if (!account) {
      this.log('warn', 'Account not found', {
        user_id: userId,
      });
      throw new NotFoundException('Account not found');
    }

    const tokens = await this.token.issueTokens(account.user);

    this.log('info', 'Account found', {
      providerAccountId: account.providerAccountId || null,
      provider: account.provider || null,
    });

    return {
      ...this.response.toAuthResponse(account.user),
      ...tokens,
    };
  }

  async findUserById(id: number): Promise<
    UserResponse & {
      accessToken: string;
      refreshToken: string;
    }
  > {
    this.log('info', 'Finding user by ID initiated', {
      id,
    });

    if (!id) {
      this.log('warn', 'Finding an account failed - User ID is required', {
        id,
      });
      throw new BadRequestException('User ID is required');
    }

    const user = await this.prismaService.user.findUnique({
      where: { id },
      include: this.userInclude,
    });

    if (!user) {
      this.log('warn', 'User not found', { id });
      throw new NotFoundException('User not found.');
    }

    const tokens = await this.token.issueTokens(user);

    this.log('info', 'User found', {
      id: user.id,
      email: user.email,
    });

    return {
      ...this.response.toAuthResponse(user),
      ...tokens,
    };
  }
}
