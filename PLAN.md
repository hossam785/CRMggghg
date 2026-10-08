# Scope Mini CRM: خطة التنفيذ الكاملة

> **الإصدار:** v2.0 من الخطة (اتضاف: المواصفات البرمجية الكاملة §18، ومنهجية التنفيذ §19، والمهام كـ Prompts §20) · **التاريخ:** 2026-10-08
> **الحالة:** مسودة للمراجعة. في آخر الملف قسم "قرارات محتاجة تأكيد" (§17)، راجعه الأول.

### 🗺️ خريطة الملف
| الجزء | الأقسام | بتلاقي فيه |
|---|---|---|
| **الأول: المنتج** | §0–§17 | الفكرة، والأركتكتشر، والداتابيز، وكل فيتشر من الألف للياء، والـ UX، والمراحل، والقرارات |
| **التاني: المواصفات البرمجية** | §18 | الـ Conventions، و **الـ Design System**، و **SQL كامل لكل الـ migrations والـ functions**، والفرونت إند والـ hooks، والـ Workers، والـ Edge Functions، والأمان، وسياسة صفر داتا وهمية |
| **التالت: التنفيذ** | §19–§20 | منهجية الشغل، والأدوار، والـ Preamble الثابت، و **66 مهمة مكتوبة كـ Prompts** |

---

## 0. ملخص سريع (TL;DR)

| البند | القرار |
|---|---|
| المستخدمين | يوزر واحد، وفي تسجيل دخول. التسجيل العام مقفول. الداتابيز مصممة بـ `owner_id` و RLS، فلو ضفنا يوزرز بعدين مش هنحتاج migration صعبة |
| اللغة | عربي (RTL) وإنجليزي (LTR)، ومعاهم زرار تبديل. اللغة بتتحفظ في Cookie ومش بتظهر في الـ URL |
| المتابعات | مواعيدها بتتحسب أوتوماتيك من الإعدادات (افتراضيًا 2 ثم 3 ثم 4 أيام)، وتقدر تعدّلها يدويًا لأي Lead |
| Stack | Next.js 16 (App Router) + TypeScript + Tailwind v4 + shadcn/ui + Supabase (Postgres + Auth) + Vercel |
| البحث | خانة بحث واحدة على **كل** الحقول. بتتعامل مع العربي (أ/ا، ة/ه، ى/ي، التشكيل، الأرقام الهندية)، ومع الكلام الناقص (Trigram)، ومع الأخطاء الإملائية البسيطة |
| الحجم المستهدف | سريع على 100,000 Lead أو أكتر: الاستعلامات أقل من 150ms، و Keyset pagination، و Virtualized list |
| الموبايل | Mobile-first، وبيشتغل PWA (يتسطّب على الشاشة الرئيسية زي التطبيق) |
| Excel | **تصدير Excel/CSV من كل صفحة** · **نموذج Excel جاهز للتحميل** (فيه قوائم منسدلة) · **استيراد في أي وقت** من Excel أو CSV أو Google Sheets، ومعاه **تقرير**: الكامل، والناقص، والغلط، والمكرر |
| الملفات الكبيرة | القراءة بتحصل في **Web Worker** فالشاشة مش بتعلّق أبدًا · الرفع على دفعات · Progress bar · لو قفلت التاب تقدر تكمّل من مكانك (resumable) · تقدر تلغي الاستيراد أو ترجعه (rollback) |
| النسخ الاحتياطي | **جدولة على مزاجك** (يومي / أسبوعي / كل أسبوعين / شهري / مقفول) · السيرفر بيعمل النسخة أوتوماتيك · **تنبيه** (جوه التطبيق + Push + إيميل) لحد ما تنزّلها على اللابتوب · تقدر تسترجع من أي نسخة |
| أول Deploy | آخر يوم 1 (Login + هيكل فاضي على Production) |
| الـ Workflow كامل شغال | آخر **Phase 3** (تقريبًا يوم 5) |
| مركز البيانات (Excel والـ Backup) | آخر **Phase 4** (تقريبًا يوم 8) |
| v1.0 جاهزة | آخر **Phase 6** (تقريبًا 10–11 يوم عمل) |

---

## 1. فهم المشكلة (قبل ما نكتب سطر كود)

### 1.1 الشغل الحقيقي اللي بيحصل كل يوم
اليوزر بيعمل Outreach على **Instagram DM** في الأساس، و WhatsApp أحيانًا. اليوم بتاعه شكله كده:

1. يلاقي حساب مناسب على إنستجرام، فيضيفه بسرعة (**لازم الخطوة دي تاخد أقل من 10 ثواني**).
2. يبعتله رسالة، ويرجع يدوس **Send Message**.
3. بعد كام يوم: يفتح **صفحة المتابعات**، فيلاقي قايمة "ابعت لدول النهارده"، يفتح كل واحد ويبعتله ويدوس "تم".
4. لما حد يرد: **Reply Received**، وبعدين Meeting، ثم Proposal، ثم Won أو Lost.
5. آخر الأسبوع: يبص على الـ **Dashboard** عشان يعرف بعت كام رسالة، وكام واحد رد، وكام Meeting اتحجز.

### 1.2 المعايير اللي هنحكم بيها على النجاح
- **سرعة الإدخال:** إضافة Lead جديد في 10 ثواني أو أقل، و 4 حقول تكفي.
- **ولا متابعة تضيع:** أي Lead مستني رد لازم يظهر في صفحة المتابعات في يومه بالظبط.
- **ضغطة واحدة للأكشن:** كل تغيير في الـ Stage يحصل بضغطة واحدة، وفيه **Undo**.
- **البحث يلاقي الـ Lead** حتى لو كتبت "احمد" والاسم متسجل "أحمد"، أو كتبت جزء من اليوزرنيم.

### 1.3 خارج النطاق (Non-goals): مش هنعمله في v1
فواتير، إدارة مشاريع، إدارة موظفين، إدارة مالية، **إرسال رسايل من جوه السيستم** (السيستم بيسجّل بس، والإرسال بيحصل من إنستجرام/واتساب نفسه)، الكتابة وإنت Offline، والتطبيقات Native.

### 1.4 فجوات لقيتها في المطلوب، والحل اللي أنا مقترحه ⚠️
| الفجوة | ليه دي مشكلة | الحل المقترح |
|---|---|---|
| مفيش زرار ينقل الـ Lead لـ Follow Up 1/2/3 | من غيره الـ Lead هيفضل واقف في Message Sent على طول | زرار ذكي **"Follow-up Sent"** بيقدّم المرحلة: Message Sent ثم FU1 ثم FU2 ثم FU3 |
| مفيش زرار لـ Proposal Sent | المرحلة موجودة في الـ Pipeline بس مفيش طريقة توصلها بسرعة | نضيف زرار **Proposal Sent** |
| معنى "Follow Up 1" مش واضح: هل المتابعة **اتبعتت** ولا لسه **مستحقة**؟ | ده بيأثر على صفحة المتابعات والإحصائيات كلها | **المرحلة = آخر حاجة اتعملت**. يعني FU1 معناها "المتابعة الأولى اتبعتت". اللي "مستحق" بيتحسب لوحده من تاريخ `next_follow_up_on` |
| بعد FU3 والعميل لسه مردّش | الـ Lead هيفضل في الصفحة على طول | Bucket اسمه **"خلصت المتابعات"**، ومعاه اقتراح: Lost، أو إعادة المحاولة بعد شهر |
| Leads في Replied أو Meeting وبتبرد | مفيش حاجة بتفكّرك بيهم | **"تذكير بموعد"** تقدر تحطه يدويًا على أي Lead في أي مرحلة، ويظهر في صفحة المتابعات |
| ضغطة غلط على زرار | من غير Undo الداتا هتبوظ | **Undo** لمدة 10 دقايق، ومعاه Toast فيه زرار تراجع |
| نفس الحساب يتضاف مرتين | هيتبعتله رسالتين ومنظرنا هيبقى وحش | **كشف التكرار** فورًا بالـ Instagram handle أو رقم الواتساب |
| "Lost" من غير سبب | مش هتعرف تتعلم ليه بتخسر | سبب **اختياري** بضغطة واحدة: مش مهتم / مردّش / الميزانية / توقيت / أخرى |
| "الأنشطة" قايمة ثابتة | النشاطات بتتغير مع الوقت | القايمة بتتعدل من الإعدادات، و"أخرى" بتفتح خانة تكتب فيها |

---

## 2. الأركتكتشر

### 2.1 الصورة الكبيرة
```
┌──────────────────────────── Browser / PWA ────────────────────────────┐
│  Next.js App (React 19)                                               │
│  ├─ Server Components: الـ shell والـ layout وأول تحميل (SSR)            │
│  ├─ Client: TanStack Query (cache + optimistic) ← supabase-js         │
│  └─ next-intl (ar/en) · nuqs (حالة الفلاتر في الـ URL)                    │
└───────────────┬───────────────────────────────────────────────────────┘
                │ HTTPS (JWT في cookies عن طريق @supabase/ssr)
┌───────────────▼───────────────────────────────────────────────────────┐
│  Supabase                                                             │
│  ├─ Auth (email+password، التسجيل مقفول)                                │
│  ├─ PostgREST: CRUD بسيط على الجداول، ومحمي بـ RLS                       │
│  ├─ RPC Functions: البيزنس لوجيك المهم (atomic transactions)          │
│  │    lead_action · undo_lead_event · search_leads · dashboard_stats  │
│  │    follow_up_queue · lead_stage_counts · check_duplicate          │
│  └─ Postgres 15+: pg_trgm · unaccent · RLS · triggers                 │
└───────────────────────────────────────────────────────────────────────┘
          Vercel (fra1)  ◄── نفس المنطقة ──►  Supabase (eu-central-1 فرانكفورت)
```

### 2.2 قرارات الأركتكتشر وأسبابها (ADRs مختصرة)

**ADR-1: البيزنس لوجيك بتاع تغيير المرحلة جوه Postgres (RPC) ومش في TypeScript**
- السبب: تغيير المرحلة بيعدّل الـ Lead **وكمان** بيسجل Event في نفس الـ transaction. لو حصل خطأ في النص، يا الاتنين يتسجلوا يا ولا واحد فيهم. وكل ده بيحصل في **Round-trip واحد**.
- التحقق من الانتقالات المسموحة (Transition matrix) بيحصل في الداتابيز، وده **مصدر الحقيقة**. الـ UI بيستخدم نسخة من نفس الجدول في TS عشان يعرض الزراير، وفي **تيست** بيتأكد إن النسختين متطابقين.

**ADR-2: القراءة بتحصل من الـ Client مباشرة عن طريق supabase-js و RLS، ومن غير API layer في النص**
- البديل كان Server Actions أو Route Handlers. ده كان هيضيف hop زيادة في كل طلب، والـ UI التفاعلي (بحث وفلاتر و infinite scroll) هيبقى أبطأ.
- الأمان مضمون بالـ RLS: كل Row ليها `owner_id = auth.uid()`.
- Next.js بيستخدم الـ Server في: حماية الـ routes (proxy)، وأول render، والـ auth callback.

**ADR-3: الـ Stages عبارة عن Postgres ENUM، والأنشطة جدول**
- المراحل ثابتة وليها لوجيك مربوط بيها، فالأنسب ENUM. الأنشطة محتاجة تتعدل من الـ UI، فالأنسب جدول.

**ADR-4: جدول `lead_events` (Event log) جنب عواميد التواريخ في `leads`**
- العواميد (`replied_at` وغيرها) بتخلي العرض والفلترة سريعين.
- الـ Events هي اللي بتخلي الـ **Dashboard يتحسب على أي فترة** بدقة، وبتعمل **Timeline** لكل Lead، وبتخلي **Undo** ممكن.

**ADR-5: التاريخ المستحق للمتابعة نوعه `date` ومش `timestamptz`**
- كل اللي يهمنا "مستحق النهارده" ولا لأ، والساعة مش مهمة. و"النهارده" بيتحسب بالـ timezone اللي في الإعدادات (`Africa/Cairo`)، فمش هيحصل خلط عند منتصف الليل.

**ADR-6: Soft delete**
- `deleted_at` بدل المسح النهائي، ومعاه صفحة "سلة المحذوفات". بعد 30 يوم المسح بيحصل نهائي بـ cron (pg_cron).

### 2.3 الـ Tech Stack بالتفصيل
| الطبقة | الأداة | ليه اخترناها |
|---|---|---|
| Framework | **Next.js 16** (App Router) + React 19 + TypeScript strict | SSR للـ shell، وrouting، وdeploy على Vercel من غير أي إعداد |
| Styling | **Tailwind CSS v4** باستخدام **logical properties** (`ms-*`/`me-*`/`ps-*`) | الـ RTL والـ LTR بيشتغلوا من غير ما نكرر الكود |
| Components | **shadcn/ui** (Radix) | Accessible ومتاح لينا الكود نفسه نعدّل فيه، وبيدعم RTL عن طريق `DirectionProvider` |
| Forms | react-hook-form + **zod** | نفس الـ schema بيتحقق من الداتا في الـ client وبيولّد الـ types |
| Data | **TanStack Query v5** + supabase-js | Cache وoptimistic updates، وبيعمل refetch لما ترجع للتاب |
| Lists | **TanStack Virtual** | بيعرض آلاف الصفوف من غير lag على الموبايل |
| URL state | **nuqs** | الفلاتر محفوظة في الـ URL، فالـ Back/Refresh بيرجّعوك لنفس الحالة |
| i18n | **next-intl** | الترجمة، والـ `dir`، والتواريخ والأرقام بـ `Intl` |
| Phone | **libphonenumber-js** (نسخة min) | تحويل الأرقام لصيغة E.164 والتحقق منها |
| Toasts | **sonner** | Toast فيه زرار Undo |
| Icons | lucide-react | |
| قراءة Excel/CSV | **SheetJS (xlsx)** من CDN بتاعهم الرسمي (نسخة npm قديمة)، وبيشتغل جوه **Web Worker** | أسرع parser، بيقرا xlsx و xls و csv و ods |
| كتابة Excel | **ExcelJS** جوه Web Worker | تنسيق الملف، و**قوائم منسدلة (Data validation)**، وتثبيت الهيدر، والشيت بيفتح RTL |
| Workers | **Comlink** | بيخلّي التعامل مع الـ Worker زي ما تنادي function عادية |
| Jobs مجدولة | **pg_cron + pg_net + Supabase Edge Functions** | النسخ الاحتياطي المجدول والتنبيهات |
| التخزين | **Supabase Storage** (bucket خاص) | ملفات النسخ الاحتياطي، والوصول ليها بـ signed URLs |
| الإيميل | **Resend** (الخطة المجانية فيها 3000 إيميل في الشهر) | تنبيهات النسخ الاحتياطي |
| Push | **Web Push** (VAPID) + Service Worker | التنبيهات على الموبايل والديسكتوب |
| Countries | `i18n-iso-countries` (ar/en) | أسماء الدول بالعربي والإنجليزي |
| DB | Supabase Postgres + `pg_trgm` + `unaccent` + `pg_cron` | |
| التحقق | سكريبتات مؤقتة في `.tmp/` (tsx / SQL) + فحص يدوي في المتصفح، وكلها بتتمسح بعد كل مهمة (§11) | مفيش test suite دايمة، ودي كانت رغبتك |
| CI | GitHub Actions | lint · typecheck · test · migrations |
| Monitoring | Vercel Analytics + Sentry (الخطة المجانية) | |

---

## 3. تصميم الداتابيز

### 3.1 الـ Extensions والـ Types
```sql
create extension if not exists pg_trgm;
create extension if not exists unaccent;

create type lead_stage as enum (
  'new', 'message_sent', 'follow_up_1', 'follow_up_2', 'follow_up_3',
  'replied', 'meeting_booked', 'proposal_sent', 'won', 'lost'
);

create type tri_state as enum ('yes', 'no', 'unknown');

create type lead_event_type as enum (
  'created', 'message_sent', 'follow_up_sent', 'reply_received',
  'meeting_booked', 'proposal_sent', 'won', 'lost',
  'stage_set',        -- تغيير يدوي من الـ dropdown
  'reopened',         -- رجوع من won/lost
  'reminder_set', 'snoozed', 'restarted'
);
```

### 3.2 جدول `industries` (الأنشطة)
```sql
create table industries (
  id          smallint generated always as identity primary key,
  owner_id    uuid not null default auth.uid() references auth.users on delete cascade,
  key         text not null,                -- 'real_estate_consultant'
  label_ar    text not null,
  label_en    text not null,
  sort_order  smallint not null default 0,
  is_other    boolean not null default false, -- "أخرى" تفتح حقل نصي
  is_active   boolean not null default true,  -- مش بنمسح، بنخفي
  unique (owner_id, key)
);
```
**Seed:** مستشار عقاري · شركة عقارية · Founder / CEO · مستشار أعمال · طبيب · عيادة طبية · أخرى (`is_other = true`).
- لما تخفي نشاط، الـ Leads القديمة اللي عليه بتفضل شايلاه، بس مش هيظهر كاختيار للـ Leads الجديدة.

### 3.3 جدول `leads` (الجدول الأساسي)
```sql
create table leads (
  id                 uuid primary key default gen_random_uuid(),
  owner_id           uuid not null default auth.uid() references auth.users on delete cascade,

  -- بيانات العميل
  name               text not null check (char_length(btrim(name)) between 1 and 120),
  company            text check (char_length(company) <= 120),
  industry_id        smallint references industries(id),
  industry_other     text check (char_length(industry_other) <= 80),
  job_title          text check (char_length(job_title) <= 80),       -- المنصب
  instagram_handle   text check (instagram_handle ~ '^[a-z0-9._]{1,30}$'),
  whatsapp_e164      text check (whatsapp_e164 ~ '^\+[1-9][0-9]{6,14}$'),
  country_code       char(2),                                         -- ISO-3166 alpha-2
  notes              text check (char_length(notes) <= 5000),

  -- Qualification
  has_content          boolean,            -- null = لسه متحددش
  appears_in_content   boolean,
  has_videographer     tri_state not null default 'unknown',
  problems             text check (char_length(problems) <= 280),

  -- Pipeline
  stage                lead_stage not null default 'new',
  stage_changed_at     timestamptz not null default now(),
  first_message_at     timestamptz,
  last_contacted_at    timestamptz,
  follow_ups_sent      smallint not null default 0 check (follow_ups_sent between 0 and 3),
  next_follow_up_on    date,               -- متى تظهر في صفحة المتابعات
  reminder_note        text check (char_length(reminder_note) <= 140),
  replied_at           timestamptz,
  meeting_booked_at    timestamptz,
  meeting_at           timestamptz,        -- موعد الميتنج نفسه (اختياري)
  proposal_sent_at     timestamptz,
  won_at               timestamptz,
  lost_at              timestamptz,
  lost_reason          text,               -- key: not_interested|no_reply|budget|timing|other

  -- System
  import_job_id        uuid,               -- لو الـ Lead جه من استيراد، عشان الـ rollback والتتبع
  missing_fields       text[] not null default '{}',  -- بيتحسب بـ trigger: ['industry','country',...]
  search_text          text not null default '',  -- بيتملى بـ trigger
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  deleted_at           timestamptz,

  constraint has_contact check (instagram_handle is not null or whatsapp_e164 is not null)
);
```
> **ملاحظة تصميم:** الإنستجرام مش إجباري، والواتساب مش إجباري، **بس لازم واحد منهم على الأقل يكون موجود**. من غير وسيلة تواصل الـ Lead ملوش لازمة. (§17 سؤال 2)
>
> **ليه بنخزن الـ handle ومش اللينك؟** لأن نفس الحساب ممكن ييجي بـ 10 أشكال (`@Ahmed.re`، `instagram.com/ahmed.re/?igsh=...`، `https://www.instagram.com/ahmed.re/`). بنحوّلها كلها لـ `ahmed.re`، وده اللي بيخلي كشف التكرار ممكن، واللينك بيتبني منه وقت العرض.

### 3.4 جدول `lead_events` (الـ Timeline والإحصائيات والـ Undo)
```sql
create table lead_events (
  id           bigint generated always as identity primary key,
  owner_id     uuid not null default auth.uid() references auth.users on delete cascade,
  lead_id      uuid not null references leads(id) on delete cascade,
  type         lead_event_type not null,
  from_stage   lead_stage,
  to_stage     lead_stage,
  prev_state   jsonb,           -- snapshot للعواميد اللي اتغيرت، وبنستخدمه في الـ Undo
  meta         jsonb not null default '{}',  -- lost_reason, follow_up_number, snooze_days...
  occurred_at  timestamptz not null default now(),
  undone_at    timestamptz      -- لو اتعمله Undo، بيتستبعد من الإحصائيات
);
```

### 3.5 جدول `settings`
```sql
create table settings (
  owner_id           uuid primary key default auth.uid() references auth.users on delete cascade,
  locale             text not null default 'ar' check (locale in ('ar','en')),
  timezone           text not null default 'Africa/Cairo',
  default_country    char(2) default 'EG',
  fu1_after_days     smallint not null default 2 check (fu1_after_days between 1 and 60),
  fu2_after_days     smallint not null default 3 check (fu2_after_days between 1 and 60),
  fu3_after_days     smallint not null default 4 check (fu3_after_days between 1 and 60),
  give_up_after_days smallint not null default 5 check (give_up_after_days between 1 and 90),
  updated_at         timestamptz not null default now()
);
```
- `fuN_after_days` = عدد الأيام **من آخر تواصل** لحد المتابعة اللي بعدها. يعني لو بعتّ الرسالة الأولى يوم 1: الـ FU1 يوم 3، والـ FU2 يوم 6، والـ FU3 يوم 10، وبعدها يدخل "خلصت المتابعات" يوم 15.
- فين `lost_reasons`؟ مخزنة كـ keys ثابتة في الكود ومترجمة. مش محتاجة جدول في v1.

### 3.5.1 جداول مركز البيانات (الاستيراد والنسخ الاحتياطي)
```sql
create type import_status as enum ('parsing','staging','validating','review','committing','done','cancelled','failed','rolled_back');
create type import_row_status as enum ('valid','incomplete','error','duplicate_db','duplicate_file');

create table import_jobs (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid not null default auth.uid() references auth.users on delete cascade,
  source         text not null check (source in ('xlsx','xls','csv','ods','google_sheet','backup')),
  file_name      text,
  sheet_name     text,
  mapping        jsonb not null default '{}',   -- {"عمود الملف": "lead_field"}
  options        jsonb not null default '{}',   -- duplicate_strategy, default_country, default_stage...
  status         import_status not null default 'parsing',
  total_rows     int not null default 0,
  staged_rows    int not null default 0,        -- عشان الـ resume
  committed_rows int not null default 0,
  counts         jsonb not null default '{}',   -- {"valid":480,"incomplete":30,"error":5,...}
  error          text,
  created_at     timestamptz not null default now(),
  finished_at    timestamptz
);

create table import_rows (               -- staging: الصفوف بتقعد هنا لحد ما تراجعها
  job_id     uuid not null references import_jobs(id) on delete cascade,
  row_no     int  not null,              -- رقم الصف في الملف الأصلي (عشان التقرير)
  owner_id   uuid not null default auth.uid(),
  raw        jsonb not null,             -- الداتا زي ما جت من الملف
  data       jsonb not null,             -- بعد التطبيع
  status     import_row_status not null,
  issues     jsonb not null default '[]',-- [{"field":"whatsapp","code":"invalid_phone"}]
  match_lead_id uuid,                    -- لو مكرر مع Lead موجود
  decision   text check (decision in ('import','skip','update')),  -- قرار اليوزر
  raw_before jsonb,                      -- قيم الـ Lead قبل التحديث، عشان الـ Rollback
  primary key (job_id, row_no)
);
create index import_rows_status_idx on import_rows (job_id, status, row_no);

create table backup_settings (
  owner_id     uuid primary key default auth.uid() references auth.users on delete cascade,
  frequency    text not null default 'weekly' check (frequency in ('off','daily','weekly','biweekly','monthly')),
  weekday      smallint default 5 check (weekday between 0 and 6),   -- الجمعة افتراضيًا
  month_day    smallint default 1 check (month_day between 1 and 28),
  hour_local   smallint not null default 9 check (hour_local between 0 and 23),
  format       text not null default 'xlsx' check (format in ('xlsx','csv_zip','json')),
  keep_last    smallint not null default 8 check (keep_last between 1 and 52),
  notify_inapp boolean not null default true,
  notify_push  boolean not null default true,
  notify_email boolean not null default false,
  next_run_at  timestamptz
);

create table backups (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null default auth.uid() references auth.users on delete cascade,
  kind          text not null check (kind in ('scheduled','manual','pre_restore','pre_import')),
  status        text not null default 'pending' check (status in ('pending','running','ready','failed')),
  format        text not null,
  storage_path  text,
  size_bytes    bigint,
  row_counts    jsonb,                  -- {"leads":12034,"events":48211}
  checksum      text,                   -- sha256، عشان نتأكد إن الملف سليم وقت الاسترجاع
  downloaded_at timestamptz,            -- null = لسه متنزّلش على اللابتوب، فالتنبيه بيفضل شغال
  created_at    timestamptz not null default now()
);

create table push_subscriptions (
  id         bigint generated always as identity primary key,
  owner_id   uuid not null default auth.uid() references auth.users on delete cascade,
  endpoint   text not null unique,
  keys       jsonb not null,
  user_agent text,
  created_at timestamptz not null default now()
);
```
> كل الجداول دي عليها نفس الـ RLS (`owner_id = auth.uid()`). والـ Storage bucket اسمه `backups` وهو **private**، والـ policy بتسمح بس بالمسار `{owner_id}/*`.

**`missing_fields` (اكتمال البيانات):** Trigger بيحسب الحقول **المهمة** الناقصة في كل Lead: `industry`, `country`, `job_title`, `qualification`. الإنستجرام والواتساب مش جوه القايمة دي، لأن واحد منهم كفاية وده متغطي بالـ constraint. ومنها بنعمل:
- فلتر "بيانات ناقصة" في القايمة، وفلتر "ناقص: الدولة" مثلًا.
- Badge صغير على الكارت "ناقص 2".
- الحقول **الإجبارية** (الاسم + وسيلة تواصل) مش بتدخل هنا لأصلًا مينفعش تتحفظ من غيرها.

### 3.6 الـ Indexes (عشان يستحمل داتا كتير)
```sql
-- كل الـ indexes partial على الـ rows اللي مش ممسوحة، فبتبقى أصغر وأسرع
create index leads_list_idx      on leads (owner_id, created_at desc, id desc) where deleted_at is null;
create index leads_stage_idx     on leads (owner_id, stage, created_at desc)  where deleted_at is null;
create index leads_followup_idx  on leads (owner_id, next_follow_up_on)
                                 where deleted_at is null and next_follow_up_on is not null;
create index leads_industry_idx  on leads (owner_id, industry_id) where deleted_at is null;
create index leads_country_idx   on leads (owner_id, country_code) where deleted_at is null;
create index leads_search_trgm   on leads using gin (search_text gin_trgm_ops) where deleted_at is null;

-- كشف التكرار، والـ DB نفسها بتمنعه
create unique index leads_ig_unique on leads (owner_id, instagram_handle)
  where deleted_at is null and instagram_handle is not null;
create unique index leads_wa_unique on leads (owner_id, whatsapp_e164)
  where deleted_at is null and whatsapp_e164 is not null;

create index leads_import_idx    on leads (import_job_id) where import_job_id is not null;
create index leads_missing_idx   on leads using gin (missing_fields) where deleted_at is null;  -- فلتر "بيانات ناقصة"

create index events_stats_idx on lead_events (owner_id, type, occurred_at) where undone_at is null;
create index events_lead_idx  on lead_events (lead_id, id desc);
```

### 3.7 تطبيع النص العربي للبحث
```sql
create or replace function normalize_search(t text)
returns text language sql immutable parallel safe as $$
  select lower(
    regexp_replace(
      translate(
        unaccent(coalesce(t, '')),
        'أإآٱىة٠١٢٣٤٥٦٧٨٩',
        'اااايه0123456789'
      ),
      '[ً-ٰٟـ]', '', 'g'   -- التشكيل + الشدة + التطويل (ـ)
    )
  )
$$;
```
| المدخل | بعد التطبيع |
|---|---|
| `أحمـــد` | `احمد` |
| `مُصطفى` | `مصطفي` |
| `عيادة` | `عياده` |
| `٠١٠١٢٣` | `010123` |
| `Dr. Rémy` | `dr. remy` |

**Trigger بيبني `search_text`** عند الـ insert/update وفيه:
`name, company, job_title, instagram_handle, whatsapp digits, industry_other, notes, problems` + **اسم النشاط بالعربي والإنجليزي** + **اسم الدولة بالعربي والإنجليزي**. معنى كده إنك لو كتبت "طبيب" أو "doctor" أو "مصر" هتلاقي النتايج.
- أسماء الدول بنخزنها في جدول صغير `countries(code, name_ar, name_en)`. الـ seed بتاعه ~250 صف وبيتولد من `i18n-iso-countries`.
- لو اسم نشاط اتغير، في Trigger على `industries` بيعيد بناء `search_text` للـ Leads المرتبطة بيه.

### 3.8 Row Level Security
```sql
alter table leads enable row level security;
create policy "own rows" on leads for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
-- نفس الـ policy على: lead_events, industries, settings
-- countries: select لأي authenticated
```
- كل الـ RPC functions نوعها `security invoker`، يعني الـ RLS بيتطبق عليها هي كمان. **مفيش ولا function نوعها `security definer`** إلا `handle_new_user`، ودي بتعمل الـ settings والأنشطة الافتراضية لما اليوزر يتعمل.
- `updated_at` بيتحدث بـ trigger.

---

## 4. محرك الـ Pipeline (أهم جزء في السيستم)

### 4.1 تعريف المراحل (مصدر واحد للحقيقة: `src/features/pipeline/stages.ts`)
| # | Stage | المجموعة | اللون | معناها |
|---|---|---|---|---|
| 1 | `new` | inbox | رمادي | اتضاف ولسه محدش كلمه |
| 2 | `message_sent` | waiting | أزرق | الرسالة الأولى اتبعتت |
| 3 | `follow_up_1` | waiting | أزرق غامق | المتابعة 1 اتبعتت |
| 4 | `follow_up_2` | waiting | بنفسجي | المتابعة 2 اتبعتت |
| 5 | `follow_up_3` | waiting | بنفسجي غامق | المتابعة 3 اتبعتت |
| 6 | `replied` | active | أصفر/كهرماني | العميل رد |
| 7 | `meeting_booked` | active | برتقالي | الميتنج اتحجز |
| 8 | `proposal_sent` | active | تركواز | العرض اتبعت |
| 9 | `won` | closed | أخضر | اتقفل لصالحنا ✅ |
| 10 | `lost` | closed | أحمر | اتقفل وخسرناه |

> كل مرحلة ليها **لون وأيقونة** مع بعض، عشان الـ accessibility وعشان اللي عنده عمى ألوان.

### 4.2 الأكشنز ومصفوفة الانتقالات
| Action (الزرار) | مسموح من | يروح لـ | العواميد اللي بتتحدث |
|---|---|---|---|
| `send_message` | `new` | `message_sent` | `first_message_at = last_contacted_at = now`, `next_follow_up_on = today + fu1` |
| `send_follow_up` | `message_sent` / `fu1` / `fu2` | المرحلة اللي بعدها | `follow_ups_sent += 1`, `last_contacted_at = now`, `next_follow_up_on = today + (fu2 \| fu3 \| give_up)` |
| `reply_received` | `new`*, `message_sent`, `fu1..3` | `replied` | `replied_at = now`, `next_follow_up_on = null` |
| `book_meeting` | `replied`, `message_sent..fu3`* | `meeting_booked` | `meeting_booked_at = now`, `meeting_at = payload` (اختياري), `next_follow_up_on = null`. ولو `replied_at` فاضي، بيتسجل هو كمان |
| `send_proposal` | `replied`, `meeting_booked` | `proposal_sent` | `proposal_sent_at = now` |
| `mark_won` | أي مرحلة غير `won`/`lost` | `won` | `won_at = now`, `next_follow_up_on = null` |
| `mark_lost` | أي مرحلة غير `won`/`lost` | `lost` | `lost_at = now`, `lost_reason = payload`, `next_follow_up_on = null` |
| `reopen` | `won` / `lost` | المرحلة اللي بيختارها اليوزر | بيمسح `won_at`/`lost_at` |
| `set_reminder` | أي مرحلة | نفس المرحلة | `next_follow_up_on = payload.date`, `reminder_note` |
| `clear_reminder` | أي مرحلة غير waiting | نفس المرحلة | بيمسح `next_follow_up_on` و `reminder_note` (زرار "تم" على التذكير) |
| `snooze` | أي Lead عليه تاريخ مستحق | نفس المرحلة | `next_follow_up_on += N` |
| `restart` | `follow_up_3` (خلصت المتابعات) أو `lost` | `new` | بيصفّر عداد المتابعات، والـ Event بيفضل محفوظ في التاريخ |
| `set_stage` | أي مرحلة | أي مرحلة | **Override يدوي** عشان المرونة. الـ Event بيتسجل `stage_set` |

\* *الرد ممكن ييجي قبل ما نبعت أصلًا (العميل كلمنا الأول)، أو العميل ممكن يحجز ميتنج على طول. السيستم بيقبل الحالات دي ومش بيرفضها.*

### 4.3 الـ RPC: `lead_action`
```sql
create or replace function lead_action(
  p_lead_id uuid,
  p_action  text,
  p_payload jsonb default '{}',
  p_expected_stage lead_stage default null   -- حماية من التعارض لو اليوزر فاتح من جهازين
) returns leads
language plpgsql security invoker as $$
declare
  v_lead  leads;
  v_set   settings;
  v_today date;
  v_prev  jsonb;
  v_to    lead_stage;
begin
  select * into v_lead from leads
   where id = p_lead_id and deleted_at is null
   for update;                                   -- قفل الصف لحد آخر الـ transaction
  if not found then raise exception 'LEAD_NOT_FOUND' using errcode = 'P0002'; end if;

  if p_expected_stage is not null and v_lead.stage <> p_expected_stage then
    raise exception 'STAGE_CONFLICT' using errcode = 'P0001', detail = v_lead.stage::text;
  end if;

  select * into v_set from settings where owner_id = auth.uid();
  v_today := (now() at time zone v_set.timezone)::date;

  -- snapshot للعواميد اللي ممكن تتغير، عشان الـ Undo
  v_prev := jsonb_build_object(
    'stage', v_lead.stage, 'stage_changed_at', v_lead.stage_changed_at,
    'first_message_at', v_lead.first_message_at, 'last_contacted_at', v_lead.last_contacted_at,
    'follow_ups_sent', v_lead.follow_ups_sent, 'next_follow_up_on', v_lead.next_follow_up_on,
    'replied_at', v_lead.replied_at, 'meeting_booked_at', v_lead.meeting_booked_at,
    'meeting_at', v_lead.meeting_at, 'proposal_sent_at', v_lead.proposal_sent_at,
    'won_at', v_lead.won_at, 'lost_at', v_lead.lost_at, 'lost_reason', v_lead.lost_reason,
    'reminder_note', v_lead.reminder_note);

  case p_action
    when 'send_message' then
      perform assert_stage(v_lead.stage, array['new']::lead_stage[]);
      update leads set stage = 'message_sent', stage_changed_at = now(),
             first_message_at = now(), last_contacted_at = now(),
             next_follow_up_on = v_today + v_set.fu1_after_days
       where id = p_lead_id returning * into v_lead;
    when 'send_follow_up' then
      ...  -- نفس النمط: نحدد المرحلة الجاية والمدة من الإعدادات
    -- ... باقي الأكشنز
    else raise exception 'UNKNOWN_ACTION';
  end case;

  insert into lead_events (lead_id, type, from_stage, to_stage, prev_state, meta)
  values (p_lead_id, action_to_event(p_action), (v_prev->>'stage')::lead_stage,
          v_lead.stage, v_prev, p_payload);

  return v_lead;
end $$;
```
- **أكواد الأخطاء** ليها أسماء ثابتة (`INVALID_TRANSITION`, `STAGE_CONFLICT`, `LEAD_NOT_FOUND`)، والـ UI بيترجمها لرسايل مفهومة.

### 4.4 الـ Undo: `undo_lead_event(p_event_id)`
- مسموح بس **لآخر Event على الـ Lead** ده، وفي خلال **10 دقايق** من حصوله.
- بيرجّع العواميد من `prev_state`، وبيحط `undone_at = now()` على الـ Event (من غير ما يمسحه، عشان الـ audit).
- في الـ UI: Toast مكتوب فيه "تم نقل أحمد إلى Message Sent" وجنبه زرار **تراجع**، والـ Toast بيفضل ظاهر 6 ثواني. وفي الـ Timeline في كمان زرار "تراجع" على آخر Event، وبيفضل ظاهر الـ 10 دقايق كلهم.

### 4.5 الـ Optimistic UI
1. اليوزر يضغط على الزرار، فالـ Cache بيتحدث **في نفس اللحظة** (أقل من 16ms): الكارت يغيّر لونه، وينتقل من قايمة المتابعات.
2. الـ RPC بيتبعت للسيرفر.
3. لو نجح: الـ Cache بيتحدث بالـ row الحقيقي اللي رجع، وبيحصل invalidate لـ `dashboard-stats` و `follow-up-queue` و `stage-counts`.
4. لو فشل: الـ UI بيرجع زي ما كان (Rollback)، ويظهر Toast بالخطأ. ولو الخطأ كان `STAGE_CONFLICT`، بيعمل refetch ويقول "الـ Lead ده اتحدّث من جهاز تاني".
- **الأزرار بتتقفل** وقت التنفيذ (`isPending`)، فمش ممكن تضغط مرتين بالغلط.

---

## 5. الفيتشرز بالتفصيل (من الألف للياء)

### F1. تسجيل الدخول (Auth)
**السلوك**
- صفحة `/login` فيها Email و Password. **مفيش صفحة تسجيل حساب**، و Signups مقفولة من إعدادات Supabase.
- اليوزر الوحيد بيتعمل مرة واحدة من Supabase Dashboard (من Authentication ثم Add user).
- "نسيت كلمة السر" بتبعت لينك على الإيميل، وبتوديه لـ `/auth/callback` ثم `/reset-password`.
- الـ Session بتتجدد أوتوماتيك (refresh token)، واليوزر بيفضل مسجل دخول على جهازه.

**التنفيذ**
- `src/lib/supabase/server.ts` و `client.ts` باستخدام `@supabase/ssr`.
- `src/proxy.ts` (اسمه كان middleware قبل Next 16): بيحدّث الـ session، وأي route غير `/login` و `/auth/*` و `/reset-password` من غير session بيتحوّل لـ `/login?next=<path>`.
- بعد ما اليوزر يسجل دخول بيرجع للـ `next`، **بعد ما نتأكد إنه path داخلي** (يبدأ بـ `/` ومش `//`)، عشان نمنع Open redirect.
- `signOut` موجود في قايمة الإعدادات.

**UX**
- الـ autofocus على خانة الإيميل، و `autocomplete="email"` و `current-password`، فمدير كلمات السر بيشتغل معاها.
- زرار تبيّن أو تخفي كلمة السر.
- رسالة خطأ واحدة عامة "البيانات غير صحيحة"، ومش بنقول أنهي حقل اللي غلط.
- الزرار عليه Spinner وبيتقفل وقت التحميل، و Enter بيعمل submit.
- الـ Rate limit بيتعمل من Supabase Auth لوحده، ولو اتقفل بنعرض رسالة "حاول بعد دقيقة".

**Edge cases:** لو الـ session خلصت وإنت في نص شغلك، الطلب الجاي بيرجع 401، فبنعمل redirect لـ `/login?next=...` من غير ما أي داتا تضيع، لأن الفورم بيحفظ الـ draft في localStorage.

---

### F2. إضافة وتعديل Lead
**مكانها**
- **ديسكتوب:** زرار "+ Lead جديد" (أو اختصار `N`) بيفتح **Dialog**.
- **موبايل:** زرار عائم (FAB) بيفتح **Bottom Sheet** بطول الشاشة كلها.

**الفورم على طبقتين (Progressive disclosure)**
- **الطبقة الأولى (ظاهرة دايمًا، وكفاية لوحدها):**
  1. Instagram (فيها autofocus)
  2. الاسم
  3. النشاط
  4. الدولة (قيمتها الافتراضية من الإعدادات، أو آخر دولة اخترتها)
- **الطبقة التانية "تفاصيل أكتر ▾":** الشركة، المنصب، الواتساب، الـ Qualification (3 أزرار segmented)، المشاكل، الملاحظات.
- زرارين: **حفظ** و **حفظ وإضافة آخر** (`Ctrl/⌘+Enter`). التاني بيفضّي الفورم ويرجّع الـ focus لخانة الإنستجرام، وده بيفرق جدًا في الإدخال بالجملة.
- **اختياري في نفس الفورم:** Checkbox اسمه "تم إرسال رسالة بالفعل". لو اخترته، الـ Lead بيتعمل وبعدها بيتعمل `send_message` على طول، فبتوفر خطوة.

**حقل الإنستجرام (أذكى حقل في الفورم)**
- بيقبل: `@handle` أو `handle` أو أي لينك (`instagram.com/handle`، `m.instagram.com/handle/?igsh=..`، `instagr.am/handle`).
- لما تلصق أو تعمل blur، بيتحول لـ `handle` نضيف، ويظهر تحته **Chip** فيه `@ahmed.re ↗` ولما تدوس عليه بيفتح البروفايل في تاب جديدة.
- **كشف التكرار فورًا:** بعد 300ms debounce بنستدعي `check_duplicate(handle, phone)`. لو الحساب موجود يظهر تنبيه أصفر "الحساب ده موجود بالفعل: **أحمد** (Message Sent) [افتح]"، وزرار الحفظ يتقفل. الـ unique index في الداتابيز موجود كخط دفاع تاني.
- لو اللينك بتاع **بوست** (`/p/` أو `/reel/`) مش بروفايل: بنقول "ده لينك بوست، الصق لينك البروفايل".

```ts
// src/lib/normalize/instagram.ts
const RESERVED = new Set(['p', 'reel', 'reels', 'stories', 'explore', 'accounts', 'direct', 'tv']);
export function parseInstagram(input: string): { handle: string } | { error: 'post_link' | 'invalid' } {
  const s = input.trim();
  const m = s.match(/^(?:https?:\/\/)?(?:www\.|m\.)?(?:instagram\.com|instagr\.am)\/([^/?#\s]+)/i);
  const raw = (m ? m[1] : s.replace(/^@/, '')).toLowerCase();
  if (RESERVED.has(raw)) return { error: 'post_link' };
  if (!/^[a-z0-9._]{1,30}$/.test(raw)) return { error: 'invalid' };
  return { handle: raw };
}
export const instagramUrl = (h: string) => `https://www.instagram.com/${h}/`;
```

**حقل الواتساب**
- Input واحد. بنعمل parse بـ `libphonenumber-js` ونستخدم **دولة الـ Lead كـ default region**، فلو كتبت `01012345678` والدولة مصر، الرقم بيتحول لـ `+201012345678`.
- بيقبل الأرقام الهندية (٠١٠...)، والمسافات، والشُرَط.
- لو الرقم مش valid: "الرقم غير صحيح لـ مصر".
- عند العرض: زرار **WhatsApp ↗** بيفتح `https://wa.me/201012345678`.

**النشاط:** Select بيعرض الأنشطة الـ active بالترتيب. لو اخترت "أخرى" بيظهر Input اسمه "حدد النشاط".
**الدولة:** Combobox فيه بحث بالعربي والإنجليزي وجنب كل دولة علمها. أكتر 5 دول استخدمتهم بيظهروا فوق.
**الـ Qualification:** أزرار Segmented `Yes / No` (وتقدر تفضّي اختيارك) و `Yes / No / Unknown`، بدل dropdown، عشان تبقى ضغطة واحدة بس.
**المشاكل:** Textarea قصيرة فيها عداد حروف (280).

**التعديل:** في صفحة الـ Lead، كل حقل بيتعدل **inline** وبيتحفظ أوتوماتيك (debounce 600ms أو عند الـ blur)، وبيظهر جنبه مؤشر "محفوظ ✓" أو "جارِ الحفظ…" أو "فشل، إعادة المحاولة".
- **الـ Validation:** نفس الـ zod schema (`leadSchema`) بيتطبق في الفورم وفي الـ inline edit. والـ DB constraints موجودة كخط دفاع أخير.
- **الحذف:** من قايمة `⋯` تختار "حذف"، فيظهر Dialog تأكيد. الحذف Soft (`deleted_at`)، ومعاه Toast فيه **تراجع**.

**الـ Data layer**
```ts
// src/features/leads/api.ts
createLead(input: LeadInput): Promise<Lead>          // insert … select
updateLead(id: string, patch: Partial<LeadInput>)    // update … eq('id', id)
softDeleteLead(id) / restoreLead(id)
checkDuplicate({ handle?, phone?, excludeId? })      // rpc('check_duplicate')
```

---

### F3. قايمة الـ Leads + البحث + الفلترة
**الـ Route:** `/leads?q=&stage=&industry=&country=&qual=&sort=`، وكل الحالة دي محفوظة في الـ URL عن طريق nuqs.

**التخطيط (Layout)**
- **أعلى الصفحة (Sticky):** خانة بحث كبيرة، وزرار "فلاتر" عليه رقم الفلاتر الشغالة، و Select للترتيب.
- **تابات المراحل** (scroll أفقي على الموبايل): `الكل 1,240 · New 300 · Message Sent 410 · FU1 … · Won 12 · Lost 90`. الأرقام دي بتتحدث مع البحث والفلاتر.
- **Chips للفلاتر الشغالة:** كل Chip عليها ✕ تشيلها، وفي زرار "مسح الكل".
- **ديسكتوب:** جدول بأعمدة (الاسم والإنستجرام · النشاط · الدولة · المرحلة · آخر تواصل · المتابعة القادمة · الأكشن الرئيسي).
- **موبايل:** كروت. كل كارت فيه الاسم و @handle، وتحتهم Badge المرحلة، والنشاط والدولة، و"آخر تواصل منذ 3 أيام"، و **زرار الأكشن الرئيسي** على الطرف.

**البحث المرن (الحاجة اللي إنت أكدت عليها)**
- **خانة واحدة** بتدور على كل حاجة: الاسم، والشركة، واليوزرنيم، ورقم الواتساب (حتى لو كتبت جزء منه)، والمنصب، والملاحظات، والمشاكل، واسم النشاط (عربي وإنجليزي)، واسم الدولة (عربي وإنجليزي).
- **تطبيع:** بنطبّق نفس دالة `normalize_search` على الـ query، فـ "احمد" هتلاقي "أحمد"، و "عياده" هتلاقي "عيادة".
- **أكتر من كلمة = AND:** لو كتبت "احمد عقاري" هيطلعلك أحمد اللي نشاطه عقاري.
- **لو لصقت لينك إنستجرام** في البحث، بيتحول لـ handle ويدور عليه بالظبط.
- **لو كتبت رقم** (حتى بالهندي)، بيدور على الواتساب بالأرقام بس.
- **Fuzzy:** لو مفيش نتيجة مطابقة، بنجرب `word_similarity > 0.35` ونعرض "هل تقصد…؟" بأقرب النتايج. ده بيغطي الأخطاء الإملائية زي "مصطفا" بدل "مصطفى".
- **Highlight** للجزء اللي طابق في الاسم.
- الـ debounce **250ms**، وأي طلب قديم بيتلغي بـ `AbortController` لو كتبت حاجة جديدة قبل ما يرجع.
- **مسح سريع:** زرار ✕ جوه الخانة، و `Esc` بيمسح.

**الفلاتر (Sheet جانبي على الديسكتوب، و Bottom sheet على الموبايل)**
- النشاط (اختيار متعدد) · المرحلة (اختيار متعدد) · الدولة (اختيار متعدد وفيه بحث). دول المطلوبين في الـ spec.
- **إضافات للمرونة:** لديه محتوى · يظهر بنفسه · لديه مصور · "عليه متابعة مستحقة" · "عنده واتساب" · تاريخ الإضافة (من/إلى) · **بيانات ناقصة** (أي حقل مهم، أو حقل معين زي "ناقص: الدولة") · **جه من استيراد معين**.
- **زرار "تصدير"** في الهيدر بيصدّر النتايج الحالية Excel (§F9)، وجنبه زرار **"استيراد"** (§F10).
- الفلتر بيتطبق فورًا، ومفيش زرار "تطبيق" على الديسكتوب. على الموبايل في زرار "عرض 124 نتيجة"، والرقم ده لايف.

**الترتيب:** الأحدث (الافتراضي) · الأقدم · آخر تواصل · المتابعة القادمة · الاسم أ–ي · الأكثر صلة (بيتفعّل أوتوماتيك لما تكتب في البحث).

**الـ RPC: `search_leads`**
```sql
search_leads(
  p_query     text default null,
  p_stages    lead_stage[] default null,
  p_industries smallint[] default null,
  p_countries char(2)[] default null,
  p_filters   jsonb default '{}',     -- qualification, has_whatsapp, due, created_from/to
  p_sort      text default 'newest',
  p_cursor    jsonb default null,     -- {"created_at": "...", "id": "..."}
  p_limit     int default 50          -- أقصى قيمة 100
) returns setof leads_list_row
```
- **Keyset pagination** على `(created_at, id)` بدل `OFFSET`، فالسرعة واحدة سواء في الصفحة 1 أو 200.
- **ترتيب "الأكثر صلة":** بيرتّب بـ `similarity(search_text, q)`. النتايج بالترتيب ده مش بتبقى عميقة، فـ OFFSET مقبول هنا بحد أقصى 500.
- **الـ escaping:** `%` و `_` و `\` بنعملهم escape قبل الـ `LIKE`.
- **بيرجّع عواميد القايمة بس** (`leads_list_row`) ومش `notes` كلها، عشان الـ payload يفضل صغير.
- `lead_stage_counts(نفس الفلاتر ما عدا المرحلة)` بترجّع عدد كل مرحلة للتابات في query واحدة (`group by stage`).

**الأداء على الـ client**
- `useInfiniteQuery` بيجيب 50 صف في كل صفحة، و `TanStack Virtual` بيرندر بس الصفوف الظاهرة على الشاشة.
- الصفحة اللي بعدها بتتجاب لما توصل لـ 80% من الـ scroll.
- `placeholderData: keepPreviousData`، فالقايمة مش بترمش وإنت بتغيّر الفلاتر.
- الـ Scroll position بيترجع لمكانه لما ترجع من صفحة Lead (الـ cache موجود و `scrollRestoration`).

**UX (التفاصيل الصغيرة)**
- **Skeleton** وقت أول تحميل (8 كروت رمادية بنفس شكل الكروت الحقيقية)، فالـ layout مش بيتهز.
- **Empty states مختلفة:**
  - مفيش Leads خالص: رسمة بسيطة، وتحتها "ابدأ بإضافة أول Lead" وزرار.
  - مفيش نتايج للبحث: "مفيش نتايج لـ «...»"، وزرارين "امسح البحث" و "امسح الفلاتر".
- الضغط على أي كارت بيفتح صفحة الـ Lead. **الأزرار جوه الكارت** مش بتفتح الصفحة (`stopPropagation`).
- على الديسكتوب: لما تقف بالماوس على صف بيظهر زرار Instagram ↗ وزرار WhatsApp ↗.
- الأرقام بتتعرض بـ `Intl.NumberFormat` (1,240).
- "منذ 3 أيام" بـ `Intl.RelativeTimeFormat` حسب اللغة، ولما تقف عليها بالماوس يظهر التاريخ الكامل.

---

### F4. صفحة الـ Lead (التفاصيل والـ Timeline)
**الـ Route:** `/leads/[id]`. على الديسكتوب ممكن تفتح كمان **Side panel** من القايمة (intercepting route)، فبتشوف الـ Lead من غير ما تسيب مكانك في القايمة.

**التخطيط**
1. **الهيدر:** الاسم (كبير)، و @handle ↗، و WhatsApp ↗، وزرار نسخ، و Badge المرحلة، وقايمة `⋯` (تعديل المرحلة يدويًا · حذف).
2. **شريط الأكشن (Action bar):** على الموبايل **ثابت تحت الشاشة** ودايمًا ظاهر.
   - **زرار رئيسي واحد كبير** على حسب المرحلة (§4.6).
   - **أزرار ثانوية** بتطلع حسب المرحلة: Reply Received · Meeting · Lost · ⏰ تذكير.
3. **كارت "المتابعة القادمة":** "متابعة 2 مستحقة بعد يومين (الخميس 10 أكتوبر)"، ومعاها [تغيير التاريخ] و [تأجيل].
4. **البيانات:** inline edit (§F2).
5. **الـ Qualification:** 3 segmented + المشاكل.
6. **الملاحظات:** Textarea بتكبر لوحدها.
7. **الـ Timeline:** Events بترتيب زمني عكسي.
   ```
   ● Replied                       اليوم 14:20
   ● Follow-up 1 sent              منذ 3 أيام
   ● Message sent                  منذ 5 أيام
   ● Created                       منذ 5 أيام
   ```
   آخر Event عليه زرار "تراجع" لو لسه في الـ 10 دقايق.

**4.6 الزرار الرئيسي الذكي (أهم قرار UX في السيستم)**
| المرحلة الحالية | الزرار الرئيسي | الأزرار الثانوية |
|---|---|---|
| new | **📤 Send Message** | Reply Received · Lost |
| message_sent | **🔁 Follow-up 1 Sent** | Reply Received · Lost |
| follow_up_1 | **🔁 Follow-up 2 Sent** | Reply Received · Lost |
| follow_up_2 | **🔁 Follow-up 3 Sent** | Reply Received · Lost |
| follow_up_3 | **💬 Reply Received** | Lost · إعادة المحاولة لاحقًا |
| replied | **📅 Meeting Booked** | Proposal Sent · Won · Lost · تذكير |
| meeting_booked | **📄 Proposal Sent** | Won · Lost · تذكير |
| proposal_sent | **🏆 Won** | Lost · تذكير |
| won / lost | **↩︎ إعادة فتح** | — |

> **الأساس:** اليوزر مش محتاج يفكر "أعمل إيه دلوقتي". الخطوة اللي جاية **دايمًا** هي الزرار الكبير. ولو عايز أي حاجة تانية، فيه dropdown بكل المراحل كـ override.

**Dialogs صغيرة لما الأكشن محتاج بيانات (وكلها اختيارية وتقدر تتخطاها):**
- **Meeting Booked:** "موعد الميتنج؟" فيها date و time، وزرار "تخطّي".
- **Lost:** 5 chips للسبب، وتقدر تتخطى.
- **تذكير:** اختيارات سريعة (بكرة · بعد 3 أيام · الأسبوع الجاي · اختيار تاريخ)، وملاحظة قصيرة.

---

### F5. صفحة المتابعات (`/follow-ups`)
**الهدف:** تفتح الصفحة الصبح، تخلّص القايمة كلها، وتقفل. كأنها **Inbox Zero** للمتابعات.

**الـ Sections بالترتيب**
1. **🔴 مستحقة اليوم والمتأخرة:** الـ Leads اللي `next_follow_up_on <= today` ومرحلتها waiting، **ومقسمة بالترتيب المطلوب**:
   - **Follow Up 1:** الـ Leads اللي في `message_sent` ومستحقين.
   - **Follow Up 2:** الـ Leads اللي في `follow_up_1` ومستحقين.
   - **Follow Up 3:** الـ Leads اللي في `follow_up_2` ومستحقين.
   - جوه كل مجموعة الترتيب **بالأقدم تأخيرًا الأول**، ثم بتاريخ آخر تواصل.
2. **⏰ تذكيرات اليوم:** Leads في `replied` أو `meeting_booked` أو `proposal_sent` عليها تذكير مستحق. وبيظهر جنبها `reminder_note`.
3. **📅 ميتنجات النهارده:** الـ Leads اللي `meeting_at` بتاعها النهارده (لو التاريخ متسجل).
4. **⚪ خلصت المتابعات:** `follow_up_3` وعدّى عليها `give_up_after_days`. زرارين: **Lost (مردّش)** و **أعد المحاولة بعد 30 يوم**.
5. **🕐 لم يردوا بعد (Waiting):** كل اللي في `message_sent` أو `fu1..3` **ومش مستحقين لسه**. مرتبين بالأقرب في الاستحقاق، وكل واحد مكتوب جنبه "المتابعة 2 بعد يومين". الـ section ده **مقفول (collapsed) افتراضيًا** وعليه عدد الـ Leads، عشان ميشتّتكش عن المستحق.

**الكارت في صفحة المتابعات**
```
┌──────────────────────────────────────────────┐
│ أحمد سامي · @ahmed.re ↗   🟦 Follow Up 1      │
│ مستشار عقاري · 🇪🇬   آخر تواصل منذ 4 أيام      │
│ ⚠️ متأخرة يومين                                │
│ [💬 فتح DM]  [✓ تم إرسال المتابعة]  [⋯]        │
└──────────────────────────────────────────────┘
```
- **[💬 فتح DM]** بيفتح بروفايل الإنستجرام (أو الواتساب لو مفيش إنستجرام) في تاب جديدة. ولما ترجع للتاب، بيظهر للحظة **highlight** على زرار "تم" عشان يفكّرك تدوس عليه.
- **[✓ تم]** بيعمل `send_follow_up`، والكارت **بيختفي بأنيميشن** (150ms collapse) ويظهر Toast فيه "تراجع".
- **[⋯]** فيها: Reply Received · Lost · تأجيل (يوم / 3 أيام / أسبوع) · فتح الـ Lead.
- **موبايل:** **Swipe** شمال/يمين على الكارت يعمل "تم". الاتجاه بيتعكس حسب الـ RTL، وفيه برضه زرار، فالـ swipe مش الطريقة الوحيدة.

**الهيدر:** "عندك **12** متابعة النهارده" ومعاه Progress bar "خلصت 5 من 12". العدد ده كمان **Badge على أيقونة المتابعات** في الـ Nav.
**لما تخلص كل المتابعات:** شاشة "🎉 خلصت كل متابعات النهارده"، وتحتها "المتابعة الجاية: بكرة (4)".

**الـ RPC: `follow_up_queue()`**
- **Query واحدة** بترجّع كل الـ Leads المطلوبة، ومعاها عمود `bucket` (`due_fu1`, `due_fu2`, `due_fu3`, `reminder`, `meeting_today`, `exhausted`, `waiting`) وعمود `days_overdue`. الـ client بعد كده بيقسّمهم.
- بتستخدم `leads_followup_idx`، فهي سريعة حتى لو عندك 100k Lead.
- الـ "waiting" بيرجع **أول 100 بس** ومعاهم العدد الكلي، ولو عايز الباقي فيه زرار "عرض الكل" بيوديك لـ `/leads?stage=message_sent,follow_up_1,...`.

---

### F6. الـ Dashboard (`/`)
**الـ KPIs المطلوبة (6 كروت)، ومعاها اختيار للفترة:** اليوم · 7 أيام · 30 يوم (الافتراضي) · الشهر ده · الكل
| الكارت | التعريف الدقيق (عشان الأرقام متبقاش غامضة) |
|---|---|
| إجمالي الـ Leads | `count(*)` لكل الـ Leads اللي مش ممسوحة (كل الوقت). وتحتها "+38 في الفترة دي" |
| Leads جدد | الـ Leads اللي **اتضافت** في الفترة. وتحتها "300 لسه متكلموش" (مرحلتهم `new` دلوقتي)، ولو دوست عليها بتفتح القايمة متفلترة |
| رسايل مرسلة | عدد Events `message_sent` و `follow_up_sent` في الفترة. وتحتها التقسيم "120 أولى · 85 متابعة" |
| ردّوا | الـ Leads اللي عندها Event `reply_received` في الفترة (distinct). وتحتها **نسبة الرد** = ردّوا ÷ الرسايل الأولى في الفترة |
| Meetings محجوزة | Events `meeting_booked` في الفترة |
| Won | Events `won` في الفترة. وتحتها نسبة التحويل من Meeting لـ Won |

- كل الـ Events اللي اتعملها Undo (`undone_at is not null`) **مش بتتحسب**.
- **مقارنة بالفترة اللي قبلها:** سهم ↑12% أخضر أو ↓ أحمر تحت كل رقم. (اختياري: تقدر تقفله من الإعدادات)

**إضافات صغيرة بتفرق**
- **كارت "متابعات النهارده: 12"** بلون بارز فوق خالص، وبيوديك لصفحة المتابعات. ده أهم حاجة في الصفحة.
- **توزيع الـ Pipeline الحالي:** Bar أفقي فيه عدد كل مرحلة، ولو دوست على أي جزء بيفتحلك القايمة متفلترة بالمرحلة دي.

**الـ RPC: `dashboard_stats(p_from timestamptz, p_to timestamptz)`**
- **Query واحدة** فيها CTEs وبترجّع JSON واحد بكل الأرقام، للفترة الحالية واللي قبلها.
- بتعتمد على `events_stats_idx`، فوقتها أقل من 50ms حتى لو عندك 500k Event.
- "اليوم" و"الشهر" بيتحسبوا بالـ timezone اللي في الإعدادات.
- الـ cache على الـ client لمدة `staleTime: 60s`، وبيحصل invalidate بعد أي أكشن.

---

### F7. الإعدادات (`/settings`)
- **اللغة:** عربي / English. التغيير بيحصل فورًا: بيكتب الـ Cookie والـ settings في نفس الوقت، ويعمل `router.refresh()`.
- **مواعيد المتابعة:** 4 خانات أرقام (FU1 / FU2 / FU3 / إنهاء)، وتحتهم **مثال لايف بيتحدث**: "لو بعتّ النهارده 8 أكتوبر: FU1 يوم 10، FU2 يوم 13، FU3 يوم 17، ينتهي يوم 22".
  - التغيير هنا بيأثر على **الحسابات الجاية بس**، ومش بيغيّر التواريخ اللي اتحسبت قبل كده. ده مكتوب تحت الإعدادات بوضوح.
- **المنطقة الزمنية:** Select (الافتراضي القاهرة).
- **الدولة الافتراضية**.
- **الأنشطة:** قايمة تقدر ترتبها بالسحب، وتعدّل اسم أي نشاط (عربي/إنجليزي)، وتخفيه أو تظهره، وتضيف نشاط جديد.
- **الحساب:** تغيير كلمة السر، وتسجيل الخروج.
- **البيانات:** لينك لـ **مركز البيانات `/data`** (الاستيراد، والتصدير، والنموذج، والنسخ الاحتياطي، والسجل §F9–F11)، وسلة المحذوفات.

---

### F8. اللغتين (i18n) والـ RTL
- next-intl من غير locale في الـ URL. اللغة بتتقرا من Cookie اسمها `NEXT_LOCALE`، ومنها بيتحط `<html lang dir>` في الـ root layout.
- الترجمات في `messages/ar.json` و `messages/en.json`. الـ Keys typed بـ TypeScript، فلو في key ناقص الـ build بيفشل.
- **أسماء المراحل** بتفضل بالإنجليزي في اللغتين (زي ما الفريق متعود)، بس جنبها **وصف عربي في tooltip**. ده قرار تقدر تغيّره (§17 سؤال 5).
- **CSS:** ممنوع `ml-`/`mr-`/`left-`/`right-`. بنستخدم بس `ms-`/`me-`/`start-`/`end-`، وفي **ESLint rule** بتمنع الكلاسات التانية.
- الأيقونات اللي ليها اتجاه (أسهم، chevrons) بتتقلب بـ `rtl:rotate-180`.
- الـ handles والأرقام واللينكات بتتعرض جوه `<bdi dir="ltr">`، عشان `@ahmed.re` و `+20 10…` ميتلخبطوش جوه النص العربي.
- **الخطوط:** "IBM Plex Sans Arabic" للعربي و "Inter" للإنجليزي، عن طريق `next/font` (self-hosted ومش بتعمل layout shift).
- **الأرقام:** Latin digits (0–9) في اللغتين لوضوح الأرقام.

---

### F9. مركز البيانات: تصدير Excel من كل صفحة
**المبدأ:** أي داتا تشوفها في أي صفحة، تقدر تنزّلها Excel **بضغطة واحدة**، وبنفس الفلاتر اللي إنت حاططها.

**مكونات مشتركة (بتتكتب مرة واحدة وكل الصفحات بتستخدمها)**
```ts
// src/features/data-hub/export/registry.ts
type ExportSpec<Row> = {
  id: 'leads' | 'follow_ups' | 'dashboard' | 'lead_detail' | 'industries' | 'trash' | 'import_report';
  fileName: (ctx) => string;                 // "scope-leads_2026-10-08_filtered.xlsx"
  sheets: Array<{
    name: string;                            // اسم الشيت مترجم
    columns: ColumnDef<Row>[];               // key, header{ar,en}, width, format(date|number|link|enum)
    fetchPage: (cursor) => Promise<{ rows: Row[]; next: Cursor | null }>;  // نفس الـ RPC بتاع الصفحة
  }>;
};
<ExportButton spec={leadsExportSpec} context={currentFilters} />
```
- **ExportButton** بيفتح Popover فيه:
  - **الصيغة:** Excel (.xlsx) هو الافتراضي، أو CSV.
  - **النطاق:** "النتائج الحالية (124)" أو "الكل (12,034)" أو "المحدد فقط (5)" لو محدد صفوف.
  - **الأعمدة:** Checkboxes لاختيار الأعمدة، والاختيار بيتحفظ لكل صفحة لوحدها في localStorage.
  - **لغة العناوين:** عربي أو إنجليزي (الافتراضي لغة الواجهة).

**إيه اللي بيتصدّر من كل صفحة**
| الصفحة | الشيتات في الملف |
|---|---|
| Leads | Leads (بالفلاتر والترتيب الحاليين) |
| المتابعات | "مستحقة اليوم" (FU1، FU2، FU3) · تذكيرات · ميتنجات اليوم · لم يردوا بعد |
| Dashboard | الأرقام (KPIs) للفترة الحالية والسابقة · توزيع الـ Pipeline · **Leads الفترة** · **أحداث الفترة** (كل رسالة ورد وميتنج) |
| صفحة Lead | بيانات الـ Lead · الـ Timeline |
| الإعدادات | الأنشطة · الإعدادات |
| سلة المحذوفات | المحذوفين |
| تقرير الاستيراد | الصفوف بالحالة والمشاكل (§F10) |

**التنفيذ (من غير تعليق، حتى لو 100 ألف صف)**
1. الـ Main thread بيجيب الداتا صفحة صفحة (كل صفحة 2,000 صف) بنفس الـ RPC والـ cursor، وبيبعتها للـ **Export Worker**.
2. الـ Worker بيكتب الملف بـ **ExcelJS** وبينسّقه:
   - هيدر **Bold وملوّن، ومثبّت** (freeze) وعليه **AutoFilter**.
   - عرض الأعمدة مظبوط.
   - **الشيت بيفتح RTL** لو اللغة عربي.
   - التواريخ **تواريخ حقيقية** مش نص، بتنسيق `yyyy-mm-dd hh:mm` وبتوقيت الإعدادات.
   - لينك الإنستجرام والواتساب **Hyperlink** تدوس عليه يفتح.
   - المراحل ملوّنة بنفس ألوان التطبيق (conditional fill).
3. **Progress bar** فيه "جارِ التحضير… 34,000 / 100,000"، وفيه زرار **إلغاء**.
4. لو الصفوف أكتر من **200,000**، بنقترح CSV (أخف) أو التقسيم لملفات. ده حد أمان عشان ذاكرة المتصفح.
5. **CSV:** UTF-8 **مع BOM**، فـ Excel بيفتح العربي صح من غير ما تعمل حاجة.
- **اسم الملف:** `scope-<الصفحة>_<التاريخ>[_filtered].xlsx`.

---

### F10. مركز البيانات: نموذج Excel والاستيراد في أي وقت
**الصفحة:** `/data` (في الـ Nav: ⚙️ ثم "البيانات"). وفي كمان زرار "استيراد" في صفحة الـ Leads.

#### F10.1 نموذج Excel (Template) جاهز للتحميل
زرار **"تحميل نموذج Excel"** بينزّل ملف فيه 3 شيتات:
1. **Leads:** هيدر بالعربي والإنجليزي (`الاسم / Name`)، وتحته **صف مثال** بلون رمادي (السيستم بيتجاهله لوحده وقت الاستيراد)، و **قوائم منسدلة (Data validation)** على الأعمدة دي:
   - النشاط ← من **أنشطتك الحالية** (يعني النموذج بيتولد لايف، مش ملف ثابت).
   - الدولة ← أسماء الدول.
   - المرحلة ← الـ 10 مراحل.
   - لديه محتوى / يظهر بنفسه ← Yes / No.
   - لديه مصور ← Yes / No / Unknown.
   - والأعمدة الإجبارية عليها علامة ★ ولونها مختلف.
2. **تعليمات:** شرح كل عمود، إيه الإجباري، والشكل المقبول (لينك أو @handle، رقم بكود الدولة أو من غيره…).
3. **قوائم:** القيم المسموحة. ده الشيت اللي القوائم المنسدلة بتقرا منه، ومخفي عن العرض.

#### F10.2 مصادر الاستيراد
| المصدر | إزاي |
|---|---|
| **Excel** `.xlsx` / `.xls` / **ODS** | Drag & drop، أو "اختيار ملف" (على الموبايل بيفتح الملفات والـ Drive) |
| **CSV** | نفس الطريقة. الـ encoding بيتعرف لوحده (UTF-8 / Windows-1256 للعربي القديم)، والفاصل بيتعرف لوحده (`,` `;` Tab) |
| **Google Sheets** | (أ) **لصق لينك الشيت**: بنحوّله لرابط export على السيرفر (`/api/import/google-sheet`). ده محتاج الشيت يكون "أي حد معاه اللينك يقدر يشوف"، وبنقول ده بوضوح مع خطوات الإعداد · (ب) أو File ← Download ← xlsx من Google Sheets وترفعه |
| **لصق (Paste)** | تنسخ صفوف من أي شيت وتلصقها (Ctrl+V) في خانة، فبتتقرا كـ TSV. أسرع حاجة لو عندك 20 صف |
| **ملف نسخة احتياطية** | بيتعرف لوحده، وبيروح لـ "استرجاع" (§F11) |

> **أمان لينك Google Sheets:** الـ Route handler بيقبل **بس** `docs.google.com/spreadsheets/d/<id>` (حماية من SSRF)، وأقصى حجم 50MB، والـ timeout بتاعه 30 ثانية، وبيرجّع الملف للـ Worker يقراه زي أي ملف.

#### F10.3 خطوات الاستيراد (Wizard من 4 خطوات، والشاشة عمرها ما بتعلّق)
**① الرفع والقراءة**
- الملف بيتقري في **Import Worker** (SheetJS). الـ Main thread مش بيلمس الملف خالص، فالـ UI بيفضل ناعم حتى لو الملف 50MB.
- لو الملف فيه أكتر من شيت: تختار الشيت.
- **صف العناوين بيتعرف لوحده:** أول صف فيه أكتر عدد من الخانات النصية. ولو مش مظبوط تقدر تغيّره.
- الصفوف الفاضية تمامًا بتتشال لوحدها، وصف المثال بتاع النموذج كمان.
- **الحدود:** أقصى 50MB، وأقصى 200,000 صف في المرة الواحدة. لو أكتر بنقول "قسّم الملف"، وبنوضّح السبب.

**② ربط الأعمدة (Mapping)**
- **تخمين أوتوماتيك** من اسم العمود بقاموس مرادفات عربي وإنجليزي، مثلًا:
  `name | الاسم | اسم العميل | full name` ← `name`
  `insta | instagram | انستا | انستجرام | ig | link` ← `instagram`
  `phone | whatsapp | واتس | موبايل | رقم` ← `whatsapp`
- **ومن المحتوى كمان:** لو العمود فيه `instagram.com/...` يبقى إنستجرام، ولو أرقام طويلة يبقى واتساب، حتى لو العنوان مش واضح.
- قدام كل عمود Select تختار منه الحقل، ومعاه **عينة من 3 قيم** من الملف عشان تتأكد.
- عمود مش محتاجه؟ اختار "تجاهل". وعمود فيه بيانات إضافية؟ "ضيفه للملاحظات"، فبيتضاف للملاحظات وقدامه اسم العمود. **مفيش داتا بتضيع.**
- **قيم افتراضية** للصفوف اللي فيها الخانة فاضية: الدولة الافتراضية، والنشاط، والمرحلة.
- **تحويل القيم:** النشاط والمرحلة والـ Yes/No بيتطابقوا بمرونة (`نعم/yes/y/1/✓` ← Yes · `دكتور/طبيب/doctor` ← طبيب). ولو في قيمة **مش معروفة**، بيظهر جدول صغير "القيم دي مش معروفة، تطابقها مع إيه؟"، وتقدر كمان "تضيفها كنشاط جديد".
- **الـ Mapping بيتحفظ:** المرة الجاية لو رفعت ملف بنفس العناوين، بيتطبق لوحده ("استخدمنا نفس الربط بتاع آخر مرة").

**③ الفحص والتقرير (أهم شاشة): الكامل، والناقص، والغلط، والمكرر**
- الـ Worker بيعمل **تطبيع وتحقق لكل صف بنفس الـ zod schema** بتاع الفورم: parseInstagram و parsePhone وتحويل الأرقام الهندية. ده بيحصل على دفعات، فالـ Progress bar بيتحرك لحد ما يخلص.
- بعدها الصفوف بتترفع لجدول **`import_rows` (staging)** على دفعات **كل دفعة 1,000 صف** عن طريق RPC `stage_import_rows(job_id, rows jsonb)`.
  - لو النت قطع أو قفلت التاب: الـ job محفوظ في الداتابيز، و `staged_rows` بيقول وصلنا لفين. لما ترجع يظهر "عندك استيراد مكتمل 60%، تكمّل؟" (**Resume**)، والملف بيتعمل له cache في IndexedDB لحد ما الاستيراد يخلص.
- **فحص التكرار على السيرفر** بـ query واحدة (set-based) لكل الصفوف مرة واحدة، مش صف صف:
  - **مكرر في الداتابيز:** نفس الـ handle أو نفس الرقم لـ Lead موجود.
  - **مكرر جوه الملف نفسه:** أول ظهور بيتعلّم عادي، والباقي `duplicate_file`.
- **التقرير** (`/data/imports/[id]`): كروت فوق بالأرقام، وتحتها تابات:

| التاب | المعنى | الإجراء الافتراضي |
|---|---|---|
| ✅ **كامل** (480) | كل الحقول المهمة موجودة وصحيحة | استيراد |
| 🟡 **ناقص** (30) | صالح للاستيراد بس ناقصه حاجات مهمة (النشاط، الدولة، الـ qualification…) ومكتوب قدامه "ناقص: الدولة، المنصب" | استيراد، وبيتعلّم عليه "بيانات ناقصة" عشان تكمّله بعدين |
| 🔴 **غلط** (5) | ميتحفظش: من غير اسم، أو من غير أي وسيلة تواصل، أو الرقم غلط، أو لينك بوست بدل بروفايل… ومعاه **السبب بالظبط** والعمود | تخطّي، لحد ما تصلّحه |
| 🔁 **مكرر في السيستم** (15) | موجود قبل كده، وبيتعرض **جنب بعض: القديم والجديد** والفرق متعلّم عليه | تختار: **تخطّي** (الافتراضي) / **تحديث الخانات الفاضية بس** / **استبدال الكل** |
| 🔂 **مكرر في الملف** (3) | نفس الحساب متكرر جوه الملف | ناخد أول ظهور |

- **التصليح جوه الصفحة:** أي صف غلط أو ناقص تقدر **تعدّله inline** في الجدول، وبيتفحص تاني فورًا وينتقل للتاب الصح.
- **إجراءات جماعية:** "تخطّي كل الناقص" · "حدّث كل المكرر" · "طبّق الدولة X على كل الصفوف اللي من غير دولة".
- **"نزّل الصفوف اللي فيها مشاكل Excel":** ملف فيه نفس أعمدتك الأصلية وزيادة عمود **"المشكلة"**. تصلّحه على اللابتوب وترفعه تاني، والتكرارات مع اللي اتضاف هتتعرف لوحدها.
- الجدول نفسه **Virtualized** وبيتحمّل من السيرفر صفحة صفحة، فلو في 200 ألف صف الصفحة برضه مش بتتقل.

**④ التنفيذ (Commit)**
- قبل التنفيذ، السيستم بياخد **نسخة احتياطية تلقائية** (`kind = 'pre_import'`)، وبيتعمل ده بس لو الاستيراد أكتر من 500 صف.
- التنفيذ بـ RPC `commit_import(job_id, batch_size => 2000)`:
  - **Set-based:** `insert into leads (...) select ... from import_rows where ... limit 2000` بدل ما ندخّل صف صف. 2,000 صف بياخدوا أقل من ثانية.
  - **كل دفعة في transaction لوحدها:** لو حاجة فشلت في النص، اللي اتعمل بيفضل سليم، وتقدر تكمّل من نفس النقطة.
  - الـ client بينادي الدفعات ورا بعض، والـ Progress بيتحدث "8,000 / 12,000"، وتقدر **تلغي** في أي وقت.
  - كل Lead بيتعمله Event `created` وعليه `meta.import_job_id`. ولو في عمود مرحلة متحدد، بنحط `stage` و `stage_changed_at` من غير Events وهمية، عشان إحصائيات الـ Dashboard متتلخبطش.
  - `search_text` و `missing_fields` بيتحسبوا بنفس الـ triggers.
- **النتيجة:** "✅ اتضاف 480 · اتحدّث 15 · اتخطّى 8"، وفيها لينكات "عرض اللي اتضافوا" (فلتر `import_job_id`) و "عرض الناقصين".
- **Rollback:** "تراجع عن الاستيراد ده" متاح لمدة **7 أيام**. الـ Leads اللي اتضافت بيتعملها soft delete، واللي اتحدّثت بترجع لقيمها القديمة (القيم القديمة محفوظة في `import_rows.raw_before`).
- **السجل:** `/data/imports` فيه كل الاستيرادات اللي فاتت (التاريخ، اسم الملف، الأرقام، الحالة، زرار فتح التقرير).
- **التنضيف:** صفوف الـ staging بتتمسح لوحدها بعد 30 يوم (pg_cron).

#### F10.4 ليه التصميم ده مش هيعلّق مع داتا ضخمة؟
| المشكلة | الحل |
|---|---|
| قراءة ملف كبير بتجمّد الصفحة | **Web Worker**، فالـ Main thread فاضي للـ UI |
| رفع 200 ألف صف في Request واحد بيفشل | **دفعات 1,000 صف**، و **Resume** لو حصل أي حاجة |
| فحص التكرار صف صف بطيء (200k query) | **Query واحدة set-based** بتعمل `join` على الـ unique indexes |
| الإدخال صف صف بطيء | `insert … select` بدفعات 2,000 جوه transaction |
| Transaction واحدة كبيرة بتعمل lock طويل | Transactions صغيرة ومستقلة، فالسيستم بيفضل شغال عادي وإنت بتستورد |
| عرض 200 ألف صف في جدول | Virtualization + server pagination |
| Timeout في الداتابيز | كل استدعاء أقل من 2 ثانية بالتصميم، والـ `statement_timeout` محدد |

---

### F11. النسخ الاحتياطي المجدول والتنبيهات والاسترجاع
**الهدف:** إن داتاك **دايمًا** يكون منها نسخة على اللابتوب، وبالمعاد اللي إنت تختاره، والسيستم **يفكّرك** لحد ما تنزّلها.

#### F11.1 الإعدادات (`/data/backups` ← "الجدولة")
- **التكرار:** يومي · أسبوعي (الافتراضي) · كل أسبوعين · شهري · مقفول.
- **اليوم:** (لو أسبوعي) أي يوم في الأسبوع · (لو شهري) يوم 1–28.
- **الساعة:** الافتراضي 9 الصبح بتوقيتك.
- **الصيغة:** Excel (xlsx فيه كل الشيتات، **الافتراضي**) · CSV مضغوط (zip) · JSON (نسخة كاملة 100% مخصوصة للاسترجاع).
- **تحتفظ بكام نسخة على السيرفر:** الافتراضي آخر 8 نسخ.
- **التنبيهات:** ☑ جوه التطبيق · ☑ Push على الموبايل واللابتوب · ☐ إيميل.
- تحت الإعدادات جملة لايف: "النسخة الجاية: **الجمعة 10 أكتوبر 9:00 ص**".

#### F11.2 إزاي النسخة بتتعمل (على السيرفر، حتى لو التطبيق مقفول)
1. **pg_cron** بيشتغل كل ساعة، وبيدوّر على `backup_settings` اللي `next_run_at <= now()`.
2. بينادي **Edge Function** اسمها `generate-backup` عن طريق **pg_net**، ومعاه secret في الـ header.
3. الـ Function:
   - بتقرا الجداول على دفعات: leads، و lead_events، و industries، و settings.
   - بتكتب الملف: xlsx فيه شيتات (معلومات النسخة · Leads · Timeline · الأنشطة · الإعدادات)، أو zip، أو json.
   - بترفعه على Storage `backups/{owner_id}/{date}.xlsx`، وبتحسب **sha256** وعدد الصفوف.
   - بتحدّث `backups` وتخليه `ready`، وتحسب `next_run_at` الجاي، وتمسح النسخ اللي أقدم من `keep_last`.
4. **التنبيه** بيتبعت:
   - **Push:** "📦 نسختك الاحتياطية الأسبوعية جاهزة (12,034 Lead). اضغط للتحميل". لما تدوس عليه، بيفتح التطبيق على التحميل على طول.
   - **إيميل** (لو مفعّل): فيه لينك تحميل **signed URL صالح 7 أيام**.
   - **جوه التطبيق:** Banner فوق: "عندك نسخة احتياطية جاهزة ومتنزّلتش. [تحميل] [بعدين]".
5. **التنبيه بيتكرر** (الـ Banner كل مرة تفتح، والـ Push بعد 24 ساعة) **لحد ما تنزّل النسخة**. لما تحمّلها بيتسجل `downloaded_at` والتنبيه بيقف.
- لو النسخة **فشلت**: بنعيد المحاولة مرتين، وبعدها تنبيه "فشل عمل النسخة الاحتياطية"، والخطأ بيتبعت Sentry.
- **الحجم:** النسخة لـ 100 ألف Lead مع 400 ألف Event تقريبًا 15–25MB xlsx، والـ Edge Function بتقدر عليها. ولو كبرت عن كده، النسخة بتتحول لـ CSV zip بالـ streaming لوحدها.

#### F11.3 التحميل على اللابتوب (سهل لأقصى درجة)
- **صفحة `/data/backups`:** قايمة بكل النسخ (التاريخ، النوع، الحجم، عدد الـ Leads، ✓ لو اتحمّلت)، وجنب كل نسخة زرار **تحميل**.
- **"حفظ تلقائي في فولدر على اللابتوب"** (Chrome و Edge على الديسكتوب): تختار فولدر **مرة واحدة** (مثلًا `Documents/Scope Backups`) عن طريق File System Access API. بعد كده أي نسخة جديدة **بتتحفظ فيه لوحدها** أول ما تفتح التطبيق، من غير ما تدوس حاجة. (الصلاحية بتتحفظ في IndexedDB، والمتصفح ممكن يطلب تأكيد بضغطة واحدة كل فترة.)
  - على Safari و Firefox والموبايل: بنرجع لزرار التحميل العادي.
- **"نسخة دلوقتي":** زرار يعمل نسخة يدوية فورًا وينزّلها.

#### F11.4 الاسترجاع (Restore)
- ارفع ملف نسخة (xlsx أو json)، وبيحصل الآتي:
  1. نتأكد إن الملف نسخة Scope سليمة: الإصدار، والـ checksum، والشيتات.
  2. **Preview:** "النسخة دي من 3 أكتوبر، فيها 11,800 Lead. عندك دلوقتي 12,034".
  3. تختار:
     - **دمج** (الافتراضي): يضيف اللي ناقص بس، ومش بيلمس الموجود.
     - **استبدال كامل:** محتاج تكتب كلمة "استبدال" للتأكيد.
  4. قبل أي استرجاع بيتعمل **نسخة `pre_restore` أوتوماتيك**، فلو غلطت ترجع بضغطة.
  5. التنفيذ بنفس محرك الاستيراد (staging ثم دفعات ثم progress).

#### F11.5 مستوى حماية تاني (من غير ما تعمل حاجة)
- GitHub Action بيعمل `pg_dump` يومي ومشفّر (§10). ده خط دفاع على مستوى الداتابيز كلها، ومستقل عن التطبيق.

---

### F12. مبادئ الكفاءة والمرونة (بتتطبق على **كل** فيتشر من غير استثناء)
1. **ولا عملية تقيلة على الـ Main thread:** أي حاجة ممكن تاخد أكتر من 50ms (قراءة ملفات، كتابة Excel، تحقق من آلاف الصفوف) بتروح Web Worker.
2. **ولا Request بيشيل حاجة "كلها":** كل حاجة بالدفعات (pagination / batching)، ومعاها **cursor**.
3. **أي عملية طويلة** (أكتر من ثانية) ليها: Progress حقيقي (مش spinner) · زرار إلغاء · Resume لو اتقطعت · نتيجة واضحة في الآخر.
4. **أي عملية بتغيّر داتا ليها رجوع:** Undo للأكشنز · Rollback للاستيراد · نسخة pre_restore/pre_import · Soft delete.
5. **مفيش داتا بتضيع بصمت:** أي حاجة السيستم مش فاهمها (عمود مش معروف، قيمة غريبة) بيسألك عليها أو بيحطها في الملاحظات، وعمره ما بيرميها.
6. **التحقق في مكان واحد:** نفس الـ zod schema في الفورم والـ inline edit والاستيراد، ونفس الـ DB constraints كخط أخير.
7. **Set-based في الداتابيز:** أي عملية على أكتر من صف بتبقى query واحدة، مش loop.
8. **كل حاجة ليها مقياس:** هدف أداء رقمي واضح لكل فيتشر (§8)، وبيتختبر على 100k صف قبل الإطلاق.
9. **المرونة من غير تعقيد:** الافتراضي دايمًا بيشتغل من غير ما تفكر، والخيارات المتقدمة موجودة بس مخفية لحد ما تحتاجها.

---

## 6. الـ UI/UX: النظام العام

### 6.1 التنقل (Navigation)
- **موبايل:** Bottom nav فيه 4 أيقونات: 🏠 الرئيسية · 👥 Leads · 🔔 المتابعات (عليها Badge بالعدد) · ⚙️ الإعدادات. وفي FAB (+) فوقهم.
- **ديسكتوب:** Sidebar ضيق فيه نفس الأيقونات ومعاها النص، وزرار "+ Lead جديد" بارز.

### 6.2 اختصارات الكيبورد (ديسكتوب)
| الاختصار | الأكشن |
|---|---|
| `/` | فوكس على البحث |
| `N` | Lead جديد |
| `G` ثم `D` / `L` / `F` | الذهاب للـ Dashboard / Leads / Follow-ups |
| `J` / `K` | الصف اللي بعده / اللي قبله في القايمة |
| `Enter` | فتح الـ Lead |
| `E` | تنفيذ الزرار الرئيسي للـ Lead المحدد |
| `Ctrl/⌘+Z` | تراجع عن آخر أكشن (في خلال الـ 10 دقايق) |
| `?` | عرض كل الاختصارات |

### 6.3 التفاصيل الصغيرة
- **مساحات اللمس 44px على الأقل** لكل زرار على الموبايل.
- **Focus ring** واضح لما تتنقل بالكيبورد (`focus-visible`).
- **Dark mode** بيتبع إعداد الجهاز، وفيه زرار تبديل. التكلفة تقريبًا صفر مع shadcn tokens.
- **Haptic feedback** بسيط (`navigator.vibrate(10)`) على Android لما تدوس "تم" في المتابعات.
- **Offline:** لو النت قطع يظهر Banner "أنت غير متصل"، والأزرار اللي بتكتب داتا بتتقفل. القراءة من الـ cache بتفضل شغالة.
- **Toasts:** تحت في النص على الموبايل (فوق الـ Bottom nav)، وتحت في الطرف على الديسكتوب.
- **Copy buttons** على الـ handle والرقم، ولما تدوس يظهر "تم النسخ ✓".
- **الـ Titles:** `document.title` بيتغير حسب الصفحة "(12) المتابعات · Scope CRM"، والعدد بيبان في التاب.
- **Prefetch:** الـ links بتتعمل prefetch لما تقف عليها بالماوس، والتنقل بين الصفحات تقريبًا فوري.
- **Loading:** Skeletons بس، ومفيش spinners بتغطي الشاشة كلها خالص.
- **Error boundaries** لكل صفحة، بتعرض "حصل خطأ" وزرار "إعادة المحاولة"، والخطأ بيتبعت لـ Sentry.
- **Confirm dialogs** للحاجات اللي مبتترجعش بس (المسح النهائي)، لأن كل حاجة تانية فيها Undo. كتر الـ confirms بيضايق.

---

## 7. هيكل المشروع
```
scope-crm/
├─ src/
│  ├─ app/
│  │  ├─ (auth)/login/page.tsx
│  │  ├─ (auth)/reset-password/page.tsx
│  │  ├─ auth/callback/route.ts
│  │  ├─ (app)/layout.tsx              # Shell: nav + providers + auth guard
│  │  ├─ (app)/page.tsx                # Dashboard
│  │  ├─ (app)/leads/page.tsx
│  │  ├─ (app)/leads/[id]/page.tsx
│  │  ├─ (app)/leads/@panel/(.)[id]/page.tsx   # side panel على الديسكتوب
│  │  ├─ (app)/follow-ups/page.tsx
│  │  ├─ (app)/settings/page.tsx
│  │  ├─ (app)/trash/page.tsx
│  │  ├─ (app)/data/page.tsx                 # مركز البيانات
│  │  ├─ (app)/data/imports/page.tsx         # سجل الاستيرادات
│  │  ├─ (app)/data/imports/[id]/page.tsx    # تقرير استيراد (كامل/ناقص/غلط/مكرر)
│  │  ├─ (app)/data/backups/page.tsx         # النسخ + الجدولة + الاسترجاع
│  │  ├─ api/import/google-sheet/route.ts    # جلب Google Sheet (whitelist)
│  │  ├─ api/template/route.ts               # النموذج (أو بيتولد في worker)
│  │  ├─ manifest.ts                   # PWA
│  │  └─ layout.tsx                    # html lang/dir + fonts
│  ├─ features/
│  │  ├─ leads/        {api.ts, queries.ts, schema.ts, components/*}
│  │  ├─ pipeline/     {stages.ts, actions.ts, use-lead-action.ts, components/ActionBar.tsx}
│  │  ├─ follow-ups/   {api.ts, components/*}
│  │  ├─ dashboard/    {api.ts, components/*}
│  │  ├─ settings/     {api.ts, components/*}
│  │  └─ data-hub/
│  │     ├─ export/    {registry.ts, specs/*.ts, ExportButton.tsx, export.worker.ts}
│  │     ├─ import/    {import.worker.ts, header-synonyms.ts, value-matchers.ts,
│  │     │              ImportWizard.tsx, MappingStep.tsx, ReportTable.tsx, resume.ts}
│  │     ├─ template/  {build-template.ts}
│  │     └─ backups/   {api.ts, fs-access.ts, BackupBanner.tsx, push.ts}
│  ├─ components/ui/                   # shadcn
│  ├─ lib/
│  │  ├─ supabase/{client.ts, server.ts}
│  │  ├─ normalize/{instagram.ts, phone.ts, arabic.ts}
│  │  ├─ i18n/{request.ts, config.ts}
│  │  └─ query-keys.ts                 # مصدر واحد لكل الـ query keys
│  ├─ types/database.ts                # بيتولّد بـ supabase gen types
│  └─ proxy.ts
├─ messages/{ar.json, en.json}
├─ supabase/
│  ├─ migrations/0001_init.sql …
│  ├─ functions/generate-backup/       # Edge Function
│  ├─ functions/send-notification/     # Push + Email
│  ├─ seed.sql                         # industries + countries
├─ .tmp/                              # ملفات تحقق مؤقتة (git-ignored، وبتتمسح بعد كل مهمة)
└─ .github/workflows/{ci.yml, backup.yml, migrate.yml}
```

**Query keys (مركزية عشان الـ invalidation يبقى مضبوط)**
```ts
export const qk = {
  leads: (filters: LeadFilters) => ['leads', filters] as const,
  stageCounts: (filters: Omit<LeadFilters, 'stages'>) => ['stage-counts', filters] as const,
  lead: (id: string) => ['lead', id] as const,
  leadEvents: (id: string) => ['lead-events', id] as const,
  followUps: () => ['follow-ups'] as const,
  dashboard: (range: DateRange) => ['dashboard', range] as const,
  settings: () => ['settings'] as const,
};
// بعد أي lead_action ناجح:
// lead(id), leadEvents(id), بعدين invalidate لـ ['leads'] و ['stage-counts'] و ['follow-ups'] و ['dashboard']
```

---

## 8. الأداء والجاهزية لداتا كتير

| الطبقة | الإجراء |
|---|---|
| DB | Partial indexes · GIN trigram · keyset pagination · عواميد القايمة بس (ومش `select *`) · كل الحسابات في query واحدة |
| شبكة | Vercel و Supabase في **نفس المنطقة** (فرانكفورت) · الـ payload لـ 50 Lead أقل من 15KB |
| Client | Virtualization · debounce · AbortController · `keepPreviousData` · optimistic updates · prefetch |
| Bundle | Server Components للـ shell · `libphonenumber-js/min` · dynamic import للـ dialogs التقيلة (import CSV) · الهدف JS أقل من 200KB gzip في أول تحميل |

**أهداف قابلة للقياس (بنتحقق منها في Phase 5)**
- البحث أو الفلترة على **100,000 Lead**: الـ p95 أقل من **150ms** في الداتابيز.
- الـ Dashboard على **500,000 Event**: أقل من **100ms**.
- LCP أقل من **1.8s** على موبايل 4G، و INP أقل من **200ms**.
- الاستجابة لما تدوس أي زرار: **فورية** بفضل الـ optimistic UI.

**اختبار الحِمل:** بيحصل **على مشروع Dev بس، وعمره ما بيحصل على Production**. سكريبت مؤقت في `.tmp/` بيولّد 100k Lead و 400k Event، وبعدين بنشغّل `EXPLAIN ANALYZE` على كل RPC ونتأكد إن **مفيش Seq Scan**. بعد الاختبار **السكريبت والداتا بيتمسحوا** (`supabase db reset` على الـ Dev).

---

## 9. الأمان

- **RLS على كل الجداول.** وبنتحقق بسكريبت مؤقت على الـ Dev إن يوزر تاني **ميقدرش** يقرا أو يعدّل أي row مش بتاعه، وبعدها السكريبت واليوزر التجريبي بيتمسحوا.
- **التسجيل مقفول** (`Enable signups = off`)، و **Email confirmation** شغال.
- **المفاتيح:** على الـ client بس الـ `publishable/anon key`. والـ `service_role` **مبيتحطش** في Vercel خالص، لأننا مش محتاجينه.
- **الـ Validation على 3 مستويات:** zod في الـ client، و constraints و check في الـ DB، وتحقق من الانتقالات جوه الـ RPC.
- **XSS:** React بيعمل escape لأي نص. اللينكات بتتبني من الـ handle بس، فمفيش URL جاي من اليوزر بيتحط في `href` مباشرة. وده بيقفل باب `javascript:` نهائي.
- **Security headers** في `next.config`: CSP، و `X-Frame-Options: DENY`، و `Referrer-Policy: strict-origin-when-cross-origin`، و `Permissions-Policy`.
- **`robots: noindex`** وملف `robots.txt` بيمنع الفهرسة.
- **Open redirect** محمي في `next=` (§F1).
- **اختياري (v1.1):** MFA بـ TOTP عن طريق Supabase Auth MFA، يعني تطبيق Authenticator.

---

## 10. النسخ الاحتياطي (Backups) ⚠️ مهم

- **الخطة المجانية في Supabase مفيهاش backups تلقائية**، والمشروع **بيتوقف (paused) بعد 7 أيام من غير استخدام**.
- **الحل في v1 (مجاني):** GitHub Action اسمها `backup.yml` بتشتغل كل يوم الساعة 3 الفجر:
  `pg_dump`، ثم ضغط، ثم **تشفير بـ age/GPG**، ثم رفع على GitHub Release خاص أو Cloudflare R2. بنحتفظ بآخر 30 نسخة.
- **مستوى تاني (اليوزر متحكم فيه):** النسخ الاحتياطي المجدول من جوه التطبيق بصيغة Excel، ومعاه تنبيهات وحفظ تلقائي في فولدر على اللابتوب، واسترجاع (§F11).
- **لو الداتا بقت مهمة جدًا:** Supabase Pro (‎$25/شهر) فيه backups يومية تلقائية و PITR، ومفيش pause.
- **تجربة الاسترجاع:** مرة واحدة على الأقل قبل v1.0، بنعمل restore في مشروع تاني ونتأكد إن الداتا رجعت سليمة.

---

## 11. الاختبارات: تحقق مؤقت ومن غير ما يفضل أي أثر

**قرارك:** مش هنبني test suite دايمة في الريبو. كل مهمة بتتحقق من نفسها، وبعد التحقق **كل ملفات وداتا الاختبار بتتمسح**.

| القاعدة | التفاصيل |
|---|---|
| مكان ملفات الاختبار | `.tmp/` في جذر المشروع، وهو جوه `.gitignore`، فعمره ما بيوصل للـ Git ولا للـ Production |
| أنواع التحقق | سكريبت SQL مؤقت (بيتشغّل على **مشروع Dev**) · سكريبت TS مؤقت (`tsx .tmp/check-*.ts`) · تجربة يدوية في المتصفح (Claude Browser) · `pnpm typecheck && pnpm lint && pnpm build` |
| بعد التحقق | `rm -rf .tmp/*` + مسح أي داتا اتعملت على الـ Dev (`supabase db reset --linked` على مشروع الـ Dev بس) |
| Production | **ممنوع** يتعمل عليه أي اختبار بيكتب داتا. التحقق على Production بيكون قراءة بس (هل الصفحة بتفتح؟ هل الـ login شغال؟) |
| CI الدايم | `lint` → `typecheck` → `build`، وبس. ده سريع ومش بيسيب أي ملفات اختبار |

> **الـ Tradeoff بوضوح:** من غير test suite دايمة، أي تعديل كبير بعد كده محتاج تحقق يدوي تاني. وعشان نقلل المخاطرة: **قايمة تحقق يدوية ثابتة** (§19.5) بنعيدها قبل كل Deploy كبير.

---

## 12. الـ Deployment والبيئات

| البيئة | الـ Supabase | الـ Vercel | إمتى |
|---|---|---|---|
| Dev | **مشروع Supabase تاني اسمه `scope-crm-dev`** (الخطة المجانية بتسمح بمشروعين، ومش محتاجين Docker على ويندوز) | `next dev` على `localhost:3000` | التطوير والتحقق. الداتا هنا مؤقتة وبتتمسح |
| Production | مشروع `scope-crm` (فرانكفورت) | `main` → Production | بعد ما الـ CI ينجح. **ولا أي داتا تجريبية** |

- **الـ Migrations:** `supabase/migrations` بتتطبق على الـ Production بـ `supabase db push` من GitHub Action (`migrate.yml`) **قبل** الـ deploy. وقاعدة ثابتة: migrations **إضافية بس** (expand/contract)، فمفيش downtime.
- **Env vars:** `NEXT_PUBLIC_SUPABASE_URL` و `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` و `SENTRY_DSN`.
- **الدومين:** تقدر تربط `crm.<domain>` لو عايز.
- **PWA:** `manifest.ts` + أيقونات + `display: standalone` + `theme_color`. فتقدر تضيفه من Safari/Chrome لشاشة الموبايل الرئيسية ويشتغل زي التطبيق.

---

## 13. خطة التنفيذ على مراحل

> الأيام تقديرية، وده يوم عمل مركّز معايا. **كل Phase بتنتهي بـ Deploy على Production**، فإنت بتشوف تقدّم حقيقي كل يوم.
> 📌 **ده الملخص. المهام التفصيلية مكتوبة كـ Prompts في §20.**

### Phase 0: التأسيس (½ يوم)
- [ ] `create-next-app` + TS strict + Tailwind v4 + shadcn/ui + ESLint (فيها rule الـ logical CSS) + Prettier
- [ ] مشروع Supabase (فرانكفورت) + Supabase CLI + local dev
- [ ] next-intl (ar/en) + `dir` + الخطوط + DirectionProvider
- [ ] Auth كامل: login، logout، reset، proxy، وإنشاء اليوزر
- [ ] الـ App shell: Bottom nav و sidebar، وصفحات فاضية
- [ ] GitHub repo + CI + Vercel + Sentry
- **✅ Deploy:** تفتح اللينك، تسجل دخول، وتشوف الـ shell بالعربي وتبدّل للإنجليزي.

### Phase 1: الـ Leads (1.5 يوم)
- [ ] Migration: types، والجداول كلها، والـ indexes، والـ RLS، و `normalize_search`، وtrigger الـ `search_text`، والـ seed (الأنشطة والدول)
- [ ] `parseInstagram` و `parsePhone` + اختباراتهم
- [ ] فورم الإضافة (طبقتين + "حفظ وإضافة آخر" + كشف التكرار)
- [ ] `search_leads` + `lead_stage_counts` + تحقق مؤقت
- [ ] صفحة القايمة: البحث، والفلاتر، والتابات، والترتيب، و infinite scroll، و virtualization، والكروت على الموبايل والجدول على الديسكتوب
- [ ] صفحة الـ Lead: البيانات و inline edit (من غير أكشنز لسه)
- [ ] Soft delete + Undo
- **✅ Deploy:** تقدر **تبدأ تستخدمه فعليًا** وتدخّل Leads وتدوّر عليها.

### Phase 2: محرك الـ Pipeline (1.5 يوم)
- [ ] `lead_action` بكل الأكشنز + `undo_lead_event` + تحقق مؤقت لكل انتقال
- [ ] `stages.ts` + تيست التطابق مع الـ DB
- [ ] `useLeadAction` hook (optimistic، rollback، invalidation، toast فيه Undo)
- [ ] الـ Action bar والزرار الذكي، و Dialogs الـ Meeting والـ Lost والتذكير
- [ ] الأزرار السريعة جوه الكروت في القايمة
- [ ] الـ Timeline في صفحة الـ Lead
- [ ] Checkbox "تم إرسال رسالة بالفعل" في فورم الإضافة
- **✅ Deploy:** الـ Pipeline كله شغال من الأزرار.

### Phase 3: المتابعات + الإعدادات (1 يوم)
- [ ] `follow_up_queue` + تحقق مؤقت (بما فيه حدود الأيام والـ timezone)
- [ ] صفحة المتابعات: الـ sections والكروت و "فتح DM" والـ swipe والـ progress و Inbox zero
- [ ] Badge العدد في الـ Nav و `document.title`
- [ ] صفحة الإعدادات: المواعيد والمثال اللايف، واللغة، والـ timezone، والدولة، والأنشطة
- **✅ Deploy: 🎯 الـ Workflow الكامل جاهز** (جمع، ثم تواصل، ثم متابعة، ثم Meeting، ثم إغلاق).

### Phase 4: مركز البيانات: Excel والنسخ الاحتياطي (3 أيام)
**4a: التصدير والنموذج (يوم 1)**
- [ ] Export Worker (ExcelJS + Comlink) + `ExportButton` + الـ registry
- [ ] Export specs لكل الصفحات: Leads، والمتابعات، وصفحة الـ Lead، والأنشطة، وسلة المحذوفات (والـ Dashboard بيتضاف في Phase 5)
- [ ] نموذج Excel: 3 شيتات، وقوائم منسدلة لايف، وصف مثال، وتعليمات
- [ ] تيست round-trip (تصدّر ثم تقرا تاني، فيطلع نفس الداتا بالظبط)

**4b: الاستيراد (يوم 2)**
- [ ] Migration: `import_jobs` + `import_rows` + `missing_fields` trigger + `import_job_id`
- [ ] Import Worker (SheetJS): xlsx/xls/csv/ods، والـ encoding، وتحديد صف العناوين
- [ ] الـ Mapping: قاموس المرادفات، والتخمين من المحتوى، ومطابقة القيم، وحفظ الـ mapping
- [ ] `stage_import_rows` + فحص التكرار set-based + Resume (IndexedDB)
- [ ] صفحة التقرير: التابات الخمسة، والتعديل inline، والإجراءات الجماعية، و"نزّل الصفوف اللي فيها مشاكل"
- [ ] `commit_import` بالدفعات + Progress + Cancel + Rollback + السجل
- [ ] Google Sheets بلينك (route handler + whitelist) + اللصق
- [ ] فلتر "بيانات ناقصة" في القايمة
- [ ] Load test: ملف 200k صف والـ UI بيفضل بيستجيب

**4c: النسخ الاحتياطي (يوم 3)**
- [ ] `backup_settings` + `backups` + Storage bucket + policies
- [ ] Edge Function `generate-backup` + pg_cron + pg_net + الـ retention
- [ ] التنبيهات: Banner جوه التطبيق + Web Push (service worker + VAPID) + الإيميل (Resend)
- [ ] صفحة `/data/backups`: الجدولة، والقايمة، والتحميل، و"نسخة دلوقتي"، والحفظ التلقائي في فولدر (File System Access)
- [ ] الاسترجاع: دمج أو استبدال، ومعاه نسخة pre_restore
- **✅ Deploy:** تقدر تستورد شيت كامل، وتصدّر من أي صفحة، والنسخة الأسبوعية بتوصلك.

### Phase 5: الـ Dashboard (1 يوم)
- [ ] `dashboard_stats` + تحقق مؤقت للتعريفات
- [ ] الـ 6 KPIs + اختيار الفترة + المقارنة + كارت المتابعات + توزيع الـ Pipeline
- [ ] تصدير الـ Dashboard Excel (الأرقام، والـ Pipeline، و Leads الفترة، وأحداث الفترة)
- **✅ Deploy.**

### Phase 6: التلميع والإطلاق (1.5 يوم)
- [ ] PWA (manifest، الأيقونات، التثبيت)
- [ ] Dark mode، والاختصارات، و Offline banner، والـ Error boundaries
- [ ] Load test على 100k Lead و `EXPLAIN ANALYZE` لكل RPC
- [ ] فحص يدوي كامل (§19.5) + الاستيراد والتصدير والاسترجاع على الـ Dev
- [ ] Security headers + noindex + مراجعة الـ RLS (والـ Storage كمان)
- [ ] GitHub Action للـ pg_dump + **تجربة restore** كاملة
- [ ] صفحة سلة المحذوفات + pg_cron للمسح بعد 30 يوم
- [ ] مراجعة كاملة على موبايل حقيقي (iPhone و Android) بالعربي والإنجليزي
- **✅ Deploy: 🚀 v1.0**

### Phase 7: بعد الإطلاق (v1.1، حسب احتياجك)
- [ ] **قوالب رسايل:** رسالة أولى و FU1–3، وفيها متغيرات زي `{name}`، وزرار "نسخ" جنب "فتح DM". ده بيوفّر وقت كبير في الـ Outreach.
- [ ] Google Sheets بـ OAuth (تختار الشيت من Drive مباشرة، من غير ما تحتاج تعمله share عام) + **مزامنة دورية** لشيت معين
- [ ] **Focus mode للمتابعات:** يعرض Lead واحد بس في الشاشة، فتعمل "فتح DM" ثم "تم"، ويجيلك اللي بعده.
- [ ] Kanban view (سحب بين المراحل)
- [ ] MFA
- [ ] Saved views (فلاتر محفوظة)

**الإجمالي حتى v1.0: تقريبًا 10 أيام عمل** (المرحلة الجديدة، مركز البيانات، زوّدت 3 أيام).
> لو محتاج الاستيراد بدري عشان تدخّل داتا قديمة، نقدر نعمل 4b مباشرة بعد Phase 1، والترتيب ده مش هيأثر على باقي الشغل.

---

## 14. Definition of Done (لأي فيتشر)
- [ ] بتشتغل على موبايل (375px) وديسكتوب، **بالعربي والإنجليزي**
- [ ] فيها حالات Loading و Empty و Error، ومفيش شاشة بيضا
- [ ] الـ Validation في الـ client والـ DB
- [ ] اتعمل لها تحقق مؤقت، و `.tmp/` اتمسح، وداتا الـ Dev اتمسحت، و `typecheck/lint/build` ناجحين
- [ ] مفيش ولا داتا وهمية، ولا `console.log`، ولا TODO
- [ ] مفيش Seq Scan في أي query جديدة
- [ ] الكيبورد والـ focus شغالين، ومفيش axe violations
- [ ] اتعملها Deploy واتجربت على Production

---

## 15. المخاطر والحلول
| الخطر | الاحتمال | الحل |
|---|---|---|
| ضياع الداتا (الخطة المجانية مفيهاش backup) | متوسط | Backup action يومي مشفّر + تجربة restore + تصدير CSV |
| المشروع يتوقف بعد 7 أيام من غير استخدام | قليل (الاستخدام يومي) | الـ backup action بيعمل اتصال يومي، ولو احتجنا Pro |
| ضغط غلط يبوّظ الـ Pipeline | عالي | Undo + override يدوي + Timeline |
| تكرار الـ Leads | عالي | تطبيع الـ handle والرقم + unique index + تنبيه لايف |
| الـ RTL يتكسر في مكونات معينة | متوسط | Logical CSS + ESLint rule + E2E بالعربي |
| تغيير مواعيد المتابعة يلخبط القديم | منخفض | التغيير بيأثر على الجاي بس، ومكتوب ده بوضوح |
| بحث بطيء لما الداتا تكبر | منخفض | Trigram index + load test على 100k قبل الإطلاق |

---

## 16. قاموس المصطلحات
- **Lead:** عميل محتمل.
- **Stage:** المرحلة الحالية للـ Lead، وهي دايمًا واحدة بس.
- **Event:** حاجة حصلت للـ Lead في وقت معين، والـ Events بتتسجل في الـ Timeline.
- **Due / مستحق:** `next_follow_up_on <= النهارده`.
- **Waiting:** الـ Lead اتبعتله ومستني الرد، ومعاد متابعته لسه مجاش.
- **Exhausted / خلصت المتابعات:** الـ Lead اتبعتله FU3 وعدّت مدة الانتظار ومردّش.

---

## 17. قرارات محتاجة تأكيد منك ❓
أنا مشيت في الخطة بالاختيار اللي مكتوب ✅. لو عايز تغيّر أي حاجة قولّي:

1. **معنى المراحل:** "Follow Up 1" معناها إن **المتابعة الأولى اتبعتت** (والمستحق بيتحسب من التاريخ). ✅ *ده بيخلي الإحصائيات دقيقة.*
2. **وسيلة التواصل:** **لازم يكون في إنستجرام أو واتساب على الأقل** (مش لازم الاتنين). ✅
3. **مواعيد المتابعة الافتراضية:** بعد 2 يوم ثم 3 ثم 4، وبعدها 5 أيام وينتهي. ✅ *وتقدر تغيّرها من الإعدادات.*
4. **"Leads جدد" في الـ Dashboard:** معناها **اللي اتضافوا في الفترة**، وتحتها عدد "لسه متكلموش". ✅
5. **أسماء المراحل:** بتفضل **بالإنجليزي** حتى في الواجهة العربي. ✅ *ولو عايزها عربي (رسالة مرسلة، متابعة 1، …) دي مجرد ترجمة.*
6. **إضافة زرار Proposal Sent** وزرار **Follow-up Sent** (ناقصين في الـ spec). ✅
7. **الاستيراد في أي وقت** (مش لازم من الأول). ✅ *ولو عايزه بدري، نقدّم 4b بعد Phase 1.*
8. **قوالب الرسايل (Phase 7):** تحب نقدّمها؟ دي بتوفّر وقت كبير جدًا في الـ Outreach اليومي.
9. **الاستضافة:** هنبدأ على الخطة المجانية في Supabase ومعاها backup يومي من GitHub Action، ولا تحب Pro ($25/شهر) من الأول عشان الـ backups التلقائية؟
10. **النسخة الاحتياطية الافتراضية:** **أسبوعية، يوم الجمعة 9 الصبح، بصيغة Excel**، وبنحتفظ بآخر 8 نسخ، والتنبيه جوه التطبيق و Push. ✅ *وكل ده بيتغير من الإعدادات.*
11. **تنبيه الإيميل:** محتاج دومين متوثّق في Resend (أو بيتبعت من `onboarding@resend.dev` للتجربة). عندك دومين؟ ولو لأ، نكتفي بالـ Push وتنبيه جوه التطبيق.
12. **Google Sheets:** في v1 **بلينك الشيت** (لازم يكون "أي حد معاه اللينك يشوف") أو تنزّله xlsx. وفي v1.1 بـ OAuth مباشر من Drive. ✅
13. **التكرار وقت الاستيراد:** الافتراضي **"تخطّي"**، وتقدر تغيّره لـ "تحديث الفاضي بس" أو "استبدال". ✅
14. **ألوان Scope الرسمية واللوجو:** لو عندك brand colors أو لوجو ابعتهم، وهيتحطوا في الـ tokens (§18.2.1). ولو مفيش، هنكمّل باللون المحايد اللي مقترح.
15. **التيستات:** **مؤقتة وبتتمسح بعد كل مهمة** (§11)، ومعاها قايمة فحص يدوي ثابتة (§19.5). ✅
16. **بيئتين في Supabase:** `scope-crm-dev` للتطوير والتحقق، و `scope-crm` للـ Production، والتاني **نضيف تمامًا**. ✅

---
---

# الجزء التاني: المواصفات البرمجية الكاملة (Technical Specification)

> القسم ده هو **المرجع الهندسي**: كل مهمة في §20 بتشاور على جزء منه. ولو حصل تعارض بين القسم ده والأقسام اللي فوق، **§18 هو اللي بيكسب**، لأنه الأحدث والأدق.

## 18. المواصفات البرمجية

### 18.0 فلسفة الكود: "فكّر بمرونة"
كل سطر بيتكتب بيعدّي على الأسئلة دي:
1. **لو الداتا بقت ×100 هيحصل إيه؟** (pagination، indexes، workers)
2. **لو اليوزر غلط هيقدر يرجع؟** (undo، rollback، soft delete)
3. **لو الشبكة قطعت في النص؟** (idempotency، resume، rollback للـ optimistic)
4. **لو المدخلات جت بشكل مش متوقع؟** (تطبيع، رسالة واضحة، ومفيش crash)
5. **لو حبينا نغيّر/نضيف بعدين؟** (config بدل hardcode، مصدر واحد للحقيقة)
6. **هل في طريقة أبسط تدي نفس النتيجة؟** البساطة جزء من الجودة.

### 18.1 الـ Conventions
| البند | القاعدة |
|---|---|
| Package manager | **pnpm** |
| Node | 22 LTS |
| TypeScript | `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: false` |
| Imports | alias `@/` → `src/` |
| تسمية الملفات | `kebab-case.ts(x)`، والـ Components نفسها `PascalCase`، والـ hooks بتبدأ بـ `use-*.ts` وجواها `useX` |
| تسمية الـ DB | `snake_case`، الجداول جمع، والـ functions فعل (`search_leads`, `lead_action`) |
| Server/Client | Server Components افتراضيًا. و `"use client"` بس على المكونات التفاعلية وفي أعمق مستوى ممكن |
| الـ Data access | **ممنوع** أي component يكلّم `supabase` مباشرة. كله بيعدّي من `src/features/*/api.ts`، ومنها لـ hooks في `queries.ts` |
| الـ Errors | أي خطأ بيتحوّل لـ `AppError { code: AppErrorCode; messageKey: string; cause?: unknown }` في `src/lib/errors.ts`، والـ UI بيعرض `t(messageKey)` |
| الـ Strings | **ممنوع** أي نص للمستخدم يتكتب hardcoded. كله من `messages/*.json` |
| الـ CSS | logical properties بس (`ms/me/ps/pe/start/end`)، والـ ESLint بيمنع `ml-/mr-/pl-/pr-/left-/right-` |
| الـ Comments | بنكتب **ليه** الكود عامل كده، مش بنشرح **إيه** اللي بيعمله |
| الـ Commits | Conventional Commits: `feat(leads): …`, `fix(import): …` |
| الـ Dates | التخزين `timestamptz` بالـ UTC. العرض بالـ timezone اللي في الإعدادات. و"اليوم" بيتحسب في الداتابيز من `settings.timezone` |
| الـ IDs | `uuid` للكيانات، و `bigint identity` للـ logs |

**كتالوج أكواد الأخطاء** (`AppErrorCode`)
| Code | المصدر | الرسالة (ar) |
|---|---|---|
| `LEAD_NOT_FOUND` | RPC `P0002` | الـ Lead ده مش موجود أو اتمسح |
| `INVALID_TRANSITION` | RPC | الإجراء ده مش متاح في المرحلة الحالية |
| `STAGE_CONFLICT` | RPC | الـ Lead اتحدّث من مكان تاني، وتم تحديث البيانات |
| `UNDO_EXPIRED` | RPC | مينفعش التراجع بعد 10 دقايق |
| `UNDO_NOT_LATEST` | RPC | تقدر تتراجع عن آخر إجراء بس |
| `DUPLICATE_INSTAGRAM` | unique `leads_ig_unique` (`23505`) | الحساب ده موجود بالفعل |
| `DUPLICATE_WHATSAPP` | unique `leads_wa_unique` | الرقم ده موجود بالفعل |
| `VALIDATION` | `23514` / zod | راجع البيانات المكتوبة |
| `UNAUTHORIZED` | 401 / `PGRST301` | انتهت الجلسة، سجّل دخول تاني |
| `NETWORK` | fetch failed | مفيش اتصال بالإنترنت |
| `RATE_LIMITED` | 429 | محاولات كتير، استنى دقيقة |
| `IMPORT_TOO_LARGE` | client | الملف أكبر من الحد (50MB / 200k صف) |
| `IMPORT_UNREADABLE` | worker | مش قادرين نقرا الملف، اتأكد إنه Excel أو CSV |
| `BACKUP_INVALID` | restore | الملف ده مش نسخة احتياطية صالحة |
| `UNKNOWN` | أي حاجة تانية | حصل خطأ غير متوقع، جرّب تاني |

```ts
// src/lib/errors.ts
export function toAppError(e: unknown): AppError {
  // 1) AppError → return as is
  // 2) PostgrestError: map by e.code / e.message ('LEAD_NOT_FOUND', 'STAGE_CONFLICT', ...)
  //    23505 + constraint name → DUPLICATE_INSTAGRAM | DUPLICATE_WHATSAPP
  // 3) AuthError (status 401/400) → UNAUTHORIZED ; 429 → RATE_LIMITED
  // 4) TypeError 'Failed to fetch' → NETWORK
  // 5) else UNKNOWN (and Sentry.captureException)
}
```

### 18.2 الـ Design System
> **المصدر الوحيد للحقيقة** هو `src/styles/tokens.css`. الـ Tailwind v4 بيقرا منه عن طريق `@theme`، وممنوع أي لون أو مسافة hardcoded في الكومبوننتس.

#### 18.2.1 الألوان (OKLCH، فيها Light و Dark)
| Token | Light | Dark | الاستخدام |
|---|---|---|---|
| `--bg` | `oklch(0.99 0 0)` | `oklch(0.16 0.01 260)` | خلفية الصفحة |
| `--surface` | `oklch(1 0 0)` | `oklch(0.20 0.01 260)` | الكروت والـ sheets |
| `--surface-2` | `oklch(0.97 0.003 260)` | `oklch(0.24 0.012 260)` | Hover، الصفوف الفردية، الـ inputs |
| `--border` | `oklch(0.91 0.005 260)` | `oklch(0.30 0.01 260)` | |
| `--fg` | `oklch(0.22 0.02 260)` | `oklch(0.95 0.005 260)` | النص الأساسي |
| `--fg-muted` | `oklch(0.50 0.02 260)` | `oklch(0.70 0.01 260)` | النص الثانوي |
| `--primary` | `oklch(0.55 0.20 265)` | `oklch(0.68 0.17 265)` | الأزرار الرئيسية (بيتغير لما توصلنا ألوان Scope الرسمية، §17) |
| `--primary-fg` | `oklch(0.99 0 0)` | `oklch(0.16 0.01 260)` | |
| `--success` | `oklch(0.62 0.16 150)` | `oklch(0.72 0.15 150)` | Won، "محفوظ ✓" |
| `--warning` | `oklch(0.78 0.15 80)` | `oklch(0.80 0.14 80)` | ناقص، متأخر |
| `--danger` | `oklch(0.58 0.21 25)` | `oklch(0.68 0.18 25)` | Lost، أخطاء، حذف |
| `--focus` | `--primary` بشفافية 50% | | Focus ring |

**ألوان المراحل** (كل مرحلة ليها `--stage-<key>-bg` و `--stage-<key>-fg`، والتباين بينهم ≥ 4.5:1 في الـ mode الاتنين):
`new` رمادي (hue 260 / chroma 0.01) · `message_sent` أزرق (240) · `follow_up_1` أزرق غامق (255) · `follow_up_2` بنفسجي (290) · `follow_up_3` بنفسجي غامق (305) · `replied` كهرماني (75) · `meeting_booked` برتقالي (50) · `proposal_sent` تركواز (195) · `won` أخضر (150) · `lost` أحمر (25).
- الـ Badge بتاع أي مرحلة: خلفية فاتحة (L 0.95 في الـ Light، و 0.30 في الـ Dark) ونص غامق من نفس الـ hue، **ومعاهم أيقونة**.

#### 18.2.2 الخطوط
- `--font-sans`: `"Inter", "IBM Plex Sans Arabic", system-ui, sans-serif`. الـ Inter بتعرض اللاتيني، والـ IBM Plex Sans Arabic بتاخد الحروف العربي لوحدها بفضل الـ fallback، فنقدر نخلط اللغتين في نفس السطر.
- بيتحمّلوا بـ `next/font/google` (Inter: 400/500/600/700 · IBM Plex Sans Arabic: 400/500/600/700)، ومعاهم `display: swap` والـ variables.
- `font-feature-settings: "tnum"` على الأرقام في الجداول والـ KPIs، فالأرقام بتيجي تحت بعض بالظبط.

| Token | الحجم / الارتفاع | الاستخدام |
|---|---|---|
| `text-xs` | 12 / 16 | Badges، Hints |
| `text-sm` | 14 / 20 | نص ثانوي، الجداول |
| `text-base` | **16** / 24 | النص الأساسي، **وكل الـ inputs** (أقل من 16px بيخلّي iOS يعمل zoom) |
| `text-lg` | 18 / 28 | عناوين الكروت |
| `text-xl` | 20 / 28 | عناوين الأقسام |
| `text-2xl` | 24 / 32 | عنوان الصفحة |
| `text-3xl` | 30 / 36 | أرقام الـ KPIs |
- لما اللغة عربي (`:lang(ar)`) الـ line-height بيزيد ×1.1، عشان الحروف العربي اللي بتنزل تحت السطر متتقصّش.

#### 18.2.3 المسافات والأشكال والحركة
- **Spacing:** أساسها 4px (الـ scale الافتراضي بتاع Tailwind). الـ padding بتاع الصفحة 16px على الموبايل و 24px على الديسكتوب. الـ gap بين الكروت 12px.
- **Radius:** `--radius-sm 6px` (badges) · `--radius-md 10px` (inputs، buttons) · `--radius-lg 14px` (cards، sheets) · `--radius-full`.
- **Shadows:** `--shadow-sm` (الكروت) · `--shadow-md` (popovers) · `--shadow-lg` (dialogs). في الـ Dark mode الشادو بيتحول لـ border أفتح.
- **Motion:** `--dur-fast 120ms` (hover/press) · `--dur-base 200ms` (فتح وقفل) · `--dur-slow 300ms` (sheets) · `--ease-out cubic-bezier(0.2, 0.8, 0.2, 1)`. ومع `prefers-reduced-motion: reduce` كل الحركة بتبقى 0ms.
- **Breakpoints:** `sm 640` · `md 768` (من هنا بيتحول لـ layout ديسكتوب: sidebar وجدول) · `lg 1024` (side panel للـ Lead) · `xl 1280`.
- **Z-index:** `base 0` · `sticky 10` · `nav 20` · `fab 30` · `overlay 40` · `modal 50` · `toast 60`.
- **Touch targets:** أقل حاجة 44×44px على أي عنصر بيتداس عليه على الموبايل.
- **Safe areas:** الـ bottom nav والـ action bar بياخدوا `padding-bottom: env(safe-area-inset-bottom)` عشان النوتش والـ home indicator في iPhone.

#### 18.2.4 مكتبة الكومبوننتس (`src/components/ui/*`، مبنية على shadcn)
| Component | Variants / Props | الحالات اللي لازم تتغطى |
|---|---|---|
| `Button` | `variant: primary \| secondary \| outline \| ghost \| danger` · `size: sm \| md \| lg \| icon` · `loading` | default / hover / active (scale .98) / focus-visible / disabled / loading (spinner مكان الأيقونة والنص زي ما هو، والعرض ميتغيرش) |
| `Input`, `Textarea` | `invalid`, `hint`, `counter` | فيه error message تحته مربوط بـ `aria-describedby` |
| `Select`, `Combobox` | `searchable`, `multiple`, `recent` | الكيبورد (أسهم، Enter، Esc، typeahead) |
| `SegmentedControl` | `options`, `allowDeselect` | role=radiogroup |
| `StageBadge` | `stage`, `size` | لون + أيقونة + اسم (مترجم) |
| `Card`, `Sheet`, `Dialog`, `Popover`, `Tabs` (scrollable), `Tooltip` | | Focus trap و Esc في الـ overlays |
| `Toast` (sonner) | `action` (Undo) | |
| `Skeleton` | `shape` | |
| `EmptyState` | `icon`, `title`, `description`, `action` | |
| `Progress` | `value`, `label`, `onCancel` | |
| `KpiCard` | `label`, `value`, `delta`, `hint`, `href` | loading / error |
| `Kbd` | | |
| `SaveIndicator` | `state: idle \| saving \| saved \| error` | |

#### 18.2.5 الأيقونات
lucide-react بحجم 16 (inline) أو 20 (buttons) أو 24 (nav)، و `stroke-width: 1.75`. والأيقونات اللي ليها اتجاه بتاخد `rtl:-scale-x-100`.

### 18.3 الداتابيز: الـ Migrations بالترتيب، والـ SQL الكامل

> **قواعد ثابتة لكل migration:**
> - كل function عليها `set search_path = public, extensions`، وكل function **`security invoker`** إلا اللي متحدد غير كده.
> - الـ migration **مبتتعدلش بعد ما تتطبق**. أي تعديل بيبقى migration جديدة.
> - مفيش أي `insert` لداتا تجريبية. المسموح بس هو **الداتا المرجعية**: الدول، والأنشطة الـ 7 اللي في الـ spec (ودي بتتعمل لليوزر وقت إنشائه).

| # | الملف | المحتوى |
|---|---|---|
| 0001 | `0001_foundation.sql` | extensions · `set_updated_at()` · `settings` · `backup_settings` · `handle_new_user` |
| 0002 | `0002_reference.sql` | `countries` + الـ 250 دولة (ar/en) |
| 0003 | `0003_leads.sql` | enums · `industries` · `leads` · `normalize_search` · triggers · RLS · indexes |
| 0004 | `0004_leads_rpc.sql` | `lead_filter_sql` · `search_leads` · `lead_stage_counts` · `suggest_leads` · `check_duplicate` |
| 0005 | `0005_pipeline.sql` | `lead_events` · `assert_stage` · `lead_action` · `undo_lead_event` · created trigger |
| 0006 | `0006_follow_ups.sql` | `follow_up_queue` |
| 0007 | `0007_import.sql` | `import_jobs` · `import_rows` · RPCs الاستيراد |
| 0008 | `0008_backups.sql` | `backups` · `push_subscriptions` · storage bucket · `compute_next_backup` · cron |
| 0009 | `0009_dashboard.sql` | `dashboard_stats` |
| 0010 | `0010_maintenance.sql` | cron jobs: المسح النهائي للمحذوفات بعد 30 يوم، وتنضيف الـ staging |

#### 0001_foundation.sql
```sql
create extension if not exists pg_trgm  with schema extensions;
create extension if not exists unaccent with schema extensions;
create extension if not exists pg_cron;              -- schema cron
create extension if not exists pg_net   with schema extensions;

create or replace function public.set_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at := now(); return new; end $$;

create table public.settings ( ... كما في §3.5 ... );
create trigger settings_updated before update on public.settings
  for each row execute function public.set_updated_at();

create table public.backup_settings ( ... كما في §3.5.1، + last_reminded_at timestamptz ... );

alter table public.settings        enable row level security;
alter table public.backup_settings enable row level security;
create policy own on public.settings        for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy own on public.backup_settings for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- بيشتغل مرة واحدة لما اليوزر يتعمل. security definer عشان trigger على auth.users
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.settings (owner_id) values (new.id);
  insert into public.backup_settings (owner_id, next_run_at)
    values (new.id, public.compute_next_backup('weekly', 5, 1, 9, 'Africa/Cairo', now()));
  insert into public.industries (owner_id, key, label_ar, label_en, sort_order, is_other) values
    (new.id, 'real_estate_consultant', 'مستشار عقاري',  'Real Estate Consultant', 1, false),
    (new.id, 'real_estate_company',    'شركة عقارية',   'Real Estate Company',    2, false),
    (new.id, 'founder_ceo',            'Founder / CEO', 'Founder / CEO',          3, false),
    (new.id, 'business_consultant',    'مستشار أعمال',  'Business Consultant',    4, false),
    (new.id, 'doctor',                 'طبيب',          'Doctor',                 5, false),
    (new.id, 'clinic',                 'عيادة طبية',    'Medical Clinic',         6, false),
    (new.id, 'other',                  'أخرى',          'Other',                  7, true);
  return new;
end $$;
-- ملاحظة: الـ trigger بيتعمل في 0003 بعد ما جدول industries يتعمل، و compute_next_backup بتتعمل في 0008.
-- عشان كده الترتيب الفعلي: الـ function بتتعمل هنا كـ stub، وبتتعمل لها replace في 0008.
```

#### 0002_reference.sql
```sql
create table public.countries (
  code      char(2) primary key,
  name_ar   text not null,
  name_en   text not null,
  dial_code text                       -- '+20' (للمساعدة في تحليل الأرقام والعرض)
);
alter table public.countries enable row level security;
create policy read_all on public.countries for select to authenticated using (true);
-- الـ INSERTs بتتولد مرة واحدة بسكريبت مؤقت (.tmp/gen-countries.ts) من i18n-iso-countries و libphonenumber-js
-- وبتتحط هنا كـ SQL ثابت. السكريبت نفسه بيتمسح بعد كده.
```

#### 0003_leads.sql (مختصر لأن الجداول متعرّفة في §3)
```sql
create type public.lead_stage as enum (...);       -- §3.1
create type public.tri_state  as enum ('yes','no','unknown');
create table public.industries (...);              -- §3.2
create table public.leads (...);                   -- §3.3 بالعواميد الإضافية: import_job_id, missing_fields

create or replace function public.normalize_search(t text) returns text
language sql immutable parallel safe set search_path = public, extensions as $$
  select lower(regexp_replace(
           translate(extensions.unaccent('extensions.unaccent'::regdictionary, coalesce(t,'')),
                     'أإآٱىة٠١٢٣٤٥٦٧٨٩', 'اااايه0123456789'),
           '[\u064B-\u065F\u0670\u0640]', '', 'g'))
$$;
-- unaccent باستخدام الـ dictionary الصريح هو اللي بيخلّيها immutable بأمان

create or replace function public.leads_derive() returns trigger
language plpgsql set search_path = public, extensions as $$
declare v_ind text; v_cty text;
begin
  select concat_ws(' ', label_ar, label_en) into v_ind from industries where id = new.industry_id;
  select concat_ws(' ', name_ar,  name_en)  into v_cty from countries  where code = new.country_code;
  new.search_text := normalize_search(concat_ws(' ',
      new.name, new.company, new.job_title, new.instagram_handle,
      regexp_replace(coalesce(new.whatsapp_e164, ''), '\D', '', 'g'),
      new.industry_other, new.notes, new.problems, v_ind, v_cty));
  new.missing_fields := array_remove(array[
      case when new.industry_id  is null then 'industry' end,
      case when new.country_code is null then 'country'  end,
      case when nullif(btrim(new.job_title), '') is null then 'job_title' end,
      case when new.has_content is null or new.appears_in_content is null
             or new.has_videographer = 'unknown' then 'qualification' end
    ], null);
  -- تنضيف: المسافات الزيادة، والقيم الفاضية تبقى null
  new.name     := btrim(regexp_replace(new.name, '\s+', ' ', 'g'));
  new.company  := nullif(btrim(new.company), '');
  new.job_title:= nullif(btrim(new.job_title), '');
  return new;
end $$;
create trigger leads_derive before insert or update on public.leads
  for each row execute function public.leads_derive();
create trigger leads_updated before update on public.leads
  for each row execute function public.set_updated_at();

-- لو اسم نشاط اتغير، بنعيد بناء search_text للـ Leads المرتبطة بيه (update no-op بيشغّل الـ trigger)
create or replace function public.industries_touch_leads() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.label_ar is distinct from old.label_ar or new.label_en is distinct from old.label_en then
    update leads set industry_id = industry_id where industry_id = new.id;
  end if;
  return new;
end $$;
create trigger industries_touch after update on public.industries
  for each row execute function public.industries_touch_leads();

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS + indexes: §3.6 و §3.8 بالظبط، وتتضاف كمان indexes الترتيب:
create index leads_last_contact_idx on leads (owner_id, last_contacted_at desc nulls last, id desc) where deleted_at is null;
create index leads_name_idx         on leads (owner_id, lower(name), id) where deleted_at is null;
```

#### 0004_leads_rpc.sql
```sql
-- (1) بيبني الـ WHERE بشكل آمن (كل القيم بتعدّي من format %L)، و search_leads و lead_stage_counts الاتنين بيستخدموه
create or replace function public.lead_filter_sql(
  p_query text, p_stages lead_stage[], p_industries smallint[], p_countries text[], p_filters jsonb
) returns text language plpgsql stable set search_path = public, extensions as $$
declare
  w text := 'l.deleted_at is null';
  q text := nullif(normalize_search(btrim(coalesce(p_query, ''))), '');
  tok text;
begin
  if q is not null then
    foreach tok in array regexp_split_to_array(q, '\s+') loop
      -- escape لـ % و _ و \ جوه الـ LIKE
      w := w || format(' and l.search_text like %L', '%' || replace(replace(replace(tok,'\','\\'),'%','\%'),'_','\_') || '%');
    end loop;
  end if;
  if p_stages     is not null and cardinality(p_stages)     > 0 then w := w || format(' and l.stage = any(%L::lead_stage[])', p_stages); end if;
  if p_industries is not null and cardinality(p_industries) > 0 then w := w || format(' and l.industry_id = any(%L::smallint[])', p_industries); end if;
  if p_countries  is not null and cardinality(p_countries)  > 0 then w := w || format(' and l.country_code = any(%L::text[])', p_countries); end if;
  if p_filters ? 'has_content'        then w := w || format(' and l.has_content = %L::boolean', p_filters->>'has_content'); end if;
  if p_filters ? 'appears_in_content' then w := w || format(' and l.appears_in_content = %L::boolean', p_filters->>'appears_in_content'); end if;
  if p_filters ? 'has_videographer'   then w := w || format(' and l.has_videographer = %L::tri_state', p_filters->>'has_videographer'); end if;
  if (p_filters->>'has_whatsapp')::boolean is true then w := w || ' and l.whatsapp_e164 is not null'; end if;
  if (p_filters->>'due')::boolean is true then
    w := w || ' and l.next_follow_up_on <= (now() at time zone (select timezone from settings where owner_id = auth.uid()))::date';
  end if;
  if p_filters ? 'missing' then
    if p_filters->>'missing' = 'any' then w := w || ' and cardinality(l.missing_fields) > 0';
    else w := w || format(' and l.missing_fields @> %L::text[]', array(select jsonb_array_elements_text(p_filters->'missing')));
    end if;
  end if;
  if p_filters ? 'import_job_id' then w := w || format(' and l.import_job_id = %L::uuid', p_filters->>'import_job_id'); end if;
  if p_filters ? 'created_from'  then w := w || format(' and l.created_at >= %L::date', p_filters->>'created_from'); end if;
  if p_filters ? 'created_to'    then w := w || format(' and l.created_at <  (%L::date + 1)', p_filters->>'created_to'); end if;
  return w;
end $$;

-- (2) القايمة: keyset pagination لكل الترتيبات، و offset للترتيب بالـ "صلة" بس
create or replace function public.search_leads(
  p_query text default null, p_stages lead_stage[] default null, p_industries smallint[] default null,
  p_countries text[] default null, p_filters jsonb default '{}', p_sort text default 'newest',
  p_cursor jsonb default null, p_limit int default 50
) returns table (
  id uuid, name text, company text, instagram_handle text, whatsapp_e164 text,
  industry_id smallint, industry_other text, country_code text, stage lead_stage,
  last_contacted_at timestamptz, next_follow_up_on date, follow_ups_sent smallint,
  missing_fields text[], created_at timestamptz, rank real, next_cursor jsonb
) language plpgsql stable set search_path = public, extensions as $$
declare
  v_where text := lead_filter_sql(p_query, p_stages, p_industries, p_countries, coalesce(p_filters,'{}'));
  v_lim   int  := least(greatest(coalesce(p_limit, 50), 1), 100);
  v_q     text := nullif(normalize_search(btrim(coalesce(p_query,''))), '');
  v_sort  text := coalesce(nullif(p_sort, ''), 'newest');
  v_key   text; v_order text; v_cmp text; v_off int := 0;
begin
  if v_sort = 'relevance' and v_q is null then v_sort := 'newest'; end if;
  -- sort key متحوّل لنص قابل للمقارنة، والـ nulls ليها sentinel عشان الـ keyset
  case v_sort
    when 'newest'         then v_key := 'l.created_at';                              v_order := 'desc';
    when 'oldest'         then v_key := 'l.created_at';                              v_order := 'asc';
    when 'last_contact'   then v_key := 'coalesce(l.last_contacted_at, ''-infinity'')'; v_order := 'desc';
    when 'next_follow_up' then v_key := 'coalesce(l.next_follow_up_on, ''infinity'')';  v_order := 'asc';
    when 'name'           then v_key := 'lower(l.name)';                             v_order := 'asc';
    when 'relevance'      then v_key := format('similarity(l.search_text, %L)', v_q); v_order := 'desc';
    else raise exception 'INVALID_SORT';
  end case;

  if p_cursor is not null then
    if v_sort = 'relevance' then
      v_off := least((p_cursor->>'offset')::int, 500);
    else
      v_cmp := case v_order when 'desc' then '<' else '>' end;
      v_where := v_where || format(' and (%s, l.id) %s (%L, %L::uuid)',
                   v_key, v_cmp, p_cursor->>'k', p_cursor->>'id');
      -- ملاحظة: المقارنة بتحصل بنوع الـ key الأصلي (Postgres بيعمل cast للـ literal لوحده)
    end if;
  end if;

  return query execute format($q$
    select l.id, l.name, l.company, l.instagram_handle, l.whatsapp_e164, l.industry_id, l.industry_other,
           l.country_code::text, l.stage, l.last_contacted_at, l.next_follow_up_on, l.follow_ups_sent,
           l.missing_fields, l.created_at, %s::real as rank,
           null::jsonb as next_cursor
      from leads l
     where %s
     order by %s %s, l.id %s
     limit %s offset %s
  $q$, case when v_q is not null then format('similarity(l.search_text, %L)', v_q) else '0' end,
       v_where, v_key, v_order, v_order, v_lim + 1, v_off);
  -- الـ client بيطلب limit+1. لو رجع أكتر من limit يبقى في صفحة جاية، والـ cursor بيتبني من آخر صف
  -- عن طريق helper في الـ TS (buildCursor(sort, row)). ده أبسط من إننا نرجّعه من SQL.
end $$;

-- (3) عدد كل مرحلة للتابات، بنفس الفلاتر ما عدا المرحلة
create or replace function public.lead_stage_counts(
  p_query text default null, p_industries smallint[] default null,
  p_countries text[] default null, p_filters jsonb default '{}'
) returns table (stage lead_stage, total bigint)
language plpgsql stable set search_path = public, extensions as $$
begin
  return query execute format('select l.stage, count(*) from leads l where %s group by l.stage',
    lead_filter_sql(p_query, null, p_industries, p_countries, coalesce(p_filters,'{}')));
end $$;

-- (4) "هل تقصد؟": بيستخدم word_similarity، وبيتنادي بس لو search_leads رجعت صفر
create or replace function public.suggest_leads(p_query text, p_limit int default 5)
returns table (id uuid, name text, instagram_handle text, stage lead_stage, score real)
language sql stable set search_path = public, extensions as $$
  select l.id, l.name, l.instagram_handle, l.stage,
         word_similarity(normalize_search(p_query), l.search_text) as score
    from leads l
   where l.deleted_at is null
     and normalize_search(p_query) <% l.search_text            -- بيستخدم الـ GIN trigram index
   order by score desc
   limit least(p_limit, 10)
$$;
-- قبل الـ query: set_config('pg_trgm.word_similarity_threshold', '0.35', true) جوه wrapper plpgsql

-- (5) كشف التكرار
create or replace function public.check_duplicate(p_handle text default null, p_phone text default null, p_exclude uuid default null)
returns table (id uuid, name text, stage lead_stage, matched_on text)
language sql stable set search_path = public as $$
  select l.id, l.name, l.stage,
         case when l.instagram_handle = lower(p_handle) then 'instagram' else 'whatsapp' end
    from leads l
   where l.deleted_at is null
     and (p_exclude is null or l.id <> p_exclude)
     and ((p_handle is not null and l.instagram_handle = lower(p_handle))
       or (p_phone  is not null and l.whatsapp_e164 = p_phone))
   limit 2
$$;
```

#### 0005_pipeline.sql
```sql
create type public.lead_event_type as enum (...);   -- §3.1
create table public.lead_events (...);              -- §3.4 + RLS + indexes

create or replace function public.assert_stage(p_current lead_stage, p_allowed lead_stage[])
returns void language plpgsql immutable as $$
begin
  if not (p_current = any(p_allowed)) then
    raise exception 'INVALID_TRANSITION' using errcode = 'P0001', detail = p_current::text;
  end if;
end $$;

-- Event 'created' لوحده لأي Lead جديد (من الفورم أو من الاستيراد)
create or replace function public.leads_created_event() returns trigger
language plpgsql set search_path = public as $$
begin
  insert into lead_events (owner_id, lead_id, type, to_stage, meta, occurred_at)
  values (new.owner_id, new.id, 'created', new.stage,
          case when new.import_job_id is not null then jsonb_build_object('import_job_id', new.import_job_id) else '{}' end,
          new.created_at);
  return new;
end $$;
create trigger leads_created_event after insert on public.leads
  for each row execute function public.leads_created_event();

create or replace function public.lead_action(
  p_lead_id uuid, p_action text, p_payload jsonb default '{}', p_expected_stage lead_stage default null
) returns jsonb                                    -- {"lead": {...}, "event_id": 123}
language plpgsql security invoker set search_path = public as $$
declare
  v  leads; s settings; v_today date; v_prev jsonb; v_from lead_stage; v_event bigint;
  v_type lead_event_type; v_waiting lead_stage[] := '{message_sent,follow_up_1,follow_up_2,follow_up_3}';
  v_open lead_stage[] := '{new,message_sent,follow_up_1,follow_up_2,follow_up_3,replied,meeting_booked,proposal_sent}';
begin
  select * into v from leads where id = p_lead_id and deleted_at is null for update;
  if not found then raise exception 'LEAD_NOT_FOUND' using errcode = 'P0002'; end if;
  if p_expected_stage is not null and v.stage <> p_expected_stage then
    raise exception 'STAGE_CONFLICT' using errcode = 'P0001', detail = v.stage::text;
  end if;
  select * into s from settings where owner_id = v.owner_id;
  v_today := (now() at time zone s.timezone)::date;
  v_from  := v.stage;
  v_prev  := to_jsonb(v) - '{search_text,missing_fields,name,company,notes,problems,job_title,
                              instagram_handle,whatsapp_e164,country_code,industry_id,industry_other,
                              has_content,appears_in_content,has_videographer,created_at,owner_id,id,
                              import_job_id,deleted_at,updated_at}'::text[];   -- عواميد الـ pipeline بس

  case p_action
  when 'send_message' then
    perform assert_stage(v.stage, '{new}');
    update leads set stage='message_sent', stage_changed_at=now(), first_message_at=now(),
           last_contacted_at=now(), follow_ups_sent=0, next_follow_up_on=v_today + s.fu1_after_days
     where id = v.id returning * into v;
    v_type := 'message_sent';

  when 'send_follow_up' then
    perform assert_stage(v.stage, '{message_sent,follow_up_1,follow_up_2}');
    update leads set
        stage = case v.stage when 'message_sent' then 'follow_up_1'::lead_stage
                             when 'follow_up_1'  then 'follow_up_2' else 'follow_up_3' end,
        stage_changed_at = now(), last_contacted_at = now(), follow_ups_sent = v.follow_ups_sent + 1,
        next_follow_up_on = v_today + case v.stage when 'message_sent' then s.fu2_after_days
                                                   when 'follow_up_1'  then s.fu3_after_days
                                                   else s.give_up_after_days end
     where id = v.id returning * into v;
    v_type := 'follow_up_sent';
    p_payload := p_payload || jsonb_build_object('number', v.follow_ups_sent);

  when 'reply_received' then
    perform assert_stage(v.stage, '{new,message_sent,follow_up_1,follow_up_2,follow_up_3}');
    update leads set stage='replied', stage_changed_at=now(), replied_at=now(),
           next_follow_up_on=null, reminder_note=null
     where id = v.id returning * into v;
    v_type := 'reply_received';

  when 'book_meeting' then
    perform assert_stage(v.stage, '{new,message_sent,follow_up_1,follow_up_2,follow_up_3,replied}');
    update leads set stage='meeting_booked', stage_changed_at=now(), meeting_booked_at=now(),
           replied_at = coalesce(replied_at, now()),
           meeting_at = nullif(p_payload->>'meeting_at','')::timestamptz,
           next_follow_up_on=null, reminder_note=null
     where id = v.id returning * into v;
    v_type := 'meeting_booked';

  when 'send_proposal' then
    perform assert_stage(v.stage, '{replied,meeting_booked}');
    update leads set stage='proposal_sent', stage_changed_at=now(), proposal_sent_at=now()
     where id = v.id returning * into v;
    v_type := 'proposal_sent';

  when 'mark_won' then
    perform assert_stage(v.stage, v_open);
    update leads set stage='won', stage_changed_at=now(), won_at=now(), next_follow_up_on=null, reminder_note=null
     where id = v.id returning * into v;
    v_type := 'won';

  when 'mark_lost' then
    perform assert_stage(v.stage, v_open);
    if p_payload ? 'reason' and p_payload->>'reason' not in ('not_interested','no_reply','budget','timing','other') then
      raise exception 'VALIDATION' using errcode = '23514';
    end if;
    update leads set stage='lost', stage_changed_at=now(), lost_at=now(), lost_reason=p_payload->>'reason',
           next_follow_up_on=null, reminder_note=null
     where id = v.id returning * into v;
    v_type := 'lost';

  when 'reopen' then
    perform assert_stage(v.stage, '{won,lost}');
    update leads set stage=coalesce((p_payload->>'to_stage')::lead_stage, 'replied'), stage_changed_at=now(),
           won_at=null, lost_at=null, lost_reason=null
     where id = v.id returning * into v;
    v_type := 'reopened';

  when 'set_reminder' then
    update leads set next_follow_up_on=(p_payload->>'date')::date,
           reminder_note=nullif(left(p_payload->>'note', 140), '')
     where id = v.id returning * into v;
    v_type := 'reminder_set';

  when 'clear_reminder' then
    update leads set next_follow_up_on = null, reminder_note = null
     where id = v.id and v.stage not in ('message_sent','follow_up_1','follow_up_2','follow_up_3')
     returning * into v;
    if not found then raise exception 'INVALID_TRANSITION' using errcode='P0001'; end if;
    v_type := 'reminder_set'; p_payload := p_payload || '{"cleared":true}';

  when 'snooze' then
    if v.next_follow_up_on is null then raise exception 'INVALID_TRANSITION' using errcode='P0001'; end if;
    update leads set next_follow_up_on = greatest(v.next_follow_up_on, v_today)
                                         + least(greatest(coalesce((p_payload->>'days')::int,1),1),90)
     where id = v.id returning * into v;
    v_type := 'snoozed';

  when 'restart' then
    perform assert_stage(v.stage, '{follow_up_3,lost}');
    update leads set stage='new', stage_changed_at=now(), follow_ups_sent=0, lost_at=null, lost_reason=null,
           next_follow_up_on = case when p_payload ? 'after_days'
                                    then v_today + (p_payload->>'after_days')::int end
     where id = v.id returning * into v;
    v_type := 'restarted';

  when 'set_stage' then
    update leads set stage=(p_payload->>'to_stage')::lead_stage, stage_changed_at=now(),
           next_follow_up_on = case when (p_payload->>'to_stage')::lead_stage = any(v_waiting)
                                    then coalesce(next_follow_up_on, v_today + s.fu1_after_days) else null end
     where id = v.id returning * into v;
    v_type := 'stage_set';

  else raise exception 'UNKNOWN_ACTION' using errcode = 'P0001';
  end case;

  insert into lead_events (owner_id, lead_id, type, from_stage, to_stage, prev_state, meta)
  values (v.owner_id, v.id, v_type, v_from, v.stage, v_prev, coalesce(p_payload,'{}'))
  returning id into v_event;

  return jsonb_build_object('lead', to_jsonb(v) - 'search_text', 'event_id', v_event);
end $$;

create or replace function public.undo_lead_event(p_event_id bigint) returns jsonb
language plpgsql security invoker set search_path = public as $$
declare e lead_events; v leads; v_latest bigint;
begin
  select * into e from lead_events where id = p_event_id and undone_at is null for update;
  if not found or e.prev_state is null then raise exception 'LEAD_NOT_FOUND' using errcode='P0002'; end if;
  if e.occurred_at < now() - interval '10 minutes' then raise exception 'UNDO_EXPIRED' using errcode='P0001'; end if;
  select max(id) into v_latest from lead_events
   where lead_id = e.lead_id and undone_at is null and prev_state is not null;
  if v_latest <> e.id then raise exception 'UNDO_NOT_LATEST' using errcode='P0001'; end if;

  -- بنرجّع عواميد الـ pipeline من الـ snapshot (jsonb_populate_record بيحافظ على باقي العواميد)
  update leads l set
    stage = r.stage, stage_changed_at = r.stage_changed_at, first_message_at = r.first_message_at,
    last_contacted_at = r.last_contacted_at, follow_ups_sent = r.follow_ups_sent,
    next_follow_up_on = r.next_follow_up_on, reminder_note = r.reminder_note, replied_at = r.replied_at,
    meeting_booked_at = r.meeting_booked_at, meeting_at = r.meeting_at, proposal_sent_at = r.proposal_sent_at,
    won_at = r.won_at, lost_at = r.lost_at, lost_reason = r.lost_reason
  from jsonb_populate_record(null::leads, e.prev_state) r
  where l.id = e.lead_id
  returning l.* into v;

  update lead_events set undone_at = now() where id = e.id;
  return jsonb_build_object('lead', to_jsonb(v) - 'search_text');
end $$;
```

#### 0006_follow_ups.sql
```sql
create or replace function public.follow_up_queue(p_waiting_limit int default 100)
returns table (
  bucket text, bucket_total bigint, days_overdue int,
  id uuid, name text, instagram_handle text, whatsapp_e164 text, industry_id smallint,
  country_code text, stage lead_stage, last_contacted_at timestamptz,
  next_follow_up_on date, reminder_note text, meeting_at timestamptz
) language sql stable set search_path = public as $$
  with s as (select timezone, (now() at time zone timezone)::date as today from settings where owner_id = auth.uid()),
  base as (
    select l.*,
      case
        when l.stage = 'meeting_booked' and (l.meeting_at at time zone s.timezone)::date = s.today then 'meeting_today'
        when l.next_follow_up_on is null then null
        when l.next_follow_up_on <= s.today and l.stage = 'message_sent' then 'due_fu1'
        when l.next_follow_up_on <= s.today and l.stage = 'follow_up_1'  then 'due_fu2'
        when l.next_follow_up_on <= s.today and l.stage = 'follow_up_2'  then 'due_fu3'
        when l.next_follow_up_on <= s.today and l.stage = 'follow_up_3'  then 'exhausted'
        when l.next_follow_up_on <= s.today and l.stage not in ('won','lost') then 'reminder'
        when l.next_follow_up_on >  s.today and l.stage in ('message_sent','follow_up_1','follow_up_2','follow_up_3') then 'waiting'
      end as bucket,
      s.today - l.next_follow_up_on as days_overdue
    from leads l, s
    where l.deleted_at is null
      and (l.next_follow_up_on is not null or l.stage = 'meeting_booked')
  ),
  ranked as (
    select b.*, count(*) over (partition by b.bucket) as bucket_total,
           row_number() over (partition by b.bucket order by b.next_follow_up_on, b.last_contacted_at nulls first, b.id) as rn
    from base b where b.bucket is not null
  )
  select bucket, bucket_total, greatest(days_overdue, 0), id, name, instagram_handle, whatsapp_e164, industry_id,
         country_code::text, stage, last_contacted_at, next_follow_up_on, reminder_note, meeting_at
    from ranked
   where bucket <> 'waiting' or rn <= least(p_waiting_limit, 500)
   order by array_position(array['due_fu1','due_fu2','due_fu3','reminder','meeting_today','exhausted','waiting'], bucket), rn
$$;
```

#### 0007_import.sql
```sql
-- الجداول: §3.5.1، + الإضافات دي على import_rows:
--   kind text not null default 'lead' check (kind in ('lead','event','industry'))   -- للاسترجاع
--   committed_at timestamptz, result_lead_id uuid
-- RLS: own على الجدولين

-- (1) رفع دفعة (idempotent: لو اتبعتت مرتين مفيش تكرار، وده اللي بيخلّي الـ Resume آمن)
create or replace function public.stage_import_rows(p_job uuid, p_rows jsonb) returns int
language plpgsql set search_path = public as $$
declare n int;
begin
  insert into import_rows (job_id, row_no, kind, raw, data, status, issues)
  select p_job, r.row_no, coalesce(r.kind,'lead'), r.raw, r.data, r.status::import_row_status, coalesce(r.issues,'[]')
    from jsonb_to_recordset(p_rows) as r(row_no int, kind text, raw jsonb, data jsonb, status text, issues jsonb)
  on conflict (job_id, row_no) do nothing;
  get diagnostics n = row_count;
  update import_jobs set staged_rows = (select count(*) from import_rows where job_id = p_job), status = 'staging'
   where id = p_job;
  return n;
end $$;

-- (2) بعد ما الرفع يخلص: فحص التكرار set-based + القرارات الافتراضية + العدادات
create or replace function public.finalize_import_staging(p_job uuid) returns jsonb
language plpgsql set search_path = public as $$
declare v_strategy text; v_counts jsonb;
begin
  select coalesce(options->>'duplicate_strategy','skip') into v_strategy from import_jobs where id = p_job for update;
  update import_jobs set status = 'validating' where id = p_job;

  -- مكرر جوه الملف (بالـ handle وبعدين بالرقم): أول ظهور بيفضل
  with d as (
    select row_no, row_number() over (partition by data->>'instagram_handle' order by row_no) rn
      from import_rows where job_id = p_job and kind = 'lead' and status in ('valid','incomplete')
       and data->>'instagram_handle' is not null)
  update import_rows r set status = 'duplicate_file' from d
   where r.job_id = p_job and r.row_no = d.row_no and d.rn > 1;
  with d as (
    select row_no, row_number() over (partition by data->>'whatsapp_e164' order by row_no) rn
      from import_rows where job_id = p_job and kind = 'lead' and status in ('valid','incomplete')
       and data->>'whatsapp_e164' is not null)
  update import_rows r set status = 'duplicate_file' from d
   where r.job_id = p_job and r.row_no = d.row_no and d.rn > 1;

  -- مكرر في الداتابيز (بيستخدم الـ unique indexes)
  update import_rows r set status = 'duplicate_db', match_lead_id = l.id
    from leads l
   where r.job_id = p_job and r.kind = 'lead' and r.status in ('valid','incomplete')
     and l.deleted_at is null
     and (l.instagram_handle = r.data->>'instagram_handle' or l.whatsapp_e164 = r.data->>'whatsapp_e164');

  update import_rows set decision = case status
      when 'valid' then 'import' when 'incomplete' then 'import'
      when 'duplicate_db' then case v_strategy when 'skip' then 'skip' else 'update' end
      else 'skip' end
   where job_id = p_job and decision is null;

  select jsonb_object_agg(status, c) into v_counts
    from (select status, count(*) c from import_rows where job_id = p_job group by status) x;
  update import_jobs set counts = v_counts, status = 'review' where id = p_job;
  return v_counts;
end $$;

-- (3) تصليح صف واحد من صفحة التقرير. الـ client بيتحقق بـ zod الأول، والسيرفر بيعيد فحص التكرار للصف ده
create or replace function public.update_import_row(p_job uuid, p_row_no int, p_data jsonb, p_status text, p_issues jsonb)
returns import_rows language plpgsql set search_path = public as $$ ... $$;

-- (4) قرار جماعي: set_import_decisions(p_job, p_status import_row_status, p_decision text) → int

-- (5) التنفيذ على دفعات (كل نداء = transaction لوحدها)
create or replace function public.commit_import(p_job uuid, p_batch int default 2000) returns jsonb
language plpgsql set search_path = public as $$
declare v_job import_jobs; v_ins int := 0; v_upd int := 0; v_left int; v_mode text;
begin
  select * into v_job from import_jobs where id = p_job for update;
  if v_job.status not in ('review','committing') then raise exception 'INVALID_TRANSITION' using errcode='P0001'; end if;
  v_mode := coalesce(v_job.options->>'duplicate_strategy','skip');   -- fill_empty | replace
  update import_jobs set status = 'committing' where id = p_job;

  with batch as (
    select * from import_rows
     where job_id = p_job and kind = 'lead' and decision = 'import' and committed_at is null
     order by row_no limit least(p_batch, 5000) for update skip locked
  ), ins as (
    insert into leads (name, company, industry_id, industry_other, job_title, instagram_handle, whatsapp_e164,
                       country_code, notes, has_content, appears_in_content, has_videographer, problems,
                       stage, import_job_id)
    select d->>'name', d->>'company', (d->>'industry_id')::smallint, d->>'industry_other', d->>'job_title',
           d->>'instagram_handle', d->>'whatsapp_e164', d->>'country_code', d->>'notes',
           (d->>'has_content')::boolean, (d->>'appears_in_content')::boolean,
           coalesce((d->>'has_videographer')::tri_state,'unknown'), d->>'problems',
           coalesce((d->>'stage')::lead_stage,'new'), p_job
      from (select data d, row_no from batch) b
    on conflict do nothing                 -- لو اتضاف نفس الحساب في الوقت ده من مكان تاني
    returning id, instagram_handle, whatsapp_e164
  )
  update import_rows r set committed_at = now(),
         result_lead_id = (select i.id from ins i
                            where i.instagram_handle is not distinct from r.data->>'instagram_handle'
                              and i.whatsapp_e164   is not distinct from r.data->>'whatsapp_e164' limit 1)
    from batch b where r.job_id = b.job_id and r.row_no = b.row_no;
  get diagnostics v_ins = row_count;

  -- التحديثات (للمكرر في الداتابيز): بنحفظ raw_before الأول عشان الـ Rollback
  with batch as (
    select * from import_rows
     where job_id = p_job and kind='lead' and decision = 'update' and committed_at is null
     order by row_no limit least(p_batch, 5000) for update skip locked
  ), before as (
    update import_rows r set raw_before = to_jsonb(l) - 'search_text'
      from batch b join leads l on l.id = b.match_lead_id
     where r.job_id = b.job_id and r.row_no = b.row_no
    returning r.row_no
  )
  update leads l set
    company    = case when v_mode='replace' then coalesce(b.data->>'company', l.company)    else coalesce(l.company,    b.data->>'company') end,
    job_title  = case when v_mode='replace' then coalesce(b.data->>'job_title', l.job_title) else coalesce(l.job_title, b.data->>'job_title') end,
    industry_id= case when v_mode='replace' then coalesce((b.data->>'industry_id')::smallint, l.industry_id) else coalesce(l.industry_id, (b.data->>'industry_id')::smallint) end,
    country_code=case when v_mode='replace' then coalesce(b.data->>'country_code', l.country_code) else coalesce(l.country_code, b.data->>'country_code') end,
    whatsapp_e164 = coalesce(l.whatsapp_e164, b.data->>'whatsapp_e164'),
    instagram_handle = coalesce(l.instagram_handle, b.data->>'instagram_handle'),
    notes = case when nullif(b.data->>'notes','') is null then l.notes
                 when l.notes is null then b.data->>'notes'
                 else l.notes || E'\n— ' || (b.data->>'notes') end         -- الملاحظات بتتضاف، مش بتتمسح
    -- ... نفس النمط لباقي الحقول
  from batch b where l.id = b.match_lead_id;
  get diagnostics v_upd = row_count;
  update import_rows set committed_at = now()
   where job_id = p_job and decision = 'update' and committed_at is null
     and row_no in (select row_no from import_rows where job_id = p_job and raw_before is not null);

  select count(*) into v_left from import_rows
   where job_id = p_job and decision in ('import','update') and committed_at is null;
  update import_jobs set committed_rows = committed_rows + v_ins + v_upd,
         status = case when v_left = 0 then 'done' else 'committing' end,
         finished_at = case when v_left = 0 then now() end
   where id = p_job;
  return jsonb_build_object('inserted', v_ins, 'updated', v_upd, 'remaining', v_left);
end $$;

-- (6) Rollback (في خلال 7 أيام)
create or replace function public.rollback_import(p_job uuid) returns jsonb
language plpgsql set search_path = public as $$
declare v_job import_jobs; v_del int; v_res int;
begin
  select * into v_job from import_jobs where id = p_job for update;
  if v_job.status <> 'done' or v_job.finished_at < now() - interval '7 days' then
    raise exception 'INVALID_TRANSITION' using errcode='P0001';
  end if;
  update leads set deleted_at = now() where import_job_id = p_job and deleted_at is null;
  get diagnostics v_del = row_count;
  update leads l set company = r.raw_before->>'company', job_title = r.raw_before->>'job_title',
         industry_id = (r.raw_before->>'industry_id')::smallint, country_code = r.raw_before->>'country_code',
         whatsapp_e164 = r.raw_before->>'whatsapp_e164', instagram_handle = r.raw_before->>'instagram_handle',
         notes = r.raw_before->>'notes' /* ... */
    from import_rows r where r.job_id = p_job and r.raw_before is not null and l.id = r.match_lead_id;
  get diagnostics v_res = row_count;
  update import_jobs set status = 'rolled_back' where id = p_job;
  return jsonb_build_object('deleted', v_del, 'restored', v_res);
end $$;
```

#### 0008_backups.sql
```sql
-- الجداول: backups (+ last_notified_at timestamptz) · push_subscriptions (§3.5.1) + RLS own

insert into storage.buckets (id, name, public, file_size_limit) values ('backups','backups', false, 104857600)
  on conflict do nothing;
create policy "own backups read" on storage.objects for select to authenticated
  using (bucket_id = 'backups' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own backups upload" on storage.objects for insert to authenticated   -- للنسخة اليدوية من الـ client
  with check (bucket_id = 'backups' and (storage.foldername(name))[1] = auth.uid()::text);

-- حساب معاد النسخة الجاية (pure function، وبتتنادي من الـ trigger على backup_settings ومن الـ Edge Function)
create or replace function public.compute_next_backup(
  p_freq text, p_weekday int, p_month_day int, p_hour int, p_tz text, p_from timestamptz
) returns timestamptz language plpgsql stable as $$
declare local_now timestamp := p_from at time zone p_tz; cand timestamp;
begin
  if p_freq = 'off' then return null; end if;
  cand := date_trunc('day', local_now) + make_interval(hours => p_hour);
  case p_freq
    when 'daily' then if cand <= local_now then cand := cand + interval '1 day'; end if;
    when 'weekly', 'biweekly' then
      cand := cand + make_interval(days => ((p_weekday - extract(dow from cand)::int + 7) % 7));
      if cand <= local_now then cand := cand + interval '7 days'; end if;
      -- biweekly: الـ Edge Function بتضيف 14 يوم من آخر تشغيل، عشان التكرار يفضل ثابت
    when 'monthly' then
      cand := date_trunc('month', local_now) + make_interval(days => p_month_day - 1, hours => p_hour);
      if cand <= local_now then cand := cand + interval '1 month'; end if;
  end case;
  return cand at time zone p_tz;
end $$;

-- trigger: أي تعديل في الجدولة بيعيد حساب next_run_at
create trigger backup_settings_next before insert or update of frequency, weekday, month_day, hour_local
  on public.backup_settings for each row execute function public.backup_settings_set_next();

create or replace function public.mark_backup_downloaded(p_id uuid) returns void
language sql set search_path = public as $$
  update backups set downloaded_at = coalesce(downloaded_at, now()) where id = p_id
$$;

-- Cron: كل ساعة الدقيقة 5. بيبعت طلب للـ Edge Function لكل يوزر جه معاده
-- الـ secret متخزن في Supabase Vault باسم 'cron_secret'، والـ URL في 'functions_url'
select cron.schedule('backup-dispatch', '5 * * * *', $$
  select net.http_post(
    url     := (select decrypted_secret from vault.decrypted_secrets where name = 'functions_url') || '/generate-backup',
    headers := jsonb_build_object('Content-Type','application/json',
               'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')),
    body    := jsonb_build_object('owner_id', owner_id, 'kind', 'scheduled'))
  from public.backup_settings
  where frequency <> 'off' and next_run_at <= now();
$$);

-- Cron: تذكير يومي الساعة 9 (بتوقيت UTC 6) للنسخ اللي اتعملت ومحدش نزّلها
select cron.schedule('backup-remind', '0 6 * * *', $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name='functions_url') || '/send-notification',
    headers := jsonb_build_object('Content-Type','application/json',
               'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name='cron_secret')),
    body := jsonb_build_object('type','backup_reminder','backup_id', b.id, 'owner_id', b.owner_id))
  from public.backups b
  where b.status = 'ready' and b.downloaded_at is null
    and b.created_at < now() - interval '20 hours'
    and (b.last_notified_at is null or b.last_notified_at < now() - interval '20 hours');
$$);
```

#### 0009_dashboard.sql
```sql
create or replace function public.dashboard_stats(p_from timestamptz, p_to timestamptz)
returns jsonb language sql stable set search_path = public as $$
  with prev as (select p_from - (p_to - p_from) as f, p_from as t),
  ev as (
    select type, lead_id, occurred_at >= p_from as is_cur
      from lead_events, prev
     where undone_at is null and occurred_at >= prev.f and occurred_at < p_to
       and type in ('message_sent','follow_up_sent','reply_received','meeting_booked','won')
  ),
  agg as (
    select is_cur,
      count(*) filter (where type = 'message_sent')                    as first_messages,
      count(*) filter (where type = 'follow_up_sent')                  as follow_ups,
      count(distinct lead_id) filter (where type = 'reply_received')   as replied,
      count(*) filter (where type = 'meeting_booked')                  as meetings,
      count(*) filter (where type = 'won')                             as won
    from ev group by is_cur
  ),
  leads_new as (
    select count(*) filter (where created_at >= p_from)                       as cur,
           count(*) filter (where created_at <  p_from)                       as prev
      from leads, prev where deleted_at is null and created_at >= prev.f and created_at < p_to
  ),
  pipeline as (
    select jsonb_object_agg(stage, c) as by_stage, sum(c) as total
      from (select stage, count(*) c from leads where deleted_at is null group by stage) x
  )
  select jsonb_build_object(
    'total_leads',   (select total from pipeline),
    'pipeline',      (select by_stage from pipeline),
    'new_leads',     jsonb_build_object('cur', (select cur from leads_new), 'prev', (select prev from leads_new)),
    'not_contacted', coalesce(((select by_stage from pipeline)->>'new')::int, 0),
    'cur',  (select to_jsonb(a) - 'is_cur' from agg a where is_cur),
    'prev', (select to_jsonb(a) - 'is_cur' from agg a where not is_cur)
  )
$$;
-- الـ TS بيعمل parse للـ JSON بـ zod (DashboardStatsSchema)، وبيحسب النسب (reply rate، conversion) والـ deltas
```

#### 0010_maintenance.sql
```sql
select cron.schedule('purge-trash',   '30 2 * * *', $$ delete from public.leads where deleted_at < now() - interval '30 days' $$);
select cron.schedule('purge-staging', '45 2 * * *', $$
  delete from public.import_rows r using public.import_jobs j
   where r.job_id = j.id and j.created_at < now() - interval '30 days' $$);
select cron.schedule('purge-backups-orphans', '0 3 * * 0', $$
  delete from public.backups where status = 'failed' and created_at < now() - interval '30 days' $$);
```
> الـ cron jobs بتشتغل كـ `postgres` (بتتخطى الـ RLS)، فهي معمولة عشان تمسح **بشروط زمنية بس**، ومفيش أي مدخلات من برا.

### 18.4 الفرونت إند: الأساسيات

#### 18.4.1 الـ Dependencies (بالظبط)
```bash
pnpm add next react react-dom @supabase/supabase-js @supabase/ssr @tanstack/react-query @tanstack/react-virtual \
  next-intl nuqs zod react-hook-form @hookform/resolvers libphonenumber-js i18n-iso-countries \
  sonner lucide-react class-variance-authority clsx tailwind-merge comlink exceljs idb-keyval @sentry/nextjs
pnpm add https://cdn.sheetjs.com/xlsx-latest/xlsx-latest.tgz      # SheetJS الرسمي (نسخة npm متوقفة)
pnpm add -D typescript @types/node @types/react tailwindcss @tailwindcss/postcss eslint eslint-config-next \
  prettier prettier-plugin-tailwindcss supabase tsx
```

#### 18.4.2 الـ Env vars
| المتغير | فين | الاستخدام |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel + `.env.local` | |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Vercel + `.env.local` | المفتاح العام (RLS هو اللي بيحمي) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Vercel | الاشتراك في الـ Push |
| `NEXT_PUBLIC_SENTRY_DSN` | Vercel | |
| `SENTRY_AUTH_TOKEN` | Vercel (build) | رفع الـ source maps |
| `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | **Supabase secrets بس** | Edge Function |
| `RESEND_API_KEY`, `BACKUP_EMAIL_FROM` | **Supabase secrets بس** | Edge Function |
| `CRON_SECRET` | Supabase secrets + Vault | حماية الـ Edge Functions من النداء من برا |
- `src/lib/env.ts`: بيعمل validation لكل الـ env بـ zod وقت الـ build، فلو متغير ناقص الـ build بيفشل برسالة واضحة.
- `.env.example` في الريبو **فيه أسماء المتغيرات بس، من غير أي قيم**.

#### 18.4.3 Supabase clients
```ts
// src/lib/supabase/client.ts — browser singleton
export const supabase = createBrowserClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

// src/lib/supabase/server.ts — لكل request (Server Components / Route Handlers)
export async function createServerSupabase() {
  const cookieStore = await cookies();
  return createServerClient<Database>(URL, KEY, { cookies: { getAll: () => cookieStore.getAll(),
    setAll: (list) => { try { list.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch {} } } });
}

// src/lib/supabase/rpc.ts — typed helper بيحوّل الأخطاء لـ AppError
export async function rpc<F extends keyof Database['public']['Functions']>(fn: F, args: Args<F>, signal?: AbortSignal) {
  const q = supabase.rpc(fn, args); if (signal) q.abortSignal(signal);
  const { data, error } = await q; if (error) throw toAppError(error); return data as Returns<F>;
}
```

#### 18.4.4 `src/proxy.ts` (الـ middleware في Next 16)
```ts
export async function proxy(req: NextRequest) {
  // 1) بنحدّث الـ session عن طريق supabase.auth.getUser() (ده اللي بيجدد الـ cookies)
  // 2) PUBLIC = ['/login', '/reset-password', '/auth/callback', '/manifest.webmanifest', '/sw.js', '/icons/*']
  // 3) مفيش user والـ path مش public → redirect('/login?next=' + encodeURIComponent(pathname + search))
  // 4) في user والـ path هو /login → redirect('/')
  // 5) بنعمل CSP nonce ونحطه في header 'x-nonce' + Content-Security-Policy (§18.9)
}
export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico|fonts/).*)'] };
```
- `safeNext(next)`: بيقبل بس اللي بيبدأ بـ `/` ومش بيبدأ بـ `//` ولا `/\`، وأي حاجة غير كده بترجّع `/`.

#### 18.4.5 الـ Providers (`src/app/(app)/providers.tsx`)
```ts
new QueryClient({ defaultOptions: {
  queries: { staleTime: 30_000, gcTime: 10 * 60_000, refetchOnWindowFocus: true,
             retry: (n, e) => toAppError(e).code === 'NETWORK' && n < 2 },
  mutations: { retry: 0 } } });
// الترتيب: NuqsAdapter > QueryClientProvider > DirectionProvider(dir) > TooltipProvider > {children} + <Toaster/>
```

#### 18.4.6 الـ i18n
- `src/i18n/request.ts`: بيقرا `NEXT_LOCALE` من الـ cookie، ولو مش موجودة بيستخدم `ar`. وبيرجّع `{ locale, messages, timeZone: settings.timezone }`.
- `messages/ar.json` و `en.json` مقسومين بـ namespaces: `common, nav, auth, leads, stages, actions, followUps, dashboard, settings, data, errors, a11y`.
- **Type safety:** `global.d.ts` فيه `interface AppConfig { Messages: typeof ar }`، فلو key غلط بيطلع type error.
- `src/lib/format.ts`: `formatNumber`, `formatDate`, `formatRelative`, `formatDateTime`، وكلهم بياخدوا `locale` و `timeZone`، وبيرجّعوا **أرقام لاتيني** (`numberingSystem: 'latn'`).

#### 18.4.7 الـ Query keys والـ invalidation
§7 + القاعدة دي: **أي mutation بتعمل invalidate بأقل نطاق ممكن**، وكل قواعد الـ invalidation مكتوبة في مكان واحد `src/lib/invalidate.ts`:
```ts
export const invalidate = {
  afterLeadAction: (qc, id) => Promise.all([ qc.invalidateQueries({ queryKey: ['lead-events', id] }),
     qc.invalidateQueries({ queryKey: ['leads'] }), qc.invalidateQueries({ queryKey: ['stage-counts'] }),
     qc.invalidateQueries({ queryKey: ['follow-ups'] }), qc.invalidateQueries({ queryKey: ['dashboard'] }) ]),
  afterLeadEdit: (qc, id) => ...,      // ['leads'], ['stage-counts'] (لو اتغير حاجة بتأثر على الفلاتر)
  afterImport: (qc) => qc.invalidateQueries(),   // كل حاجة
};
```

### 18.5 الفيتشرز على مستوى الكود

#### 18.5.1 Leads: الملفات والـ API
```
src/features/leads/
├─ schema.ts           # leadInputSchema (zod) + LeadInput + LeadListRow + LeadFilters + filtersToRpcArgs()
├─ api.ts              # createLead, updateLead, softDeleteLead, restoreLead, getLead, searchLeads, stageCounts, suggestLeads, checkDuplicate
├─ queries.ts          # useLead, useLeadsInfinite, useStageCounts, useSuggest, useDuplicateCheck, useCreateLead, useUpdateLeadField, useDeleteLead
├─ filters.ts          # useLeadFilters() — nuqs parsers: q, stage[], industry[], country[], sort, + qualification/due/missing/import
├─ cursor.ts           # buildCursor(sort, row) / إعداد الصفحة الجاية
└─ components/
   ├─ LeadFormDialog.tsx        # Dialog (md+) / Sheet (mobile) — RHF + zod
   ├─ fields/InstagramField.tsx # parse on paste/blur + chip + duplicate warning
   ├─ fields/PhoneField.tsx     # libphonenumber + country-aware
   ├─ fields/CountryCombobox.tsx
   ├─ fields/IndustrySelect.tsx # + "other" text
   ├─ fields/TriStateToggle.tsx
   ├─ LeadsToolbar.tsx          # SearchInput + FiltersButton + SortSelect + ExportButton + ImportButton
   ├─ StageTabs.tsx
   ├─ FilterSheet.tsx / ActiveFilterChips.tsx
   ├─ LeadsTable.tsx (md+) / LeadsCardList.tsx (mobile) — virtualized
   ├─ LeadRow.tsx / LeadCard.tsx — memoized
   ├─ LeadsEmpty.tsx / LeadsSkeleton.tsx
   └─ detail/{LeadHeader, LeadFields (inline autosave), QualificationCard, NotesCard, NextFollowUpCard}.tsx
```
**`leadInputSchema` (مصدر واحد للتحقق: الفورم، والتعديل inline، والاستيراد)**
```ts
export const leadInputSchema = z.object({
  name: z.string().trim().min(1, 'required').max(120),
  company: z.string().trim().max(120).optional().nullable(),
  industry_id: z.number().int().positive().nullable(),
  industry_other: z.string().trim().max(80).optional().nullable(),
  job_title: z.string().trim().max(80).optional().nullable(),
  instagram_handle: z.string().regex(/^[a-z0-9._]{1,30}$/).nullable(),
  whatsapp_e164: z.string().regex(/^\+[1-9]\d{6,14}$/).nullable(),
  country_code: z.string().length(2).nullable(),
  notes: z.string().max(5000).optional().nullable(),
  has_content: z.boolean().nullable(),
  appears_in_content: z.boolean().nullable(),
  has_videographer: z.enum(['yes','no','unknown']).default('unknown'),
  problems: z.string().trim().max(280).optional().nullable(),
}).refine(v => v.instagram_handle || v.whatsapp_e164, { path: ['instagram_handle'], message: 'contact_required' });
```
**`useLeadsInfinite(filters)`**
```ts
useInfiniteQuery({
  queryKey: qk.leads(filters),
  queryFn: ({ pageParam, signal }) => api.searchLeads({ ...filtersToRpcArgs(filters), p_cursor: pageParam, p_limit: 51 }, signal),
  initialPageParam: null,
  getNextPageParam: (last) => last.length > 50 ? buildCursor(filters.sort, last[49]) : undefined,
  select: (d) => ({ ...d, pages: d.pages.map(p => p.slice(0, 50)) }),
  placeholderData: keepPreviousData,
});
```
**تحضير البحث في الـ client (`prepareQuery`)** قبل ما يتبعت:
1. لو الـ query عبارة عن لينك أو handle إنستجرام (`parseInstagram` نجحت ومفيهاش مسافات)، بنبعت الـ handle بس.
2. لو 6 أرقام أو أكتر (بعد ما نحوّل الأرقام الهندية): بنشيل أي حاجة غير الأرقام، ونشيل الأصفار اللي في الأول. فـ `01012345678` بتبقى `1012345678`، وده substring من `201012345678`.
3. غير كده: النص زي ما هو، والسيرفر بيطبّعه.

**الـ Inline autosave (`useUpdateLeadField`)**
- كل حقل ليه `useAutosaveField(leadId, field, value)`:
  - debounce 600ms، أو flush فوري لما يحصل blur.
  - قبل الحفظ: `leadInputSchema.shape[field].safeParse`. لو فشل بيظهر الخطأ تحت الحقل، ومفيش طلب بيتبعت.
  - Optimistic update على `qk.lead(id)`. ولو فشل: rollback والـ `SaveIndicator` بيبقى error وجنبه "إعادة المحاولة".
  - Mutations الحقل الواحد بتمشي **ورا بعض** (queue لكل حقل)، عشان الرد القديم ميكتبش فوق الجديد.
  - لو في تغييرات لسه متحفظتش وحاولت تقفل الصفحة: `beforeunload` بيطلع تحذير.

#### 18.5.2 Pipeline
```
src/features/pipeline/
├─ stages.ts            # STAGES (order, group, colorToken, icon), ACTIONS, TRANSITIONS, primaryActionFor(stage), secondaryActionsFor(stage)
├─ optimistic.ts        # applyActionOptimistic(lead, action, payload, settings, today) — نفس منطق الـ SQL بالظبط
├─ use-lead-action.ts   # الـ hook الأساسي
├─ use-undo.ts
└─ components/{ActionBar, PrimaryActionButton, SecondaryActions, StageOverrideMenu,
               MeetingDialog, LostReasonDialog, ReminderDialog, SnoozeMenu, Timeline, TimelineItem}.tsx
```
```ts
// use-lead-action.ts
export function useLeadAction() {
  const qc = useQueryClient(); const t = useTranslations();
  return useMutation({
    mutationFn: (v: { lead: LeadLike; action: LeadAction; payload?: Payload }) =>
      rpc('lead_action', { p_lead_id: v.lead.id, p_action: v.action, p_payload: v.payload ?? {}, p_expected_stage: v.lead.stage }),
    onMutate: async (v) => {
      await qc.cancelQueries({ queryKey: ['leads'] }); await qc.cancelQueries({ queryKey: ['follow-ups'] });
      const snapshot = snapshotQueries(qc, [['leads'], ['lead', v.lead.id], ['follow-ups']]);
      const next = applyActionOptimistic(v.lead, v.action, v.payload, getSettings(qc), today());
      patchLeadEverywhere(qc, v.lead.id, next);            // lists (infinite pages), detail, follow-ups buckets
      return { snapshot };
    },
    onError: (e, v, ctx) => { restoreQueries(qc, ctx?.snapshot); const err = toAppError(e);
      toast.error(t(err.messageKey)); if (err.code === 'STAGE_CONFLICT') invalidate.afterLeadAction(qc, v.lead.id); },
    onSuccess: (res, v) => { patchLeadEverywhere(qc, v.lead.id, res.lead);
      toast.success(t('actions.done.' + v.action, { name: v.lead.name }), {
        duration: 6000, action: { label: t('common.undo'), onClick: () => undo.mutate(res.event_id) } }); },
    onSettled: (_r, _e, v) => invalidate.afterLeadAction(qc, v.lead.id),
  });
}
```
- **الـ Lead اللي مبقاش مطابق للفلتر** (مثلًا إنت في تاب New وعملت Send Message): بيفضل ظاهر 800ms ومتعلّم عليه، وبعدين بيختفي بأنيميشن. ده أحسن من إنه يختفي فجأة.
- **مزامنة `stages.ts` مع الـ SQL:** في **تعليق ثابت** فوق مصفوفة `TRANSITIONS` بيشاور على `0005_pipeline.sql`، وفي سكريبت تحقق مؤقت في المهمة 2.4 بيقارن الاتنين وبعدين بيتمسح.

#### 18.5.3 Follow-ups
```
src/features/follow-ups/
├─ api.ts / queries.ts      # useFollowUpQueue() → groupBy(bucket) + totals
└─ components/{FollowUpsHeader (count + progress), BucketSection, FollowUpCard, SwipeableRow,
               OpenDmButton, InboxZero, WaitingSection (collapsed)}.tsx
```
- **التقدّم:** `doneToday` بيتحسب من cache محلي (`sessionStorage` بمفتاح التاريخ) ومعاه `initialDueCount`. ده بيدّي progress bar ثابت حتى لما الكروت تختفي.
- **`OpenDmButton`:** `window.open(instagramUrl(handle), '_blank', 'noopener')`، وبعدها بنسجّل `pendingReturnLeadId`. ولما ييجي `visibilitychange` بـ `visible`، بنعمل highlight (pulse لمدة ثانيتين) على زرار "تم" بتاع الـ Lead ده.
- **`SwipeableRow`:** pointer events بس (من غير مكتبة)، و threshold 35% من العرض، والاتجاه بيتعكس في الـ RTL. فيه `touch-action: pan-y` عشان الـ scroll العمودي يفضل شغال. ولو `prefers-reduced-motion`، الـ swipe بيتقفل والزرار هو اللي بيفضل.
- **Badge الـ Nav:** `useFollowUpQueue` بـ `select` للعدد بس، و `staleTime: 60s`.

#### 18.5.4 Dashboard
```
src/features/dashboard/{api.ts, queries.ts, range.ts (presets → from/to بالـ timezone), components/{RangePicker, KpiGrid, KpiCard, DueTodayCard, PipelineBar}.tsx}
```
- `DashboardStatsSchema` (zod) بيعمل parse للـ JSON. والـ `computeKpis(stats)` بتحسب النسب والـ deltas. لو القيمة السابقة 0، الـ delta بتتعرض "—" مش ∞.
- الفترة متخزنة في الـ URL (`?range=30d`).

#### 18.5.5 Settings
```
src/features/settings/{api.ts, queries.ts, components/{LanguageSwitch, FollowUpIntervals (+ live preview), TimezoneSelect,
  DefaultCountry, IndustriesManager (dnd: pointer-based reorder + keyboard ↑↓), AccountSection}.tsx}
```
- **`LanguageSwitch`:** بيعمل `document.cookie = NEXT_LOCALE=…; path=/; max-age=31536000; samesite=lax` وفي نفس الوقت `update settings`، وبعدها `router.refresh()`.
- **`IndustriesManager`:** الترتيب بيتحفظ بـ upsert واحد لكل الصفوف (`sort_order`). مفيش زرار حذف، فيه **إخفاء**. الحذف ممكن بس لو مفيش ولا Lead عليه النشاط ده.

### 18.6 الـ Workers (Comlink)
```ts
// src/features/data-hub/import/import.worker.ts
export interface ImportWorkerApi {
  readFile(file: File | ArrayBuffer, opts: { encoding?: string }): Promise<{ sheets: { name: string; rows: number }[] }>;
  loadSheet(name: string, opts: { headerRow?: number }): Promise<{ headers: string[]; sample: string[][]; totalRows: number; detectedHeaderRow: number }>;
  autoMap(ctx: { industries: Industry[]; countries: Country[]; savedMappings: SavedMapping[] }): Promise<Mapping>;
  unknownValues(mapping: Mapping): Promise<Record<'industry'|'stage'|'country'|'tri', string[]>>;
  validateAll(mapping: Mapping, ctx: ValidateCtx, onProgress: (done: number, total: number) => void):
    Promise<{ counts: Counts }>;                              // النتايج بتفضل جوه الـ worker
  takeBatch(from: number, size: number): Promise<StagedRow[]>;  // الـ main thread بيسحب دفعات يرفعها
  buildProblemsWorkbook(rowNos: number[]): Promise<ArrayBuffer>;
}
// src/features/data-hub/export/export.worker.ts
export interface ExportWorkerApi {
  begin(spec: SerializableSpec, locale: 'ar'|'en', format: 'xlsx'|'csv'): Promise<void>;
  addRows(sheet: string, rows: unknown[]): Promise<void>;     // الصفحات بتيجي من الـ main thread
  finish(): Promise<ArrayBuffer>;                            // transfer (zero-copy)
}
```
- **الإنشاء:** `new Worker(new URL('./import.worker.ts', import.meta.url), { type: 'module' })` جوه `useWorker()`. الـ worker بيتعمل lazy (لما تحتاجه بس)، وبيتقفل `terminate()` لما الـ component يعمل unmount أو تدوس إلغاء.
- **الـ Progress:** عن طريق `Comlink.proxy(onProgress)`، ومعمول له throttle كل 100ms.
- **الـ Transfer:** الـ ArrayBuffers بتتبعت بـ `Comlink.transfer` من غير ما تتنسخ.
- **Fallback:** لو الـ Worker مش مدعوم (نادر جدًا)، بنعرض رسالة إن المتصفح قديم. ومفيش fallback بيعلّق الـ main thread.

**قاموس المرادفات (`header-synonyms.ts`)** (مختصر، والكامل بيتكتب في المهمة 4.8):
```ts
export const HEADER_SYNONYMS: Record<LeadField, string[]> = {
  name: ['name','full name','client','الاسم','اسم','اسم العميل','العميل'],
  company: ['company','business','brand','الشركة','شركة','البراند'],
  industry: ['industry','niche','activity','category','النشاط','المجال','التخصص'],
  job_title: ['title','position','role','job','المنصب','الوظيفة','المسمى'],
  instagram: ['instagram','insta','ig','link','profile','انستجرام','انستا','انستغرام','اللينك','الرابط'],
  whatsapp: ['whatsapp','phone','mobile','number','واتساب','واتس','رقم','موبايل','تليفون','الهاتف'],
  country: ['country','الدولة','البلد'],
  notes: ['notes','note','comments','ملاحظات','ملاحظة'],
  has_content: ['has content','content','لديه محتوى','محتوى'],
  appears_in_content: ['appears','on camera','يظهر بنفسه','يظهر'],
  has_videographer: ['videographer','camera team','photographer','مصور','فريق تصوير'],
  problems: ['problems','pain points','issues','المشاكل','مشاكل'],
  stage: ['stage','status','المرحلة','الحالة'],
};
// المطابقة: normalize (lower + normalize_search equivalent + إزالة الرموز) ثم exact → startsWith → includes → Levenshtein ≤ 2
// + content sniffing: ≥60% من أول 50 قيمة بيطابقوا نمط معين (instagram URL / phone / country name) → اقتراح
```

### 18.7 الـ Edge Functions (Deno)
**`supabase/functions/generate-backup/index.ts`**
```
1. التحقق: header x-cron-secret == CRON_SECRET  أو  JWT صالح لليوزر (للنسخة اليدوية "نسخة دلوقتي")
2. owner_id = body.owner_id (من الـ cron) أو من الـ JWT
3. insert backups(status='running', kind, format)
4. القراءة على دفعات كل دفعة 5000 (service role + فلتر owner_id صريح في كل query):
   leads (من غير search_text) · lead_events · industries · settings
5. الكتابة: format=xlsx → SheetJS: شيت "_meta" فيه {app:'scope-crm', format_version:1, created_at, counts}،
   وشيت لكل جدول، والعناوين بالـ keys الداخلية (عشان الاسترجاع يبقى دقيق 100%)
   format=json → { meta, leads:[], events:[], industries:[], settings:{} }
   format=csv_zip → ملف CSV لكل جدول + meta.json في zip (fflate)
   * لو الـ leads أكتر من 150k، بيتحول لـ csv_zip لوحده (حماية من حد الذاكرة)
6. sha256 (crypto.subtle) → رفع على storage: backups/{owner_id}/{yyyy-mm-dd_HHmm}_{kind}.{ext}
7. update backups(status='ready', size, counts, checksum)
8. لو scheduled: update backup_settings.next_run_at = compute_next_backup(..., now()) (و biweekly = آخر تشغيل + 14 يوم)
9. Retention: نسخ الـ scheduled الزيادة عن keep_last بتتمسح (من الـ storage ومن الجدول)
10. invoke send-notification {type:'backup_ready', backup_id}
11. أي خطأ: status='failed' + error، وإعادة المحاولة (الـ cron الجاي بيلاقي next_run_at لسه فاتت)، وبعد 3 مرات فشل → إشعار فشل
```
**`supabase/functions/send-notification/index.ts`**
```
- الأنواع: backup_ready · backup_reminder · backup_failed
- Push: لكل push_subscriptions بتاعة اليوزر → web push (VAPID). لو رجع 404/410 الاشتراك بيتمسح.
  payload: { title, body, url: '/data/backups?download=<id>', tag: 'backup-<id>' }   (الـ tag بيمنع تكرار الإشعار)
- Email (لو notify_email): Resend، وفيه signed URL صالح 7 أيام (createSignedUrl بالـ service role)
- update backups.last_notified_at
- النصوص بلغة اليوزر (settings.locale)
```
**`public/sw.js` (Service Worker)**
- `push`: بيعرض `showNotification(title, { body, icon, badge, tag, data: { url } })`.
- `notificationclick`: بيركّز على تاب مفتوحة لو موجودة، ولو لأ بيفتح `data.url`.
- **Caching:** للـ app shell والـ static assets بس (`/_next/static/*`، الخطوط، الأيقونات) بـ stale-while-revalidate. **مفيش أي caching لطلبات الـ API.**

### 18.8 التحميل على اللابتوب والحفظ التلقائي
```ts
// src/features/data-hub/backups/download.ts
async function downloadBackup(b: Backup) {
  const { data } = await supabase.storage.from('backups').createSignedUrl(b.storage_path, 60, { download: fileName(b) });
  const saved = await tryAutoSave(b, data.signedUrl);      // File System Access لو متفعّل
  if (!saved) triggerAnchorDownload(data.signedUrl);
  await rpc('mark_backup_downloaded', { p_id: b.id });
}
// fs-access.ts
// pickFolder(): showDirectoryPicker({ id: 'scope-backups', mode: 'readwrite', startIn: 'documents' }) → idb-keyval.set('backupDir', handle)
// tryAutoSave(): handle = idb.get('backupDir'); if (!handle) return false;
//   if (await handle.queryPermission({mode:'readwrite'}) !== 'granted') → نطلب requestPermission (محتاج ضغطة من اليوزر، فبنعرضها كزرار في الـ banner)
//   fetch(url) → blob → handle.getFileHandle(name, {create:true}) → createWritable → write → close → true
// عند فتح التطبيق: لو في نسخ ready ومش downloaded والـ auto-save متفعّل → بيحفظها لوحده لو الصلاحية granted
```

### 18.9 الأمان والـ Config
**`next.config.ts`**
```ts
export default withSentryConfig(withNextIntl({
  poweredByHeader: false,
  async headers() { return [{ source: '/(.*)', headers: [
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
    { key: 'X-Robots-Tag', value: 'noindex, nofollow' } ] }]; },
}));
```
**الـ CSP (بيتعمل في `proxy.ts` بـ nonce لكل request)**
```
default-src 'self';
script-src 'self' 'nonce-{N}' 'strict-dynamic';
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob:;
font-src 'self';
connect-src 'self' https://{project}.supabase.co wss://{project}.supabase.co https://*.ingest.sentry.io;
worker-src 'self' blob:;
frame-ancestors 'none'; base-uri 'self'; form-action 'self';
```
- **Supabase Auth:** `Enable signups = OFF` · `Minimum password length = 12` · `Secure email change` · الـ `Site URL` والـ `Redirect URLs` على دومين الـ Production بس (والـ dev على مشروع الـ dev).

### 18.10 سياسة "صفر داتا وهمية" (Production-ready من أول يوم)
| مسموح في Production | ممنوع في Production |
|---|---|
| اليوزر الحقيقي (بيتعمل مرة واحدة من Supabase Dashboard ← Authentication ← Add user) | أي Lead تجريبي، أو "مثال"، أو "Test" |
| الإعدادات (قيم config زي مواعيد المتابعة، وإنت بتغيّرها) | يوزرز تجريبيين |
| الأنشطة الـ 7 اللي في الـ spec بتاعك | ملفات seed فيها داتا وهمية |
| جدول الدول (داتا مرجعية) | صفحات أو routes للتجربة (`/test`، `/demo`) |
| | `console.log` في الكود |
| | ملفات اختبار في الريبو |

- **أول مرة تفتح فيها التطبيق:** الشاشات بتبان فاضية بشكل محترم (Empty states)، ومعاها **دليل بداية** صغير على الـ Dashboard: "① ضيف أول Lead · ② أو استورد شيت Excel · ③ اظبط مواعيد المتابعة". الدليل بيختفي لوحده أول ما يبقى عندك Lead.
- **كل التطوير والتحقق بيحصل على مشروع `scope-crm-dev`**، وبيتصفّر بعد كل مرحلة.
- **قبل الإطلاق (المهمة 6.8):** audit بيتأكد إن Production فيه 0 leads، و 0 events، ويوزر واحد بس، و `grep` على الريبو بيتأكد إن مفيش `console.log` ولا `TODO` ولا `test`/`demo`/`lorem`.

---
---

# الجزء التالت: التنفيذ (المراحل والمهام كـ Prompts)

## 19. منهجية التنفيذ

### 19.1 إزاي تستخدم المهام
- كل مهمة في §20 **Prompt كامل لوحده**. تنسخه وتديه لـ Claude Code (أو تقولّي "نفّذ المهمة 1.4") فيتنفّذ.
- **المهام صغيرة عن قصد:** كل مهمة بتاخد من 20 لـ 90 دقيقة، وبتلمس عدد قليل من الملفات، وليها نتيجة تقدر تتأكد منها.
- **الترتيب مهم:** كل مهمة مكتوب عليها بتعتمد على إيه. متبدأش مهمة قبل ما اللي قبلها يخلصوا.
- **الـ Prompts مكتوبة بالإنجليزي** عن قصد: الـ AI بيبقى أدق في التعليمات التقنية بالإنجليزي. العنوان والملخص بالعربي عشان تعرف المهمة دي بتعمل إيه.

### 19.2 الأدوار (Roles)
كل مهمة بتبدأ بـ **Role** بيحدد "القبعة" اللي الـ AI بيلبسها:
| الدور | بيركّز على |
|---|---|
| 🏛️ **Software Architect** | الهيكل، والحدود بين الطبقات، والقرارات اللي صعب ترجع فيها، والـ infra |
| 🗄️ **Database Engineer** | الـ schema، والـ SQL، والـ indexes، والـ RLS، والأداء، والـ transactions |
| 🎨 **Design System Engineer** | الـ tokens، والكومبوننتس، والـ RTL، والـ accessibility، والحركة، والحالات |
| ⚙️ **Software Engineer** (Frontend/Fullstack) | الفيتشرز، والـ hooks، والـ state، والتكامل، والـ edge cases |
| 🚀 **DevOps Engineer** | CI، والـ deploy، والـ env، والـ backups، والـ monitoring |
| 🔒 **Security Engineer** | الـ RLS، والـ headers، والـ secrets، وسطح الهجوم |
| 🧪 **QA Engineer** | التحقق المنهجي، وقوايم الفحص، والحالات الحدّية |

### 19.3 الـ Preamble الثابت (بيتحط قبل أي مهمة)
> ده الجزء اللي بيتحط **أول كل Prompt**، وهو اللي بيخلّي كل المهام ماشية بنفس الجودة ونفس طريقة التفكير.

```xml
<global_rules>
You are working on "Scope Mini CRM". The single source of truth is PLAN.md in the repo root.
Before writing code, read the PLAN.md sections referenced by this task (and §18.0, §18.1).

MINDSET — think flexibly, like a senior engineer:
- Ask yourself: what if the data is 100x bigger? what if the user makes a mistake? what if the network drops mid-way?
  what if the input arrives in an unexpected shape? what if we need to change this later?
- Prefer the simplest design that fully satisfies these. Do not add features that are not asked for.
- If the task conflicts with PLAN.md or you find a gap, STOP and state the conflict and your recommendation before coding.

HARD RULES:
1. Production-ready only: no mock data, no demo/sample/lorem content, no test users, no /test or /demo routes,
   no console.log, no commented-out code, no TODOs left behind.
2. All user-facing text goes through next-intl (messages/ar.json + messages/en.json — both updated together).
3. CSS uses logical properties only (ms/me/ps/pe/start/end). Every UI works at 375px and ≥1024px, in RTL and LTR, light and dark.
4. Every interactive element: keyboard accessible, visible focus, ≥44px touch target on mobile, aria labels where no visible text.
5. Every async UI has loading (skeleton), empty, and error states. Every destructive action is undoable or confirmed.
6. Data access only via src/features/*/api.ts → hooks. Errors are mapped through toAppError().
7. DB: new migration file per change (never edit an applied migration); RLS on every table; functions use
   `set search_path = public, extensions`; set-based SQL, no row-by-row loops over user data.
8. TypeScript strict; no `any` (use `unknown` + narrowing); regenerate DB types after schema changes (`pnpm db:types`).

VERIFICATION & CLEANUP (mandatory, at the end of the task):
- Put any temporary verification scripts/fixtures ONLY in `.tmp/` (git-ignored).
- Run them against the DEV Supabase project only (never production).
- Run `pnpm typecheck && pnpm lint && pnpm build` — all must pass.
- Then delete everything you created in `.tmp/` and any data you inserted into DEV for the check.
- Report: what you built, files changed, how you verified it, and anything that deviates from PLAN.md.
</global_rules>
```

### 19.4 قالب المهمة (بنستخدمه في كل §20)
```xml
<task id="X.Y" title="...">
  <role>...</role>
  <depends_on>...</depends_on>
  <read_first>PLAN.md §..</read_first>
  <context>ليه المهمة دي موجودة، وإيه اللي موجود قبلها</context>
  <objective>نتيجة واحدة واضحة</objective>
  <requirements>خطوات/متطلبات مرقّمة ومحددة</requirements>
  <edge_cases>الحالات الحدّية اللي لازم تتغطى</edge_cases>
  <constraints>الممنوعات والحدود</constraints>
  <acceptance_criteria>checklist يتقاس</acceptance_criteria>
  <verification>إزاي تتأكد، وإيه اللي يتمسح بعد كده</verification>
  <deliverables>الملفات</deliverables>
</task>
```

### 19.5 قايمة الفحص اليدوي الثابتة (قبل أي Deploy كبير، ~10 دقايق)
- [ ] Login → Logout → Login تاني، والـ `next=` بيرجّعك لنفس الصفحة
- [ ] إضافة Lead باللينك، ورسالة التكرار بتظهر لو ضفته تاني
- [ ] Send Message → Follow-up → Reply → Meeting → Proposal → Won، والـ Undo على آخر خطوة
- [ ] البحث بـ "احمد" بيلاقي "أحمد"، والبحث بجزء من الرقم بيلاقي الـ Lead
- [ ] صفحة المتابعات فيها الـ Lead المستحق (على الـ Dev بنغيّر `next_follow_up_on` يدويًا)
- [ ] تصدير Excel من صفحة الـ Leads، والملف بيفتح صح في Excel
- [ ] تبديل اللغة، واتجاه الصفحة بيتقلب صح
- [ ] موبايل 375px: الـ bottom nav، والـ FAB، والـ sheet
- [ ] Dark mode
- [ ] **بعد الفحص: كل الداتا اللي اتعملت على الـ Dev بتتمسح**

---

## 20. المراحل والمهام

> كل مهمة = Prompt. قبل أي مهمة لازم تحط الـ Preamble (§19.3).
> ⏱️ = الوقت التقديري · 🔗 = بتعتمد على · 📖 = الأقسام اللي لازم تتقري

---

### 🧱 Phase 0: التأسيس (½ يوم)
**النتيجة:** تطبيق فاضي على Production، فيه Login شغال وهيكل كامل، بالعربي والإنجليزي.

#### المهمة 0.1: إنشاء المشروع والأدوات
> 🏛️ Software Architect · ⏱️ 30د · 🔗 — · 📖 §2.3، §7، §18.1، §18.4.1
```xml
<task id="0.1" title="Scaffold the Next.js project and tooling">
  <role>Senior software architect setting up a production-grade Next.js 16 codebase.</role>
  <context>Empty folder. This is the foundation every later task builds on, so conventions set here must match PLAN.md §18.1 exactly.</context>
  <objective>A clean Next.js 16 (App Router, TypeScript, Tailwind v4, src/ dir, pnpm) project with strict tooling and the folder skeleton from §7.</objective>
  <requirements>
    1. `pnpm create next-app` with TypeScript, ESLint, Tailwind, App Router, src dir, alias `@/*`; Node 22 (`.nvmrc`, `engines`).
    2. tsconfig: strict, noUncheckedIndexedAccess, `@/*` → `src/*`.
    3. Install dependencies listed in §18.4.1 (SheetJS from cdn.sheetjs.com tarball).
    4. Prettier + prettier-plugin-tailwindcss; scripts: dev, build, start, lint, typecheck (`tsc --noEmit`), format, db:types (`supabase gen types typescript --linked > src/types/database.ts`).
    5. ESLint: next/core-web-vitals + a `no-restricted-syntax`/custom rule that rejects className strings containing `\b(ml|mr|pl|pr|left|right)-` and `text-left|text-right` (logical properties only); `no-console: error`.
    6. Create the folder skeleton from §7 with no placeholder logic (only folders + index files where a module boundary is needed).
    7. `.gitignore` includes `.tmp/`, `.env*.local`, `supabase/.temp`. Create `.env.example` with variable NAMES only (§18.4.2).
    8. `src/lib/env.ts`: zod-validated env (client + server split); import it in next.config so builds fail on missing vars.
    9. Remove all create-next-app boilerplate (sample page content, svgs, default styles).
  </requirements>
  <constraints>No UI yet beyond an empty root layout. No sample content.</constraints>
  <acceptance_criteria>
    - [ ] `pnpm typecheck && pnpm lint && pnpm build` pass.
    - [ ] Adding `className="ml-2"` anywhere makes `pnpm lint` fail (verify, then revert).
    - [ ] No boilerplate files remain; `.env.example` has names only.
  </acceptance_criteria>
  <verification>Run the commands above; temporarily add a ml-2 class to prove the lint rule, then remove it.</verification>
  <deliverables>package.json, tsconfig.json, eslint config, .prettierrc, .gitignore, .env.example, .nvmrc, src/lib/env.ts, folder skeleton.</deliverables>
</task>
```

#### المهمة 0.2: الـ Design Tokens والخطوط والثيم
> 🎨 Design System Engineer · ⏱️ 45د · 🔗 0.1 · 📖 §18.2
```xml
<task id="0.2" title="Design tokens, fonts, light/dark theme">
  <role>Design system engineer building an RTL-first, bilingual token system.</role>
  <objective>`src/styles/tokens.css` + Tailwind v4 `@theme` mapping every token in §18.2, with light/dark modes and Arabic/Latin fonts.</objective>
  <requirements>
    1. Define all color tokens (incl. 10 stage bg/fg pairs) as CSS variables in OKLCH for `:root` and `[data-theme="dark"]`, plus `@media (prefers-color-scheme: dark)` for `:root:not([data-theme="light"])`.
    2. Map tokens into Tailwind via `@theme inline` so classes like `bg-surface`, `text-fg-muted`, `bg-stage-replied-bg` exist.
    3. Radius, shadow, motion (durations/easing), z-index tokens exactly as §18.2.3. Global `prefers-reduced-motion` rule zeroing durations.
    4. Fonts via next/font/google: Inter + IBM Plex Sans Arabic (400–700), exposed as CSS variables, `--font-sans` stack per §18.2.2; `:lang(ar)` line-height multiplier.
    5. Base styles: body uses `bg-bg text-fg`, inputs min 16px font, `font-variant-numeric: tabular-nums` utility `.tnum`, focus-visible ring using `--focus`.
    6. Theme toggle mechanics: `data-theme` attribute on <html> read from cookie `theme` (system|light|dark) with a tiny inline script (nonce-ready) to avoid flash.
    7. Verify every stage bg/fg pair has contrast ≥ 4.5:1 in both modes (compute in a temp script; adjust lightness if not).
  </requirements>
  <constraints>No hardcoded colors anywhere outside tokens.css.</constraints>
  <acceptance_criteria>
    - [ ] Toggling data-theme switches all surfaces without flash on reload.
    - [ ] Contrast check passes for all 10 stage pairs + fg/bg + fg-muted/surface.
    - [ ] Arabic and Latin text render with the correct font in the same line.
  </acceptance_criteria>
  <verification>Temp contrast script in .tmp/ (delete after). Visual check of a temporary swatch rendered in the browser — delete the temporary swatch file after.</verification>
  <deliverables>src/styles/tokens.css, src/app/globals.css, src/app/fonts.ts, src/lib/theme.ts.</deliverables>
</task>
```

#### المهمة 0.3: مكتبة الكومبوننتس الأساسية
> 🎨 Design System Engineer · ⏱️ 60د · 🔗 0.2 · 📖 §18.2.4
```xml
<task id="0.3" title="Base UI component library (shadcn, RTL-ready)">
  <role>Design system engineer.</role>
  <objective>All components in §18.2.4 available under src/components/ui, styled only with tokens, working in RTL/LTR and light/dark.</objective>
  <requirements>
    1. `shadcn init` (Tailwind v4 mode) then add: button, input, textarea, select, command (combobox), popover, dialog, sheet, tabs, tooltip, badge, skeleton, dropdown-menu, checkbox, label, separator, scroll-area, progress, sonner.
    2. Rewrite their classes to logical properties and tokens; wrap the app with Radix `DirectionProvider` (dir from locale).
    3. Build custom: SegmentedControl (radiogroup, allowDeselect), StageBadge (color + lucide icon + translated label), EmptyState, KpiCard, SaveIndicator, Kbd, Progress with label + cancel.
    4. Button: variants/sizes/loading per §18.2.4 (loading keeps width, disables, sets aria-busy).
    5. Sheet on mobile slides from bottom with drag handle, respects safe-area; Dialog on md+.
    6. Create `src/components/ui/responsive-dialog.tsx`: Dialog ≥768px, bottom Sheet below — one API.
  </requirements>
  <edge_cases>Long Arabic labels truncate with ellipsis on the logical end; icons with direction flip in RTL.</edge_cases>
  <acceptance_criteria>
    - [ ] Each component keyboard-operable with visible focus; overlays trap focus and close on Esc.
    - [ ] No `left/right` classes (lint passes).
  </acceptance_criteria>
  <verification>Render a temporary gallery page under `.tmp/` route copy (or a temporary app route) to inspect all states in ar/en, light/dark, 375px/1280px — then delete it.</verification>
  <deliverables>src/components/ui/*.tsx, components.json.</deliverables>
</task>
```

#### المهمة 0.4: الـ i18n (عربي وإنجليزي)
> ⚙️ Software Engineer · ⏱️ 40د · 🔗 0.3 · 📖 §F8، §18.4.6
```xml
<task id="0.4" title="Bilingual i18n with cookie-based locale and direction">
  <role>Senior frontend engineer.</role>
  <objective>next-intl configured without URL prefixes; locale from cookie NEXT_LOCALE (default ar); <html lang dir> set server-side; typed messages.</objective>
  <requirements>
    1. `src/i18n/request.ts` + next-intl plugin; messages/ar.json and messages/en.json with namespaces from §18.4.6 (only keys needed now: common, nav, auth, errors, a11y).
    2. Root layout sets `lang` and `dir` (rtl for ar) and the font variables.
    3. Global `AppConfig` typing so unknown keys fail typecheck.
    4. `src/lib/format.ts` (formatNumber/Date/DateTime/Relative) using Intl with `numberingSystem: 'latn'`, locale + timeZone params.
    5. `useSetLocale()` hook: writes cookie (1 year, samesite=lax) then `router.refresh()`.
    6. Error message keys for every AppErrorCode in §18.1 (both languages).
  </requirements>
  <acceptance_criteria>
    - [ ] Switching locale flips direction with no layout breakage and no full reload flash.
    - [ ] A missing key in en.json causes a type error.
  </acceptance_criteria>
  <verification>Temporarily remove a key to see the typecheck fail, restore it.</verification>
  <deliverables>src/i18n/*, messages/*.json, src/lib/format.ts, global.d.ts, src/hooks/use-set-locale.ts.</deliverables>
</task>
```

#### المهمة 0.5: مشاريع Supabase والـ clients
> 🏛️ Software Architect · ⏱️ 30د · 🔗 0.1 · 📖 §12، §18.4.3
```xml
<task id="0.5" title="Supabase projects, CLI, and typed clients">
  <role>Software architect.</role>
  <context>Two Supabase projects in eu-central-1: `scope-crm-dev` (verification, disposable data) and `scope-crm` (production, zero test data). The user creates them in the dashboard; you wire everything else.</context>
  <objective>Supabase CLI linked to DEV by default, typed browser/server clients, rpc helper, error mapper.</objective>
  <requirements>
    1. `supabase init`; document in README how to link dev vs prod (`supabase link --project-ref`), never auto-push to prod from local.
    2. Implement src/lib/supabase/client.ts, server.ts, rpc.ts exactly as §18.4.3.
    3. Implement src/lib/errors.ts (AppError, AppErrorCode, toAppError) per §18.1 catalog, with Sentry capture for UNKNOWN only.
    4. Auth settings checklist in README for BOTH projects: signups OFF, min password 12, site URL/redirects, email templates in Arabic+English.
  </requirements>
  <constraints>No service_role key in the Next.js app or Vercel. Never run destructive commands against prod.</constraints>
  <acceptance_criteria>
    - [ ] `pnpm db:types` generates types from DEV.
    - [ ] toAppError maps a PostgrestError with message 'STAGE_CONFLICT' and a 23505 on leads_ig_unique correctly (verify with a temp script, delete after).
  </acceptance_criteria>
  <deliverables>supabase/config.toml, src/lib/supabase/*, src/lib/errors.ts, README.md (setup section).</deliverables>
</task>
```

#### المهمة 0.6: Migration الأساس (settings + إنشاء اليوزر)
> 🗄️ Database Engineer · ⏱️ 40د · 🔗 0.5 · 📖 §3.5، §3.5.1، §18.3 (0001، 0002)
```xml
<task id="0.6" title="Foundation migrations: extensions, settings, countries">
  <role>Senior PostgreSQL engineer.</role>
  <objective>Migrations 0001_foundation.sql and 0002_reference.sql applied to DEV.</objective>
  <requirements>
    1. 0001 exactly per §18.3: extensions (pg_trgm, unaccent in `extensions`, pg_cron, pg_net), set_updated_at, settings, backup_settings (+ last_reminded_at), RLS policies, handle_new_user (stub version that inserts settings + backup_settings only; industries are added in 0003 by replacing the function).
       NOTE: compute_next_backup is created in 0008; in 0001 insert backup_settings with next_run_at NULL.
    2. 0002: countries table + RLS read policy + 250 INSERT rows generated ONCE by a temporary script (.tmp/gen-countries.ts using i18n-iso-countries ar/en + libphonenumber-js getCountryCallingCode). Commit only the SQL; delete the script.
    3. Do not create the auth trigger yet (it depends on industries; added in 0003).
  </requirements>
  <acceptance_criteria>
    - [ ] `select count(*) from countries` ≈ 249–250; Egypt row = ('EG','مصر','Egypt','+20').
    - [ ] RLS enabled on all three tables (`select relrowsecurity ...`).
  </acceptance_criteria>
  <verification>`supabase db push` to DEV, run checks via SQL, delete the generator script.</verification>
  <deliverables>supabase/migrations/0001_foundation.sql, 0002_reference.sql.</deliverables>
</task>
```

#### المهمة 0.7: تسجيل الدخول (Auth) كامل
> ⚙️ Software Engineer · ⏱️ 60د · 🔗 0.4، 0.5 · 📖 §F1، §18.4.4
```xml
<task id="0.7" title="Authentication: login, proxy guard, reset password, logout">
  <role>Senior fullstack engineer with security focus.</role>
  <objective>Only an authenticated user can reach any app route; full password reset flow; safe redirects.</objective>
  <requirements>
    1. src/proxy.ts per §18.4.4 (session refresh, public paths, redirect with safe `next`). Implement `safeNext()` in src/lib/safe-next.ts.
    2. /login: email + password (RHF + zod), autocomplete attributes, show/hide password, Enter submits, loading button, generic error "invalid credentials", RATE_LIMITED message. Centered card, logo text "Scope CRM", language switch in the corner.
    3. "Forgot password" → sends reset email → /auth/callback (exchange code) → /reset-password (new password ×2, min 12) → redirect `/`.
    4. Sign-out action (server action or client) clearing session and redirecting to /login.
    5. Session expiry mid-use: a global listener on `onAuthStateChange('SIGNED_OUT')` + 401 mapping redirects to /login?next=current.
  </requirements>
  <edge_cases>`next=//evil.com`, `next=/\evil`, `next=https://...` all → `/`. Already-logged-in user visiting /login → `/`.</edge_cases>
  <constraints>No signup page/link anywhere.</constraints>
  <acceptance_criteria>
    - [ ] Unauthenticated access to `/leads` redirects to `/login?next=%2Fleads`, and after login lands on /leads.
    - [ ] Open-redirect attempts are neutralized.
    - [ ] Works in ar/en, mobile/desktop.
  </acceptance_criteria>
  <verification>Create a temporary user in DEV, test the flows in the browser, then delete that user.</verification>
  <deliverables>src/proxy.ts, src/lib/safe-next.ts, src/app/(auth)/login/page.tsx, reset-password/page.tsx, src/app/auth/callback/route.ts, src/features/auth/*.</deliverables>
</task>
```

#### المهمة 0.8: هيكل التطبيق (Shell) والتنقل
> 🎨 Design System + ⚙️ Software Engineer · ⏱️ 60د · 🔗 0.3، 0.7 · 📖 §6.1، §18.4.5
```xml
<task id="0.8" title="App shell: providers, navigation, error boundaries">
  <role>Senior frontend engineer with strong UX sense.</role>
  <objective>Authenticated layout with responsive navigation and all global providers; empty route pages ready for features.</objective>
  <requirements>
    1. src/app/(app)/layout.tsx + providers.tsx (QueryClient config §18.4.5, NuqsAdapter, DirectionProvider, TooltipProvider, Toaster positioned per §6.3).
    2. Mobile (<768): bottom nav (Home, Leads, Follow-ups with badge slot, Settings) + FAB slot, safe-area padding. Desktop: collapsible sidebar with same items + prominent "New lead" button slot.
    3. Active route highlighting; nav labels via i18n; icons per §18.2.5.
    4. Route pages: `/`, `/leads`, `/follow-ups`, `/settings`, `/data` — each renders only a page title + EmptyState (real empty state copy, not placeholder text) until its feature lands.
    5. error.tsx and not-found.tsx per route group (friendly message + retry), global-error.tsx with Sentry capture.
    6. Theme toggle + language switch placed in Settings section of nav (desktop) / settings page (mobile).
    7. `document.title` pattern: "{page} · Scope CRM".
  </requirements>
  <acceptance_criteria>
    - [ ] No layout shift when navigating; nav never overlaps content (bottom padding = nav height + safe area).
    - [ ] Keyboard: Tab order logical; skip-to-content link.
  </acceptance_criteria>
  <deliverables>src/app/(app)/**, src/components/shell/*.</deliverables>
</task>
```

#### المهمة 0.9: الأمان الأساسي والـ PWA المبدئي
> 🔒 Security Engineer · ⏱️ 30د · 🔗 0.7 · 📖 §9، §18.9
```xml
<task id="0.9" title="Security headers, CSP with nonce, noindex, base manifest">
  <role>Security engineer.</role>
  <objective>Hardened HTTP headers and CSP from day one.</objective>
  <requirements>
    1. next.config headers per §18.9; `poweredByHeader: false`.
    2. Nonce-based CSP generated in proxy.ts; pass nonce to the theme inline script and next scripts (per Next.js CSP docs).
    3. app/robots.ts disallow all; metadata robots noindex.
    4. app/manifest.ts (name, short_name, start_url "/", display standalone, theme/background colors from tokens, icons 192/512 + maskable). Icons: simple generated monogram "S" — real asset files, not placeholders.
  </requirements>
  <acceptance_criteria>
    - [ ] No CSP violations in console on login and app pages.
    - [ ] securityheaders-style check (curl -I) shows all headers.
  </acceptance_criteria>
  <deliverables>next.config.ts, src/proxy.ts (CSP), src/app/robots.ts, src/app/manifest.ts, public/icons/*.</deliverables>
</task>
```

#### المهمة 0.10: CI و Vercel و Sentry وأول Deploy
> 🚀 DevOps Engineer · ⏱️ 45د · 🔗 0.1–0.9 · 📖 §12
```xml
<task id="0.10" title="CI, Vercel production deploy, Sentry, real user">
  <role>DevOps engineer.</role>
  <objective>Every push to main is checked and deployed; production DB has migrations and exactly one real user.</objective>
  <requirements>
    1. Git init, first commit, GitHub private repo (ask the user before creating/pushing anything remote).
    2. .github/workflows/ci.yml: pnpm install (cache) → lint → typecheck → build.
    3. .github/workflows/migrate.yml: on push to main touching supabase/migrations → `supabase db push` to PROD using secrets (SUPABASE_ACCESS_TOKEN, PROD_PROJECT_REF, PROD_DB_PASSWORD); runs before Vercel promotes (document ordering).
    4. Vercel project: region fra1, env vars from §18.4.2, production branch main.
    5. Sentry Next.js SDK (client + server), sample rate 0.1 traces, no PII.
    6. The user creates their real account in PROD dashboard (Authentication → Add user); verify settings/backup_settings rows were created by the trigger (after 0003 exists; until then verify settings only).
  </requirements>
  <constraints>Never seed or test-write in PROD. Remote actions (repo creation, pushes, Vercel linking) require the user's explicit go-ahead.</constraints>
  <acceptance_criteria>
    - [ ] Production URL shows the login page; the user can log in and see the shell.
    - [ ] CI green.
  </acceptance_criteria>
  <deliverables>.github/workflows/*, sentry configs, README deploy section.</deliverables>
</task>
```
**✅ نهاية Phase 0:** اللينك شغال، وفيه Login بالعربي والإنجليزي، والهيكل كامل، و Production نضيف.

---

### 👥 Phase 1: الـ Leads (1.5 يوم)
**النتيجة:** تقدر تضيف وتعدّل وتمسح وتبحث وتفلتر الـ Leads، على أي حجم داتا.

#### المهمة 1.1: جداول الـ Leads والأنشطة
> 🗄️ Database Engineer · ⏱️ 60د · 🔗 0.6 · 📖 §3.1–3.3، §3.6–3.8، §18.3 (0003)
```xml
<task id="1.1" title="Leads schema, derivation trigger, RLS, indexes">
  <role>Senior PostgreSQL engineer optimizing for 100k+ rows per user.</role>
  <objective>Migration 0003_leads.sql exactly per §18.3, applied to DEV.</objective>
  <requirements>
    1. Enums lead_stage, tri_state; tables industries, leads (all columns incl. import_job_id, missing_fields, search_text) with every CHECK constraint from §3.3.
    2. normalize_search (immutable, explicit unaccent dictionary), leads_derive trigger (search_text, missing_fields, trimming), set_updated_at trigger, industries_touch_leads trigger.
    3. Replace handle_new_user to also insert the 7 spec industries; create `on_auth_user_created` trigger.
    4. RLS `own` policies on industries and leads.
    5. All indexes from §3.6 + leads_last_contact_idx + leads_name_idx + leads_missing_idx (+ leads_import_idx).
    6. Backfill: for any user that already exists in DEV/PROD, insert the 7 industries if missing (idempotent insert ... where not exists) — this is reference data from the spec, not test data.
  </requirements>
  <edge_cases>normalize_search('أحمـــد') = 'احمد'; ('مُصطفى') = 'مصطفي'; ('٠١٠') = '010'; NULL-safe.</edge_cases>
  <acceptance_criteria>
    - [ ] Inserting a lead without instagram and whatsapp fails (has_contact).
    - [ ] Two live leads with the same handle fail; same handle after soft delete of the first succeeds.
    - [ ] search_text contains industry and country names in both languages.
    - [ ] A second DEV user cannot read the first user's leads.
  </acceptance_criteria>
  <verification>Temp SQL in .tmp/ run against DEV (create 2 temp users + a few rows), then delete those rows/users and the script.</verification>
  <deliverables>supabase/migrations/0003_leads.sql, regenerated src/types/database.ts.</deliverables>
</task>
```

#### المهمة 1.2: دوال البحث والفلترة والتكرار
> 🗄️ Database Engineer · ⏱️ 75د · 🔗 1.1 · 📖 §F3، §18.3 (0004)
```xml
<task id="1.2" title="search_leads, lead_stage_counts, suggest_leads, check_duplicate">
  <role>Senior PostgreSQL performance engineer.</role>
  <objective>Migration 0004_leads_rpc.sql implementing the four RPCs + lead_filter_sql per §18.3, safe against SQL injection and fast at 100k rows.</objective>
  <requirements>
    1. lead_filter_sql builds WHERE with format(%L) only; escapes LIKE wildcards; supports every filter key in §18.3.
    2. search_leads: sorts newest/oldest/last_contact/next_follow_up/name (keyset on (key,id)) and relevance (offset ≤ 500); limit clamp 1..100; returns rank.
    3. Keyset correctness: cursor comparison must use the same expression and type as ORDER BY (cast cursor value explicitly per sort: timestamptz/date/text).
    4. lead_stage_counts with same filters minus stages.
    5. suggest_leads wrapper sets pg_trgm.word_similarity_threshold=0.35 locally, uses `<%`.
    6. check_duplicate per §18.3.
    7. GRANT EXECUTE to authenticated only; REVOKE from anon/public.
  </requirements>
  <edge_cases>Query with only spaces; tokens of 1–2 chars (still works, may not use index); `%` and `_` typed literally; Arabic + English mixed; empty arrays for filters = no filter; cursor from a row whose sort key is NULL.</edge_cases>
  <acceptance_criteria>
    - [ ] "احمد" finds "أحمد"; "doctor" and "طبيب" find leads with that industry; "مصر" finds EG leads.
    - [ ] Paging through all rows with every sort returns each row exactly once (no gaps/dupes).
    - [ ] EXPLAIN ANALYZE on 100k temp rows: search < 150ms, counts < 150ms, no Seq Scan on leads for search/filter by stage.
  </acceptance_criteria>
  <verification>Generate 100k temp leads in DEV via .tmp/ SQL (generate_series), run EXPLAIN + paging checks, then DELETE them and the script.</verification>
  <deliverables>supabase/migrations/0004_leads_rpc.sql, types regenerated.</deliverables>
</task>
```

#### المهمة 1.3: دوال التطبيع (إنستجرام، أرقام، عربي)
> ⚙️ Software Engineer · ⏱️ 45د · 🔗 0.1 · 📖 §F2، §18.5.1
```xml
<task id="1.3" title="Normalizers: instagram, phone, arabic, query preparation">
  <role>Senior TypeScript engineer obsessed with input robustness.</role>
  <objective>Pure, dependency-light functions used by forms, search, and import.</objective>
  <requirements>
    1. src/lib/normalize/instagram.ts: parseInstagram (per §F2, plus: strips query/hash, trailing dots/slashes, uppercase, `instagram.com/@handle`, `www.instagram.com/handle/reels/`), instagramUrl.
       Returns discriminated union { ok:true, handle } | { ok:false, reason:'post_link'|'invalid'|'empty' }.
    2. src/lib/normalize/arabic.ts: normalizeArabicDigits, normalizeSearch (mirror of SQL normalize_search for client-side matching in import).
    3. src/lib/normalize/phone.ts: parsePhone(input, defaultCountry) → { ok, e164, country } using libphonenumber-js/min; accepts Arabic-Indic digits, spaces, dashes, 00 prefix; waUrl(e164).
    4. src/features/leads/prepare-query.ts per §18.5.1 (IG → handle; ≥6 digits → digits w/o leading zeros; else raw).
  </requirements>
  <edge_cases>`@` alone; `instagram.com/` with no handle; handles with 31+ chars; `instagram.com/p/xyz`; phone `+20 10 1234 5678`, `٠١٠١٢٣٤٥٦٧٨`, `0020...`, numbers valid for another country than default.</edge_cases>
  <acceptance_criteria>
    - [ ] A temporary table-driven check (≥30 IG cases, ≥15 phone cases) passes.
  </acceptance_criteria>
  <verification>.tmp/check-normalizers.ts via `pnpm tsx`, then delete it.</verification>
  <deliverables>src/lib/normalize/*.ts, src/features/leads/prepare-query.ts.</deliverables>
</task>
```

#### المهمة 1.4: الـ Schema والـ Data layer للـ Leads
> ⚙️ Software Engineer · ⏱️ 45د · 🔗 1.2، 1.3 · 📖 §18.4.7، §18.5.1
```xml
<task id="1.4" title="Lead schema, API module, query hooks, filters state">
  <role>Senior frontend engineer.</role>
  <objective>Typed, centralized data access for leads (no component touches supabase directly).</objective>
  <requirements>
    1. schema.ts: leadInputSchema (§18.5.1), LeadFilters type, filtersToRpcArgs.
    2. api.ts: createLead, updateLead(id, patch), softDeleteLead, restoreLead, getLead, searchLeads, stageCounts, suggestLeads, checkDuplicate, listIndustries, listCountries — all via rpc()/from() with toAppError.
    3. query-keys.ts (qk) and invalidate.ts per §18.4.7.
    4. filters.ts: nuqs parsers (q string, stage/industry/country arrays, sort enum default 'newest', plus has_content, appears, videographer, due, has_whatsapp, missing, import) with shallow routing and history 'replace' for q.
    5. cursor.ts buildCursor(sort,row).
    6. queries.ts: useLeadsInfinite (§18.5.1), useStageCounts, useLead, useIndustries/useCountries (staleTime Infinity, gc 1h), useDuplicateCheck (debounced 300ms, enabled only when handle/phone valid), useSuggest (enabled only when results are empty and q.length ≥ 3).
  </requirements>
  <acceptance_criteria>
    - [ ] Hooks are typed end-to-end from generated DB types; zero `any`.
  </acceptance_criteria>
  <deliverables>src/features/leads/{schema,api,queries,filters,cursor}.ts, src/lib/{query-keys,invalidate}.ts.</deliverables>
</task>
```

#### المهمة 1.5: حقول الفورم الذكية
> 🎨 Design System + ⚙️ Software Engineer · ⏱️ 75د · 🔗 1.4 · 📖 §F2
```xml
<task id="1.5" title="Smart form fields: Instagram, Phone, Country, Industry, TriState">
  <role>Senior frontend engineer with design-system discipline.</role>
  <objective>Reusable RHF-compatible fields that make data entry fast and error-proof.</objective>
  <requirements>
    1. InstagramField: accepts paste of any IG form, normalizes on paste/blur, shows chip "@handle ↗" (opens profile in new tab, rel=noopener), inline errors (post_link/invalid), duplicate warning from useDuplicateCheck with link to the existing lead and its StageBadge; exposes `isDuplicate` to disable submit.
    2. PhoneField: country-aware (uses the form's country or settings default), shows formatted international preview, invalid message mentions the country, wa.me chip.
    3. CountryCombobox: searchable in ar/en (normalizeSearch), flag emoji, "recent" top 5 (localStorage, try/catch), keyboard navigation.
    4. IndustrySelect: active industries ordered; choosing an `is_other` industry reveals a required "specify" input.
    5. TriStateToggle (Yes/No with deselect, or Yes/No/Unknown).
    6. All fields: label, hint, error with aria-describedby, 16px inputs, RTL-correct with `<bdi dir="ltr">` for handles/numbers.
  </requirements>
  <edge_cases>Paste with surrounding whitespace/newlines; switching country after typing a phone re-validates; duplicate check race (ignore stale responses).</edge_cases>
  <acceptance_criteria>
    - [ ] Pasting `https://www.instagram.com/Ahmed.RE/?igsh=abc` shows `@ahmed.re`.
    - [ ] `01012345678` with EG → `+20 10 12345678` preview.
  </acceptance_criteria>
  <deliverables>src/features/leads/components/fields/*.tsx.</deliverables>
</task>
```

#### المهمة 1.6: فورم إضافة Lead
> ⚙️ Software Engineer · ⏱️ 60د · 🔗 1.5 · 📖 §F2
```xml
<task id="1.6" title="Create-lead form (two layers, save & add another, drafts)">
  <role>Senior frontend engineer focused on speed of data entry.</role>
  <objective>Adding a lead takes ≤10 seconds with 4 fields; power options one click away.</objective>
  <requirements>
    1. LeadFormDialog using ResponsiveDialog; opened by FAB (mobile), "New lead" button and `N` shortcut (desktop).
    2. Layer 1: Instagram (autofocus), Name, Industry, Country (default = last used → settings default). Layer 2 (collapsible "More details"): company, job title, WhatsApp, qualification ×3, problems (counter 280), notes.
    3. Buttons: Save, Save & add another (Ctrl/⌘+Enter) — the latter resets the form keeping country/industry, refocuses Instagram, shows a subtle "Saved ✓ {name}" toast.
    4. Draft persistence: form state saved to localStorage (debounced, try/catch) and restored on reopen; cleared on successful save.
    5. Submit disabled while duplicate or invalid; server errors mapped (DUPLICATE_* → field error).
    6. Optimistic insert into the first page of matching list queries is NOT required; instead invalidate leads + stage-counts.
    7. Placeholder for "Already sent a message" checkbox is NOT added now (task 2.8 adds it).
  </requirements>
  <acceptance_criteria>
    - [ ] Keyboard-only flow works end-to-end.
    - [ ] Closing with unsaved changes keeps the draft.
  </acceptance_criteria>
  <deliverables>src/features/leads/components/LeadFormDialog.tsx (+ messages).</deliverables>
</task>
```

#### المهمة 1.7: شريط البحث والفلاتر والتابات
> ⚙️ Software Engineer · ⏱️ 75د · 🔗 1.4 · 📖 §F3
```xml
<task id="1.7" title="Leads toolbar: unified search, stage tabs, filter sheet, chips, sort">
  <role>Senior frontend engineer.</role>
  <objective>Flexible, instant search & filtering whose state lives in the URL.</objective>
  <requirements>
    1. SearchInput: sticky, debounced 250ms into `q`, clear (✕/Esc), `/` focuses it, shows spinner only if request > 300ms.
    2. StageTabs: "All" + 10 stages with live counts (useStageCounts), horizontally scrollable on mobile with scroll-snap, active tab scrolled into view.
    3. FilterSheet (side sheet desktop / bottom sheet mobile): industries (multi), countries (multi, searchable), qualification toggles, due, has WhatsApp, missing data (any or specific field), created date range. Desktop applies instantly; mobile has "Show N results" button with live count.
    4. ActiveFilterChips with individual remove and "Clear all".
    5. SortSelect; when q non-empty and sort untouched → relevance automatically.
  </requirements>
  <edge_cases>Back/forward restores exact state; invalid URL params are ignored gracefully; counts reflect search + filters.</edge_cases>
  <deliverables>src/features/leads/components/{LeadsToolbar,SearchInput,StageTabs,FilterSheet,ActiveFilterChips,SortSelect}.tsx.</deliverables>
</task>
```

#### المهمة 1.8: عرض القايمة (Virtualized)
> 🎨 Design System + ⚙️ Software Engineer · ⏱️ 75د · 🔗 1.7 · 📖 §F3، §8
```xml
<task id="1.8" title="Virtualized leads list: table (desktop) and cards (mobile)">
  <role>Senior frontend performance engineer.</role>
  <objective>Smooth scrolling through tens of thousands of leads on a mid-range phone.</objective>
  <requirements>
    1. /leads page composes toolbar + list. ≥768px: LeadsTable (columns per §F3) with sticky header; <768px: LeadsCardList.
    2. TanStack Virtual (window virtualizer), fetchNextPage at 80% scroll, row memoization, stable row heights (estimateSize + measureElement for cards).
    3. LeadRow/LeadCard: name + @handle (bdi), StageBadge, industry, country flag, relative last contact (title attr = full date), missing-data badge "ناقص N", slot for primary action (filled in Phase 2), hover actions IG/WA on desktop.
    4. Clicking a row opens /leads/[id]; on lg+ use the intercepting route side panel (`@panel/(.)[id]`).
    5. States: skeleton (8 items matching layout), empty-no-data (CTA add / import), empty-no-results (clear search / clear filters) + suggest_leads "Did you mean…", error with retry.
    6. Scroll restoration when returning from a lead.
    7. Search highlight of matched tokens in the name (normalized matching, safe — no dangerouslySetInnerHTML).
  </requirements>
  <acceptance_criteria>
    - [ ] With 100k temp DEV rows, scrolling stays responsive (no long tasks > 50ms in Performance panel during scroll).
  </acceptance_criteria>
  <verification>Reuse the 1.2 approach to create temp rows in DEV, measure, then delete them.</verification>
  <deliverables>src/app/(app)/leads/page.tsx, @panel route, components LeadsTable, LeadsCardList, LeadRow, LeadCard, LeadsEmpty, LeadsSkeleton, Highlight.</deliverables>
</task>
```

#### المهمة 1.9: صفحة الـ Lead والتعديل التلقائي
> ⚙️ Software Engineer · ⏱️ 75د · 🔗 1.5، 1.8 · 📖 §F4، §18.5.1
```xml
<task id="1.9" title="Lead detail page with inline autosave">
  <role>Senior frontend engineer.</role>
  <objective>View and edit every lead field inline with reliable autosave.</objective>
  <requirements>
    1. Layout per §F4 (header, next-follow-up card placeholder hidden until Phase 2 data exists, fields, qualification, notes). Action bar & timeline come in Phase 2 — leave clean slots, no dummy UI.
    2. useAutosaveField per §18.5.1 (debounce 600ms/blur flush, per-field serial queue, optimistic, rollback, SaveIndicator, beforeunload guard).
    3. Header: copy buttons (handle, phone) with "Copied ✓", open IG/WA, ⋯ menu (Delete — wired in 1.10).
    4. Not-found state (deleted/nonexistent id) with link back.
  </requirements>
  <edge_cases>Editing instagram to a duplicate → field error, value not saved; clearing the only contact method → blocked with message.</edge_cases>
  <deliverables>src/app/(app)/leads/[id]/page.tsx, src/features/leads/components/detail/*, src/features/leads/use-autosave-field.ts.</deliverables>
</task>
```

#### المهمة 1.10: الحذف والتراجع وسلة المحذوفات
> ⚙️ Software Engineer · ⏱️ 45د · 🔗 1.9 · 📖 ADR-6
```xml
<task id="1.10" title="Soft delete with undo, trash page, restore">
  <role>Senior frontend engineer.</role>
  <requirements>
    1. Delete from detail ⋯ menu and from list row menu → confirm dialog → soft delete → toast with Undo (restoreLead) → navigate back to list if on detail.
    2. /trash: deleted leads (deleted_at desc, keyset), "Restore" per row, days-left badge (30 - age), bulk restore.
    3. Restoring a lead whose handle now exists on another live lead → DUPLICATE error with clear message.
  </requirements>
  <deliverables>src/app/(app)/trash/page.tsx, delete/restore hooks, messages.</deliverables>
</task>
```

#### المهمة 1.11: تحقق المرحلة والـ Deploy
> 🧪 QA Engineer · ⏱️ 30د · 🔗 1.1–1.10
```xml
<task id="1.11" title="Phase 1 verification, cleanup, deploy">
  <role>QA engineer.</role>
  <requirements>
    1. Run the relevant items of §19.5 on DEV (ar/en, mobile/desktop, light/dark).
    2. Wipe all DEV data created during the phase; empty `.tmp/`.
    3. `pnpm typecheck && pnpm lint && pnpm build`; grep the repo for console.log/TODO/lorem/demo/test fixtures — must be none.
    4. Merge to main → migrations to PROD → Vercel deploy; verify PROD read-only (login, empty states render).
  </requirements>
  <acceptance_criteria>- [ ] PROD contains 0 leads created by testing.</acceptance_criteria>
</task>
```
**✅ نهاية Phase 1:** تقدر تبدأ تدخّل الـ Leads الحقيقية بتاعتك.

---

### 🔁 Phase 2: محرك الـ Pipeline (1.5 يوم)
**النتيجة:** كل المراحل شغالة بأزرار، وفيها Undo و Timeline.

#### المهمة 2.1: جدول الأحداث ودالة الأكشنز
> 🗄️ Database Engineer · ⏱️ 90د · 🔗 1.1 · 📖 §4، §18.3 (0005)
```xml
<task id="2.1" title="lead_events, lead_action, undo_lead_event">
  <role>Senior PostgreSQL engineer; correctness and atomicity first.</role>
  <objective>Migration 0005_pipeline.sql per §18.3: every transition atomic, validated, logged, undoable.</objective>
  <requirements>
    1. lead_event_type enum, lead_events table + RLS + indexes (events_stats_idx, events_lead_idx).
    2. leads_created_event AFTER INSERT trigger (meta.import_job_id when present).
    3. assert_stage, lead_action (all 13 actions incl. clear_reminder, exact column effects of §4.2 / §18.3), returns {lead, event_id}.
    4. Validate payloads: meeting_at ISO, reason enum, date for reminder (not in the past more than 1 day), days 1..90, to_stage valid; invalid → VALIDATION.
    5. undo_lead_event: latest-only, 10-minute window, restores pipeline columns from prev_state, marks undone_at.
    6. GRANT EXECUTE to authenticated; revoke from anon.
  </requirements>
  <edge_cases>Concurrent calls on same lead (row lock); p_expected_stage mismatch → STAGE_CONFLICT with current stage in DETAIL; snooze when next_follow_up_on is null; set_stage to the same stage (allowed, logs event); timezone boundary (23:30 Cairo).</edge_cases>
  <acceptance_criteria>
    - [ ] Full transition matrix (every action × every stage) yields allowed/INVALID_TRANSITION exactly as §4.2 (checked by a temp SQL script).
    - [ ] Undo after send_follow_up restores stage, follow_ups_sent, next_follow_up_on precisely.
    - [ ] Dates computed from settings (change fu1 to 5 → next_follow_up_on = today+5).
  </acceptance_criteria>
  <verification>Temp SQL matrix test in .tmp/ on DEV with a temp lead; delete lead + script afterwards.</verification>
  <deliverables>supabase/migrations/0005_pipeline.sql, regenerated types.</deliverables>
</task>
```

#### المهمة 2.2: إعدادات المراحل في الكود والـ Optimistic logic
> ⚙️ Software Engineer · ⏱️ 45د · 🔗 2.1 · 📖 §4.1، §4.6، §18.5.2
```xml
<task id="2.2" title="stages.ts single source + applyActionOptimistic">
  <role>Senior TypeScript engineer.</role>
  <requirements>
    1. stages.ts: STAGES (key, order, group inbox|waiting|active|closed, colorToken, lucide icon), ACTIONS, TRANSITIONS (mirror of SQL, with a header comment pointing to 0005_pipeline.sql), primaryActionFor(stage) and secondaryActionsFor(stage) per §4.6.
    2. optimistic.ts: applyActionOptimistic(lead, action, payload, settings, today) mirroring SQL column effects exactly.
    3. Temporary parity check: a .tmp script calls lead_action on DEV for each allowed transition and compares the returned lead's pipeline columns with applyActionOptimistic output (ignoring timestamps' ms). Delete script + temp data after.
  </requirements>
  <deliverables>src/features/pipeline/{stages,optimistic}.ts.</deliverables>
</task>
```

#### المهمة 2.3: الـ Hook الأساسي (useLeadAction + Undo)
> ⚙️ Software Engineer · ⏱️ 60د · 🔗 2.2 · 📖 §4.4، §4.5، §18.5.2
```xml
<task id="2.3" title="useLeadAction and useUndo with optimistic cache patching">
  <role>Senior React Query engineer.</role>
  <requirements>
    1. use-lead-action.ts exactly as §18.5.2 (cancel, snapshot, patchLeadEverywhere across infinite pages / detail / follow-ups buckets, rollback, toast with Undo 6s, invalidation).
    2. src/lib/cache-patch.ts: snapshotQueries, restoreQueries, patchLeadEverywhere, removeLeadFromFollowUps — pure & tested via a temp script.
    3. use-undo.ts: calls undo_lead_event, patches cache with returned lead, toasts result; maps UNDO_EXPIRED/UNDO_NOT_LATEST.
    4. Global keyboard Ctrl/⌘+Z → undo the last action event id of this session (kept in a small zustand-free module store) if within 10 minutes.
    5. Buttons consuming the hook expose isPending → disabled + loading (no double-submit).
  </requirements>
  <edge_cases>Action on a lead not present in any cached list; two quick actions on the same lead (second must wait for first or use the optimistic stage as expected_stage).</edge_cases>
  <deliverables>src/features/pipeline/{use-lead-action,use-undo}.ts, src/lib/cache-patch.ts.</deliverables>
</task>
```

#### المهمة 2.4: شريط الأكشنز والزرار الذكي
> 🎨 Design System + ⚙️ Software Engineer · ⏱️ 60د · 🔗 2.3 · 📖 §4.6، §F4
```xml
<task id="2.4" title="ActionBar: smart primary button, secondary actions, stage override">
  <role>Senior UX-minded frontend engineer.</role>
  <requirements>
    1. ActionBar on lead detail: sticky bottom on mobile (safe area), inline under header on desktop.
    2. PrimaryActionButton = primaryActionFor(stage) (large, icon + label); SecondaryActions as compact buttons (≤3 visible) + overflow menu.
    3. StageOverrideMenu (⋯ → "Change stage…") listing all stages with StageBadge; triggers set_stage.
    4. Shortcuts on detail: E = primary action, R = reply received, L = lost (shown in tooltips with Kbd).
  </requirements>
  <deliverables>src/features/pipeline/components/{ActionBar,PrimaryActionButton,SecondaryActions,StageOverrideMenu}.tsx.</deliverables>
</task>
```

#### المهمة 2.5: Dialogs الأكشنز (ميتنج، خسارة، تذكير، تأجيل)
> ⚙️ Software Engineer · ⏱️ 45د · 🔗 2.4 · 📖 §F4
```xml
<task id="2.5" title="Action dialogs: meeting, lost reason, reminder, snooze">
  <role>Senior frontend engineer.</role>
  <requirements>
    1. MeetingDialog: optional date+time (native inputs, settings timezone → ISO), "Skip" proceeds without meeting_at.
    2. LostReasonDialog: 5 chips, "Skip". One tap on a chip submits immediately.
    3. ReminderDialog: presets (tomorrow, +3d, next week = next Sunday… based on locale week start, custom date) + note ≤140.
    4. SnoozeMenu: +1d, +3d, +7d, custom.
    5. All dialogs: ResponsiveDialog, Enter submits, Esc cancels, focus first control.
  </requirements>
  <deliverables>src/features/pipeline/components/{MeetingDialog,LostReasonDialog,ReminderDialog,SnoozeMenu}.tsx.</deliverables>
</task>
```

#### المهمة 2.6: الـ Timeline
> ⚙️ Software Engineer · ⏱️ 45د · 🔗 2.3 · 📖 §F4
```xml
<task id="2.6" title="Lead timeline with undo on latest event">
  <role>Senior frontend engineer.</role>
  <requirements>
    1. useLeadEvents(id): newest first, paginated 30 per page (keyset on id), excludes nothing — undone events shown struck-through with "Undone" label.
    2. TimelineItem: icon/color per event type, localized text with params (follow-up number, lost reason, meeting time, from→to for stage_set), relative time with full-date tooltip.
    3. Undo button on the latest undoable event while within 10 minutes (live countdown hidden; button disappears when expired).
  </requirements>
  <deliverables>src/features/pipeline/components/{Timeline,TimelineItem}.tsx, api/queries additions.</deliverables>
</task>
```

#### المهمة 2.7: أزرار سريعة في القايمة
> ⚙️ Software Engineer · ⏱️ 40د · 🔗 2.4، 1.8
```xml
<task id="2.7" title="Quick primary action in list rows/cards">
  <role>Senior frontend engineer.</role>
  <requirements>
    1. LeadRow/LeadCard primary action slot renders PrimaryActionButton (compact) with stopPropagation.
    2. Rows that no longer match the active stage filter after an action stay 800ms with a subtle state then animate out (height collapse, respects reduced motion).
    3. Next follow-up column shows "in 2 days" / "overdue 1 day" (warning color).
  </requirements>
  <deliverables>updates to LeadRow, LeadCard, LeadsTable, LeadsCardList.</deliverables>
</task>
```

#### المهمة 2.8: "تم إرسال رسالة بالفعل" في فورم الإضافة
> ⚙️ Software Engineer · ⏱️ 20د · 🔗 2.3، 1.6
```xml
<task id="2.8" title="'Already messaged' option on create">
  <role>Senior frontend engineer.</role>
  <requirements>
    1. Checkbox in layer 1 of LeadFormDialog (remembered across "Save & add another").
    2. On save: createLead then lead_action('send_message'); if the second call fails, the lead remains (show a toast with "Retry mark as sent").
  </requirements>
</task>
```

#### المهمة 2.9: تحقق المرحلة والـ Deploy
> 🧪 QA Engineer · ⏱️ 30د · 🔗 2.1–2.8
```xml
<task id="2.9" title="Phase 2 verification, cleanup, deploy">
  <role>QA engineer.</role>
  <requirements>Same procedure as 1.11, focusing on the full pipeline path, undo, conflict (open same lead in two tabs, act in both), and ar/en texts of all events.</requirements>
</task>
```

---

### 🔔 Phase 3: المتابعات والإعدادات (1 يوم)
**النتيجة:** 🎯 الـ Workflow الكامل شغال.

#### المهمة 3.1: دالة طابور المتابعات
> 🗄️ Database Engineer · ⏱️ 45د · 🔗 2.1 · 📖 §F5، §18.3 (0006)
```xml
<task id="3.1" title="follow_up_queue RPC">
  <role>Senior PostgreSQL engineer.</role>
  <objective>Migration 0006_follow_ups.sql per §18.3, one query returning all buckets in the required order.</objective>
  <requirements>
    1. Buckets & ordering exactly as §F5 / §18.3; waiting limited (default 100, max 500) with bucket_total.
    2. "Today" from settings.timezone; meeting_today uses meeting_at in that timezone.
    3. Uses leads_followup_idx (verify with EXPLAIN on 100k temp rows).
  </requirements>
  <edge_cases>Lead with reminder in stage new → 'reminder'; won/lost with stale next_follow_up_on → excluded; meeting today AND reminder due → appears once (meeting_today wins).</edge_cases>
  <verification>Temp data + EXPLAIN in DEV; delete afterwards.</verification>
  <deliverables>supabase/migrations/0006_follow_ups.sql.</deliverables>
</task>
```

#### المهمة 3.2: صفحة المتابعات
> ⚙️ Software Engineer · ⏱️ 60د · 🔗 3.1، 2.3 · 📖 §F5، §18.5.3
```xml
<task id="3.2" title="Follow-ups page: sections, header progress, inbox zero">
  <role>Senior frontend engineer.</role>
  <requirements>
    1. useFollowUpQueue → grouped buckets; sections in order: due (sub-groups FU1, FU2, FU3), reminders, meetings today, exhausted, waiting (collapsed, shows total; "View all" → /leads with waiting stages filter).
    2. Header: "You have N follow-ups today" + progress (done today / initial due) per §18.5.3.
    3. InboxZero state with next due date (min next_follow_up_on of waiting).
    4. Nav badge with due count (due_fu1+2+3+reminder+exhausted) and document.title prefix "(N)".
    5. Skeleton/empty/error states; pull-free refresh via refetchOnWindowFocus.
  </requirements>
  <deliverables>src/app/(app)/follow-ups/page.tsx, src/features/follow-ups/**.</deliverables>
</task>
```

#### المهمة 3.3: كارت المتابعة (فتح DM و Swipe)
> 🎨 Design System + ⚙️ Software Engineer · ⏱️ 60د · 🔗 3.2 · 📖 §F5، §18.5.3
```xml
<task id="3.3" title="FollowUpCard: open DM, done, swipe, menu, return highlight">
  <role>Senior interaction engineer.</role>
  <requirements>
    1. Card content per §F5 (overdue badge in warning color, days since last contact).
    2. OpenDmButton (IG else WA) + return-to-tab highlight of "Done" (visibilitychange) per §18.5.3.
    3. Done button is bucket-aware: due_fu* → send_follow_up · reminder → clear_reminder · meeting_today → opens "Proposal sent / Won / Lost" choices · exhausted → two buttons "Lost (no reply)" and "Retry in 30 days" (restart with after_days=30).
    4. SwipeableRow (pointer events, 35% threshold, RTL-aware, haptic navigator.vibrate(10) when available, disabled under reduced motion).
    5. ⋯ menu: Reply received, Lost, Snooze, Open lead.
    6. Card exit animation 150ms collapse.
  </requirements>
  <deliverables>src/features/follow-ups/components/{FollowUpCard,SwipeableRow,OpenDmButton}.tsx (+ migration if clear_reminder added).</deliverables>
</task>
```

#### المهمة 3.4: صفحة الإعدادات
> ⚙️ Software Engineer · ⏱️ 75د · 🔗 2.1 · 📖 §F7، §18.5.5
```xml
<task id="3.4" title="Settings: language, theme, timezone, default country, follow-up intervals">
  <role>Senior frontend engineer.</role>
  <requirements>
    1. Sections as cards; each field autosaves (SaveIndicator) via useSettings/useUpdateSettings (optimistic).
    2. FollowUpIntervals: 4 number inputs (1..60/90) with live preview sentence computed client-side from today, note that changes apply to future calculations only.
    3. TimezoneSelect (Intl.supportedValuesOf('timeZone'), searchable); DefaultCountry (CountryCombobox); LanguageSwitch (cookie + settings); ThemeSwitch (system/light/dark cookie).
    4. Account: change password (current session; min 12; confirm), sign out.
    5. Links to /data and /trash.
  </requirements>
  <deliverables>src/app/(app)/settings/page.tsx, src/features/settings/**.</deliverables>
</task>
```

#### المهمة 3.5: إدارة الأنشطة
> ⚙️ Software Engineer · ⏱️ 45د · 🔗 3.4 · 📖 §F7
```xml
<task id="3.5" title="Industries manager: reorder, rename, hide, add">
  <role>Senior frontend engineer.</role>
  <requirements>
    1. List with drag handle (pointer-based) + keyboard reorder (↑/↓ with Alt) → single upsert of sort_order.
    2. Inline rename ar/en (autosave), hide/show toggle, add new (generates key slug from en label, unique).
    3. Delete allowed only when no leads reference it (check count first); otherwise only hide, with explanation.
  </requirements>
  <deliverables>src/features/settings/components/IndustriesManager.tsx.</deliverables>
</task>
```

#### المهمة 3.6: تحقق المرحلة والـ Deploy
> 🧪 QA Engineer · ⏱️ 30د · 🔗 3.1–3.5
```xml
<task id="3.6" title="Phase 3 verification, cleanup, deploy">
  <role>QA engineer.</role>
  <requirements>Same as 1.11 + simulate due dates by updating next_follow_up_on on temp DEV leads; verify bucket order FU1→FU2→FU3, swipe on a real phone, settings change affects next calculation. Wipe DEV data after.</requirements>
</task>
```
**✅ نهاية Phase 3:** 🎯 الـ Workflow الكامل جاهز للاستخدام اليومي.

---

### 📦 Phase 4: مركز البيانات: Excel والنسخ الاحتياطي (3 أيام)
**النتيجة:** تصدير من كل صفحة، ونموذج Excel، واستيراد ضخم من غير ما الشاشة تعلّق، ونسخ احتياطي مجدول ومعاه تنبيهات واسترجاع.

#### 4a: التصدير والنموذج

#### المهمة 4.1: البنية التحتية للـ Workers
> 🏛️ Software Architect · ⏱️ 40د · 🔗 0.1 · 📖 §18.6، §F12
```xml
<task id="4.1" title="Web Worker infrastructure with Comlink">
  <role>Software architect for off-main-thread processing.</role>
  <objective>A reusable, typed, cancellable worker pattern that works in Next.js 16 builds (Turbopack/webpack) and under the CSP (worker-src 'self' blob:).</objective>
  <requirements>
    1. src/lib/workers/use-worker.ts: lazily creates `new Worker(new URL(path, import.meta.url), { type:'module' })`, wraps with Comlink, terminates on unmount/cancel, exposes { api, cancel }.
    2. Progress helper: throttled (100ms) Comlink.proxy callback; transfer helper for ArrayBuffers.
    3. A tiny cancellation protocol: cancel() terminates the worker and rejects pending calls with AppError('CANCELLED').
    4. Confirm SheetJS and ExcelJS import correctly inside a worker in both dev and prod builds (temporary smoke worker in .tmp, removed after).
  </requirements>
  <deliverables>src/lib/workers/{use-worker,progress,transfer}.ts.</deliverables>
</task>
```

#### المهمة 4.2: الـ Export Worker
> ⚙️ Software Engineer · ⏱️ 60د · 🔗 4.1 · 📖 §F9، §18.6
```xml
<task id="4.2" title="Export worker: styled XLSX (ExcelJS) and CSV with BOM">
  <role>Senior engineer specialized in spreadsheet generation.</role>
  <requirements>
    1. Implement ExportWorkerApi (begin/addRows/finish) streaming rows into an ExcelJS workbook (one worksheet per spec sheet).
    2. Styling per §F9: bold colored header, freeze row 1, autoFilter, column widths, RTL view when locale=ar, real Date cells formatted `yyyy-mm-dd hh:mm` (converted to the settings timezone), hyperlinks for IG/WA, stage cell fill from stage colors (hex fallbacks derived from tokens).
    3. CSV mode: RFC 4180 quoting, UTF-8 BOM, `\r\n` line endings; one file per sheet (if multiple sheets → zip with fflate).
    4. finish() returns a transferable ArrayBuffer; main thread triggers download with the given file name.
    5. Memory guard: if total rows > 200k in xlsx mode, reject with a typed error suggesting CSV.
  </requirements>
  <verification>Generate a 100k-row temp export from synthetic in-memory rows inside a .tmp page/script; open it in Excel/LibreOffice; check dates, RTL, links; delete the files.</verification>
  <deliverables>src/features/data-hub/export/export.worker.ts, csv.ts.</deliverables>
</task>
```

#### المهمة 4.3: زرار التصدير والـ Registry
> ⚙️ Software Engineer · ⏱️ 60د · 🔗 4.2 · 📖 §F9
```xml
<task id="4.3" title="ExportButton + export registry + progress/cancel">
  <role>Senior frontend engineer.</role>
  <requirements>
    1. registry.ts types (ExportSpec, ColumnDef with header{ar,en}, width, format) per §F9.
    2. ExportButton → Popover: format (xlsx/csv), scope (current results N / all M / selected K), column checkboxes (persisted per spec id in localStorage), header language.
    3. Runner: pages through spec.fetchPage (2,000 rows per page, cursor-based), feeds the worker, shows Progress "x / total" with Cancel; on finish downloads `scope-<page>_<yyyy-mm-dd>[_filtered].<ext>`.
    4. Errors mapped to toasts; cancel terminates the worker and aborts in-flight fetches.
  </requirements>
  <deliverables>src/features/data-hub/export/{registry.ts,ExportButton.tsx,run-export.ts}.</deliverables>
</task>
```

#### المهمة 4.4: Specs التصدير لكل صفحة
> ⚙️ Software Engineer · ⏱️ 45د · 🔗 4.3، 3.2 · 📖 §F9
```xml
<task id="4.4" title="Export specs: leads, follow-ups, lead detail, industries, trash">
  <role>Senior frontend engineer.</role>
  <requirements>
    1. leads spec uses search_leads with current filters (all columns available incl. qualification, notes via a dedicated export RPC or select with explicit columns — add `export_leads` RPC (keyset, includes notes/problems/all dates, industry and country labels in requested language) in a NEW migration).
    2. follow-ups spec: one sheet per bucket group.
    3. lead-detail spec: lead sheet + timeline sheet.
    4. industries, trash specs.
    5. Mount ExportButton in each page toolbar.
  </requirements>
  <deliverables>src/features/data-hub/export/specs/*.ts, migration 0004b_export.sql (or next number).</deliverables>
</task>
```

#### المهمة 4.5: نموذج Excel (Template)
> ⚙️ Software Engineer · ⏱️ 45د · 🔗 4.2 · 📖 §F10.1
```xml
<task id="4.5" title="Downloadable Excel template with live dropdowns">
  <role>Senior engineer.</role>
  <requirements>
    1. build-template.ts (runs in the export worker): sheets Leads / Instructions / Lists (Lists hidden).
    2. Leads headers bilingual "الاسم / Name", required columns marked ★ and tinted; one grey example row marked `#example` in a hidden helper column so the importer skips it (the example uses obviously generic text like "اسم العميل / Client name" — never realistic fake people).
    3. Data validation lists referencing Lists sheet: active industries (live from DB), countries (localized names), stages, Yes/No, Yes/No/Unknown; validation applied to 5,000 rows.
    4. Instructions sheet: per-column description, accepted formats, required rules, in the user's language.
    5. "Download template" button on /data and in the import wizard.
  </requirements>
  <deliverables>src/features/data-hub/template/build-template.ts, UI button.</deliverables>
</task>
```

#### 4b: الاستيراد

#### المهمة 4.6: جداول الاستيراد ودواله
> 🗄️ Database Engineer · ⏱️ 90د · 🔗 1.1 · 📖 §3.5.1، §F10.3، §18.3 (0007)
```xml
<task id="4.6" title="Import staging schema and RPCs">
  <role>Senior PostgreSQL engineer designing bulk-safe, resumable pipelines.</role>
  <objective>Migration 0007_import.sql per §18.3.</objective>
  <requirements>
    1. import_jobs, import_rows (+ kind, committed_at, result_lead_id, raw_before), enums, RLS, indexes.
    2. stage_import_rows (idempotent), finalize_import_staging (set-based dup detection in file + in DB, default decisions, counts), update_import_row (re-check dup for one row), set_import_decisions (bulk), commit_import (batched, per-call transaction, fill_empty/replace strategies, notes append), rollback_import (7 days).
    3. Complete the "..." parts in §18.3 for all lead fields consistently.
    4. statement_timeout safety: each RPC must finish < 2s for its batch size at 200k-row jobs (tune batch sizes).
  </requirements>
  <edge_cases>Re-sending the same batch (resume) → no duplicates; a lead created manually during review with the same handle → commit skips it (on conflict) and the row is reported as skipped; rollback after some imported leads were edited (still soft-deleted; mention in UI).</edge_cases>
  <verification>Temp 200k-row staging in DEV with EXPLAIN on finalize/commit; delete job + leads afterwards.</verification>
  <deliverables>supabase/migrations/0007_import.sql, types.</deliverables>
</task>
```

#### المهمة 4.7: الـ Import Worker (قراءة الملفات)
> ⚙️ Software Engineer · ⏱️ 60د · 🔗 4.1 · 📖 §F10.2، §F10.3 ①، §18.6
```xml
<task id="4.7" title="Import worker: read xlsx/xls/csv/ods/tsv, detect header, encoding">
  <role>Senior engineer specialized in messy real-world spreadsheets.</role>
  <requirements>
    1. readFile/loadSheet per ImportWorkerApi using SheetJS (dense mode, cellDates:true, raw:false where appropriate).
    2. CSV: detect encoding (UTF-8 with/without BOM vs Windows-1256 via TextDecoder fatal attempt) and delimiter (, ; \t |).
    3. Header row detection (row with most non-empty string cells among first 20); skip fully empty rows; skip template example row (#example marker).
    4. Merged cells: propagate top-left value; trim cells; convert Arabic-Indic digits.
    5. Limits: 50MB / 200k data rows → IMPORT_TOO_LARGE with counts.
  </requirements>
  <deliverables>src/features/data-hub/import/import.worker.ts (read part), read-helpers.ts.</deliverables>
</task>
```

#### المهمة 4.8: محرك ربط الأعمدة ومطابقة القيم
> ⚙️ Software Engineer · ⏱️ 75د · 🔗 4.7 · 📖 §F10.3 ②، §18.6
```xml
<task id="4.8" title="Mapping engine: header synonyms, content sniffing, value matchers, saved mappings">
  <role>Senior engineer building forgiving, explainable heuristics.</role>
  <requirements>
    1. header-synonyms.ts (full dictionary, ar/en, incl. common misspellings); matching ladder exact → startsWith → includes → Levenshtein ≤2 on normalized text; each suggestion carries a confidence + reason.
    2. Content sniffing over first 50 non-empty values: IG URL/handle pattern, phone pattern, country names (ar/en/ISO), yes/no vocab, stage names.
    3. value-matchers.ts: industry (labels ar/en + synonyms like دكتور→طبيب, clinic→عيادة), stage (keys, labels, Arabic equivalents), tri-state (نعم/لا/yes/no/y/n/1/0/✓/✗/غير معروف), country (names/ISO2/ISO3/dial code).
    4. unknownValues(mapping) returns unmatched distinct values per enum column for the UI resolution table.
    5. Saved mappings: keyed by sorted normalized header signature; stored in localStorage (try/catch) — applied automatically with a notice.
    6. "Append to notes" mapping target that writes `Column: value` lines.
  </requirements>
  <deliverables>src/features/data-hub/import/{header-synonyms,value-matchers,auto-map,saved-mappings}.ts.</deliverables>
</task>
```

#### المهمة 4.9: الـ Wizard (الرفع والربط)
> 🎨 Design System + ⚙️ Software Engineer · ⏱️ 75د · 🔗 4.8 · 📖 §F10.2، §F10.3
```xml
<task id="4.9" title="Import wizard steps 1–2: source & mapping UI">
  <role>Senior UX-focused frontend engineer.</role>
  <requirements>
    1. /data page with cards: Import, Download template, Export everything, Backups, Import history.
    2. Wizard (full-page route /data/import): stepper (1 Source, 2 Mapping, 3 Review, 4 Done).
    3. Step 1: dropzone (drag & drop, click, mobile file picker), Google Sheet link input, paste area (TSV); sheet chooser when multiple; header-row override.
    4. Step 2: one row per source column: header, 3 sample values, target select (with confidence badge), "Ignore", "Append to notes"; defaults panel (country, industry, stage); unknown values resolution table (map to existing / create new industry / leave empty); duplicate strategy selector (skip / fill empty / replace).
    5. Validation that name and at least one contact column are mapped before continuing.
  </requirements>
  <deliverables>src/app/(app)/data/page.tsx, src/app/(app)/data/import/page.tsx, components ImportWizard, SourceStep, MappingStep.</deliverables>
</task>
```

#### المهمة 4.10: التحقق والرفع بالدفعات مع الـ Resume
> ⚙️ Software Engineer · ⏱️ 75د · 🔗 4.6، 4.9 · 📖 §F10.3 ③، §F10.4
```xml
<task id="4.10" title="Client validation in worker, batched staging upload, resume">
  <role>Senior engineer for resilient long-running client operations.</role>
  <requirements>
    1. validateAll in worker: map row → LeadInput via mapping + matchers + normalizers, run leadInputSchema, classify valid/incomplete (missing_fields rules mirrored)/error with issue codes {field, code}.
    2. Create import_jobs row; pull batches of 1,000 via takeBatch → stage_import_rows; progress UI; then finalize_import_staging.
    3. Resume: cache the File in IndexedDB (idb-keyval) keyed by job id + mapping; on /data load, detect jobs in 'staging' with staged_rows < total_rows → banner "Continue import (60%)"; continue from staged_rows.
    4. Network loss → pause with retry/backoff (1s,2s,4s… max 30s), never duplicate (idempotent RPC).
    5. Cancel → set job status 'cancelled', clear IndexedDB entry.
  </requirements>
  <acceptance_criteria>- [ ] 200k-row file: UI stays responsive (no long task > 100ms on main thread during processing).</acceptance_criteria>
  <verification>Temp generated 200k-row xlsx in .tmp → import into DEV → throttle network/close tab mid-way → resume → verify counts → rollback/delete → remove temp files.</verification>
  <deliverables>src/features/data-hub/import/{run-validation,run-staging,resume}.ts + worker additions.</deliverables>
</task>
```

#### المهمة 4.11: صفحة تقرير الاستيراد
> 🎨 Design System + ⚙️ Software Engineer · ⏱️ 90د · 🔗 4.10 · 📖 §F10.3 ③
```xml
<task id="4.11" title="Import report: complete / incomplete / error / duplicates">
  <role>Senior frontend engineer.</role>
  <requirements>
    1. /data/imports/[id]: summary cards (counts) + tabs (valid, incomplete, error, duplicate_db, duplicate_file) with server-paginated, virtualized table (keyset by row_no).
    2. Columns: row number, mapped fields, issues rendered as human messages next to the offending cell (cell highlight).
    3. Inline row editing → zod validate → update_import_row → row moves tab; duplicate_db rows show side-by-side diff (existing vs incoming) with decision radio (skip / fill empty / replace).
    4. Bulk actions: skip all incomplete, update all duplicates, set country X for rows missing country (via set_import_decisions or a bulk patch RPC).
    5. "Download problem rows" → buildProblemsWorkbook (original columns + "Problem" column).
    6. Primary CTA "Import N rows" (shows exact numbers per decision).
  </requirements>
  <deliverables>src/app/(app)/data/imports/[id]/page.tsx, ReportTable, RowEditor, DuplicateDiff.</deliverables>
</task>
```

#### المهمة 4.12: التنفيذ والـ Rollback والسجل
> ⚙️ Software Engineer · ⏱️ 60د · 🔗 4.11 · 📖 §F10.3 ④
```xml
<task id="4.12" title="Commit loop, cancel, result, rollback, history">
  <role>Senior frontend engineer.</role>
  <requirements>
    1. Before commit, if rows to write > 500 → trigger manual backup (kind pre_import) via generate-backup (wait until ready, with progress text; if backups not yet deployed in this phase order, gate this behind a feature check and enable after 4.15).
    2. Commit loop calling commit_import until remaining = 0; progress; Cancel stops the loop (already committed batches stay; offer rollback).
    3. Result screen with links: view imported (leads filter import_job_id), view incomplete (missing any + import id).
    4. Rollback button (7 days) with confirm; invalidate all queries.
    5. /data/imports history list (date, file, counts, status, open).
  </requirements>
  <deliverables>run-commit.ts, ResultStep, src/app/(app)/data/imports/page.tsx.</deliverables>
</task>
```

#### المهمة 4.13: Google Sheets واللصق
> ⚙️ Software Engineer + 🔒 Security · ⏱️ 45د · 🔗 4.7 · 📖 §F10.2
```xml
<task id="4.13" title="Google Sheets by link (SSRF-safe) and paste import">
  <role>Senior engineer with security awareness.</role>
  <requirements>
    1. Route handler POST /api/import/google-sheet {url}: authenticated only; parse spreadsheet id + gid strictly from `https://docs.google.com/spreadsheets/d/<id>/...`; fetch `https://docs.google.com/spreadsheets/d/<id>/export?format=xlsx` (or csv&gid) with redirect: 'follow' limited to google domains, 30s timeout, 50MB streaming cap; return the bytes.
    2. Clear errors: not shared publicly (HTML/login page detected) → step-by-step instructions to set "Anyone with the link: Viewer".
    3. Paste area: parse TSV from clipboard text in the worker.
  </requirements>
  <deliverables>src/app/api/import/google-sheet/route.ts, paste support.</deliverables>
</task>
```

#### 4c: النسخ الاحتياطي

#### المهمة 4.14: جداول النسخ الاحتياطي والجدولة
> 🗄️ Database Engineer · ⏱️ 60د · 🔗 0.6 · 📖 §3.5.1، §F11، §18.3 (0008)
```xml
<task id="4.14" title="Backups schema, storage bucket, scheduling, cron">
  <role>Senior PostgreSQL engineer.</role>
  <requirements>
    1. Migration 0008_backups.sql per §18.3: backups (+last_notified_at), push_subscriptions, storage bucket + policies, compute_next_backup, backup_settings trigger, mark_backup_downloaded, replace handle_new_user to set next_run_at, backfill next_run_at for existing users.
    2. Vault secrets `functions_url`, `cron_secret` (document the one-time setup commands; do NOT commit secret values).
    3. cron jobs backup-dispatch and backup-remind.
  </requirements>
  <edge_cases>monthly with day 28; DST-free timezone but still compute via `at time zone`; frequency off → next_run_at null; biweekly anchor.</edge_cases>
  <verification>Temp SQL calls of compute_next_backup across frequencies/timezones in DEV; delete script.</verification>
  <deliverables>supabase/migrations/0008_backups.sql, README (vault setup).</deliverables>
</task>
```

#### المهمة 4.15: Edge Function لعمل النسخة
> ⚙️ Software Engineer · ⏱️ 90د · 🔗 4.14 · 📖 §18.7
```xml
<task id="4.15" title="Edge Function generate-backup">
  <role>Senior backend engineer (Deno / Supabase Edge).</role>
  <requirements>
    1. Implement the 11 steps of §18.7 exactly; auth via x-cron-secret OR user JWT (manual "Backup now").
    2. Batched reads (5,000) with explicit owner_id filter; xlsx via SheetJS ESM, json, csv_zip via fflate; auto-switch to csv_zip above 150k leads.
    3. `_meta` sheet with format_version=1, counts, created_at, app id; machine keys as headers.
    4. sha256 checksum, upload, update row, retention, next_run_at, invoke send-notification.
    5. Structured logs (no PII), error handling with status 'failed' + retry semantics.
  </requirements>
  <verification>Deploy to DEV, run manual backup on temp data, download & inspect, then delete temp data/backups.</verification>
  <deliverables>supabase/functions/generate-backup/*.</deliverables>
</task>
```

#### المهمة 4.16: التنبيهات (Push + إيميل + جوه التطبيق)
> ⚙️ Software Engineer · ⏱️ 75د · 🔗 4.15 · 📖 §F11.2، §18.7
```xml
<task id="4.16" title="Notifications: Web Push, email, in-app banner">
  <role>Senior fullstack engineer.</role>
  <requirements>
    1. public/sw.js: push + notificationclick handlers (+ static shell caching added in Phase 6, not now).
    2. Client: register SW, "Enable notifications" flow in Settings (permission prompt only on user click), save subscription to push_subscriptions; iOS note: requires installed PWA (show guidance).
    3. Edge Function send-notification per §18.7 (VAPID web push via a Deno-compatible library — verify compatibility at implementation time; Resend email when enabled; localized texts; tag dedupe; prune 404/410 subscriptions; update last_notified_at).
    4. BackupBanner in app shell: shows when a ready backup is not downloaded; actions Download / Later (hides for this session).
  </requirements>
  <deliverables>public/sw.js, src/features/data-hub/backups/{push.ts,BackupBanner.tsx}, supabase/functions/send-notification/*.</deliverables>
</task>
```

#### المهمة 4.17: صفحة النسخ الاحتياطي والتحميل
> ⚙️ Software Engineer · ⏱️ 60د · 🔗 4.16 · 📖 §F11.1، §F11.3، §18.8
```xml
<task id="4.17" title="Backups page: schedule, list, download, backup now, auto-save folder">
  <role>Senior frontend engineer.</role>
  <requirements>
    1. Schedule form (frequency, weekday/month day, hour, format, keep_last, notify toggles) with live "Next backup: …" sentence.
    2. Backups list (date, kind, size, counts, downloaded ✓) with Download (signed URL 60s + mark downloaded) and Delete (manual ones only).
    3. "Backup now" → invokes generate-backup with JWT, polls status until ready, then downloads.
    4. Auto-save folder (File System Access, Chromium only) per §18.8: pick folder, permission re-grant button, auto-save on app open; hidden on unsupported browsers.
    5. `?download=<id>` deep link (from push/email) starts the download on load.
  </requirements>
  <deliverables>src/app/(app)/data/backups/page.tsx, src/features/data-hub/backups/{api,download,fs-access}.ts, components.</deliverables>
</task>
```

#### المهمة 4.18: الاسترجاع
> ⚙️ Software Engineer + 🗄️ Database Engineer · ⏱️ 90د · 🔗 4.17، 4.12 · 📖 §F11.4
```xml
<task id="4.18" title="Restore from backup (merge / replace) with pre-restore snapshot">
  <role>Senior engineer; data safety is paramount.</role>
  <requirements>
    1. Detect backup files (xlsx `_meta` sheet or json meta) in the import entry point → route to restore flow.
    2. Validate format_version and structure; preview: backup date + counts vs current counts.
    3. Mode: merge (insert leads/events/industries whose ids don't exist; keep existing) or replace (type the confirmation word; soft-delete current leads first).
    4. Always create a pre_restore backup first (wait until ready).
    5. New migration with restore_commit(p_job, p_mode) using staged rows of kind lead/event/industry: preserves ids, inserts events after leads, re-maps industries by key, batched like commit_import.
    6. Result + link to the pre_restore backup.
  </requirements>
  <verification>On DEV: temp data → backup → modify/delete → restore merge & replace → compare counts/ids → delete everything.</verification>
  <deliverables>restore flow components, migration 00xx_restore.sql.</deliverables>
</task>
```

#### المهمة 4.19: تحقق المرحلة والـ Deploy
> 🧪 QA Engineer · ⏱️ 45د · 🔗 4.1–4.18
```xml
<task id="4.19" title="Phase 4 verification, cleanup, deploy">
  <role>QA engineer.</role>
  <requirements>
    1. Round-trip: export leads xlsx → re-import into an empty DEV state → identical data (temp check script, deleted after).
    2. Import messy real-world-like temp files (Arabic headers, Windows-1256 CSV, merged cells, blank rows, Arabic digits) — generated in .tmp, deleted after.
    3. Scheduled backup: set next_run_at to now on DEV, confirm generation + push + banner + download marks it.
    4. Deploy Edge Functions + secrets to PROD (with user confirmation); verify PROD backup_settings exist; DO NOT generate test backups in PROD beyond one manual backup the user triggers themselves.
    5. Wipe DEV data and .tmp.
  </requirements>
</task>
```
**✅ نهاية Phase 4:** مركز البيانات كامل.

---

### 📊 Phase 5: الـ Dashboard (1 يوم)

#### المهمة 5.1: دالة الإحصائيات
> 🗄️ Database Engineer · ⏱️ 60د · 🔗 2.1 · 📖 §F6، §18.3 (0009)
```xml
<task id="5.1" title="dashboard_stats RPC">
  <role>Senior PostgreSQL analytics engineer.</role>
  <requirements>
    1. Migration 0009_dashboard.sql per §18.3 with metric definitions exactly as §F6 (undone events excluded; distinct leads for replied).
    2. Returns current + previous period in one call; < 100ms on 500k temp events (verify with EXPLAIN; uses events_stats_idx).
  </requirements>
  <verification>Temp events in DEV, EXPLAIN, compare numbers with hand-computed counts, delete temp data.</verification>
  <deliverables>supabase/migrations/0009_dashboard.sql.</deliverables>
</task>
```

#### المهمة 5.2: واجهة الـ Dashboard
> 🎨 Design System + ⚙️ Software Engineer · ⏱️ 90د · 🔗 5.1، 3.2 · 📖 §F6، §18.5.4
```xml
<task id="5.2" title="Dashboard UI: range picker, KPIs, due-today card, pipeline bar, onboarding">
  <role>Senior frontend engineer with data-visualization taste.</role>
  <requirements>
    1. RangePicker (today / 7d / 30d default / this month / all) in URL; range.ts computes from/to in settings timezone ("all" → from earliest created_at).
    2. DueTodayCard at top (count from follow-up queue) → /follow-ups.
    3. KpiGrid: 6 KpiCards (value, delta vs previous with ↑/↓ color and "—" when previous = 0, hint line per §F6, click-through to filtered lists where meaningful).
    4. PipelineBar: horizontal stacked bar with stage colors + legend counts; each segment clickable → /leads?stage=…; accessible (each segment is a button with aria-label).
    5. First-run onboarding card (when total leads = 0): 3 steps (add lead, import Excel, set follow-up intervals) — disappears automatically.
    6. Skeletons, error state; numbers use tnum.
    7. Export spec for dashboard (KPIs sheet, pipeline sheet, period leads, period events) via ExportButton.
  </requirements>
  <deliverables>src/app/(app)/page.tsx, src/features/dashboard/**, export spec.</deliverables>
</task>
```

#### المهمة 5.3: تحقق المرحلة والـ Deploy
> 🧪 QA Engineer · ⏱️ 30د · 🔗 5.1، 5.2
```xml
<task id="5.3" title="Phase 5 verification, cleanup, deploy">
  <role>QA engineer.</role>
  <requirements>Verify KPI numbers against manual counts on temp DEV data for each range, including undo exclusion and timezone day boundaries. Wipe DEV data, deploy.</requirements>
</task>
```

---

### 🚀 Phase 6: التلميع والإطلاق (1.5 يوم)

#### المهمة 6.1: الـ PWA كامل
> ⚙️ Software Engineer · ⏱️ 45د · 🔗 4.16 · 📖 §12، §18.7
```xml
<task id="6.1" title="Installable PWA with safe caching">
  <role>Senior PWA engineer.</role>
  <requirements>
    1. sw.js: precache app shell + stale-while-revalidate for /_next/static, fonts, icons ONLY; never cache Supabase/API responses or HTML containing user data beyond the shell.
    2. SW versioning + update prompt ("New version available — Refresh").
    3. iOS meta tags (apple-touch-icon, status bar style), splash colors; install hint in Settings for iOS.
  </requirements>
</task>
```

#### المهمة 6.2: اختصارات الكيبورد والـ Offline
> ⚙️ Software Engineer · ⏱️ 45د · 🔗 2.4 · 📖 §6.2، §6.3
```xml
<task id="6.2" title="Keyboard shortcuts system, help dialog, offline banner">
  <role>Senior frontend engineer.</role>
  <requirements>
    1. Central shortcut registry (scope-aware: global / list / detail), ignores events inside inputs, supports sequences (G then D/L/F).
    2. `?` opens shortcuts dialog (generated from the registry, localized).
    3. List navigation J/K + Enter + E on the focused row.
    4. Offline banner (navigator.onLine + failed fetch detection); mutation buttons disabled offline with tooltip.
  </requirements>
</task>
```

#### المهمة 6.3: مراجعة الأداء
> 🗄️ Database + ⚙️ Software Engineer · ⏱️ 90د · 🔗 كل اللي فات · 📖 §8
```xml
<task id="6.3" title="Performance pass at 100k leads / 500k events">
  <role>Performance engineer.</role>
  <requirements>
    1. In DEV only: generate 100k leads + 500k events via temporary SQL (generate_series, realistic distributions).
    2. EXPLAIN ANALYZE every RPC; fix any Seq Scan / sort spill with indexes (new migration) or query rewrites.
    3. Lighthouse mobile on /, /leads, /follow-ups: LCP < 1.8s, INP < 200ms; bundle analysis — first-load JS < 200KB gzip; lazy-load heavy chunks (workers, dialogs, ExcelJS never in main bundle).
    4. Delete all generated data (`truncate` on DEV user data) and scripts.
  </requirements>
  <acceptance_criteria>- [ ] A results table (metric, target, measured) appended to the task report.</acceptance_criteria>
</task>
```

#### المهمة 6.4: مراجعة الأمان
> 🔒 Security Engineer · ⏱️ 60د · 🔗 كل اللي فات · 📖 §9، §18.9
```xml
<task id="6.4" title="Security review">
  <role>Application security engineer.</role>
  <requirements>
    1. RLS audit: list every table/function; confirm RLS on, policies owner-scoped, functions security invoker (except handle_new_user), EXECUTE revoked from anon.
    2. Cross-user test in DEV with two temp users for every RPC and storage path (then delete the users).
    3. Headers/CSP verification on production URL; no secrets in client bundle (grep build output for service/secret keys).
    4. Edge Functions reject calls without valid cron secret/JWT.
    5. Supabase Auth settings re-check on PROD (signups off, password policy, redirect URLs).
  </requirements>
</task>
```

#### المهمة 6.5: النسخ الاحتياطي على مستوى الداتابيز + تجربة استرجاع
> 🚀 DevOps Engineer · ⏱️ 60د · 🔗 0.10 · 📖 §10
```xml
<task id="6.5" title="Nightly encrypted pg_dump + restore drill">
  <role>DevOps engineer.</role>
  <requirements>
    1. .github/workflows/backup.yml: nightly 03:00 Cairo (01:00 UTC) pg_dump of PROD (data + schema, excluding storage internals), gzip, encrypt with age (public key in repo, private key with the user only), upload as artifact to a private release/R2, keep 30.
    2. Restore drill: restore the latest dump into the DEV project, verify row counts, then reset DEV.
    3. Document the restore procedure step by step in README (Arabic).
  </requirements>
  <constraints>Ask the user before creating any external storage (R2) or secrets.</constraints>
</task>
```

#### المهمة 6.6: الصيانة والتنضيف التلقائي
> 🗄️ Database Engineer · ⏱️ 20د · 🔗 4.6 · 📖 §18.3 (0010)
```xml
<task id="6.6" title="Maintenance cron jobs">
  <role>Database engineer.</role>
  <requirements>Migration 0010_maintenance.sql per §18.3 (purge trash after 30 days, staging after 30 days, failed backups); confirm `cron.job` entries in DEV and PROD.</requirements>
</task>
```

#### المهمة 6.7: الجاهزية للإنتاج (Zero-data audit)
> 🏛️ Software Architect · ⏱️ 30د · 🔗 كل اللي فات · 📖 §18.10
```xml
<task id="6.7" title="Production readiness audit">
  <role>Software architect signing off a release.</role>
  <requirements>
    1. PROD DB: 0 leads/events/imports/backups created by testing; exactly one user; settings + 7 industries present; countries present.
    2. Repo: no console.log, TODO, FIXME, lorem, demo, mock, fixtures, .tmp content; .env.example names only.
    3. All §19.5 items pass on PROD in a read-only manner (no writes) — writes were verified on DEV.
    4. Update README: what the app does, how to run, deploy, backup/restore, and env vars.
    5. Tag release v1.0.0.
  </requirements>
</task>
```

#### المهمة 6.8: فحص على أجهزة حقيقية
> 🧪 QA Engineer · ⏱️ 45د · 🔗 6.7
```xml
<task id="6.8" title="Real-device QA">
  <role>QA engineer.</role>
  <requirements>
    1. iPhone Safari (installed PWA) + Android Chrome + desktop Chrome/Edge/Firefox, in ar and en, light and dark.
    2. Checklist: safe areas, keyboard covering inputs (scrollIntoView on focus), swipe, push notification receipt (iOS installed PWA), file picker for import, downloads.
    3. Log issues → fix as small follow-up tasks; re-verify.
  </requirements>
</task>
```
**✅ نهاية Phase 6: 🚀 v1.0 على Production، ومن غير أي داتا وهمية.**

---

### ✨ Phase 7: بعد الإطلاق (v1.1، بالأولوية)
| # | المهمة | الدور | ملاحظة |
|---|---|---|---|
| 7.1 | قوالب الرسايل (أولى + FU1–3، متغيرات `{name}` `{company}`، نسخ بضغطة جنب "فتح DM") | ⚙️ | أكبر توفير للوقت |
| 7.2 | Focus mode للمتابعات (Lead واحد في الشاشة) | 🎨⚙️ | |
| 7.3 | Google Sheets بـ OAuth + مزامنة دورية | ⚙️🔒 | |
| 7.4 | Kanban view | 🎨⚙️ | |
| 7.5 | MFA (TOTP) | 🔒 | |
| 7.6 | Saved views | ⚙️ | |
> المهام دي هتتكتب بنفس صيغة الـ Prompt لما نوصلها، بعد ما نشوف استخدامك الفعلي للنسخة الأولى.

---

### 📋 فهرس كل المهام
| Phase | المهام | الأيام |
|---|---|---|
| 0: التأسيس | 0.1 → 0.10 | ½ |
| 1: الـ Leads | 1.1 → 1.11 | 1½ |
| 2: الـ Pipeline | 2.1 → 2.9 | 1½ |
| 3: المتابعات والإعدادات | 3.1 → 3.6 | 1 |
| 4: مركز البيانات | 4.1 → 4.19 | 3 |
| 5: الـ Dashboard | 5.1 → 5.3 | 1 |
| 6: الإطلاق | 6.1 → 6.8 | 1½ |
| **الإجمالي** | **66 مهمة** | **~10 أيام** |
