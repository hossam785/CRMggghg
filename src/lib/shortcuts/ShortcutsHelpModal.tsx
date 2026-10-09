'use client';

import * as React from 'react';
import { Keyboard, X } from 'lucide-react';
import { useShortcuts } from './ShortcutsContext';

export function ShortcutsHelpModal() {
  const { isHelpOpen, setIsHelpOpen, groups } = useShortcuts();

  if (!isHelpOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in-0 zoom-in-95 text-start">
        {/* Header */}
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Keyboard className="size-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-foreground">
                اختصارات لوحة المفاتيح (Keyboard Shortcuts)
              </h2>
              <p className="text-[11px] text-muted-foreground">
                تحكم كامل وسريع في النظام دون الحاجة لتحريك الفأرة
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsHelpOpen(false)}
            className="p-1 rounded-lg text-muted-foreground hover:bg-muted"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {groups.map((group) => (
            <div key={group.category} className="space-y-2.5">
              <h3 className="text-xs font-bold text-muted-foreground">
                {group.titleAr}
              </h3>

              <div className="rounded-2xl border border-border divide-y divide-border bg-background/50 overflow-hidden">
                {group.items.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 flex items-center justify-between text-xs hover:bg-accent/20 transition-colors"
                  >
                    <span className="font-semibold text-foreground">
                      {item.labelAr}
                    </span>

                    <div className="flex items-center gap-1.5" dir="ltr">
                      {item.keys.map((k, idx) => (
                        <React.Fragment key={idx}>
                          <kbd className="px-2 py-1 rounded-lg border border-border bg-muted/80 text-[11px] font-mono font-bold text-foreground shadow-xs">
                            {k}
                          </kbd>
                          {idx < item.keys.length - 1 && (
                            <span className="text-muted-foreground/60 text-[10px] font-bold">
                              ثم
                            </span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>اضغط <kbd className="px-1.5 py-0.5 rounded border border-border bg-muted font-mono font-bold text-foreground">?</kbd> في أي وقت لإظهار أو إخفاء هذه النافذة</span>
          <button
            type="button"
            onClick={() => setIsHelpOpen(false)}
            className="px-3 py-1 font-bold text-primary hover:underline"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
