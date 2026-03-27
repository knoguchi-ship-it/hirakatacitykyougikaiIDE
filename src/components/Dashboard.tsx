import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { MailingPreference, Member, PaymentStatus, Training } from '../types';
import { UsersIcon, BookOpenIcon, CheckCircleIcon, AlertTriangleIcon } from './Icons';

interface DashboardProps {
  members: Member[];
  trainings: Training[];
}

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
              <h3 className="text-3xl font-bold text-indigo-600">{trainings.filter((t) => t.status === 'OPEN').length}</h3>
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
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={mailingData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {mailingData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-center text-slate-500 mt-2">
            郵送希望者は事務局の発送コスト要因となります。
            <br />
            <span className="text-red-500 font-bold">赤色</span> の割合を減らすことが目標です。
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-4">研修申込状況</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={trainings}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <XAxis type="number" />
                <YAxis dataKey="title" type="category" width={150} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="applicants" name="申込者数" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                <Bar dataKey="capacity" name="定員" fill="#e2e8f0" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
