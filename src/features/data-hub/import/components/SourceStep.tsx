'use client';

import * as React from 'react';
import { UploadCloud, Link as LinkIcon, Clipboard, FileSpreadsheet, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { ImportWorkerApi, SheetData, SheetSummary } from '../types';

interface SourceStepProps {
  workerApi: ImportWorkerApi | null;
  onFileReady: (data: {
    fileOrBuffer: File | ArrayBuffer;
    fileName: string;
    sheetName: string;
    sheetData: SheetData;
    availableSheets: SheetSummary[];
  }) => void;
}

export function SourceStep({ workerApi, onFileReady }: SourceStepProps) {
  const [tab, setTab] = React.useState<'file' | 'google' | 'paste'>('file');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // File state
  const [dragActive, setDragActive] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Google sheet state
  const [googleUrl, setGoogleUrl] = React.useState('');

  // Paste state
  const [pastedText, setPastedText] = React.useState('');

  // Loaded sheets state
  const [loadedBuffer, setLoadedBuffer] = React.useState<{ buffer: ArrayBuffer; name: string } | null>(null);
  const [sheets, setSheets] = React.useState<SheetSummary[]>([]);
  const [selectedSheet, setSelectedSheet] = React.useState<string>('');
  const [headerRow, setHeaderRow] = React.useState<number>(1);
  const [sheetPreview, setSheetPreview] = React.useState<SheetData | null>(null);

  const processLoadedBuffer = async (buffer: ArrayBuffer, fileName: string) => {
    if (!workerApi) return;
    setIsLoading(true);
    setError(null);
    try {
      const { sheets: sheetSummaries } = await workerApi.readFile(buffer, { fileName });
      if (sheetSummaries.length === 0) {
        throw new Error('الملف فارغ أو لا يحتوي على صفحات بيانات');
      }

      setLoadedBuffer({ buffer, name: fileName });
      setSheets(sheetSummaries);
      const firstSheet = sheetSummaries[0]?.name || '';
      setSelectedSheet(firstSheet);

      const data = await workerApi.loadSheet(firstSheet);
      setHeaderRow(data.detectedHeaderRow);
      setSheetPreview(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg === 'IMPORT_TOO_LARGE') {
        setError('الملف يتجاوز الحد الأقصى المسموح (50MB أو 200,000 صف)');
      } else {
        setError(msg || 'تعذر قراءة الملف');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const buffer = await file.arrayBuffer();
    await processLoadedBuffer(buffer, file.name);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const buffer = await file.arrayBuffer();
    await processLoadedBuffer(buffer, file.name);
  };

  const handleFetchGoogleSheet = async () => {
    if (!googleUrl) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/import/google-sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: googleUrl }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.message || 'فشل جلب ملف Google Sheet');
      }

      // Convert response to ArrayBuffer
      const blob = await (await fetch(URL.createObjectURL(new Blob([await (await fetch('/api/import/google-sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: googleUrl }),
      })).blob()])))).arrayBuffer();

      await processLoadedBuffer(blob, 'Google_Sheet.xlsx');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'فشل جلب ملف Google Sheet');
    } finally {
      setIsLoading(false);
    }
  };

  const handleParsePastedText = async () => {
    if (!pastedText.trim() || !workerApi) return;
    setIsLoading(true);
    setError(null);
    try {
      const encoder = new TextEncoder();
      const uint8 = encoder.encode(pastedText);
      await processLoadedBuffer(uint8.buffer as ArrayBuffer, 'Pasted_Data.tsv');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'تعذر قراءة البيانات الملصقة');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSheetChange = async (newSheet: string) => {
    if (!workerApi) return;
    setSelectedSheet(newSheet);
    setIsLoading(true);
    try {
      const data = await workerApi.loadSheet(newSheet);
      setHeaderRow(data.detectedHeaderRow);
      setSheetPreview(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'تعذر تحميل الصفحة');
    } finally {
      setIsLoading(false);
    }
  };

  const handleHeaderRowChange = async (newHeaderRow: number) => {
    if (!workerApi || !selectedSheet) return;
    setHeaderRow(newHeaderRow);
    try {
      const data = await workerApi.loadSheet(selectedSheet, { headerRow: newHeaderRow });
      setSheetPreview(data);
    } catch {
      // Ignore header change error
    }
  };

  const handleConfirm = () => {
    if (!loadedBuffer || !sheetPreview) return;
    onFileReady({
      fileOrBuffer: loadedBuffer.buffer,
      fileName: loadedBuffer.name,
      sheetName: selectedSheet,
      sheetData: sheetPreview,
      availableSheets: sheets,
    });
  };

  return (
    <div className="space-y-6">
      {/* Method Tabs */}
      <div className="flex border-b border-border gap-2">
        <button
          type="button"
          onClick={() => { setTab('file'); setError(null); }}
          className={`flex items-center gap-2 pb-3 px-4 text-sm font-semibold border-b-2 transition-colors ${
            tab === 'file'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <UploadCloud className="size-4" />
          <span>رفع ملف (Excel / CSV)</span>
        </button>

        <button
          type="button"
          onClick={() => { setTab('google'); setError(null); }}
          className={`flex items-center gap-2 pb-3 px-4 text-sm font-semibold border-b-2 transition-colors ${
            tab === 'google'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <LinkIcon className="size-4" />
          <span>رابط Google Sheet</span>
        </button>

        <button
          type="button"
          onClick={() => { setTab('paste'); setError(null); }}
          className={`flex items-center gap-2 pb-3 px-4 text-sm font-semibold border-b-2 transition-colors ${
            tab === 'paste'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Clipboard className="size-4" />
          <span>لصق بيانات من الحافظة</span>
        </button>
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-4 rounded-xl border border-destructive/20 bg-destructive/10 text-destructive flex items-start gap-3">
          <AlertCircle className="size-5 shrink-0 mt-0.5" />
          <div className="text-sm font-medium leading-relaxed">{error}</div>
        </div>
      )}

      {/* Tab 1: File Dropzone */}
      {tab === 'file' && !sheetPreview && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
            dragActive
              ? 'border-primary bg-primary/5 scale-[0.99]'
              : 'border-border/80 hover:border-primary/50 bg-card hover:bg-accent/30'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv,.ods,.tsv"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="size-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
            <UploadCloud className="size-7" />
          </div>
          <h3 className="text-base font-bold text-foreground">
            اسحب وأفلت ملف العملاء هنا، أو اضغط للاختيار
          </h3>
          <p className="text-xs text-muted-foreground mt-1.5 max-w-md mx-auto">
            يدعم ملفات Excel (.xlsx, .xls) و CSV و ODS و TSV حتى 50 ميجابايت أو 200,000 صف.
          </p>
        </div>
      )}

      {/* Tab 2: Google Sheet */}
      {tab === 'google' && !sheetPreview && (
        <div className="p-6 rounded-2xl border border-border bg-card space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground">
              رابط جدول بيانات Google (Google Sheets)
            </label>
            <div className="flex gap-2">
              <Input
                type="url"
                placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                value={googleUrl}
                onChange={(e) => setGoogleUrl(e.target.value)}
                dir="ltr"
                className="flex-1"
              />
              <Button
                type="button"
                onClick={handleFetchGoogleSheet}
                disabled={isLoading || !googleUrl}
              >
                {isLoading && <Loader2 className="size-4 animate-spin me-2" />}
                جلب الملف
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            * تأكد أن الملف مفتوح للمشاركة: اضغط على زر <strong>Share</strong> في Google Sheet واختر{' '}
            <strong>Anyone with the link: Viewer</strong>.
          </p>
        </div>
      )}

      {/* Tab 3: Paste text */}
      {tab === 'paste' && !sheetPreview && (
        <div className="p-6 rounded-2xl border border-border bg-card space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground">
              الصق الصفوف المنسوخة من Excel أو Google Sheets
            </label>
            <Textarea
              rows={6}
              placeholder="الصق الخلايا هنا مباشرة (مفصولة بـ Tab)..."
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              dir="auto"
            />
          </div>
          <Button
            type="button"
            onClick={handleParsePastedText}
            disabled={isLoading || !pastedText.trim()}
          >
            {isLoading && <Loader2 className="size-4 animate-spin me-2" />}
            قراءة البيانات الملصقة
          </Button>
        </div>
      )}

      {/* Loading state indicator */}
      {isLoading && (
        <div className="p-8 text-center space-y-3">
          <Loader2 className="size-8 animate-spin text-primary mx-auto" />
          <p className="text-xs text-muted-foreground font-medium">جارِ قراءة وفحص الملف في الخلفية…</p>
        </div>
      )}

      {/* Sheet Preview & Settings (if file loaded) */}
      {sheetPreview && loadedBuffer && (
        <div className="space-y-4 p-5 rounded-2xl border border-border bg-card">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <FileSpreadsheet className="size-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">{loadedBuffer.name}</h4>
                <p className="text-xs text-muted-foreground">
                  إجمالي الصفوف المكتشفة: {sheetPreview.totalRows.toLocaleString()} صف
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSheetPreview(null);
                setLoadedBuffer(null);
              }}
            >
              تغيير الملف
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Sheet Selector */}
            {sheets.length > 1 && (
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1.5">
                  اختر صفحة العمل (Sheet)
                </label>
                <select
                  value={selectedSheet}
                  onChange={(e) => handleSheetChange(e.target.value)}
                  className="w-full text-xs rounded-xl border border-border bg-background p-2.5 font-medium"
                >
                  {sheets.map((s) => (
                    <option key={s.name} value={s.name}>
                      {s.name} ({s.rows} صف)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Header row override */}
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1.5">
                رقم صف العناوين في الملف
              </label>
              <Input
                type="number"
                min={1}
                max={20}
                value={headerRow}
                onChange={(e) => handleHeaderRowChange(Number(e.target.value))}
                className="w-full text-xs"
              />
            </div>
          </div>

          {/* Mini preview table */}
          <div className="space-y-2 pt-2">
            <span className="text-xs font-semibold text-foreground block">
              معاينة الأعمدة والبيانات ({sheetPreview.headers.length} عمود):
            </span>
            <div className="overflow-x-auto rounded-xl border border-border max-h-56">
              <table className="w-full text-xs text-start">
                <thead className="bg-muted/60 border-b border-border sticky top-0">
                  <tr>
                    <th className="p-2 text-start font-bold text-muted-foreground border-e border-border w-12">#</th>
                    {sheetPreview.headers.map((h, i) => (
                      <th key={i} className="p-2 text-start font-bold text-foreground border-e border-border whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sheetPreview.sample.slice(0, 5).map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-accent/20">
                      <td className="p-2 font-mono text-muted-foreground border-e border-border">{rIdx + 1}</td>
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="p-2 border-e border-border whitespace-nowrap text-foreground/80 max-w-xs truncate">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* CTA Next */}
          <div className="pt-3 flex justify-end">
            <Button onClick={handleConfirm} className="px-6 font-bold">
              متابعة إلى ربط الأعمدة ←
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
