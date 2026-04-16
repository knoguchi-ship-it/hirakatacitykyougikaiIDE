import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Member, MailingPreference, MailDestination, MemberType, PaymentStatus, Staff, StaffRole, Training, TransferAccountInfo } from '../types';
import { AlertTriangleIcon, MailIcon, CheckCircleIcon, BookOpenIcon, UsersIcon, HomeIcon, PlusIcon, SparklesIcon } from './Icons';
import { api } from '../services/api';
import StaffTrainingView from './StaffTrainingView';

const HALF_WIDTH_KANA_RE = /^[ｦ-ﾟ\s]+$/u;
const CARE_MANAGER_RE = /^\d{8}$/;
const POST_CODE_RE = /^\d{3}-?\d{4}$/;
const PHONE_RE = /^[0-9-]+$/;

// 全角カナ・ひらがな → 半角カナ変換（保存時に適用）
const toHalfWidthKana = (value: string): string => {
  let s = value.replace(/[\u3041-\u3096]/g, (c) => String.fromCharCode(c.charCodeAt(0) + 0x60));
  const fullToHalf: Record<string, string> = {
    'ア':'ｱ','イ':'ｲ','ウ':'ｳ','エ':'ｴ','オ':'ｵ',
    'カ':'ｶ','キ':'ｷ','ク':'ｸ','ケ':'ｹ','コ':'ｺ',
    'サ':'ｻ','シ':'ｼ','ス':'ｽ','セ':'ｾ','ソ':'ｿ',
    'タ':'ﾀ','チ':'ﾁ','ツ':'ﾂ','テ':'ﾃ','ト':'ﾄ',
    'ナ':'ﾅ','ニ':'ﾆ','ヌ':'ﾇ','ネ':'ﾈ','ノ':'ﾉ',
    'ハ':'ﾊ','ヒ':'ﾋ','フ':'ﾌ','ヘ':'ﾍ','ホ':'ﾎ',
    'マ':'ﾏ','ミ':'ﾐ','ム':'ﾑ','メ':'ﾒ','モ':'ﾓ',
    'ヤ':'ﾔ','ユ':'ﾕ','ヨ':'ﾖ',
    'ラ':'ﾗ','リ':'ﾘ','ル':'ﾙ','レ':'ﾚ','ロ':'ﾛ',
    'ワ':'ﾜ','ヲ':'ｦ','ン':'ﾝ',
    'ァ':'ｧ','ィ':'ｨ','ゥ':'ｩ','ェ':'ｪ','ォ':'ｫ',
    'ッ':'ｯ','ャ':'ｬ','ュ':'ｭ','ョ':'ｮ',
    'ガ':'ｶﾞ','ギ':'ｷﾞ','グ':'ｸﾞ','ゲ':'ｹﾞ','ゴ':'ｺﾞ',
    'ザ':'ｻﾞ','ジ':'ｼﾞ','ズ':'ｽﾞ','ゼ':'ｾﾞ','ゾ':'ｿﾞ',
    'ダ':'ﾀﾞ','ヂ':'ﾁﾞ','ヅ':'ﾂﾞ','デ':'ﾃﾞ','ド':'ﾄﾞ',
    'バ':'ﾊﾞ','ビ':'ﾋﾞ','ブ':'ﾌﾞ','ベ':'ﾍﾞ','ボ':'ﾎﾞ',
    'パ':'ﾊﾟ','ピ':'ﾋﾟ','プ':'ﾌﾟ','ペ':'ﾍﾟ','ポ':'ﾎﾟ',
    'ヴ':'ｳﾞ','ヰ':'ｲ','ヱ':'ｴ','ー':'ｰ','。':'｡','「':'｢','」':'｣','、':'､','・':'･',
  };
  return s.replace(/[ァ-ヶー。「」、・]/g, (c) => fullToHalf[c] || c);
};

interface MemberFormProps {
  initialMember: Member;
  activeStaffId?: string;
  activeStaffRole?: StaffRole;
  loginId?: string;
  isAdmin?: boolean;
  defaultBusinessStaffLimit: number;
  historyLookbackMonths: number;
  annualFeePaymentGuidance: string;
  annualFeeTransferAccount: TransferAccountInfo;
  trainings: Training[];
  onSave: (member: Member) => void;
  onLogout?: () => void;
}

const MemberForm: React.FC<MemberFormProps> = ({ initialMember, activeStaffId, activeStaffRole, loginId, isAdmin, defaultBusinessStaffLimit, historyLookbackMonths, annualFeePaymentGuidance, annualFeeTransferAccount, trainings, onSave, onLogout }) => {
  const [member, setMember] = useState<Member>(initialMember);
  const [warning, setWarning] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null); // UX: Success feedback
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  // UX: Loading state for application button
  const [submittingTrainingId, setSubmittingTrainingId] = useState<string | null>(null);
  const [expandedTrainingId, setExpandedTrainingId] = useState<string | null>(null);
  const [selectedHistoryTrainingId, setSelectedHistoryTrainingId] = useState<string | null>(null);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', nextPassword: '', confirmPassword: '' });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [profileEditModalOpen, setProfileEditModalOpen] = useState(false);
  const [annualFeeGuideOpen, setAnnualFeeGuideOpen] = useState(false);
  const [withdrawalPassword, setWithdrawalPassword] = useState('');
  const [withdrawalError, setWithdrawalError] = useState<string | null>(null);
  const [withdrawalSubmitting, setWithdrawalSubmitting] = useState(false);
  const [withdrawalConfirmOpen, setWithdrawalConfirmOpen] = useState(false);
  const [cancelWithdrawalPassword, setCancelWithdrawalPassword] = useState('');
  const [cancelWithdrawalError, setCancelWithdrawalError] = useState<string | null>(null);
  const [cancelWithdrawalSubmitting, setCancelWithdrawalSubmitting] = useState(false);
  // v106: 職員別研修モーダル
  const [trainingViewStaffId, setTrainingViewStaffId] = useState<string | null>(null);

  const historyRef = useRef<HTMLDivElement>(null); // UX: For auto-scrolling
  
  // Fix for async state updates: Track latest member state
  // memberRef is no longer needed as we create newMember synchronously

  const isBusiness = member.type === MemberType.BUSINESS;

  // Active staff context for business-member views
  // If activeStaffId is provided from the current session context, use it.
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
  const representativeStaff = isBusiness ? (member.staff?.find(s => s.role === 'REPRESENTATIVE') || null) : null;
  const isRepresentativeOperator = isBusiness && currentStaff?.role === 'REPRESENTATIVE' && currentStaff?.id === representativeStaff?.id;
  const representativeProfile = isBusiness
    ? {
        lastName: representativeStaff?.lastName || member.lastName || '',
        firstName: representativeStaff?.firstName || member.firstName || '',
        lastKana: representativeStaff?.lastKana || member.lastKana || '',
        firstKana: representativeStaff?.firstKana || member.firstKana || '',
        careManagerNumber: representativeStaff?.careManagerNumber || member.careManagerNumber || '',
      }
    : {
        lastName: member.lastName || '',
        firstName: member.firstName || '',
        lastKana: member.lastKana || '',
        firstKana: member.firstKana || '',
        careManagerNumber: member.careManagerNumber || '',
      };
  const buildFullName = (lastName?: string, firstName?: string, fallback?: string) => {
    const joined = `${lastName || ''} ${firstName || ''}`.trim();
    return joined || fallback || '';
  };
  const normalizeCareManagerInput = (value: string) => value.replace(/\D/g, '').slice(0, 8);
  const validateHalfWidthKana = (value: string) => !value.trim() || HALF_WIDTH_KANA_RE.test(value.trim());
  const validateCareManagerNumber = (value: string) => !value.trim() || CARE_MANAGER_RE.test(value.trim());
  const validatePostCode = (value: string) => !value.trim() || POST_CODE_RE.test(value.trim());
  const validatePhone = (value: string) => !value.trim() || PHONE_RE.test(value.trim());
  const syncBusinessRepresentativeSnapshot = (target: Member): Member => {
    if (target.type !== MemberType.BUSINESS) return target;
    const rep = target.staff?.find((staff) => staff.role === 'REPRESENTATIVE');
    if (!rep) return target;
    return {
      ...target,
      lastName: rep.lastName || target.lastName || '',
      firstName: rep.firstName || target.firstName || '',
      lastKana: rep.lastKana || target.lastKana || '',
      firstKana: rep.firstKana || target.firstKana || '',
      careManagerNumber: rep.careManagerNumber || target.careManagerNumber || '',
    };
  };
  // REPRESENTATIVE・ADMIN は編集可、STAFF は閲覧のみ
  const isReadOnly = isBusiness ? (currentStaff?.role !== 'ADMIN' && currentStaff?.role !== 'REPRESENTATIVE') : false;
  const canEditRepresentativeFields = isBusiness ? isRepresentativeOperator : !isReadOnly;
  const canEditBusinessOfficeFields = isBusiness ? isRepresentativeOperator : !isReadOnly;
  const isBusinessStaffSelfMode = isBusiness && currentStaff?.role === 'STAFF';
  const canStaffSelfEditField = (staffId: string, field: keyof Staff) => (
    isBusinessStaffSelfMode &&
    staffId === operatingStaffId &&
    (field === 'name' || field === 'kana' || field === 'email')
  );

  // データ移行期対応: 初期値が空の必須フィールドは空白を許容する
  const initiallyEmptyFields = useMemo(() => {
    const empty = new Set<string>();
    const m = initialMember;
    const repStaff = m.type === MemberType.BUSINESS ? (m.staff?.find(s => s.role === 'REPRESENTATIVE') ?? null) : null;
    if (!String(repStaff?.lastName || m.lastName || '').trim()) empty.add('lastName');
    if (!String(repStaff?.firstName || m.firstName || '').trim()) empty.add('firstName');
    if (!String(repStaff?.lastKana || m.lastKana || '').trim()) empty.add('lastKana');
    if (!String(repStaff?.firstKana || m.firstKana || '').trim()) empty.add('firstKana');
    if (!String(repStaff?.careManagerNumber || m.careManagerNumber || '').trim()) empty.add('careManagerNumber');
    if (!String(m.mobilePhone || '').trim()) empty.add('mobilePhone');
    if (!String(m.email || '').trim()) empty.add('email');
    if (!String(m.officePostCode || '').trim()) empty.add('officePostCode');
    if (!String(m.officePrefecture || '').trim()) empty.add('officePrefecture');
    if (!String(m.officeCity || '').trim()) empty.add('officeCity');
    if (!String(m.officeAddressLine || '').trim()) empty.add('officeAddressLine');
    if (!String(m.officeName || '').trim()) empty.add('officeName');
    if (!String(m.officeNumber || '').trim()) empty.add('officeNumber');
    if (!String(m.phone || '').trim()) empty.add('phone');
    if (!String(m.fax || '').trim()) empty.add('fax');
    if (!String(m.homePostCode || '').trim()) empty.add('homePostCode');
    if (!String(m.homePrefecture || '').trim()) empty.add('homePrefecture');
    if (!String(m.homeCity || '').trim()) empty.add('homeCity');
    if (!String(m.homeAddressLine || '').trim()) empty.add('homeAddressLine');
    return empty;
  }, [initialMember]);

  // 職員ごとの初期空フィールド（staff.id → Set<'name'|'kana'>）
  const initiallyEmptyStaffFields = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    (initialMember.staff || []).forEach(staff => {
      const empty = new Set<string>();
      if (!String(staff.name || '').trim()) empty.add('name');
      if (!String(staff.kana || '').trim()) empty.add('kana');
      if (empty.size > 0) map[staff.id] = empty;
    });
    return map;
  }, [initialMember]);

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

  // 2. Filter history based on participated IDs and lookback period
  const trainingHistory = trainings
    .filter((t) => participatedIds.includes(t.id))
    .filter((t) => {
      const date = new Date(t.date);
      if (Number.isNaN(date.getTime())) return true;
      const threshold = new Date();
      threshold.setMonth(threshold.getMonth() - Math.max(1, Math.floor(historyLookbackMonths || 18)));
      return date.getTime() >= threshold.getTime();
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const selectedHistoryTraining = trainingHistory.find((t) => t.id === selectedHistoryTrainingId) || null;

  useEffect(() => {
    if (trainingHistory.length === 0) {
      setSelectedHistoryTrainingId(null);
      return;
    }
    if (!selectedHistoryTrainingId || !trainingHistory.some((t) => t.id === selectedHistoryTrainingId)) {
      setSelectedHistoryTrainingId(trainingHistory[0].id);
    }
  }, [trainingHistory, selectedHistoryTrainingId]);

  // 3. Filter NEW available trainings (Open AND Not participated)
  const availableTrainings = trainings.filter(t => 
    t.status === 'OPEN' && !participatedIds.includes(t.id)
  );

  const currentFeeStatus = member.annualFeeHistory[0];
  const displayedTransferAccount = currentFeeStatus?.transferAccount || annualFeeTransferAccount;
  const annualFeeGuideId = `annual-fee-guide-${member.id}`;
  const annualFeeGuidanceText = String(annualFeePaymentGuidance || '').trim();
  const hasAnnualFeeGuidance = Boolean(annualFeeGuidanceText || displayedTransferAccount);
  const currentLoginId = isBusiness ? (currentStaff?.loginId || member.loginId || '-') : (member.loginId || '-');
  const currentDisplayName = isBusiness
    ? (currentStaff?.name || buildFullName(representativeProfile.lastName, representativeProfile.firstName, member.officeName))
    : buildFullName(member.lastName, member.firstName, member.id);
  useEffect(() => {
    setAnnualFeeGuideOpen(false);
  }, [member.id, currentFeeStatus?.year, currentFeeStatus?.status]);
  const memberStatusLabel = member.status === 'ACTIVE'
    ? '有効会員'
    : member.status === 'WITHDRAWAL_SCHEDULED'
      ? '退会予定'
      : '退会済み';
  const memberStatusDescription = member.status === 'ACTIVE'
    ? '現在ご利用中の会員資格です。'
    : member.status === 'WITHDRAWAL_SCHEDULED'
      ? `退会予定として受け付け済みです。${member.withdrawnDate ? `${member.withdrawnDate} に退会予定です。` : ''}`
      : '退会手続きが完了しています。';
  
  // Display name for the training table header
  const trainingTargetName = isBusiness 
    ? (currentStaff?.name ? `${currentStaff.name} 様` : '選択された職員') 
    : 'あなた';
  const effectiveStaffLimit = isBusiness ? (member.staffLimit ?? defaultBusinessStaffLimit) : 0;

  // --- Action Handlers ---

  const handleTrainingApply = async (trainingId: string) => {
      if (submittingTrainingId) return; // Prevent double click

      const training = trainings.find(t => t.id === trainingId);
      if (!training) return;
      
      const confirmMsg = isBusiness 
        ? `「${training.title}」に\n職員: ${currentStaff?.name} 様の名義で申し込みますか？`
        : `「${training.title}」に申し込みますか？`;

      if (!window.confirm(confirmMsg)) return;
      setSubmittingTrainingId(trainingId);

      try {
        await api.applyTraining({
          trainingId,
          memberId: member.id,
          staffId: isBusiness ? (operatingStaffId || undefined) : undefined,
        });

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

        onSave(newMember);
        setMember(newMember);
        setSuccessMsg(`「${training.title}」への申し込みが完了しました。`);
        setTimeout(() => {
          historyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      } catch (err) {
        alert(err instanceof Error ? err.message : '研修申込に失敗しました。');
      } finally {
        setSubmittingTrainingId(null);
      }
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
    const { name, value, type } = e.target;
    let normalizedValue: string | boolean = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    if (typeof normalizedValue === 'string') {
      if (name === 'careManagerNumber') {
        normalizedValue = normalizeCareManagerInput(normalizedValue);
      }
    }
    setMember(prev => {
      const next = { ...prev, [name]: normalizedValue } as Member;
      if (name === 'status' && normalizedValue === 'ACTIVE') {
        next.withdrawnDate = '';
        next.midYearWithdrawal = false;
      }
      return next;
    });
    if (errors[name]) {
        setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[name];
            return newErrors;
        });
    }
  };

  const handleRepresentativeFieldChange = (field: 'lastName' | 'firstName' | 'lastKana' | 'firstKana', value: string) => {
    if (!isBusiness || isReadOnly) return;
    const representativeId = representativeStaff?.id;
    if (!representativeId) return;
    const normalizedValue = value;
    setMember(prev => {
      const nextStaff = prev.staff?.map(s => {
        if (s.id !== representativeId) return s;
        const next = { ...s, [field]: normalizedValue } as Staff;
        next.name = buildFullName(
          field === 'lastName' ? normalizedValue : next.lastName,
          field === 'firstName' ? normalizedValue : next.firstName,
          next.name
        );
        next.kana = buildFullName(
          field === 'lastKana' ? normalizedValue : next.lastKana,
          field === 'firstKana' ? normalizedValue : next.firstKana,
          next.kana
        );
        return next;
      });
      return syncBusinessRepresentativeSnapshot({ ...prev, staff: nextStaff });
    });
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // Staff Management Logic
  const handleStaffChange = (id: string, field: keyof Staff, value: string | boolean) => {
    if (isReadOnly && !canStaffSelfEditField(id, field)) return;
    setMember(prev => ({
        ...prev,
        staff: prev.staff?.map(s => {
          if (s.id !== id) return s;
          const next = { ...s, [field]: value } as Staff;
          if (field === 'status' && value === 'ENROLLED') {
            next.withdrawnDate = '';
            next.midYearWithdrawal = false;
          }
          return next;
        })
    }));
  };

  const addStaff = () => {
    if (isReadOnly) return;
    const count = (member.staff || []).length;
    if (isBusiness && count >= effectiveStaffLimit) {
      alert(`職員数の上限（${effectiveStaffLimit}名）に達しているため追加できません。`);
      return;
    }
    const newStaff: Staff = {
        id: `S${Date.now()}`,
        name: '',
        kana: '',
        email: '',
        role: 'STAFF',
        status: 'ENROLLED',
        joinedDate: '',
        withdrawnDate: '',
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

  const validate = (memberOverride?: Member) => {
    const m = memberOverride ?? member;
    const repStaff = m.type === MemberType.BUSINESS ? (m.staff?.find(s => s.role === 'REPRESENTATIVE') || null) : null;
    const repProfile = m.type === MemberType.BUSINESS
      ? {
          lastName: repStaff?.lastName || m.lastName || '',
          firstName: repStaff?.firstName || m.firstName || '',
          lastKana: repStaff?.lastKana || m.lastKana || '',
          firstKana: repStaff?.firstKana || m.firstKana || '',
          careManagerNumber: repStaff?.careManagerNumber || m.careManagerNumber || '',
        }
      : {
          lastName: m.lastName || '',
          firstName: m.firstName || '',
          lastKana: m.lastKana || '',
          firstKana: m.firstKana || '',
          careManagerNumber: m.careManagerNumber || '',
        };
    const newErrors: { [key: string]: string } = {};

    if (isBusinessStaffSelfMode) {
      const ownStaff = m.staff?.find((staff) => staff.id === operatingStaffId);
      const ownStaffInitialEmpty = initiallyEmptyStaffFields[operatingStaffId ?? ''] ?? new Set<string>();
      if (!ownStaff?.name?.trim() && !ownStaffInitialEmpty.has('name')) newErrors.staff_self_name = '氏名は必須です';
      if (!ownStaff?.kana?.trim() && !ownStaffInitialEmpty.has('kana')) newErrors.staff_self_kana = 'フリガナは必須です';
      setErrors(newErrors);
      return newErrors;
    }
    const isSupportMember = m.type === MemberType.SUPPORT;
    const officeDestination = m.preferredMailDestination === MailDestination.OFFICE;
    const homeDestination = m.preferredMailDestination === MailDestination.HOME;

    if (!repProfile.lastName?.trim()) newErrors.lastName = '必須項目です';
    if (!repProfile.firstName?.trim()) newErrors.firstName = '必須項目です';
    if (!repProfile.lastKana?.trim()) newErrors.lastKana = '必須項目です';
    else if (!validateHalfWidthKana(repProfile.lastKana)) newErrors.lastKana = 'セイは半角ｶﾅで入力してください';
    if (!repProfile.firstKana?.trim()) newErrors.firstKana = '必須項目です';
    else if (!validateHalfWidthKana(repProfile.firstKana)) newErrors.firstKana = 'メイは半角ｶﾅで入力してください';
    if (!isSupportMember && !repProfile.careManagerNumber?.trim()) {
      newErrors.careManagerNumber = '賛助会員以外は必須です';
    } else if (!validateCareManagerNumber(repProfile.careManagerNumber || '')) {
      newErrors.careManagerNumber = '8桁の半角数字で入力してください';
    }

    if (!m.phone?.trim() && !m.mobilePhone?.trim()) {
      newErrors.phone = '勤務先電話番号または携帯電話番号のどちらかを入力してください';
      newErrors.mobilePhone = '勤務先電話番号または携帯電話番号のどちらかを入力してください';
    }

    if (!validatePhone(m.phone || '')) newErrors.phone = '電話番号は半角数字とハイフンで入力してください';
    if (!validatePhone(m.mobilePhone || '')) newErrors.mobilePhone = '携帯電話番号は半角数字とハイフンで入力してください';
    if (!validatePhone(m.fax || '')) newErrors.fax = 'FAX番号は半角数字とハイフンで入力してください';

    if (!isBusiness && m.mailingPreference === MailingPreference.EMAIL && !m.email) {
       newErrors.email = '必須項目です';
    }

    if (officeDestination) {
      if (!m.officeName?.trim()) newErrors.officeName = '勤務先へ郵送する場合は事業所名が必須です';
    }
    if (homeDestination) {
      if (!m.homePostCode) newErrors.homePostCode = '自宅へ郵送する場合は必須です';
      if (!m.homePrefecture) newErrors.homePrefecture = '自宅へ郵送する場合は必須です';
      if (!m.homeCity) newErrors.homeCity = '自宅へ郵送する場合は必須です';
      if (!m.homeAddressLine) newErrors.homeAddressLine = '自宅へ郵送する場合は必須です';
    }

    if (isBusiness) {
      if (!m.officeName?.trim() && !initiallyEmptyFields.has('officeName')) newErrors.officeName = '必須項目です';
      if (!m.officeNumber?.trim() && !initiallyEmptyFields.has('officeNumber')) newErrors.officeNumber = '必須項目です';
      if (!m.officePostCode && !initiallyEmptyFields.has('officePostCode')) newErrors.officePostCode = '必須です';
      if (!m.officePrefecture && !initiallyEmptyFields.has('officePrefecture')) newErrors.officePrefecture = '必須です';
      if (!m.officeCity && !initiallyEmptyFields.has('officeCity')) newErrors.officeCity = '必須です';
      if (!m.officeAddressLine && !initiallyEmptyFields.has('officeAddressLine')) newErrors.officeAddressLine = '必須です';
      if (!m.phone?.trim() && !initiallyEmptyFields.has('phone')) newErrors.phone = '必須項目です';
    }

    if (!validatePostCode(m.officePostCode || '')) newErrors.officePostCode = '郵便番号は 123-4567 形式で入力してください';
    if (!validatePostCode(m.homePostCode || '')) newErrors.homePostCode = '郵便番号は 123-4567 形式で入力してください';

    const memberJoined = m.joinedDate ? new Date(m.joinedDate) : null;
    const memberWithdrawn = m.withdrawnDate ? new Date(m.withdrawnDate) : null;
    if (m.joinedDate && (!memberJoined || Number.isNaN(memberJoined.getTime()))) {
      newErrors.joinedDate = '有効な日付を入力してください';
    }
    if (m.withdrawnDate && (!memberWithdrawn || Number.isNaN(memberWithdrawn.getTime()))) {
      newErrors.withdrawnDate = '有効な日付を入力してください';
    }
    if (memberJoined && memberWithdrawn && memberJoined.getTime() > memberWithdrawn.getTime()) {
      newErrors.withdrawnDate = '退会日は入会日以降にしてください';
    }
    if (m.status === 'WITHDRAWN' && !m.withdrawnDate) {
      newErrors.withdrawnDate = '退会済みの場合は退会日が必須です';
    }

    if (isBusiness) {
      (m.staff || []).forEach((staff, index) => {
        const prefix = `staff_${index}`;
        const staffInitiallyEmpty = initiallyEmptyStaffFields[staff.id] ?? new Set<string>();
        if (!staff.name?.trim() && !staffInitiallyEmpty.has('name')) newErrors[`${prefix}_name`] = '職員氏名は必須です';
        if (!staff.kana?.trim() && !staffInitiallyEmpty.has('kana')) newErrors[`${prefix}_kana`] = '職員フリガナは必須です';
        const joined = staff.joinedDate ? new Date(staff.joinedDate) : null;
        const withdrawn = staff.withdrawnDate ? new Date(staff.withdrawnDate) : null;
        if (staff.joinedDate && (!joined || Number.isNaN(joined.getTime()))) {
          newErrors[`${prefix}_joinedDate`] = '職員入会日は有効な日付で入力してください';
        }
        if (staff.withdrawnDate && (!withdrawn || Number.isNaN(withdrawn.getTime()))) {
          newErrors[`${prefix}_withdrawnDate`] = '職員退会日は有効な日付で入力してください';
        }
        if (joined && withdrawn && joined.getTime() > withdrawn.getTime()) {
          newErrors[`${prefix}_withdrawnDate`] = '職員退会日は入会日以降にしてください';
        }
        if ((staff.status || 'ENROLLED') === 'LEFT' && !staff.withdrawnDate) {
          newErrors[`${prefix}_withdrawnDate`] = '退職済み職員は退会日が必須です';
        }
      });
    }

    setErrors(newErrors);
    return newErrors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly && !isBusinessStaffSelfMode) return;
    // 保存前にセイ・メイを半角カナに変換（全角カナ・ひらがな → 半角カナ）
    const kanaConvertedMember: Member = {
      ...member,
      lastKana: member.lastKana ? toHalfWidthKana(member.lastKana) : member.lastKana,
      firstKana: member.firstKana ? toHalfWidthKana(member.firstKana) : member.firstKana,
      staff: member.staff?.map(s => ({
        ...s,
        lastKana: s.lastKana ? toHalfWidthKana(s.lastKana) : s.lastKana,
        firstKana: s.firstKana ? toHalfWidthKana(s.firstKana) : s.firstKana,
      })),
    };
    const nextErrors = validate(kanaConvertedMember);
    if (Object.keys(nextErrors).length > 0) {
        setWarning("入力内容に不備があります。赤枠の項目を確認し、必須事項を入力してください。");
        const firstErrorField = Object.keys(nextErrors)[0];
        if (firstErrorField) {
          setTimeout(() => focusField(firstErrorField), 0);
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }
    setWarning(null);
    const officeNameText = (kanaConvertedMember.officeName || '').trim();
    const noOfficeAffiliation = !isBusiness && (officeNameText === '' || officeNameText === '勤務なし');
    const normalizedMemberBase = noOfficeAffiliation
      ? {
          ...kanaConvertedMember,
          officeName: '',
          officeNumber: '',
          officePostCode: '',
          officePrefecture: '',
          officeCity: '',
          officeAddressLine: '',
          phone: '',
          fax: '',
          preferredMailDestination:
            kanaConvertedMember.preferredMailDestination === MailDestination.OFFICE
              ? MailDestination.HOME
              : kanaConvertedMember.preferredMailDestination,
        }
      : kanaConvertedMember;
    const normalizedMember = isBusiness
      ? syncBusinessRepresentativeSnapshot({
          ...normalizedMemberBase,
          preferredMailDestination: MailDestination.OFFICE,
        })
      : normalizedMemberBase;
    setMember(normalizedMember);
    onSave(normalizedMember);
    setProfileEditModalOpen(false);
    alert("登録情報を更新しました。");
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordForm.currentPassword) {
      setPasswordError('現在のパスワードを入力してください。');
      setPasswordSuccess(null);
      return;
    }
    if (!passwordForm.nextPassword || !passwordForm.confirmPassword) {
      setPasswordError('新しいパスワード・確認用をすべて入力してください。');
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

  const getInputClass = (fieldName: string, disabled = false) => {
    const baseClass = "w-full rounded-md shadow-sm border p-2";
    const errorClass = errors[fieldName] 
        ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500' 
        : 'border-slate-300 focus:border-primary-500 focus:ring-primary-500';
    const readOnlyClass = (isReadOnly || disabled) ? 'bg-slate-100 text-slate-600 border-slate-300 cursor-not-allowed opacity-100 disabled:bg-slate-100 disabled:text-slate-600 disabled:border-slate-300' : '';
    
    return `${baseClass} ${errorClass} ${readOnlyClass}`;
  };

  const getFieldAnchorId = (fieldName: string) => `member-form-${fieldName}`;
  const errorSummaryEntries = Object.entries(errors);
  const focusField = (fieldName: string) => {
    const target = document.getElementById(getFieldAnchorId(fieldName)) as HTMLElement | null;
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if ('focus' in target) target.focus();
  };

  const readOnlyDisplayClass = "w-full min-h-[42px] rounded-md border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-700 flex items-center";

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      
      {/* 1. Member Status Summary Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800 flex items-center">
                <UsersIcon className="w-5 h-5 mr-2 text-slate-500" />
                現在の会員ステータス
            </h2>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${member.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : member.status === 'WITHDRAWAL_SCHEDULED' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>
                {member.status === 'ACTIVE' ? '有効会員' : member.status === 'WITHDRAWAL_SCHEDULED' ? '退会予定' : '退会済み'}
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
                        {isBusiness ? '正会員 (事業所)' : (member.type === MemberType.SUPPORT ? '賛助会員' : '正会員 (個人)')}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">登録番号: {member.id}</p>
                </div>
            </div>
            <div className="flex items-start space-x-3">
                <div className="bg-sky-50 p-2 rounded-lg text-sky-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M5 7h14M5 17h14"/></svg>
                </div>
                <div>
                    <p className="text-sm text-slate-500 font-bold mb-1">氏名</p>
                    <p className="text-lg font-bold text-slate-800">{currentDisplayName}</p>
                    {isBusiness && currentStaff?.role && (
                        <p className="text-xs text-slate-400 mt-1">
                            {currentStaff.role === 'REPRESENTATIVE' ? '代表者' : currentStaff.role === 'ADMIN' ? '管理者' : 'メンバー'}
                        </p>
                    )}
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
                    <p className="text-sm text-slate-500 font-bold mb-1">年会費納入状況</p>
                    {currentFeeStatus && (
                        <div className={`mb-3 rounded-xl border px-4 py-3 ${currentFeeStatus.status === PaymentStatus.PAID ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                            <div className="flex flex-wrap items-center gap-2">
                                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${currentFeeStatus.status === PaymentStatus.PAID ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'}`}>
                                    {currentFeeStatus.status === PaymentStatus.PAID ? '納入済み' : '未納'}
                                </span>
                                <p className={`text-sm font-medium ${currentFeeStatus.status === PaymentStatus.PAID ? 'text-green-900' : 'text-red-900'}`}>
                                    {currentFeeStatus.year}年度
                                    {currentFeeStatus.status === PaymentStatus.PAID
                                      ? `${currentFeeStatus.confirmedDate ? `は ${currentFeeStatus.confirmedDate} に納入確認済みです。` : 'は納入確認済みです。'}`
                                      : 'はまだ納入確認ができていません。'}
                                </p>
                            </div>
                            {currentFeeStatus.status === PaymentStatus.UNPAID && hasAnnualFeeGuidance && (
                                <div className="mt-3">
                                    <button
                                        type="button"
                                        onClick={() => setAnnualFeeGuideOpen((prev) => !prev)}
                                        aria-expanded={annualFeeGuideOpen}
                                        aria-controls={annualFeeGuideId}
                                        className="inline-flex items-center rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-bold text-red-700 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                                    >
                                        {annualFeeGuideOpen ? '納入方法を閉じる' : '納入方法を見る'}
                                    </button>
                                    {annualFeeGuideOpen && (
                                        <div id={annualFeeGuideId} className="mt-3 space-y-3 rounded-lg border border-red-200 bg-white p-4 text-sm text-slate-700">
                                            {annualFeeGuidanceText && (
                                                <div>
                                                    <p className="font-bold text-slate-900">納入案内</p>
                                                    <p className="mt-1 whitespace-pre-line">{annualFeeGuidanceText}</p>
                                                </div>
                                            )}
                                            {displayedTransferAccount && (
                                                <div>
                                                    <p className="font-bold text-slate-900">振込先</p>
                                                    <dl className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                                                        <div>
                                                            <dt className="text-xs text-slate-500">銀行名</dt>
                                                            <dd>{displayedTransferAccount.bankName}</dd>
                                                        </div>
                                                        <div>
                                                            <dt className="text-xs text-slate-500">支店名</dt>
                                                            <dd>{displayedTransferAccount.branchName}</dd>
                                                        </div>
                                                        <div>
                                                            <dt className="text-xs text-slate-500">口座種別</dt>
                                                            <dd>{displayedTransferAccount.accountType}</dd>
                                                        </div>
                                                        <div>
                                                            <dt className="text-xs text-slate-500">口座番号</dt>
                                                            <dd>{displayedTransferAccount.accountNumber}</dd>
                                                        </div>
                                                        <div className="sm:col-span-2">
                                                            <dt className="text-xs text-slate-500">口座名義</dt>
                                                            <dd>{displayedTransferAccount.accountName}</dd>
                                                        </div>
                                                    </dl>
                                                    {displayedTransferAccount.note && (
                                                        <p className="mt-2 text-xs text-slate-500 whitespace-pre-line">{displayedTransferAccount.note}</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                    <div className="space-y-2">
                        {member.annualFeeHistory.map((record) => (
                             <div key={record.year} className="flex justify-between items-center rounded-lg border border-slate-200 px-3 py-2 text-sm">
                                <span className="text-slate-700">{record.year}年度</span>
                                <span className={`font-bold ${record.status === PaymentStatus.PAID ? 'text-green-700' : 'text-red-600'}`}>
                                    {record.status === PaymentStatus.PAID ? '納入済み' : '未納'}
                                </span>
                             </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800">認証情報</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">ログインID（介護支援専門員番号 / 賛助会員は9始まり9桁）</label>
              <input type="text" value={currentLoginId} disabled className="w-full rounded-md shadow-sm border p-2 bg-slate-100 text-slate-600 font-mono" />
            </div>
            <div className="md:col-span-2 flex items-center justify-between">
              <div>
                {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}
                {passwordSuccess && <p className="text-sm text-green-600">{passwordSuccess}</p>}
              </div>
              <button
                type="button"
                onClick={() => setPasswordModalOpen(true)}
                title="別ウィンドウで開きます"
                className="px-4 py-2 rounded-lg text-sm font-bold border text-cyan-900 bg-cyan-50 border-cyan-300 hover:bg-cyan-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 after:ml-1 after:content-['↗']"
              >
                パスワード変更
              </button>
            </div>
          </div>
          <p className="mt-3 text-xs text-cyan-800">↗ アイコン付きボタンは別ウィンドウで開きます。</p>
        </div>
      </div>

      {passwordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setPasswordModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">パスワード変更</h3>
            <form onSubmit={handlePasswordChange} className="space-y-4">
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
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="px-4 py-2 border rounded-lg" onClick={() => setPasswordModalOpen(false)}>閉じる</button>
                <button
                  type="submit"
                  disabled={passwordSubmitting}
                  className={`px-4 py-2 rounded-lg text-white font-bold ${passwordSubmitting ? 'bg-slate-400' : 'bg-slate-700 hover:bg-slate-800'}`}
                >
                  {passwordSubmitting ? '変更中...' : '変更する'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEW: Available Trainings Section */}
      <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden animate-fadeIn">
        <div className="bg-gradient-to-r from-primary-50 to-indigo-50 px-6 py-4 border-b border-primary-100 flex justify-between items-center">
            <h2 className="text-lg font-bold text-primary-900 flex items-center">
                <SparklesIcon className="w-5 h-5 mr-2 text-yellow-500" />
                現在受付中の研修
            </h2>
            <span className="text-xs font-medium bg-white text-primary-700 px-3 py-1 rounded-full border border-primary-100 shadow-sm">
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
                                <p className="text-sm text-slate-600">{training.location} (定員 {training.capacity}名)</p>
                                <div className="mt-2 flex items-center gap-3">
                                  <button
                                    type="button"
                                    onClick={() => setExpandedTrainingId((prev) => (prev === training.id ? null : training.id))}
                                    className="text-sm text-primary-700 hover:text-primary-900 underline"
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
                                    : 'bg-primary-600 hover:bg-primary-700 hover:-translate-y-0.5 text-white'
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
            <p className="text-xs text-slate-500 mt-1">表示期間: 過去 {historyLookbackMonths} か月</p>
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
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">開催場所</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">状態</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {trainingHistory.map(t => (
                            <tr
                              key={t.id}
                              className={`cursor-pointer ${selectedHistoryTrainingId === t.id ? 'bg-primary-50/60' : ''} ${successMsg && t.id === trainingHistory[trainingHistory.length-1].id ? 'bg-green-50/50 transition-colors duration-1000' : ''}`}
                              onClick={() => setSelectedHistoryTrainingId(t.id)}
                            >
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{t.date}</td>
                                <td className="px-6 py-4 text-sm font-medium text-slate-900 underline decoration-dotted">{t.title}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{t.location || '-'}</td>
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
        {selectedHistoryTraining && (
          <div className="border-t border-slate-200 p-6 space-y-3">
            <h3 className="text-lg font-bold text-slate-800">履歴詳細</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-slate-500">研修名</p>
                <p className="text-slate-800">{selectedHistoryTraining.title}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">開催日</p>
                <p className="text-slate-800">{selectedHistoryTraining.date}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">開催場所</p>
                <p className="text-slate-800">{selectedHistoryTraining.location || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">主催者</p>
                <p className="text-slate-800">{selectedHistoryTraining.organizer || '-'}</p>
              </div>
            </div>
            {selectedHistoryTraining.summary && (
              <div>
                <p className="text-xs text-slate-500">研修概要</p>
                <p className="text-sm text-slate-700">{selectedHistoryTraining.summary}</p>
              </div>
            )}
            {selectedHistoryTraining.description && (
              <div>
                <p className="text-xs text-slate-500">詳細説明</p>
                <p className="text-sm text-slate-700 whitespace-pre-line">{selectedHistoryTraining.description}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. Member Profile Form (Renamed to be secondary) */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">会員情報</h2>
          <button
            type="button"
            onClick={() => setProfileEditModalOpen(true)}
            title="別ウィンドウで開きます"
            className="px-4 py-2 rounded-lg text-sm font-bold border text-cyan-900 bg-cyan-50 border-cyan-300 hover:bg-cyan-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 after:ml-1 after:content-['↗']"
          >
            会員情報を確認・変更
          </button>
        </div>
        <div className="p-6 text-sm text-slate-600">
          会員情報の変更は「会員情報を変更」から実施してください。
          {isBusiness && (
            <div className="mt-2">
              現在の所属職員数: {(member.staff || []).length} / 上限 {effectiveStaffLimit} 名
            </div>
          )}
        </div>
      </div>

      {profileEditModalOpen && (
      <div className="fixed inset-0 z-50 flex items-start justify-center px-4 py-6 overflow-y-auto">
        <div className="absolute inset-0 bg-black/40" onClick={() => setProfileEditModalOpen(false)} />
        <div className="relative w-full max-w-5xl bg-white p-6 rounded-xl shadow-2xl border border-slate-200">
          <div className="flex items-start justify-between mb-2">
            <h2 className="text-xl font-bold text-slate-800">会員情報の確認・変更</h2>
            <button type="button" onClick={() => setProfileEditModalOpen(false)} className="text-slate-500 hover:text-slate-800">閉じる</button>
          </div>
          <div className="max-h-[80vh] overflow-y-auto pr-1">
      <div className="bg-white p-8 rounded-xl border border-slate-200">
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
        {errorSummaryEntries.length > 0 && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-bold text-red-700">修正が必要な項目があります</p>
            <ul className="mt-2 space-y-1 text-sm text-red-700">
              {errorSummaryEntries.map(([fieldName, message]) => (
                <li key={fieldName}>
                  <button type="button" className="text-left underline hover:no-underline" onClick={() => focusField(fieldName)}>
                    {message}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-10">
          
          {/* Section 1: Basic Info */}
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center border-b pb-2">
              <span className="w-6 h-6 bg-slate-200 text-slate-700 rounded-full flex items-center justify-center mr-2 text-sm font-bold">1</span>
              {isBusiness ? '代表者情報・所属職員' : '基本情報'}
            </h3>
            
            <div className="pl-8 space-y-8">
                {/* Representative Name */}
                <div>
                    {isBusiness && <h4 className="font-bold text-sm text-slate-800 mb-2">代表者情報</h4>}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">氏 (姓) (※)</label>
                            <input disabled={isBusiness ? !canEditRepresentativeFields : isReadOnly} type="text" name="lastName" value={representativeProfile.lastName} onChange={isBusiness ? (e) => handleRepresentativeFieldChange('lastName', e.target.value) : handleChange} className={getInputClass('lastName', isBusiness ? !canEditRepresentativeFields : isReadOnly)} />
                            {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">名 (名) (※)</label>
                            <input disabled={isBusiness ? !canEditRepresentativeFields : isReadOnly} type="text" name="firstName" value={representativeProfile.firstName} onChange={isBusiness ? (e) => handleRepresentativeFieldChange('firstName', e.target.value) : handleChange} className={getInputClass('firstName', isBusiness ? !canEditRepresentativeFields : isReadOnly)} />
                            {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">フリガナ (セイ) (※)</label>
                            <input id={getFieldAnchorId('lastKana')} disabled={isBusiness ? !canEditRepresentativeFields : isReadOnly} type="text" name="lastKana" value={representativeProfile.lastKana} onChange={isBusiness ? (e) => handleRepresentativeFieldChange('lastKana', e.target.value) : handleChange} className={getInputClass('lastKana', isBusiness ? !canEditRepresentativeFields : isReadOnly)} />
                            {errors.lastKana && <p className="text-xs text-red-500 mt-1">{errors.lastKana}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">フリガナ (メイ) (※)</label>
                            <input id={getFieldAnchorId('firstKana')} disabled={isBusiness ? !canEditRepresentativeFields : isReadOnly} type="text" name="firstKana" value={representativeProfile.firstKana} onChange={isBusiness ? (e) => handleRepresentativeFieldChange('firstKana', e.target.value) : handleChange} className={getInputClass('firstKana', isBusiness ? !canEditRepresentativeFields : isReadOnly)} />
                            {errors.firstKana && <p className="text-xs text-red-500 mt-1">{errors.firstKana}</p>}
                        </div>
                    </div>
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            介護支援専門員番号
                            {member.type !== MemberType.SUPPORT && <span className="text-red-500 ml-1">(※)</span>}
                        </label>
                        <input
                            id={getFieldAnchorId('careManagerNumber')}
                            disabled={true}
                            type="text"
                            name="careManagerNumber"
                            value={representativeProfile.careManagerNumber || ''}
                            onChange={handleChange}
                            className="w-full rounded-md shadow-sm border p-2 bg-slate-100 text-slate-500 cursor-not-allowed border-slate-300"
                            placeholder={member.type === MemberType.SUPPORT ? '賛助会員は任意' : '賛助会員以外は必須'}
                        />
                        {!isAdmin && <p className="text-xs text-slate-400 mt-1">ログインIDと連動しているため、この画面では変更できません。</p>}
                        {errors.careManagerNumber && <p className="text-xs text-red-500 mt-1">{errors.careManagerNumber}</p>}
                    </div>
                    {isBusiness && !canEditRepresentativeFields && (
                      <p className="mt-3 text-xs text-slate-500">
                        代表者情報は代表者本人のみ変更できます。
                      </p>
                    )}
                    {isBusiness && (
                      <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="mb-4">
                          <h5 className="text-sm font-bold text-slate-800">確認のみできる項目</h5>
                          <p className="mt-1 text-xs text-slate-500">
                            会員ステータスと入会日は、この画面では確認のみできます。
                          </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">会員ステータス</label>
                            <div aria-readonly="true" className={readOnlyDisplayClass}>
                              {memberStatusLabel}
                            </div>
                            <p className="text-xs text-slate-500 mt-1">この画面では変更できません。</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">入会日</label>
                            <div aria-readonly="true" className={readOnlyDisplayClass}>
                              {member.joinedDate || '未設定'}
                            </div>
                            <p className="text-xs text-slate-500 mt-1">この画面では変更できません。</p>
                            {errors.joinedDate && <p className="text-xs text-red-500 mt-1">{errors.joinedDate}</p>}
                          </div>
                        </div>
                      </div>
                    )}
                        {/* v106: 退会日・年度中退会は非表示（バックエンド自動管理） */}
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
                            {member.staff?.map((staff, staffIndex) => {
                                // v106: STAFF ロールは自分の行の氏名・フリガナ・メールのみ編集可
                                const isOwnStaff = staff.id === operatingStaffId;
                                const isRepresentativeRow = staff.role === 'REPRESENTATIVE';
                                const isStaffSelfEditable = currentStaff?.role === 'STAFF' && isOwnStaff;
                                const nameDisabled = (isReadOnly && !isStaffSelfEditable) || isRepresentativeRow;
                                const canEditThisStatus = !isReadOnly && !isRepresentativeRow;
                                // v167: ADMIN はロール変更可（代表者行・自分行を除く）
                                const canEditThisRole = !isReadOnly && !isRepresentativeRow && (
                                  currentStaff?.role === 'REPRESENTATIVE' ||
                                  (currentStaff?.role === 'ADMIN' && !isRepresentativeRow && !isOwnStaff)
                                );
                                return (
                                <div key={staff.id} className={`bg-white p-3 rounded shadow-sm border ${isOwnStaff && currentStaff?.role === 'STAFF' ? 'border-primary-300 ring-1 ring-primary-200' : 'border-slate-200'} grid grid-cols-1 md:grid-cols-12 gap-3 items-start md:items-center`}>
                                    <div className="md:col-span-3">
                                        <label className="block text-xs font-medium text-slate-500">氏名</label>
                                        <input
                                            disabled={nameDisabled}
                                            type="text"
                                            value={staff.name}
                                            onChange={(e) => handleStaffChange(staff.id, 'name', e.target.value)}
                                            className={`w-full text-sm border-slate-200 rounded p-1 ${nameDisabled ? 'bg-slate-100' : ''}`}
                                            placeholder="例: 佐藤 次郎"
                                        />
                                        {(errors[`staff_${staffIndex}_name`] || (isOwnStaff ? errors.staff_self_name : '')) && <p className="text-xs text-red-500 mt-1">{errors[`staff_${staffIndex}_name`] || errors.staff_self_name}</p>}
                                        {isRepresentativeRow && <p className="text-xs text-slate-400 mt-1">代表者情報から自動反映されます</p>}
                                    </div>
                                    <div className="md:col-span-3">
                                        <label className="block text-xs font-medium text-slate-500">フリガナ</label>
                                        <input
                                            disabled={nameDisabled}
                                            type="text"
                                            value={staff.kana}
                                            onChange={(e) => handleStaffChange(staff.id, 'kana', e.target.value)}
                                            className={`w-full text-sm border-slate-200 rounded p-1 ${nameDisabled ? 'bg-slate-100' : ''}`}
                                            placeholder="サトウ ジロウ"
                                        />
                                        {(errors[`staff_${staffIndex}_kana`] || (isOwnStaff ? errors.staff_self_kana : '')) && <p className="text-xs text-red-500 mt-1">{errors[`staff_${staffIndex}_kana`] || errors.staff_self_kana}</p>}
                                        {isRepresentativeRow && <p className="text-xs text-slate-400 mt-1">代表者情報から自動反映されます</p>}
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-medium text-slate-500">個別メールアドレス</label>
                                        <input
                                            disabled={nameDisabled}
                                            type="email"
                                            value={staff.email}
                                            onChange={(e) => handleStaffChange(staff.id, 'email', e.target.value)}
                                            className={`w-full text-sm border-slate-200 rounded p-1 ${nameDisabled ? 'bg-slate-100' : ''}`}
                                            placeholder="staff@example.com"
                                        />
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="block text-xs font-medium text-slate-500">状態</label>
                                        <select
                                            disabled={!canEditThisStatus}
                                            value={staff.status || 'ENROLLED'}
                                            onChange={(e) => handleStaffChange(staff.id, 'status', e.target.value)}
                                            className={`w-full text-sm border-slate-200 rounded p-1 ${!canEditThisStatus ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''}`}
                                        >
                                            <option value="ENROLLED">在籍</option>
                                            <option value="LEFT">退職</option>
                                        </select>
                                        {isRepresentativeRow && (
                                          <p className="text-xs text-slate-400 mt-1">代表者の状態変更はこの画面から行えません</p>
                                        )}
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-medium text-slate-500">権限</label>
                                        <select
                                            disabled={!canEditThisRole}
                                            value={staff.role}
                                            onChange={(e) => handleStaffChange(staff.id, 'role', e.target.value as StaffRole)}
                                            className={`w-full text-sm border-slate-200 rounded p-1 ${!canEditThisRole ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''}`}
                                        >
                                            <option value="ADMIN">管理者</option>
                                            <option value="STAFF">一般</option>
                                        </select>
                                        {!canEditThisRole && !isReadOnly && currentStaff?.role === 'ADMIN' && (
                                          <p className="text-xs text-slate-400 mt-1">
                                            {isRepresentativeRow ? '代表者の権限は変更できません' : '自身の権限は変更できません'}
                                          </p>
                                        )}
                                    </div>
                                    {/* v106: 削除ボタン廃止 — 退職ステータスで運用 */}
                                    <div className="md:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500">登録日</label>
                                            <input
                                              disabled={true}
                                              type="date"
                                              value={staff.joinedDate || ''}
                                              className="w-full text-sm border-slate-200 rounded p-1 bg-slate-100 text-slate-500 cursor-not-allowed"
                                            />
                                        </div>
                                        {/* v106: 退職日・年度中退会は非表示（バックエンド自動管理） */}
                                        {staff.status === 'LEFT' && staff.withdrawnDate && (
                                          <div>
                                            <label className="block text-xs font-medium text-slate-500">退職日</label>
                                            <span className="block text-sm text-slate-600 p-1">{staff.withdrawnDate}</span>
                                          </div>
                                        )}
                                        {/* v106: 職員別研修リンク */}
                                        {(currentStaff?.role !== 'STAFF' || isOwnStaff) && staff.status !== 'LEFT' && (
                                          <div className="md:col-span-2 flex items-end">
                                            <button
                                              type="button"
                                              onClick={() => setTrainingViewStaffId(staff.id)}
                                              className="text-xs text-primary-600 hover:text-primary-900 underline flex items-center"
                                            >
                                              <BookOpenIcon className="w-3 h-3 mr-1" />
                                              研修申込を表示
                                              {(staff.participatedTrainingIds?.length ?? 0) > 0 && (
                                                <span className="ml-1 bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded-full text-xs">{staff.participatedTrainingIds!.length}</span>
                                              )}
                                            </button>
                                          </div>
                                        )}
                                    </div>
                                </div>
                                );
                            })}
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                            ※代表者・管理者は情報の編集・職員の追加が可能です。一般は自分の氏名・フリガナ・メールアドレスのみ編集可能です。
                        </p>
                    </div>
                )}
            </div>
          </div>

          {/* Section 2: Home Info (Individual Only) */}
          {!isBusiness && (
            <div>
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center border-b pb-2">
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
                    <input id={getFieldAnchorId('homePostCode')} disabled={isReadOnly} type="text" name="homePostCode" value={member.homePostCode} onChange={handleChange} className={getInputClass('homePostCode')} placeholder="000-0000" />
                    {errors.homePostCode && <p className="text-xs text-red-500 mt-1">{errors.homePostCode}</p>}
                </div>
                <div className="md:col-span-2 grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            都道府県 {member.preferredMailDestination === MailDestination.HOME && <span className="text-red-500">(※)</span>}
                        </label>
                        <input id={getFieldAnchorId('homePrefecture')} disabled={isReadOnly} type="text" name="homePrefecture" value={member.homePrefecture} onChange={handleChange} className={getInputClass('homePrefecture')} />
                        {errors.homePrefecture && <p className="text-xs text-red-500 mt-1">{errors.homePrefecture}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            市区町村 {member.preferredMailDestination === MailDestination.HOME && <span className="text-red-500">(※)</span>}
                        </label>
                        <input id={getFieldAnchorId('homeCity')} disabled={isReadOnly} type="text" name="homeCity" value={member.homeCity} onChange={handleChange} className={getInputClass('homeCity')} />
                        {errors.homeCity && <p className="text-xs text-red-500 mt-1">{errors.homeCity}</p>}
                    </div>
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            番地 {member.preferredMailDestination === MailDestination.HOME && <span className="text-red-500">(※)</span>}
                        </label>
                        <input id={getFieldAnchorId('homeAddressLine')} disabled={isReadOnly} type="text" name="homeAddressLine" value={member.homeAddressLine} onChange={handleChange} className={getInputClass('homeAddressLine')} placeholder="例: 1-2-3" />
                        {errors.homeAddressLine && <p className="text-xs text-red-500 mt-1">{errors.homeAddressLine}</p>}
                    </div>
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">建物名・部屋番号（任意）</label>
                        <input disabled={isReadOnly} type="text" name="homeAddressLine2" value={member.homeAddressLine2 || ''} onChange={handleChange} className={getInputClass('homeAddressLine2')} placeholder="例: ○○マンション 101号室" />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">携帯電話番号 {(!member.phone?.trim()) && <span className="text-red-500">(※ いずれか必須)</span>}</label>
                    <input id={getFieldAnchorId('mobilePhone')} disabled={isReadOnly} type="tel" name="mobilePhone" value={member.mobilePhone || ''} onChange={handleChange} className={getInputClass('mobilePhone')} placeholder="090-0000-0000" />
                    {errors.mobilePhone && <p className="text-xs text-red-500 mt-1">{errors.mobilePhone}</p>}
                    {isBusiness && !isReadOnly && (
                      <button
                        type="button"
                        className="mt-2 text-xs text-primary-700 underline"
                        onClick={() => setMember((prev) => ({ ...prev, mobilePhone: prev.phone || '' }))}
                      >
                        事業所電話番号を共通利用
                      </button>
                    )}
                </div>
                </div>
            </div>
          )}
          {/* Section 3: Office Info (For Business: Main Info) */}
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center border-b pb-2">
              <span className="w-6 h-6 bg-slate-200 text-slate-700 rounded-full flex items-center justify-center mr-2 text-sm font-bold">{isBusiness ? '2' : '3'}</span>
              {isBusiness ? '事業所情報' : '勤務先情報'}
              {(isBusiness || member.preferredMailDestination === MailDestination.OFFICE) && (
                  <span className="ml-3 text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded font-bold">
                    現在、郵送先に指定されています (住所必須)
                  </span>
              )}
            </h3>
            {isBusiness && !canEditBusinessOfficeFields && (
              <div className="ml-8 mb-4 rounded-lg border border-slate-300 bg-slate-100 px-4 py-3 text-sm text-slate-600">
                事業所情報の変更は代表者のみ可能です。現在は閲覧専用で表示しています。
              </div>
            )}
            <div className="pl-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {isBusiness ? '事業所名' : '事業所名 (※)'} 
                  {!isBusiness && <span className="text-xs text-red-500 ml-2">空白または「勤務なし」の場合は未勤務として扱います</span>}
                </label>
                <input id={getFieldAnchorId('officeName')} disabled={isBusiness ? !canEditBusinessOfficeFields : isReadOnly} type="text" name="officeName" value={member.officeName} onChange={handleChange} className={getInputClass('officeName', isBusiness ? !canEditBusinessOfficeFields : isReadOnly)} />
                {errors.officeName && <p className="text-xs text-red-500 mt-1">{errors.officeName}</p>}
              </div>

              {isBusiness && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">事業所番号 <span className="text-red-500">(※)</span></label>
                  <input id={getFieldAnchorId('officeNumber')} disabled={!canEditBusinessOfficeFields} type="text" name="officeNumber" value={member.officeNumber || ""} onChange={handleChange} className={getInputClass('officeNumber', !canEditBusinessOfficeFields)} placeholder="0000000000" />
                  {errors.officeNumber && <p className="text-xs text-red-500 mt-1">{errors.officeNumber}</p>}
                </div>
              )}

               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    郵便番号 {(isBusiness || member.preferredMailDestination === MailDestination.OFFICE) && <span className="text-red-500">(※)</span>}
                  </label>
                  <input id={getFieldAnchorId('officePostCode')} disabled={isBusiness ? !canEditBusinessOfficeFields : isReadOnly} type="text" name="officePostCode" value={member.officePostCode} onChange={handleChange} className={getInputClass('officePostCode', isBusiness ? !canEditBusinessOfficeFields : isReadOnly)} placeholder="000-0000" />
                  {errors.officePostCode && <p className="text-xs text-red-500 mt-1">{errors.officePostCode}</p>}
               </div>
               <div className="md:col-span-2 grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        都道府県 {(isBusiness || member.preferredMailDestination === MailDestination.OFFICE) && <span className="text-red-500">(※)</span>}
                    </label>
                    <input id={getFieldAnchorId('officePrefecture')} disabled={isBusiness ? !canEditBusinessOfficeFields : isReadOnly} type="text" name="officePrefecture" value={member.officePrefecture} onChange={handleChange} className={getInputClass('officePrefecture', isBusiness ? !canEditBusinessOfficeFields : isReadOnly)} />
                    {errors.officePrefecture && <p className="text-xs text-red-500 mt-1">{errors.officePrefecture}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        市区町村 {(isBusiness || member.preferredMailDestination === MailDestination.OFFICE) && <span className="text-red-500">(※)</span>}
                    </label>
                    <input id={getFieldAnchorId('officeCity')} disabled={isBusiness ? !canEditBusinessOfficeFields : isReadOnly} type="text" name="officeCity" value={member.officeCity} onChange={handleChange} className={getInputClass('officeCity', isBusiness ? !canEditBusinessOfficeFields : isReadOnly)} />
                    {errors.officeCity && <p className="text-xs text-red-500 mt-1">{errors.officeCity}</p>}
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        番地 {(isBusiness || member.preferredMailDestination === MailDestination.OFFICE) && <span className="text-red-500">(※)</span>}
                    </label>
                    <input id={getFieldAnchorId('officeAddressLine')} disabled={isBusiness ? !canEditBusinessOfficeFields : isReadOnly} type="text" name="officeAddressLine" value={member.officeAddressLine} onChange={handleChange} className={getInputClass('officeAddressLine', isBusiness ? !canEditBusinessOfficeFields : isReadOnly)} placeholder="例: 1-2-3" />
                    {errors.officeAddressLine && <p className="text-xs text-red-500 mt-1">{errors.officeAddressLine}</p>}
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">建物名・部屋番号（任意）</label>
                    <input disabled={isBusiness ? !canEditBusinessOfficeFields : isReadOnly} type="text" name="officeAddressLine2" value={member.officeAddressLine2 || ''} onChange={handleChange} className={getInputClass('officeAddressLine2', isBusiness ? !canEditBusinessOfficeFields : isReadOnly)} placeholder="例: ○○ビル 3F" />
                  </div>
               </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">勤務先電話番号 {(!member.mobilePhone?.trim()) && <span className="text-red-500">(※ いずれか必須)</span>}</label>
                <input id={getFieldAnchorId('phone')} disabled={isBusiness ? !canEditBusinessOfficeFields : isReadOnly} type="tel" name="phone" value={member.phone} onChange={handleChange} className={getInputClass('phone', isBusiness ? !canEditBusinessOfficeFields : isReadOnly)} />
                {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">FAX番号（任意）</label>
                <input id={getFieldAnchorId('fax')} disabled={isBusiness ? !canEditBusinessOfficeFields : isReadOnly} type="tel" name="fax" value={member.fax} onChange={handleChange} className={getInputClass('fax', isBusiness ? !canEditBusinessOfficeFields : isReadOnly)} placeholder="任意" />
                {errors.fax && <p className="text-xs text-red-500 mt-1">{errors.fax}</p>}
              </div>
            </div>
          </div>

          {/* Section 4: Mailing & Settings */}
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center border-b pb-2">
              <span className="w-6 h-6 bg-slate-200 text-slate-700 rounded-full flex items-center justify-center mr-2 text-sm font-bold">{isBusiness ? '3' : '4'}</span>
              {isBusiness ? '発送・通知ルール' : '発送・通信設定'}
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
                                    総会資料などの定期発送物は、上記「事業所情報」の住所へ一括で送付されます。
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
                                    研修案内などの連絡は、所属職員一覧に登録された各メールアドレスへ個別に配信されます。
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
                        <div className="mt-4 bg-primary-50 p-6 rounded-lg border border-primary-100 animate-fadeIn">
                          <label className="block text-sm font-bold text-primary-900 mb-1">メールアドレス (※必須)</label>
                          <input
                            disabled={isReadOnly}
                            type="email"
                            name="email"
                            value={member.email || ""}
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
            {(!isReadOnly || isBusinessStaffSelfMode) && (
                <button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-12 rounded-lg shadow-lg transform transition hover:-translate-y-0.5 text-lg">
                変更を保存する
                </button>
            )}
          </div>
        </form>

        {/* ── 退会手続きセクション ── */}
        {loginId && member.status !== 'WITHDRAWN' && (!isBusiness || currentStaff?.role === 'REPRESENTATIVE') && (
          <WithdrawalSection
            member={member}
            loginId={loginId}
            withdrawalPassword={withdrawalPassword}
            setWithdrawalPassword={setWithdrawalPassword}
            withdrawalError={withdrawalError}
            setWithdrawalError={setWithdrawalError}
            withdrawalSubmitting={withdrawalSubmitting}
            setWithdrawalSubmitting={setWithdrawalSubmitting}
            withdrawalConfirmOpen={withdrawalConfirmOpen}
            setWithdrawalConfirmOpen={setWithdrawalConfirmOpen}
            cancelWithdrawalPassword={cancelWithdrawalPassword}
            setCancelWithdrawalPassword={setCancelWithdrawalPassword}
            cancelWithdrawalError={cancelWithdrawalError}
            setCancelWithdrawalError={setCancelWithdrawalError}
            cancelWithdrawalSubmitting={cancelWithdrawalSubmitting}
            setCancelWithdrawalSubmitting={setCancelWithdrawalSubmitting}
            onWithdrawalComplete={(updatedMember) => {
              setMember(updatedMember);
              setSuccessMsg(updatedMember.status === 'WITHDRAWAL_SCHEDULED' ? '退会申請を受け付けました。' : null);
            }}
            onCancelComplete={(updatedMember) => {
              setMember(updatedMember);
              setSuccessMsg('退会申請を取り消しました。');
            }}
          />
        )}

      </div>
      </div>
      </div>
      </div>
      )}

      {/* v106: 職員別研修モーダル */}
      {isBusiness && trainingViewStaffId && (() => {
        const targetStaff = member.staff?.find(s => s.id === trainingViewStaffId);
        if (!targetStaff) return null;
        const canOp = currentStaff?.role === 'REPRESENTATIVE' || currentStaff?.role === 'ADMIN' ||
          (currentStaff?.role === 'STAFF' && targetStaff.id === operatingStaffId);
        return (
          <StaffTrainingView
            staff={targetStaff}
            memberId={member.id}
            trainings={trainings}
            canOperate={canOp}
            historyLookbackMonths={historyLookbackMonths}
            onClose={() => setTrainingViewStaffId(null)}
            onUpdate={(staffId, newIds) => {
              const newMember = { ...member };
              newMember.staff = newMember.staff?.map(s =>
                s.id === staffId ? { ...s, participatedTrainingIds: newIds } : s
              );
              setMember(newMember);
              onSave(newMember);
            }}
          />
        );
      })()}
    </div>
  );
};

// ── 退会手続きセクション（サブコンポーネント）──────────────────
interface WithdrawalSectionProps {
  member: Member;
  loginId: string;
  withdrawalPassword: string;
  setWithdrawalPassword: (v: string) => void;
  withdrawalError: string | null;
  setWithdrawalError: (v: string | null) => void;
  withdrawalSubmitting: boolean;
  setWithdrawalSubmitting: (v: boolean) => void;
  withdrawalConfirmOpen: boolean;
  setWithdrawalConfirmOpen: (v: boolean) => void;
  cancelWithdrawalPassword: string;
  setCancelWithdrawalPassword: (v: string) => void;
  cancelWithdrawalError: string | null;
  setCancelWithdrawalError: (v: string | null) => void;
  cancelWithdrawalSubmitting: boolean;
  setCancelWithdrawalSubmitting: (v: boolean) => void;
  onWithdrawalComplete: (member: Member) => void;
  onCancelComplete: (member: Member) => void;
}

const getFiscalYearEndLabel = (): string => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const endYear = month >= 4 ? year + 1 : year;
  return `${endYear}年3月31日`;
};

const WithdrawalSection: React.FC<WithdrawalSectionProps> = (props) => {
  const {
    member, loginId,
    withdrawalPassword, setWithdrawalPassword,
    withdrawalError, setWithdrawalError,
    withdrawalSubmitting, setWithdrawalSubmitting,
    withdrawalConfirmOpen, setWithdrawalConfirmOpen,
    cancelWithdrawalPassword, setCancelWithdrawalPassword,
    cancelWithdrawalError, setCancelWithdrawalError,
    cancelWithdrawalSubmitting, setCancelWithdrawalSubmitting,
    onWithdrawalComplete, onCancelComplete,
  } = props;

  const fiscalYearEnd = getFiscalYearEndLabel();
  const isScheduled = member.status === 'WITHDRAWAL_SCHEDULED';

  const handleWithdrawSelf = async () => {
    if (!withdrawalPassword) {
      setWithdrawalError('パスワードを入力してください。');
      return;
    }
    try {
      setWithdrawalSubmitting(true);
      setWithdrawalError(null);
      const result = await api.withdrawSelf(loginId, withdrawalPassword, member.id);
      setWithdrawalPassword('');
      setWithdrawalConfirmOpen(false);
      onWithdrawalComplete({
        ...member,
        status: 'WITHDRAWAL_SCHEDULED',
        withdrawnDate: result.withdrawnDate,
      });
    } catch (e) {
      setWithdrawalError(e instanceof Error ? e.message : '退会申請に失敗しました。');
    } finally {
      setWithdrawalSubmitting(false);
    }
  };

  const handleCancelWithdrawal = async () => {
    if (!cancelWithdrawalPassword) {
      setCancelWithdrawalError('パスワードを入力してください。');
      return;
    }
    try {
      setCancelWithdrawalSubmitting(true);
      setCancelWithdrawalError(null);
      await api.cancelWithdrawalSelf(loginId, cancelWithdrawalPassword, member.id);
      setCancelWithdrawalPassword('');
      onCancelComplete({
        ...member,
        status: 'ACTIVE',
        withdrawnDate: undefined,
      });
    } catch (e) {
      setCancelWithdrawalError(e instanceof Error ? e.message : '取り消しに失敗しました。');
    } finally {
      setCancelWithdrawalSubmitting(false);
    }
  };

  if (isScheduled) {
    return (
      <div className="mt-8 border-2 border-amber-300 bg-amber-50 rounded-xl p-6">
        <h3 className="text-lg font-bold text-amber-800 mb-2">退会予定</h3>
        <p className="text-sm text-amber-700 mb-4">
          <strong>{member.withdrawnDate?.replace(/-/g, '/')}</strong> をもって退会となります。
          退会日までは引き続きマイページをご利用いただけます。
        </p>
        <div className="bg-white rounded-lg p-4 border border-amber-200">
          <p className="text-sm font-medium text-slate-700 mb-3">退会申請を取り消す場合は、パスワードを入力してください。</p>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <input
                type="password"
                placeholder="現在のパスワード"
                value={cancelWithdrawalPassword}
                onChange={(e) => { setCancelWithdrawalPassword(e.target.value); setCancelWithdrawalError(null); }}
                className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                disabled={cancelWithdrawalSubmitting}
              />
            </div>
            <button
              type="button"
              onClick={handleCancelWithdrawal}
              disabled={cancelWithdrawalSubmitting || !cancelWithdrawalPassword}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold rounded disabled:opacity-50"
            >
              {cancelWithdrawalSubmitting ? '処理中...' : '退会を取り消す'}
            </button>
          </div>
          {cancelWithdrawalError && <p className="mt-2 text-sm text-red-600">{cancelWithdrawalError}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 border border-slate-200 rounded-xl p-6">
      <h3 className="text-lg font-bold text-slate-800 mb-2">退会手続き</h3>
      <div className="text-sm text-slate-600 space-y-1 mb-4">
        <p>退会を申請すると、<strong>{fiscalYearEnd}</strong>（年度末）をもって退会となります。</p>
        <p>退会日までは引き続きマイページへのログイン・研修申込等をご利用いただけます。</p>
        <p>退会日を過ぎるとログインできなくなり、翌年度以降にデータが削除されます。</p>
        {member.type === MemberType.BUSINESS && (
          <p className="text-amber-700 font-medium">事業所全体の退会となります。所属する全職員がログインできなくなります。</p>
        )}
      </div>

      {!withdrawalConfirmOpen ? (
        <button
          type="button"
          onClick={() => { setWithdrawalConfirmOpen(true); setWithdrawalError(null); setWithdrawalPassword(''); }}
          className="px-4 py-2 border border-red-300 text-red-600 text-sm font-bold rounded hover:bg-red-50"
        >
          退会を申請する
        </button>
      ) : (
        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <p className="text-sm font-medium text-red-800 mb-1">本当に退会を申請しますか？</p>
          <p className="text-xs text-red-600 mb-3">{fiscalYearEnd} をもって退会となります。年度末までは取り消し可能です。</p>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-600 mb-1">確認のためパスワードを入力</label>
              <input
                type="password"
                placeholder="現在のパスワード"
                value={withdrawalPassword}
                onChange={(e) => { setWithdrawalPassword(e.target.value); setWithdrawalError(null); }}
                className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                disabled={withdrawalSubmitting}
              />
            </div>
            <button
              type="button"
              onClick={handleWithdrawSelf}
              disabled={withdrawalSubmitting || !withdrawalPassword}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded disabled:opacity-50"
            >
              {withdrawalSubmitting ? '処理中...' : '退会を申請する'}
            </button>
            <button
              type="button"
              onClick={() => { setWithdrawalConfirmOpen(false); setWithdrawalError(null); setWithdrawalPassword(''); }}
              disabled={withdrawalSubmitting}
              className="px-4 py-2 border border-slate-300 text-slate-600 text-sm rounded hover:bg-slate-50"
            >
              キャンセル
            </button>
          </div>
          {withdrawalError && <p className="mt-2 text-sm text-red-600">{withdrawalError}</p>}
        </div>
      )}
    </div>
  );
};

export default MemberForm;
