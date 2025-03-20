import { Request } from "express";

export type RequestWithUser = Request & {
  user: {
    id: string;
    email: string;
    firstname: string;
    lastname: string;
    // no password, that's a bad, bad idea
  };
};
