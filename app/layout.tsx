import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'RPG → Spring Boot Migration Studio',
  description: 'Agentic demo for RPG modernization to Spring Boot with DeepSeek and RAG evidence.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
