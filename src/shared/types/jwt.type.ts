export interface AccessTokenPayloadCreate {
  userId: number;
  deviceId: number;
  roleId: number;
  roleName: string;
}

export interface AcessTokenPayload extends AccessTokenPayloadCreate {
  iat: number;
  exp: number;
}

export interface RefreshTokenPayloadCreate {
  userId: number;
}
export interface RefreshTokenPayload extends RefreshTokenPayloadCreate {
  iat: number;
  exp: number;
}
