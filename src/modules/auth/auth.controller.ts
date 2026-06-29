import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoggerService } from 'src/common/logger/logger.service';
import { ResponseService } from 'src/helpers/response/response.service';
import { TokenService } from 'src/helpers/token/token.service';
import { CookieService } from 'src/helpers/cookie/cookie.service';
import { ZodBody } from 'src/common/validation/validation.decorator';
import { AuthValidation } from './auth.validation';
import { RegisterAuthRequest } from './dto/register.dto';
import WebResponse from 'src/models/web.model';
import { UserResponse } from 'src/models/user.model';
import { generateMessage } from 'src/common/utils/message.util';
import { LocalAuthGuard } from './guards/local.guard';
import { LoginAuthRequest } from './dto/login.dto';
import { Request, Response } from 'express';
import { GoogleAuthGuard } from './guards/google.guard';
import { JwtRefreshAuthGuard } from './guards/jwt-refresh.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly loggerService: LoggerService,
    private readonly responseService: ResponseService,
    private readonly token: TokenService,
    private readonly cookie: CookieService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @ZodBody(AuthValidation.REGISTER) request: RegisterAuthRequest,
  ): Promise<WebResponse<UserResponse>> {
    const result = await this.authService.register(request);
    const message = generateMessage({ action: 'Registration' });

    this.loggerService.info(
      'AUTH',
      'CONTROLLER',
      'Registration new user success',
      {
        user_id: result.id,
      },
    );

    return this.responseService.success({
      data: result,
      status: HttpStatus.CREATED,
      message,
    });
  }

  @Post('login')
  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  async login(
    @ZodBody(AuthValidation.LOGIN) request: LoginAuthRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<WebResponse<UserResponse>> {
    this.loggerService.info('AUTH', 'CONTROLLER', 'Login initiated', {
      email: request.email,
    });

    const result = await this.authService.login(request);
    const { accessToken, refreshToken, ...data } = result;
    const message = generateMessage({ action: 'Login' });

    this.cookie.setAccessToken(res, accessToken);
    this.cookie.setRefreshToken(res, refreshToken);

    this.loggerService.info('AUTH', 'GUARD', message, {
      user_id: result.id,
      response_status: 201,
    });

    return this.responseService.success({
      data,
      status: HttpStatus.OK,
      message,
    });
  }

  @Get('google/login')
  @HttpCode(HttpStatus.FOUND)
  googleLogin(
    @Res() res: Response,
    @Req() req?: Request,
    @Query('redirectUrl') redirectUrl?: string,
  ) {
    // ✅ Set cookie SEBELUM redirect ke Google
    if (redirectUrl && res) {
      this.loggerService.info('AUTH', 'CONTROLLER', 'Setting redirect cookie', {
        redirectUrl,
      });

      this.cookie.setOauthRedirect(res, redirectUrl);
    }

    // ✅ Manual redirect ke Google OAuth (tanpa Passport guard)
    const googleAuthUrl =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${process.env.GOOGLE_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(process.env.GOOGLE_CALLBACK_URL || 'http://localhost:4003/api/auth/google/redirect')}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent('email profile openid')}&` +
      `access_type=offline&` +
      `prompt=consent`;

    this.loggerService.info('AUTH', 'CONTROLLER', 'Redirecting to Google', {
      url: googleAuthUrl,
    });

    res.redirect(googleAuthUrl);
  }

  @Get('google/redirect')
  @UseGuards(GoogleAuthGuard)
  @HttpCode(HttpStatus.OK)
  async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    this.loggerService.info('AUTH', 'CONTROLLER', 'Google login initiated', {
      user: req.user,
      cookies: req.cookies,
    });

    if (!req.user) {
      throw new UnauthorizedException('Google authentication failed');
    }

    const user = req.user as UserResponse & {
      accessToken: string;
      refreshToken: string;
    };

    if (!user.id) {
      throw new UnauthorizedException(
        'Google authentication failed: Missing user ID',
      );
    }

    this.loggerService.info('AUTH', 'CONTROLLER', 'Google login Success', {
      user_id: user.id,
      account: user,
      response_status: HttpStatus.OK,
    });

    this.cookie.setAccessToken(res, user.accessToken);
    this.cookie.setRefreshToken(res, user.refreshToken);

    const savedRedirectUrl = req.cookies?.oauth_redirect_url;

    this.loggerService.info('AUTH', 'CONTROLLER', 'Checking redirect url', {
      id: user.id,
      redirect_url: savedRedirectUrl || 'not found',
      all_cookies: Object.keys(req.cookies || {}),
    });

    const finalUrl = this.validateAndGetRedirectUrl(savedRedirectUrl);

    this.loggerService.info('AUTH', 'CONTROLLER', 'Google login success', {
      id: user.id,
      final_url: finalUrl,
    });

    // ✅ Hapus cookie oauth_redirect_url setelah dipakai
    if (savedRedirectUrl) {
      this.cookie.clearOauthRedirect(res);
    }

    res.redirect(HttpStatus.TEMPORARY_REDIRECT, finalUrl);
  }

  @Post('new-token')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtRefreshAuthGuard)
  async newToken(@Req() req: Request, @Res() res: Response): Promise<void> {
    const refreshToken = (req.cookies.refresh_token as string) ?? '';

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    const result = await this.token.generateNewAccessToken(refreshToken);

    this.cookie.setAccessToken(res, result.accessToken);

    this.loggerService.info(
      'AUTH',
      'CONTROLLER',
      'Created new access token successfully!',
      {
        response_status: HttpStatus.OK,
        new_token: result.accessToken,
      },
    );

    res.status(HttpStatus.OK).json(
      this.responseService.success({
        data: [],
        status: HttpStatus.OK,
        message: 'Created new token successfully!',
      }),
    );
  }

  private validateAndGetRedirectUrl(url?: string): string {
    const defaultFrontendUrl =
      process.env.FRONTEND_URL || 'http://localhost:3000';
    const defaultCallbackUrl = `${defaultFrontendUrl}/auth/callback`;

    if (!url || url === '' || url === 'undefined') {
      this.loggerService.warn(
        'AUTH',
        'CONTROLLER',
        'No redirectUrl provided, using default',
      );
      return defaultCallbackUrl;
    }

    try {
      const decodedUrl = decodeURIComponent(url);
      const parsedUrl = new URL(decodedUrl);
      const allowedOrigin = new URL(defaultFrontendUrl);

      // Validasi hostname
      if (parsedUrl.hostname !== allowedOrigin.hostname) {
        this.loggerService.warn(
          'AUTH',
          'CONTROLLER',
          'Redirect URL hostname mismatch',
          {
            provided: parsedUrl.hostname,
            allowed: allowedOrigin.hostname,
          },
        );
        return defaultCallbackUrl;
      }

      // Validasi path
      if (!parsedUrl.pathname.startsWith('/auth/callback')) {
        this.loggerService.warn(
          'AUTH',
          'CONTROLLER',
          'Redirect URL path not allowed',
          {
            provided: parsedUrl.pathname,
            allowed: '/auth/callback',
          },
        );
        return defaultCallbackUrl;
      }

      this.loggerService.info(
        'AUTH',
        'CONTROLLER',
        'Valid redirect URL with query params',
        {
          url: parsedUrl.toString(),
        },
      );

      return parsedUrl.toString();
    } catch (error) {
      this.loggerService.warn('AUTH', 'CONTROLLER', 'Invalid redirect URL', {
        url,
        error: (error as Error).message,
      });
      return defaultCallbackUrl;
    }
  }
}
