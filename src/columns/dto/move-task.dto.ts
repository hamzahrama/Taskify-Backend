import { IsInt, IsUUID, Min } from 'class-validator';

export class MoveTaskDto {
  @IsUUID()
  targetColumnId: string;

  @IsInt()
  @Min(0)
  newOrder: number;
}