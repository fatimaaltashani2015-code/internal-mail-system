import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.message.deleteMany({});
  console.log(`تم حذف ${result.count} رسالة من قاعدة البيانات.`);
  console.log("تم الاحتفاظ بالمستخدمين والأقسام فقط.");
}

main()
  .catch((e) => {
    console.error("حدث خطأ:", e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
