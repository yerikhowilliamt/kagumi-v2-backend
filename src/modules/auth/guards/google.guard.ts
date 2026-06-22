import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LoggerService } from 'src/common/logger/logger.service';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  constructor(private readonly loggerService: LoggerService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const activate = (await super.canActivate(context)) as boolean;

      this.loggerService.info(
        'GOOGLE GUARD',
        'GUARD',
        'GoogleAuthGuard activated successfully',
      );

      return activate;
    } catch (error) {
      const err = error as Error;
      this.loggerService.error(
        'GOOGLE GUARD',
        'GUARD',
        `canActivate failed: ${err.message}`,
      );
      throw error;
    }
  }

  // handleRequest(err: any, user: any, info: any): any {
  //   this.loggerService.info('GOOGLE GUARD', 'GUARD', 'handleRequest triggered:', {
  //     err,
  //     user,
  //     info,
  //   });

  //   if (err || !user) {
  //     const errorMessage =
  //       err?.message || info?.message || 'No user found or authentication failed';

  //     this.loggerService.error('GOOGLE GUARD', 'GUARD', `Authentication failed: ${errorMessage}`, {
  //       error: err,
  //       userData: user,
  //       infoDetails: info,
  //     });

  //     throw new UnauthorizedException(errorMessage);
  //   }

  //   this.loggerService.info(
  //     'GOOGLE GUARD',
  //     'GUARD',
  //     `Authenticated user successfully: ${user?.email || 'Unknown User'}`,
  //   );

  //   return user;
  // }

  handleRequest<TUser = any>(
    err: any,
    user: any,
    info: any,
    context: ExecutionContext,
  ): TUser {
    const request = context.switchToHttp().getRequest();

    this.loggerService.info(
      'GOOGLE GUARD',
      'GUARD',
      'handleRequest triggered',
      {
        hasError: !!err,
        hasUser: !!user,
        hasExistingUser: !!request.user,
        info,
      },
    );

    // ✅ PENTING: Jika user sudah ada di request (dari first call),
    // langsung return tanpa throw error
    if (!user && request.user) {
      this.loggerService.info(
        'GOOGLE GUARD',
        'GUARD',
        'User already authenticated in previous call, reusing',
        { userId: request.user.id },
      );
      return request.user;
    }

    // Handle error dari strategy
    if (err) {
      this.loggerService.error(
        'GOOGLE GUARD',
        'GUARD',
        `Authentication error: ${err.message}`,
      );
      throw err instanceof UnauthorizedException
        ? err
        : new UnauthorizedException(err.message);
    }

    // Jika tidak ada user sama sekali
    if (!user) {
      this.loggerService.error(
        'GOOGLE GUARD',
        'GUARD',
        'Authentication failed: No user found',
      );
      throw new UnauthorizedException('Authentication failed');
    }

    this.loggerService.info(
      'GOOGLE GUARD',
      'GUARD',
      `Authenticated user: ${user.email}`,
      { userId: user.id },
    );

    return user;
  }
}
