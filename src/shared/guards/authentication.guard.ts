import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthType } from '../contants/auth.constant';
import { AccessTokenGuard } from 'src/shared/guards/access-token.guard';
import { Reflector } from '@nestjs/core';
import { AUTH_TYPE_KEY, AuthTypeDecoratorPayload } from '../decorator/auth.decorator';

@Injectable()
export class AuthenticationGuard implements CanActivate {
  private readonly authTypeGuardMap: Record<string, CanActivate>;

  constructor(
    private readonly reflector: Reflector,
    private readonly accessTokenGuard: AccessTokenGuard,
  ) {
    this.authTypeGuardMap = {
      [AuthType.Bearer]: this.accessTokenGuard,
      [AuthType.None]: { canActivate: () => true } as CanActivate,
    };
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const authTypeValue = this.reflector.getAllAndOverride<AuthTypeDecoratorPayload | undefined>(AUTH_TYPE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]) ?? { authTypes: [AuthType.Bearer], options: { condition: 'AND' } };

    const authTypesArray = Array.isArray(authTypeValue.authTypes) ? authTypeValue.authTypes : [authTypeValue.authTypes];
    const guards = authTypesArray.map((authType) => this.authTypeGuardMap[authType]);

    let error = new UnauthorizedException();

    if (authTypeValue.options.condition === 'OR') {
      for (const guard of guards) {
        try {
          if (await guard.canActivate(context)) {
            return true;
          }
        } catch (err) {
          error = err;
        }
      }
      throw error;
    }

    if (authTypeValue.options.condition === 'AND') {
      for (const guard of guards) {
        await guard.canActivate(context);
      }
      return true;
    }

    return false;
  }
}
