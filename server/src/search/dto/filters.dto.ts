import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { COMPANY_TYPES } from '../../common/company-types';

export class FiltersDto {
  @IsArray()
  @IsString({ each: true })
  @MaxLength(60, { each: true })
  @ArrayMaxSize(20)
  skills!: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(60)
  minYearsExperience!: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(60)
  maxYearsExperience!: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  location!: string | null;

  @IsArray()
  @IsString({ each: true })
  @IsIn(COMPANY_TYPES, { each: true })
  @ArrayMaxSize(10)
  companyTypes!: string[];
}
