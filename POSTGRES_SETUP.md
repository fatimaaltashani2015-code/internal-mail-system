# دليل إعداد PostgreSQL بالتفصيل

دليل خطوة بخطوة لإعداد قاعدة بيانات PostgreSQL وتشغيل الموقع.

---

## نظرة عامة

المشروع يستخدم حالياً **PostgreSQL**. لتفعيله تحتاج إلى:

1. تثبيت PostgreSQL على جهازك
2. إنشاء قاعدة بيانات باسم `internal_mail`
3. تعديل ملف `.env` برابط الاتصال
4. تشغيل أوامر Prisma لإنشاء الجداول وإدخال البيانات
5. تشغيل الموقع

---

## الخطوة 1: تثبيت PostgreSQL على Windows

### 1.1 تحميل PostgreSQL

1. افتح المتصفح وانتقل إلى: **https://www.postgresql.org/download/windows/**
2. اضغط على **"Download the installer"**
3. اختر أحدث إصدار (مثل 16 أو 17)
4. اختر **Windows x86-64** ثم حمّل الملف

### 1.2 تشغيل المثبت

1. شغّل الملف الذي تم تحميله (مثل `postgresql-16.x-windows-x64.exe`)
2. إذا ظهر تحذير أمان، اختر **"تشغيل"** أو **"Run"**
3. اضغط **Next** في شاشة الترحيب

### 1.3 اختيار المكونات

1. اترك الخيارات الافتراضية (PostgreSQL Server, pgAdmin, Command Line Tools)
2. اضغط **Next**

### 1.4 مجلد التثبيت

1. اترك المسار الافتراضي: `C:\Program Files\PostgreSQL\16` (أو رقم الإصدار لديك)
2. اضغط **Next**

### 1.5 كلمة مرور مستخدم postgres (مهم جداً)

1. في حقل **Password** أدخل كلمة مرور قوية (مثال: `MyPostgres2024!`)
2. **اكتبها في ورقة** — ستحتاجها لاحقاً
3. في حقل **Confirm Password** أعد كتابة نفس الكلمة
4. اضغط **Next**

### 1.6 المنفذ

1. اترك المنفذ **5432** (الافتراضي)
2. اضغط **Next**

### 1.7 إكمال التثبيت

1. اضغط **Next** حتى تصل لشاشة **Ready to Install**
2. اضغط **Next** لبدء التثبيت
3. انتظر حتى ينتهي التثبيت
4. اضغط **Finish**

---

## الخطوة 2: إنشاء قاعدة البيانات

### الطريقة الأولى: باستخدام pgAdmin (واجهة رسومية)

1. من قائمة ابدأ، ابحث عن **pgAdmin 4** وافتحه
2. في الشريط الجانبي الأيسر، انقر على **Servers**
3. أدخل كلمة مرور **postgres** عند الطلب (الكلمة التي عيّنتها أثناء التثبيت)
4. انقر بزر الماوس الأيمن على **Databases** → اختر **Create** → **Database...**
5. في حقل **Database** اكتب: `internal_mail`
6. اضغط **Save**

### الطريقة الثانية: باستخدام سطر الأوامر (Command Prompt)

1. اضغط **Win + R** واكتب `cmd` ثم Enter
2. نفّذ الأمر التالي (استبدل `كلمة_المرور` بكلمة مرور postgres):

```cmd
"C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -c "CREATE DATABASE internal_mail;"
```

> إذا كان PostgreSQL في إصدار مختلف، غيّر `16` إلى رقم إصدارك (مثل 15 أو 17)

3. أدخل كلمة المرور عند الطلب
4. إذا ظهرت رسالة `CREATE DATABASE` فالقاعدة تم إنشاؤها بنجاح

### الطريقة الثالثة: باستخدام SQL Shell (psql)

1. من قائمة ابدأ، ابحث عن **SQL Shell (psql)** وافتحه
2. اضغط Enter لكل سطر حتى يطلب **Password**
3. أدخل كلمة مرور postgres
4. اكتب الأمر التالي ثم Enter:

```sql
CREATE DATABASE internal_mail;
```

5. إذا ظهرت `CREATE DATABASE` فتم بنجاح
6. اكتب `\q` ثم Enter للخروج

---

## الخطوة 3: إعداد ملف البيئة (.env)

### 3.1 فتح مجلد المشروع

1. افتح **File Explorer** وانتقل إلى:
   ```
   C:\Users\104750\Desktop\internal-mail-system
   ```

### 3.2 التحقق من وجود ملف .env

1. ابحث عن الملف `.env` في مجلد المشروع
2. **إن وُجد:** انتقل إلى الخطوة 3.3
3. **إن لم يُوجد:** انسخ `.env.example` إلى `.env`:
   - انقر بزر الماوس الأيمن على `.env.example` → **Copy**
   - انقر بزر الماوس الأيمن في المجلد → **Paste**
   - أعد تسمية النسخة إلى `.env` (احذف `.example`)

> إذا لم تظهر الملفات: من **View** في File Explorer فعّل **"Hidden items"**

### 3.3 تعديل ملف .env

1. انقر بزر الماوس الأيمن على `.env` → **Open with** → **Notepad** (أو Cursor/VS Code)
2. ابحث عن السطر الذي يبدأ بـ `DATABASE_URL=`
3. استبدله بهذا الشكل (ضع كلمة مرور postgres الفعلية):

   ```
   DATABASE_URL="postgresql://postgres:كلمة_المرور_الخاصة_بك@localhost:5432/internal_mail"
   ```

   **مثال** (إذا كانت كلمة المرور `MyPass123`):
   ```
   DATABASE_URL="postgresql://postgres:MyPass123@localhost:5432/internal_mail"
   ```

4. **ملاحظات مهمة:**
   - استبدل `كلمة_المرور_الخاصة_بك` بكلمة المرور التي عيّنتها عند تثبيت PostgreSQL
   - إذا كانت كلمة المرور تحتوي على `@` استبدلها بـ `%40`
   - إذا كانت تحتوي على `#` استبدلها بـ `%23`
   - إذا كان اسم المستخدم مختلفاً عن `postgres`، استبدله في الرابط
5. احفظ الملف: **Ctrl + S** ثم أغلق Notepad

---

## الخطوة 4: تشغيل أوامر Prisma

### 4.1 فتح PowerShell أو Terminal

1. في مجلد المشروع، اضغط **Shift + زر الماوس الأيمن**
2. اختر **"Open PowerShell window here"** أو **"Open in Terminal"**

أو:
1. افتح **VS Code** أو **Cursor**
2. افتح مجلد المشروع
3. من القائمة: **Terminal** → **New Terminal**

### 4.2 التأكد من المسار

اكتب الأمر التالي للتأكد أنك في المجلد الصحيح:

```powershell
cd C:\Users\104750\Desktop\internal-mail-system
```

### 4.3 تنفيذ الأوامر بالترتيب

**الأمر الأول — إنشاء عميل Prisma:**
```powershell
npx prisma generate
```
انتظر حتى تظهر رسالة مثل `Generated Prisma Client`

---

**الأمر الثاني — إنشاء الجداول في PostgreSQL:**
```powershell
npx prisma migrate deploy
```
- هذا الأمر ينشئ جميع الجداول (Department, User, Message, Referential, SystemSetting)
- يجب أن تظهر رسائل مثل `Applied migration...` لكل هجرة
- إن ظهر خطأ: تأكد أن PostgreSQL يعمل وقاعدة `internal_mail` موجودة

---

**الأمر الثالث — إدخال البيانات التجريبية:**
```powershell
npx prisma db seed
```
يجب أن تظهر رسالة مثل `Seed completed successfully!`

### 4.4 في حال حدوث خطأ

| الخطأ | الحل |
|-------|------|
| `the URL must start with postgresql://` | تأكد أن ملف `.env` يحتوي على الرابط الصحيح وأنه في مجلد المشروع |
| `password authentication failed` | تحقق من كلمة مرور postgres في `.env` |
| `database "internal_mail" does not exist` | أنشئ قاعدة البيانات كما في الخطوة 2 |
| `connect ECONNREFUSED` | تأكد أن خدمة PostgreSQL تعمل (من Services أو pgAdmin) |

---

## الخطوة 5: تشغيل الموقع والتحقق

### 5.1 تشغيل الموقع

في نفس نافذة Terminal:

```powershell
npm run dev
```

### 5.2 فتح الموقع

1. افتح المتصفح
2. اكتب في شريط العنوان: **http://localhost:3000**
3. اضغط Enter

### 5.3 تسجيل الدخول

استخدم أحد الحسابات التجريبية:

| الصلاحية | الرقم الوظيفي | كلمة المرور |
|----------|---------------|-------------|
| مدير النظام | 0001 | admin123 |
| قسم البريد | 1001 | admin123 |
| قسم تقنية المعلومات | 2001 | admin123 |
| قسم الموارد البشرية | 2002 | admin123 |

---

## ملخص الأوامر السريع

بعد إعداد PostgreSQL وملف `.env`، يمكنك تشغيل هذه الأوامر في أي وقت لإعادة الإعداد:

```powershell
cd C:\Users\104750\Desktop\internal-mail-system
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

---

## إيقاف وبدء خدمة PostgreSQL (للمرجع)

- **بدء الخدمة:** من **Services** (services.msc) ابحث عن **postgresql-x64-16** واختر Start
- **إيقاف الخدمة:** نفس النافذة → Stop
