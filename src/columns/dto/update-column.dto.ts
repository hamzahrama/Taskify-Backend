import { PartialType } from '@nestjs/mapped-types';
import { CreateColumnDto } from './create-column.dto.js';

export class UpdateColumnDto extends PartialType(CreateColumnDto) {}
