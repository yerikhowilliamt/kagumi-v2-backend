import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { JwtUtilService } from 'src/common/utils/jwt-util.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtUtilService: JwtUtilService) {}
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const token =
      request.cookies?.access_token ||
      request.headers?.authorization?.split(' ')[1];

    if (!token) throw new UnauthorizedException('No token provided');

    const decoded = this.jwtUtilService.decode(token);
    if (!decoded || !('id' in decoded)) {
      throw new UnauthorizedException('Invalid token');
    }

    request.user = decoded;
    return true;
  }
}
