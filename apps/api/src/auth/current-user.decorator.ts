import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { SessionUser } from '@feedbackhub/types';

export const CurrentUser = createParamDecorator(
  (data: keyof SessionUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as SessionUser | undefined;

    return data && user ? user[data] : user;
  }
);

export const CurrentSession = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.authSession;
  }
);
