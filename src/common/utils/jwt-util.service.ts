import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtUtilService {
  constructor(private readonly jwtService: JwtService) {}

  decode<T = any>(token: string): T | null {
    const decoded = this.jwtService.decode(token);
    return decoded ? (decoded as T) : null;
  }
}
