import { Global, Module } from '@nestjs/common';
import { ResponseService } from './response/response.service';
import { TokenService } from './token/token.service';
import { CryptoService } from './crypto/crypto.service';
import { CookieService } from './cookie/cookie.service';

@Global()
@Module({
  providers: [ResponseService, TokenService, CryptoService, CookieService],
  exports: [ResponseService, TokenService, CryptoService, CookieService],
})
export class HelpersModule {}
