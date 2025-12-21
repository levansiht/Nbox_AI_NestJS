import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { HashingService } from 'src/shared/services/hashing.service';
import { isUniqueConstrainPrismaError } from 'src/shared/helper';
import { RolesService } from './roles.service';
import { RegisterBodyType } from './auth.model';
import { AuthRepository } from './auth.repo';

@Injectable()
export class AuthService {
  constructor(
    private readonly hashingService: HashingService,
    private readonly rolesService: RolesService,
    private readonly authRepository: AuthRepository,
  ) {}

  async register(body: RegisterBodyType) {
    try {
      const clientRoleId = await this.rolesService.getClientRoleId();
      const hashedPassword = await this.hashingService.hash(body.password);
      const user = await this.authRepository.createUser({
        email: body.email,
        password: hashedPassword,
        name: body.name,
        phoneNumber: body.phoneNumber,
        roleId: clientRoleId,
      });
      return user;
    } catch (error) {
      if (isUniqueConstrainPrismaError(error)) {
        throw new UnprocessableEntityException('Email already in use.');
      }
      throw error;
    }
  }
  // async login(body: any) {
  //   const user = await this.prisma.user.findUnique({
  //     where: { email: body.email },
  //   });

  //   if (!user) {
  //     throw new UnauthorizedException('User not found.');
  //   }

  //   const isPasswordValid = await this.hashingService.compare(body.password, user.password);
  //   if (!isPasswordValid) {
  //     throw new UnprocessableEntityException({
  //       field: 'password',
  //       message: 'Invalid password.',
  //     });
  //   }
  //   const tokens = await this.generateTokens({ userId: user.id });

  //   return tokens;
  // }
  // async generateTokens(payload: { userId: number }) {
  //   const [accessToken, refreshToken] = await Promise.all([
  //     this.tokenService.signAccessToken(payload),
  //     this.tokenService.signRefreshToken(payload),
  //   ]);

  //   const decodedRefreshToken = await this.tokenService.verifyRefreshToken(refreshToken);

  //   await this.prisma.refreshToken.create({
  //     data: {
  //       userId: payload.userId,
  //       token: refreshToken,
  //       expiredAt: new Date(decodedRefreshToken.exp * 1000),
  //     },
  //   });
  //   return { accessToken, refreshToken };
  // }

  // async refreshTokens(refreshToken: string) {
  //   try {
  //     const { userId } = await this.tokenService.verifyRefreshToken(refreshToken);

  //     await this.prisma.refreshToken.findUniqueOrThrow({
  //       where: {
  //         token: refreshToken,
  //       },
  //     });

  //     await this.prisma.refreshToken.delete({
  //       where: {
  //         token: refreshToken,
  //       },
  //     });

  //     return this.generateTokens({ userId });
  //   } catch (error) {
  //     if (isNotFoundPrismaError(error)) {
  //       throw new UnauthorizedException('Invalid refresh token.');
  //     }
  //     throw new UnauthorizedException();
  //   }
  // }

  // async logout(refreshToken: string) {
  //   try {
  //     await this.tokenService.verifyRefreshToken(refreshToken);

  //     await this.prisma.refreshToken.delete({
  //       where: {
  //         token: refreshToken,
  //       },
  //     });
  //     return { message: 'Logout successful.' };
  //   } catch (error) {
  //     if (isNotFoundPrismaError(error)) {
  //       throw new UnauthorizedException('Invalid refresh token.');
  //     }
  //     throw new UnauthorizedException();
  //   }
  // }
}
