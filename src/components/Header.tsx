'use client';
// ============================================================
// 헤더 컴포넌트 - 임원 보고용 금융 대시보드 스타일
// ============================================================
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { BarChart3, Settings, Mail, Menu, X, RefreshCw } from 'lucide-react';
import clsx from 'clsx';

export default function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collecting, setCollecting] = useState(false);
  const [collectMsg, setCollectMsg] = useState('');

  /** 뉴스 즉시 수집 버튼 */
  const handleCollect = async () => {
    setCollecting(true);
    setCollectMsg('수집 중...');
    try {
      const res = await fetch('/api/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manual: true }),
      });
      const data = await res.json();
      if (data.success) {
        setCollectMsg(`✅ ${data.collected}건 저장`);
        // 페이지 새로고침
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setCollectMsg(`❌ ${data.error || '오류'}`);
      }
    } catch {
      setCollectMsg('❌ 네트워크 오류');
    } finally {
      setCollecting(false);
      setTimeout(() => setCollectMsg(''), 3000);
    }
  };

  const navLinks = [
    { href: '/', label: '대시보드', icon: BarChart3 },
    { href: '/admin', label: '관리자', icon: Settings },
  ];

  return (
    <header className="bg-gradient-to-r from-navy-900 to-navy-700 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* 로고 */}
          <Link href="/" className="flex items-center space-x-3">
            <div className="bg-gold-400 text-navy-900 font-black text-lg w-9 h-9 rounded-lg flex items-center justify-center">
              CB
            </div>
            <div className="hidden sm:block">
              <div className="font-bold text-sm leading-tight">CB 본부 뉴스레터</div>
              <div className="text-navy-100 text-xs opacity-75">기업신용평가 · AI금융 트렌드</div>
            </div>
          </Link>

          {/* 데스크탑 네비게이션 */}
          <nav className="hidden md:flex items-center space-x-1">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={clsx(
                  'flex items-center space-x-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  pathname === href
                    ? 'bg-white/20 text-white'
                    : 'text-navy-100 hover:bg-white/10 hover:text-white'
                )}
              >
                <Icon size={15} />
                <span>{label}</span>
              </Link>
            ))}
          </nav>

          {/* 액션 버튼들 */}
          <div className="hidden md:flex items-center space-x-2">
            {/* 뉴스레터 미리보기 */}
            <a
              href="/api/newsletter/preview"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors"
            >
              <Mail size={14} />
              <span>미리보기</span>
            </a>

            {/* 즉시 수집 */}
            <button
              onClick={handleCollect}
              disabled={collecting}
              className={clsx(
                'flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                collecting
                  ? 'bg-white/5 text-white/50 cursor-not-allowed'
                  : 'bg-gold-400 text-navy-900 hover:bg-gold-500'
              )}
            >
              <RefreshCw size={14} className={collecting ? 'animate-spin' : ''} />
              <span>{collectMsg || '즉시 수집'}</span>
            </button>
          </div>

          {/* 모바일 메뉴 버튼 */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-white/10"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* 모바일 메뉴 */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/10">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={clsx(
                  'flex items-center space-x-2 px-3 py-2 rounded-lg text-sm',
                  pathname === href ? 'bg-white/20' : 'hover:bg-white/10'
                )}
                onClick={() => setMobileOpen(false)}
              >
                <Icon size={15} />
                <span>{label}</span>
              </Link>
            ))}
            <button
              onClick={() => { handleCollect(); setMobileOpen(false); }}
              className="w-full flex items-center space-x-2 px-3 py-2 bg-gold-400 text-navy-900 rounded-lg text-sm font-medium"
            >
              <RefreshCw size={15} />
              <span>즉시 수집</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
