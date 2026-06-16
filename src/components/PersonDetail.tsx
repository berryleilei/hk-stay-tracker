import { useState } from 'react';
import { Member } from '../types';
import { buildTimeline, computeStats, reachesTaxThreshold, sortCrossings, TAX_DAYS } from '../lib/stay';
import { Card, GroupLabel, ProgressBar } from './primitives';

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
  const heroNum = s.crossingCount === 0 ? 0 : s.inHK ? s.currentStreak : s.awayDays;
  const heroLabel =
    s.crossingCount === 0 ? '天' : s.inHK ? '天 · 本次连续在港' : '天 · 已离港';

  return (
    <div className="mx-auto max-w-md pb-32 sm:max-w-lg">
      {/* 毛玻璃导航栏 */}
      <div className="sticky top-0 z-10 flex items-center gap-1 border-b border-[rgba(60,60,67,0.12)] bg-ios-bg/80 px-3 pb-2.5 pt-12 backdrop-blur-xl">
        <button onClick={onBack} className="flex items-center text-[17px] text-ios-blue" aria-label="返回">
          <span className="text-[26px] leading-none">‹</span>返回
        </button>
        <p className="flex-1 truncate text-center text-[17px] font-semibold">{member.name}</p>
        <button onClick={onEditMember} className="px-2 text-[17px] text-ios-blue">
          编辑
        </button>
      </div>

      <div className="px-4 pt-4">
        {/* 状态大卡(DreamDays 巨数) */}
        <Card className="mb-5 p-6 text-center">
          <div
            className={`mb-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-semibold ${
              s.inHK ? 'bg-ios-green/15 text-ios-green-text' : 'bg-[#787880]/12 text-[rgba(60,60,67,0.6)]'
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${s.inHK ? 'bg-ios-green' : 'bg-[#C7C7CC]'}`} />
            {s.crossingCount === 0 ? '尚无记录' : s.inHK ? '在港中' : '已离港'}
          </div>
          <p className="font-rounded text-[64px] font-bold leading-none tabular">{heroNum}</p>
          <p className="mt-2 text-[15px] text-[rgba(60,60,67,0.6)]">
            {heroLabel}
            {s.sinceDate ? ` · 自 ${s.sinceDate}` : ''}
          </p>
        </Card>

        {/* 关键统计 grouped */}
        <GroupLabel>关键统计</GroupLabel>
        <Card className="mb-5 divide-y divide-[rgba(60,60,67,0.12)]">
          <Row label="累计在港总天数" value={`${s.totalInHK} 天`} />
          <Row label="累计离港天数" value={`${s.totalAway} 天`} muted />
          <Row
            label="上一次离港"
            value={
              s.lastDeparture ? `${s.lastDeparture} · ${s.daysSinceLastDeparture} 天前` : '—'
            }
            muted={!s.lastDeparture}
          />
          <div className="px-4 py-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[16px]">
                滚动 12 月在港{' '}
                <span className="text-[12px] text-[rgba(60,60,67,0.5)]">续签佐证</span>
              </span>
              <span className="font-rounded text-[18px] font-semibold tabular">
                {s.rolling12mInHK} / {s.rolling12mWindowDays}
              </span>
            </div>
            <div className="mt-2.5">
              <ProgressBar value={s.rolling12mInHK} max={s.rolling12mWindowDays} />
            </div>
          </div>
        </Card>

        {/* 183 税务 */}
        <div className="mb-5 rounded-[20px] bg-ios-orange/[0.10] p-4">
          <div className="flex items-center justify-between">
            <span className="text-[15px] font-semibold text-ios-orange-text">
              {TAX_DAYS} 天税务阈值
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[12px] font-bold ${
                taxOver ? 'bg-ios-orange/20 text-ios-orange-text' : 'bg-[#787880]/15 text-[rgba(60,60,67,0.6)]'
              }`}
            >
              {taxOver ? '已达阈值' : '未达阈值'}
            </span>
          </div>
          <p className="mt-2 font-rounded text-[34px] font-bold leading-none tabular text-ios-orange">
            {taxValue}
            <span className="ml-1 text-[15px] font-normal text-ios-orange-text/70">/ {TAX_DAYS} 天</span>
          </p>
          <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-ios-orange/20">
            <div
              className="h-full rounded-full bg-ios-orange"
              style={{ width: `${Math.min(100, Math.round((taxValue / TAX_DAYS) * 100))}%` }}
            />
          </div>
          <div className="mt-3 inline-flex rounded-[10px] bg-ios-orange/15 p-0.5 text-[13px] font-medium">
            <button
              onClick={() => setTaxMode('rolling')}
              className={`rounded-[8px] px-3 py-1 ${
                taxMode === 'rolling' ? 'bg-white text-ios-orange-text shadow-sm' : 'text-ios-orange-text/70'
              }`}
            >
              滚动 12 月
            </button>
            <button
              onClick={() => setTaxMode('calendar')}
              className={`rounded-[8px] px-3 py-1 ${
                taxMode === 'calendar' ? 'bg-white text-ios-orange-text shadow-sm' : 'text-ios-orange-text/70'
              }`}
            >
              公历年 {today.slice(0, 4)}
            </button>
          </div>
        </div>

        {/* 出入境时间轴 */}
        <GroupLabel
          right={
            <button onClick={onAddRecord} className="text-[15px] font-medium normal-case text-ios-blue">
              ＋ 补录
            </button>
          }
        >
          出入境记录
        </GroupLabel>
        {rows.length === 0 ? (
          <Card className="px-4 py-8 text-center text-[15px] text-[rgba(60,60,67,0.5)]">
            还没有记录。点底部「记一笔」开始,或「补录」过去的出入境。
          </Card>
        ) : (
          <Card className="divide-y divide-[rgba(60,60,67,0.12)]">
            {rows.map((row, i) => {
              const crossing = desc[i]!;
              const isIn = row.direction === 'in';
              return (
                <div key={crossing.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="font-mono text-[13px] tabular text-[rgba(60,60,67,0.7)]">
                    {row.date}
                  </span>
                  <span
                    className={`flex items-center gap-1.5 text-[15px] font-semibold ${
                      isIn ? 'text-ios-green-text' : 'text-[rgba(60,60,67,0.6)]'
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${isIn ? 'bg-ios-green' : 'bg-[#C7C7CC]'}`} />
                    {isIn ? '入境' : '离境'}
                  </span>
                  <span className="ml-auto font-mono text-[13px] tabular text-[rgba(60,60,67,0.5)]">
                    {row.label}
                  </span>
                  <button
                    onClick={() => onDeleteCrossing(crossing.id)}
                    aria-label="删除这条记录"
                    className="flex h-8 w-8 items-center justify-center text-[18px] text-[rgba(60,60,67,0.3)]"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </Card>
        )}

        {canDelete && (
          <button
            onClick={onDeleteMember}
            className="mt-6 block w-full py-2 text-center text-[15px] font-medium text-ios-red"
          >
            删除该成员
          </button>
        )}

        <p className="mt-5 px-2 text-[12px] leading-relaxed text-[rgba(60,60,67,0.45)]">
          两端都算口径(香港入境处通行算法)。仅作个人记录与自查,不构成续签 / 税务 / 永居资格的法律意见。
        </p>
      </div>
    </div>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5">
      <span className="text-[16px]">{label}</span>
      <span
        className={`font-rounded text-[18px] font-semibold tabular ${
          muted ? 'text-[rgba(60,60,67,0.5)]' : ''
        }`}
      >
        {value}
      </span>
    </div>
  );
}
