import React, { useEffect, useId, useRef, useState } from 'react';

interface RosterTemplateHelpDialogProps {
  open: boolean;
  onClose: () => void;
}

type HelpPage = {
  id: string;
  badge: string;
  title: string;
  summary: string;
};

const PAGES: HelpPage[] = [
  {
    id: 'overview',
    badge: '1',
    title: '全体像',
    summary: 'どの会員にどのシート群が使われるか',
  },
  {
    id: 'structure',
    badge: '2',
    title: 'シート構成',
    summary: '1冊のスプレッドシートをどう分けるか',
  },
  {
    id: 'build',
    badge: '3',
    title: '作成手順',
    summary: 'テンプレートをゼロから作る順序',
  },
  {
    id: 'settings',
    badge: '4',
    title: '設定反映',
    summary: 'システム設定へどう登録するか',
  },
];

const chipCls =
  'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold';

const RosterTemplateHelpDialog: React.FC<RosterTemplateHelpDialogProps> = ({ open, onClose }) => {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const titleId = useId();
  const descId = useId();
  const [pageIndex, setPageIndex] = useState(0);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      if (!dialog.open) dialog.showModal();
      closeButtonRef.current?.focus();
      return;
    }

    if (dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (!open) setPageIndex(0);
  }, [open]);

  const page = PAGES[pageIndex];

  const movePage = (delta: number) => {
    setPageIndex((prev) => Math.min(PAGES.length - 1, Math.max(0, prev + delta)));
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descId}
      className="w-[min(960px,92vw)] max-w-5xl rounded-[28px] border border-slate-200 bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-950/45"
      onClose={onClose}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose();
      }}
    >
      <div className="relative overflow-hidden rounded-[28px] bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.14),_transparent_34%),linear-gradient(180deg,_#f8fbff_0%,_#ffffff_36%)]">
        <div className="border-b border-slate-200/80 px-6 py-5 sm:px-8">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3">
              <div className="inline-flex items-center rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold tracking-wide text-sky-800">
                名簿テンプレート ヘルプ
              </div>
              <div>
                <h2 id={titleId} className="text-2xl font-bold tracking-tight text-slate-900">
                  {page.title}
                </h2>
                <p id={descId} className="mt-1 text-sm leading-6 text-slate-600">
                  {page.summary}
                </p>
              </div>
            </div>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              閉じる
            </button>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            {PAGES.map((item, index) => {
              const active = index === pageIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPageIndex(index)}
                  className={`rounded-2xl border px-4 py-3 text-left transition ${
                    active
                      ? 'border-sky-300 bg-sky-50 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                        active ? 'bg-sky-600 text-white' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                    <span className="text-sm font-semibold text-slate-900">{item.title}</span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-slate-600">{item.summary}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="max-h-[72vh] overflow-y-auto px-6 py-6 sm:px-8">
          {page.id === 'overview' && (
            <div className="space-y-6">
              <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm font-semibold text-slate-900">出力ルール</p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl bg-sky-50 p-4">
                      <span className={`${chipCls} bg-sky-600 text-white`}>個人会員 / 賛助会員</span>
                      <p className="mt-3 text-sm font-semibold text-slate-900">PERSONAL_SUPPORT</p>
                      <p className="mt-1 text-sm text-slate-600">名簿出力では <code>P_</code> 系を使用します。</p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-sky-900">
                        <span className="rounded-full bg-white px-3 py-1">P_01_会員基本</span>
                        <span className="rounded-full bg-white px-3 py-1">R_P_01_催促状</span>
                      </div>
                    </div>
                    <div className="rounded-2xl bg-emerald-50 p-4">
                      <span className={`${chipCls} bg-emerald-600 text-white`}>事業所会員</span>
                      <p className="mt-3 text-sm font-semibold text-slate-900">BUSINESS</p>
                      <p className="mt-1 text-sm text-slate-600">名簿出力では <code>B_</code> 系を使用します。</p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-emerald-900">
                        <span className="rounded-full bg-white px-3 py-1">B_01_会員基本</span>
                        <span className="rounded-full bg-white px-3 py-1">B_02_事業所職員</span>
                        <span className="rounded-full bg-white px-3 py-1">R_B_01_催促状</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-slate-900 p-5 text-white shadow-sm">
                  <p className="text-sm font-semibold text-sky-200">重要ポイント</p>
                  <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-100">
                    <li>名簿と催促状は同じスプレッドシートに置いてよい</li>
                    <li>名簿出力では催促状シートは出力対象にならない</li>
                    <li>新規テンプレートは metadata 推奨</li>
                    <li>既存テンプレートは <code className="rounded bg-white/10 px-1 py-0.5">P_ / B_</code> でも動く</li>
                  </ul>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold text-slate-900">選択順序</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-4">
                  {[
                    ['1', '会員種別を判定', '個人 / 事業所 / 賛助を判定'],
                    ['2', 'metadata を確認', 'ROSTER + TARGET が一致するシートを探す'],
                    ['3', 'prefix に後退', 'metadata が無い場合だけ P_ / B_ を使う'],
                    ['4', '対象だけ出力', '該当シート群だけを PDF 化する'],
                  ].map(([step, title, body]) => (
                    <div key={step} className="rounded-2xl bg-slate-50 p-4">
                      <div className="text-xs font-bold text-slate-500">STEP {step}</div>
                      <div className="mt-2 text-sm font-semibold text-slate-900">{title}</div>
                      <div className="mt-1 text-sm leading-6 text-slate-600">{body}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {page.id === 'structure' && (
            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold text-slate-900">推奨シート構成</p>
                <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
                  <div className="space-y-3">
                    <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
                      <div className="text-xs font-bold uppercase tracking-wide text-sky-700">Visible</div>
                      <div className="mt-3 grid gap-2 text-sm text-slate-800">
                        <div className="rounded-xl bg-white px-3 py-2">P_01_会員基本</div>
                        <div className="rounded-xl bg-white px-3 py-2">B_01_会員基本</div>
                        <div className="rounded-xl bg-white px-3 py-2">B_02_事業所職員</div>
                        <div className="rounded-xl bg-white px-3 py-2">R_P_01_催促状</div>
                        <div className="rounded-xl bg-white px-3 py-2">R_B_01_催促状</div>
                        <div className="rounded-xl bg-white px-3 py-2">R_B_02_振込案内</div>
                      </div>
                    </div>
                  </div>

                  <div className="hidden lg:flex h-full items-center justify-center text-slate-300">
                    <div className="text-4xl">→</div>
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                      <div className="text-xs font-bold uppercase tracking-wide text-amber-700">Hidden</div>
                      <div className="mt-3 grid gap-2 text-sm text-slate-800">
                        <div className="rounded-xl bg-white px-3 py-2">_DATA_ROSTER</div>
                        <div className="rounded-xl bg-white px-3 py-2">_DATA_REMINDER</div>
                        <div className="rounded-xl bg-white px-3 py-2">_GUIDE</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm font-semibold text-slate-900">_DATA_ROSTER の役割</p>
                  <div className="mt-4 space-y-3 text-sm text-slate-600">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <div className="font-semibold text-slate-900">Row 1</div>
                      <div>会員ヘッダ</div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <div className="font-semibold text-slate-900">Row 2</div>
                      <div>会員1件分の値</div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <div className="font-semibold text-slate-900">Row 4</div>
                      <div>職員ヘッダ</div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <div className="font-semibold text-slate-900">Row 5 以降</div>
                      <div>職員一覧</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm font-semibold text-slate-900">_DATA_REMINDER の役割</p>
                  <div className="mt-4 space-y-3 text-sm text-slate-600">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <div className="font-semibold text-slate-900">Row 1</div>
                      <div>催促状ヘッダ</div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <div className="font-semibold text-slate-900">Row 2</div>
                      <div>催促状1件分の値</div>
                    </div>
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4">
                      <div className="font-semibold text-slate-900">重要</div>
                      <div>表示シートには手入力せず、この hidden sheet を数式参照します。</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-900 p-5 text-slate-50 shadow-sm">
                <p className="text-sm font-semibold text-sky-200">参照式の例</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <code className="rounded-2xl bg-white/10 p-4 text-xs leading-6">=IFERROR(_DATA_ROSTER!A2,"")</code>
                  <code className="rounded-2xl bg-white/10 p-4 text-xs leading-6">=ARRAYFORMULA(IFERROR(_DATA_ROSTER!A5:A54,""))</code>
                  <code className="rounded-2xl bg-white/10 p-4 text-xs leading-6">=IFERROR(_DATA_REMINDER!C2,"")</code>
                </div>
              </div>
            </div>
          )}

          {page.id === 'build' && (
            <div className="space-y-6">
              <div className="grid gap-4 lg:grid-cols-2">
                {[
                  ['01', 'テンプレート用スプレッドシートを1冊作る', '名簿用と催促用を別ブックにせず、同じブックへ集約します。'],
                  ['02', 'visible シートを追加する', 'P_ / B_ / R_P_ / R_B_ の表示シートを用意します。'],
                  ['03', 'hidden シートを追加する', '_DATA_ROSTER / _DATA_REMINDER / _GUIDE を作成して非表示にします。'],
                  ['04', '表示シートは数式だけで組む', 'セルへ直接値を書かず、hidden sheet を参照する式だけを配置します。'],
                  ['05', 'metadata を付ける', '新規テンプレートは FAMILY / TARGET / DATA_SHEET / ORDER を設定します。'],
                  ['06', 'プレビュー確認する', 'サンプル値で見た目を確認し、印刷範囲と改ページを調整します。'],
                ].map(([num, title, body]) => (
                  <div key={num} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-sm font-bold text-white">
                        {num}
                      </div>
                      <p className="text-sm font-semibold text-slate-900">{title}</p>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{body}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold text-slate-900">作成時の注意</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-rose-50 p-4">
                    <div className="text-sm font-semibold text-rose-800">やらないこと</div>
                    <ul className="mt-2 space-y-2 text-sm leading-6 text-rose-900">
                      <li>表示シートへ手入力値を残す</li>
                      <li>説明用シートを visible のままにする</li>
                      <li>名簿用と催促用で列契約を混ぜる</li>
                    </ul>
                  </div>
                  <div className="rounded-2xl bg-emerald-50 p-4">
                    <div className="text-sm font-semibold text-emerald-800">推奨すること</div>
                    <ul className="mt-2 space-y-2 text-sm leading-6 text-emerald-900">
                      <li>hidden data sheet を機能ごとに分ける</li>
                      <li>改ページ位置をテンプレート側で調整する</li>
                      <li>metadata と prefix を両方整えておく</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {page.id === 'settings' && (
            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold text-slate-900">システム設定への登録</p>
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <div className="text-xs font-bold uppercase tracking-wide text-slate-500">名簿出力</div>
                    <div className="mt-2 text-sm font-semibold text-slate-900">ROSTER_TEMPLATE_SS_ID</div>
                    <div className="mt-1 text-sm leading-6 text-slate-600">
                      名簿出力コンソールで使うテンプレート ID を登録します。
                    </div>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <div className="text-xs font-bold uppercase tracking-wide text-slate-500">催促用紙</div>
                    <div className="mt-2 text-sm font-semibold text-slate-900">REMINDER_TEMPLATE_SS_ID</div>
                    <div className="mt-1 text-sm leading-6 text-slate-600">
                      催促用紙で使うテンプレート ID を登録します。同じブックなら同じ ID で構いません。
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-sky-50 p-5 shadow-sm">
                <p className="text-sm font-semibold text-slate-900">登録手順</p>
                <ol className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
                  <li>1. Google ドライブでテンプレートスプレッドシートを開く</li>
                  <li>2. URL の <code>/d/...</code> 部分から spreadsheet ID をコピーする</li>
                  <li>3. システム設定画面で <code>ROSTER_TEMPLATE_SS_ID</code> に貼り付ける</li>
                  <li>4. 同じブックを使う場合は <code>REMINDER_TEMPLATE_SS_ID</code> にも同じ ID を貼り付ける</li>
                  <li>5. 保存後、名簿出力コンソールで対象読込を行って確認する</li>
                </ol>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold text-slate-900">補足</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                    <div className="font-semibold text-slate-900">既存テンプレート</div>
                    <div className="mt-2">_DATA + P_ / B_ だけでも名簿出力は動きます。</div>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                    <div className="font-semibold text-slate-900">新規テンプレート</div>
                    <div className="mt-2">_DATA_ROSTER / _DATA_REMINDER と metadata を使うのが推奨です。</div>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                    <div className="font-semibold text-slate-900">サンプル生成</div>
                    <div className="mt-2">Apps Script のサンプル生成関数で例ブックを作成できます。</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-slate-200/80 px-6 py-4 sm:px-8">
          <div className="text-xs text-slate-500">
            Esc キー、閉じるボタン、背景クリックで終了できます。
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => movePage(-1)}
              disabled={pageIndex === 0}
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              前へ
            </button>
            <button
              type="button"
              onClick={() => movePage(1)}
              disabled={pageIndex === PAGES.length - 1}
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              次へ
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
};

export default RosterTemplateHelpDialog;
