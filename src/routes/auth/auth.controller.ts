import { Body, Controller, HttpCode, Post, SerializeOptions, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginResDTO, RefreshTokenBodyDTO, RefreshTokenResDTO, RegisterBodyDTO, RegisterResDTO } from './auth.dto';
import { AccessTokenGuard } from 'src/shared/guards/access-token.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @SerializeOptions({ type: RegisterResDTO })
  @Post('register')
  async register(@Body() body: RegisterBodyDTO) {
    return await this.authService.register(body);
  }

  @Post('login')
  async login(@Body() body: any) {
    return new LoginResDTO(await this.authService.login(body));
  }

  @UseGuards(AccessTokenGuard)
  @Post('refresh-token')
  @HttpCode(200)
  async refreshToken(@Body() body: RefreshTokenBodyDTO) {
    return new RefreshTokenResDTO(await this.authService.refreshTokens(body.refreshToken));
  }
}
