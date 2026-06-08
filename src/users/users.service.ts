import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './user.entity';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async onModuleInit() {
    await this.ensureDefaultAdmin();
  }

  async ensureDefaultAdmin() {
    const username = process.env.ADMIN_USERNAME;
    const password = process.env.ADMIN_PASSWORD;

    if (!username || !password) {
      console.log(
        '⚠️ ADMIN_USERNAME o ADMIN_PASSWORD no definidos. No se creó/actualizó el usuario administrador.',
      );
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const existingUser = await this.usersRepository.findOne({
      where: { username },
    });

    if (existingUser) {
      existingUser.passwordHash = passwordHash;
      existingUser.role = 'ADMIN';
      existingUser.isActive = true;

      await this.usersRepository.save(existingUser);
      console.log(`✅ Usuario ADMIN actualizado: ${username}`);
      return;
    }

    const legacyAdmin = await this.usersRepository.findOne({
      where: { username: 'admin' },
    });

    if (legacyAdmin) {
      legacyAdmin.username = username;
      legacyAdmin.passwordHash = passwordHash;
      legacyAdmin.role = 'ADMIN';
      legacyAdmin.isActive = true;

      await this.usersRepository.save(legacyAdmin);
      console.log(`✅ Usuario ADMIN migrado a: ${username}`);
      return;
    }

    const admin = this.usersRepository.create({
      username,
      passwordHash,
      role: 'ADMIN',
      isActive: true,
    });

    await this.usersRepository.save(admin);

    console.log(`✅ Usuario ADMIN creado: ${username}`);
  }

  async findByUsername(username: string) {
    return this.usersRepository.findOne({
      where: { username },
    });
  }

  async validateUser(username: string, password: string) {
    const user = await this.findByUsername(username);

    if (!user || !user.isActive) {
      return null;
    }

    const ok = await bcrypt.compare(password, user.passwordHash);

    if (!ok) {
      return null;
    }

    return user;
  }
}
