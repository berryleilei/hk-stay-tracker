import { AppData, Member, Reminder, ROLE_LABEL } from '../types';
import { ymBetween } from '../lib/date';
import { computeStats, PR_TOTAL_YEARS } from '../lib/stay';
import { RateData } from '../lib/rates';
import { Avatar, Card, GroupLabel, ProgressBar, StatusPill } from './primitives';
import { ReminderList } from './ReminderList';
import { RatesCard } from './RatesCard';

/** 'YYYY-MM-DD' → 'M月D日' */
function monthDay(iso: string): string {
  const [, m, d] = iso.split('-');
  return `${Number(m)}月${Number(d)}日`;
}

export function Home({
  data,
  today,
  rate,
  rateError,
  onOpenPerson,
  onOpenRates,
  onAddMember,
  onAddReminder,
  onEditReminder,
  onExport,
  onImport,
}: {
  data: AppData;
  today: string;
  rate: RateData | null;
  rateError: boolean;
  onOpenPerson: (id: string) => void;
  onOpenRates: () => void;
  onAddMember: () => void;
  onAddReminder: () => void;
  onEditReminder: (reminder: Reminder) => void;
  onExport: () => void;
  onImport: () => void;
}) {
  return (
    <div className="mx-auto max-w-md pb-32 sm:max-w-lg">
      <div className="px-5 pt-14">
        <div className="flex items-end justify-between">
          <h1 className="text-[34px] font-bold leading-none tracking-tight">在港天数</h1>
          <span className="pb-1 font-mono text-[13px] tabular text-[rgba(60,60,67,0.6)]">
            {monthDay(today)}
          </span>
        </div>
        <p className="mt-1.5 text-[15px] text-[rgba(60,60,67,0.6)]">全家出入境 · 续签与税务自查</p>
      </div>

      <div className="mt-7">
        <GroupLabel right={<span className="ios-group-label">{data.members.length} 人</span>}>
          家庭成员
        </GroupLabel>
        <div className="px-4">
          {data.members.map((m) => (
            <MemberCard key={m.id} member={m} today={today} onClick={() => onOpenPerson(m.id)} />
          ))}
          <button
            onClick={onAddMember}
            className="mb-1 block w-full rounded-[16px] border border-dashed border-[rgba(60,60,67,0.25)] py-3 text-[15px] font-semibold text-ios-blue"
          >
            ＋ 添加成员
          </button>
        </div>
      </div>

      <div className="mt-7 px-4">
        <GroupLabel>汇率 · 港币兑人民币</GroupLabel>
        <RatesCard rate={rate} error={rateError} today={today} onOpen={onOpenRates} />
      </div>

      <div className="mt-7">
        <GroupLabel>到期提醒</GroupLabel>
        <ReminderList
          reminders={data.reminders}
          members={data.members}
          today={today}
          onAdd={onAddReminder}
          onEdit={onEditReminder}
        />
      </div>

      <div className="mt-7 px-4">
        <GroupLabel>数据备份</GroupLabel>
        <Card className="divide-y divide-[rgba(60,60,67,0.12)]">
          <button
            onClick={onExport}
            className="flex w-full items-center justify-between px-4 py-3.5 text-left text-[16px]"
          >
            导出备份<span className="text-[rgba(60,60,67,0.3)]">›</span>
          </button>
          <button
            onClick={onImport}
            className="flex w-full items-center justify-between px-4 py-3.5 text-left text-[16px]"
          >
            导入恢复<span className="text-[rgba(60,60,67,0.3)]">›</span>
          </button>
        </Card>
      </div>

      <p className="mt-7 px-6 text-[12px] leading-relaxed text-[rgba(60,60,67,0.45)]">
        两端都算口径。每位成员独立计算。数据仅存本机,不上传。本工具仅作个人记录与自查,不构成续签 / 税务 /
        永居资格的法律意见。
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
    <button onClick={onClick} className="mb-3 block w-full ios-card p-4 text-left transition active:scale-[0.98]">
      <div className="flex items-center gap-3">
        <Avatar name={member.name} role={member.role} />
        <div className="flex-1">
          <p className="text-[17px] font-semibold leading-tight">{member.name}</p>
          <p className="text-[13px] text-[rgba(60,60,67,0.6)]">{ROLE_LABEL[member.role]}</p>
        </div>
        <div className="flex items-center gap-2">
          {hasData ? (
            <StatusPill
              inHK={s.inHK}
              text={s.inHK ? `在港 ${s.currentStreak} 天` : `已离港 ${s.awayDays} 天`}
            />
          ) : (
            <span className="text-[13px] text-[rgba(60,60,67,0.5)]">未开始</span>
          )}
          <span className="text-[20px] leading-none text-[rgba(60,60,67,0.3)]">›</span>
        </div>
      </div>

      {hasData && (
        <>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="text-[12px] text-[rgba(60,60,67,0.6)]">滚动 12 月在港</p>
              <p className="font-rounded text-[22px] font-bold leading-tight tabular">
                {s.rolling12mInHK}
                <span className="ml-1 text-[13px] font-normal text-[rgba(60,60,67,0.4)]">
                  / {s.rolling12mWindowDays} 天
                </span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-[12px] text-[rgba(60,60,67,0.6)]">永居进度</p>
              <p className="font-rounded text-[15px] font-semibold tabular text-[rgba(60,60,67,0.7)]">
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
