// 2026-10-19: マスタ（M_ 表）の選択肢を <option> として描く。選択肢をコードに並べない（docs/309）。
// current を渡すと、マスタで無効にした値の行でも今の値を表示できる。
// exclude は「この画面では選ばせない値」（例: 移行済みは移行処理だけが付ける）。値の一覧ではなく仕様なのでコードに書いてよい。
import React from 'react';
import { optionsIncluding, useMasterOptions } from '../shared/masterOptions';

interface MasterOptionListProps {
  master: string;
  current?: string | null;
  exclude?: readonly string[];
  /** 名称の後ろに足す文言（例: 「だけ」「のみ」） */
  suffix?: string;
}

const MasterOptionList: React.FC<MasterOptionListProps> = ({ master, current, exclude, suffix = '' }) => {
  const options = optionsIncluding(useMasterOptions(master), current);
  return (
    <>
      {options
        .filter((o) => !exclude?.includes(o.code) || o.code === current)
        .map((o) => <option key={o.code} value={o.code}>{o.label}{suffix}</option>)}
    </>
  );
};

export default MasterOptionList;
