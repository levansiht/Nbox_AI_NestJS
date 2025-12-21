import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { HashingService } from 'src/shared/services/hashing.service';
import { generateOTP, isUniqueConstrainPrismaError } from 'src/shared/helper';
import { RolesService } from './roles.service';
import { RegisterBodyType, SendOTPBodyType, VerificationCodeType } from './auth.model';
import { AuthRepository } from './auth.repo';
import { SharedUserRepository } from 'src/shared/repositories/shared-user.repo';
import { addMilliseconds } from 'date-fns';
import envConfig from 'src/shared/config';
import ms from 'ms';
import { TypeOfVerificationCode, TypeOfVerificationCodeType } from 'src/shared/contants/auth.constant';
import { PrismaService } from 'src/shared/services/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly hashingService: HashingService,
    private readonly rolesService: RolesService,
    private readonly authRepository: AuthRepository,
    private readonly sharedUserRepository: SharedUserRepository,
    private readonly prismaSerivce: PrismaService,
  ) {}

  async register(body: RegisterBodyType) {
    try {
      const verificationCode = await this.authRepository.findVerificationCode(
        body.email,
        body.code,
        TypeOfVerificationCode.REGISTER,
      );
      if (!verificationCode) {
        throw new UnprocessableEntityException({
          message: 'Invalid verification code.',
          path: 'code',
        });
      }

      if (verificationCode.expiresAt < new Date()) {
        throw new UnprocessableEntityException({
          message: 'Verification code has expired.',
          path: 'code',
        });
      }

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
        throw new UnprocessableEntityException({
          message: 'Email already exists.',
          path: 'email',
        });
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

  async sendOTP(body: SendOTPBodyType) {
    const user = await this.sharedUserRepository.findUnique({ email: body.email });
    if (user) {
      throw new UnprocessableEntityException({
        message: 'Email already exists.',
        path: 'email',
      });
    }

    const code = generateOTP();
    const verificationCode = await this.authRepository.createVerificationCode({
      email: body.email,
      code,
      type: body.type,
      expiresAt: addMilliseconds(new Date(), ms(envConfig.OTP_EXPIRES_IN as ms.StringValue)),
    });
    return verificationCode;
  }

  async findUniqueVerificationCode(
    uniqueValue:
      | { id: number }
      | {
          email_type: {
            email: string;
            type: TypeOfVerificationCodeType;
          };
        },
  ): Promise<VerificationCodeType | null> {
    return this.prismaSerivce.verificationCode.findUnique({
      where: uniqueValue,
    });
  }
}
