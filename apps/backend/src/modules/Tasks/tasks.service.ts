import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateTaskDto } from "./dto/create-task.dto";
import { UpdateTaskDto } from "./dto/update-task.dto";
import { Task } from "@prisma/client";

@Injectable()
export class TasksService {
  constructor(readonly prisma: PrismaService) {}

  async create(userId: string, createTaskDto: CreateTaskDto) {
    console.log("Received DTO:", JSON.stringify(createTaskDto));
    const { userId: _, ...taskData } = createTaskDto;

    // load up the user so we can connect it to the task
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return this.prisma.task.create({
      data: {
        ...taskData,
        dueDate: createTaskDto.dueDate ? new Date(createTaskDto.dueDate) : null,
        deletedAt: null,
        user: {
          connect: { id: userId },
        },
      },
    });
  }

  async findAll(
    userId: string,
    page: number = 1,
    limit: number = 10,
    deleted: boolean = false,
    sortBy: string = "createdAt",
    sortOrder: string = "desc",
  ): Promise<{ tasks: Task[]; totalTasks: number }> {
    console.log("Finding tasks with deleted =", deleted, typeof deleted);

    const tasks = await this.prisma.task.findMany({
      where: {
        userId: userId,
        ...(deleted ? { deletedAt: { not: null } } : { deletedAt: null }),
      },
      skip: (page - 1) * limit,
      take: Number(limit),
      include: {
        taskHistory: true,
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
    });

    console.log("Found tasks:", tasks.length);
    const totalTasks = await this.prisma.task.count({
      where: {
        userId: userId,
        ...(deleted ? { deletedAt: { not: null } } : { deletedAt: null }),
      },
    });
    return { tasks, totalTasks };
  }

  async findOne(userid: string, id: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        taskHistory: true,
      },
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    return task;
  }

  async update(userid: string, id: string, updateTaskDto: UpdateTaskDto) {
    const oldTask = await this.findOne(userid, id); // Check if exists
    if (!oldTask) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    console.log("Received DTO:", JSON.stringify(updateTaskDto));

    // TODO: implement non-repudiation
    await this.prisma.taskHistory.create({
      data: {
        task: {
          connect: { id },
        },
        user: {
          connect: { id: userid },
        },
        title: oldTask.title,
        description: oldTask.description,
        dueDate: oldTask.dueDate,
        status: oldTask.status,
        createdAt: new Date(),
        deletedAt: oldTask.deletedAt,
      },
    });

    const newTask = await this.prisma.task.update({
      where: { id },
      data: {
        ...updateTaskDto,
        dueDate: updateTaskDto.dueDate
          ? new Date(updateTaskDto.dueDate)
          : undefined,
        deletedAt: updateTaskDto.deletedAt ? new Date() : undefined,
      },
    });

    return newTask;
  }

  async deleteToggle(userid: string, id: string) {
    const task = await this.findOne(userid, id);
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    const newTask = await this.prisma.task.update({
      where: { id },
      data: { deletedAt: task.deletedAt ? null : new Date() },
    });

    return newTask;
  }
}
