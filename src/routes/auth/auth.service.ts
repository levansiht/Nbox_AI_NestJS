import { Injectable, UnauthorizedException, UnprocessableEntityException } from '@nestjs/common';
import { HashingService } from 'src/shared/services/hashing.service';
import { generateOTP, isNotFoundPrismaError, isUniqueConstrainPrismaError } from 'src/shared/helper';
import { RolesService } from './roles.service';
import {
  ForgotPasswordBodyType,
  LoginBodyType,
  RefreshTokenBodyType,
  RegisterBodyType,
  SendOTPBodyType,
} from './auth.model';
import { AuthRepository } from './auth.repo';
import { SharedUserRepository } from 'src/shared/repositories/shared-user.repo';
import { addMilliseconds } from 'date-fns';
import envConfig from 'src/shared/config';
import ms from 'ms';
import { TypeOfVerificationCode, TypeOfVerificationCodeType } from 'src/shared/contants/auth.constant';
import { EmailService } from 'src/shared/services/email.service';
import { TokenService } from 'src/shared/services/token.service';
import { AccessTokenPayloadCreate } from 'src/shared/types/jwt.type';
import { TwoFactorService } from 'src/shared/services/2fa.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly hashingService: HashingService,
    private readonly rolesService: RolesService,
    private readonly authRepository: AuthRepository,
    private readonly sharedUserRepository: SharedUserRepository,
    private readonly emailService: EmailService,
    private readonly tokenService: TokenService,
    private readonly twoFactorService: TwoFactorService,
  ) {}

  async validateVerificationCode({
    email,
    code,
    type,
  }: {
    email: string;
    code: string;
    type: TypeOfVerificationCodeType;
  }) {
    const verificationCode = await this.authRepository.findUniqueVerificationCode({
      email_code_type: { email, code, type },
    });
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
    return verificationCode;
  }

  async register(body: RegisterBodyType) {
    try {
      await this.validateVerificationCode({
        email: body.email,
        code: body.code,
        type: TypeOfVerificationCode.REGISTER,
      });

      const clientRoleId = await this.rolesService.getClientRoleId();
      const hashedPassword = await this.hashingService.hash(body.password);
      const [user] = await Promise.all([
        this.authRepository.createUser({
          email: body.email,
          password: hashedPassword,
          name: body.name,
          phoneNumber: body.phoneNumber,
          roleId: clientRoleId,
        }),
        this.authRepository.deleteVerificationCode({
          email_code_type: {
            email: body.email,
            code: body.code,
            type: TypeOfVerificationCode.REGISTER,
          },
        }),
      ]);

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
    if (user.totpSecret) {
      if (!body.totpCode && !body.code) {
        throw new UnprocessableEntityException([
          {
            message: 'Two-factor authentication is enabled for this account. Please provide totpCode or code.',
            path: 'totpCode',
          },
          {
            message: 'Two-factor authentication is enabled for this account. Please provide totpCode or code.',
            path: 'code',
          },
        ]);
      }
      if (body.totpCode) {
        const isValid = this.twoFactorService.verifyTOTP({
          email: user.email,
          secret: user.totpSecret,
          token: body.totpCode,
        });
        if (!isValid) {
          throw new UnprocessableEntityException({
            message: 'Invalid two-factor authentication code.',
            path: 'totpCode',
          });
        }
      } else if (body.code) {
        await this.validateVerificationCode({
          email: body.email,
          code: body.code,
          type: TypeOfVerificationCode.LOGIN,
        });
      }
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
        user: {
          roleId,
          role: { name: roleName },
        },
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

  async forgotPassword(body: ForgotPasswordBodyType) {
    const { email, code, newPassword } = body;

    const user = await this.sharedUserRepository.findUnique({ email });
    if (!user) {
      throw new UnprocessableEntityException({
        message: 'Email not found.',
        path: 'email',
      });
    }
    await this.validateVerificationCode({
      email,
      code,
      type: TypeOfVerificationCode.FORGOT_PASSWORD,
    });

    const hashedPassword = await this.hashingService.hash(newPassword);
    await Promise.all([
      this.authRepository.updateUser(
        {
          id: user.id,
        },
        {
          password: hashedPassword,
        },
      ),
      this.authRepository.deleteVerificationCode({
        email_code_type: {
          email,
          code,
          type: TypeOfVerificationCode.FORGOT_PASSWORD,
        },
      }),
    ]);

    return { message: 'Password has been reset successfully.' };
  }

  async sendOTP(body: SendOTPBodyType) {
    const user = await this.sharedUserRepository.findUnique({ email: body.email });
    if (user && body.type === TypeOfVerificationCode.REGISTER) {
      throw new UnprocessableEntityException({
        message: 'Email already exists.',
        path: 'email',
      });
    }
    if (!user && body.type === TypeOfVerificationCode.FORGOT_PASSWORD) {
      throw new UnprocessableEntityException({
        message: 'Email not found.',
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

  async setupTwoFactorAuth(userId: number) {
    const user = await this.authRepository.findUniqueUserIncludeRole({ id: userId });
    if (!user) {
      throw new UnauthorizedException({
        message: 'User not found.',
        path: 'totpCode',
      });
    }
    if (user.totpSecret) {
      throw new UnprocessableEntityException({
        message: 'Two-factor authentication is already set up.',
        path: 'totpCode',
      });
    }
    const { secret, uri } = this.twoFactorService.generateTOTPSecret(user.email);
    await this.authRepository.updateUser({ id: userId }, { totpSecret: secret });
    return { secret, url: uri };
  }
}
