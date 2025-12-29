import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Resend } from 'resend';
import envConfig from '../config';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private resend: Resend | null = null;
  private useSmtp: boolean = false;

  constructor() {
    if (envConfig.SMTP_USER && envConfig.SMTP_PASSWORD) {
      this.transporter = nodemailer.createTransport({
        host: envConfig.SMTP_HOST,
        port: parseInt(envConfig.SMTP_PORT),
        secure: false,
        auth: {
          user: envConfig.SMTP_USER,
          pass: envConfig.SMTP_PASSWORD,
        },
      });
      this.useSmtp = true;
      console.log('📧 Email service: Using Gmail SMTP');
    } else if (envConfig.RESEND_API_KEY) {
      this.resend = new Resend(envConfig.RESEND_API_KEY);
      console.log('📧 Email service: Using Resend');
    } else {
      console.warn('⚠️ Email service: No email provider configured');
    }
  }

  async sendOTP(payload: { email: string; code: string }) {
    const subject = `[${envConfig.APP_NAME}] Mã xác thực OTP`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Mã xác thực của bạn</h2>
        <p>Xin chào,</p>
        <p>Mã OTP của bạn là:</p>
        <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #007bff;">${payload.code}</span>
        </div>
        <p>Mã này sẽ hết hạn sau 5 phút.</p>
        <p>Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #888; font-size: 12px;">© ${new Date().getFullYear()} ${envConfig.APP_NAME}. All rights reserved.</p>
      </div>
    `;

    if (this.useSmtp && this.transporter) {
      return this.transporter.sendMail({
        from: envConfig.SMTP_FROM || `${envConfig.APP_NAME} <${envConfig.SMTP_USER}>`,
        to: payload.email,
        subject,
        html,
      });
    } else if (this.resend) {
      return this.resend.emails.send({
        from: `${envConfig.APP_NAME} <onboarding@resend.dev>`,
        to: payload.email,
        subject,
        html,
      });
    } else {
      console.log(`📧 [DEV] OTP for ${payload.email}: ${payload.code}`);
      return { id: 'dev-mode', message: 'Email logged to console (no provider configured)' };
    }
  }

  async sendVerificationEmail(payload: { email: string; code: string }) {
    const subject = `[${envConfig.APP_NAME}] Xác thực email`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Xác thực email của bạn</h2>
        <p>Xin chào,</p>
        <p>Mã xác thực email của bạn là:</p>
        <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #28a745;">${payload.code}</span>
        </div>
        <p>Mã này sẽ hết hạn sau 5 phút.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #888; font-size: 12px;">© ${new Date().getFullYear()} ${envConfig.APP_NAME}. All rights reserved.</p>
      </div>
    `;

    if (this.useSmtp && this.transporter) {
      return this.transporter.sendMail({
        from: envConfig.SMTP_FROM || `${envConfig.APP_NAME} <${envConfig.SMTP_USER}>`,
        to: payload.email,
        subject,
        html,
      });
    } else if (this.resend) {
      return this.resend.emails.send({
        from: `${envConfig.APP_NAME} <onboarding@resend.dev>`,
        to: payload.email,
        subject,
        html,
      });
    } else {
      console.log(`📧 [DEV] Verification code for ${payload.email}: ${payload.code}`);
      return { id: 'dev-mode', message: 'Email logged to console (no provider configured)' };
    }
  }

  async sendPasswordResetEmail(payload: { email: string; code: string }) {
    const subject = `[${envConfig.APP_NAME}] Đặt lại mật khẩu`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Đặt lại mật khẩu</h2>
        <p>Xin chào,</p>
        <p>Bạn đã yêu cầu đặt lại mật khẩu. Mã xác thực của bạn là:</p>
        <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #dc3545;">${payload.code}</span>
        </div>
        <p>Mã này sẽ hết hạn sau 5 phút.</p>
        <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #888; font-size: 12px;">© ${new Date().getFullYear()} ${envConfig.APP_NAME}. All rights reserved.</p>
      </div>
    `;

    if (this.useSmtp && this.transporter) {
      return this.transporter.sendMail({
        from: envConfig.SMTP_FROM || `${envConfig.APP_NAME} <${envConfig.SMTP_USER}>`,
        to: payload.email,
        subject,
        html,
      });
    } else if (this.resend) {
      return this.resend.emails.send({
        from: `${envConfig.APP_NAME} <onboarding@resend.dev>`,
        to: payload.email,
        subject,
        html,
      });
    } else {
      console.log(`📧 [DEV] Password reset code for ${payload.email}: ${payload.code}`);
      return { id: 'dev-mode', message: 'Email logged to console (no provider configured)' };
    }
  }
}
