import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MailPilot Agent',
  description: 'Autonomous email assistant for drafting and replying to messages.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-50 min-h-screen">
        {children}
      </body>
    </html>
  );
}
