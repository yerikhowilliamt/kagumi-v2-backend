import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';

@Injectable()
export class CookieService {
  private isProd: boolean;

  constructor(private readonly config: ConfigService) {
    this.isProd = this.config.get('NODE_ENV') === 'production';
  }

  private get baseOptions() {
    return {
      httpOnly: true,
      secure: this.isProd,
      sameSite: this.isProd ? 'none' : 'lax',
      path: '/',
    } as const;
  }

  public setAccessToken(res: Response, token: string) {
    res.cookie('access_token', token, {
      ...this.baseOptions,
      maxAge: 60 * 60 * 1000,
    });
  }

  public setRefreshToken(res: Response, token: string) {
    res.cookie('refresh_token', token, {
      ...this.baseOptions,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
  }

  public setOauthRedirect(res: Response, url: string) {
    res.cookie('oauth_redirect_url', url, {
      ...this.baseOptions,
      maxAge: 10 * 60 * 1000,
    });
  }

  clearOauthRedirect(res: Response) {
    res.clearCookie('oauth_redirect_url', this.baseOptions);
  }

  clearCookies(res: Response) {
    res.clearCookie('access_token', this.baseOptions);
    res.clearCookie('refresh_token', this.baseOptions);
  }
}
