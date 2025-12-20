import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma } from 'generated/prisma/client';
import { ROLENAME } from 'src/shared/contants/role.constant';
import { HashingService } from 'src/shared/services/hashing.service';
import { PrismaService } from 'src/shared/services/prisma.service';
import { LoginBodyDTO } from './auth.dto';
import { TokenService } from 'src/shared/services/token.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly hashingService: HashingService,
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
  ) {}

  async register(body: any) {
    try {
      const userRole = await this.prisma.role.findFirst({
        where: { name: ROLENAME.User },
      });

      if (!userRole) {
        throw new InternalServerErrorException('Default user role not found. Please run database seed.');
      }

      const hashedPassword = await this.hashingService.hash(body.password);
      const user = await this.prisma.user.create({
        data: {
          email: body.email,
          password: hashedPassword,
          name: body.name,
          phoneNumber: body.phoneNumber,
          roleId: userRole.id,
        },
      });
      return user;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new UnprocessableEntityException('Email already in use.');
      }
      throw error;
    }
  }

  async login(body: LoginBodyDTO) {
    const user = await this.prisma.user.findUnique({
      where: { email: body.email },
    });

    if (!user) {
      throw new UnauthorizedException('User not found.');
    }

    const isPasswordValid = await this.hashingService.compare(body.password, user.password);
    if (!isPasswordValid) {
      throw new UnprocessableEntityException({
        field: 'password',
        message: 'Invalid password.',
      });
    }
    const tokens = await this.generateTokens({ userId: user.id });

    return tokens;
  }
  async generateTokens(payload: { userId: number }) {
    const [accessToken, refreshToken] = await Promise.all([
      this.tokenService.signAccessToken(payload),
      this.tokenService.signRefreshToken(payload),
    ]);

    const decodedRefreshToken = await this.tokenService.verifyRefreshToken(refreshToken);

    await this.prisma.refreshToken.create({
      data: {
        userId: payload.userId,
        token: refreshToken,
        expiredAt: new Date(decodedRefreshToken.exp * 1000),
      },
    });
    return { accessToken, refreshToken };
  }

  async refreshTokens(refreshToken: string) {
    try {
      const { userId } = await this.tokenService.verifyRefreshToken(refreshToken);

      await this.prisma.refreshToken.findUniqueOrThrow({
        where: {
          token: refreshToken,
        },
      });

      await this.prisma.refreshToken.delete({
        where: {
          token: refreshToken,
        },
      });

      return this.generateTokens({ userId });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new UnauthorizedException('Invalid refresh token.');
      }
      throw new UnauthorizedException();
    }
  }
}
