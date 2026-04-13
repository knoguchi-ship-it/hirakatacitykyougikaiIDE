import React from 'react';
import { AlertTriangleIcon, BookOpenIcon, CheckCircleIcon, SettingsIcon } from './Icons';

interface TemplateHelpPageProps {
  onBack: () => void;
  onOpenSettings: () => void;
}

const SAMPLE_TEMPLATE_ID = '11n5T7HZm7fu8Gau7nR57NWBVxpiCqZttg0Yca5t5-T4';
const SAMPLE_TEMPLATE_URL = `https://docs.google.com/spreadsheets/d/${SAMPLE_TEMPLATE_ID}/edit`;

const cardCls = 'rounded-3xl border border-slate-200 bg-white p-6 shadow-sm';

const steps = [
  {
    step: '1',
    title: '見本をコピーして始める',
    body: '今使っている本番用ファイルは直接直さず、まず見本をコピーして新しいテンプレートを作ります。',
  },
  {
    step: '2',
    title: '見た目だけ整える',
    body: 'ロゴ、文字の大きさ、余白、見出し、案内文など、印刷したときの見た目だけを調整します。',
  },
  {
    step: '3',
    title: '設定画面で確認して登録する',
    body: '設定画面にファイルのリンクまたは ID を入れ、確認結果に問題がないことを見てから登録します。',
  },
];

const words = [
  {
    term: 'テンプレート',
    desc: '名簿や催促状を印刷するときの、ひな形になる Google スプレッドシートです。',
  },
  {
    term: 'ID',
    desc: 'Google スプレッドシートごとの番号です。ファイルのリンクの中にも入っています。',
  },
  {
    term: 'URL',
    desc: 'ブラウザの上に表示されるファイルのリンクです。この画面では URL をそのまま貼って使えます。',
  },
  {
    term: '管理用シート',
    desc: 'システムが自動で使うシートです。普段の編集では開かず、そのままにしてください。',
  },
];

const editableItems = [
  'ロゴやタイトルの差し替え',
  '文字の大きさや書体の調整',
  '余白、罫線、改ページなど印刷レイアウトの調整',
  '見出しや案内文の言い回しの調整',
];

const protectedItems = [
  '管理用シートの削除、表示切替、手入力',
  'シート名の変更',
  '本番で使っているテンプレートの直接編集',
  'システムが自動で入れる場所のルール変更',
];

const rosterGuide = [
  {
    label: '印刷に使うシート',
    desc: '個人会員・賛助会員用の用紙と、事業所会員用の用紙があります。会員の種類に応じて、必要な用紙だけが自動で使われます。',
    names: '`P_01_会員基本` / `B_01_会員基本` / `B_02_事業所職員`',
  },
  {
    label: '管理用シート',
    desc: '会員データを一時的に入れるためのシートと、作成メモ用のシートです。編集は不要です。',
    names: '`_DATA_ROSTER` / `_GUIDE`',
  },
];

const reminderGuide = [
  {
    label: '印刷に使うシート',
    desc: '催促状の本文や振込案内を置くシートです。個人向けと事業所向けで分かれています。',
    names: '`R_P_01_催促状` / `R_B_01_催促状` / `R_B_02_振込案内`',
  },
  {
    label: '管理用シート',
    desc: '催促状に差し込む情報をシステムが入れるためのシートです。編集は不要です。',
    names: '`_DATA_REMINDER` / `_GUIDE`',
  },
];

const checklist = [
  '見本をコピーして新しいファイルを作った',
  '管理用シートは触っていない',
  'シート名を変えていない',
  '設定画面の確認結果で問題が出ていない',
  '本番で使っているテンプレートを直接編集していない',
  '印刷イメージを自分で一度確認した',
];

const TemplateHelpPage: React.FC<TemplateHelpPageProps> = ({ onBack, onOpenSettings }) => {
  return (
    <div className="space-y-8">
      <section className="rounded-[32px] border border-slate-200 bg-[linear-gradient(135deg,#f5f9ff_0%,#ffffff_50%,#f3faf5_100%)] p-8 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
              <BookOpenIcon className="h-4 w-4" />
              テンプレート利用ガイド
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                テンプレートの準備と設定を、運用担当者向けの手順に絞ってまとめています。
              </h1>
              <p className="mt-3 text-base leading-7 text-slate-600">
                このページでは、どこから見本をコピーするか、どこを直してよいか、設定画面で何を確認するかを、
                専門用語をできるだけ使わずに説明しています。
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onBack}
              className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              戻る
            </button>
            <button
              type="button"
              onClick={onOpenSettings}
              className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              システム設定を開く
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-sky-200 bg-sky-50 p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <h2 className="text-xl font-bold text-sky-950">見本ファイルはここから開けます</h2>
            <p className="mt-2 text-sm leading-6 text-sky-900">
              新しく作るときは、この見本を開いてから Google スプレッドシートの
              「ファイル → コピーを作成」で複製してください。
            </p>
            <p className="mt-3 text-sm text-sky-900">
              ファイル ID:
              <code className="ml-1 rounded bg-sky-100 px-1 py-0.5">{SAMPLE_TEMPLATE_ID}</code>
            </p>
          </div>
          <a
            href={SAMPLE_TEMPLATE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-sky-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-800"
          >
            見本を開く
          </a>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {steps.map((item) => (
          <div key={item.step} className={cardCls}>
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-sm font-bold text-white">
              {item.step}
            </div>
            <h2 className="mt-4 text-lg font-semibold text-slate-900">{item.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{item.body}</p>
          </div>
        ))}
      </section>

      <section className={cardCls}>
        <h2 className="text-xl font-bold text-slate-900">このページで出てくる言葉</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {words.map((item) => (
            <div key={item.term} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-semibold text-slate-900">{item.term}</div>
              <div className="mt-1 text-sm leading-6 text-slate-600">{item.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section className={cardCls}>
        <h2 className="text-xl font-bold text-slate-900">変更してよいこと / 変更しないこと</h2>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <div className="flex items-center gap-2 text-emerald-900">
              <CheckCircleIcon className="h-5 w-5" />
              <h3 className="text-base font-semibold">変更してよいこと</h3>
            </div>
            <ul className="mt-4 space-y-2 text-sm leading-6 text-emerald-950">
              {editableItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
            <div className="flex items-center gap-2 text-rose-900">
              <AlertTriangleIcon className="h-5 w-5" />
              <h3 className="text-base font-semibold">変更しないこと</h3>
            </div>
            <ul className="mt-4 space-y-2 text-sm leading-6 text-rose-950">
              {protectedItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className={cardCls}>
          <h2 className="text-xl font-bold text-slate-900">名簿テンプレートの構成</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            名簿は一覧表なので Google スプレッドシートで管理します。印刷に使う用紙と、システムが使う管理用シートに分かれています。
          </p>
          <div className="mt-4 space-y-3">
            {rosterGuide.map((item) => (
              <div key={item.label} className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                <div className="font-semibold text-slate-900">{item.label}</div>
                <div className="mt-2 leading-6">{item.desc}</div>
                <div className="mt-3 font-mono text-xs text-slate-600">{item.names}</div>
              </div>
            ))}
          </div>
        </div>

        <div className={cardCls}>
          <h2 className="text-xl font-bold text-slate-900">催促状テンプレートの構成</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            催促状も同じファイル内で管理します。名簿とは別の管理用シートを使うため、印刷内容が混ざらないようになっています。
          </p>
          <div className="mt-4 space-y-3">
            {reminderGuide.map((item) => (
              <div key={item.label} className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                <div className="font-semibold text-slate-900">{item.label}</div>
                <div className="mt-2 leading-6">{item.desc}</div>
                <div className="mt-3 font-mono text-xs text-slate-600">{item.names}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={cardCls}>
        <div className="flex items-center gap-3">
          <SettingsIcon className="h-5 w-5 text-slate-700" />
          <h2 className="text-xl font-bold text-slate-900">登録前の確認</h2>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {checklist.map((item) => (
            <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              {item}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default TemplateHelpPage;
