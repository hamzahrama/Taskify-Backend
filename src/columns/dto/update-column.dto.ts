import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UpdateColumnDto {
  @IsString()
  @IsNotEmpty({ message: 'Title is required' })
  @MaxLength(50, { message: 'Title must not exceed 50 characters' })
  title: string;
}