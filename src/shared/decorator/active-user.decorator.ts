import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { REQUEST_USER_KEY } from '../contants/auth.constant';
import { AcessTokenPayload } from '../types/jwt.type';

export const ActiveUser = createParamDecorator(
  (field: keyof AcessTokenPayload | undefined, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    const user: AcessTokenPayload | undefined = request[REQUEST_USER_KEY];
    return field ? user?.[field] : user;
  },
);
