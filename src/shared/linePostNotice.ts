// docs/307 S30/31（2026-10-24）: 投稿依頼の通知メールが担当者に届かなかったことを依頼者へ伝える。
// 以前は通知先が未設定・配信停止でも黙って「依頼済み」になり、担当者に伝わったと思い込ませていた。
export interface LinePostNotification {
  notified: boolean;
  reason?: 'not_configured' | 'suppressed' | 'failed';
}

const REASON_LABEL: Record<NonNullable<LinePostNotification['reason']>, string> = {
  not_configured: '通知先のメールアドレスが設定されていません',
  suppressed: 'メール配信が止まっています',
  failed: '通知メールの送信に失敗しました',
};

/** 届かなかったときだけ文言を返す（届いた・通知の対象外なら null） */
export function linePostNotNotifiedMessage(n?: LinePostNotification | null): string | null {
  if (!n || n.notified) return null;
  const why = (n.reason && REASON_LABEL[n.reason]) || '通知メールを送れませんでした';
  return `投稿依頼にしましたが、担当者への通知メールは送っていません（${why}）。担当者へ直接お知らせください。`;
}
