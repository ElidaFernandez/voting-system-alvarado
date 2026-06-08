import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vote } from './vote.entity';
import { Student } from '../students/student.entity';
import { CreateVoteDto } from './dto/create-vote.dto';
import { ElectionService } from '../election/election.service';

@Injectable()
export class VotesService {
  constructor(
    @InjectRepository(Vote)
    private readonly votesRepository: Repository<Vote>,

    @InjectRepository(Student)
    private readonly studentsRepository: Repository<Student>,

    private readonly electionService: ElectionService,
  ) {}

  async create(createVoteDto: CreateVoteDto): Promise<Vote> {
    const { dni, option } = createVoteDto;

    const election = await this.electionService.getElection();

    if (!election.isOpen) {
      throw new BadRequestException('La votación está cerrada');
    }

    const validOptions = [
      'Lista N°2 Gonzalez, Nahuel (presidente)',
      'Lista N°10 Martinez, Guadalupe (presidente)',
    ];

    if (!validOptions.includes(option)) {
      throw new BadRequestException('Opción inválida');
    }

    const student = await this.studentsRepository.findOne({
      where: { dni },
    });

    if (!student) {
      throw new NotFoundException('Alumno no encontrado');
    }

    if (!student.enabled) {
      throw new BadRequestException('Alumno no habilitado');
    }

    const existing = await this.votesRepository.findOne({
      where: {
        student: {
          id: student.id,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('Ya votó');
    }

    const vote = this.votesRepository.create({
      student,
      option,
    });

    return this.votesRepository.save(vote);
  }

  async getResults(): Promise<Array<{ option: string; total: string }>> {
    return this.votesRepository
      .createQueryBuilder('vote')
      .select('vote.option', 'option')
      .addSelect('COUNT(*)', 'total')
      .groupBy('vote.option')
      .orderBy('total', 'DESC')
      .getRawMany();
  }

  async getStats() {
    const totalStudents = await this.studentsRepository.count({
      where: { enabled: true },
    });

    const totalVotes = await this.votesRepository.count();

    const participation =
      totalStudents === 0
        ? 0
        : Number(((totalVotes / totalStudents) * 100).toFixed(2));

    return {
      totalStudents,
      totalVotes,
      participation,
    };
  }
}
