import { Injectable, UnauthorizedException, UnprocessableEntityException } from '@nestjs/common';
import { HashingService } from 'src/shared/services/hashing.service';
import { PrismaService } from 'src/shared/services/prisma.service';
import { TokenService } from 'src/shared/services/token.service';
import { isNotFoundPrismaError, isUniqueConstrainPrismaError } from 'src/shared/helper';
import { RolesService } from './roles.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly hashingService: HashingService,
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
    private readonly rolesService: RolesService,
  ) {}

  async register(body: any) {
    try {
      const clientRoleId = await this.rolesService.getClientRoleId();
      const hashedPassword = await this.hashingService.hash(body.password);
      const user = await this.prisma.user.create({
        data: {
          email: body.email,
          password: hashedPassword,
          name: body.name,
          phoneNumber: body.phoneNumber,
          roleId: clientRoleId,
        },
        select: {
          id: true,
          email: true,
          name: true,
          phoneNumber: true,
          avatar: true,
          status: true,
          roleId: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      return user;
    } catch (error) {
      if (isUniqueConstrainPrismaError(error)) {
        throw new UnprocessableEntityException('Email already in use.');
      }
      throw error;
    }
  }
  async login(body: any) {
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
      if (isNotFoundPrismaError(error)) {
        throw new UnauthorizedException('Invalid refresh token.');
      }
      throw new UnauthorizedException();
    }
  }

  async logout(refreshToken: string) {
    try {
      await this.tokenService.verifyRefreshToken(refreshToken);

      await this.prisma.refreshToken.delete({
        where: {
          token: refreshToken,
        },
      });
      return { message: 'Logout successful.' };
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw new UnauthorizedException('Invalid refresh token.');
      }
      throw new UnauthorizedException();
    }
  }
}
