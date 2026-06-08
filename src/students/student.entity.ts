import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Student {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  dni!: string;

  @Column()
  fullName!: string;

  @Column()
  course!: string;

  @Column({ default: true })
  enabled!: boolean;
}
