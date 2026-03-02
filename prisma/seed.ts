import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

// صورة PNG صغيرة للاستخدام كمرفق تجريبي (1x1 بكسل شفاف)
const MINIMAL_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64"
);

function ensureUploadsDir() {
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  return uploadsDir;
}

function createAttachmentFile(filename: string, content?: Buffer): string {
  const uploadsDir = ensureUploadsDir();
  const filePath = path.join(uploadsDir, filename);
  fs.writeFileSync(filePath, content || MINIMAL_PNG);
  return `/uploads/${filename}`;
}

async function main() {
  const hashedPassword = await bcrypt.hash("admin123", 10);

  // الإدارات
  let defaultAdmin = await prisma.administration.findFirst({ where: { name: "الإدارة العامة" } });
  if (!defaultAdmin) {
    defaultAdmin = await prisma.administration.create({
      data: { name: "الإدارة العامة", note: "إدارة افتراضية" },
    });
  }

  // الأقسام (مرتبطة بالإدارة)
  let mailDept = await prisma.department.findFirst({ where: { name: "قسم البريد" } });
  if (!mailDept) {
    mailDept = await prisma.department.create({
      data: { name: "قسم البريد", administrationId: defaultAdmin.id },
    });
  }

  let itDept = await prisma.department.findFirst({ where: { name: "قسم تقنية المعلومات" } });
  if (!itDept) {
    itDept = await prisma.department.create({
      data: { name: "قسم تقنية المعلومات", administrationId: defaultAdmin.id },
    });
  }

  let hrDept = await prisma.department.findFirst({ where: { name: "قسم الموارد البشرية" } });
  if (!hrDept) {
    hrDept = await prisma.department.create({
      data: { name: "قسم الموارد البشرية", administrationId: defaultAdmin.id },
    });
  }

  // المستخدمون
  const oldAdmin = await prisma.user.findUnique({ where: { employeeId: "admin" } });
  if (oldAdmin) {
    await prisma.user.update({
      where: { id: oldAdmin.id },
      data: { employeeId: "0001" },
    });
  } else {
    const adminUser = await prisma.user.findUnique({ where: { employeeId: "0001" } });
    if (!adminUser) {
      await prisma.user.create({
        data: {
          employeeId: "0001",
          name: "مدير النظام",
          password: hashedPassword,
          role: "admin",
        },
      });
    }
  }

  const mailUser = await prisma.user.findUnique({ where: { employeeId: "1001" } });
  if (!mailUser) {
    await prisma.user.create({
      data: {
        employeeId: "1001",
        name: "موظف قسم البريد",
        password: hashedPassword,
        departmentId: mailDept.id,
        role: "mail_dept",
      },
    });
  }

  const itUser = await prisma.user.findUnique({ where: { employeeId: "2001" } });
  if (!itUser) {
    await prisma.user.create({
      data: {
        employeeId: "2001",
        name: "موظف قسم تقنية المعلومات",
        password: hashedPassword,
        departmentId: itDept.id,
        role: "other_dept",
      },
    });
  }

  const hrUser = await prisma.user.findUnique({ where: { employeeId: "2002" } });
  if (!hrUser) {
    await prisma.user.create({
      data: {
        employeeId: "2002",
        name: "موظف قسم الموارد البشرية",
        password: hashedPassword,
        departmentId: hrDept.id,
        role: "other_dept",
      },
    });
  }

  // إنشاء الملفات المرفقة التجريبية
  ensureUploadsDir();
  createAttachmentFile("MSG-00001.png");
  createAttachmentFile("MSG-00002.pdf", Buffer.from("%PDF-1.0\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF", "utf-8"));
  createAttachmentFile("MSG-00003.png");
  createAttachmentFile("MSG-00004.jpg", MINIMAL_PNG);
  createAttachmentFile("MSG-00005.png");
  createAttachmentFile("MSG-00006.pdf", Buffer.from("%PDF-1.0\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF", "utf-8"));
  createAttachmentFile("MSG-00007.png");
  createAttachmentFile("MSG-00008.png");
  createAttachmentFile("MSG-00009.png");
  createAttachmentFile("MSG-00010.pdf", Buffer.from("%PDF-1.0\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF", "utf-8"));
  createAttachmentFile("MSG-00011.png");
  createAttachmentFile("MSG-00012.jpg", MINIMAL_PNG);
  createAttachmentFile("MSG-00013.png");
  createAttachmentFile("MSG-00014.pdf", Buffer.from("%PDF-1.0\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF", "utf-8"));
  createAttachmentFile("MSG-00015.png");
  createAttachmentFile("MSG-00016.png");
  createAttachmentFile("MSG-00017.jpg", MINIMAL_PNG);
  createAttachmentFile("MSG-00018.png");
  createAttachmentFile("MSG-00019.pdf", Buffer.from("%PDF-1.0\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF", "utf-8"));
  createAttachmentFile("MSG-00020.png");

  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const fiveDaysAgo = new Date(now);
  fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
  const fourDaysAgo = new Date(now);
  fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);
  const threeDaysAgo = new Date(now);
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  const twoDaysAgo = new Date(now);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  const sampleMessages = [
    // رسائل لم يتم الاطلاع عليها (بعضها قديم للإشارة الحمراء)
    {
      referenceNumber: "MSG-00001",
      senderName: "إدارة الفرع الرئيسي",
      messageDate: fiveDaysAgo,
      subject: "طلب تجديد العقد",
      entryDate: fiveDaysAgo,
      departmentId: itDept.id,
      messageType: "urgent",
      responseType: "for_reply",
      attachmentPath: "/uploads/MSG-00001.png",
      status: "unread",
      replyReference: null,
      replyText: null,
    },
    {
      referenceNumber: "MSG-00002",
      senderName: "فرع الشمال",
      messageDate: fourDaysAgo,
      subject: "متابعة طلب صرف المواد",
      entryDate: fourDaysAgo,
      departmentId: hrDept.id,
      messageType: "normal",
      responseType: "for_action",
      attachmentPath: "/uploads/MSG-00002.pdf",
      status: "unread",
      replyReference: null,
      replyText: null,
    },
    {
      referenceNumber: "MSG-00003",
      senderName: "إدارة المركز",
      messageDate: yesterday,
      subject: "تصحيح بيانات الموظف",
      entryDate: yesterday,
      departmentId: hrDept.id,
      messageType: "normal",
      responseType: "for_info",
      attachmentPath: "/uploads/MSG-00003.png",
      status: "unread",
      replyReference: null,
      replyText: null,
    },
    // رسائل تم الاطلاع عليها ولم يتم الرد
    {
      referenceNumber: "MSG-00004",
      senderName: "فرع الجنوب",
      messageDate: fiveDaysAgo,
      subject: "طلب نقل موظف",
      entryDate: fiveDaysAgo,
      departmentId: hrDept.id,
      messageType: "urgent",
      responseType: "for_reply",
      attachmentPath: "/uploads/MSG-00004.jpg",
      status: "read_not_replied",
      replyReference: null,
      replyText: null,
    },
    {
      referenceNumber: "MSG-00005",
      senderName: "إدارة المالية",
      messageDate: twoDaysAgo,
      subject: "تحديث أنظمة الحاسوب",
      entryDate: twoDaysAgo,
      departmentId: itDept.id,
      messageType: "normal",
      responseType: "for_action",
      attachmentPath: "/uploads/MSG-00005.png",
      status: "read_not_replied",
      replyReference: null,
      replyText: null,
    },
    // رسائل تم الرد عليها
    {
      referenceNumber: "MSG-00006",
      senderName: "إدارة الفرع الشرقي",
      messageDate: fiveDaysAgo,
      subject: "طلب إجازة استثنائية",
      entryDate: fiveDaysAgo,
      departmentId: hrDept.id,
      messageType: "normal",
      responseType: "for_reply",
      attachmentPath: "/uploads/MSG-00006.pdf",
      status: "replied",
      replyReference: "MSG-R-001",
      replyText: "تم الموافقة على الطلب وفقاً للائحة الموارد البشرية.",
    },
    {
      referenceNumber: "MSG-00007",
      senderName: "فرع الغرب",
      messageDate: fourDaysAgo,
      subject: "دعم فني لأنظمة الشبكة",
      entryDate: fourDaysAgo,
      departmentId: itDept.id,
      messageType: "urgent",
      responseType: "for_action",
      attachmentPath: "/uploads/MSG-00007.png",
      status: "replied",
      replyReference: "MSG-R-002",
      replyText: "تم إرسال فريق الدعم الفني. سيتم معالجة الطلب خلال 24 ساعة.",
    },
    {
      referenceNumber: "MSG-00008",
      senderName: "إدارة الشؤون الإدارية",
      messageDate: yesterday,
      subject: "إشعار تغيير مواعيد الدوام",
      entryDate: yesterday,
      departmentId: mailDept.id,
      messageType: "normal",
      responseType: "for_info",
      attachmentPath: "/uploads/MSG-00008.png",
      status: "replied",
      replyReference: null,
      replyText: "تم الاطلاع على الإشعار وإبلاغ جميع الأقسام.",
    },
    // رسائل إضافية (9-20)
    {
      referenceNumber: "MSG-00009",
      senderName: "فرع الوسط",
      messageDate: sevenDaysAgo,
      subject: "طلب توريد أجهزة حاسوب",
      entryDate: sevenDaysAgo,
      departmentId: itDept.id,
      messageType: "urgent",
      responseType: "for_action",
      attachmentPath: "/uploads/MSG-00009.png",
      status: "unread",
      replyReference: null,
      replyText: null,
    },
    {
      referenceNumber: "MSG-00010",
      senderName: "إدارة المشتريات",
      messageDate: threeDaysAgo,
      subject: "عرض أسعار للمعدات المكتبية",
      entryDate: threeDaysAgo,
      departmentId: hrDept.id,
      messageType: "normal",
      responseType: "for_reply",
      attachmentPath: "/uploads/MSG-00010.pdf",
      status: "unread",
      replyReference: null,
      replyText: null,
    },
    {
      referenceNumber: "MSG-00011",
      senderName: "فرع الشرقية",
      messageDate: yesterday,
      subject: "استفسار عن نظام البريد الإلكتروني",
      entryDate: yesterday,
      departmentId: itDept.id,
      messageType: "normal",
      responseType: "for_info",
      attachmentPath: "/uploads/MSG-00011.png",
      status: "unread",
      replyReference: null,
      replyText: null,
    },
    {
      referenceNumber: "MSG-00012",
      senderName: "إدارة التدريب",
      messageDate: fourDaysAgo,
      subject: "جدول الدورات التدريبية للربع القادم",
      entryDate: fourDaysAgo,
      departmentId: hrDept.id,
      messageType: "normal",
      responseType: "for_action",
      attachmentPath: "/uploads/MSG-00012.jpg",
      status: "read_not_replied",
      replyReference: null,
      replyText: null,
    },
    {
      referenceNumber: "MSG-00013",
      senderName: "فرع الحدود",
      messageDate: sevenDaysAgo,
      subject: "عطل في خادم البريد",
      entryDate: sevenDaysAgo,
      departmentId: itDept.id,
      messageType: "urgent",
      responseType: "for_reply",
      attachmentPath: "/uploads/MSG-00013.png",
      status: "read_not_replied",
      replyReference: null,
      replyText: null,
    },
    {
      referenceNumber: "MSG-00014",
      senderName: "إدارة الأمن والسلامة",
      messageDate: twoDaysAgo,
      subject: "تقرير التفتيش الدوري",
      entryDate: twoDaysAgo,
      departmentId: mailDept.id,
      messageType: "normal",
      responseType: "for_info",
      attachmentPath: "/uploads/MSG-00014.pdf",
      status: "read_not_replied",
      replyReference: null,
      replyText: null,
    },
    {
      referenceNumber: "MSG-00015",
      senderName: "فرع الساحل",
      messageDate: fiveDaysAgo,
      subject: "طلب ترقية برمجيات النظام",
      entryDate: fiveDaysAgo,
      departmentId: itDept.id,
      messageType: "normal",
      responseType: "for_action",
      attachmentPath: "/uploads/MSG-00015.png",
      status: "replied",
      replyReference: "MSG-R-003",
      replyText: "تم جدولة التحديث خلال أسبوعين. سيتم إبلاغكم بموعد التنفيذ.",
    },
    {
      referenceNumber: "MSG-00016",
      senderName: "إدارة العلاقات العامة",
      messageDate: threeDaysAgo,
      subject: "دعوة لحضور الاحتفال السنوي",
      entryDate: threeDaysAgo,
      departmentId: hrDept.id,
      messageType: "normal",
      responseType: "for_info",
      attachmentPath: "/uploads/MSG-00016.png",
      status: "replied",
      replyReference: null,
      replyText: "تم إبلاغ جميع الموظفين بالموعد والمكان.",
    },
    {
      referenceNumber: "MSG-00017",
      senderName: "فرع الجبل",
      messageDate: sevenDaysAgo,
      subject: "طلب نقل بيانات الأرشيف",
      entryDate: sevenDaysAgo,
      departmentId: mailDept.id,
      messageType: "urgent",
      responseType: "for_reply",
      attachmentPath: "/uploads/MSG-00017.jpg",
      status: "replied",
      replyReference: "MSG-R-004",
      replyText: "تم استلام الطلب. سيتم تنفيذ النقل خلال 5 أيام عمل.",
    },
    {
      referenceNumber: "MSG-00018",
      senderName: "إدارة المتابعة",
      messageDate: yesterday,
      subject: "متابعة قرارات الاجتماع الأخير",
      entryDate: yesterday,
      departmentId: hrDept.id,
      messageType: "normal",
      responseType: "for_action",
      attachmentPath: "/uploads/MSG-00018.png",
      status: "unread",
      replyReference: null,
      replyText: null,
    },
    {
      referenceNumber: "MSG-00019",
      senderName: "فرع الصحراء",
      messageDate: fourDaysAgo,
      subject: "تقرير الأداء الشهري",
      entryDate: fourDaysAgo,
      departmentId: itDept.id,
      messageType: "normal",
      responseType: "for_info",
      attachmentPath: "/uploads/MSG-00019.pdf",
      status: "replied",
      replyReference: null,
      replyText: "تم استلام التقرير ومراجعته. النتائج ضمن المعدل المتوقع.",
    },
    {
      referenceNumber: "MSG-00020",
      senderName: "إدارة التخطيط",
      messageDate: twoDaysAgo,
      subject: "خطة الصيانة الدورية للأجهزة",
      entryDate: twoDaysAgo,
      departmentId: itDept.id,
      messageType: "urgent",
      responseType: "for_action",
      attachmentPath: "/uploads/MSG-00020.png",
      status: "read_not_replied",
      replyReference: null,
      replyText: null,
    },
  ];

  for (const msg of sampleMessages) {
    const existing = await prisma.message.findUnique({
      where: { referenceNumber: msg.referenceNumber },
    });
    if (!existing) {
      await prisma.message.create({
        data: msg,
      });
    }
  }

  console.log("Seed completed successfully!");
  console.log("");
  console.log("Login credentials:");
  console.log("  Admin:        employeeId=0001,  password=admin123");
  console.log("  Mail Dept:    employeeId=1001,  password=admin123");
  console.log("  IT Dept:      employeeId=2001,  password=admin123");
  console.log("  HR Dept:      employeeId=2002,  password=admin123");
  console.log("");
  console.log("Sample data: 20 messages with attachments added.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
