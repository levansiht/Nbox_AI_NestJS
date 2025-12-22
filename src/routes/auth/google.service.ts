import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import envConfig from 'src/shared/config';
import { GoogleAuthStateType } from './auth.model';
import { AuthRepository } from './auth.repo';
import { HashingService } from 'src/shared/services/hashing.service';
import { RolesService } from './roles.service';
import { AuthService } from './auth.service';

@Injectable()
export class GoogleService {
  private oauth2Client: OAuth2Client;
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly hashingService: HashingService,
    private readonly authService: AuthService,
    private readonly rolesService: RolesService,
  ) {
    this.oauth2Client = new google.auth.OAuth2(
      envConfig.GOOGLE_CLIENT_ID,
      envConfig.GOOGLE_CLIENT_SECRET,
      envConfig.GOOGLE_REDIRECT_URI,
    );
  }

  getAuthorizationURL({ userAgent, ip }: { userAgent: string; ip: string }) {
    const scopes = [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
    ];

    const stateString = Buffer.from(JSON.stringify({ userAgent, ip })).toString('base64');
    const url = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      include_granted_scopes: true,
      state: stateString,
    });
    return { url };
  }

  async googleCallback({ code, state }: { code: string; state: string }) {
    try {
      let userAgent = 'Unknown';
      let ip = 'Unknown';
      try {
        if (state) {
          const clientInfo = JSON.parse(Buffer.from(state, 'base64').toString()) as GoogleAuthStateType;

          userAgent = clientInfo.userAgent;
          ip = clientInfo.ip;
        }
      } catch (error) {
        console.log('Failed to parse state:', error);
      }
      const { tokens } = await this.oauth2Client.getToken(code);
      this.oauth2Client.setCredentials(tokens);

      const oauth2 = google.oauth2({
        auth: this.oauth2Client,
        version: 'v2',
      });

      const { data } = await oauth2.userinfo.get();
      if (!data.email) {
        throw new Error('Email not found in Google user info');
      }
      let user = await this.authRepository.findUniqueUserIncludeRole({ email: data.email });
      if (!user) {
        const clientRoleId = await this.rolesService.getClientRoleId();
        const randomPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await this.hashingService.hash(randomPassword);
        user = await this.authRepository.createUserIncludeRole({
          email: data.email,
          password: hashedPassword,
          name: data.name || '',
          roleId: clientRoleId,
          phoneNumber: '',
          avatar: data.picture || '',
        });
      }
      const device = await this.authRepository.createDevice({
        userId: user.id,
        userAgent,
        ip,
      });

      const authTokens = await this.authService.generateTokens({
        userId: user.id,
        deviceId: device.id,
        roleId: user.role.id,
        roleName: user.role.name,
      });

      return authTokens;
    } catch (error) {
      console.log('Google authentication error:', error);
      throw new Error('Google authentication failed');
    }
  }
}
