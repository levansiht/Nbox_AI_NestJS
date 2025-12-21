export const REQUEST_USER_KEY = 'user';

export const AuthType = {
  Bearer: 'Bearer',
  None: 'None',
  APIKey: 'APIKey',
} as const;

export type AuthTypeType = (typeof AuthType)[keyof typeof AuthType];

export const ConditionGuard = {
  OR: 'OR',
  AND: 'AND',
} as const;

export type ConditionGuardType = (typeof ConditionGuard)[keyof typeof ConditionGuard];

export const UserStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  BANNED: 'BANNED',
} as const;

export type UserStatusType = (typeof UserStatus)[keyof typeof UserStatus];
