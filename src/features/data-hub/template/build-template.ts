import ExcelJS from 'exceljs';
import type { Industry } from '@/features/settings/api';
import type { Country } from '@/features/leads/api';

export interface BuildTemplateOptions {
  industries: Industry[];
  countries: Country[];
  locale?: 'ar' | 'en';
}

/**
 * Generates an Excel template (.xlsx) with bilingual headers, live dropdown data validation,
 * clear instructions, and a hidden lists reference sheet.
 */
export async function buildTemplateWorkbook({
  industries,
  countries,
  locale = 'ar',
}: BuildTemplateOptions): Promise<ArrayBuffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Scope CRM';
  workbook.created = new Date();

  const isRtl = locale === 'ar';

  // -------------------------------------------------------------
  // Sheet 3: Lists (Hidden reference sheet for Dropdowns)
  // -------------------------------------------------------------
  const listsSheet = workbook.addWorksheet('Lists', {
    state: 'hidden',
  });

  // Populate Lists:
  // Col A: Industries (label_ar - label_en)
  const industryList = industries.filter((i) => i.is_active);
  const indValues = industryList.map((i) => `${i.label_ar} (${i.label_en})`);

  // Col B: Countries
  const countryValues = countries.map((c) => `${c.name_ar} (${c.name_en})`);

  // Col C: Stages
  const stageValues = [
    'new',
    'contacted',
    'follow_up_1',
    'follow_up_2',
    'follow_up_3',
    'replied',
    'meeting_booked',
    'proposal_sent',
    'won',
    'lost',
  ];

  // Col D: Yes/No
  const booleanValues = ['Yes / نعم', 'No / لا'];

  // Col E: Yes/No/Unknown
  const triStateValues = ['Yes / نعم', 'No / لا', 'Unknown / غير محدد'];

  const maxRows = Math.max(
    indValues.length,
    countryValues.length,
    stageValues.length,
    booleanValues.length,
    triStateValues.length
  );

  listsSheet.addRow([
    'Industries',
    'Countries',
    'Stages',
    'Booleans',
    'TriState',
  ]);

  for (let r = 0; r < maxRows; r++) {
    listsSheet.addRow([
      indValues[r] || '',
      countryValues[r] || '',
      stageValues[r] || '',
      booleanValues[r] || '',
      triStateValues[r] || '',
    ]);
  }

  // -------------------------------------------------------------
  // Sheet 1: Leads (Main import worksheet)
  // -------------------------------------------------------------
  const leadsSheet = workbook.addWorksheet(
    locale === 'ar' ? 'العملاء' : 'Leads',
    {
      views: [{ state: 'frozen', ySplit: 2, rightToLeft: isRtl }],
    }
  );

  leadsSheet.columns = [
    { header: 'الاسم / Name ★', key: 'name', width: 24 },
    { header: 'الشركة / Company', key: 'company', width: 22 },
    { header: 'المسمى الوظيفي / Job Title', key: 'job_title', width: 22 },
    { header: 'إنستجرام / Instagram ★', key: 'instagram', width: 24 },
    { header: 'واتساب / WhatsApp ★', key: 'whatsapp', width: 22 },
    { header: 'الدولة / Country', key: 'country', width: 20 },
    { header: 'النشاط / Industry', key: 'industry', width: 24 },
    { header: 'المرحلة / Stage', key: 'stage', width: 18 },
    { header: 'لديه محتوى / Has Content', key: 'has_content', width: 20 },
    { header: 'يظهر في المحتوى / Appears', key: 'appears', width: 22 },
    { header: 'لديه مصور / Videographer', key: 'videographer', width: 22 },
    { header: 'ملاحظات / Notes', key: 'notes', width: 30 },
    { header: 'المشاكل والتحديات / Problems', key: 'problems', width: 30 },
    { header: '_helper', key: 'helper', width: 10, hidden: true },
  ];

  // Format Header Row (Row 1)
  const headerRow = leadsSheet.getRow(1);
  headerRow.height = 28;
  headerRow.eachCell((cell, colNumber) => {
    const isRequired = [1, 4, 5].includes(colNumber); // Name, IG, WA
    cell.font = {
      name: isRtl ? 'Arial' : 'Calibri',
      size: 11,
      bold: true,
      color: { argb: 'FFFFFFFF' },
    };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: isRequired ? 'FF1E3A8A' : 'FF334155' }, // Darker blue for required, slate for optional
    };
    cell.alignment = {
      vertical: 'middle',
      horizontal: isRtl ? 'right' : 'left',
    };
  });

  // Add Example Row (Row 2) - skipped automatically during import via `#example` in hidden helper column
  const exampleRow = leadsSheet.addRow({
    name: 'اسم العميل / Client Name',
    company: 'اسم الشركة / Company Name',
    job_title: 'المدير العام / General Manager',
    instagram: '@example_handle',
    whatsapp: '+201000000000',
    country: countryValues[0] || 'Egypt',
    industry: indValues[0] || 'General',
    stage: 'new',
    has_content: 'Yes / نعم',
    appears: 'Yes / نعم',
    videographer: 'Yes / نعم',
    notes: 'ملاحظة توضيحية / Sample Note',
    problems: 'تحديات تسويقية / Marketing Challenges',
    helper: '#example',
  });

  exampleRow.height = 22;
  exampleRow.eachCell((cell) => {
    cell.font = {
      name: isRtl ? 'Arial' : 'Calibri',
      size: 10,
      italic: true,
      color: { argb: 'FF64748B' },
    };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF1F5F9' }, // Light slate grey
    };
    cell.alignment = {
      vertical: 'middle',
      horizontal: isRtl ? 'right' : 'left',
    };
  });

  // Apply Data Validation Dropdowns for 5,000 rows (Rows 2 to 5002)
  const indRange = `Lists!$A$2:$A$${Math.max(2, indValues.length + 1)}`;
  const countryRange = `Lists!$B$2:$B$${Math.max(2, countryValues.length + 1)}`;
  const stageRange = `Lists!$C$2:$C$11`;
  const boolRange = `Lists!$D$2:$D$3`;
  const triRange = `Lists!$E$2:$E$4`;

  for (let r = 2; r <= 5002; r++) {
    // Country dropdown (Col 6)
    leadsSheet.getCell(r, 6).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [`'${countryRange}'`],
    };

    // Industry dropdown (Col 7)
    leadsSheet.getCell(r, 7).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [`'${indRange}'`],
    };

    // Stage dropdown (Col 8)
    leadsSheet.getCell(r, 8).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [`'${stageRange}'`],
    };

    // Has Content (Col 9)
    leadsSheet.getCell(r, 9).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [`'${boolRange}'`],
    };

    // Appears in Content (Col 10)
    leadsSheet.getCell(r, 10).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [`'${boolRange}'`],
    };

    // Has Videographer (Col 11)
    leadsSheet.getCell(r, 11).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [`'${triRange}'`],
    };
  }

  // AutoFilter on header
  leadsSheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: 13 },
  };

  // -------------------------------------------------------------
  // Sheet 2: Instructions (تعليمات الاستيراد)
  // -------------------------------------------------------------
  const instSheet = workbook.addWorksheet(
    locale === 'ar' ? 'التعليمات' : 'Instructions',
    {
      views: [{ rightToLeft: isRtl }],
    }
  );

  instSheet.columns = [
    { header: 'العمود / Column', key: 'col', width: 26 },
    { header: 'الحالة / Requirement', key: 'req', width: 18 },
    { header: 'الصيغة المقبولة / Accepted Format', key: 'fmt', width: 32 },
    { header: 'ملاحظات وتوضيحات / Notes', key: 'desc', width: 50 },
  ];

  const instHeader = instSheet.getRow(1);
  instHeader.height = 26;
  instHeader.eachCell((cell) => {
    cell.font = { name: isRtl ? 'Arial' : 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
    cell.alignment = { vertical: 'middle', horizontal: isRtl ? 'right' : 'left' };
  });

  const instructions = [
    {
      col: 'الاسم (Name)',
      req: 'إجباري ★',
      fmt: 'نص (1 - 120 حرفاً)',
      desc: 'اسم الشخص أو صاحب النشاط أو اسم العلامة التجارية.',
    },
    {
      col: 'إنستجرام (Instagram)',
      req: 'إجباري (أو واتساب) ★',
      fmt: '@handle أو رابط بروفايل',
      desc: 'حساب إنستجرام مثل: @username أو instagram.com/username.',
    },
    {
      col: 'واتساب (WhatsApp)',
      req: 'إجباري (أو إنستجرام) ★',
      fmt: 'رقم هاتف دولي أو محلي',
      desc: 'الرقم بالصيغة الدولية مثل: +201012345678 أو محلي مع اختيار الدولة.',
    },
    {
      col: 'الشركة (Company)',
      req: 'اختياري',
      fmt: 'نص',
      desc: 'اسم الشركة، العيادة، أو البراند.',
    },
    {
      col: 'المسمى الوظيفي (Job Title)',
      req: 'اختياري',
      fmt: 'نص',
      desc: 'مثل: مؤسس، طبيب، مدير تسويق.',
    },
    {
      col: 'الدولة (Country)',
      req: 'اختياري',
      fmt: 'قائمة منسدلة أو كود (EG, SA...)',
      desc: 'الدولة التابع لها العميل لتحديد كود الاتصال تلقائياً.',
    },
    {
      col: 'النشاط (Industry)',
      req: 'اختياري',
      fmt: 'قائمة منسدلة من أنشطتك',
      desc: 'اختر من القائمة المنسدلة للأنشطة المسجلة في نظامك.',
    },
    {
      col: 'المرحلة (Stage)',
      req: 'اختياري (الافتراضي: new)',
      fmt: 'new, contacted, won...',
      desc: 'مرحلة العميل الحالية في مسار المبيعات.',
    },
    {
      col: 'لديه محتوى / يظهر / مصور',
      req: 'اختياري',
      fmt: 'Yes / No / Unknown',
      desc: 'بيانات تأهيل العميل في صناعة المحتوى.',
    },
  ];

  for (const item of instructions) {
    const r = instSheet.addRow(item);
    r.height = 24;
    r.eachCell((cell) => {
      cell.font = { name: isRtl ? 'Arial' : 'Calibri', size: 10 };
      cell.alignment = { vertical: 'middle', horizontal: isRtl ? 'right' : 'left' };
    });
  }

  const buffer = (await workbook.xlsx.writeBuffer()) as ArrayBuffer;
  return buffer;
}
