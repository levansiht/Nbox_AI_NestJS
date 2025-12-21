import { Injectable, UnauthorizedException, UnprocessableEntityException } from '@nestjs/common';
import { HashingService } from 'src/shared/services/hashing.service';
import { generateOTP, isNotFoundPrismaError, isUniqueConstrainPrismaError } from 'src/shared/helper';
import { RolesService } from './roles.service';
import { LoginBodyType, RefreshTokenBodyType, RegisterBodyType, SendOTPBodyType } from './auth.model';
import { AuthRepository } from './auth.repo';
import { SharedUserRepository } from 'src/shared/repositories/shared-user.repo';
import { addMilliseconds } from 'date-fns';
import envConfig from 'src/shared/config';
import ms from 'ms';
import { TypeOfVerificationCode } from 'src/shared/contants/auth.constant';
import { EmailService } from 'src/shared/services/email.service';
import { TokenService } from 'src/shared/services/token.service';
import { AccessTokenPayloadCreate } from 'src/shared/types/jwt.type';

@Injectable()
export class AuthService {
  constructor(
    private readonly hashingService: HashingService,
    private readonly rolesService: RolesService,
    private readonly authRepository: AuthRepository,
    private readonly sharedUserRepository: SharedUserRepository,
    private readonly emailService: EmailService,
    private readonly tokenService: TokenService,
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
  async login(body: LoginBodyType & { userAgent: string; ip: string }) {
    const user = await this.authRepository.findUniqueUserIncludeRole({
      email: body.email,
    });
    if (!user) {
      throw new UnprocessableEntityException({
        message: 'Email not found.',
        path: 'email',
      });
    }

    const isPasswordValid = await this.hashingService.compare(body.password, user.password);
    if (!isPasswordValid) {
      throw new UnprocessableEntityException({
        field: 'password',
        message: 'Invalid password.',
      });
    }

    const device = await this.authRepository.createDevice({
      userId: user.id,
      userAgent: body.userAgent,
      ip: body.ip,
    });

    const tokens = await this.generateTokens({
      userId: user.id,
      deviceId: device.id,
      roleId: user.role.id,
      roleName: user.role.name,
    });

    return tokens;
  }
  async generateTokens({ userId, deviceId, roleId, roleName }: AccessTokenPayloadCreate) {
    const [accessToken, refreshToken] = await Promise.all([
      this.tokenService.signAccessToken({ userId, deviceId, roleId, roleName }),
      this.tokenService.signRefreshToken({ userId }),
    ]);

    const decodedRefreshToken = await this.tokenService.verifyRefreshToken(refreshToken);

    await this.authRepository.createRefreshToken({
      userId,
      token: refreshToken,
      expiredAt: new Date(decodedRefreshToken.exp * 1000),
      deviceId,
    });
    return { accessToken, refreshToken };
  }

  async refreshTokens({ refreshToken, userAgent, ip }: RefreshTokenBodyType & { userAgent: string; ip: string }) {
    try {
      const { userId } = await this.tokenService.verifyRefreshToken(refreshToken);

      const refreshTokenInDB = await this.authRepository.findUniqueRefreshTokenIncludeRole({
        token: refreshToken,
      });

      if (!refreshTokenInDB) {
        throw new UnauthorizedException({
          message: 'Refresh token has been used.',
        });
      }

      const {
        deviceId,
        user: { roleId, name: roleName },
      } = refreshTokenInDB;
      const $updateDevice = this.authRepository.updateDevice(deviceId, {
        userAgent,
        ip,
      });

      const $deleteRefreshToken = this.authRepository.deleteRefreshToken({
        token: refreshToken,
      });

      const $tokens = this.generateTokens({ userId, deviceId, roleId, roleName });

      const [, , tokens] = await Promise.all([$updateDevice, $deleteRefreshToken, $tokens]);

      return tokens;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException();
    }
  }

  async logout(refreshToken: string) {
    try {
      await this.tokenService.verifyRefreshToken(refreshToken);

      const deleteRefreshToken = await this.authRepository.deleteRefreshToken({
        token: refreshToken,
      });

      await this.authRepository.updateDevice(deleteRefreshToken.deviceId, { isActive: false });

      return { message: 'Logout successful.' };
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw new UnauthorizedException(' Refresh token has been used.');
      }
      throw new UnauthorizedException();
    }
  }

  async sendOTP(body: SendOTPBodyType) {
    const user = await this.sharedUserRepository.findUnique({ email: body.email });
    if (user) {
      throw new UnprocessableEntityException({
        message: 'Email already exists.',
        path: 'email',
      });
    }

    const code = generateOTP();
    await this.authRepository.createVerificationCode({
      email: body.email,
      code,
      type: body.type,
      expiresAt: addMilliseconds(new Date(), ms(envConfig.OTP_EXPIRES_IN as ms.StringValue)),
    });

    const { error } = await this.emailService.sendOTP({
      email: body.email,
      code,
    });

    if (error) {
      throw new UnprocessableEntityException({
        message: 'Failed to send OTP email.',
        path: 'email',
      });
    }
    return { message: 'OTP sent successfully.' };
  }
}
