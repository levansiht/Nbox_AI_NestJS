import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterBodyDTO, RegisterResDTO } from './auth.dto';
import { ZodSerializerDto } from 'nestjs-zod';

// import { Auth } from 'src/shared/decorator/auth.decorator';
// import { AuthType } from 'src/shared/contants/auth.constant';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ZodSerializerDto(RegisterResDTO)
  async register(@Body() body: RegisterBodyDTO) {
    return await this.authService.register(body);
  }

  @Post('login')
  async login(@Body() body: any) {
    return await this.authService.login(body);
  }

  //   @Auth([AuthType.Bearer, AuthType.APIKey], { condition: 'OR' })
  @Post('refresh-token')
  @HttpCode(200)
  async refreshToken(@Body() body: any) {
    return await this.authService.refreshTokens(body.refreshToken);
  }

  @Post('logout')
  async logout(@Body() body: any) {
    return await this.authService.logout(body.refreshToken);
  }
}
