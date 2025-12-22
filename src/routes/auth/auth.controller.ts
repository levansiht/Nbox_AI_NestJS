import { Body, Controller, Get, HttpCode, HttpStatus, Ip, Post, Query, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  DisableTwoFactorBodyDTO,
  ForgotPasswordBodyDTO,
  GetAuthorizationUrlResDTO,
  LoginBodyDTO,
  LoginResDTO,
  LogoutBodyDTO,
  RefreshTokenBodyDTO,
  RefreshTokenResDTO,
  RegisterBodyDTO,
  RegisterResDTO,
  SendOTPBodyDTO,
  TwoFactorSetupResDTO,
} from './auth.dto';
import { ZodSerializerDto } from 'nestjs-zod';
import { UserAgent } from 'src/shared/decorator/user-agent.decorator';
import { MessageResDTO } from 'src/shared/models/response.model';
import { IsPublic } from 'src/shared/decorator/auth.decorator';
import { GoogleService } from './google.service';
import { Response } from 'express';
import envConfig from 'src/shared/config';
import { EmptyBodyDTO } from 'src/shared/dtos/request.dto';
import { ActiveUser } from 'src/shared/decorator/active-user.decorator';
// import { Auth } from 'src/shared/decorator/auth.decorator';
// import { AuthType } from 'src/shared/contants/auth.constant';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly googleService: GoogleService,
  ) {}

  @Post('register')
  @IsPublic()
  @ZodSerializerDto(RegisterResDTO)
  async register(@Body() body: RegisterBodyDTO) {
    return await this.authService.register(body);
  }

  @Post('login')
  @IsPublic()
  @ZodSerializerDto(LoginResDTO)
  async login(@Body() body: LoginBodyDTO, @UserAgent() userAgent: string, @Ip() ip: string) {
    return await this.authService.login({ ...body, userAgent, ip });
  }

  // //   @Auth([AuthType.Bearer, AuthType.APIKey], { condition: 'OR' })
  @Post('refresh-token')
  @ZodSerializerDto(RefreshTokenResDTO)
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() body: RefreshTokenBodyDTO, @UserAgent() userAgent: string, @Ip() ip: string) {
    return await this.authService.refreshTokens({ ...body, userAgent, ip });
  }

  @Post('logout')
  @ZodSerializerDto(MessageResDTO)
  async logout(@Body() body: LogoutBodyDTO) {
    return await this.authService.logout(body.refreshToken);
  }

  @Post('otp')
  @IsPublic()
  @ZodSerializerDto(MessageResDTO)
  sendOTP(@Body() body: SendOTPBodyDTO) {
    return this.authService.sendOTP(body);
  }

  @Get('google-auth-url')
  @IsPublic()
  @ZodSerializerDto(GetAuthorizationUrlResDTO)
  getAuthorizationURL(@UserAgent() userAgent: string, @Ip() ip: string) {
    return this.googleService.getAuthorizationURL({ userAgent, ip });
  }

  @Get('google/callback')
  @IsPublic()
  async googleCallback(@Query('code') code: string, @Query('state') state: string, @Res() res: Response) {
    try {
      const data = await this.googleService.googleCallback({ code, state });
      return res.redirect(
        `${envConfig.GOOGLE_CLIENT_REDIRECT_URI}?accessToken=${data.accessToken}&refreshToken=${data.refreshToken}`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      return res.redirect(`${envConfig.GOOGLE_CLIENT_REDIRECT_URI}?errorMessage=${message}`);
    }
  }

  @Post('forgot-password')
  @IsPublic()
  @ZodSerializerDto(MessageResDTO)
  forgotPassword(@Body() body: ForgotPasswordBodyDTO) {
    return this.authService.forgotPassword(body);
  }

  @Post('2fa/setup')
  @ZodSerializerDto(TwoFactorSetupResDTO)
  setupTwoFactorAuth(@Body() _: EmptyBodyDTO, @ActiveUser('userId') userId: number) {
    return this.authService.setupTwoFactorAuth(userId);
  }

  @Post('2fa/disable')
  @ZodSerializerDto(MessageResDTO)
  disableTwoFactorAuth(@Body() body: DisableTwoFactorBodyDTO, @ActiveUser('userId') userId: number) {
    return this.authService.disableTwoFactorAuth({
      ...body,
      userId,
    });
  }
}
