import { Injectable, ConflictException, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';
import { RegisterDto } from '../../../presentation/dtos/auth/register.dto';
import { LoginDto } from '../../../presentation/dtos/auth/login.dto';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Registers a new Tenant account
   */
  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('Email đã được đăng ký trong hệ thống');
    }

    try {
      const hashedPassword = await bcrypt.hash(dto.password, 10);
      
      // Find the default mock landlord to assign globally registered tenants
      const defaultLandlord = await this.prisma.landlord.findFirst();

      // Create user as Tenant
      const user = await this.prisma.user.create({
        data: {
          email: dto.email.toLowerCase(),
          password: hashedPassword,
          name: dto.name,
          phone: dto.phone,
          role: Role.TENANT,
          landlordId: defaultLandlord?.id || null, // Auto assign to default landlord
          desiredRoomId: dto.desiredRoomId,
          memberCount: dto.memberCount,
        },
      });
      return { message: 'Đăng ký tài khoản khách thuê thành công', data: { user } };

    } catch (error) {
      throw new InternalServerErrorException(
        'Đã xảy ra lỗi trong quá trình tạo tài khoản, vui lòng thử lại sau',
      );
    }
  }

  /**
   * Authenticates user credentials and issues a JWT token
   */
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    // If the user is a LANDLORD, they own a landlord profile. We need to inject that ID.
    let actualLandlordId = user.landlordId;
    if (user.role === 'LANDLORD') {
      const landlordProfile = await this.prisma.landlord.findFirst({
        where: { ownerId: user.id }
      });
      if (landlordProfile) {
        actualLandlordId = landlordProfile.id;
      }
    }

    // JWT payload construction
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      landlordId: actualLandlordId, // Injected to authorize multi-tenant requests
    };

    return {
      message: 'Đăng nhập thành công',
      data: {
        access_token: this.jwtService.sign(payload),
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          status: user.status,
          landlordId: actualLandlordId,
        },
      },
    };
  }
}
