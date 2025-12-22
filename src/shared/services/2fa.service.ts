import { Injectable } from '@nestjs/common';
import * as OTPAuth from 'otpauth';
import envConfig from '../config';

@Injectable()
export class TwoFactorService {
  private createTOTP(email: string, secret?: string) {
    return new OTPAuth.TOTP({
      issuer: envConfig.APP_NAME || 'NBox AI',
      label: email,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: secret || new OTPAuth.Secret(),
    });
  }

  generateTOTPSecret(email: string) {
    const totp = this.createTOTP(email);
    const secret = totp.secret.base32;
    const uri = totp.toString();
    return { secret, uri };
  }

  verifyTOTP({ email, token, secret }: { email: string; secret: string; token: string }): boolean {
    const totp = this.createTOTP(email, secret);
    const delta = totp.validate({ token, window: 1 });

    return delta !== null;
  }
}
