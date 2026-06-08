import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

type JwtPayload = {
  sub: number;
  username: string;
  role: string;
};

type RequestWithUser = Request & {
  user?: JwtPayload;
};

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const authorization = request.headers.authorization;

    if (!authorization) {
      throw new UnauthorizedException('Falta token');
    }

    const [type, token] = authorization.split(' ');

    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Token inválido');
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);

      if (payload.role !== 'ADMIN') {
        throw new ForbiddenException('Acceso solo para ADMIN');
      }

      request.user = payload;
      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }

      throw new UnauthorizedException('Token inválido o vencido');
    }
  }
}
