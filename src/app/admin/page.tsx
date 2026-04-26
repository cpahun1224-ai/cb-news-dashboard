'use client';
// ============================================================
// 관리자 설정 페이지
// ============================================================
import { useState, useEffect } from 'react';
import {
  Settings, Rss, Tag, Mail, Send, Loader2,
  Plus, Trash2, ToggleLeft, ToggleRight, ExternalLink, CheckCircle2
} from 'lucide-react';
import type { RssSource, Keyword, Setting, NewsletterLog } from '@/types';

type Tab = 'general' | 'sources' | 'keywords' | 'newsletter' | 'logs';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>('general');

  const tabs = [
    { id: 'general' as Tab, label: '기본 설정', icon: Settings },
    { id: 'sources' as Tab, label: 'RSS 소스', icon: Rss },
    { id: 'keywords' as Tab, label: '키워드', icon: Tag },
    { id: 'newsletter' as Tab, label: '뉴스레터', icon: Mail },
    { id: 'logs' as Tab, label: '발송 로그', icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">관리자 설정</h1>
        <p className="text-gray-500 text-sm mt-1">뉴스 수집 및 뉴스레터 설정을 관리합니다.</p>
      </div>

      {/* 탭 메뉴 */}
      <div className="border-b flex gap-1 overflow-x-auto">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === id
                ? 'border-navy-700 text-navy-800'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* 탭 내용 */}
      <div>
        {activeTab === 'general' && <GeneralSettings />}
        {activeTab === 'sources' && <RssSources />}
        {activeTab === 'keywords' && <Keywords />}
        {activeTab === 'newsletter' && <NewsletterSettings />}
        {activeTab === 'logs' && <NewsletterLogs />}
      </div>
    </div>
  );
}

// ── 기본 설정 탭 ──────────────────────────────────────────
function GeneralSettings() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saveMsg, setSaveMsg] = useState('');

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        const map: Record<string, string> = {};
        (data.settings || []).forEach((s: Setting) => { map[s.key] = s.value; });
        setSettings(map);
        setLoading(false);
      });
  }, []);

  const saveSetting = async (key: string, value: string) => {
    setSaving(key);
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value }),
    });
    setSaving(null);
    setSaveMsg(`'${key}' 저장 완료`);
    setTimeout(() => setSaveMsg(''), 2000);
  };

  const fields = [
    { key: 'recipient_emails', label: '수신 이메일', type: 'text', placeholder: 'ceo@company.com, team@company.com' },
    { key: 'send_time', label: '발송 시각 (HH:MM)', type: 'text', placeholder: '07:00' },
    { key: 'max_news_per_day', label: '하루 최대 뉴스 수', type: 'number', placeholder: '30' },
    { key: 'min_relevance_score', label: '최소 관련성 점수 (0~1)', type: 'text', placeholder: '0.3' },
    { key: 'top_news_count', label: 'TOP 뉴스 개수', type: 'number', placeholder: '5' },
    { key: 'newsletter_subject_prefix', label: '뉴스레터 제목 접두사', type: 'text', placeholder: '[CB Daily Brief]' },
  ];

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="animate-spin text-navy-500" /></div>;

  return (
    <div className="bg-white rounded-xl border p-6 max-w-2xl space-y-4">
      <h2 className="font-bold text-gray-800 mb-4">기본 설정</h2>
      {saveMsg && <p className="text-sm text-green-600">✅ {saveMsg}</p>}
      {fields.map(({ key, label, type, placeholder }) => (
        <div key={key} className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <input
              type={type}
              value={settings[key] || ''}
              onChange={(e) => setSettings((prev) => ({ ...prev, [key]: e.target.value }))}
              placeholder={placeholder}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-navy-500 focus:outline-none"
            />
          </div>
          <button
            onClick={() => saveSetting(key, settings[key] || '')}
            disabled={saving === key}
            className="px-3 py-2 bg-navy-800 text-white text-sm rounded-lg hover:bg-navy-700 disabled:opacity-50"
          >
            {saving === key ? <Loader2 size={14} className="animate-spin" /> : '저장'}
          </button>
        </div>
      ))}
    </div>
  );
}

// ── RSS 소스 탭 ────────────────────────────────────────────
function RssSources() {
  const [sources, setSources] = useState<RssSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSource, setNewSource] = useState({ name: '', url: '', category: 'domestic' });
  const [adding, setAdding] = useState(false);

  const fetchSources = async () => {
    const res = await fetch('/api/sources');
    const data = await res.json();
    setSources(data.sources || []);
    setLoading(false);
  };

  useEffect(() => { fetchSources(); }, []);

  const toggleSource = async (id: string, current: boolean) => {
    await fetch('/api/sources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_active: !current }),
    });
    fetchSources();
  };

  const deleteSource = async (id: string) => {
    if (!confirm('삭제하시겠습니까?')) return;
    await fetch('/api/sources', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    fetchSources();
  };

  const addSource = async () => {
    if (!newSource.name || !newSource.url) return;
    setAdding(true);
    await fetch('/api/sources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSource),
    });
    setNewSource({ name: '', url: '', category: 'domestic' });
    setAdding(false);
    fetchSources();
  };

  const categoryColors: Record<string, string> = {
    domestic: 'bg-blue-100 text-blue-700',
    global: 'bg-emerald-100 text-emerald-700',
    report: 'bg-purple-100 text-purple-700',
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="animate-spin text-navy-500" /></div>;

  return (
    <div className="space-y-4">
      {/* 새 소스 추가 */}
      <div className="bg-white rounded-xl border p-4">
        <h3 className="font-semibold text-gray-800 mb-3">새 RSS 소스 추가</h3>
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            placeholder="소스 이름"
            value={newSource.name}
            onChange={(e) => setNewSource((p) => ({ ...p, name: e.target.value }))}
            className="flex-1 min-w-32 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-navy-500 focus:outline-none"
          />
          <input
            type="url"
            placeholder="RSS URL"
            value={newSource.url}
            onChange={(e) => setNewSource((p) => ({ ...p, url: e.target.value }))}
            className="flex-[2] min-w-48 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-navy-500 focus:outline-none"
          />
          <select
            value={newSource.category}
            onChange={(e) => setNewSource((p) => ({ ...p, category: e.target.value }))}
            className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-navy-500 focus:outline-none"
          >
            <option value="domestic">국내</option>
            <option value="global">글로벌</option>
            <option value="report">리포트</option>
          </select>
          <button
            onClick={addSource}
            disabled={adding}
            className="flex items-center gap-1.5 px-4 py-2 bg-navy-800 text-white rounded-lg text-sm hover:bg-navy-700 disabled:opacity-50"
          >
            <Plus size={14} />
            추가
          </button>
        </div>
      </div>

      {/* 소스 목록 */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">이름</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">URL</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">분류</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">상태</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {sources.map((source) => (
              <tr key={source.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{source.name}</td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <a href={source.url} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-gray-400 hover:text-navy-600 flex items-center gap-1 max-w-xs truncate">
                    <ExternalLink size={10} />
                    {source.url.slice(0, 60)}...
                  </a>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoryColors[source.category]}`}>
                    {source.category === 'domestic' ? '국내' : source.category === 'global' ? '글로벌' : '리포트'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleSource(source.id, source.is_active)}>
                    {source.is_active
                      ? <ToggleRight size={24} className="text-green-500" />
                      : <ToggleLeft size={24} className="text-gray-300" />}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => deleteSource(source.id)}
                    className="text-red-400 hover:text-red-600">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── 키워드 탭 ──────────────────────────────────────────────
function Keywords() {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKw, setNewKw] = useState({ keyword: '', weight: '1.0' });

  const fetchKeywords = async () => {
    const res = await fetch('/api/keywords');
    const data = await res.json();
    setKeywords(data.keywords || []);
    setLoading(false);
  };

  useEffect(() => { fetchKeywords(); }, []);

  const addKeyword = async () => {
    if (!newKw.keyword) return;
    await fetch('/api/keywords', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyword: newKw.keyword, weight: parseFloat(newKw.weight) }),
    });
    setNewKw({ keyword: '', weight: '1.0' });
    fetchKeywords();
  };

  const deleteKeyword = async (id: string) => {
    if (!confirm('삭제하시겠습니까?')) return;
    await fetch('/api/keywords', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    fetchKeywords();
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="animate-spin text-navy-500" /></div>;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border p-4">
        <h3 className="font-semibold text-gray-800 mb-3">키워드 추가</h3>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="키워드 (예: 공급망 금융)"
            value={newKw.keyword}
            onChange={(e) => setNewKw((p) => ({ ...p, keyword: e.target.value }))}
            className="flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-navy-500 focus:outline-none"
          />
          <div className="flex items-center gap-1">
            <label className="text-xs text-gray-500 whitespace-nowrap">가중치:</label>
            <select
              value={newKw.weight}
              onChange={(e) => setNewKw((p) => ({ ...p, weight: e.target.value }))}
              className="px-2 py-2 border rounded-lg text-sm"
            >
              <option value="1.0">1.0 (보통)</option>
              <option value="1.5">1.5 (중요)</option>
              <option value="2.0">2.0 (핵심)</option>
            </select>
          </div>
          <button
            onClick={addKeyword}
            className="flex items-center gap-1.5 px-4 py-2 bg-navy-800 text-white rounded-lg text-sm hover:bg-navy-700"
          >
            <Plus size={14} />
            추가
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {keywords.map((kw) => (
          <div key={kw.id} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border ${
            kw.is_active ? 'bg-navy-50 border-navy-200 text-navy-800' : 'bg-gray-100 border-gray-200 text-gray-400'
          }`}>
            <span>{kw.keyword}</span>
            <span className="text-xs opacity-60">×{kw.weight}</span>
            <button onClick={() => deleteKeyword(kw.id)}
              className="text-red-400 hover:text-red-600 ml-1">
              <Trash2 size={11} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 뉴스레터 탭 ────────────────────────────────────────────
function NewsletterSettings() {
  const [recipient, setRecipient] = useState('');
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState('');

  const handleSend = async (test: boolean) => {
    setSending(true);
    setMsg('');
    try {
      const res = await fetch('/api/newsletter/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test, recipient: recipient || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        setMsg(`✅ 발송 완료! 수신자: ${data.recipient}, ${data.news_count}건 포함`);
      } else {
        setMsg(`❌ 오류: ${data.error}\n\n해결방법: Gmail 앱 비밀번호를 확인하세요.`);
      }
    } catch (e) {
      setMsg('❌ 네트워크 오류');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="bg-white rounded-xl border p-6">
        <h3 className="font-bold text-gray-800 mb-4">뉴스레터 발송</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              수신 이메일 (비워두면 설정값 사용)
            </label>
            <input
              type="email"
              placeholder="test@example.com"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-navy-500 focus:outline-none"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => handleSend(true)}
              disabled={sending}
              className="flex items-center gap-2 px-4 py-2 border border-navy-700 text-navy-700 rounded-lg text-sm hover:bg-navy-50 disabled:opacity-50"
            >
              {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              테스트 발송
            </button>
            <button
              onClick={() => handleSend(false)}
              disabled={sending}
              className="flex items-center gap-2 px-4 py-2 bg-navy-800 text-white rounded-lg text-sm hover:bg-navy-700 disabled:opacity-50"
            >
              {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              실제 발송
            </button>
            <a
              href="/api/newsletter/preview"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
            >
              <ExternalLink size={14} />
              미리보기
            </a>
          </div>

          {msg && (
            <div className={`p-3 rounded-lg text-sm whitespace-pre-wrap ${
              msg.startsWith('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {msg}
            </div>
          )}
        </div>
      </div>

      {/* Vercel Cron 설명 */}
      <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
        <h3 className="font-bold text-blue-800 mb-3">🕐 자동 발송 설정 (Vercel Cron)</h3>
        <p className="text-sm text-blue-700 mb-3">
          프로젝트에 <code className="bg-blue-100 px-1 rounded">vercel.json</code> 파일이 있으면 매일 자동으로 수집 및 발송됩니다.
        </p>
        <div className="bg-white rounded p-3 font-mono text-xs text-gray-700">
          {`// vercel.json\n{\n  "crons": [{\n    "path": "/api/cron",\n    "schedule": "0 22 * * *"\n  }]\n}`}
        </div>
        <p className="text-xs text-blue-600 mt-2">
          * 위 설정은 UTC 22:00 (한국 시간 07:00)에 자동 실행됩니다.
        </p>
      </div>
    </div>
  );
}

// ── 발송 로그 탭 ───────────────────────────────────────────
function NewsletterLogs() {
  const [logs, setLogs] = useState<NewsletterLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      const { createClient } = await import('@supabase/supabase-js');
      const client = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data } = await client
        .from('newsletter_logs')
        .select('*')
        .order('sent_at', { ascending: false })
        .limit(20);
      setLogs(data || []);
      setLoading(false);
    };
    fetchLogs();
  }, []);

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="animate-spin text-navy-500" /></div>;

  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="text-left px-4 py-3 font-semibold text-gray-600">발송 시각</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-600">수신자</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">뉴스 수</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-600">상태</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {logs.length === 0 && (
            <tr><td colSpan={4} className="text-center py-8 text-gray-400">발송 기록이 없습니다.</td></tr>
          )}
          {logs.map((log) => (
            <tr key={log.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-gray-600">
                {new Date(log.sent_at).toLocaleString('ko-KR')}
              </td>
              <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{log.recipient}</td>
              <td className="px-4 py-3 hidden md:table-cell">{log.news_count}건</td>
              <td className="px-4 py-3">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  log.status === 'success' ? 'bg-green-100 text-green-700' :
                  log.status === 'failed' ? 'bg-red-100 text-red-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {log.status === 'success' ? '성공' : log.status === 'failed' ? '실패' : '대기'}
                </span>
                {log.error_message && (
                  <p className="text-xs text-red-500 mt-0.5 truncate max-w-xs">{log.error_message}</p>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
