import { Body, Controller, HttpCode, Post, SerializeOptions } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginResDTO, RefreshTokenBodyDTO, RefreshTokenResDTO, RegisterBodyDTO, RegisterResDTO } from './auth.dto';
// import { Auth } from 'src/shared/decorator/auth.decorator';
// import { AuthType } from 'src/shared/contants/auth.constant';

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

  //   @Auth([AuthType.Bearer, AuthType.APIKey], { condition: 'OR' })
  @Post('refresh-token')
  @HttpCode(200)
  async refreshToken(@Body() body: RefreshTokenBodyDTO) {
    return new RefreshTokenResDTO(await this.authService.refreshTokens(body.refreshToken));
  }
}
