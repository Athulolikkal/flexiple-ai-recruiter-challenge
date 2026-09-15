import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength, ValidateNested } from 'class-validator';
import { FiltersDto } from './filters.dto';

/**
 * Used when the recruiter directly edits filters/rubric in the UI (not via
 * feedback) and wants to re-run local filtering + scoring against their edit,
 * without routing it through the feedback-interpretation LLM call.
 */
export class ScoreRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  query!: string;

  @ValidateNested()
  @Type(() => FiltersDto)
  filters!: FiltersDto;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  rubric!: string;
}
