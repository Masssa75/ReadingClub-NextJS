import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ReadingClub - Learn Phonics with Your Voice',
  description: 'Interactive voice-based phonics training app',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
