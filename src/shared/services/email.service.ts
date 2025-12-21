import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';
import envConfig from '../config';

@Injectable()
export class EmailService {
  private resend: Resend;
  constructor() {
    this.resend = new Resend(envConfig.RESEND_API_KEY);
  }

  sendOTP(payload: { email: string; code: string }) {
    return this.resend.emails.send({
      from: 'Acme <onboarding@resend.dev>',
      to: 'levansi9b1718@gmail.com',
      subject: 'Your Nbox AI Verification Code',
      html: `<strong>Your verification code is: ${payload.code}</strong>`,
    });
  }
}
