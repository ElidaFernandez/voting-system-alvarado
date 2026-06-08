import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateStudentDto {
  @IsString()
  dni: string;

  @IsString()
  fullName: string;

  @IsString()
  course: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
