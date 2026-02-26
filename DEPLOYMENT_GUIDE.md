# دليل التشغيل المحلي والأونلاين

دليل مفصل لتشغيل الموقع على جهازك محلياً وجعله متاحاً أونلاين.

---

# الجزء الأول: التشغيل المحلي

## الخطوة 1: التأكد من تثبيت Node.js

1. افتح **PowerShell** أو **Command Prompt**
2. اكتب:
   ```powershell
   node --version
   ```
3. إذا ظهر رقم (مثل v18.x أو v20.x) فأنت جاهز
4. إذا لم يظهر: حمّل من [nodejs.org](https://nodejs.org) وثبّت

---

## الخطوة 2: فتح مجلد المشروع

1. افتح **File Explorer**
2. انتقل إلى: `C:\Users\104750\Desktop\internal-mail-system`
3. اضغط **Shift + زر الماوس الأيمن**
4. اختر **"Open PowerShell window here"**

أو من **Cursor/VS Code**: افتح المجلد ثم **Terminal** → **New Terminal**

---

## الخطوة 3: تثبيت الحزم (إن لم تكن مثبتة)

```powershell
npm install
```

انتظر حتى ينتهي التثبيت (قد يستغرق دقيقة أو أكثر).

---

## الخطوة 4: إعداد ملف البيئة

1. تأكد من وجود ملف `.env` في المجلد
2. إذا لم يكن موجوداً، انسخ `.env.example` إلى `.env`:
   ```powershell
   copy .env.example .env
   ```
3. افتح `.env` وتأكد من وجود:
   ```
   DATABASE_URL="file:./dev.db"
   JWT_SECRET="your-secret-key-change-in-production"
   ```

---

## الخطوة 5: إعداد قاعدة البيانات

```powershell
npx prisma generate
npx prisma db push
npx prisma db seed
```

- `generate`: يجهز Prisma
- `db push`: ينشئ الجداول في قاعدة البيانات
- `db seed`: يضيف البيانات التجريبية (مستخدمين، أقسام، رسائل)

---

## الخطوة 6: تشغيل الموقع محلياً

```powershell
npm run dev
```

انتظر حتى تظهر رسالة مثل:
```
▲ Next.js 14.x.x
- Local: http://localhost:3000
```

---

## الخطوة 7: فتح الموقع

1. افتح المتصفح (Chrome, Edge, Firefox)
2. اكتب في شريط العنوان: **http://localhost:3000**
3. اضغط Enter

---

## تسجيل الدخول (محلي)

| الصلاحية | الرقم الوظيفي | كلمة المرور |
|----------|---------------|-------------|
| مدير النظام | 0001 | admin123 |
| قسم البريد | 1001 | admin123 |
| قسم تقنية المعلومات | 2001 | admin123 |
| قسم الموارد البشرية | 2002 | admin123 |

---

# الجزء الثاني: التشغيل أونلاين

هناك عدة طرق لجعل الموقع متاحاً على الإنترنت. اختر الأنسب لك:

---

## الطريقة 1: ngrok (الأسرع — للاختبار)

تجعل الموقع المحلي متاحاً عبر رابط إنترنت مؤقت.

### الخطوة 1: إنشاء حساب ngrok

1. اذهب إلى [ngrok.com](https://ngrok.com)
2. سجّل حساباً مجانياً
3. حمّل ngrok لنظامك من [ngrok.com/download](https://ngrok.com/download)

### الخطوة 2: تثبيت وتشغيل ngrok

1. فك ضغط الملف المحمّل
2. شغّل الموقع محلياً أولاً:
   ```powershell
   npm run dev
   ```
3. في نافذة Terminal جديدة، شغّل:
   ```powershell
   ngrok http 3000
   ```

### الخطوة 3: الحصول على الرابط

ستظهر رسالة تحتوي على رابط مثل:
```
Forwarding   https://abc123.ngrok-free.app -> http://localhost:3000
```

شارك هذا الرابط مع الآخرين للوصول للموقع من أي جهاز متصل بالإنترنت.

**ملاحظة:** الرابط يتغيّر في كل تشغيل (في النسخة المجانية).

---

## الطريقة 2: Vercel (مجاني — للإنتاج)

منصة مخصصة لتطبيقات Next.js.

### الخطوة 1: إنشاء حساب

1. اذهب إلى [vercel.com](https://vercel.com)
2. سجّل دخولك بحساب GitHub أو البريد الإلكتروني

### الخطوة 2: رفع المشروع

1. اضغط **Add New** → **Project**
2. اختر **Import Git Repository** (يجب رفع المشروع على GitHub أولاً)
3. أو اختر **Upload** لرفع المجلد يدوياً

### الخطوة 3: إعداد قاعدة البيانات

Vercel لا يدعم SQLite. تحتاج قاعدة بيانات سحابية:

**خيار أ: Railway (قاعدة بيانات مجانية)**

1. اذهب إلى [railway.app](https://railway.app)
2. أنشئ مشروعاً جديداً
3. اختر **Provision PostgreSQL**
4. انسخ رابط الاتصال (مثل: `postgresql://user:pass@host:5432/railway`)

**خيار ب: Neon (قاعدة بيانات مجانية)**

1. اذهب إلى [neon.tech](https://neon.tech)
2. أنشئ مشروعاً
3. انسخ رابط الاتصال

### الخطوة 4: إعداد متغيرات البيئة في Vercel

1. في إعدادات المشروع على Vercel: **Settings** → **Environment Variables**
2. أضف:
   - `DATABASE_URL` = رابط PostgreSQL
   - `JWT_SECRET` = مفتاح سري قوي (مثل: `MySecretKey2024!`)

### الخطوة 5: تعديل المشروع لـ PostgreSQL

1. عدّل `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. ارفع التعديلات إلى المشروع

### الخطوة 6: النشر

1. اضغط **Deploy**
2. بعد الانتهاء، ستحصل على رابط مثل: `https://your-project.vercel.app`

---

## الطريقة 3: Railway (كل شيء في مكان واحد)

Railway يدعم Next.js وقاعدة البيانات معاً.

### الخطوة 1: إنشاء حساب

1. اذهب إلى [railway.app](https://railway.app)
2. سجّل دخولك بحساب GitHub

### الخطوة 2: إنشاء مشروع جديد

1. اضغط **New Project**
2. اختر **Deploy from GitHub repo** (يجب رفع المشروع على GitHub)
3. أو اختر **Empty Project** ثم ارفع الملفات

### الخطوة 3: إضافة PostgreSQL

1. في المشروع: **+ New** → **Database** → **PostgreSQL**
2. انتظر حتى يتم إنشاء القاعدة
3. اضغط على PostgreSQL → **Variables** → انسخ `DATABASE_URL`

### الخطوة 4: إضافة الخدمة (Next.js)

1. **+ New** → **GitHub Repo** (أو **Empty Service**)
2. إذا اخترت Empty: ارفع ملفات المشروع
3. في **Settings** → **Variables** أضف:
   - `DATABASE_URL` = الرابط من الخطوة 3
   - `JWT_SECRET` = مفتاح سري

### الخطوة 5: إعداد البناء والتشغيل

في **Settings** → **Build & Deploy**:
- **Build Command:** `npm run build`
- **Start Command:** `npm run start`
- **Root Directory:** `/` (أو اتركه فارغاً)

### الخطوة 6: تشغيل البذور (Seed)

1. في Railway: افتح **Settings** → **Deploy**
2. أضف في **Pre-deploy command** (اختياري):
   ```
   npx prisma generate && npx prisma db push && npx prisma db seed
   ```
3. أو نفّذ الأوامر يدوياً عبر Railway CLI

### الخطوة 7: الحصول على الرابط

1. اضغط **Generate Domain**
2. ستحصل على رابط مثل: `https://your-app.up.railway.app`

---

## الطريقة 4: استضافة على سيرفر خاص (VPS)

للتحكم الكامل (مثل DigitalOcean أو استضافة محلية).

### المتطلبات

- سيرفر Linux (Ubuntu)
- عنوان IP ثابت أو نطاق (Domain)

### الخطوات الأساسية

1. **تثبيت Node.js على السيرفر:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt install -y nodejs
   ```

2. **تثبيت PostgreSQL:**
   ```bash
   sudo apt install postgresql postgresql-contrib
   ```

3. **نسخ المشروع إلى السيرفر** (مثلاً عبر Git أو SCP)

4. **إعداد ملف .env** برابط PostgreSQL و JWT_SECRET

5. **بناء وتشغيل التطبيق:**
   ```bash
   npm install
   npm run build
   npx prisma migrate deploy
   npx prisma db seed
   npm run start
   ```

6. **استخدام PM2 للتشغيل المستمر:**
   ```bash
   npm install -g pm2
   pm2 start npm --name "mail-system" -- start
   pm2 save
   pm2 startup
   ```

7. **إعداد Nginx كـ Reverse Proxy** (لـ HTTPS والنطاق)

---

# ملخص سريع

| الهدف | الطريقة | الصعوبة |
|-------|---------|---------|
| اختبار سريع مع آخرين | ngrok | سهل |
| نشر دائم مجاني | Vercel + Neon/Railway | متوسط |
| كل شيء في مكان واحد | Railway | متوسط |
| تحكم كامل | VPS (سيرفر خاص) | أصعب |

---

# استكشاف الأخطاء

## الموقع لا يفتح محلياً

- تأكد أن الأمر `npm run dev` يعمل بدون أخطاء
- جرّب `http://127.0.0.1:3000` بدلاً من `localhost`
- تأكد أن المنفذ 3000 غير مستخدم من برنامج آخر

## خطأ في قاعدة البيانات

- تأكد من وجود ملف `.env` ورابط `DATABASE_URL` صحيح
- نفّذ: `npx prisma db push` ثم `npx prisma db seed`

## الموقع أونلاين لا يعمل

- تأكد من إعداد متغيرات البيئة (DATABASE_URL, JWT_SECRET)
- تأكد أن قاعدة البيانات (PostgreSQL) تعمل ومتاحة
- راجع سجلات النشر (Logs) في المنصة المستخدمة
