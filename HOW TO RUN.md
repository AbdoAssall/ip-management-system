بما إن الـ Agent خلّص تحويل المشروع إلى Production API، فأنت **لم تعد تحتاج Mock Data إطلاقًا**، وبالتالي لازم يكون عندك:

* ✅ PostgreSQL شغال.
* ✅ قاعدة البيانات متطبقة عليها الـ Migrations.
* ✅ البيانات الأولية (Seed) موجودة.
* ✅ Backend شغال.
* ✅ Frontend شغال.

وده أفضل وقت ننظف البيئة ونبدأ من الصفر.

---

# أول مرة فقط (إعداد البيئة)

## 1) شغل Docker Desktop

تأكد إنه مكتوب:

```
Engine running
```

---

## 2) افتح Terminal في مجلد المشروع الرئيسي

```
ip-management-system
│
├── docker-compose.yml
├── server
└── client
```

---

## 3) شغل PostgreSQL فقط

```bash
docker compose up -d db
```

بعدها:

```bash
docker ps
```

المفروض تشوف

```
pscchc-db
```

---

## 4) عدل ملف `.env`

بما إن `docker-compose` معرف:

```yaml
POSTGRES_USER=postgres
POSTGRES_PASSWORD=pscchc_secure_password_2026
POSTGRES_DB=pscchc_ipam
```

يبقى داخل

```
server/.env
```

لازم يكون:

```env
DATABASE_URL="postgresql://postgres:pscchc_secure_password_2026@localhost:5432/pscchc_ipam?schema=public"
```

وليس:

```env
password
```

---

## 5) ادخل على السيرفر

```bash
cd server
```

---

## 6) تأكد إن Prisma شايف قاعدة البيانات

```bash
npx prisma migrate status
```

لو نجح يبقى ممتاز.

---

## 7) طبق الـ Migrations

لأن الـ Agent عدّل الـ Backend والـ Database logic.

أنصحك تستخدم:

```bash
npx prisma migrate deploy
```

لو ظهر إنه لا توجد migrations للتطبيق، يبقى تمام.

ولو أنت في بيئة تطوير ولسه بتنشئ قاعدة البيانات لأول مرة، واستخدم المشروع `prisma migrate dev` سابقًا، فممكن تحتاج:

```bash
npx prisma migrate dev
```

---

## 8) شغل الـ Seed

بما إن تسجيل الدخول الوهمي اتشال، لازم يبقى فيه مستخدم داخل قاعدة البيانات.

نفذ:

```bash
npm run prisma:seed
```

بعدها هيضيف المستخدمين التجريبيين.

---

## 9) شغل الـ Backend

```bash
npm run dev
```

المفروض تشوف رسالة إن السيرفر شغال بدون أخطاء.

---

## 10) شغل الـ Frontend

افتح Terminal جديد:

```bash
cd client
npm install
npm run dev
```

---

# ترتيب التشغيل اليومي بعد كده

كل مرة تفتح المشروع:

### شغل قاعدة البيانات

```bash
docker compose up -d db
```

---

### شغل السيرفر

```bash
cd server
npm run dev
```

---

### شغل الفرونت

```bash
cd client
npm run dev
```

---

# أول Login

بما إن الـ Agent حذف الـ Mock Login، لازم تستخدم بيانات حقيقية من الـ Seed.

لو الـ Walkthrough بيقول راجع:

```
server/prisma/seed.ts
```

افتح الملف وشوف المستخدم اللي بيضيفه.

غالبًا هيكون:

```
admin@pscchc.com
```

مع كلمة مرور مثل:

```
admin123
```

لكن الأفضل تتأكد من `seed.ts` لأن الـ Agent ذكر أن بيانات الدخول تعتمد على ما هو موجود فيه.

---

## أقترح خطوة إضافية قبل تشغيل أي شيء

بما إن الـ Agent عدّل حوالي 11 ملفًا، من الجيد تعمل Build للتأكد أن كل شيء ما زال متوافقًا:

### Backend

```bash
cd server
npm run build
```

### Frontend

```bash
cd client
npm run build
```

إذا نجح الـ Build في الجانبين، فغالبًا المشروع جاهز للتشغيل.

---

## لو كنت مكاني، سأبدأ بهذا التسلسل بالضبط:

1. `docker compose up -d db`
2. `cd server`
3. `npx prisma migrate status`
4. `npx prisma migrate deploy` (أو `migrate dev` إذا كانت قاعدة البيانات جديدة)
5. `npm run prisma:seed`
6. `npm run dev`
7. `cd client`
8. `npm run dev`

إذا ظهر أي خطأ في أي خطوة، أرسل الرسالة كاملة وسنحلها قبل الانتقال للخطوة التالية.
