import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { StudentsService } from './students.service';
import { AdminGuard } from '../auth/admin.guard';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get('dni/:dni')
  async findByDni(@Param('dni') dni: string) {
    return this.studentsService.findByDni(dni);
  }

  @UseGuards(AdminGuard)
  @Get()
  async findAll(@Query('search') search?: string) {
    return this.studentsService.findAll(search);
  }

  @UseGuards(AdminGuard)
  @Post()
  async create(@Body() body: CreateStudentDto) {
    return this.studentsService.create(body);
  }

  @UseGuards(AdminGuard)
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateStudentDto,
  ) {
    return this.studentsService.update(id, body);
  }

  @UseGuards(AdminGuard)
  @Patch(':id/toggle-enabled')
  async toggleEnabled(@Param('id', ParseIntPipe) id: number) {
    return this.studentsService.toggleEnabled(id);
  }

  @UseGuards(AdminGuard)
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.studentsService.remove(id);
  }
}
