import { useState } from 'react';
import { Member, ROLE_LABEL } from '../types';
import { buildTimeline, computeStats, reachesTaxThreshold, sortCrossings, TAX_DAYS } from '../lib/stay';
import { ProgressBar, SectionHeader } from './primitives';

export function PersonDetail({
  member,
  today,
  canDelete,
  onBack,
  onAddRecord,
  onDeleteCrossing,
  onEditMember,
  onDeleteMember,
}: {
  member: Member;
  today: string;
  canDelete: boolean;
  onBack: () => void;
  onAddRecord: () => void;
  onDeleteCrossing: (crossingId: string) => void;
  onEditMember: () => void;
  onDeleteMember: () => void;
}) {
  const s = computeStats(member, today);
  const [taxMode, setTaxMode] = useState<'rolling' | 'calendar'>('rolling');
  const taxValue = taxMode === 'rolling' ? s.rolling12mInHK : s.taxCalendarYear;
  const taxOver = reachesTaxThreshold(taxValue);

  const rows = buildTimeline(member.crossings, today);
  const desc = [...sortCrossings(member.crossings)].reverse();

  return (
    <div className="mx-auto max-w-md px-5 pb-32 pt-8 sm:max-w-lg">
      <header className="mb-6 flex items-center gap-3">
        <button
          onClick={onBack}
          aria-label="返回"
          className="flex h-9 w-9 items-center justify-center text-[22px] leading-none text-gray-400"
        >
          ‹
        </button>
        <div className="flex flex-1 items-center gap-2">
          <h1 className="text-[22px] font-bold leading-none tracking-tight">{member.name}</h1>
          <span className="rounded-md bg-gray-100 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-gray-500">
            {ROLE_LABEL[member.role]}
          </span>
        </div>
        <button onClick={onEditMember} className="font-mono text-[11px] text-gray-400">
          编辑
        </button>
      </header>

      {/* 状态 hero */}
      <section className="mb-7 rounded-xl border border-gray-200/70 bg-white p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className={`h-2.5 w-2.5 rounded-full ${s.inHK ? 'bg-emerald-600' : 'bg-gray-300'}`} />
            <span className={`text-[15px] font-bold ${s.inHK ? 'text-emerald-700' : 'text-gray-400'}`}>
              {s.crossingCount === 0 ? '尚无记录' : s.inHK ? '在港中' : `已离港 ${s.awayDays} 天`}
            </span>
          </div>
          {s.sinceDate && (
            <p className="font-mono text-[11px] tabular text-gray-400">自 {s.sinceDate}</p>
          )}
        </div>
        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-[44px] font-bold leading-none tabular tracking-tight">
            {s.inHK ? s.currentStreak : s.awayDays}
          </span>
          <span className="pb-1 text-[14px] text-gray-500">
            {s.crossingCount === 0
              ? '天'
              : s.inHK
                ? '天 · 本次连续在港'
                : '天 · 已离港'}
          </span>
        </div>
      </section>

      {/* 统计 */}
      <SectionHeader index="01" title="关键统计" />
      <section className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-gray-200/70 bg-white p-4">
          <p className="text-[12px] text-gray-500">累计在港总天数</p>
          <p className="mt-2 text-[30px] font-bold leading-none tabular">{s.totalInHK}</p>
          <p className="mt-2 font-mono text-[10px] tabular text-gray-400">
            {s.firstEntry ? `自 ${s.firstEntry} 首次入境` : '—'}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200/70 bg-white p-4">
          <p className="text-[12px] text-gray-500">累计离港天数</p>
          <p className="mt-2 text-[30px] font-bold leading-none tabular text-gray-400">{s.totalAway}</p>
          <p className="mt-2 font-mono text-[10px] tabular text-gray-400">共 {s.crossingCount} 条记录</p>
        </div>

        <div className="col-span-2 rounded-xl border border-gray-200/70 bg-white p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[12px] text-gray-500">滚动 12 个月内在港</p>
              <p className="mt-2 flex items-baseline gap-1.5">
                <span className="text-[30px] font-bold leading-none tabular">{s.rolling12mInHK}</span>
                <span className="text-[13px] text-gray-400 tabular">/ {s.rolling12mWindowDays} 天</span>
              </p>
            </div>
            <span className="rounded-md bg-gray-100 px-2 py-1 font-mono text-[10px] text-gray-500">
              续签佐证
            </span>
          </div>
          <div className="mt-3">
            <ProgressBar value={s.rolling12mInHK} max={s.rolling12mWindowDays} />
          </div>
        </div>

        <div className="col-span-2 rounded-xl border border-amber-200 bg-amber-50/50 p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[12px] text-amber-800/80">
                {taxMode === 'rolling' ? '滚动 12 个月' : `公历年 ${today.slice(0, 4)}`} · {TAX_DAYS}{' '}
                天税务阈值
              </p>
              <p className="mt-2 flex items-baseline gap-1.5">
                <span className="text-[30px] font-bold leading-none tabular text-amber-700">
                  {taxValue}
                </span>
                <span className="text-[13px] text-amber-700/70 tabular">/ {TAX_DAYS} 天</span>
              </p>
            </div>
            <span
              className={`rounded-md px-2 py-1 font-mono text-[10px] font-bold ${
                taxOver ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {taxOver ? '已达阈值' : '未达阈值'}
            </span>
          </div>
          <div className="mt-3">
            <ProgressBar value={taxValue} max={TAX_DAYS} variant="amber" />
          </div>
          <div className="mt-3 flex gap-1.5 text-[11px]">
            <button
              onClick={() => setTaxMode('rolling')}
              className={`rounded-md px-2.5 py-1 font-medium ${
                taxMode === 'rolling'
                  ? 'bg-amber-600 text-white'
                  : 'bg-white text-amber-700 ring-1 ring-amber-200'
              }`}
            >
              滚动 12 个月
            </button>
            <button
              onClick={() => setTaxMode('calendar')}
              className={`rounded-md px-2.5 py-1 font-medium ${
                taxMode === 'calendar'
                  ? 'bg-amber-600 text-white'
                  : 'bg-white text-amber-700 ring-1 ring-amber-200'
              }`}
            >
              公历年 {today.slice(0, 4)}
            </button>
          </div>
        </div>
      </section>

      {/* 时间轴 */}
      <SectionHeader
        index="02"
        title="出入境记录"
        right={
          <button
            onClick={onAddRecord}
            className="font-mono text-[11px] text-gray-500 underline-offset-2 hover:underline"
          >
            ＋ 补录
          </button>
        }
      />
      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white/40 px-4 py-8 text-center text-[13px] text-gray-400">
          还没有记录。点底部「记一笔」开始,或在这里「补录」过去的出入境。
        </div>
      ) : (
        <section className="rounded-xl border border-gray-200/70 bg-white">
          {rows.map((row, i) => {
            const crossing = desc[i]!;
            const isIn = row.direction === 'in';
            return (
              <div
                key={crossing.id}
                className="group flex items-center gap-3 border-b border-black/[0.07] px-4 py-3 last:border-b-0"
              >
                <span className="font-mono text-[12px] tabular text-gray-700">{row.date}</span>
                <span
                  className={`flex items-center gap-1.5 text-[13px] font-bold ${
                    isIn ? 'text-emerald-700' : 'text-gray-500'
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${isIn ? 'bg-emerald-600' : 'bg-gray-300'}`} />
                  {isIn ? '入境' : '离境'}
                </span>
                <span className="ml-auto font-mono text-[11px] tabular text-gray-400">{row.label}</span>
                <button
                  onClick={() => onDeleteCrossing(crossing.id)}
                  aria-label="删除这条记录"
                  className="ml-1 text-[14px] text-gray-300 transition hover:text-red-500"
                >
                  ×
                </button>
              </div>
            );
          })}
        </section>
      )}

      {canDelete && (
        <button
          onClick={onDeleteMember}
          className="mt-6 block w-full py-2 text-center text-[12px] text-gray-400 transition hover:text-red-500"
        >
          删除该成员
        </button>
      )}

      <p className="mt-5 px-1 text-[11px] leading-relaxed text-gray-400">
        天数口径:入境日与离境日两端均计入在港天数(香港入境处通行算法)。本工具仅作个人记录与自查,不构成续签 /
        税务 / 永居资格的法律意见。
      </p>
    </div>
  );
}
