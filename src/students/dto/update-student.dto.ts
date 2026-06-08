import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateStudentDto {
  @IsOptional()
  @IsString()
  dni?: string;

  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  course?: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
