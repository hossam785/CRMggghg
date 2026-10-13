-- ====================================
-- Scope Mini CRM: Complete Database Setup
-- Clean Idempotent Execution
-- ====================================

drop schema if exists public cascade;
create schema public;
grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on all tables in schema public to postgres, anon, authenticated, service_role;
grant all on all functions in schema public to postgres, anon, authenticated, service_role;
grant all on all sequences in schema public to postgres, anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to postgres, anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to postgres, anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to postgres, anon, authenticated, service_role;


-- ====================================
-- 0001_foundation.sql
-- ====================================
-- Migration: 0001_foundation.sql
-- Foundation migration: extensions, set_updated_at(), settings, backup_settings, and handle_new_user stub

create extension if not exists pgcrypto with schema extensions;
create extension if not exists pg_trgm  with schema extensions;
create extension if not exists unaccent with schema extensions;
create extension if not exists pg_cron;              -- schema cron
create extension if not exists pg_net   with schema extensions;

create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create table public.settings (
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

create trigger settings_updated before update on public.settings
  for each row execute function public.set_updated_at();

create table public.backup_settings (
  owner_id           uuid primary key default auth.uid() references auth.users on delete cascade,
  frequency          text not null default 'weekly' check (frequency in ('off','daily','weekly','biweekly','monthly')),
  weekday            smallint default 5 check (weekday between 0 and 6),   -- الجمعة افتراضيًا
  month_day          smallint default 1 check (month_day between 1 and 28),
  hour_local         smallint not null default 9 check (hour_local between 0 and 23),
  format             text not null default 'xlsx' check (format in ('xlsx','csv_zip','json')),
  keep_last          smallint not null default 8 check (keep_last between 1 and 52),
  notify_inapp       boolean not null default true,
  notify_push        boolean not null default true,
  notify_email       boolean not null default false,
  next_run_at        timestamptz,
  last_reminded_at   timestamptz
);

alter table public.settings enable row level security;
alter table public.backup_settings enable row level security;

create policy own on public.settings
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy own on public.backup_settings
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- Initial handle_new_user (stub: inserts settings and backup_settings; industries added in 0003)
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
begin
  insert into public.settings (owner_id) values (new.id);
  insert into public.backup_settings (owner_id, next_run_at) values (new.id, null);
  return new;
end;
$$;


-- ====================================
-- 0002_reference.sql
-- ====================================
-- Migration: 0002_reference.sql
-- Reference data: countries table, RLS read policy, and 250 country rows

create table public.countries (
  code      char(2) primary key,
  name_ar   text not null,
  name_en   text not null,
  dial_code text
);

alter table public.countries enable row level security;

create policy read_all on public.countries for select to authenticated using (true);

insert into public.countries (code, name_ar, name_en, dial_code) values
  ('AD', 'أندورا', 'Andorra', '+376'),
  ('AE', 'الإمارات العربية المتحدة', 'United Arab Emirates', '+971'),
  ('AF', 'أفغانستان', 'Afghanistan', '+93'),
  ('AG', 'أنتيغوا وباربودا', 'Antigua and Barbuda', '+1'),
  ('AI', 'أنغويلا', 'Anguilla', '+1'),
  ('AL', 'ألبانيا', 'Albania', '+355'),
  ('AM', 'أرمينيا', 'Armenia', '+374'),
  ('AO', 'أنغولا', 'Angola', '+244'),
  ('AQ', 'القارة القطبية الجنوبية', 'Antarctica', null),
  ('AR', 'الأرجنتين', 'Argentina', '+54'),
  ('AS', 'ساموا الأمريكية', 'American Samoa', '+1'),
  ('AT', 'النمسا', 'Austria', '+43'),
  ('AU', 'أستراليا', 'Australia', '+61'),
  ('AW', 'أروبا', 'Aruba', '+297'),
  ('AX', 'جزر أولاند', 'Åland Islands', '+358'),
  ('AZ', 'أذربيجان', 'Azerbaijan', '+994'),
  ('BA', 'البوسنة والهرسك', 'Bosnia and Herzegovina', '+387'),
  ('BB', 'باربادوس', 'Barbados', '+1'),
  ('BD', 'بنغلاديش', 'Bangladesh', '+880'),
  ('BE', 'بلجيكا', 'Belgium', '+32'),
  ('BF', 'بوركينا فاسو', 'Burkina Faso', '+226'),
  ('BG', 'بلغاريا', 'Bulgaria', '+359'),
  ('BH', 'البحرين', 'Bahrain', '+973'),
  ('BI', 'بوروندي', 'Burundi', '+257'),
  ('BJ', 'بنين', 'Benin', '+229'),
  ('BL', 'سان بارتيلمي', 'Saint Barthélemy', '+590'),
  ('BM', 'برمودا', 'Bermuda', '+1'),
  ('BN', 'بروناي', 'Brunei Darussalam', '+673'),
  ('BO', 'بوليفيا', 'Bolivia', '+591'),
  ('BQ', 'الجزر الكاريبية الهولندية', 'Bonaire, Sint Eustatius and Saba', '+599'),
  ('BR', 'البرازيل', 'Brazil', '+55'),
  ('BS', 'باهاماس', 'Bahamas', '+1'),
  ('BT', 'بوتان', 'Bhutan', '+975'),
  ('BV', 'جزيرة بوفيه', 'Bouvet Island', null),
  ('BW', 'بوتسوانا', 'Botswana', '+267'),
  ('BY', 'روسيا البيضاء', 'Belarus', '+375'),
  ('BZ', 'بليز', 'Belize', '+501'),
  ('CA', 'كندا', 'Canada', '+1'),
  ('CC', 'جزر كوكوس', 'Cocos (Keeling) Islands', '+61'),
  ('CD', 'جمهورية الكونغو الديمقراطية', 'Democratic Republic of the Congo', '+243'),
  ('CF', 'جمهورية أفريقيا الوسطى', 'Central African Republic', '+236'),
  ('CG', 'جمهورية الكونغو', 'Republic of the Congo', '+242'),
  ('CH', 'سويسرا', 'Switzerland', '+41'),
  ('CI', 'ساحل العاج', 'Cote d''Ivoire', '+225'),
  ('CK', 'جزر كوك', 'Cook Islands', '+682'),
  ('CL', 'تشيلي', 'Chile', '+56'),
  ('CM', 'الكاميرون', 'Cameroon', '+237'),
  ('CN', 'الصين', 'People''s Republic of China', '+86'),
  ('CO', 'كولومبيا', 'Colombia', '+57'),
  ('CR', 'كوستاريكا', 'Costa Rica', '+506'),
  ('CU', 'كوبا', 'Cuba', '+53'),
  ('CV', 'الرأس الأخضر', 'Cape Verde', '+238'),
  ('CW', 'كوراساو', 'Curaçao', '+599'),
  ('CX', 'جزيرة عيد الميلاد', 'Christmas Island', '+61'),
  ('CY', 'قبرص', 'Cyprus', '+357'),
  ('CZ', 'جمهورية التشيك', 'Czech Republic', '+420'),
  ('DE', 'ألمانيا', 'Germany', '+49'),
  ('DJ', 'جيبوتي', 'Djibouti', '+253'),
  ('DK', 'الدنمارك', 'Denmark', '+45'),
  ('DM', 'دومينيكا', 'Dominica', '+1'),
  ('DO', 'جمهورية الدومينيكان', 'Dominican Republic', '+1'),
  ('DZ', 'الجزائر', 'Algeria', '+213'),
  ('EC', 'الإكوادور', 'Ecuador', '+593'),
  ('EE', 'إستونيا', 'Estonia', '+372'),
  ('EG', 'مصر', 'Egypt', '+20'),
  ('EH', 'الصحراء الغربية', 'Western Sahara', '+212'),
  ('ER', 'إريتريا', 'Eritrea', '+291'),
  ('ES', 'إسبانيا', 'Spain', '+34'),
  ('ET', 'إثيوبيا', 'Ethiopia', '+251'),
  ('FI', 'فنلندا', 'Finland', '+358'),
  ('FJ', 'فيجي', 'Fiji', '+679'),
  ('FK', 'جزر فوكلاند', 'Falkland Islands (Malvinas)', '+500'),
  ('FM', 'ولايات ميكرونيسيا المتحدة', 'Micronesia, Federated States of', '+691'),
  ('FO', 'جزر فارو', 'Faroe Islands', '+298'),
  ('FR', 'فرنسا', 'France', '+33'),
  ('GA', 'الغابون', 'Gabon', '+241'),
  ('GB', 'المملكة المتحدة', 'United Kingdom', '+44'),
  ('GD', 'غرينادا', 'Grenada', '+1'),
  ('GE', 'جورجيا', 'Georgia', '+995'),
  ('GF', 'غويانا الفرنسية', 'French Guiana', '+594'),
  ('GG', 'غيرنزي', 'Guernsey', '+44'),
  ('GH', 'غانا', 'Ghana', '+233'),
  ('GI', 'جبل طارق', 'Gibraltar', '+350'),
  ('GL', 'جرينلاند', 'Greenland', '+299'),
  ('GM', 'غامبيا', 'Republic of The Gambia', '+220'),
  ('GN', 'غينيا', 'Guinea', '+224'),
  ('GP', 'غوادلوب', 'Guadeloupe', '+590'),
  ('GQ', 'غينيا الاستوائية', 'Equatorial Guinea', '+240'),
  ('GR', 'اليونان', 'Greece', '+30'),
  ('GS', 'جورجيا الجنوبية وجزر ساندويتش الجنوبية', 'South Georgia and the South Sandwich Islands', null),
  ('GT', 'غواتيمالا', 'Guatemala', '+502'),
  ('GU', 'غوام', 'Guam', '+1'),
  ('GW', 'غينيا بيساو', 'Guinea-Bissau', '+245'),
  ('GY', 'غيانا', 'Guyana', '+592'),
  ('HK', 'هونغ كونغ', 'Hong Kong', '+852'),
  ('HM', 'جزيرة هيرد وجزر ماكدونالد', 'Heard Island and McDonald Islands', null),
  ('HN', 'هندوراس', 'Honduras', '+504'),
  ('HR', 'كرواتيا', 'Croatia', '+385'),
  ('HT', 'هايتي', 'Haiti', '+509'),
  ('HU', 'المجر', 'Hungary', '+36'),
  ('ID', 'إندونيسيا', 'Indonesia', '+62'),
  ('IE', 'أيرلندا', 'Ireland', '+353'),
  ('IL', 'إسرائيل', 'Israel', '+972'),
  ('IM', 'جزيرة مان', 'Isle of Man', '+44'),
  ('IN', 'الهند', 'India', '+91'),
  ('IO', 'إقليم المحيط الهندي البريطاني', 'British Indian Ocean Territory', '+246'),
  ('IQ', 'العراق', 'Iraq', '+964'),
  ('IR', 'إيران', 'Islamic Republic of Iran', '+98'),
  ('IS', 'آيسلندا', 'Iceland', '+354'),
  ('IT', 'إيطاليا', 'Italy', '+39'),
  ('JE', 'جيرزي', 'Jersey', '+44'),
  ('JM', 'جامايكا', 'Jamaica', '+1'),
  ('JO', 'الأردن', 'Jordan', '+962'),
  ('JP', 'اليابان', 'Japan', '+81'),
  ('KE', 'كينيا', 'Kenya', '+254'),
  ('KG', 'قيرغيزستان', 'Kyrgyzstan', '+996'),
  ('KH', 'كمبوديا', 'Cambodia', '+855'),
  ('KI', 'كيريباتي', 'Kiribati', '+686'),
  ('KM', 'جزر القمر', 'Comoros', '+269'),
  ('KN', 'سانت كيتس ونيفيس', 'Saint Kitts and Nevis', '+1'),
  ('KP', 'كوريا الشمالية', 'North Korea', '+850'),
  ('KR', 'كوريا الجنوبية', 'South Korea', '+82'),
  ('KW', 'الكويت', 'Kuwait', '+965'),
  ('KY', 'جزر كايمان', 'Cayman Islands', '+1'),
  ('KZ', 'كازاخستان', 'Kazakhstan', '+7'),
  ('LA', 'لاوس', 'Lao People''s Democratic Republic', '+856'),
  ('LB', 'لبنان', 'Lebanon', '+961'),
  ('LC', 'سانت لوسيا', 'Saint Lucia', '+1'),
  ('LI', 'ليختنشتاين', 'Liechtenstein', '+423'),
  ('LK', 'سريلانكا', 'Sri Lanka', '+94'),
  ('LR', 'ليبيريا', 'Liberia', '+231'),
  ('LS', 'ليسوتو', 'Lesotho', '+266'),
  ('LT', 'ليتوانيا', 'Lithuania', '+370'),
  ('LU', 'لوكسمبورغ', 'Luxembourg', '+352'),
  ('LV', 'لاتفيا', 'Latvia', '+371'),
  ('LY', 'ليبيا', 'Libya', '+218'),
  ('MA', 'المغرب', 'Morocco', '+212'),
  ('MC', 'موناكو', 'Monaco', '+377'),
  ('MD', 'مولدوفا', 'Moldova, Republic of', '+373'),
  ('ME', 'الجبل الأسود', 'Montenegro', '+382'),
  ('MF', 'سانت مارتن (الجزء الفرنسي)', 'Saint Martin (French part)', '+590'),
  ('MG', 'مدغشقر', 'Madagascar', '+261'),
  ('MH', 'جزر مارشال', 'Marshall Islands', '+692'),
  ('MK', 'مقدونيا الشمالية', 'The Republic of North Macedonia', '+389'),
  ('ML', 'مالي', 'Mali', '+223'),
  ('MM', 'بورما', 'Myanmar', '+95'),
  ('MN', 'منغوليا', 'Mongolia', '+976'),
  ('MO', 'ماكاو', 'Macao', '+853'),
  ('MP', 'جزر ماريانا الشمالية', 'Northern Mariana Islands', '+1'),
  ('MQ', 'مارتينيك', 'Martinique', '+596'),
  ('MR', 'موريتانيا', 'Mauritania', '+222'),
  ('MS', 'مونتسرات', 'Montserrat', '+1'),
  ('MT', 'مالطا', 'Malta', '+356'),
  ('MU', 'موريشيوس', 'Mauritius', '+230'),
  ('MV', 'جزر المالديف', 'Maldives', '+960'),
  ('MW', 'مالاوي', 'Malawi', '+265'),
  ('MX', 'المكسيك', 'Mexico', '+52'),
  ('MY', 'ماليزيا', 'Malaysia', '+60'),
  ('MZ', 'موزمبيق', 'Mozambique', '+258'),
  ('NA', 'ناميبيا', 'Namibia', '+264'),
  ('NC', 'كاليدونيا الجديدة', 'New Caledonia', '+687'),
  ('NE', 'النيجر', 'Niger', '+227'),
  ('NF', 'جزيرة نورفولك', 'Norfolk Island', '+672'),
  ('NG', 'نيجيريا', 'Nigeria', '+234'),
  ('NI', 'نيكاراغوا', 'Nicaragua', '+505'),
  ('NL', 'هولندا', 'Netherlands', '+31'),
  ('NO', 'النرويج', 'Norway', '+47'),
  ('NP', 'نيبال', 'Nepal', '+977'),
  ('NR', 'ناورو', 'Nauru', '+674'),
  ('NU', 'نييوي', 'Niue', '+683'),
  ('NZ', 'نيوزيلندا', 'New Zealand', '+64'),
  ('OM', 'عمان', 'Oman', '+968'),
  ('PA', 'بنما', 'Panama', '+507'),
  ('PE', 'بيرو', 'Peru', '+51'),
  ('PF', 'بولينزيا الفرنسية', 'French Polynesia', '+689'),
  ('PG', 'بابوا غينيا الجديدة', 'Papua New Guinea', '+675'),
  ('PH', 'الفلبين', 'Philippines', '+63'),
  ('PK', 'باكستان', 'Pakistan', '+92'),
  ('PL', 'بولندا', 'Poland', '+48'),
  ('PM', 'سان بيير وميكلون', 'Saint Pierre and Miquelon', '+508'),
  ('PN', 'جزر بيتكيرن', 'Pitcairn', null),
  ('PR', 'بورتوريكو', 'Puerto Rico', '+1'),
  ('PS', 'فلسطين', 'State of Palestine', '+970'),
  ('PT', 'البرتغال', 'Portugal', '+351'),
  ('PW', 'بالاو', 'Palau', '+680'),
  ('PY', 'باراغواي', 'Paraguay', '+595'),
  ('QA', 'قطر', 'Qatar', '+974'),
  ('RE', 'لا ريونيون', 'Reunion', '+262'),
  ('RO', 'رومانيا', 'Romania', '+40'),
  ('RS', 'صربيا', 'Serbia', '+381'),
  ('RU', 'روسيا', 'Russian Federation', '+7'),
  ('RW', 'رواندا', 'Rwanda', '+250'),
  ('SA', 'السعودية', 'Saudi Arabia', '+966'),
  ('SB', 'جزر سليمان', 'Solomon Islands', '+677'),
  ('SC', 'سيشل', 'Seychelles', '+248'),
  ('SD', 'السودان', 'Sudan', '+249'),
  ('SE', 'السويد', 'Sweden', '+46'),
  ('SG', 'سنغافورة', 'Singapore', '+65'),
  ('SH', 'سانت هيلينا وأسينشين وتريستان دا كونا', 'Saint Helena', '+290'),
  ('SI', 'سلوفينيا', 'Slovenia', '+386'),
  ('SJ', 'سفالبارد ويان ماين', 'Svalbard and Jan Mayen', '+47'),
  ('SK', 'سلوفاكيا', 'Slovakia', '+421'),
  ('SL', 'سيراليون', 'Sierra Leone', '+232'),
  ('SM', 'سان مارينو', 'San Marino', '+378'),
  ('SN', 'السنغال', 'Senegal', '+221'),
  ('SO', 'الصومال', 'Somalia', '+252'),
  ('SR', 'سورينام', 'Suriname', '+597'),
  ('SS', 'جنوب السودان', 'South Sudan', '+211'),
  ('ST', 'ساو تومي وبرينسيب', 'Sao Tome and Principe', '+239'),
  ('SV', 'السلفادور', 'El Salvador', '+503'),
  ('SX', 'سانت مارتن (الجزء الهولندي)', 'Sint Maarten (Dutch part)', '+1'),
  ('SY', 'سوريا', 'Syrian Arab Republic', '+963'),
  ('SZ', 'سوازيلاند', 'Eswatini', '+268'),
  ('TC', 'جزر توركس وكايكوس', 'Turks and Caicos Islands', '+1'),
  ('TD', 'تشاد', 'Chad', '+235'),
  ('TF', 'أراض فرنسية جنوبية وأنتارتيكية', 'French Southern Territories', null),
  ('TG', 'توغو', 'Togo', '+228'),
  ('TH', 'تايلاند', 'Thailand', '+66'),
  ('TJ', 'طاجيكستان', 'Tajikistan', '+992'),
  ('TK', 'توكيلاو', 'Tokelau', '+690'),
  ('TL', 'تيمور الشرقية', 'Timor-Leste', '+670'),
  ('TM', 'تركمانستان', 'Turkmenistan', '+993'),
  ('TN', 'تونس', 'Tunisia', '+216'),
  ('TO', 'تونغا', 'Tonga', '+676'),
  ('TR', 'تركيا', 'Türkiye', '+90'),
  ('TT', 'ترينيداد وتوباغو', 'Trinidad and Tobago', '+1'),
  ('TV', 'توفالو', 'Tuvalu', '+688'),
  ('TW', 'تايوان', 'Taiwan, Province of China', '+886'),
  ('TZ', 'تانزانيا', 'United Republic of Tanzania', '+255'),
  ('UA', 'أوكرانيا', 'Ukraine', '+380'),
  ('UG', 'أوغندا', 'Uganda', '+256'),
  ('UM', 'جزر الولايات المتحدة', 'United States Minor Outlying Islands', null),
  ('US', 'الولايات المتحدة', 'United States of America', '+1'),
  ('UY', 'الأوروغواي', 'Uruguay', '+598'),
  ('UZ', 'أوزبكستان', 'Uzbekistan', '+998'),
  ('VA', 'الفاتيكان', 'Holy See (Vatican City State)', '+39'),
  ('VC', 'سانت فينسنت والغرينادين', 'Saint Vincent and the Grenadines', '+1'),
  ('VE', 'فنزويلا', 'Venezuela', '+58'),
  ('VG', 'جزر العذراء البريطانية', 'Virgin Islands, British', '+1'),
  ('VI', 'جزر العذراء الأمريكية', 'Virgin Islands, U.S.', '+1'),
  ('VN', 'فيتنام', 'Vietnam', '+84'),
  ('VU', 'فانواتو', 'Vanuatu', '+678'),
  ('WF', 'والس وفوتونا', 'Wallis and Futuna', '+681'),
  ('WS', 'ساموا', 'Samoa', '+685'),
  ('XK', 'كوسوفو', 'Kosovo', '+383'),
  ('YE', 'اليمن', 'Yemen', '+967'),
  ('YT', 'مايوت', 'Mayotte', '+262'),
  ('ZA', 'جنوب أفريقيا', 'South Africa', '+27'),
  ('ZM', 'زامبيا', 'Zambia', '+260'),
  ('ZW', 'زيمبابوي', 'Zimbabwe', '+263');


-- ====================================
-- 0003_leads.sql
-- ====================================
-- Migration: 0003_leads.sql
-- Enums, industries, leads table, normalization, derivation trigger, touch trigger, RLS, and indexes

-- 1. Enums
create type public.lead_stage as enum (
  'new',
  'message_sent',
  'follow_up_1',
  'follow_up_2',
  'follow_up_3',
  'replied',
  'meeting_booked',
  'proposal_sent',
  'won',
  'lost'
);

create type public.tri_state as enum ('yes', 'no', 'unknown');

create type public.lost_reason as enum (
  'not_interested',
  'no_reply',
  'budget',
  'timing',
  'other'
);

-- 2. Industries Table
create table public.industries (
  id          smallint generated always as identity primary key,
  owner_id    uuid not null default auth.uid() references auth.users on delete cascade,
  key         text not null,
  label_ar    text not null,
  label_en    text not null,
  sort_order  smallint not null default 0,
  is_other    boolean not null default false,
  is_active   boolean not null default true,
  unique (owner_id, key)
);

create index industries_owner_idx on public.industries (owner_id, sort_order) where is_active is true;

alter table public.industries enable row level security;
create policy own on public.industries
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- 3. Leads Table
create table public.leads (
  id                 uuid primary key default gen_random_uuid(),
  owner_id           uuid not null default auth.uid() references auth.users on delete cascade,

  -- Lead Profile
  name               text not null check (char_length(btrim(name)) between 1 and 120),
  company            text check (char_length(company) <= 120),
  industry_id        smallint references public.industries(id) on delete set null,
  industry_other     text check (char_length(industry_other) <= 80),
  job_title          text check (char_length(job_title) <= 80),
  instagram_handle   text check (instagram_handle ~ '^[a-z0-9._]{1,30}$'),
  whatsapp_e164      text check (whatsapp_e164 ~ '^\+[1-9][0-9]{6,14}$'),
  country_code       char(2) references public.countries(code) on delete set null,
  notes              text check (char_length(notes) <= 5000),

  -- Qualification
  has_content        boolean,
  appears_in_content boolean,
  has_videographer   public.tri_state not null default 'unknown',
  problems           text check (char_length(problems) <= 280),

  -- Pipeline
  stage              public.lead_stage not null default 'new',
  stage_changed_at   timestamptz not null default now(),
  first_message_at   timestamptz,
  last_contacted_at  timestamptz,
  follow_ups_sent    smallint not null default 0 check (follow_ups_sent between 0 and 3),
  next_follow_up_on  date,
  reminder_note      text check (char_length(reminder_note) <= 140),
  replied_at         timestamptz,
  meeting_booked_at  timestamptz,
  meeting_at         timestamptz,
  proposal_sent_at   timestamptz,
  won_at             timestamptz,
  lost_at            timestamptz,
  lost_reason        public.lost_reason,

  -- System Metadata
  import_job_id      uuid,
  missing_fields     text[] not null default '{}',
  search_text        text not null default '',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  deleted_at         timestamptz,

  constraint has_contact check (instagram_handle is not null or whatsapp_e164 is not null)
);

alter table public.leads enable row level security;
create policy own on public.leads
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- 4. Normalization & Derivation Functions
create or replace function public.normalize_search(t text) returns text
language sql immutable parallel safe set search_path = public, extensions as $$
  select lower(regexp_replace(
           translate(extensions.unaccent('extensions.unaccent'::regdictionary, coalesce(t, '')),
                     'أإآٱىة٠١٢٣٤٥٦٧٨٩', 'اااايه0123456789'),
           E'[\u064B-\u065F\u0670\u0640]', '', 'g'))
$$;

create or replace function public.leads_derive() returns trigger
language plpgsql set search_path = public, extensions as $$
declare
  v_ind text;
  v_cty text;
begin
  -- Whitespace trimming and empty string normalization
  new.name      := btrim(regexp_replace(new.name, '\s+', ' ', 'g'));
  new.company   := nullif(btrim(new.company), '');
  new.job_title := nullif(btrim(new.job_title), '');

  -- Fetch labels for search_text
  select concat_ws(' ', label_ar, label_en) into v_ind from public.industries where id = new.industry_id;
  select concat_ws(' ', name_ar, name_en)   into v_cty from public.countries  where code = new.country_code;

  -- Build search text
  new.search_text := public.normalize_search(concat_ws(' ',
      new.name, new.company, new.job_title, new.instagram_handle,
      regexp_replace(coalesce(new.whatsapp_e164, ''), '\D', '', 'g'),
      new.industry_other, new.notes, new.problems, v_ind, v_cty));

  -- Derive missing fields
  new.missing_fields := array_remove(array[
      case when new.industry_id  is null then 'industry' end,
      case when new.country_code is null then 'country'  end,
      case when nullif(btrim(new.job_title), '') is null then 'job_title' end,
      case when new.has_content is null or new.appears_in_content is null
             or new.has_videographer = 'unknown' then 'qualification' end
    ], null);

  return new;
end;
$$;

create trigger leads_derive before insert or update on public.leads
  for each row execute function public.leads_derive();

create trigger leads_updated before update on public.leads
  for each row execute function public.set_updated_at();

-- Industry label update re-indexes associated leads
create or replace function public.industries_touch_leads() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.label_ar is distinct from old.label_ar or new.label_en is distinct from old.label_en then
    update public.leads set industry_id = industry_id where industry_id = new.id;
  end if;
  return new;
end;
$$;

create trigger industries_touch after update on public.industries
  for each row execute function public.industries_touch_leads();

-- 5. User Creation Trigger (Settings + Backup Settings + 7 Spec Industries)
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
begin
  insert into public.settings (owner_id) values (new.id)
    on conflict (owner_id) do nothing;
  insert into public.backup_settings (owner_id, next_run_at) values (new.id, null)
    on conflict (owner_id) do nothing;
  insert into public.industries (owner_id, key, label_ar, label_en, sort_order, is_other) values
    (new.id, 'real_estate_consultant', 'مستشار عقاري',  'Real Estate Consultant', 1, false),
    (new.id, 'real_estate_company',    'شركة عقارية',   'Real Estate Company',    2, false),
    (new.id, 'founder_ceo',            'Founder / CEO', 'Founder / CEO',          3, false),
    (new.id, 'business_consultant',    'مستشار أعمال',  'Business Consultant',    4, false),
    (new.id, 'doctor',                 'طبيب',          'Doctor',                 5, false),
    (new.id, 'clinic',                 'عيادة طبية',    'Medical Clinic',         6, false),
    (new.id, 'other',                  'أخرى',          'Other',                  7, true)
  on conflict (owner_id, key) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- 6. Backfill 7 Spec Industries for any pre-existing users (idempotent)
insert into public.industries (owner_id, key, label_ar, label_en, sort_order, is_other)
select u.id, ind.key, ind.label_ar, ind.label_en, ind.sort_order, ind.is_other
from auth.users u
cross join (
  values
    ('real_estate_consultant', 'مستشار عقاري',  'Real Estate Consultant', 1::smallint, false),
    ('real_estate_company',    'شركة عقارية',   'Real Estate Company',    2::smallint, false),
    ('founder_ceo',            'Founder / CEO', 'Founder / CEO',          3::smallint, false),
    ('business_consultant',    'مستشار أعمال',  'Business Consultant',    4::smallint, false),
    ('doctor',                 'طبيب',          'Doctor',                 5::smallint, false),
    ('clinic',                 'عيادة طبية',    'Medical Clinic',         6::smallint, false),
    ('other',                  'أخرى',          'Other',                  7::smallint, true)
) as ind(key, label_ar, label_en, sort_order, is_other)
where not exists (
  select 1 from public.industries where owner_id = u.id and key = ind.key
);

-- 7. Indexes (§3.6 & §18.3)
-- Standard filtered pagination & filter indexes
create index leads_list_idx         on public.leads (owner_id, created_at desc, id desc) where deleted_at is null;
create index leads_stage_idx        on public.leads (owner_id, stage, created_at desc)  where deleted_at is null;
create index leads_followup_idx     on public.leads (owner_id, next_follow_up_on) where deleted_at is null and next_follow_up_on is not null;
create index leads_industry_idx     on public.leads (owner_id, industry_id) where deleted_at is null;
create index leads_country_idx      on public.leads (owner_id, country_code) where deleted_at is null;
create index leads_last_contact_idx on public.leads (owner_id, last_contacted_at desc nulls last, id desc) where deleted_at is null;
create index leads_name_idx         on public.leads (owner_id, lower(name), id) where deleted_at is null;
create index leads_import_idx       on public.leads (import_job_id) where import_job_id is not null;

-- Uniqueness constraints (per owner, live rows only)
create unique index leads_ig_unique on public.leads (owner_id, instagram_handle)
  where deleted_at is null and instagram_handle is not null;
create unique index leads_wa_unique on public.leads (owner_id, whatsapp_e164)
  where deleted_at is null and whatsapp_e164 is not null;

-- GIN Trigram Search & Missing Fields indexes
create index leads_search_trgm      on public.leads using gin (search_text extensions.gin_trgm_ops) where deleted_at is null;
create index leads_missing_idx      on public.leads using gin (missing_fields) where deleted_at is null;


-- ====================================
-- 0004_leads_rpc.sql
-- ====================================
-- Migration: 0004_leads_rpc.sql
-- High-performance lead query RPCs: lead_filter_sql, search_leads, lead_stage_counts, suggest_leads, check_duplicate

-- 1. WHERE clause builder (injection-safe, escapes LIKE wildcards, formats with %L)
create or replace function public.lead_filter_sql(
  p_query text,
  p_stages public.lead_stage[],
  p_industries smallint[],
  p_countries text[],
  p_filters jsonb
) returns text language plpgsql stable set search_path = public, extensions as $$
declare
  w text := 'l.deleted_at is null';
  q text := nullif(public.normalize_search(btrim(coalesce(p_query, ''))), '');
  tok text;
begin
  if q is not null then
    foreach tok in array regexp_split_to_array(q, '\s+') loop
      -- Escape \, %, _ inside LIKE
      w := w || format(' and l.search_text like %L', '%' || replace(replace(replace(tok, '\', '\\'), '%', '\%'), '_', '\_') || '%');
    end loop;
  end if;

  if p_stages is not null and cardinality(p_stages) > 0 then
    w := w || format(' and l.stage = any(%L::public.lead_stage[])', p_stages);
  end if;

  if p_industries is not null and cardinality(p_industries) > 0 then
    w := w || format(' and l.industry_id = any(%L::smallint[])', p_industries);
  end if;

  if p_countries is not null and cardinality(p_countries) > 0 then
    w := w || format(' and l.country_code = any(%L::text[])', p_countries);
  end if;

  if p_filters ? 'has_content' then
    w := w || format(' and l.has_content = %L::boolean', p_filters->>'has_content');
  end if;

  if p_filters ? 'appears_in_content' then
    w := w || format(' and l.appears_in_content = %L::boolean', p_filters->>'appears_in_content');
  end if;

  if p_filters ? 'has_videographer' then
    w := w || format(' and l.has_videographer = %L::public.tri_state', p_filters->>'has_videographer');
  end if;

  if (p_filters->>'has_whatsapp')::boolean is true then
    w := w || ' and l.whatsapp_e164 is not null';
  end if;

  if (p_filters->>'due')::boolean is true then
    w := w || ' and l.next_follow_up_on <= (now() at time zone coalesce((select timezone from public.settings where owner_id = auth.uid()), ''Africa/Cairo''))::date';
  end if;

  if p_filters ? 'missing' then
    if p_filters->>'missing' = 'any' then
      w := w || ' and cardinality(l.missing_fields) > 0';
    else
      w := w || format(' and l.missing_fields @> %L::text[]', array(select jsonb_array_elements_text(p_filters->'missing')));
    end if;
  end if;

  if p_filters ? 'import_job_id' then
    w := w || format(' and l.import_job_id = %L::uuid', p_filters->>'import_job_id');
  end if;

  if p_filters ? 'created_from' then
    w := w || format(' and l.created_at >= %L::date', p_filters->>'created_from');
  end if;

  if p_filters ? 'created_to' then
    w := w || format(' and l.created_at < (%L::date + 1)', p_filters->>'created_to');
  end if;

  return w;
end;
$$;

-- 2. Keyset pagination search RPC
create or replace function public.search_leads(
  p_query text default null,
  p_stages public.lead_stage[] default null,
  p_industries smallint[] default null,
  p_countries text[] default null,
  p_filters jsonb default '{}',
  p_sort text default 'newest',
  p_cursor jsonb default null,
  p_limit int default 50
) returns table (
  id uuid,
  name text,
  company text,
  instagram_handle text,
  whatsapp_e164 text,
  industry_id smallint,
  industry_other text,
  country_code text,
  stage public.lead_stage,
  last_contacted_at timestamptz,
  next_follow_up_on date,
  follow_ups_sent smallint,
  missing_fields text[],
  created_at timestamptz,
  rank real,
  next_cursor jsonb
) language plpgsql stable set search_path = public, extensions as $$
declare
  v_where text := public.lead_filter_sql(p_query, p_stages, p_industries, p_countries, coalesce(p_filters, '{}'::jsonb));
  v_lim   int  := least(greatest(coalesce(p_limit, 50), 1), 100);
  v_q     text := nullif(public.normalize_search(btrim(coalesce(p_query, ''))), '');
  v_sort  text := coalesce(nullif(p_sort, ''), 'newest');
  v_key   text;
  v_type  text;
  v_order text;
  v_cmp   text;
  v_off   int  := 0;
begin
  if v_sort = 'relevance' and v_q is null then
    v_sort := 'newest';
  end if;

  case v_sort
    when 'newest' then
      v_key   := 'l.created_at';
      v_type  := 'timestamptz';
      v_order := 'desc';
    when 'oldest' then
      v_key   := 'l.created_at';
      v_type  := 'timestamptz';
      v_order := 'asc';
    when 'last_contact' then
      v_key   := 'coalesce(l.last_contacted_at, ''-infinity''::timestamptz)';
      v_type  := 'timestamptz';
      v_order := 'desc';
    when 'next_follow_up' then
      v_key   := 'coalesce(l.next_follow_up_on, ''infinity''::date)';
      v_type  := 'date';
      v_order := 'asc';
    when 'name' then
      v_key   := 'lower(l.name)';
      v_type  := 'text';
      v_order := 'asc';
    when 'relevance' then
      v_key   := format('similarity(l.search_text, %L)', v_q);
      v_type  := 'real';
      v_order := 'desc';
    else
      raise exception 'INVALID_SORT';
  end case;

  if p_cursor is not null then
    if v_sort = 'relevance' then
      v_off := least(greatest(coalesce((p_cursor->>'offset')::int, 0), 0), 500);
    else
      v_cmp := case v_order when 'desc' then '<' else '>' end;
      v_where := v_where || format(' and (%s, l.id) %s (%L::%s, %L::uuid)',
                   v_key, v_cmp, p_cursor->>'k', v_type, p_cursor->>'id');
    end if;
  end if;

  return query execute format($q$
    select l.id,
           l.name,
           l.company,
           l.instagram_handle,
           l.whatsapp_e164,
           l.industry_id,
           l.industry_other,
           l.country_code::text,
           l.stage,
           l.last_contacted_at,
           l.next_follow_up_on,
           l.follow_ups_sent,
           l.missing_fields,
           l.created_at,
           %s::real as rank,
           null::jsonb as next_cursor
      from public.leads l
     where %s
     order by %s %s, l.id %s
     limit %s offset %s
  $q$,
    case when v_q is not null then format('similarity(l.search_text, %L)', v_q) else '0' end,
    v_where,
    v_key,
    v_order,
    v_order,
    v_lim + 1,
    v_off
  );
end;
$$;

-- 3. Lead Stage Counts
create or replace function public.lead_stage_counts(
  p_query text default null,
  p_industries smallint[] default null,
  p_countries text[] default null,
  p_filters jsonb default '{}'
) returns table (stage public.lead_stage, total bigint)
language plpgsql stable set search_path = public, extensions as $$
begin
  return query execute format(
    'select l.stage, count(*)::bigint as total from public.leads l where %s group by l.stage',
    public.lead_filter_sql(p_query, null, p_industries, p_countries, coalesce(p_filters, '{}'::jsonb))
  );
end;
$$;

-- 4. Fuzzy Suggestion ("هل تقصد؟") with local word_similarity threshold
create or replace function public.suggest_leads(p_query text, p_limit int default 5)
returns table (id uuid, name text, instagram_handle text, stage public.lead_stage, score real)
language plpgsql stable set search_path = public, extensions as $$
declare
  v_norm text := public.normalize_search(coalesce(p_query, ''));
  v_lim  int  := least(greatest(coalesce(p_limit, 5), 1), 10);
begin
  if nullif(v_norm, '') is null then
    return;
  end if;

  perform set_config('pg_trgm.word_similarity_threshold', '0.35', true);

  return query
    select l.id,
           l.name,
           l.instagram_handle,
           l.stage,
           word_similarity(v_norm, l.search_text)::real as score
      from public.leads l
     where l.deleted_at is null
       and v_norm <% l.search_text
     order by score desc, l.id desc
     limit v_lim;
end;
$$;

-- 5. Duplicate Check
create or replace function public.check_duplicate(
  p_handle text default null,
  p_phone text default null,
  p_exclude uuid default null
) returns table (id uuid, name text, stage public.lead_stage, matched_on text)
language sql stable set search_path = public as $$
  select l.id,
         l.name,
         l.stage,
         case
           when p_handle is not null and l.instagram_handle = lower(p_handle) then 'instagram'
           else 'whatsapp'
         end as matched_on
    from public.leads l
   where l.deleted_at is null
     and (p_exclude is null or l.id <> p_exclude)
     and (
       (p_handle is not null and l.instagram_handle = lower(p_handle))
       or
       (p_phone is not null and l.whatsapp_e164 = p_phone)
     )
   limit 2;
$$;

-- 6. Grant & Revoke Permissions
revoke all on function public.lead_filter_sql from public, anon;
grant execute on function public.lead_filter_sql to authenticated;

revoke all on function public.search_leads from public, anon;
grant execute on function public.search_leads to authenticated;

revoke all on function public.lead_stage_counts from public, anon;
grant execute on function public.lead_stage_counts to authenticated;

revoke all on function public.suggest_leads from public, anon;
grant execute on function public.suggest_leads to authenticated;

revoke all on function public.check_duplicate from public, anon;
grant execute on function public.check_duplicate to authenticated;


-- ====================================
-- 0005_pipeline.sql
-- ====================================
-- Migration: 0005_pipeline.sql
-- Enums, lead_events table, trigger, assert_stage, lead_action (13 actions), and undo_lead_event

-- 1. Enum: lead_event_type (§3.1)
create type public.lead_event_type as enum (
  'created',
  'message_sent',
  'follow_up_sent',
  'reply_received',
  'meeting_booked',
  'proposal_sent',
  'won',
  'lost',
  'stage_set',
  'reopened',
  'reminder_set',
  'snoozed',
  'restarted'
);

-- 2. Table: lead_events (§3.4)
create table public.lead_events (
  id           bigint generated always as identity primary key,
  owner_id     uuid not null default auth.uid() references auth.users on delete cascade,
  lead_id      uuid not null references public.leads(id) on delete cascade,
  type         public.lead_event_type not null,
  from_stage   public.lead_stage,
  to_stage     public.lead_stage,
  prev_state   jsonb,
  meta         jsonb not null default '{}'::jsonb,
  occurred_at  timestamptz not null default now(),
  undone_at    timestamptz
);

alter table public.lead_events enable row level security;
create policy own on public.lead_events
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create index events_stats_idx on public.lead_events (owner_id, type, occurred_at) where undone_at is null;
create index events_lead_idx  on public.lead_events (lead_id, id desc);

-- 3. Helper: assert_stage
create or replace function public.assert_stage(p_current public.lead_stage, p_allowed public.lead_stage[])
returns void language plpgsql immutable set search_path = public as $$
begin
  if not (p_current = any(p_allowed)) then
    raise exception 'INVALID_TRANSITION' using errcode = 'P0001', detail = p_current::text;
  end if;
end;
$$;

-- 4. Trigger: leads_created_event (fires AFTER INSERT on public.leads)
create or replace function public.leads_created_event() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.lead_events (owner_id, lead_id, type, to_stage, meta, occurred_at)
  values (
    new.owner_id,
    new.id,
    'created',
    new.stage,
    case when new.import_job_id is not null
         then jsonb_build_object('import_job_id', new.import_job_id)
         else '{}'::jsonb
    end,
    new.created_at
  );
  return new;
end;
$$;

drop trigger if exists leads_created_event on public.leads;
create trigger leads_created_event after insert on public.leads
  for each row execute function public.leads_created_event();

-- 5. RPC: lead_action (§4.2, §4.3, §18.3)
create or replace function public.lead_action(
  p_lead_id uuid,
  p_action text,
  p_payload jsonb default '{}'::jsonb,
  p_expected_stage public.lead_stage default null
) returns jsonb
language plpgsql security invoker set search_path = public as $$
declare
  v leads;
  s settings;
  v_today date;
  v_from lead_stage;
  v_prev jsonb;
  v_event bigint;
  v_type lead_event_type;
  v_waiting lead_stage[] := array['message_sent', 'follow_up_1', 'follow_up_2', 'follow_up_3']::lead_stage[];
  v_open lead_stage[] := array['new', 'message_sent', 'follow_up_1', 'follow_up_2', 'follow_up_3', 'replied', 'meeting_booked', 'proposal_sent']::lead_stage[];
  v_target_stage lead_stage;
begin
  -- Row lock
  select * into v from public.leads
   where id = p_lead_id and deleted_at is null
   for update;

  if not found then
    raise exception 'LEAD_NOT_FOUND' using errcode = 'P0002';
  end if;

  if p_expected_stage is not null and v.stage <> p_expected_stage then
    raise exception 'STAGE_CONFLICT' using errcode = 'P0001', detail = v.stage::text;
  end if;

  select * into s from public.settings where owner_id = v.owner_id;
  v_today := (now() at time zone coalesce(s.timezone, 'Africa/Cairo'))::date;
  v_from  := v.stage;

  -- Exact pipeline columns snapshot for undo
  v_prev := jsonb_build_object(
    'stage', v.stage,
    'stage_changed_at', v.stage_changed_at,
    'first_message_at', v.first_message_at,
    'last_contacted_at', v.last_contacted_at,
    'follow_ups_sent', v.follow_ups_sent,
    'next_follow_up_on', v.next_follow_up_on,
    'reminder_note', v.reminder_note,
    'replied_at', v.replied_at,
    'meeting_booked_at', v.meeting_booked_at,
    'meeting_at', v.meeting_at,
    'proposal_sent_at', v.proposal_sent_at,
    'won_at', v.won_at,
    'lost_at', v.lost_at,
    'lost_reason', v.lost_reason
  );

  case p_action
  when 'send_message' then
    perform assert_stage(v.stage, array['new']::lead_stage[]);
    update public.leads set
      stage = 'message_sent',
      stage_changed_at = now(),
      first_message_at = coalesce(first_message_at, now()),
      last_contacted_at = now(),
      follow_ups_sent = 0,
      next_follow_up_on = v_today + s.fu1_after_days
    where id = v.id returning * into v;
    v_type := 'message_sent';

  when 'send_follow_up' then
    perform assert_stage(v.stage, array['message_sent', 'follow_up_1', 'follow_up_2']::lead_stage[]);
    update public.leads set
      stage = case v.stage
                when 'message_sent' then 'follow_up_1'::lead_stage
                when 'follow_up_1'  then 'follow_up_2'::lead_stage
                else 'follow_up_3'::lead_stage
              end,
      stage_changed_at = now(),
      last_contacted_at = now(),
      follow_ups_sent = v.follow_ups_sent + 1,
      next_follow_up_on = v_today + case v.stage
                                      when 'message_sent' then s.fu2_after_days
                                      when 'follow_up_1'  then s.fu3_after_days
                                      else s.give_up_after_days
                                    end
    where id = v.id returning * into v;
    v_type := 'follow_up_sent';
    p_payload := coalesce(p_payload, '{}'::jsonb) || jsonb_build_object('number', v.follow_ups_sent);

  when 'reply_received' then
    perform assert_stage(v.stage, array['new', 'message_sent', 'follow_up_1', 'follow_up_2', 'follow_up_3']::lead_stage[]);
    update public.leads set
      stage = 'replied',
      stage_changed_at = now(),
      replied_at = coalesce(replied_at, now()),
      next_follow_up_on = null,
      reminder_note = null
    where id = v.id returning * into v;
    v_type := 'reply_received';

  when 'book_meeting' then
    perform assert_stage(v.stage, array['new', 'message_sent', 'follow_up_1', 'follow_up_2', 'follow_up_3', 'replied']::lead_stage[]);
    if p_payload ? 'meeting_at' and p_payload->>'meeting_at' is not null and p_payload->>'meeting_at' <> '' then
      begin
        perform (p_payload->>'meeting_at')::timestamptz;
      exception when others then
        raise exception 'VALIDATION' using errcode = '23514';
      end;
    end if;

    update public.leads set
      stage = 'meeting_booked',
      stage_changed_at = now(),
      meeting_booked_at = now(),
      replied_at = coalesce(replied_at, now()),
      meeting_at = nullif(p_payload->>'meeting_at', '')::timestamptz,
      next_follow_up_on = null,
      reminder_note = null
    where id = v.id returning * into v;
    v_type := 'meeting_booked';

  when 'send_proposal' then
    perform assert_stage(v.stage, array['replied', 'meeting_booked']::lead_stage[]);
    update public.leads set
      stage = 'proposal_sent',
      stage_changed_at = now(),
      proposal_sent_at = now()
    where id = v.id returning * into v;
    v_type := 'proposal_sent';

  when 'mark_won' then
    perform assert_stage(v.stage, v_open);
    update public.leads set
      stage = 'won',
      stage_changed_at = now(),
      won_at = now(),
      next_follow_up_on = null,
      reminder_note = null
    where id = v.id returning * into v;
    v_type := 'won';

  when 'mark_lost' then
    perform assert_stage(v.stage, v_open);
    if not (p_payload ? 'reason') or p_payload->>'reason' is null or p_payload->>'reason' not in ('not_interested', 'no_reply', 'budget', 'timing', 'other') then
      raise exception 'VALIDATION' using errcode = '23514';
    end if;

    update public.leads set
      stage = 'lost',
      stage_changed_at = now(),
      lost_at = now(),
      lost_reason = (p_payload->>'reason')::public.lost_reason,
      next_follow_up_on = null,
      reminder_note = null
    where id = v.id returning * into v;
    v_type := 'lost';

  when 'reopen' then
    perform assert_stage(v.stage, array['won', 'lost']::lead_stage[]);
    if p_payload ? 'to_stage' and p_payload->>'to_stage' is not null and p_payload->>'to_stage' <> '' then
      begin
        perform (p_payload->>'to_stage')::lead_stage;
      exception when others then
        raise exception 'VALIDATION' using errcode = '23514';
      end;
      if (p_payload->>'to_stage')::lead_stage in ('won', 'lost') then
        raise exception 'VALIDATION' using errcode = '23514';
      end if;
    end if;

    update public.leads set
      stage = coalesce((p_payload->>'to_stage')::lead_stage, 'replied'),
      stage_changed_at = now(),
      won_at = null,
      lost_at = null,
      lost_reason = null
    where id = v.id returning * into v;
    v_type := 'reopened';

  when 'set_reminder' then
    if not (p_payload ? 'date') or p_payload->>'date' is null or p_payload->>'date' = '' then
      raise exception 'VALIDATION' using errcode = '23514';
    end if;
    begin
      perform (p_payload->>'date')::date;
    exception when others then
      raise exception 'VALIDATION' using errcode = '23514';
    end;
    if (p_payload->>'date')::date < (v_today - interval '1 day')::date then
      raise exception 'VALIDATION' using errcode = '23514';
    end if;

    update public.leads set
      next_follow_up_on = (p_payload->>'date')::date,
      reminder_note = nullif(left(btrim(coalesce(p_payload->>'note', '')), 140), '')
    where id = v.id returning * into v;
    v_type := 'reminder_set';

  when 'clear_reminder' then
    if v.stage = any(v_waiting) then
      raise exception 'INVALID_TRANSITION' using errcode = 'P0001';
    end if;

    update public.leads set
      next_follow_up_on = null,
      reminder_note = null
    where id = v.id returning * into v;
    v_type := 'reminder_set';
    p_payload := coalesce(p_payload, '{}'::jsonb) || '{"cleared":true}'::jsonb;

  when 'snooze' then
    if v.next_follow_up_on is null then
      raise exception 'INVALID_TRANSITION' using errcode = 'P0001';
    end if;
    if p_payload ? 'days' then
      if (p_payload->>'days')::int < 1 or (p_payload->>'days')::int > 90 then
        raise exception 'VALIDATION' using errcode = '23514';
      end if;
    end if;

    update public.leads set
      next_follow_up_on = greatest(v.next_follow_up_on, v_today) + coalesce((p_payload->>'days')::int, 1)
    where id = v.id returning * into v;
    v_type := 'snoozed';

  when 'restart' then
    perform assert_stage(v.stage, array['follow_up_3', 'lost']::lead_stage[]);
    if p_payload ? 'after_days' and p_payload->>'after_days' is not null and p_payload->>'after_days' <> '' then
      if (p_payload->>'after_days')::int < 1 or (p_payload->>'after_days')::int > 90 then
        raise exception 'VALIDATION' using errcode = '23514';
      end if;
    end if;

    update public.leads set
      stage = 'new',
      stage_changed_at = now(),
      follow_ups_sent = 0,
      lost_at = null,
      lost_reason = null,
      next_follow_up_on = case
                            when p_payload ? 'after_days' and nullif(p_payload->>'after_days', '') is not null
                            then v_today + (p_payload->>'after_days')::int
                            else null
                          end,
      reminder_note = null
    where id = v.id returning * into v;
    v_type := 'restarted';

  when 'set_stage' then
    if not (p_payload ? 'to_stage') or p_payload->>'to_stage' is null or p_payload->>'to_stage' = '' then
      raise exception 'VALIDATION' using errcode = '23514';
    end if;
    begin
      perform (p_payload->>'to_stage')::lead_stage;
    exception when others then
      raise exception 'VALIDATION' using errcode = '23514';
    end;

    v_target_stage := (p_payload->>'to_stage')::lead_stage;

    update public.leads set
      stage = v_target_stage,
      stage_changed_at = now(),
      next_follow_up_on = case
                            when v_target_stage = any(v_waiting)
                            then coalesce(next_follow_up_on, v_today + s.fu1_after_days)
                            when v_target_stage in ('won', 'lost', 'replied', 'meeting_booked')
                            then null
                            else next_follow_up_on
                          end,
      won_at = case when v_target_stage = 'won' then coalesce(won_at, now()) else null end,
      lost_at = case when v_target_stage = 'lost' then coalesce(lost_at, now()) else null end,
      lost_reason = case
                      when v_target_stage = 'lost'
                      then coalesce(nullif(p_payload->>'reason', '')::public.lost_reason, lost_reason, 'other'::public.lost_reason)
                      else null
                    end
    where id = v.id returning * into v;
    v_type := 'stage_set';

  else
    raise exception 'UNKNOWN_ACTION' using errcode = 'P0001';
  end case;

  -- Insert event record
  insert into public.lead_events (owner_id, lead_id, type, from_stage, to_stage, prev_state, meta)
  values (v.owner_id, v.id, v_type, v_from, v.stage, v_prev, coalesce(p_payload, '{}'::jsonb))
  returning id into v_event;

  return jsonb_build_object('lead', to_jsonb(v) - 'search_text', 'event_id', v_event);
end;
$$;

-- 6. RPC: undo_lead_event (§4.4, §18.3)
create or replace function public.undo_lead_event(p_event_id bigint) returns jsonb
language plpgsql security invoker set search_path = public as $$
declare
  e lead_events;
  v leads;
  v_latest bigint;
begin
  select * into e from public.lead_events where id = p_event_id and undone_at is null for update;
  if not found or e.prev_state is null then
    raise exception 'LEAD_NOT_FOUND' using errcode = 'P0002';
  end if;

  if e.occurred_at < now() - interval '10 minutes' then
    raise exception 'UNDO_EXPIRED' using errcode = 'P0001';
  end if;

  select max(id) into v_latest from public.lead_events
   where lead_id = e.lead_id and undone_at is null and prev_state is not null;

  if v_latest <> e.id then
    raise exception 'UNDO_NOT_LATEST' using errcode = 'P0001';
  end if;

  -- Restore pipeline columns from snapshot
  update public.leads l set
    stage             = (e.prev_state->>'stage')::lead_stage,
    stage_changed_at  = (e.prev_state->>'stage_changed_at')::timestamptz,
    first_message_at  = (e.prev_state->>'first_message_at')::timestamptz,
    last_contacted_at = (e.prev_state->>'last_contacted_at')::timestamptz,
    follow_ups_sent   = coalesce((e.prev_state->>'follow_ups_sent')::smallint, 0),
    next_follow_up_on = (e.prev_state->>'next_follow_up_on')::date,
    reminder_note     = e.prev_state->>'reminder_note',
    replied_at        = (e.prev_state->>'replied_at')::timestamptz,
    meeting_booked_at = (e.prev_state->>'meeting_booked_at')::timestamptz,
    meeting_at        = (e.prev_state->>'meeting_at')::timestamptz,
    proposal_sent_at  = (e.prev_state->>'proposal_sent_at')::timestamptz,
    won_at            = (e.prev_state->>'won_at')::timestamptz,
    lost_at           = (e.prev_state->>'lost_at')::timestamptz,
    lost_reason       = (e.prev_state->>'lost_reason')::public.lost_reason
  where l.id = e.lead_id
  returning l.* into v;

  update public.lead_events set undone_at = now() where id = e.id;
  return jsonb_build_object('lead', to_jsonb(v) - 'search_text');
end;
$$;

-- 7. Permissions & Grants
grant execute on function public.assert_stage(public.lead_stage, public.lead_stage[]) to authenticated;
grant execute on function public.lead_action(uuid, text, jsonb, public.lead_stage) to authenticated;
grant execute on function public.undo_lead_event(bigint) to authenticated;

revoke execute on function public.assert_stage(public.lead_stage, public.lead_stage[]) from anon;
revoke execute on function public.lead_action(uuid, text, jsonb, public.lead_stage) from anon;
revoke execute on function public.undo_lead_event(bigint) from anon;


-- ====================================
-- 0006_follow_ups.sql
-- ====================================
-- Migration 0006_follow_ups.sql: follow_up_queue RPC (§F5, §18.3)
-- Computes grouped follow-up buckets based on user timezone and next_follow_up_on.

create or replace function public.follow_up_queue(p_waiting_limit int default 100)
returns table (
  bucket text,
  bucket_total bigint,
  days_overdue int,
  id uuid,
  name text,
  instagram_handle text,
  whatsapp_e164 text,
  industry_id smallint,
  country_code text,
  stage lead_stage,
  last_contacted_at timestamptz,
  next_follow_up_on date,
  reminder_note text,
  meeting_at timestamptz
) language sql stable set search_path = public as $$
  with s as (
    select
      timezone,
      (now() at time zone timezone)::date as today
    from settings
    where owner_id = auth.uid()
  ),
  base as (
    select
      l.*,
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
    select
      b.*,
      count(*) over (partition by b.bucket) as bucket_total,
      row_number() over (
        partition by b.bucket
        order by b.next_follow_up_on, b.last_contacted_at nulls first, b.id
      ) as rn
    from base b
    where b.bucket is not null
  )
  select
    bucket,
    bucket_total,
    greatest(days_overdue, 0),
    id,
    name,
    instagram_handle,
    whatsapp_e164,
    industry_id,
    country_code::text,
    stage,
    last_contacted_at,
    next_follow_up_on,
    reminder_note,
    meeting_at
  from ranked
  where bucket <> 'waiting' or rn <= least(p_waiting_limit, 500)
  order by
    array_position(array['due_fu1','due_fu2','due_fu3','reminder','meeting_today','exhausted','waiting'], bucket),
    rn
$$;

revoke all on function public.follow_up_queue(int) from public, anon;
grant execute on function public.follow_up_queue(int) to authenticated;


-- ====================================
-- 0007_export.sql
-- ====================================
-- 0007_export.sql
-- Function export_leads: Streaming keyset export for leads with full profile, qualification, and joined reference labels

create or replace function public.export_leads(
  p_query text default null,
  p_stages public.lead_stage[] default null,
  p_industries smallint[] default null,
  p_countries text[] default null,
  p_filters jsonb default null,
  p_cursor uuid default null,
  p_limit int default 2000
) returns table (
  id uuid,
  name text,
  company text,
  job_title text,
  instagram_handle text,
  whatsapp_e164 text,
  country_code text,
  country_name_ar text,
  country_name_en text,
  industry_name_ar text,
  industry_name_en text,
  stage public.lead_stage,
  stage_changed_at timestamptz,
  first_message_at timestamptz,
  last_contacted_at timestamptz,
  follow_ups_sent smallint,
  next_follow_up_on date,
  reminder_note text,
  replied_at timestamptz,
  meeting_booked_at timestamptz,
  meeting_at timestamptz,
  proposal_sent_at timestamptz,
  won_at timestamptz,
  lost_at timestamptz,
  lost_reason public.lost_reason,
  notes text,
  has_content boolean,
  appears_in_content boolean,
  has_videographer public.tri_state,
  problems text,
  created_at timestamptz,
  updated_at timestamptz,
  next_cursor uuid
) language plpgsql stable set search_path = public, extensions as $$
declare
  v_where text := public.lead_filter_sql(p_query, p_stages, p_industries, p_countries, coalesce(p_filters, '{}'::jsonb));
  v_lim   int  := least(greatest(coalesce(p_limit, 2000), 1), 5000);
  v_cur_created timestamptz;
  v_sql   text;
begin
  if p_cursor is not null then
    select l.created_at into v_cur_created
      from public.leads l
     where l.id = p_cursor and l.owner_id = auth.uid() and l.deleted_at is null;

    if v_cur_created is not null then
      v_where := v_where || format(' and (l.created_at, l.id) < (%L::timestamptz, %L::uuid)', v_cur_created, p_cursor);
    end if;
  end if;

  v_sql := format(
    'select
       l.id,
       l.name,
       l.company,
       l.job_title,
       l.instagram_handle,
       l.whatsapp_e164,
       l.country_code,
       c.name_ar as country_name_ar,
       c.name_en as country_name_en,
       coalesce(ind.label_ar, l.industry_other) as industry_name_ar,
       coalesce(ind.label_en, l.industry_other) as industry_name_en,
       l.stage,
       l.stage_changed_at,
       l.first_message_at,
       l.last_contacted_at,
       l.follow_ups_sent,
       l.next_follow_up_on,
       l.reminder_note,
       l.replied_at,
       l.meeting_booked_at,
       l.meeting_at,
       l.proposal_sent_at,
       l.won_at,
       l.lost_at,
       l.lost_reason,
       l.notes,
       l.has_content,
       l.appears_in_content,
       l.has_videographer,
       l.problems,
       l.created_at,
       l.updated_at,
       lead(l.id) over (order by l.created_at desc, l.id desc) as next_cursor
     from public.leads l
     left join public.industries ind on l.industry_id = ind.id
     left join public.countries c on l.country_code = c.code
     where %s
     order by l.created_at desc, l.id desc
     limit %s',
    v_where,
    v_lim
  );

  return query execute v_sql;
end;
$$;

grant execute on function public.export_leads to authenticated;
revoke execute on function public.export_leads from anon;


-- ====================================
-- 0008_import.sql
-- ====================================
-- Migration 0008_import.sql: Import staging schema, RLS, and RPCs
-- Specifications: §3.5.1, §F10.3, §18.3

-- 1. Custom Types
do $$ begin
  if not exists (select 1 from pg_type where typname = 'import_status') then
    create type import_status as enum ('parsing','staging','validating','review','committing','done','cancelled','failed','rolled_back');
  end if;
  if not exists (select 1 from pg_type where typname = 'import_row_status') then
    create type import_row_status as enum ('valid','incomplete','error','duplicate_db','duplicate_file');
  end if;
end $$;

-- 2. import_jobs table
create table if not exists public.import_jobs (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  source         text not null check (source in ('xlsx','xls','csv','ods','google_sheet','backup','tsv_paste')),
  file_name      text,
  sheet_name     text,
  mapping        jsonb not null default '{}'::jsonb,
  options        jsonb not null default '{}'::jsonb,
  status         import_status not null default 'parsing',
  total_rows     int not null default 0,
  staged_rows    int not null default 0,
  committed_rows int not null default 0,
  counts         jsonb not null default '{}'::jsonb,
  error          text,
  created_at     timestamptz not null default now(),
  finished_at    timestamptz
);

alter table public.import_jobs enable row level security;

create policy "own import_jobs read" on public.import_jobs
  for select to authenticated using (owner_id = auth.uid());

create policy "own import_jobs insert" on public.import_jobs
  for insert to authenticated with check (owner_id = auth.uid());

create policy "own import_jobs update" on public.import_jobs
  for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "own import_jobs delete" on public.import_jobs
  for delete to authenticated using (owner_id = auth.uid());

create index if not exists import_jobs_owner_idx on public.import_jobs (owner_id, created_at desc);

-- 3. import_rows staging table
create table if not exists public.import_rows (
  job_id         uuid not null references public.import_jobs(id) on delete cascade,
  row_no         int not null,
  owner_id       uuid not null default auth.uid(),
  kind           text not null default 'lead' check (kind in ('lead','event','industry','settings')),
  raw            jsonb not null,
  data           jsonb not null,
  status         import_row_status not null,
  issues         jsonb not null default '[]'::jsonb,
  match_lead_id  uuid references public.leads(id) on delete set null,
  decision       text check (decision in ('import','skip','update')),
  raw_before     jsonb,
  committed_at   timestamptz,
  result_lead_id uuid references public.leads(id) on delete set null,
  primary key (job_id, row_no)
);

alter table public.import_rows enable row level security;

create policy "own import_rows read" on public.import_rows
  for select to authenticated using (owner_id = auth.uid());

create policy "own import_rows insert" on public.import_rows
  for insert to authenticated with check (owner_id = auth.uid());

create policy "own import_rows update" on public.import_rows
  for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "own import_rows delete" on public.import_rows
  for delete to authenticated using (owner_id = auth.uid());

create index if not exists import_rows_status_idx on public.import_rows (job_id, status, row_no);
create index if not exists import_rows_match_lead_idx on public.import_rows (match_lead_id) where match_lead_id is not null;

-- Add import_job_id foreign key reference on leads table if not present
do $$ begin
  if not exists (
    select 1 from information_schema.columns 
    where table_name = 'leads' and column_name = 'import_job_id'
  ) then
    alter table public.leads add column import_job_id uuid references public.import_jobs(id) on delete set null;
    create index leads_import_job_idx on public.leads (import_job_id) where import_job_id is not null;
  end if;
end $$;

-- 4. RPC: stage_import_rows (idempotent for resume)
create or replace function public.stage_import_rows(p_job uuid, p_rows jsonb)
returns int
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_inserted int := 0;
begin
  insert into public.import_rows (job_id, row_no, kind, raw, data, status, issues, owner_id)
  select
    p_job,
    r.row_no,
    coalesce(r.kind, 'lead'),
    r.raw,
    r.data,
    r.status::import_row_status,
    coalesce(r.issues, '[]'::jsonb),
    auth.uid()
  from jsonb_to_recordset(p_rows) as r(
    row_no int,
    kind text,
    raw jsonb,
    data jsonb,
    status text,
    issues jsonb
  )
  on conflict (job_id, row_no) do update set
    kind = excluded.kind,
    raw = excluded.raw,
    data = excluded.data,
    status = excluded.status,
    issues = excluded.issues;

  get diagnostics v_inserted = row_count;

  update public.import_jobs
     set staged_rows = (select count(*) from public.import_rows where job_id = p_job),
         status = 'staging'
   where id = p_job and owner_id = auth.uid();

  return v_inserted;
end;
$$;

-- 5. RPC: finalize_import_staging
create or replace function public.finalize_import_staging(p_job uuid)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_strategy text;
  v_counts jsonb;
  v_job public.import_jobs%rowtype;
begin
  select * into v_job from public.import_jobs where id = p_job and owner_id = auth.uid() for update;
  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0002';
  end if;

  v_strategy := coalesce(v_job.options->>'duplicate_strategy', 'skip');
  update public.import_jobs set status = 'validating' where id = p_job;

  -- 1) Detect duplicates inside the file (by Instagram handle)
  with d as (
    select row_no,
           row_number() over (partition by data->>'instagram_handle' order by row_no asc) as rn
      from public.import_rows
     where job_id = p_job and kind = 'lead' and status in ('valid', 'incomplete')
       and nullif(trim(data->>'instagram_handle'), '') is not null
  )
  update public.import_rows r
     set status = 'duplicate_file'
    from d
   where r.job_id = p_job and r.row_no = d.row_no and d.rn > 1;

  -- 2) Detect duplicates inside the file (by WhatsApp number)
  with d as (
    select row_no,
           row_number() over (partition by data->>'whatsapp_e164' order by row_no asc) as rn
      from public.import_rows
     where job_id = p_job and kind = 'lead' and status in ('valid', 'incomplete')
       and nullif(trim(data->>'whatsapp_e164'), '') is not null
  )
  update public.import_rows r
     set status = 'duplicate_file'
    from d
   where r.job_id = p_job and r.row_no = d.row_no and d.rn > 1;

  -- 3) Detect duplicates against active leads in DB
  update public.import_rows r
     set status = 'duplicate_db',
         match_lead_id = l.id
    from public.leads l
   where r.job_id = p_job
     and r.kind = 'lead'
     and r.status in ('valid', 'incomplete')
     and l.owner_id = auth.uid()
     and l.deleted_at is null
     and (
       (nullif(trim(r.data->>'instagram_handle'), '') is not null and l.instagram_handle = trim(r.data->>'instagram_handle'))
       or
       (nullif(trim(r.data->>'whatsapp_e164'), '') is not null and l.whatsapp_e164 = trim(r.data->>'whatsapp_e164'))
     );

  -- 4) Set default decisions
  update public.import_rows
     set decision = case status
       when 'valid' then 'import'
       when 'incomplete' then 'import'
       when 'duplicate_db' then case when v_strategy = 'skip' then 'skip' else 'update' end
       else 'skip'
     end
   where job_id = p_job and decision is null;

  -- 5) Aggregate counts
  select coalesce(
    jsonb_object_agg(status, c),
    '{}'::jsonb
  ) into v_counts
  from (
    select status::text, count(*) as c
      from public.import_rows
     where job_id = p_job
     group by status
  ) x;

  update public.import_jobs
     set counts = v_counts,
         status = 'review'
   where id = p_job;

  return v_counts;
end;
$$;

-- 6. RPC: update_import_row
create or replace function public.update_import_row(
  p_job uuid,
  p_row_no int,
  p_data jsonb,
  p_status text,
  p_issues jsonb default '[]'::jsonb
)
returns public.import_rows
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_row public.import_rows%rowtype;
  v_match_id uuid;
  v_status import_row_status := p_status::import_row_status;
  v_decision text;
begin
  -- Re-check DB duplicate for this row
  select id into v_match_id
    from public.leads
   where owner_id = auth.uid()
     and deleted_at is null
     and (
       (nullif(trim(p_data->>'instagram_handle'), '') is not null and instagram_handle = trim(p_data->>'instagram_handle'))
       or
       (nullif(trim(p_data->>'whatsapp_e164'), '') is not null and whatsapp_e164 = trim(p_data->>'whatsapp_e164'))
     )
   limit 1;

  if v_match_id is not null and v_status in ('valid', 'incomplete') then
    v_status := 'duplicate_db';
  end if;

  v_decision := case v_status
    when 'valid' then 'import'
    when 'incomplete' then 'import'
    when 'duplicate_db' then 'update'
    else 'skip'
  end;

  update public.import_rows
     set data = p_data,
         status = v_status,
         issues = coalesce(p_issues, '[]'::jsonb),
         match_lead_id = v_match_id,
         decision = v_decision
   where job_id = p_job and row_no = p_row_no and owner_id = auth.uid()
  returning * into v_row;

  -- Refresh job counts
  update public.import_jobs
     set counts = (
       select coalesce(jsonb_object_agg(status, c), '{}'::jsonb)
         from (select status::text, count(*) as c from public.import_rows where job_id = p_job group by status) x
     )
   where id = p_job;

  return v_row;
end;
$$;

-- 7. RPC: set_import_decisions (bulk decision update)
create or replace function public.set_import_decisions(
  p_job uuid,
  p_status text,
  p_decision text
)
returns int
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_updated int;
begin
  if p_decision not in ('import', 'skip', 'update') then
    raise exception 'INVALID_DECISION' using errcode = 'P0001';
  end if;

  update public.import_rows
     set decision = p_decision
   where job_id = p_job
     and owner_id = auth.uid()
     and status::text = p_status
     and committed_at is null;

  get diagnostics v_updated = row_count;
  return v_updated;
end;
$$;

-- 8. RPC: commit_import (batched execution with raw_before snapshot for rollback)
create or replace function public.commit_import(
  p_job uuid,
  p_batch int default 2000
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_job public.import_jobs%rowtype;
  v_ins int := 0;
  v_upd int := 0;
  v_left int := 0;
  v_mode text;
begin
  select * into v_job from public.import_jobs where id = p_job and owner_id = auth.uid() for update;
  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0002';
  end if;

  if v_job.status not in ('review', 'committing') then
    raise exception 'INVALID_TRANSITION' using errcode = 'P0001';
  end if;

  v_mode := coalesce(v_job.options->>'duplicate_strategy', 'skip');
  update public.import_jobs set status = 'committing' where id = p_job;

  -- A) Insert new leads batch
  with batch as (
    select *
      from public.import_rows
     where job_id = p_job
       and kind = 'lead'
       and decision = 'import'
       and committed_at is null
     order by row_no asc
     limit least(p_batch, 5000)
     for update skip locked
  ),
  ins as (
    insert into public.leads (
      owner_id,
      name,
      company,
      industry_id,
      industry_other,
      job_title,
      instagram_handle,
      whatsapp_e164,
      country_code,
      notes,
      has_content,
      appears_in_content,
      has_videographer,
      problems,
      stage,
      import_job_id
    )
    select
      auth.uid(),
      b.data->>'name',
      b.data->>'company',
      (b.data->>'industry_id')::smallint,
      b.data->>'industry_other',
      b.data->>'job_title',
      nullif(trim(b.data->>'instagram_handle'), ''),
      nullif(trim(b.data->>'whatsapp_e164'), ''),
      b.data->>'country_code',
      b.data->>'notes',
      (b.data->>'has_content')::boolean,
      (b.data->>'appears_in_content')::boolean,
      coalesce((b.data->>'has_videographer')::tri_state, 'unknown'::tri_state),
      b.data->>'problems',
      coalesce((b.data->>'stage')::lead_stage, 'new'::lead_stage),
      p_job
    from batch b
    on conflict do nothing
    returning id, instagram_handle, whatsapp_e164
  )
  update public.import_rows r
     set committed_at = now(),
         result_lead_id = (
           select i.id
             from ins i
            where (nullif(trim(r.data->>'instagram_handle'), '') is not null and i.instagram_handle = trim(r.data->>'instagram_handle'))
               or (nullif(trim(r.data->>'whatsapp_e164'), '') is not null and i.whatsapp_e164 = trim(r.data->>'whatsapp_e164'))
            limit 1
         )
    from batch b
   where r.job_id = b.job_id and r.row_no = b.row_no;

  get diagnostics v_ins = row_count;

  -- B) Update existing leads batch (for duplicate_db rows marked with 'update')
  with batch as (
    select *
      from public.import_rows
     where job_id = p_job
       and kind = 'lead'
       and decision = 'update'
       and match_lead_id is not null
       and committed_at is null
     order by row_no asc
     limit least(p_batch, 5000)
     for update skip locked
  ),
  before_snap as (
    update public.import_rows r
       set raw_before = to_jsonb(l) - 'search_text'
      from batch b
      join public.leads l on l.id = b.match_lead_id
     where r.job_id = b.job_id and r.row_no = b.row_no
     returning r.row_no
  )
  update public.leads l
     set company = case when v_mode = 'replace' then coalesce(b.data->>'company', l.company) else coalesce(l.company, b.data->>'company') end,
         job_title = case when v_mode = 'replace' then coalesce(b.data->>'job_title', l.job_title) else coalesce(l.job_title, b.data->>'job_title') end,
         industry_id = case when v_mode = 'replace' then coalesce((b.data->>'industry_id')::smallint, l.industry_id) else coalesce(l.industry_id, (b.data->>'industry_id')::smallint) end,
         country_code = case when v_mode = 'replace' then coalesce(b.data->>'country_code', l.country_code) else coalesce(l.country_code, b.data->>'country_code') end,
         whatsapp_e164 = coalesce(l.whatsapp_e164, nullif(trim(b.data->>'whatsapp_e164'), '')),
         instagram_handle = coalesce(l.instagram_handle, nullif(trim(b.data->>'instagram_handle'), '')),
         has_content = case when v_mode = 'replace' and (b.data->>'has_content') is not null then (b.data->>'has_content')::boolean else coalesce(l.has_content, (b.data->>'has_content')::boolean) end,
         appears_in_content = case when v_mode = 'replace' and (b.data->>'appears_in_content') is not null then (b.data->>'appears_in_content')::boolean else coalesce(l.appears_in_content, (b.data->>'appears_in_content')::boolean) end,
         has_videographer = case when v_mode = 'replace' and (b.data->>'has_videographer') is not null then (b.data->>'has_videographer')::tri_state else coalesce(l.has_videographer, (b.data->>'has_videographer')::tri_state) end,
         problems = case when v_mode = 'replace' then coalesce(b.data->>'problems', l.problems) else coalesce(l.problems, b.data->>'problems') end,
         notes = case
           when nullif(trim(b.data->>'notes'), '') is null then l.notes
           when l.notes is null or trim(l.notes) = '' then b.data->>'notes'
           else l.notes || E'\n— ' || (b.data->>'notes')
         end,
         updated_at = now()
    from batch b
   where l.id = b.match_lead_id and l.owner_id = auth.uid();

  get diagnostics v_upd = row_count;

  update public.import_rows
     set committed_at = now()
   where job_id = p_job and decision = 'update' and committed_at is null
     and raw_before is not null;

  -- Count remaining
  select count(*) into v_left
    from public.import_rows
   where job_id = p_job and decision in ('import', 'update') and committed_at is null;

  update public.import_jobs
     set committed_rows = committed_rows + v_ins + v_upd,
         status = case when v_left = 0 then 'done'::import_status else 'committing'::import_status end,
         finished_at = case when v_left = 0 then now() else null end
   where id = p_job;

  return jsonb_build_object(
    'inserted', v_ins,
    'updated', v_upd,
    'remaining', v_left
  );
end;
$$;

-- 9. RPC: rollback_import (within 7 days)
create or replace function public.rollback_import(p_job uuid)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_job public.import_jobs%rowtype;
  v_del int := 0;
  v_res int := 0;
begin
  select * into v_job from public.import_jobs where id = p_job and owner_id = auth.uid() for update;
  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0002';
  end if;

  if v_job.status <> 'done' or v_job.finished_at < (now() - interval '7 days') then
    raise exception 'INVALID_TRANSITION' using errcode = 'P0001';
  end if;

  -- Soft delete inserted leads
  update public.leads
     set deleted_at = now()
   where import_job_id = p_job and deleted_at is null and owner_id = auth.uid();

  get diagnostics v_del = row_count;

  -- Restore updated leads from raw_before
  update public.leads l
     set company = r.raw_before->>'company',
         job_title = r.raw_before->>'job_title',
         industry_id = (r.raw_before->>'industry_id')::smallint,
         country_code = r.raw_before->>'country_code',
         whatsapp_e164 = r.raw_before->>'whatsapp_e164',
         instagram_handle = r.raw_before->>'instagram_handle',
         notes = r.raw_before->>'notes',
         has_content = (r.raw_before->>'has_content')::boolean,
         appears_in_content = (r.raw_before->>'appears_in_content')::boolean,
         has_videographer = (r.raw_before->>'has_videographer')::tri_state,
         problems = r.raw_before->>'problems',
         updated_at = now()
    from public.import_rows r
   where r.job_id = p_job
     and r.raw_before is not null
     and l.id = r.match_lead_id
     and l.owner_id = auth.uid();

  get diagnostics v_res = row_count;

  update public.import_jobs
     set status = 'rolled_back'
   where id = p_job;

  return jsonb_build_object(
    'deleted', v_del,
    'restored', v_res
  );
end;
$$;


-- ====================================
-- 0009_backups.sql
-- ====================================
-- Migration 0009_backups.sql: Backups schema, push subscriptions, storage, and cron dispatch
-- Specifications: §3.5.1, §F11, §18.3, §18.7

-- 1. backups table
create table if not exists public.backups (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind          text not null check (kind in ('scheduled','manual','pre_restore','pre_import')),
  status        text not null default 'pending' check (status in ('pending','running','ready','failed')),
  format        text not null check (format in ('xlsx','csv_zip','json')),
  storage_path  text,
  size_bytes    bigint,
  row_counts    jsonb not null default '{}'::jsonb,
  checksum      text,
  downloaded_at timestamptz,
  last_notified_at timestamptz,
  error         text,
  created_at    timestamptz not null default now()
);

alter table public.backups enable row level security;

create policy "own backups read" on public.backups
  for select to authenticated using (owner_id = auth.uid());

create policy "own backups insert" on public.backups
  for insert to authenticated with check (owner_id = auth.uid());

create policy "own backups update" on public.backups
  for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "own backups delete" on public.backups
  for delete to authenticated using (owner_id = auth.uid());

create index if not exists backups_owner_idx on public.backups (owner_id, created_at desc);

-- 2. push_subscriptions table
create table if not exists public.push_subscriptions (
  id         bigint generated always as identity primary key,
  owner_id   uuid not null default auth.uid() references auth.users(id) on delete cascade,
  endpoint   text not null unique,
  keys       jsonb not null,
  user_agent text,
  created_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

create policy "own push_subscriptions read" on public.push_subscriptions
  for select to authenticated using (owner_id = auth.uid());

create policy "own push_subscriptions insert" on public.push_subscriptions
  for insert to authenticated with check (owner_id = auth.uid());

create policy "own push_subscriptions delete" on public.push_subscriptions
  for delete to authenticated using (owner_id = auth.uid());

-- 3. Storage bucket and policies
insert into storage.buckets (id, name, public, file_size_limit)
values ('backups', 'backups', false, 104857600)
on conflict (id) do update set public = false, file_size_limit = 104857600;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'own backups read storage') then
    create policy "own backups read storage" on storage.objects
      for select to authenticated
      using (bucket_id = 'backups' and (storage.foldername(name))[1] = auth.uid()::text);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'own backups insert storage') then
    create policy "own backups insert storage" on storage.objects
      for insert to authenticated
      with check (bucket_id = 'backups' and (storage.foldername(name))[1] = auth.uid()::text);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'own backups delete storage') then
    create policy "own backups delete storage" on storage.objects
      for delete to authenticated
      using (bucket_id = 'backups' and (storage.foldername(name))[1] = auth.uid()::text);
  end if;
end $$;

-- 4. compute_next_backup function
create or replace function public.compute_next_backup(
  p_freq text,
  p_weekday int,
  p_month_day int,
  p_hour int,
  p_tz text,
  p_from timestamptz
)
returns timestamptz
language plpgsql
stable
set search_path = public
as $$
declare
  local_now timestamp;
  cand timestamp;
begin
  if p_freq = 'off' or p_freq is null then
    return null;
  end if;

  local_now := p_from at time zone coalesce(p_tz, 'UTC');
  cand := date_trunc('day', local_now) + make_interval(hours => coalesce(p_hour, 9));

  case p_freq
    when 'daily' then
      if cand <= local_now then
        cand := cand + interval '1 day';
      end if;
    when 'weekly', 'biweekly' then
      cand := cand + make_interval(days => ((coalesce(p_weekday, 5) - extract(dow from cand)::int + 7) % 7));
      if cand <= local_now then
        cand := cand + interval '7 days';
      end if;
    when 'monthly' then
      cand := date_trunc('month', local_now) + make_interval(days => coalesce(p_month_day, 1) - 1, hours => coalesce(p_hour, 9));
      if cand <= local_now then
        cand := cand + interval '1 month';
      end if;
    else
      return null;
  end case;

  return cand at time zone coalesce(p_tz, 'UTC');
end;
$$;

-- 5. Trigger to update next_run_at in backup_settings
create or replace function public.backup_settings_set_next()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tz text := 'UTC';
begin
  select timezone into v_tz from public.settings where owner_id = new.owner_id;
  new.next_run_at := public.compute_next_backup(
    new.frequency,
    new.weekday,
    new.month_day,
    new.hour_local,
    coalesce(v_tz, 'UTC'),
    now()
  );
  return new;
end;
$$;

drop trigger if exists backup_settings_next on public.backup_settings;
create trigger backup_settings_next
  before insert or update of frequency, weekday, month_day, hour_local
  on public.backup_settings
  for each row execute function public.backup_settings_set_next();

-- 6. RPC: mark_backup_downloaded
create or replace function public.mark_backup_downloaded(p_id uuid)
returns void
language sql
security invoker
set search_path = public
as $$
  update public.backups
     set downloaded_at = coalesce(downloaded_at, now())
   where id = p_id and owner_id = auth.uid();
$$;


-- ====================================
-- 0010_restore.sql
-- ====================================
-- Migration 0010_restore.sql: Restore commit RPC (merge / replace)
-- Specifications: §F11.4, §18.3, Task 4.18

create or replace function public.restore_commit(
  p_job uuid,
  p_mode text default 'merge' -- 'merge' | 'replace'
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_job public.import_jobs%rowtype;
  v_leads_restored int := 0;
  v_events_restored int := 0;
  v_industries_restored int := 0;
  v_current_deleted int := 0;
begin
  select * into v_job from public.import_jobs where id = p_job and owner_id = auth.uid() for update;
  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0002';
  end if;

  if p_mode not in ('merge', 'replace') then
    raise exception 'INVALID_MODE' using errcode = 'P0001';
  end if;

  -- 1. If replace mode: soft-delete all existing active leads first
  if p_mode = 'replace' then
    update public.leads
       set deleted_at = now()
     where owner_id = auth.uid() and deleted_at is null;
    get diagnostics v_current_deleted = row_count;
  end if;

  -- 2. Restore industries (if any in staging)
  insert into public.industries (owner_id, key, label_ar, label_en, sort_order, is_other, is_active)
  select auth.uid(),
         data->>'key',
         data->>'label_ar',
         data->>'label_en',
         coalesce((data->>'sort_order')::smallint, 0),
         coalesce((data->>'is_other')::boolean, false),
         coalesce((data->>'is_active')::boolean, true)
    from public.import_rows
   where job_id = p_job and kind = 'industry'
  on conflict (owner_id, key) do update set
    label_ar = excluded.label_ar,
    label_en = excluded.label_en;

  get diagnostics v_industries_restored = row_count;

  -- 3. Restore leads
  insert into public.leads (
    id,
    owner_id,
    name,
    company,
    industry_id,
    industry_other,
    job_title,
    instagram_handle,
    whatsapp_e164,
    country_code,
    notes,
    has_content,
    appears_in_content,
    has_videographer,
    problems,
    stage,
    stage_changed_at,
    first_message_at,
    last_contacted_at,
    follow_ups_sent,
    next_follow_up_on,
    reminder_note,
    replied_at,
    meeting_booked_at,
    meeting_at,
    proposal_sent_at,
    won_at,
    lost_at,
    lost_reason,
    created_at,
    updated_at
  )
  select
    coalesce((data->>'id')::uuid, gen_random_uuid()),
    auth.uid(),
    data->>'name',
    data->>'company',
    (data->>'industry_id')::smallint,
    data->>'industry_other',
    data->>'job_title',
    nullif(trim(data->>'instagram_handle'), ''),
    nullif(trim(data->>'whatsapp_e164'), ''),
    data->>'country_code',
    data->>'notes',
    (data->>'has_content')::boolean,
    (data->>'appears_in_content')::boolean,
    coalesce((data->>'has_videographer')::tri_state, 'unknown'::tri_state),
    data->>'problems',
    coalesce((data->>'stage')::lead_stage, 'new'::lead_stage),
    coalesce((data->>'stage_changed_at')::timestamptz, now()),
    (data->>'first_message_at')::timestamptz,
    (data->>'last_contacted_at')::timestamptz,
    coalesce((data->>'follow_ups_sent')::smallint, 0),
    (data->>'next_follow_up_on')::date,
    data->>'reminder_note',
    (data->>'replied_at')::timestamptz,
    (data->>'meeting_booked_at')::timestamptz,
    (data->>'meeting_at')::timestamptz,
    (data->>'proposal_sent_at')::timestamptz,
    (data->>'won_at')::timestamptz,
    (data->>'lost_at')::timestamptz,
    (data->>'lost_reason')::lost_reason,
    coalesce((data->>'created_at')::timestamptz, now()),
    coalesce((data->>'updated_at')::timestamptz, now())
  from public.import_rows
  where job_id = p_job and kind = 'lead'
  on conflict (id) do update set
    name = excluded.name,
    company = excluded.company,
    instagram_handle = excluded.instagram_handle,
    whatsapp_e164 = excluded.whatsapp_e164,
    stage = excluded.stage,
    notes = excluded.notes,
    deleted_at = null;

  get diagnostics v_leads_restored = row_count;

  -- 4. Restore lead events
  insert into public.lead_events (
    owner_id,
    lead_id,
    type,
    from_stage,
    to_stage,
    prev_state,
    meta,
    occurred_at,
    undone_at
  )
  select
    auth.uid(),
    (data->>'lead_id')::uuid,
    (data->>'type')::lead_event_type,
    (data->>'from_stage')::lead_stage,
    (data->>'to_stage')::lead_stage,
    coalesce((data->'prev_state'), '{}'::jsonb),
    coalesce((data->'meta'), '{}'::jsonb),
    coalesce((data->>'occurred_at')::timestamptz, now()),
    (data->>'undone_at')::timestamptz
  from public.import_rows
  where job_id = p_job and kind = 'event'
  on conflict do nothing;

  get diagnostics v_events_restored = row_count;

  update public.import_jobs
     set status = 'done',
         finished_at = now()
   where id = p_job;

  return jsonb_build_object(
    'leads_restored', v_leads_restored,
    'events_restored', v_events_restored,
    'industries_restored', v_industries_restored,
    'current_deleted', v_current_deleted
  );
end;
$$;


-- ====================================
-- 0011_dashboard.sql
-- ====================================
-- Scope Mini CRM: Dashboard Statistics RPC (§F6, Task 5.1)
-- Computes KPIs, stage breakdown, and period-over-period comparison in a single optimized query.

create or replace function public.dashboard_stats(p_from timestamptz, p_to timestamptz)
returns jsonb language sql stable security definer set search_path = public as $$
  with prev as (select p_from - (p_to - p_from) as f, p_from as t),
  ev as (
    select type, lead_id, occurred_at >= p_from as is_cur
      from public.lead_events, prev
     where owner_id = auth.uid()
       and undone_at is null
       and occurred_at >= prev.f
       and occurred_at < p_to
       and type in ('message_sent', 'follow_up_sent', 'reply_received', 'meeting_booked', 'won')
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
      from public.leads, prev
     where owner_id = auth.uid()
       and deleted_at is null
       and created_at >= prev.f
       and created_at < p_to
  ),
  pipeline as (
    select jsonb_object_agg(stage, c) as by_stage, coalesce(sum(c), 0)::int as total
      from (
        select stage, count(*) as c
          from public.leads
         where owner_id = auth.uid()
           and deleted_at is null
         group by stage
      ) x
  )
  select jsonb_build_object(
    'total_leads',   coalesce((select total from pipeline), 0),
    'pipeline',      coalesce((select by_stage from pipeline), '{}'::jsonb),
    'new_leads',     jsonb_build_object(
                       'cur', coalesce((select cur from leads_new), 0),
                       'prev', coalesce((select prev from leads_new), 0)
                     ),
    'not_contacted', coalesce(((select by_stage from pipeline)->>'new')::int, 0),
    'cur',  coalesce(
              (select to_jsonb(a) - 'is_cur' from agg a where is_cur),
              jsonb_build_object('first_messages', 0, 'follow_ups', 0, 'replied', 0, 'meetings', 0, 'won', 0)
            ),
    'prev', coalesce(
              (select to_jsonb(a) - 'is_cur' from agg a where not is_cur),
              jsonb_build_object('first_messages', 0, 'follow_ups', 0, 'replied', 0, 'meetings', 0, 'won', 0)
            )
  );
$$;

revoke all on function public.dashboard_stats(timestamptz, timestamptz) from public;
grant execute on function public.dashboard_stats(timestamptz, timestamptz) to authenticated;


-- ====================================
-- 0012_maintenance.sql
-- ====================================
-- Scope Mini CRM: Automated Maintenance & Purging (§18.3, Task 6.6)
-- Purges soft-deleted leads older than 30 days, old import staging rows older than 30 days,
-- and failed backup logs older than 30 days.

create or replace function public.perform_maintenance()
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_purged_leads int := 0;
  v_purged_rows int := 0;
  v_purged_backups int := 0;
begin
  -- 1. Purge trash older than 30 days
  delete from public.leads
   where deleted_at is not null
     and deleted_at < now() - interval '30 days';
  get diagnostics v_purged_leads = row_count;

  -- 2. Purge staging rows older than 30 days
  delete from public.import_rows r
   using public.import_jobs j
   where r.job_id = j.id
     and j.created_at < now() - interval '30 days';
  get diagnostics v_purged_rows = row_count;

  -- 3. Purge failed backup records older than 30 days
  delete from public.backups
   where status = 'failed'
     and created_at < now() - interval '30 days';
  get diagnostics v_purged_backups = row_count;

  return jsonb_build_object(
    'purged_leads', v_purged_leads,
    'purged_staging_rows', v_purged_rows,
    'purged_failed_backups', v_purged_backups,
    'executed_at', now()
  );
end;
$$;

revoke all on function public.perform_maintenance() from public;
grant execute on function public.perform_maintenance() to service_role;

-- Conditionally register pg_cron jobs if pg_cron extension is installed
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    -- Purge trash daily at 02:30
    perform cron.schedule(
      'purge-trash',
      '30 2 * * *',
      'delete from public.leads where deleted_at < now() - interval ''30 days'';'
    );

    -- Purge staging daily at 02:45
    perform cron.schedule(
      'purge-staging',
      '45 2 * * *',
      'delete from public.import_rows r using public.import_jobs j where r.job_id = j.id and j.created_at < now() - interval ''30 days'';'
    );

    -- Purge failed backups weekly on Sunday at 03:00
    perform cron.schedule(
      'purge-backups-orphans',
      '0 3 * * 0',
      'delete from public.backups where status = ''failed'' and created_at < now() - interval ''30 days'';'
    );
  end if;
exception
  when others then
    null;
end;
$$;


-- ====================================
-- seed.sql
-- ====================================
-- Scope Mini CRM: Default Seed User & Credentials
-- Email: admin@scopecrm.com
-- Password: Admin@123456

do $$
declare
  v_user_id uuid := '00000000-0000-0000-0000-000000000001';
  v_encrypted_pw text;
begin
  -- Generate bcrypt hash for Admin@123456
  v_encrypted_pw := extensions.crypt('Admin@123456', extensions.gen_salt('bf'));

  -- Insert default user if not exists
  if not exists (select 1 from auth.users where id = v_user_id or email = 'admin@scopecrm.com') then
    insert into auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) values (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'admin@scopecrm.com',
      v_encrypted_pw,
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"name":"مدير النظام"}',
      now(),
      now(),
      '',
      '',
      '',
      ''
    );

    -- Ensure identity record exists for email login
    insert into auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) values (
      v_user_id,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'admin@scopecrm.com'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  end if;
end;
$$;
