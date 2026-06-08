import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Student } from './student.entity';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student)
    private readonly studentsRepository: Repository<Student>,
  ) {}

  async findByDni(dni: string): Promise<Student> {
    const student = await this.studentsRepository.findOne({
      where: { dni },
    });

    if (!student) {
      throw new NotFoundException('Alumno no encontrado');
    }

    return student;
  }

  async findAll(search?: string): Promise<Student[]> {
    const term = search?.trim();

    if (!term) {
      return [];
    }

    return this.studentsRepository.find({
      where: [
        { dni: ILike(`%${term}%`) },
        { fullName: ILike(`%${term}%`) },
        { course: ILike(`%${term}%`) },
      ],
      order: {
        fullName: 'ASC',
      },
    });
  }

  async create(createStudentDto: CreateStudentDto): Promise<Student> {
    const existing = await this.studentsRepository.findOne({
      where: { dni: createStudentDto.dni },
    });

    if (existing) {
      throw new ConflictException('Ya existe un alumno con ese DNI');
    }

    const student = this.studentsRepository.create({
      dni: createStudentDto.dni.trim(),
      fullName: createStudentDto.fullName.trim(),
      course: createStudentDto.course.trim(),
      enabled:
        typeof createStudentDto.enabled === 'boolean'
          ? createStudentDto.enabled
          : true,
    });

    return this.studentsRepository.save(student);
  }

  async update(
    id: number,
    updateStudentDto: UpdateStudentDto,
  ): Promise<Student> {
    const student = await this.studentsRepository.findOne({
      where: { id },
    });

    if (!student) {
      throw new NotFoundException('Alumno no encontrado');
    }

    if (updateStudentDto.dni && updateStudentDto.dni !== student.dni) {
      const existing = await this.studentsRepository.findOne({
        where: { dni: updateStudentDto.dni },
      });

      if (existing && existing.id !== id) {
        throw new ConflictException('Ya existe un alumno con ese DNI');
      }
    }

    if (typeof updateStudentDto.dni === 'string') {
      student.dni = updateStudentDto.dni.trim();
    }

    if (typeof updateStudentDto.fullName === 'string') {
      student.fullName = updateStudentDto.fullName.trim();
    }

    if (typeof updateStudentDto.course === 'string') {
      student.course = updateStudentDto.course.trim();
    }

    if (typeof updateStudentDto.enabled === 'boolean') {
      student.enabled = updateStudentDto.enabled;
    }

    return this.studentsRepository.save(student);
  }

  async toggleEnabled(id: number): Promise<Student> {
    const student = await this.studentsRepository.findOne({
      where: { id },
    });

    if (!student) {
      throw new NotFoundException('Alumno no encontrado');
    }

    student.enabled = !student.enabled;

    return this.studentsRepository.save(student);
  }

  async remove(id: number): Promise<{ message: string }> {
    const student = await this.studentsRepository.findOne({
      where: { id },
    });

    if (!student) {
      throw new NotFoundException('Alumno no encontrado');
    }

    if (!student.enabled) {
      return {
        message: 'El alumno ya se encuentra dado de baja',
      };
    }

    student.enabled = false;
    await this.studentsRepository.save(student);

    return {
      message: 'Alumno dado de baja correctamente',
    };
  }
}
