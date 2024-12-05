import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayloadDto } from '../../auth/dto/payload.dto';

@Injectable()
export class RefreshJwtStrategy extends PassportStrategy(Strategy, 'refresh-jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('token'),
      secretOrKey: process.env.JWT_REFRESH_SECRET, 
      ignoreExpiration: false,
    });
  }

  async validate(payload: any): Promise<JwtPayloadDto> {
    return { id: payload.id, role: payload.role, hosId: payload.hosId, wardId: payload.wardId };
  }
}