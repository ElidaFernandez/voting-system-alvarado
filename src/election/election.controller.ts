import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ElectionService } from './election.service';
import { AdminGuard } from '../auth/admin.guard';

@Controller('election')
export class ElectionController {
  constructor(private readonly electionService: ElectionService) {}

  @Get()
  getElection() {
    return this.electionService.getElection();
  }

  @UseGuards(AdminGuard)
  @Post('open')
  openElection() {
    return this.electionService.openElection();
  }

  @UseGuards(AdminGuard)
  @Post('close')
  closeElection() {
    return this.electionService.closeElection();
  }

  @UseGuards(AdminGuard)
  @Post('reset')
  resetElection() {
    return this.electionService.resetElection();
  }
}
