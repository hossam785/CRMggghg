# Scope Mini CRM

نظام إدارة علاقات عملاء (CRM) متكامل وسريع، مخصص لإدارة وتتبع العملاء المحتملين (Leads) ومراحل المتابعة، مبني بأحدث معايير الأداء والواجهات وتجربة المستخدم.

---

## 🚀 التقنيات المستخدمة (Tech Stack)

- **Framework:** Next.js 16 (App Router, Turbopack, React 19)
- **Database & Backend:** Supabase (PostgreSQL, Row Level Security, Edge Functions)
- **Styling & Design:** Tailwind CSS v4, OKLCH Semantic Tokens (Light & Dark mode), WCAG 2.1 AA Contrast (≥ 4.5:1), Strict Logical Properties (`ms/me/ps/pe/start/end`)
- **State Management & Caching:** TanStack Query v5, TanStack Virtual v3
- **Internationalization (i18n):** `next-intl` (Arabic first `ar` RTL, English `en` LTR)
- **Type Safety & Validation:** TypeScript Strict, Zod, React Hook Form
- **Monitoring & Logging:** Sentry (`@sentry/nextjs`)

---

## 🛠️ متطلبات التشغيل والتطوير (Getting Started)

### 1. المتطلبات الأساسية
- Node.js 22 LTS (`.nvmrc`)
- pnpm 12.10.1+ (`corepack enable pnpm`)

### 2. التثبيت والتشغيل المحلي
```bash
# تثبيت الحزم
pnpm install

# إعداد ملف البيئة
cp .env.example .env.local

# تشغيل خادم التطوير
pnpm dev
```

افتح المتصفح على: [http://localhost:3000](http://localhost:3000)

---

## 🏛️ إعداد مشاريع Supabase والربط (Supabase Architecture & Setup)

يحتوي النظام على مشروعين منفصلين على منصة Supabase في منطقة **`eu-central-1`**:
1. **`scope-crm-dev`**: بيئة التطوير والتحقق والاختبار (بيانات قابلة للحذف).
2. **`scope-crm`**: بيئة الإنتاج الحقيقية (خالية تماماً من أي بيانات تجريبية).

### ربط الـ CLI المحلي ببيئة التطوير (Linking DEV)
الـ CLI المحلي مرتبط دائماً ببيئة **DEV** حصراً لتطبيق الـ migrations وتوليد الأنواع:

```bash
# تسجيل الدخول إلى Supabase CLI
pnpm supabase login

# ربط المشروع المحلي ببيئة التطوير
pnpm supabase link --project-ref <DEV_PROJECT_REF>

# توليد أنواع TypeScript من قاعدة بيانات التطوير
pnpm db:types
```

> [!CAUTION]
> **قاعدة أمان صارمة:**
> - يُمنع منعاً باتاً تشغيل أي أوامر تدميرية (`db reset` أو `db push` مباشرة) على بيئة الإنتاج (`scope-crm`) من الجهاز المحلي.
> - الـ Migrations تُطبق على الإنتاج عبر خط أنابيب GitHub Actions المعتمد فقط.
> - مفتاح `service_role` غير مصرح بوجوده في كود Next.js أو متغيرات Vercel إطلاقاً.

---

## 📋 قائمة إعدادات المصادقة (Supabase Auth Checklist)

يجب تطبيق هذه الإعدادات يدوياً على كلا المشروعين (`scope-crm-dev` و `scope-crm`) من لوحة تحكم Supabase Dashboard:

### 1. تعطيل التسجيل المفتوح (User Signups)
- انتقل إلى: **Authentication > Providers > Email**
- تأكد من **تعطيل** خيار **"Allow new users to sign up"** (Signups OFF).
- المستخدم يُنشأ فقط عبر دعوة من لوحة التحكم أو الإدارة.

### 2. متطلبات كلمة المرور (Password Security)
- انتقل إلى: **Authentication > Providers > Email**
- حدد الحد الأدنى لطول كلمة المرور: **12 حرفاً** (Minimum password length = 12).

### 3. روابط الموقع وإعادة التوجيه (Site URL & Redirect URLs)

| البيئة | Site URL | Additional Redirect URLs |
|---|---|---|
| **DEV** | `http://localhost:3000` | `http://localhost:3000/auth/callback`<br>`http://localhost:3000/reset-password` |
| **PROD** | `https://crm.<your-domain>.com` | `https://crm.<your-domain>.com/auth/callback`<br>`https://crm.<your-domain>.com/reset-password` |

### 4. قوالب البريد الإلكتروني (Bilingual Email Templates)
- إعداد قوالب البريد الإلكتروني لـ **Reset Password** و **Invite User** باللغتين العربية والإنجليزية لضمان وصول رسائل واضحة وموثوقة للمستخدمين.

---

## 📜 الأوامر المتاحة (Available Scripts)

```bash
pnpm dev             # تشغيل خادم التطوير المحلي
pnpm build           # بناء المشروع للإنتاج والتحقق من Next.js 16 Turbopack
pnpm start           # تشغيل النسخة المبنية
pnpm typecheck       # فحص أخطاء TypeScript (tsc --noEmit)
pnpm lint            # فحص المعايير البرمجية وقواعد CSS المنطقية (ESLint)
pnpm format          # تنسيق الكود بـ Prettier
pnpm db:types        # توليد أنواع قاعدة البيانات من Supabase
```

---

## 🚀 النشر والإنتاج (Production Deployment & CI/CD)

### 1. خط أنابيب GitHub Actions (CI/CD Pipeline)
المشروع مزود بمساري عمل مؤتمتين:
1. **`ci.yml`**: يعمل على كل `push` أو `pull_request` لفرع `main` للتحقق من:
   - التثبيت الصارم للحزم (`pnpm install --frozen-lockfile`).
   - خلو الكود من أخطاء الـ Linting والخصائص الاتجاهية الفيزيائية (`pnpm lint`).
   - خلو الأنواع من أي مشاكل TypeScript (`pnpm typecheck`).
   - اكتمال عملية البناء والـ Turbopack بنجاح (`pnpm build`).
2. **`migrate.yml`**: يعمل عند أي تعديل داخل مسار `supabase/migrations/**` على فرع `main`:
   - يقوم بتطبيق الـ Migrations الجديدة تلقائياً على قاعدة بيانات الإنتاج (`scope-crm`) باستخدام الـ CLI قبل تفعيل إصدار Vercel.

#### أسرار GitHub المطلوبة (Repository Secrets):
أضف الأسرار التالية في **GitHub Repository Settings > Secrets and variables > Actions**:
- `SUPABASE_ACCESS_TOKEN`: التوكن الشخصي لحساب Supabase (من Account Settings > Access Tokens).
- `PROD_PROJECT_REF`: معرف مشروع الإنتاج (`scope-crm`) في Supabase.
- `PROD_DB_PASSWORD`: كلمة مرور قاعدة بيانات الإنتاج.

---

### 2. النشر على Vercel (Vercel Project Configuration)
- **Framework Preset:** Next.js
- **Root Directory:** `./`
- **Node.js Version:** 22.x
- **Serverless Function Region:** `fra1` (Frankfurt - مطابقة لمنطقة Supabase `eu-central-1` لضمان أقل وقت استجابة latency < 15ms).
- **Production Branch:** `main`

#### متغيرات البيئة في Vercel (Production Environment Variables):
```env
NEXT_PUBLIC_SUPABASE_URL=https://<PROD_PROJECT_REF>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_pub_...
NEXT_PUBLIC_SENTRY_DSN=https://...
SENTRY_AUTH_TOKEN=sntrys_...
```

---

### 3. إنشاء حساب المستخدم الحقيقي في الإنتاج (Production User Creation)
1. بعد اكتمال النشر وتطبيق الـ Migrations، افتح **Supabase Dashboard > Authentication > Users**.
2. اضغط **Add user** -> **Create user**.
3. أدخل البريد الإلكتروني وكلمة المرور القوية (12+ حرفاً).
4. بعد الإنشاء، سيقوم الـ Trigger التلقائي `handle_new_user()` في `0001_foundation.sql` بإنشاء صفوف الإعدادات الافتراضية للمستخدم تلقائياً (`settings` و `backup_settings`).
5. توجه إلى رابط الإنتاج، وسجل الدخول بالحساب الحقيقي للوصول لواجهة النظام.

---

## 💾 النسخ الاحتياطي والاسترجاع (Backup & Restore Operations)

### 1. النسخ الاحتياطي التلقائي الليلي (GitHub Actions)
- مسار العمل `backup.yml` ينفذ يومياً في الساعة 03:00 بتوقيت القاهرة (01:00 UTC) عملية `pg_dump` كاملة لقاعدة بيانات الإنتاج.
- يتم ضغط الأرشيف بصيغة `.sql.gz` وحفظه في GitHub Actions Artifacts لمدة 30 يوماً.
- يمكن أيضاً تشغيله يدوياً في أي وقت بضغطة زر عبر تبويب **Actions > Nightly Encrypted Database Backup > Run workflow**.

### 2. خطوات استرجاع النسخة الاحتياطية (Database Restore Procedure)
في حال الطوارئ أو الحاجة لاستعادة البيانات:
1. قم بتنزيل ملف الأرشيف `.sql.gz` من آخر تنفيذ ناجح في تبويب **Actions**.
2. فك الضغط عن الملف للحصول على `scope_crm_prod_*.sql`.
3. لاستعادة البيانات على بيئة التطوير (DEV) أولاً للتحقق:
```bash
# استعادة الأرشيف إلى قاعدة بيانات DEV
supabase db execute --file ./backups/scope_crm_prod_*.sql
```
4. بعد التأكد من صحة البيانات، يمكن استعادتها للإنتاج بنفس الطريقة أو عبر لوحة تحكم Supabase SQL Editor.

---

## 📱 تطبيق الويب التقدمي واختصارات لوحة المفاتيح (PWA & Shortcuts)

- **تثبيت التطبيق (PWA):**
  - يدعم النظام التثبيت الكامل على شاشة الهاتف الرئيسية (iOS و Android) والديسكتوب.
  - يعمل بملء الشاشة مع تخزين مؤقت فائق السرعة للواجهات والخطوط (Stale-While-Revalidate).
  - إشعارات التنبيه (Web Push) وتنبيهات النسخ الاحتياطي تعمل تلقائياً في الخلفية.

- **اختصارات لوحة المفاتيح (Keyboard Shortcuts):**
  - اضغط `?` في أي وقت لفتح دليل الاختصارات الكامل.
  - `/` للتركيز الفوري على خانة البحث.
  - `N` لإضافة عميل جديد.
  - `G` ثم `D` للوحة المعلومات، `G` ثم `L` للعملاء، `G` ثم `F` للمتابعات، `G` ثم `S` للإعدادات.
  - `J` / `K` للتنقل بين الصفوف، `Enter` لفتح العميل، و `E` لتنفيذ الإجراء الرئيسي فوراً.


