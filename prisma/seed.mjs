import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

try {
  const existing = await db.project.findFirst({ where: { name: "Sample Quran Project" } });

  if (!existing) {
    await db.project.create({
      data: {
        name: "Sample Quran Project",
        status: "DRAFT",
      },
    });
    console.log("Created sample project.");
  } else {
    console.log("Sample project already exists.");
  }
} finally {
  await db.$disconnect();
}
