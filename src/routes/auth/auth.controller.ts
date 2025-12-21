import { Body, Controller, HttpCode, HttpStatus, Ip, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  LoginBodyDTO,
  LoginResDTO,
  LogoutBodyDTO,
  RefreshTokenBodyDTO,
  RefreshTokenResDTO,
  RegisterBodyDTO,
  RegisterResDTO,
  SendOTPBodyDTO,
} from './auth.dto';
import { ZodSerializerDto } from 'nestjs-zod';
import { UserAgent } from 'src/shared/decorator/user-agent.decorator';
import { MessageResDTO } from 'src/shared/models/response.model';
import { IsPublic } from 'src/shared/decorator/auth.decorator';
// import { Auth } from 'src/shared/decorator/auth.decorator';
// import { AuthType } from 'src/shared/contants/auth.constant';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
}
