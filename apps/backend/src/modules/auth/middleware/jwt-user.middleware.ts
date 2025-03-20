import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class JwtUserMiddleware implements NestMiddleware {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    console.log(
      "JWT Secret available:",
      !!this.configService.get<string>("JWT_SECRET"),
    ); // Debug log

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);

      try {
        const jwtSecret =
          this.configService.get<string>("JWT_SECRET") ||
          "temporary-secret-for-testing";

        const decoded = this.jwtService.verify(token, {
          secret: jwtSecret,
        });

        // Add user to request object
        req["user"] = decoded;
      } catch (error) {
        console.error("JWT verification error:", error);
        // Token verification failed, but we'll continue
        // Auth guard will handle unauthorized access
      }
    }

    next();
  }
}
