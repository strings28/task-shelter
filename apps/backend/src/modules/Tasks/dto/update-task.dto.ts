import {
  IsOptional,
  IsString,
  IsEnum,
  IsDateString,
  IsBoolean,
} from "class-validator";
import { TaskStatus } from "@prisma/client";

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsBoolean()
  deletedAt?: string;
}
