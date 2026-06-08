import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Election {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ default: true })
  isOpen!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  openedAt!: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  closedAt!: Date | null;
}
