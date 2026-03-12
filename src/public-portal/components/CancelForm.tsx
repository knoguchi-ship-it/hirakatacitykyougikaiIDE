import React, { useState } from 'react';
import { callApi } from '../../shared/api-base';

interface Props {
  onCancel: () => void;
}

const CancelForm: React.FC<Props> = ({ onCancel }) => {
  const [applyId, setApplyId] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await callApi('cancelTrainingExternal', { applyId, email });
      setSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || '取消に失敗しました。');
    } finally {
      setBusy(false);
    }
  };

  if (success) {
    return (
      <div className="bg-white rounded-lg shadow p-6 max-w-lg mx-auto">
        <div className="text-center">
          <div className="text-green-600 text-5xl mb-4">✓</div>
          <h2 className="text-xl font-semibold mb-2">申込を取消しました</h2>
          <p className="text-sm text-gray-600 mb-4">
            申込取消の処理が完了しました。
          </p>
          <button
            onClick={onCancel}
            className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors"
          >
            研修一覧に戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 max-w-lg mx-auto">
      <h2 className="text-xl font-semibold mb-4">申込取消</h2>

      <p className="text-sm text-gray-600 mb-4">
        申込確認メールに記載された申込IDと、申込時に入力したメールアドレスを入力してください。
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-3 mb-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            申込ID <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={applyId}
            onChange={(e) => setApplyId(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="申込確認メールに記載のID"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            メールアドレス <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="申込時に入力したメールアドレス"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 text-sm text-gray-700 rounded hover:bg-gray-50 transition-colors"
          >
            戻る
          </button>
          <button
            type="submit"
            disabled={busy}
            className="flex-1 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {busy ? '処理中...' : '取消する'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CancelForm;
