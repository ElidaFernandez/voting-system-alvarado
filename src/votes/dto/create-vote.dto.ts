import { IsIn, IsString } from 'class-validator';

export class CreateVoteDto {
  @IsString()
  dni: string;

  @IsString()
  @IsIn([
    'Lista N°2 Gonzalez, Nahuel (presidente)',
    'Lista N°10 Martinez, Guadalupe (presidente)',
  ])
  option: string;
}
