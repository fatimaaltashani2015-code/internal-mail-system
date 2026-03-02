import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const msgCount = await prisma.message.deleteMany({});
  console.log(`تم حذف ${msgCount.count} رسالة.`);

  const refCount = await prisma.referential.deleteMany({});
  console.log(`تم حذف ${refCount.count} إشاري.`);

  const settingCount = await prisma.systemSetting.deleteMany({});
  console.log(`تم حذف ${settingCount.count} إعداد.`);

  const userCount = await prisma.user.deleteMany({
    where: { role: { not: "admin" } },
  });
  console.log(`تم حذف ${userCount.count} مستخدم (تم الاحتفاظ بمدير النظام فقط).`);

  console.log("");
  console.log("تم مسح جميع البيانات بنجاح. مدير النظام محفوظ.");
}

main()
  .catch((e) => {
    console.error("حدث خطأ:", e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
