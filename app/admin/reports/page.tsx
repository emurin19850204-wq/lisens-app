/**
 * LISENS - レポート画面 v2.0
 * 
 * FCオーナーや経営陣に向けた進捗状況や評価結果のレポートを作成・出力する画面
 * プレミアムUIデザイン
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

  // サンプル出力履歴
  const reportHistory = [
    { id: 1, date: '2023-10-01', name: '9月度 店舗別進捗レポート', type: 'monthly', status: 'completed' },
    { id: 2, date: '2023-09-01', name: '8月度 店舗別進捗レポート', type: 'monthly', status: 'completed' },
    { id: 3, date: '2023-08-15', name: '下期 スキル分析サマリー', type: 'evaluation', status: 'completed' },
  ];

  return (
    <div className="page-container">
      {/* ヘッダー */}
      <div className="page-header">
        <div>
          <h1 className="page-title">📊 レポート管理</h1>
          <p className="text-secondary text-sm" style={{ marginTop: 4 }}>
            FCオーナーや経営陣向けの各種レポート・集計データを作成します
          </p>
        </div>
      </div>

      {/* メインコンテンツ 2カラムグリッド */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', marginBottom: 'var(--space-xl)' }}>
        {/* レポート設定カード */}
        <div className="card animate-fadeInUp" style={{ animationDelay: '0.05s' }}>
          <div className="card-header">
            <span style={{ fontSize: '1rem' }}>⚙️</span>
            レポート作成条件
          </div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">レポート種類</label>
              <select
                className="form-select"
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
              >
                <option value="monthly">📅 月次進捗レポート（店舗別）</option>
                <option value="evaluation">📊 評価・スキル分析レポート</option>
                <option value="certification">🏆 認定取得状況サマリー</option>
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">対象月</label>
              <input
                type="month"
                className="form-input"
                value={targetMonth}
                onChange={(e) => setTargetMonth(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 'var(--space-xl)' }}>
              <label className="form-label">対象店舗・組織</label>
              <select className="form-select">
                <option value="all">🏢 全社／全店舗</option>
                <option value="region-east">📍 東日本エリア</option>
                <option value="region-west">📍 西日本エリア</option>
              </select>
            </div>

            <button
              className="btn btn-primary btn-lg"
              style={{ width: '100%' }}
              onClick={handleGenerateReport}
            >
              📄 レポートを作成する
            </button>
          </div>
        </div>

        {/* 出力履歴カード */}
        <div className="card animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
          <div className="card-header">
            <span style={{ fontSize: '1rem' }}>📋</span>
            出力履歴
            <span className="badge badge-muted" style={{ marginLeft: 'auto' }}>{reportHistory.length}件</span>
          </div>
          <div style={{ padding: 0 }}>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>作成日</th>
                    <th>レポート名</th>
                    <th style={{ textAlign: 'center', width: 80 }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {reportHistory.map((report, idx) => (
                    <tr key={report.id} className="animate-fadeIn" style={{ animationDelay: `${0.15 + idx * 0.05}s` }}>
                      <td className="text-sm text-secondary" style={{ whiteSpace: 'nowrap' }}>{report.date}</td>
                      <td style={{ fontWeight: 500 }}>
                        <div>{report.name}</div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => alert('ダウンロード処理')}
                          title="ダウンロード"
                        >
                          📥 DL
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      
      {/* サマリープレビュー */}
      <div className="card animate-fadeInUp" style={{ animationDelay: '0.15s' }}>
        <div className="card-header">
          <span style={{ fontSize: '1rem' }}>📈</span>
          サマリープレビュー
        </div>
        <div className="card-body">
          <div className="empty-state" style={{ padding: 'var(--space-2xl) 0' }}>
            <div className="empty-state-icon">📈</div>
            <p style={{ fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 4 }}>
              レポートのプレビューがここに表示されます
            </p>
            <p className="text-sm text-muted" style={{ marginTop: 4 }}>
              条件を設定して「レポートを作成する」をクリックすると、<br />
              各店舗の認定取得率やカリキュラムの進捗率を視覚的に確認できます。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
