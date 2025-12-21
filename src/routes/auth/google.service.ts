import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import envConfig from 'src/shared/config';

@Injectable()
export class GoogleService {
  private oauth2Client: OAuth2Client;
  constructor() {
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
}
