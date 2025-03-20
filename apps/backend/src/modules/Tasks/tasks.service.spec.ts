import { Test, TestingModule } from "@nestjs/testing";
import { TasksService } from "./tasks.service";
import { PrismaService } from "../../prisma/prisma.service";
import { NotFoundException } from "@nestjs/common";
import { TaskStatus } from "@prisma/client";
import { CreateTaskDto } from "./dto/create-task.dto";
import { UpdateTaskDto } from "./dto/update-task.dto";

// Mock data
const mockUser = {
  id: "user-id-1",
  email: "test@example.com",
  firstname: "Test",
  lastname: "User",
  password: "hashed-password",
};

const mockTask = {
  id: "task-id-1",
  title: "Test Task",
  description: "Test Description",
  status: TaskStatus.TODO,
  dueDate: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  userId: mockUser.id,
};

const mockTaskHistory = {
  id: "history-id-1",
  taskId: mockTask.id,
  userId: mockUser.id,
  title: "Old Title",
  description: "Old Description",
  status: TaskStatus.TODO,
  dueDate: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

const mockTaskWithHistory = {
  ...mockTask,
  taskHistory: [mockTaskHistory],
};

// Mock PrismaService
const mockPrismaService = {
  task: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  taskHistory: {
    create: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
};

describe("TasksService", () => {
  let service: TasksService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    prisma = module.get<PrismaService>(PrismaService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    it("should create a new task", async () => {
      // Arrange
      const userId = mockUser.id;
      const createTaskDto: CreateTaskDto = {
        title: "New Task",
        description: "New Description",
        status: TaskStatus.TODO,
        dueDate: new Date().toISOString(),
        userId: userId,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.task.create.mockResolvedValue({
        ...mockTask,
        title: createTaskDto.title,
        description: createTaskDto.description,
      });

      // Act
      const result = await service.create(userId, createTaskDto);

      // Assert
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(mockPrismaService.task.create).toHaveBeenCalledWith({
        data: {
          title: createTaskDto.title,
          description: createTaskDto.description,
          status: createTaskDto.status,
          dueDate: expect.any(Date),
          deletedAt: null,
          user: {
            connect: { id: userId },
          },
        },
      });
      expect(result).toEqual({
        ...mockTask,
        title: createTaskDto.title,
        description: createTaskDto.description,
      });
    });

    it("should throw NotFoundException if user not found", async () => {
      // Arrange
      const userId = "non-existent-user";
      const createTaskDto: CreateTaskDto = {
        title: "New Task",
        description: "New Description",
        status: TaskStatus.TODO,
        dueDate: new Date().toISOString(),
        userId: userId,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.create(userId, createTaskDto)).rejects.toThrow(
        new NotFoundException(`User with ID ${userId} not found`),
      );
      expect(mockPrismaService.task.create).not.toHaveBeenCalled();
    });
  });

  describe("findAll", () => {
    it("should return all non-deleted tasks for a user", async () => {
      // Arrange
      const userId = mockUser.id;
      const page = 1;
      const limit = 10;
      const deleted = false;
      const sortBy = "createdAt";
      const sortOrder = "desc";

      const mockTasks = [mockTask, { ...mockTask, id: "task-id-2" }];
      const totalTasks = mockTasks.length;

      mockPrismaService.task.findMany.mockResolvedValue(mockTasks);
      mockPrismaService.task.count.mockResolvedValue(totalTasks);

      // Act
      const result = await service.findAll(
        userId,
        page,
        limit,
        deleted,
        sortBy,
        sortOrder,
      );

      // Assert
      expect(mockPrismaService.task.findMany).toHaveBeenCalledWith({
        where: {
          userId: userId,
          deletedAt: null,
        },
        skip: 0, // (page - 1) * limit
        take: 10,
        include: {
          taskHistory: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
      expect(mockPrismaService.task.count).toHaveBeenCalledWith({
        where: {
          userId: userId,
          deletedAt: null,
        },
      });
      expect(result).toEqual({
        tasks: mockTasks,
        totalTasks,
      });
    });

    it("should return deleted tasks when deleted flag is true", async () => {
      // Arrange
      const userId = mockUser.id;
      const page = 1;
      const limit = 10;
      const deleted = true;
      const sortBy = "createdAt";
      const sortOrder = "desc";

      const mockDeletedTasks = [
        { ...mockTask, id: "task-id-3", deletedAt: new Date() },
      ];
      const totalTasks = mockDeletedTasks.length;

      mockPrismaService.task.findMany.mockResolvedValue(mockDeletedTasks);
      mockPrismaService.task.count.mockResolvedValue(totalTasks);

      // Act
      const result = await service.findAll(
        userId,
        page,
        limit,
        deleted,
        sortBy,
        sortOrder,
      );

      // Assert
      expect(mockPrismaService.task.findMany).toHaveBeenCalledWith({
        where: {
          userId: userId,
          deletedAt: { not: null },
        },
        skip: 0,
        take: 10,
        include: {
          taskHistory: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
      expect(result).toEqual({
        tasks: mockDeletedTasks,
        totalTasks,
      });
    });
  });

  describe("findOne", () => {
    it("should return a task by id", async () => {
      // Arrange
      const userId = mockUser.id;
      const taskId = mockTask.id;

      mockPrismaService.task.findUnique.mockResolvedValue(mockTaskWithHistory);

      // Act
      const result = await service.findOne(userId, taskId);

      // Assert
      expect(mockPrismaService.task.findUnique).toHaveBeenCalledWith({
        where: { id: taskId },
        include: {
          taskHistory: true,
        },
      });
      expect(result).toEqual(mockTaskWithHistory);
    });

    it("should throw NotFoundException if task not found", async () => {
      // Arrange
      const userId = mockUser.id;
      const taskId = "non-existent-task";

      mockPrismaService.task.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne(userId, taskId)).rejects.toThrow(
        new NotFoundException(`Task with ID ${taskId} not found`),
      );
    });
  });

  describe("update", () => {
    it("should update a task", async () => {
      // Arrange
      const userId = mockUser.id;
      const taskId = mockTask.id;
      const updateTaskDto: UpdateTaskDto = {
        title: "Updated Title",
        status: TaskStatus.IN_PROGRESS,
      };

      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);
      mockPrismaService.taskHistory.create.mockResolvedValue(mockTaskHistory);
      mockPrismaService.task.update.mockResolvedValue({
        ...mockTask,
        ...updateTaskDto,
      });

      // Act
      const result = await service.update(userId, taskId, updateTaskDto);

      // Assert
      expect(mockPrismaService.task.findUnique).toHaveBeenCalledWith({
        where: { id: taskId },
        include: {
          taskHistory: true,
        },
      });
      expect(mockPrismaService.taskHistory.create).toHaveBeenCalledWith({
        data: {
          task: {
            connect: { id: taskId },
          },
          user: {
            connect: { id: userId },
          },
          title: mockTask.title,
          description: mockTask.description,
          dueDate: mockTask.dueDate,
          status: mockTask.status,
          createdAt: expect.any(Date),
          deletedAt: mockTask.deletedAt,
        },
      });
      expect(mockPrismaService.task.update).toHaveBeenCalledWith({
        where: { id: taskId },
        data: updateTaskDto,
      });
      expect(result).toEqual({
        ...mockTask,
        ...updateTaskDto,
      });
    });

    it("should throw NotFoundException if task not found", async () => {
      // Arrange
      const userId = mockUser.id;
      const taskId = "non-existent-task";
      const updateTaskDto: UpdateTaskDto = {
        title: "Updated Title",
      };

      mockPrismaService.task.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.update(userId, taskId, updateTaskDto),
      ).rejects.toThrow(
        new NotFoundException(`Task with ID ${taskId} not found`),
      );
      expect(mockPrismaService.taskHistory.create).not.toHaveBeenCalled();
      expect(mockPrismaService.task.update).not.toHaveBeenCalled();
    });
  });

  describe("deleteToggle", () => {
    it("should soft delete a task that is not deleted", async () => {
      // Arrange
      const userId = mockUser.id;
      const taskId = mockTask.id;
      const now = new Date();

      mockPrismaService.task.findUnique.mockResolvedValue(mockTask); // Not deleted
      mockPrismaService.task.update.mockResolvedValue({
        ...mockTask,
        deletedAt: now,
      });

      // Act
      const result = await service.deleteToggle(userId, taskId);

      // Assert
      expect(mockPrismaService.task.findUnique).toHaveBeenCalledWith({
        where: { id: taskId },
        include: {
          taskHistory: true,
        },
      });
      expect(mockPrismaService.task.update).toHaveBeenCalledWith({
        where: { id: taskId },
        data: { deletedAt: expect.any(Date) },
      });
      expect(result.deletedAt).toBeTruthy();
    });

    it("should restore a deleted task", async () => {
      // Arrange
      const userId = mockUser.id;
      const taskId = mockTask.id;
      const deletedTask = { ...mockTask, deletedAt: new Date() };

      mockPrismaService.task.findUnique.mockResolvedValue(deletedTask);
      mockPrismaService.task.update.mockResolvedValue({
        ...deletedTask,
        deletedAt: null,
      });

      // Act
      const result = await service.deleteToggle(userId, taskId);

      // Assert
      expect(mockPrismaService.task.update).toHaveBeenCalledWith({
        where: { id: taskId },
        data: { deletedAt: null },
      });
      expect(result.deletedAt).toBeNull();
    });

    it("should throw NotFoundException if task not found", async () => {
      // Arrange
      const userId = mockUser.id;
      const taskId = "non-existent-task";

      mockPrismaService.task.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.deleteToggle(userId, taskId)).rejects.toThrow(
        new NotFoundException(`Task with ID ${taskId} not found`),
      );
      expect(mockPrismaService.task.update).not.toHaveBeenCalled();
    });
  });
});
