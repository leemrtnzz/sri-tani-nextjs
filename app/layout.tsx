import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import SessionProviderWrapper from '@/components/SessionProviderWrapper';

const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

export const metadata: Metadata = {
  title: 'SRI TANI - Dashboard Pertanian & Ternak',
  description: 'Ringkasan aktivitas pertanian padi dan penjualan ke toko',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className={`${inter.className} bg-[#f4f6f8] text-slate-800 antialiased overflow-x-hidden`}>
        <SessionProviderWrapper>{children}</SessionProviderWrapper>
      </body>
    </html>
  );
}
