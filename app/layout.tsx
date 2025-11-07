import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { LoadingProvider } from '@/contexts/loading-context';
import { GlobalPusherProvider } from '@/components/global-pusher-provider';
import { Toaster } from '@/components/ui/toaster';
import NextTopLoader from 'nextjs-toploader';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'BudgetBot: Your Financial Companion',
  description: 'Created with v0 and Supabase',
  generator: 'v0.app',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Global route change progress bar */}
        <NextTopLoader color="#0ea5e9" height={3} showSpinner={false} crawlSpeed={200} speed={200} />
        <LoadingProvider>
          <GlobalPusherProvider />
          {children}
          <Toaster />
        </LoadingProvider>
      </body>
    </html>
  );
}