'use client';

import * as React from 'react';
import { useMediaQuery } from '@/hooks/use-media-query';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

interface ResponsiveDialogContextValue {
  isDesktop: boolean;
}

const ResponsiveDialogContext = React.createContext<ResponsiveDialogContextValue>({
  isDesktop: true,
});

export function ResponsiveDialog({
  children,
  open,
  onOpenChange,
  ...props
}: React.ComponentProps<typeof Dialog>) {
  const isDesktop = useMediaQuery('(min-width: 768px)');

  if (isDesktop) {
    return (
      <ResponsiveDialogContext.Provider value={{ isDesktop: true }}>
        <Dialog open={open} onOpenChange={onOpenChange} {...props}>
          {children}
        </Dialog>
      </ResponsiveDialogContext.Provider>
    );
  }

  return (
    <ResponsiveDialogContext.Provider value={{ isDesktop: false }}>
      <Sheet open={open} onOpenChange={onOpenChange} {...props}>
        {children}
      </Sheet>
    </ResponsiveDialogContext.Provider>
  );
}

export function ResponsiveDialogTrigger({
  children,
  ...props
}: React.ComponentProps<typeof DialogTrigger>) {
  const { isDesktop } = React.useContext(ResponsiveDialogContext);
  if (isDesktop) {
    return <DialogTrigger {...props}>{children}</DialogTrigger>;
  }
  return <SheetTrigger {...props}>{children}</SheetTrigger>;
}

export function ResponsiveDialogClose({
  children,
  ...props
}: React.ComponentProps<typeof DialogClose>) {
  const { isDesktop } = React.useContext(ResponsiveDialogContext);
  if (isDesktop) {
    return <DialogClose {...props}>{children}</DialogClose>;
  }
  return <SheetClose {...props}>{children}</SheetClose>;
}

export function ResponsiveDialogContent({
  children,
  className,
  ...props
}: React.ComponentProps<typeof DialogContent>) {
  const { isDesktop } = React.useContext(ResponsiveDialogContext);

  if (isDesktop) {
    return (
      <DialogContent className={className} {...props}>
        {children}
      </DialogContent>
    );
  }

  return (
    <SheetContent side="bottom" className={className} {...props}>
      {children}
    </SheetContent>
  );
}

export function ResponsiveDialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { isDesktop } = React.useContext(ResponsiveDialogContext);
  if (isDesktop) {
    return <DialogHeader className={className} {...props} />;
  }
  return <SheetHeader className={className} {...props} />;
}

export function ResponsiveDialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { isDesktop } = React.useContext(ResponsiveDialogContext);
  if (isDesktop) {
    return <DialogFooter className={className} {...props} />;
  }
  return <SheetFooter className={className} {...props} />;
}

export function ResponsiveDialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogTitle>) {
  const { isDesktop } = React.useContext(ResponsiveDialogContext);
  if (isDesktop) {
    return <DialogTitle className={className} {...props} />;
  }
  return <SheetTitle className={className} {...props} />;
}

export function ResponsiveDialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogDescription>) {
  const { isDesktop } = React.useContext(ResponsiveDialogContext);
  if (isDesktop) {
    return <DialogDescription className={className} {...props} />;
  }
  return <SheetDescription className={className} {...props} />;
}
