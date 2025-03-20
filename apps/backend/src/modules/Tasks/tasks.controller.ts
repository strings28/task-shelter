import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
} from "@nestjs/common";
import { TasksService } from "./tasks.service";
import { CreateTaskDto } from "./dto/create-task.dto";
import { UpdateTaskDto } from "./dto/update-task.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RequestWithUser } from "../auth/interfaces/request-with-user.interface";

@Controller("tasks")
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  create(@Body() createTaskDto: CreateTaskDto, @Req() req: RequestWithUser) {
    console.log("User from request:", req.user);
    return this.tasksService.create(req.user.id, createTaskDto);
  }

  @Get()
  async findAll(
    @Query("page") page: number = 1,
    @Query("limit") limit: number = 10,
    @Query("deleted") deletedParam: string = "false",
    @Query("sortBy") sortBy: string = "title",
    @Query("sortOrder") sortOrder: string = "asc",
    @Req() req: RequestWithUser,
  ) {
    // Explicitly convert string to boolean
    const deleted = deletedParam === "true";

    const { tasks, totalTasks } = await this.tasksService.findAll(
      req.user.id,
      page,
      limit,
      deleted,
      sortBy,
      sortOrder,
    );
    return {
      tasks,
      totalTasks,
      totalPages: Math.ceil(totalTasks / limit),
    };
  }

  @Get(":id")
  findOne(@Param("id") id: string, @Req() req: RequestWithUser) {
    return this.tasksService.findOne(req.user.id, id);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @Req() req: RequestWithUser,
  ) {
    return this.tasksService.update(req.user.id, id, updateTaskDto);
  }

  @Delete(":id")
  delete(@Param("id") id: string, @Req() req: RequestWithUser) {
    return this.tasksService.deleteToggle(req.user.id, id);
  }
}
