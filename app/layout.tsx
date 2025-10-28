import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { LoadingProvider } from '@/contexts/loading-context'; // Import the provider

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
        <LoadingProvider> {/* Wrap children with the provider */}
          {children}
        </LoadingProvider>
      </body>
    </html>
  );
}