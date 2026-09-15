import { Body, Controller, Post } from '@nestjs/common';
import { RefineRequestDto } from './dto/refine-request.dto';
import { ScoreRequestDto } from './dto/score-request.dto';
import { SearchRequestDto } from './dto/search-request.dto';
import { SearchService } from './search.service';
import { RefineResponse, SearchResponse } from '../types/search.types';

@Controller('api/search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Post()
  search(@Body() dto: SearchRequestDto): Promise<SearchResponse> {
    return this.searchService.search(dto.query);
  }

  @Post('score')
  rerun(@Body() dto: ScoreRequestDto): Promise<SearchResponse> {
    return this.searchService.rerun(dto.query, dto.filters, dto.rubric);
  }

  @Post('refine')
  refine(@Body() dto: RefineRequestDto): Promise<RefineResponse> {
    return this.searchService.refine(
      dto.query,
      dto.filters,
      dto.rubric,
      dto.candidateIds,
      dto.feedback,
    );
  }
}
