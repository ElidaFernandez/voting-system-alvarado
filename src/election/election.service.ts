import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Election } from './election.entity';
import { Vote } from '../votes/vote.entity';

@Injectable()
export class ElectionService {
  constructor(
    @InjectRepository(Election)
    private readonly electionRepository: Repository<Election>,

    @InjectRepository(Vote)
    private readonly voteRepository: Repository<Vote>,
  ) {}

  async getElection(): Promise<Election> {
    let election = await this.electionRepository.findOne({
      where: { id: 1 },
    });

    if (!election) {
      election = this.electionRepository.create({
        isOpen: true,
        openedAt: new Date(),
        closedAt: null,
      });

      await this.electionRepository.save(election);
    }

    return election;
  }

  async openElection(): Promise<Election> {
    const election = await this.getElection();

    election.isOpen = true;
    election.openedAt = new Date();
    election.closedAt = null;

    return this.electionRepository.save(election);
  }

  async closeElection(): Promise<Election> {
    const election = await this.getElection();

    election.isOpen = false;
    election.closedAt = new Date();

    return this.electionRepository.save(election);
  }

  async resetElection(): Promise<Election> {
    await this.voteRepository.query(
      'TRUNCATE TABLE vote RESTART IDENTITY CASCADE;',
    );

    const election = await this.getElection();

    election.isOpen = true;
    election.openedAt = new Date();
    election.closedAt = null;

    return this.electionRepository.save(election);
  }
}
