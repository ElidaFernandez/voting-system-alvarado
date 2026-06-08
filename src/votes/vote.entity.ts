import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import { Student } from '../students/student.entity';

@Entity()
@Unique(['student'])
export class Vote {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Student, { eager: true })
  student!: Student;

  @Column()
  option!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
