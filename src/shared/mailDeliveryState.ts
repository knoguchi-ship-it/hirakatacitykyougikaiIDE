import type { SystemSettings } from '../types';

/** 管理画面・送信画面で共通に扱うメール配信の唯一の状態。 */
export type MailDeliveryState = 'STOPPED' | 'LIVE' | 'REDIRECT';

export const MAIL_DELIVERY_OPTIONS: ReadonlyArray<{
  value: MailDeliveryState;
  label: string;
  description: string;
}> = [
  { value: 'STOPPED', label: '停止', description: 'すべてのメールを送信しません。' },
  { value: 'LIVE', label: '通常送信', description: '宛先の会員・申請者へ送信します。' },
  { value: 'REDIRECT', label: 'テスト集約', description: '許可リストのメールアドレスだけに送信します。' },
];

/**
 * 新しい配信状態を優先し、旧設定だけが残っている環境でも安全に読み替える。
 * 旧 SUPPRESS は「停止」と同義であり、新規 UI には公開しない。
 */
export const resolveMailDeliveryState = (
  settings: Pick<SystemSettings, 'mailDeliveryState' | 'mailGlobalEnabled' | 'mailDeliveryMode'>,
): MailDeliveryState => {
  if (settings.mailDeliveryState === 'STOPPED' || settings.mailDeliveryState === 'LIVE' || settings.mailDeliveryState === 'REDIRECT') {
    return settings.mailDeliveryState;
  }
  if (settings.mailGlobalEnabled === false || settings.mailDeliveryMode === 'SUPPRESS') return 'STOPPED';
  return settings.mailDeliveryMode === 'REDIRECT' ? 'REDIRECT' : 'LIVE';
};
