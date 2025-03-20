import { PrismaClient, TaskStatus } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.taskHistory.deleteMany();
  await prisma.task.deleteMany();
  await prisma.user.deleteMany();

  // Create a user
  const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);

  const user = await prisma.user.create({
    data: {
      email: process.env.ADMIN_EMAIL,
      password: hashedPassword,
      firstname: "Test",
      lastname: "User",
    },
  });

  console.log(`Created user: ${user.email}`);

  // Create 20 tasks for the user
  const tasks = [];

  for (let i = 1; i <= 20; i++) {
    // Distribute tasks across different statuses
    let status: TaskStatus = TaskStatus.TODO;
    if (i > 15) {
      status = TaskStatus.DONE;
    } else if (i > 10) {
      status = TaskStatus.IN_PROGRESS;
    }

    // Create due dates ranging from past to future
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (i - 10)); // Some past, some future

    const task = await prisma.task.create({
      data: {
        title: `Task ${i}`,
        description: `This is the description for task ${i}`,
        status,
        dueDate,
        userId: user.id,
      },
    });

    tasks.push(task);
    console.log(`Created task: ${task.title}`);
  }

  console.log(`Seeding completed successfully!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
