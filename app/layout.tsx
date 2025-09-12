import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

// Initialize the Inter font from Google Fonts. This is a robust way to handle
// fonts in Next.js and avoids issues with local file paths in build environments.
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
  // Switched from the local Geist font to Google Fonts (Inter) to resolve build errors.
  // This approach is more compatible with standard deployment platforms.
  // Also, temporarily removed Vercel Analytics as it was contributing to the build failure.
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
