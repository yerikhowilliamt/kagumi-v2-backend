import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';
import { LoggerService } from 'src/common/logger/logger.service';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    @Inject('AUTH_SERVICE') private readonly authService: AuthService,
    configService: ConfigService,
    private loggerService: LoggerService,
  ) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID') ?? '',
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET') ?? '',
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL') ?? '',
      scope: ['openid', 'email', 'profile'],
      passReqToCallback: true,
    });
  }

  authorizationParams(): Record<string, string> {
    return {
      access_type: 'offline',
      prompt: 'consent',
    };
  }

  async validate(
    req: Request,
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<any> {
    this.loggerService.info(
      'GOOGLE STRATEGY',
      'STRATEGY',
      `Account Profile: {name: ${profile.displayName}, email: ${profile.emails?.[0]?.value}}`,
    );

    try {
      const { displayName, emails, photos, provider, id } = profile;

      if (!emails || emails.length === 0) {
        this.loggerService.error(
          'GOOGLE STRATEGY',
          'STRATEGY',
          'No email found in Google profile',
        );
        return done(new Error('Email not provided by Google'), false);
      }

      const email = emails[0].value;
      const emailVerified = emails[0].verified ?? false;
      const image = photos?.[0]?.value ?? '';

      this.loggerService.info(
        'GOOGLE STRATEGY',
        'STRATEGY',
        `VALIDATE | email: ${email}, accessToken length: ${accessToken?.length || 0}`,
      );

      const user = await this.authService.validateGoogleAccount({
        name: displayName,
        email,
        emailVerified,
        image,
        provider,
        providerAccountId: id,
        accessToken,
        refreshToken: refreshToken || undefined,
      });

      if (!user) {
        this.loggerService.error(
          'GOOGLE STRATEGY',
          'STRATEGY',
          'Validation failed. No user returned',
        );
        return done(new Error('User validation failed'), false);
      }

      this.loggerService.info(
        'GOOGLE STRATEGY',
        'STRATEGY',
        `VALIDATE SUCCESS | id: ${user.id}, email: ${user.email}`,
      );

      // ✅ PENTING: Return value via done callback
      return done(null, user);
    } catch (error) {
      const err = error as Error;
      this.loggerService.error(
        'GOOGLE STRATEGY',
        'STRATEGY',
        `Error in Google OAuth validation: ${err.message}`,
        {
          errorName: err.name,
          // Jangan log error object langsung (circular reference)
        },
      );
      return done(error, false);
    }
  }
}
