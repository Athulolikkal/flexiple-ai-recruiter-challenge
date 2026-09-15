import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { FiltersDto } from './filters.dto';

export class RefineRequestDto {
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

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  candidateIds!: string[];

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  feedback!: string;
}
