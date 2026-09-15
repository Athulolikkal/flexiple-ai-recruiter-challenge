import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SearchRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  query!: string;
}
