import { AppData, Member, ROLE_LABEL } from '../types';
import { diffDays, ymBetween } from '../lib/date';
import { computeStats, PR_TOTAL_YEARS } from '../lib/stay';
import { Avatar, ProgressBar, SectionHeader, StatusBadge } from './primitives';

export function Home({
  data,
  today,
  onOpenPerson,
  onAddMember,
  onEditVisa,
  onExport,
  onImport,
}: {
  data: AppData;
  today: string;
  onOpenPerson: (id: string) => void;
  onAddMember: () => void;
  onEditVisa: () => void;
  onExport: () => void;
  onImport: () => void;
}) {
  const visaCountdown =
    data.visaExpiry !== undefined ? diffDays(data.visaExpiry, today) : null;

  return (
    <div className="mx-auto max-w-md px-5 pb-32 pt-8 sm:max-w-lg">
      <header className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-[26px] font-bold leading-none tracking-tight">在港天数</h1>
          <p className="mt-1.5 text-[13px] text-gray-500">全家出入境打卡 · 续签与税务自查</p>
        </div>
        <div className="text-right">
          <p className="font-mono text-[10px] uppercase tracking-widest text-gray-400">Today</p>
          <p className="font-mono text-[13px] tabular text-gray-600">{today}</p>
        </div>
      </header>

      <SectionHeader
        index="01"
        title="家庭成员"
        right={<span className="font-mono text-[10px] text-gray-400">{data.members.length} 人</span>}
      />

      {data.members.map((m) => (
        <MemberCard key={m.id} member={m} today={today} onClick={() => onOpenPerson(m.id)} />
      ))}

      <button
        onClick={onAddMember}
        className="mb-2 block w-full rounded-xl border border-dashed border-gray-300 bg-white/40 py-3 text-[13px] font-bold text-gray-400 transition active:scale-[0.99]"
      >
        ＋ 添加成员
      </button>

      <div className="mt-6">
        <SectionHeader index="02" title="关键日期" />
        <button
          onClick={onEditVisa}
          className="block w-full rounded-xl border border-gray-200/70 bg-white p-4 text-left transition active:scale-[0.99]"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-bold">签证续签到期</p>
              <p className="mt-0.5 font-mono text-[11px] tabular text-gray-400">
                {data.visaExpiry ? `${data.visaExpiry} · 全家` : '未设置 · 点此填写'}
              </p>
            </div>
            {visaCountdown !== null && (
              <span className="rounded-md bg-gray-100 px-2.5 py-1 font-mono text-[11px] tabular text-gray-600">
                {visaCountdown >= 0 ? `还有 ${visaCountdown} 天` : `已过期 ${-visaCountdown} 天`}
              </span>
            )}
          </div>
        </button>
      </div>

      <div className="mt-6">
        <SectionHeader index="03" title="数据备份" />
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onExport}
            className="rounded-xl border border-gray-200/70 bg-white py-3 text-[13px] font-bold text-gray-600 transition active:scale-[0.99]"
          >
            导出备份
          </button>
          <button
            onClick={onImport}
            className="rounded-xl border border-gray-200/70 bg-white py-3 text-[13px] font-bold text-gray-600 transition active:scale-[0.99]"
          >
            导入恢复
          </button>
        </div>
      </div>

      <p className="mt-6 px-1 text-[11px] leading-relaxed text-gray-400">
        天数口径:入境日与离境日两端均计入在港天数。每位成员独立计算。本工具仅作个人记录与自查,不构成续签 /
        税务 / 永居资格的法律意见。数据仅存于本机浏览器,不上传。
      </p>
    </div>
  );
}

function MemberCard({
  member,
  today,
  onClick,
}: {
  member: Member;
  today: string;
  onClick: () => void;
}) {
  const s = computeStats(member, today);
  const prStart = member.residenceStart ?? s.firstEntry;
  const ym = prStart ? ymBetween(prStart, today) : null;
  const hasData = s.crossingCount > 0;

  return (
    <button
      onClick={onClick}
      className="mb-3 block w-full rounded-xl border border-gray-200/70 bg-white p-4 text-left transition active:scale-[0.99]"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Avatar name={member.name} role={member.role} />
          <div>
            <p className="text-[14px] font-bold leading-tight">{member.name}</p>
            <p className="font-mono text-[10px] uppercase tracking-wide text-gray-400">
              {ROLE_LABEL[member.role]}
            </p>
          </div>
        </div>
        {hasData ? (
          <StatusBadge
            inHK={s.inHK}
            text={s.inHK ? `在港 · ${s.currentStreak} 天` : `已离港 ${s.awayDays} 天`}
          />
        ) : (
          <span className="text-[12px] text-gray-400">未开始记录</span>
        )}
      </div>

      {hasData && (
        <>
          <div className="mt-3.5 flex items-end justify-between">
            <div>
              <p className="font-mono text-[10px] text-gray-400">滚动 12 月在港</p>
              <p className="mt-0.5 text-[20px] font-bold leading-none tabular">
                {s.rolling12mInHK}{' '}
                <span className="text-[12px] font-normal text-gray-400">
                  / {s.rolling12mWindowDays} 天
                </span>
              </p>
            </div>
            <div className="text-right">
              <p className="font-mono text-[10px] text-gray-400">永居进度</p>
              <p className="mt-0.5 font-mono text-[13px] tabular text-gray-600">
                {ym ? `${ym.years} 年 ${ym.months} 月 / ${PR_TOTAL_YEARS} 年` : '—'}
              </p>
            </div>
          </div>
          <div className="mt-2.5">
            <ProgressBar value={s.prElapsedDays} max={s.prTotalDays} />
          </div>
        </>
      )}
    </button>
  );
}
