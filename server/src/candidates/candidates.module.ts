import { Module } from '@nestjs/common';
import { CandidatesService } from './candidates.service';

@Module({
  providers: [CandidatesService],
  exports: [CandidatesService],
})
export class CandidatesModule {}
