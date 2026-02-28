import React, { useState, useEffect, useRef } from 'react';
import { Member, MailingPreference, MailDestination, MemberType, PaymentStatus, Staff, StaffRole, Training } from '../types';
import { AlertTriangleIcon, MailIcon, CheckCircleIcon, BookOpenIcon, UsersIcon, HomeIcon, PlusIcon, TrashIcon, SparklesIcon } from './Icons';
import { api } from '../services/api';

interface MemberFormProps {
  initialMember: Member;
  activeStaffId?: string; // Optional: Force a specific staff member view
  trainings: Training[]; // Data from parent (App.tsx)
  onSave: (member: Member) => void;
}

const MemberForm: React.FC<MemberFormProps> = ({ initialMember, activeStaffId, trainings, onSave }) => {
  const [member, setMember] = useState<Member>(initialMember);
  const [warning, setWarning] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null); // UX: Success feedback
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  // UX: Loading state for application button
  const [submittingTrainingId, setSubmittingTrainingId] = useState<string | null>(null);
  const [expandedTrainingId, setExpandedTrainingId] = useState<string | null>(null);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', nextPassword: '', confirmPassword: '' });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);

  const historyRef = useRef<HTMLDivElement>(null); // UX: For auto-scrolling
  
  // Fix for async state updates: Track latest member state
  // memberRef is no longer needed as we create newMember synchronously

  const isBusiness = member.type === MemberType.BUSINESS;

  // Demo Logic: Operating User (Simulating logged-in staff for Business accounts)
  // If activeStaffId is passed (from App demo switcher), use it. 
  // Otherwise default to the first staff.
  const [operatingStaffId, setOperatingStaffId] = useState<string | null>(
    activeStaffId || (isBusiness && member.staff && member.staff.length > 0 ? member.staff[0].id : null)
  );

  useEffect(() => {
    // Reset member when initialMember changes
    setMember(initialMember);
    
    // Sync operating staff with prop or default
    if (activeStaffId) {
        setOperatingStaffId(activeStaffId);
    } else if (initialMember.type === MemberType.BUSINESS && initialMember.staff && initialMember.staff.length > 0) {
        setOperatingStaffId(initialMember.staff[0].id);
    }
  }, [initialMember, activeStaffId]);

  // Reset UI state only when the member ID changes
  useEffect(() => {
    setSuccessMsg(null);
    setSubmittingTrainingId(null);
  }, [initialMember.id]);

  // Determine Permissions
  const currentStaff = isBusiness ? member.staff?.find(s => s.id === operatingStaffId) : null;
  const isReadOnly = isBusiness ? currentStaff?.role !== 'ADMIN' : false;

  // --- Logic for Trainings ---
  
  // 1. Get IDs of trainings the current user has already participated in
  const getParticipatedIds = () => {
    if (isBusiness) {
        return currentStaff?.participatedTrainingIds || [];
    } else {
        return member.participatedTrainingIds || [];
    }
  };
  const participatedIds = getParticipatedIds();

  // 2. Filter history based on participated IDs
  const trainingHistory = trainings.filter(t => participatedIds.includes(t.id));

  // 3. Filter NEW available trainings (Open AND Not participated)
  const availableTrainings = trainings.filter(t => 
    t.status === 'OPEN' && !participatedIds.includes(t.id)
  );

  const currentFeeStatus = member.annualFeeHistory[0];
  const currentLoginId = isBusiness ? (currentStaff?.loginId || member.loginId || '-') : (member.loginId || '-');
  
  // Display name for the training table header
  const trainingTargetName = isBusiness 
    ? (currentStaff?.name ? `${currentStaff.name} 様` : '選択された職員') 
    : 'あなた';

  // --- Action Handlers ---

  const handleTrainingApply = (trainingId: string) => {
      if (submittingTrainingId) return; // Prevent double click

      const training = trainings.find(t => t.id === trainingId);
      if (!training) return;
      
      const confirmMsg = isBusiness 
        ? `「${training.title}」に\n職員: ${currentStaff?.name} 様の名義で申し込みますか？`
        : `「${training.title}」に申し込みますか？`;

      if (!window.confirm(confirmMsg)) return;

      // Start loading simulation
      setSubmittingTrainingId(trainingId);

      // Create newMember synchronously based on current state
      const newMember = { ...member };

      if (isBusiness) {
          newMember.staff = newMember.staff?.map(s => {
              if (s.id === operatingStaffId) {
                  return {
                      ...s,
                      participatedTrainingIds: [...(s.participatedTrainingIds || []), trainingId]
                  };
              }
              return s;
          });
      } else {
          newMember.participatedTrainingIds = [...(newMember.participatedTrainingIds || []), trainingId];
      }

      // Simulate API delay (800ms)
      setTimeout(() => {
          // 1. Save to Global State (App.tsx)
          onSave(newMember);

          // 2. Update Local State (Immediate Feedback)
          // Note: App.tsx will trigger a prop update, which triggers useEffect, 
          // but setting it here ensures responsiveness.
          setMember(newMember);
          
          setSubmittingTrainingId(null);
          setSuccessMsg(`「${training.title}」への申し込みが完了しました。`);
          
          // Scroll after state update
          setTimeout(() => {
              historyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 100);
      }, 800);
  };

  const handleMailingChange = (preference: MailingPreference) => {
    if (isReadOnly) return;
    if (isBusiness) return; // Business is always special hybrid mode

    if (preference === MailingPreference.POST) {
      if (member.email) {
        setWarning("注意: 「郵送」を選択すると、現在登録されているメールアドレスは削除され、研修案内などが郵送に切り替わります。");
      }
      setMember(prev => ({ ...prev, mailingPreference: preference, email: '' }));
    } else {
      setWarning(null);
      setMember(prev => ({ ...prev, mailingPreference: preference }));
    }
  };

  const handleDestinationChange = (dest: MailDestination) => {
    if (isReadOnly) return;
    if (isBusiness && dest === MailDestination.HOME) {
        alert("事業所会員の場合、定期発送物は事業所宛てとなります。");
        return;
    }
    setMember(prev => ({ ...prev, preferredMailDestination: dest }));
    
    // Clear relevant address errors
    setErrors(prev => {
        const newErrors = { ...prev };
        if (dest === MailDestination.HOME) {
            delete newErrors.officePostCode;
            delete newErrors.officePrefecture;
            delete newErrors.officeCity;
            delete newErrors.officeAddressLine;
        } else {
            delete newErrors.homePostCode;
            delete newErrors.homePrefecture;
            delete newErrors.homeCity;
            delete newErrors.homeAddressLine;
        }
        return newErrors;
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (isReadOnly) return;
    const { name, value } = e.target;
    setMember(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
        setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[name];
            return newErrors;
        });
    }
  };

  // Staff Management Logic
  const handleStaffChange = (id: string, field: keyof Staff, value: string) => {
    if (isReadOnly) return;
    setMember(prev => ({
        ...prev,
        staff: prev.staff?.map(s => s.id === id ? { ...s, [field]: value } : s)
    }));
  };

  const addStaff = () => {
    if (isReadOnly) return;
    const newStaff: Staff = {
        id: `S${Date.now()}`,
        name: '',
        kana: '',
        email: '',
        role: 'STAFF',
        participatedTrainingIds: []
    };
    setMember(prev => ({
        ...prev,
        staff: [...(prev.staff || []), newStaff]
    }));
  };

  const removeStaff = (id: string) => {
    if (isReadOnly) return;
    if (!window.confirm('この職員情報を削除しますか？')) return;
    setMember(prev => ({
        ...prev,
        staff: prev.staff?.filter(s => s.id !== id)
    }));
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    // Basic Validation
    if (!member.lastName) newErrors.lastName = '必須項目です';
    if (!member.firstName) newErrors.firstName = '必須項目です';
    if (!member.officeName) newErrors.officeName = '必須項目です';
    if (!member.fax) newErrors.fax = '必須項目です';
    
    if (!isBusiness && member.mailingPreference === MailingPreference.EMAIL && !member.email) {
       newErrors.email = '必須項目です';
    }

    if (isBusiness) {
        // Business Address is ALWAYS required
        if (!member.officePostCode) newErrors.officePostCode = '必須です';
        if (!member.officePrefecture) newErrors.officePrefecture = '必須です';
        if (!member.officeCity) newErrors.officeCity = '必須です';
        if (!member.officeAddressLine) newErrors.officeAddressLine = '必須です';
    } else {
        // Individual Logic
        if (member.preferredMailDestination === MailDestination.HOME) {
            if (!member.homePostCode) newErrors.homePostCode = '郵送先のため必須です';
            if (!member.homePrefecture) newErrors.homePrefecture = '郵送先のため必須です';
            if (!member.homeCity) newErrors.homeCity = '郵送先のため必須です';
            if (!member.homeAddressLine) newErrors.homeAddressLine = '郵送先のため必須です';
        } else {
            if (!member.officePostCode) newErrors.officePostCode = '郵送先のため必須です';
            if (!member.officePrefecture) newErrors.officePrefecture = '郵送先のため必須です';
            if (!member.officeCity) newErrors.officeCity = '郵送先のため必須です';
            if (!member.officeAddressLine) newErrors.officeAddressLine = '郵送先のため必須です';
        }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    if (!validate()) {
        setWarning("入力内容に不備があります。赤枠の項目を確認し、必須事項を入力してください。");
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }
    setWarning(null);
    onSave(member);
    alert("登録情報を更新しました。");
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordForm.currentPassword || !passwordForm.nextPassword || !passwordForm.confirmPassword) {
      setPasswordError('現在のパスワード・新しいパスワード・確認用をすべて入力してください。');
      setPasswordSuccess(null);
      return;
    }
    if (passwordForm.nextPassword.length < 8) {
      setPasswordError('新しいパスワードは8文字以上で入力してください。');
      setPasswordSuccess(null);
      return;
    }
    if (passwordForm.nextPassword !== passwordForm.confirmPassword) {
      setPasswordError('新しいパスワードと確認用パスワードが一致しません。');
      setPasswordSuccess(null);
      return;
    }

    try {
      setPasswordSubmitting(true);
      await api.changePassword(currentLoginId, passwordForm.currentPassword, passwordForm.nextPassword);
      setPasswordSuccess('パスワードを変更しました。');
      setPasswordError(null);
      setPasswordForm({ currentPassword: '', nextPassword: '', confirmPassword: '' });
    } catch (err: any) {
      setPasswordError(err?.message || 'パスワード変更に失敗しました。');
      setPasswordSuccess(null);
    } finally {
      setPasswordSubmitting(false);
    }
  };

  const getInputClass = (fieldName: string) => {
    const baseClass = "w-full rounded-md shadow-sm border p-2";
    const errorClass = errors[fieldName] 
        ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500' 
        : 'border-slate-300 focus:border-primary-500 focus:ring-primary-500';
    const readOnlyClass = isReadOnly ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : '';
    
    return `${baseClass} ${errorClass} ${readOnlyClass}`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">

      {/* Demo: Operating Staff Switcher for Business Members */}
      {isBusiness && member.staff && (
        <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center justify-between shadow-sm transition-all ${isReadOnly ? 'opacity-75' : ''}`}>
            <div className="flex items-center space-x-2">
                <UsersIcon className="text-yellow-600 w-5 h-5"/>
                <span className="text-sm font-bold text-yellow-800">操作ユーザー選択 (デモ用):</span>
            </div>
            <select 
                className="bg-white border border-yellow-300 text-slate-700 text-sm rounded-md px-3 py-1.5 focus:ring-2 focus:ring-yellow-500"
                value={operatingStaffId || ''}
                onChange={(e) => setOperatingStaffId(e.target.value)}
            >
                {member.staff.map(s => (
                    <option key={s.id} value={s.id}>
                        {s.name} {s.role === 'ADMIN' ? '(管理者)' : '(一般)'}
                    </option>
                ))}
            </select>
        </div>
      )}

      {isReadOnly && (
          <div className="bg-slate-100 border border-slate-300 text-slate-600 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">閲覧専用モード: </strong>
            <span className="block sm:inline">現在のユーザーには編集権限がありません。情報の閲覧のみ可能です。</span>
          </div>
      )}
      
      {/* 1. Member Status Summary Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800 flex items-center">
                <UsersIcon className="w-5 h-5 mr-2 text-slate-500" />
                現在の会員ステータス
            </h2>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${member.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {member.status === 'ACTIVE' ? '有効会員' : '退会済み'}
            </span>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start space-x-3">
                <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" /></svg>
                </div>
                <div>
                    <p className="text-sm text-slate-500 font-bold mb-1">会員種別</p>
                    <p className="text-lg font-bold text-slate-800">
                        {isBusiness ? '正会員 (事業所)' : '正会員 (個人)'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">登録番号: {member.id}</p>
                </div>
            </div>
            <div className="flex items-start space-x-3">
                <div className="bg-sky-50 p-2 rounded-lg text-sky-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M5 7h14M5 17h14"/></svg>
                </div>
                <div>
                    <p className="text-sm text-slate-500 font-bold mb-1">ログインID</p>
                    <p className="text-lg font-bold text-slate-800 font-mono">{currentLoginId}</p>
                    <p className="text-xs text-slate-400 mt-1">ログインIDは変更できません</p>
                </div>
            </div>
            
            <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-lg ${currentFeeStatus?.status === PaymentStatus.PAID ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                   {currentFeeStatus?.status === PaymentStatus.PAID ? <CheckCircleIcon className="w-6 h-6" /> : <AlertTriangleIcon className="w-6 h-6" />}
                </div>
                <div className="flex-1">
                    <p className="text-sm text-slate-500 font-bold mb-1">年会費納入状況 (過去2年)</p>
                    <div className="space-y-2">
                        {member.annualFeeHistory.map((record) => (
                             <div key={record.year} className="flex justify-between items-center text-sm border-b border-slate-100 pb-1 last:border-0">
                                <span className="text-slate-600">{record.year}年度</span>
                                <span className={`font-bold ${record.status === PaymentStatus.PAID ? 'text-green-700' : 'text-red-500'}`}>
                                    {record.status === PaymentStatus.PAID ? '納入済み' : '未納'}
                                </span>
                             </div>
                        ))}
                    </div>
                    {currentFeeStatus?.status === PaymentStatus.UNPAID && currentFeeStatus.transferAccount && (
                        <div className="mt-3 p-3 rounded-lg border border-red-200 bg-red-50 text-sm">
                            <p className="font-bold text-red-700 mb-2">未納のため振込先口座を表示しています</p>
                            <p className="text-slate-700">銀行名: {currentFeeStatus.transferAccount.bankName}</p>
                            <p className="text-slate-700">支店名: {currentFeeStatus.transferAccount.branchName}</p>
                            <p className="text-slate-700">口座種別: {currentFeeStatus.transferAccount.accountType}</p>
                            <p className="text-slate-700">口座番号: {currentFeeStatus.transferAccount.accountNumber}</p>
                            <p className="text-slate-700">口座名義: {currentFeeStatus.transferAccount.accountName}</p>
                            {currentFeeStatus.transferAccount.note && (
                                <p className="text-xs text-slate-500 mt-2">{currentFeeStatus.transferAccount.note}</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800">認証情報</h2>
        </div>
        <div className="p-6">
          <form onSubmit={handlePasswordChange} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">ログインID</label>
              <input type="text" value={currentLoginId} disabled className="w-full rounded-md shadow-sm border p-2 bg-slate-100 text-slate-600 font-mono" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">現在のパスワード</label>
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                className="w-full rounded-md shadow-sm border border-slate-300 p-2"
                autoComplete="current-password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">新しいパスワード</label>
              <input
                type="password"
                value={passwordForm.nextPassword}
                onChange={(e) => setPasswordForm((prev) => ({ ...prev, nextPassword: e.target.value }))}
                className="w-full rounded-md shadow-sm border border-slate-300 p-2"
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">新しいパスワード（確認）</label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                className="w-full rounded-md shadow-sm border border-slate-300 p-2"
                autoComplete="new-password"
              />
            </div>
            <div className="md:col-span-2 flex items-center justify-between">
              <div>
                {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}
                {passwordSuccess && <p className="text-sm text-green-600">{passwordSuccess}</p>}
              </div>
              <button
                type="submit"
                disabled={passwordSubmitting}
                className={`px-4 py-2 rounded-lg text-white font-bold ${passwordSubmitting ? 'bg-slate-400' : 'bg-slate-700 hover:bg-slate-800'}`}
              >
                {passwordSubmitting ? '変更中...' : 'パスワードを変更'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* NEW: Available Trainings Section */}
      <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden animate-fadeIn">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-blue-100 flex justify-between items-center">
            <h2 className="text-lg font-bold text-blue-900 flex items-center">
                <SparklesIcon className="w-5 h-5 mr-2 text-yellow-500" />
                現在受付中の研修
            </h2>
            <span className="text-xs font-medium bg-white text-blue-700 px-3 py-1 rounded-full border border-blue-100 shadow-sm">
                申し込み可能: {availableTrainings.length}件
            </span>
        </div>
        <div className="p-6">
            {availableTrainings.length > 0 ? (
                <div className="grid gap-4">
                    {availableTrainings.map(training => (
                        <div key={training.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center">
                            <div className="mb-4 sm:mb-0">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded">受付中</span>
                                    <span className="text-sm text-slate-500">{training.date} 開催</span>
                                </div>
                                <h3 className="font-bold text-slate-800 text-lg mb-1">{training.title}</h3>
                                {training.summary && (
                                  <p className="text-sm text-slate-600 mb-2">{training.summary}</p>
                                )}
                                <p className="text-sm text-slate-600 flex items-center">
                                    <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded mr-2">
                                        {training.isOnline ? 'オンライン' : '現地'}
                                    </span>
                                    {training.location} (定員 {training.capacity}名)
                                </p>
                                <div className="mt-2 flex items-center gap-3">
                                  <button
                                    type="button"
                                    onClick={() => setExpandedTrainingId((prev) => (prev === training.id ? null : training.id))}
                                    className="text-sm text-blue-700 hover:text-blue-900 underline"
                                  >
                                    {expandedTrainingId === training.id ? '詳細を閉じる' : '詳細を見る'}
                                  </button>
                                  {training.guidePdfUrl && (
                                    <a
                                      href={training.guidePdfUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-sm text-indigo-700 hover:text-indigo-900 underline"
                                    >
                                      案内PDFを見る
                                    </a>
                                  )}
                                </div>
                                {expandedTrainingId === training.id && training.description && (
                                  <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded text-sm text-slate-700 max-w-xl">
                                    {training.description}
                                  </div>
                                )}
                            </div>
                            <button 
                                onClick={() => handleTrainingApply(training.id)}
                                disabled={submittingTrainingId !== null}
                                className={`whitespace-nowrap font-bold py-2 px-6 rounded-lg shadow-sm transition-all flex items-center ${
                                  submittingTrainingId === training.id 
                                    ? 'bg-slate-300 text-slate-500 cursor-wait' 
                                    : 'bg-blue-600 hover:bg-blue-700 hover:-translate-y-0.5 text-white'
                                }`}
                            >
                                {submittingTrainingId === training.id ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-500 mr-2"></div>
                                        処理中...
                                    </>
                                ) : (
                                    <>
                                        <PlusIcon className="w-4 h-4 mr-1" />
                                        申し込む
                                    </>
                                )}
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                    <p>現在申し込み可能な研修はありません。</p>
                </div>
            )}
        </div>
      </div>

      {/* 3. Training History Table (Moved down) */}
      <div ref={historyRef} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden transition-all">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-800 flex items-center">
                <BookOpenIcon className="w-5 h-5 mr-2 text-slate-500" />
                研修受講・申込履歴 ({trainingTargetName})
            </h2>
        </div>
        
        {/* Success Feedback Banner */}
        {successMsg && (
            <div className="bg-green-50 px-6 py-3 border-b border-green-100 flex items-center text-green-800 text-sm animate-fadeIn">
                <CheckCircleIcon className="w-5 h-5 mr-2 text-green-600" />
                <span className="font-bold">{successMsg}</span>
                <button onClick={() => setSuccessMsg(null)} className="ml-auto text-green-600 hover:text-green-800 font-bold p-1">×</button>
            </div>
        )}

        <div className="p-0 overflow-x-auto">
            {trainingHistory.length > 0 ? (
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">開催日</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">研修名</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">形式</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">状態</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {trainingHistory.map(t => (
                            <tr key={t.id} className={successMsg && t.id === trainingHistory[trainingHistory.length-1].id ? "bg-green-50/50 transition-colors duration-1000" : ""}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{t.date}</td>
                                <td className="px-6 py-4 text-sm font-medium text-slate-900">{t.title}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                    {t.isOnline ? 'オンライン' : '現地開催'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                     <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                        申込済
                                     </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <div className="p-8 text-center text-slate-500 text-sm">
                    受講履歴はありません。
                </div>
            )}
        </div>
      </div>

      {/* 2. Member Profile Form (Renamed to be secondary) */}
      <div className="bg-white p-8 rounded-xl shadow-md border border-slate-200">
        <h2 className="text-xl font-bold text-slate-800 mb-2">会員情報の確認・変更</h2>
        <p className="text-sm text-slate-500 mb-8 pb-4 border-b border-slate-200">
          ご登録内容の確認・変更はこちらから行えます。
        </p>

        {warning && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 text-red-700 text-sm flex items-start animate-fadeIn">
                <AlertTriangleIcon className="w-5 h-5 mr-2 flex-shrink-0" />
                {warning}
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-10">
          
          {/* Section 1: Basic Info */}
          <div>
            <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center border-b pb-2">
              <span className="w-6 h-6 bg-slate-200 text-slate-700 rounded-full flex items-center justify-center mr-2 text-sm font-bold">1</span>
              {isBusiness ? '代表者情報・所属職員' : '基本情報'}
            </h3>
            
            <div className="pl-8 space-y-8">
                {/* Representative Name */}
                <div>
                    {isBusiness && <h4 className="font-bold text-sm text-slate-800 mb-2">代表者（または主たる連絡先担当者）</h4>}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">氏 (姓) (※)</label>
                            <input disabled={isReadOnly} type="text" name="lastName" value={member.lastName} onChange={handleChange} className={getInputClass('lastName')} />
                            {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">名 (名) (※)</label>
                            <input disabled={isReadOnly} type="text" name="firstName" value={member.firstName} onChange={handleChange} className={getInputClass('firstName')} />
                            {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">フリガナ (セイ) (※)</label>
                            <input disabled={isReadOnly} type="text" name="lastKana" value={member.lastKana} onChange={handleChange} className={getInputClass('lastKana')} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">フリガナ (メイ) (※)</label>
                            <input disabled={isReadOnly} type="text" name="firstKana" value={member.firstKana} onChange={handleChange} className={getInputClass('firstKana')} />
                        </div>
                    </div>
                </div>

                {/* Staff List (Only for Business) */}
                {isBusiness && (
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="font-bold text-sm text-slate-800 flex items-center">
                                <UsersIcon className="w-4 h-4 mr-1 text-slate-500"/>
                                所属職員一覧 (ケアマネジャー)
                            </h4>
                            {!isReadOnly && (
                                <button type="button" onClick={addStaff} className="text-xs bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-3 py-1 rounded flex items-center">
                                    <PlusIcon className="w-3 h-3 mr-1"/>
                                    職員を追加
                                </button>
                            )}
                        </div>
                        
                        <div className="space-y-3">
                            {(!member.staff || member.staff.length === 0) && (
                                <p className="text-xs text-slate-500 text-center py-4">登録されている職員はいません。</p>
                            )}
                            {member.staff?.map((staff) => (
                                <div key={staff.id} className="bg-white p-3 rounded shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-12 gap-3 items-start md:items-center">
                                    <div className="md:col-span-3">
                                        <label className="block text-xs font-medium text-slate-500">氏名</label>
                                        <input 
                                            disabled={isReadOnly}
                                            type="text" 
                                            value={staff.name} 
                                            onChange={(e) => handleStaffChange(staff.id, 'name', e.target.value)}
                                            className={`w-full text-sm border-slate-200 rounded p-1 ${isReadOnly ? 'bg-slate-100' : ''}`}
                                            placeholder="例: 佐藤 次郎"
                                        />
                                    </div>
                                    <div className="md:col-span-3">
                                        <label className="block text-xs font-medium text-slate-500">フリガナ</label>
                                        <input 
                                            disabled={isReadOnly}
                                            type="text" 
                                            value={staff.kana} 
                                            onChange={(e) => handleStaffChange(staff.id, 'kana', e.target.value)}
                                            className={`w-full text-sm border-slate-200 rounded p-1 ${isReadOnly ? 'bg-slate-100' : ''}`}
                                            placeholder="サトウ ジロウ"
                                        />
                                    </div>
                                    <div className="md:col-span-3">
                                        <label className="block text-xs font-medium text-slate-500">個別メールアドレス</label>
                                        <input 
                                            disabled={isReadOnly}
                                            type="email" 
                                            value={staff.email} 
                                            onChange={(e) => handleStaffChange(staff.id, 'email', e.target.value)}
                                            className={`w-full text-sm border-slate-200 rounded p-1 ${isReadOnly ? 'bg-slate-100' : ''}`}
                                            placeholder="staff@example.com"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-medium text-slate-500">権限</label>
                                        <select
                                            disabled={isReadOnly}
                                            value={staff.role}
                                            onChange={(e) => handleStaffChange(staff.id, 'role', e.target.value as StaffRole)}
                                            className={`w-full text-sm border-slate-200 rounded p-1 ${isReadOnly ? 'bg-slate-100' : ''}`}
                                        >
                                            <option value="ADMIN">管理者</option>
                                            <option value="STAFF">一般</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-1 text-right pt-4 md:pt-0">
                                        {!isReadOnly && (
                                            <button type="button" onClick={() => removeStaff(staff.id)} className="text-red-400 hover:text-red-600 p-1">
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                            ※管理者は情報の編集・職員の追加削除が可能です。一般は閲覧のみ可能です。
                        </p>
                    </div>
                )}
            </div>
          </div>

          {/* Section 2: Home Info (Individual Only) */}
          {!isBusiness && (
            <div>
                <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center border-b pb-2">
                <span className="w-6 h-6 bg-slate-200 text-slate-700 rounded-full flex items-center justify-center mr-2 text-sm font-bold">2</span>
                自宅情報・個人連絡先
                {member.preferredMailDestination === MailDestination.HOME && (
                    <span className="ml-3 text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded font-bold">
                        現在、郵送先に指定されています (住所必須)
                    </span>
                )}
                </h3>
                <div className="pl-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        郵便番号 {member.preferredMailDestination === MailDestination.HOME && <span className="text-red-500">(※)</span>}
                    </label>
                    <input disabled={isReadOnly} type="text" name="homePostCode" value={member.homePostCode} onChange={handleChange} className={getInputClass('homePostCode')} placeholder="000-0000" />
                    {errors.homePostCode && <p className="text-xs text-red-500 mt-1">{errors.homePostCode}</p>}
                </div>
                <div className="md:col-span-2 grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            都道府県 {member.preferredMailDestination === MailDestination.HOME && <span className="text-red-500">(※)</span>}
                        </label>
                        <input disabled={isReadOnly} type="text" name="homePrefecture" value={member.homePrefecture} onChange={handleChange} className={getInputClass('homePrefecture')} />
                        {errors.homePrefecture && <p className="text-xs text-red-500 mt-1">{errors.homePrefecture}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            市区町村 {member.preferredMailDestination === MailDestination.HOME && <span className="text-red-500">(※)</span>}
                        </label>
                        <input disabled={isReadOnly} type="text" name="homeCity" value={member.homeCity} onChange={handleChange} className={getInputClass('homeCity')} />
                        {errors.homeCity && <p className="text-xs text-red-500 mt-1">{errors.homeCity}</p>}
                    </div>
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            番地・建物名 {member.preferredMailDestination === MailDestination.HOME && <span className="text-red-500">(※)</span>}
                        </label>
                        <input disabled={isReadOnly} type="text" name="homeAddressLine" value={member.homeAddressLine} onChange={handleChange} className={getInputClass('homeAddressLine')} />
                        {errors.homeAddressLine && <p className="text-xs text-red-500 mt-1">{errors.homeAddressLine}</p>}
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">携帯電話番号</label>
                    <input disabled={isReadOnly} type="tel" name="mobilePhone" value={member.mobilePhone || ''} onChange={handleChange} className={getInputClass('mobilePhone')} placeholder="090-0000-0000" />
                </div>
                </div>
            </div>
          )}

          {/* Section 3: Office Info (For Business: Main Info) */}
          <div>
            <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center border-b pb-2">
              <span className="w-6 h-6 bg-slate-200 text-slate-700 rounded-full flex items-center justify-center mr-2 text-sm font-bold">{isBusiness ? '2' : '3'}</span>
              勤務先情報
              {(isBusiness || member.preferredMailDestination === MailDestination.OFFICE) && (
                  <span className="ml-3 text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded font-bold">
                    現在、郵送先に指定されています (住所必須)
                  </span>
              )}
            </h3>
            <div className="pl-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  事業所名 (※) 
                  {!isBusiness && <span className="text-xs text-red-500 ml-2">勤務していない場合は「勤務なし」と入力</span>}
                </label>
                <input disabled={isReadOnly} type="text" name="officeName" value={member.officeName} onChange={handleChange} className={getInputClass('officeName')} />
                {errors.officeName && <p className="text-xs text-red-500 mt-1">{errors.officeName}</p>}
              </div>

               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    郵便番号 {(isBusiness || member.preferredMailDestination === MailDestination.OFFICE) && <span className="text-red-500">(※)</span>}
                  </label>
                  <input disabled={isReadOnly} type="text" name="officePostCode" value={member.officePostCode} onChange={handleChange} className={getInputClass('officePostCode')} placeholder="000-0000" />
                  {errors.officePostCode && <p className="text-xs text-red-500 mt-1">{errors.officePostCode}</p>}
               </div>
               <div className="md:col-span-2 grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        都道府県 {(isBusiness || member.preferredMailDestination === MailDestination.OFFICE) && <span className="text-red-500">(※)</span>}
                    </label>
                    <input disabled={isReadOnly} type="text" name="officePrefecture" value={member.officePrefecture} onChange={handleChange} className={getInputClass('officePrefecture')} />
                    {errors.officePrefecture && <p className="text-xs text-red-500 mt-1">{errors.officePrefecture}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        市区町村 {(isBusiness || member.preferredMailDestination === MailDestination.OFFICE) && <span className="text-red-500">(※)</span>}
                    </label>
                    <input disabled={isReadOnly} type="text" name="officeCity" value={member.officeCity} onChange={handleChange} className={getInputClass('officeCity')} />
                    {errors.officeCity && <p className="text-xs text-red-500 mt-1">{errors.officeCity}</p>}
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        番地・建物名 {(isBusiness || member.preferredMailDestination === MailDestination.OFFICE) && <span className="text-red-500">(※)</span>}
                    </label>
                    <input disabled={isReadOnly} type="text" name="officeAddressLine" value={member.officeAddressLine} onChange={handleChange} className={getInputClass('officeAddressLine')} />
                    {errors.officeAddressLine && <p className="text-xs text-red-500 mt-1">{errors.officeAddressLine}</p>}
                  </div>
               </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">電話番号</label>
                <input disabled={isReadOnly} type="tel" name="phone" value={member.phone} onChange={handleChange} className={getInputClass('phone')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">FAX番号 (※必須)</label>
                <input disabled={isReadOnly} type="tel" name="fax" value={member.fax} onChange={handleChange} className={getInputClass('fax')} placeholder="緊急連絡用に必須です" />
                {errors.fax && <p className="text-xs text-red-500 mt-1">{errors.fax}</p>}
              </div>
            </div>
          </div>

          {/* Section 4: Mailing & Settings */}
          <div>
            <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center border-b pb-2">
              <span className="w-6 h-6 bg-slate-200 text-slate-700 rounded-full flex items-center justify-center mr-2 text-sm font-bold">{isBusiness ? '3' : '4'}</span>
              発送・通信設定
            </h3>
            
            <div className="pl-8 space-y-8">
              
              {isBusiness ? (
                  // Business Logic: Fixed to Hybrid
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
                    <h4 className="font-bold text-indigo-900 mb-4 flex items-center">
                        <UsersIcon className="w-5 h-5 mr-2"/>
                        事業所会員の発送ルール
                    </h4>
                    <div className="space-y-4">
                        <div className="flex items-start">
                             <div className="bg-white p-2 rounded shadow-sm mr-4 border border-indigo-100">
                                <span className="block text-center text-xs font-bold text-slate-500 mb-1">郵送物</span>
                                <HomeIcon className="w-6 h-6 text-indigo-500 mx-auto"/>
                             </div>
                             <div>
                                <p className="font-bold text-slate-800">事業所宛に1通送付</p>
                                <p className="text-sm text-slate-600">
                                    総会資料などの定期発送物は、上記「勤務先情報」の住所へ一括で送付されます。
                                </p>
                             </div>
                        </div>
                        <div className="border-t border-indigo-200 my-2"></div>
                        <div className="flex items-start">
                             <div className="bg-white p-2 rounded shadow-sm mr-4 border border-indigo-100">
                                <span className="block text-center text-xs font-bold text-slate-500 mb-1">メール</span>
                                <MailIcon className="w-6 h-6 text-green-500 mx-auto"/>
                             </div>
                             <div>
                                <p className="font-bold text-slate-800">各職員へ個別配信</p>
                                <p className="text-sm text-slate-600">
                                    研修案内などの連絡は、上記「所属職員一覧」に登録された各メールアドレスへ個別に配信されます。
                                </p>
                             </div>
                        </div>
                    </div>
                  </div>
              ) : (
                  // Individual Logic: Choice
                  <>
                  <div>
                      <h4 className="text-md font-bold text-slate-800 mb-2">研修案内・お知らせの受取方法</h4>
                      <div className="flex space-x-4">
                        <button
                          type="button"
                          onClick={() => handleMailingChange(MailingPreference.EMAIL)}
                          disabled={isReadOnly}
                          className={`flex-1 p-4 rounded-lg border-2 flex flex-col items-center justify-center space-y-2 transition-all ${isReadOnly ? 'opacity-60 cursor-not-allowed' : ''} ${
                            member.mailingPreference === MailingPreference.EMAIL
                              ? 'border-primary-500 bg-primary-50 text-primary-700'
                              : 'border-slate-200 text-slate-500 hover:border-slate-300'
                          }`}
                        >
                          <MailIcon className="w-8 h-8" />
                          <span className="font-bold">メール配信 (推奨)</span>
                          <span className="text-xs">ペーパーレス化にご協力ください</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleMailingChange(MailingPreference.POST)}
                          disabled={isReadOnly}
                          className={`flex-1 p-4 rounded-lg border-2 flex flex-col items-center justify-center space-y-2 transition-all ${isReadOnly ? 'opacity-60 cursor-not-allowed' : ''} ${
                            member.mailingPreference === MailingPreference.POST
                              ? 'border-orange-500 bg-orange-50 text-orange-700'
                              : 'border-slate-200 text-slate-500 hover:border-slate-300'
                          }`}
                        >
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                          <span className="font-bold">郵送</span>
                          <span className="text-xs">全てのお知らせが郵送されます</span>
                        </button>
                      </div>
                      
                      {member.mailingPreference === MailingPreference.EMAIL && (
                        <div className="mt-4 bg-blue-50 p-6 rounded-lg border border-blue-100 animate-fadeIn">
                          <label className="block text-sm font-bold text-blue-900 mb-1">メールアドレス (※必須)</label>
                          <input
                            disabled={isReadOnly}
                            type="email"
                            name="email"
                            value={member.email || ''}
                            onChange={handleChange}
                            className={getInputClass('email')}
                            placeholder="user@example.com"
                          />
                          {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                        </div>
                      )}
                  </div>

                  <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                      <h4 className="text-md font-bold text-slate-800 mb-2 flex items-center">
                        <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded mr-2">必須</span>
                        定期発送物（総会資料等）の送付先
                      </h4>
                      <p className="text-xs text-slate-500 mb-4">
                        ※年に3回程度、重要書類を郵送します。選択した送付先の住所入力は必須となります。
                      </p>
                      
                      <div className="flex space-x-6">
                        <label className={`flex items-center space-x-3 cursor-pointer p-4 rounded-lg border flex-1 transition-all ${isReadOnly ? 'opacity-60 cursor-not-allowed' : ''} ${member.preferredMailDestination === MailDestination.HOME ? 'bg-white border-primary-500 shadow-md ring-2 ring-primary-100' : 'bg-transparent border-slate-300'}`}>
                            <input 
                                disabled={isReadOnly}
                                type="radio" 
                                name="mailDestination" 
                                checked={member.preferredMailDestination === MailDestination.HOME} 
                                onChange={() => handleDestinationChange(MailDestination.HOME)}
                                className="form-radio h-5 w-5 text-primary-600"
                            />
                            <div className="flex flex-col">
                                <span className="font-bold text-slate-800 flex items-center"><HomeIcon className="w-4 h-4 mr-1"/>自宅</span>
                                <span className="text-xs text-slate-500">上記「2.自宅情報」へ送付</span>
                            </div>
                        </label>

                        <label className={`flex items-center space-x-3 cursor-pointer p-4 rounded-lg border flex-1 transition-all ${isReadOnly ? 'opacity-60 cursor-not-allowed' : ''} ${member.preferredMailDestination === MailDestination.OFFICE ? 'bg-white border-primary-500 shadow-md ring-2 ring-primary-100' : 'bg-transparent border-slate-300'}`}>
                            <input 
                                disabled={isReadOnly}
                                type="radio" 
                                name="mailDestination" 
                                checked={member.preferredMailDestination === MailDestination.OFFICE} 
                                onChange={() => handleDestinationChange(MailDestination.OFFICE)}
                                className="form-radio h-5 w-5 text-primary-600"
                            />
                            <div className="flex flex-col">
                                <span className="font-bold text-slate-800 flex items-center"><UsersIcon className="w-4 h-4 mr-1"/>勤務先</span>
                                <span className="text-xs text-slate-500">上記「3.勤務先情報」へ送付</span>
                            </div>
                        </label>
                      </div>
                  </div>
                  </>
              )}

            </div>
          </div>

          <div className="pt-6 border-t border-slate-200 flex justify-end">
            {!isReadOnly && (
                <button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-12 rounded-lg shadow-lg transform transition hover:-translate-y-0.5 text-lg">
                変更を保存する
                </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default MemberForm;
