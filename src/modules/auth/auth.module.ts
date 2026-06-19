import { Module, forwardRef } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt-access.strategy';
import { RefreshJwtStrategy } from './strategies/jwt-refresh.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { UserModule } from '../user/user.module';

@Module({
  imports: [forwardRef(() => UserModule)],
  providers: [
    {
      provide: 'AUTH_SERVICE',
      useClass: AuthService,
    },
    AuthService,
    LocalStrategy,
    JwtStrategy,
    RefreshJwtStrategy,
    GoogleStrategy,
  ],
  controllers: [AuthController],
  exports: [AuthService, 'AUTH_SERVICE'],
})
export class AuthModule {}
