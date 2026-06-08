import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vote } from './vote.entity';
import { Student } from '../students/student.entity';
import { VotesService } from './votes.service';
import { VotesController } from './votes.controller';
import { AuthModule } from '../auth/auth.module';
import { ElectionModule } from '../election/election.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Vote, Student]),
    AuthModule,
    ElectionModule,
  ],
  controllers: [VotesController],
  providers: [VotesService],
  exports: [VotesService],
})
export class VotesModule {}
