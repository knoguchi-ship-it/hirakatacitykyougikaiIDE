// 2026-10-25: 役員まわり（役員・振込口座・請求・支払い）の人物の参照。GAS の officerPersonKey_ と同じ規則。
// 個人・賛助会員は会員ID、事業所職員は職員ID だけで人を指す（XOR）。事業所職員は会員ID が空なので、
// 会員ID だけで人を区別すると職員の役員が全員「同じ人（空）」になる（docs/307 F31）。
export interface OfficerPersonRef {
  memberId: string;
  staffId: string;
}

export function officerPersonRef(memberId?: string | null, staffId?: string | null): OfficerPersonRef {
  const sid = String(staffId || '').trim();
  if (sid) return { memberId: '', staffId: sid };
  return { memberId: String(memberId || '').trim(), staffId: '' };
}

export function officerPersonKey(memberId?: string | null, staffId?: string | null): string {
  const ref = officerPersonRef(memberId, staffId);
  if (ref.staffId) return `staff:${ref.staffId}`;
  return ref.memberId ? `member:${ref.memberId}` : '';
}

/** officerPersonKey の逆。API へ渡す { memberId } か { staffId } を作る */
export function officerPersonRefFromKey(key: string): OfficerPersonRef {
  if (key.startsWith('staff:')) return { memberId: '', staffId: key.slice('staff:'.length) };
  if (key.startsWith('member:')) return { memberId: key.slice('member:'.length), staffId: '' };
  return { memberId: '', staffId: '' };
}
