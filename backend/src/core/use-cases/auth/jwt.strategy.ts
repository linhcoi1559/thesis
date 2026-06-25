import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Role } from '@prisma/client';

export interface JwtPayload {
  sub: string;         // userId
  email: string;
  role: Role;
  landlordId?: string; // Multi-tenancy tenant context
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'rental_saas_jwt_secret_key_change_me_in_prod',
    });
  }

  async validate(payload: JwtPayload) {
    // The object returned here is automatically attached to the Request as req.user
    return {
      userId: payload.sub,
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
      landlordId: payload.landlordId, // Injected for multi-tenancy filters
    };
  }
}
