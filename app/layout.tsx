import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Autonur — практические занятия по вождению',
  description: 'Практические занятия с профессиональными инструкторами в Астане, Кокшетау и Караганде.',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <html lang="ru"><body className="min-h-screen antialiased">{children}</body></html>;
}
