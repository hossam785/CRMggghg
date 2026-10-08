import * as React from 'react';

export default function LeadsLayout({
  children,
  panel,
}: {
  children: React.ReactNode;
  panel: React.ReactNode;
}) {
  return (
    <div className="relative w-full">
      {children}
      {panel}
    </div>
  );
}
