import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("admin123", 10);

  // البحث عن مدير النظام بالرقم 0001 أو admin
  let admin = await prisma.user.findFirst({
    where: {
      OR: [
        { employeeId: "0001" },
        { employeeId: "admin" },
      ],
      role: "admin",
    },
  });

  if (admin) {
    await prisma.user.update({
      where: { id: admin.id },
      data: {
        employeeId: "0001",
        password: hashedPassword,
        name: "مدير النظام",
      },
    });
    console.log("تم تحديث كلمة مرور مدير النظام بنجاح!");
  } else {
    // إنشاء مدير النظام إن لم يكن موجوداً
    await prisma.user.create({
      data: {
        employeeId: "0001",
        name: "مدير النظام",
        password: hashedPassword,
        role: "admin",
      },
    });
    console.log("تم إنشاء مدير النظام بنجاح!");
  }

  console.log("");
  console.log("بيانات الدخول:");
  console.log("  الرقم الوظيفي: 0001");
  console.log("  كلمة المرور: admin123");
  console.log("");
}

main()
  .catch((e) => {
    console.error("حدث خطأ:", e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
