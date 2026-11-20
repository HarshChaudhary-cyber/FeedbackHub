import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SESSION_COOKIE_NAME } from './auth.constants';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.cookies?.[SESSION_COOKIE_NAME];

    if (!token) {
      throw new UnauthorizedException('Authentication required. Please sign in.');
    }

    const sessionData = await this.authService.validateSession(token);
    if (!sessionData) {
      throw new UnauthorizedException('Session expired or invalid. Please sign in again.');
    }

    request.user = sessionData.user;
    request.authSession = sessionData.session;
    return true;
  }
}
