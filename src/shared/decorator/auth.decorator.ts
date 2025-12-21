import { SetMetadata } from '@nestjs/common';
import { AuthType, AuthTypeType, ConditionGuardType } from '../contants/auth.constant';

export const AUTH_TYPE_KEY = 'auth_type';
export type AuthTypeDecoratorPayload = {
  authTypes: AuthTypeType | AuthTypeType[];
  options: { condition: ConditionGuardType };
};

export const Auth = (authTypes: AuthTypeType | AuthTypeType[], options?: { condition?: ConditionGuardType }) => {
  return SetMetadata(AUTH_TYPE_KEY, {
    authTypes,
    options: {
      condition: options?.condition || 'AND',
    },
  });
};

export const IsPublic = () => Auth(AuthType.None);
