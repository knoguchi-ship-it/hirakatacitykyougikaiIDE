// v188: recharts を純SVG実装に置換（外部依存なし、バンドルサイズ削減）
import React, { useState } from 'react';
import { MailingPreference, Member, PaymentStatus, Training } from '../types';
import { UsersIcon, BookOpenIcon, CheckCircleIcon, AlertTriangleIcon } from './Icons';

interface DashboardProps {
  members: Member[];
  trainings: Training[];
}

// 純SVGドーナツチャート（recharts PieChart 代替）
const DonutChart: React.FC<{
  data: Array<{ name: string; value: number }>;
  colors: string[];
}> = ({ data, colors }) => {
  const [tooltip, setTooltip] = useState<{ name: string; value: number } | null>(null);
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-sm">
        データなし
      </div>
    );
  }

  const cx = 100;
  const cy = 90;
  const outerR = 72;
  const innerR = 48;
  let angle = -Math.PI / 2;

  const slices = data.map((d, i) => {
    const ratio = d.value / total;
    const sweep = ratio * 2 * Math.PI;
    const end = angle + sweep;
    const x1 = cx + outerR * Math.cos(angle);
    const y1 = cy + outerR * Math.sin(angle);
    const x2 = cx + outerR * Math.cos(end);
    const y2 = cy + outerR * Math.sin(end);
    const ix1 = cx + innerR * Math.cos(end);
    const iy1 = cy + innerR * Math.sin(end);
    const ix2 = cx + innerR * Math.cos(angle);
    const iy2 = cy + innerR * Math.sin(angle);
    const large = ratio > 0.5 ? 1 : 0;
    const path =
      `M ${x1.toFixed(2)} ${y1.toFixed(2)} ` +
      `A ${outerR} ${outerR} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} ` +
      `L ${ix1.toFixed(2)} ${iy1.toFixed(2)} ` +
      `A ${innerR} ${innerR} 0 ${large} 0 ${ix2.toFixed(2)} ${iy2.toFixed(2)} Z`;
    const result = { path, color: colors[i % colors.length], name: d.name, value: d.value };
    angle = end;
    return result;
  });

  return (
    <div className="h-64 flex flex-col items-center">
      <div className="relative">
        <svg viewBox="0 0 200 180" width="200" height="180">
          {slices.map((s, i) => (
            <path
              key={i}
              d={s.path}
              fill={s.color}
              stroke="white"
              strokeWidth="2"
              className="cursor-pointer transition-opacity hover:opacity-80"
              onMouseEnter={() => setTooltip({ name: s.name, value: s.value })}
              onMouseLeave={() => setTooltip(null)}
            />
          ))}
          {tooltip && (
            <text x={cx} y={cy - 6} textAnchor="middle" fontSize="11" fill="#475569">
              {tooltip.name}
            </text>
          )}
          {tooltip && (
            <text x={cx} y={cy + 10} textAnchor="middle" fontSize="14" fontWeight="bold" fill="#1e293b">
              {tooltip.value}
            </text>
          )}
        </svg>
      </div>
      <div className="flex justify-center gap-4 text-xs mt-1 flex-wrap">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center gap-1">
            <span
              className="w-3 h-3 rounded-full inline-block flex-shrink-0"
              style={{ background: s.color }}
            />
            <span>{s.name}: <strong>{s.value}</strong></span>
          </div>
        ))}
      </div>
    </div>
  );
};

// 純SVG横棒グラフ（recharts BarChart 代替）
const HorizontalBarChart: React.FC<{ data: Training[] }> = ({ data }) => {
  if (!data.length) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
        データなし
      </div>
    );
  }
  const maxVal = Math.max(...data.map((d) => Math.max(d.capacity || 0, d.applicants || 0)), 1);
  const barH = 14;
  const rowH = 42;
  const labelW = 140;
  const chartW = 210;
  const svgH = Math.min(data.length * rowH + 10, 230);

  return (
    <div className="h-64 overflow-y-auto">
      <svg viewBox={`0 0 ${labelW + chartW + 50} ${data.length * rowH + 10}`} width="100%">
        {data.map((t, i) => {
          const y = i * rowH + 8;
          const capW = ((t.capacity || 0) / maxVal) * chartW;
          const appW = ((t.applicants || 0) / maxVal) * chartW;
          return (
            <g key={t.id || i}>
              <text x={labelW - 4} y={y + barH} textAnchor="end" fontSize="9" fill="#475569">
                {(t.title || '').length > 18 ? (t.title || '').slice(0, 18) + '…' : t.title}
              </text>
              {/* 定員バー (薄色) */}
              <rect x={labelW} y={y} width={capW} height={barH} rx="2" fill="#e2e8f0" />
              {/* 申込者バー (青) */}
              <rect x={labelW} y={y} width={appW} height={barH} rx="2" fill="#3b82f6" />
              <text x={labelW + capW + 4} y={y + barH - 1} fontSize="9" fill="#64748b">
                {t.applicants}/{t.capacity}
              </text>
              {/* 凡例（1件目のみ） */}
              {i === 0 && (
                <>
                  <rect x={labelW} y={y + barH + 4} width={8} height={6} rx="1" fill="#3b82f6" />
                  <text x={labelW + 10} y={y + barH + 10} fontSize="8" fill="#64748b">申込者数</text>
                  <rect x={labelW + 55} y={y + barH + 4} width={8} height={6} rx="1" fill="#e2e8f0" />
                  <text x={labelW + 65} y={y + barH + 10} fontSize="8" fill="#64748b">定員</text>
                </>
              )}
            </g>
          );
        })}
      </svg>
      {/* svgH 警告抑制のため使用 */}
      <span className="hidden">{svgH}</span>
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ members, trainings }) => {
  const emailCount = members.filter((m) => m.mailingPreference === MailingPreference.EMAIL).length;
  const postCount = members.filter((m) => m.mailingPreference === MailingPreference.POST).length;
  const paidCount = members.filter((m) => m.annualFeeHistory[0]?.status === PaymentStatus.PAID).length;
  const unpaidCount = members.filter((m) => m.annualFeeHistory[0]?.status === PaymentStatus.UNPAID).length;

  const mailingData = [
    { name: 'メール配信 (ON)', value: emailCount },
    { name: '郵送希望 (OFF)', value: postCount },
  ];
  const COLORS = ['#3b82f6', '#ef4444'];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">ダッシュボード</h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 mb-1">総会員数</p>
              <h3 className="text-3xl font-bold text-slate-800">{members.length}</h3>
            </div>
            <div className="p-3 bg-primary-50 rounded-full text-primary-600">
              <UsersIcon />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 mb-1">会費納入済み (今年度)</p>
              <h3 className="text-3xl font-bold text-green-600">{paidCount}</h3>
            </div>
            <div className="p-3 bg-green-50 rounded-full text-green-600">
              <CheckCircleIcon />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 mb-1">会費未納 (今年度)</p>
              <h3 className="text-3xl font-bold text-red-500">{unpaidCount}</h3>
            </div>
            <div className="p-3 bg-red-50 rounded-full text-red-500">
              <AlertTriangleIcon />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 mb-1">開催予定研修</p>
              <h3 className="text-3xl font-bold text-indigo-600">{trainings.filter((t) => t.isApplicationOpen ?? t.status === 'OPEN').length}</h3>
            </div>
            <div className="p-3 bg-indigo-50 rounded-full text-indigo-600">
              <BookOpenIcon />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-4">通信媒体内訳 (コスト削減指標)</h3>
          <DonutChart data={mailingData} colors={COLORS} />
          <p className="text-xs text-center text-slate-500 mt-2">
            郵送希望者は事務局の発送コスト要因となります。
            <br />
            <span className="text-red-500 font-bold">赤色</span> の割合を減らすことが目標です。
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-4">研修申込状況</h3>
          <HorizontalBarChart data={trainings} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
