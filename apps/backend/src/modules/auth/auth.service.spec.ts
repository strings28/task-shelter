import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "./auth.service";
import { PrismaService } from "../../prisma/prisma.service";
import { JwtService } from "@nestjs/jwt";
import { UnauthorizedException } from "@nestjs/common";
import * as bcrypt from "bcrypt";

// Mock bcrypt
jest.mock("bcrypt", () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe("AuthService", () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;

  const mockUser = {
    id: "user-id-1",
    email: "test@example.com",
    firstname: "Test",
    lastname: "User",
    password: "hashed-password",
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("validateUser", () => {
    it("should return user without password if credentials are valid", async () => {
      // Arrange
      const email = "test@example.com";
      const password = "password123";
      const { password: _, ...userWithoutPassword } = mockUser;

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      // Act
      const result = await service.validateUser(email, password);

      // Assert
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(password, mockUser.password);
      expect(result).toEqual(userWithoutPassword);
    });

    it("should return null if user not found", async () => {
      // Arrange
      const email = "nonexistent@example.com";
      const password = "password123";

      mockPrismaService.user.findUnique.mockResolvedValue(null);

      // Act
      const result = await service.validateUser(email, password);

      // Assert
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email },
      });
      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it("should return null if password is invalid", async () => {
      // Arrange
      const email = "test@example.com";
      const password = "wrong-password";

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // Act
      const result = await service.validateUser(email, password);

      // Assert
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(password, mockUser.password);
      expect(result).toBeNull();
    });
  });

  describe("login", () => {
    it("should return access token and user info", async () => {
      // Arrange
      const user = {
        id: "user-id-1",
        email: "test@example.com",
      };
      const token = "jwt-token";

      mockJwtService.sign.mockReturnValue(token);

      // Act
      const result = await service.login(user);

      // Assert
      expect(jwtService.sign).toHaveBeenCalledWith({
        id: user.id,
        email: user.email,
      });
      expect(result).toEqual({
        access_token: token,
        user: {
          id: user.id,
          email: user.email,
        },
      });
    });
  });

  describe("register", () => {
    it("should create a new user and return user without password", async () => {
      // Arrange
      const email = "new@example.com";
      const password = "password123";
      const hashedPassword = "hashed-new-password";
      const newUser = {
        ...mockUser,
        email,
        password: hashedPassword,
      };
      const { password: _, ...userWithoutPassword } = newUser;

      mockPrismaService.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockPrismaService.user.create.mockResolvedValue(newUser);

      // Act
      const result = await service.register(email, password);

      // Assert
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: {
          email,
          password: hashedPassword,
          firstname: "",
          lastname: "",
        },
      });
      expect(result).toEqual(userWithoutPassword);
    });

    it("should throw UnauthorizedException if user already exists", async () => {
      // Arrange
      const email = "existing@example.com";
      const password = "password123";

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      // Act & Assert
      await expect(service.register(email, password)).rejects.toThrow(
        new UnauthorizedException("User already exists"),
      );
      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(mockPrismaService.user.create).not.toHaveBeenCalled();
    });
  });
});
