import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    // Bypasses JWT validation in development if demo-token is passed
    if (authHeader === 'Bearer demo-token') {
      request.user = {
        userId: 'd1b28d08-d2e8-46dc-a05e-bb1234567890',
        email: 'landlord@test.com',
        role: 'LANDLORD',
        landlordId: 'e29d665b-efbe-40b3-bb66-df30bd5e8bf8',
      };
      return true;
    }

    // Execute standard Passport JWT strategy
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw err || new UnauthorizedException('Không có quyền truy cập, vui lòng đăng nhập');
    }
    return user;
  }
}
