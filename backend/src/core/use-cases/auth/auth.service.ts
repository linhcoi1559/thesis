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
   * Registers a new Landlord account and sets up their Tenant/Landlord business entity
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
      const role = dto.role === 'LANDLORD' || dto.role === 'ADMIN' ? dto.role : Role.TENANT;

      if (role === Role.TENANT) {
        // Find the default mock landlord to assign globally registered tenants
        const defaultLandlord = await this.prisma.landlord.findFirst();

        // Create user as Tenant
        const user = await this.prisma.user.create({
          data: {
            email: dto.email.toLowerCase(),
            password: hashedPassword,
            name: dto.name,
            phone: dto.phone,
            role,
            landlordId: defaultLandlord?.id || null, // Auto assign to default landlord
          },
        });
        return { message: 'Đăng ký tài khoản khách thuê thành công', data: { user } };
      }

      // Run transactional queries to resolve the mutual link: User <-> Landlord
      const result = await this.prisma.$transaction(async (tx) => {
        // Step 1: Create the User account with role LANDLORD (without landlordId temporarily)
        const user = await tx.user.create({
          data: {
            email: dto.email.toLowerCase(),
            password: hashedPassword,
            name: dto.name,
            phone: dto.phone,
            role,
          },
        });

        // Step 2: Create the Landlord business profile owned by the created User
        const landlord = await tx.landlord.create({
          data: {
            name: dto.landlordName || 'Chủ Trọ Mới',
            phone: dto.landlordPhone || dto.phone,
            address: dto.landlordAddress,
            bankName: dto.bankName,
            bankAccountNumber: dto.bankAccountNumber,
            bankAccountName: dto.bankAccountName,
            ownerId: user.id,
          },
        });

        // Step 3: Update the User account to associate it with the Landlord tenancy ID
        const updatedUser = await tx.user.update({
          where: { id: user.id },
          data: { landlordId: landlord.id },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            landlordId: true,
            createdAt: true,
          },
        });

        return { user: updatedUser, landlord };
      });

      return {
        message: 'Đăng ký tài khoản chủ trọ thành công',
        data: result,
      };
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

    // JWT payload construction
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      landlordId: user.landlordId, // Injected to authorize multi-tenant requests
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
          landlordId: user.landlordId,
        },
      },
    };
  }
}
