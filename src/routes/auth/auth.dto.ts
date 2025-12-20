import { Exclude, Type } from 'class-transformer';
import { IsString } from 'class-validator';
import { SuccessResDTO } from 'src/shared/shared.dto';

export class LoginBodyDTO {
  @IsString()
  email: string;
  @IsString()
  password: string;
}

export class LoginResDTO {
  accessToken: string;
  refreshToken: string;

  constructor(partial: Partial<LoginResDTO>) {
    Object.assign(this, partial);
  }
}
export class RegisterBodyDTO extends LoginBodyDTO {
  @IsString()
  name: string;
  @IsString()
  confirmPassword: string;
}

export class RegisterData {
  id: number;
  email: string;
  name: string;
  @Exclude() password: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<RegisterData>) {
    Object.assign(this, partial);
  }
}

export class RegisterResDTO extends SuccessResDTO {
  @Type(() => RegisterData)
  declare data: RegisterData;
  constructor(partial: Partial<RegisterResDTO>) {
    super(partial);
    Object.assign(this, partial);
  }
}

export class RefreshTokenBodyDTO {
  @IsString()
  refreshToken: string;
}

export class RefreshTokenResDTO extends LoginResDTO {}

export class LogoutBodyDTO extends RefreshTokenBodyDTO {}

export class LogoutResDTO {
  message: string;
  constructor(partial: Partial<LogoutResDTO>) {
    Object.assign(this, partial);
  }
}
