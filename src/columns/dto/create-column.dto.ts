import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateColumnDto {
  @IsUUID()
  boardId: string;

  @IsString()
  @IsNotEmpty({ message: 'Title is required' })
  @MaxLength(50, { message: 'Title must not exceed 50 characters' })
  title: string;
}