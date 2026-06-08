import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';

type JwtPayload = {
  sub: number;
  username: string;
  role: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(username: string, password: string) {
    const user = await this.usersService.validateUser(username, password);

    if (!user) {
      throw new UnauthorizedException('Usuario o contraseña incorrectos');
    }

    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      role: user.role,
    };

    const access_token = await this.jwtService.signAsync(payload);

    return {
      access_token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    };
  }

  async me(token: string) {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);

      return {
        id: payload.sub,
        username: payload.username,
        role: payload.role,
      };
    } catch {
      throw new UnauthorizedException('Token inválido o vencido');
    }
  }
}
