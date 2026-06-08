import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Election } from './election.entity';
import { Vote } from '../votes/vote.entity';
import { ElectionService } from './election.service';
import { ElectionController } from './election.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Election, Vote]), AuthModule],
  providers: [ElectionService],
  controllers: [ElectionController],
  exports: [ElectionService],
})
export class ElectionModule {}
