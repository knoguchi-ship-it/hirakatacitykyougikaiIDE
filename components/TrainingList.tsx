import React, { useState } from 'react';
import { Training } from '../types';
import { generateTrainingEmail } from '../services/geminiService';
import { SparklesIcon, MailIcon } from './Icons';

interface TrainingListProps {
  trainings: Training[];
}

const TrainingList: React.FC<TrainingListProps> = ({ trainings }) => {
  const [selectedTraining, setSelectedTraining] = useState<Training | null>(null);
  const [generatedDraft, setGeneratedDraft] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateEmail = async (training: Training) => {
    setSelectedTraining(training);
    setIsGenerating(true);
    setGeneratedDraft("");
    
    // Call Gemini API
    const draft = await generateTrainingEmail(training);
    setGeneratedDraft(draft);
    setIsGenerating(false);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">研修管理</h2>

      <div className="grid gap-6">
        {trainings.map((training) => (
          <div key={training.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center">
            <div className="mb-4 md:mb-0">
              <div className="flex items-center space-x-3 mb-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${training.status === 'OPEN' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                  {training.status === 'OPEN' ? '受付中' : '受付終了'}
                </span>
                <span className="text-slate-500 text-sm">{training.date}</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900">{training.title}</h3>
              <p className="text-sm text-slate-600 mt-1">
                場所: {training.location} | 申込: {training.applicants} / {training.capacity}名
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button 
                onClick={() => handleGenerateEmail(training)}
                className="flex items-center space-x-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-4 py-2 rounded-lg transition-colors border border-indigo-200"
              >
                <SparklesIcon className="w-4 h-4" />
                <span>AI案内メール作成</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* AI Draft Modal/Area */}
      {selectedTraining && (
        <div className="mt-8 bg-slate-800 text-slate-100 p-6 rounded-xl shadow-xl animate-fadeIn">
          <div className="flex items-center justify-between mb-4 border-b border-slate-700 pb-4">
            <h3 className="text-lg font-bold flex items-center">
              <SparklesIcon className="w-5 h-5 mr-2 text-yellow-400" />
              AI アシスタント: {selectedTraining.title}
            </h3>
            <button onClick={() => setSelectedTraining(null)} className="text-slate-400 hover:text-white">閉じる</button>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-4 text-sm text-slate-400">
              <p>Geminiモデル (Flash) を使用して、SOWで定義された「開催3日前のリマインドメール」を下書きします。</p>
              <ul className="list-disc list-inside space-y-2">
                <li>件名の自動生成</li>
                <li>オンライン/オフラインの状況判断</li>
                <li>丁寧語での構成</li>
              </ul>
            </div>
            <div className="md:col-span-2">
              {isGenerating ? (
                <div className="flex items-center justify-center h-48">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  <span className="ml-3">生成中...</span>
                </div>
              ) : (
                <div className="bg-slate-900 p-4 rounded-lg border border-slate-700 font-mono text-sm leading-relaxed whitespace-pre-wrap">
                  {generatedDraft}
                </div>
              )}
              {!isGenerating && generatedDraft && (
                 <div className="mt-4 flex justify-end">
                    <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded flex items-center text-sm font-bold">
                      <MailIcon className="w-4 h-4 mr-2" />
                      この内容で配信設定へ
                    </button>
                 </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainingList;