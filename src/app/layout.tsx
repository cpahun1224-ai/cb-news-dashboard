// ============================================================
// 루트 레이아웃
// ============================================================
import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';

export const metadata: Metadata = {
  title: 'CB Daily Brief | 기업신용평가·AI금융 트렌드',
  description: 'CB 본부장용 기업신용평가, 기업여신, AI금융 트렌드 뉴스레터 대시보드',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
        <footer className="mt-12 border-t bg-white">
          <div className="max-w-7xl mx-auto px-4 py-4 text-center text-xs text-gray-400">
            CB 본부 내부용 · 자동 생성된 뉴스 대시보드
          </div>
        </footer>
      </body>
    </html>
  );
}
