'use client';

import { Button } from '@/components/ui/button';
import { Moon } from 'lucide-react';
import { toast } from 'sonner';

export function ThemeToggle() {
  const handleClick = () => {
    toast.info('الوضع الداكن مفعّل افتراضياً لكامل المنظومة');
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      aria-label="الوضع الداكن مفعّل"
      title="الوضع الداكن مفعّل (الافتراضي الثابت)"
      className="size-8 text-primary hover:bg-primary/10 transition-colors"
    >
      <Moon className="size-4 stroke-[2]" />
    </Button>
  );
}

