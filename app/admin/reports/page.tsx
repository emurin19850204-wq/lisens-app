/**
 * LISENS - レポート画面
 * 
 * FCオーナーや経営陣に向けた進捗状況や評価結果のレポートを作成・出力する画面
 */
'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';

export default function ReportsPage() {
  const { user } = useAuth();
  const [reportType, setReportType] = useState('monthly');
  const [targetMonth, setTargetMonth] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });
  
  if (!user) return null;
  // 研修者はアクセス不可
  if (user.role === 'learner') {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-state-icon">🔒</div>
          <p>この画面にアクセスする権限がありません</p>
          <Link href="/" className="btn btn-outline" style={{ marginTop: 'var(--space-md)' }}>← ホームに戻る</Link>
        </div>
      </div>
    );
  }

  const handleGenerateReport = () => {
    alert('レポート生成処理をここに実装します。\n（例：PDF出力、CSVダウンロードなど）');
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">📊 レポート管理</h1>
        <p className="text-secondary" style={{ marginTop: 'var(--space-xs)' }}>
          FCオーナーや経営陣向けの各種レポート・集計データを作成します。
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
        {/* レポート設定カード */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">レポート作成条件</h2>
          </div>
          <div className="card-body">
            <div style={{ marginBottom: 'var(--space-md)' }}>
              <label style={{ display: 'block', marginBottom: 'var(--space-xs)', fontWeight: 'bold', fontSize: '0.9rem' }}>レポート種類</label>
              <select 
                className="input-field" 
                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
              >
                <option value="monthly">月次進捗レポート（店舗別）</option>
                <option value="evaluation">評価・スキル分析レポート</option>
                <option value="certification">認定取得状況サマリー</option>
              </select>
            </div>
            
            <div style={{ marginBottom: 'var(--space-md)' }}>
              <label style={{ display: 'block', marginBottom: 'var(--space-xs)', fontWeight: 'bold', fontSize: '0.9rem' }}>対象月</label>
              <input 
                type="month" 
                className="input-field" 
                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
                value={targetMonth}
                onChange={(e) => setTargetMonth(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: 'var(--space-lg)' }}>
              <label style={{ display: 'block', marginBottom: 'var(--space-xs)', fontWeight: 'bold', fontSize: '0.9rem' }}>対象店舗・組織</label>
              <select 
                className="input-field" 
                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
              >
                <option value="all">全社／全店舗</option>
                <option value="region-east">東日本エリア</option>
                <option value="region-west">西日本エリア</option>
              </select>
            </div>

            <button 
              className="btn btn-primary" 
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={handleGenerateReport}
            >
              📄 レポートを作成する
            </button>
          </div>
        </div>

        {/* 最近作成したレポート */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">出力履歴</h2>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-container">
              <table style={{ width: '100%', fontSize: '0.9rem', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '12px 16px', borderBottom: '1px solid #ddd', backgroundColor: '#f9fafb' }}>作成日</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', borderBottom: '1px solid #ddd', backgroundColor: '#f9fafb' }}>レポート名</th>
                    <th style={{ textAlign: 'center', padding: '12px 16px', borderBottom: '1px solid #ddd', backgroundColor: '#f9fafb' }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { id: 1, date: '2023-10-01', name: '9月度 店舗別進捗レポート' },
                    { id: 2, date: '2023-09-01', name: '8月度 店舗別進捗レポート' },
                    { id: 3, date: '2023-08-15', name: '下期 スキル分析サマリー' },
                  ].map(report => (
                    <tr key={report.id}>
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6' }}>{report.date}</td>
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6' }}>{report.name}</td>
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6', textAlign: 'center' }}>
                        <button className="btn btn-outline btn-sm" onClick={() => alert('ダウンロード処理')} title="ダウンロード">📥</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      
      {/* サマリープレビューダッシュボード的表現 */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">サマリープレビュー</h2>
        </div>
        <div className="card-body">
          <div className="empty-state" style={{ padding: 'var(--space-2xl) 0' }}>
            <div className="empty-state-icon">📈</div>
            <p>条件を設定してレポートを作成すると、ここにプレビューが表示されます。</p>
            <p className="text-secondary text-sm" style={{ marginTop: 'var(--space-xs)' }}>
              各店舗の認定取得率や、カリキュラムの進捗率などを視覚的に確認できます。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
