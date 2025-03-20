import { TaskStatus } from "./taskstatus";
export type Task = {
  id: string | null;
  title: string;
  description?: string;
  status: TaskStatus;
  createdAt: Date;
  updatedAt: Date;
  dueDate: Date;
  deletedAt: Date | null;
  taskHistory?: Task[];
};
