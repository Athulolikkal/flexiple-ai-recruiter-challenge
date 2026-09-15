import { Module } from '@nestjs/common';
import { CandidatesModule } from '../candidates/candidates.module';
import { LlmModule } from '../llm/llm.module';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

@Module({
  imports: [CandidatesModule, LlmModule],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
