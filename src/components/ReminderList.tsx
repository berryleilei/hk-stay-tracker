import { Member, Reminder, REMINDER_TYPE_LABEL } from '../types';
import {
  countdownText,
  daysLeft,
  reminderTitle,
  sortReminders,
  TONE_STYLE,
  toneOf,
} from '../lib/reminder';

export function ReminderList({
  reminders,
  members,
  today,
  onAdd,
  onEdit,
}: {
  reminders: Reminder[];
  members: Member[];
  today: string;
  onAdd: () => void;
  onEdit: (reminder: Reminder) => void;
}) {
  const sorted = sortReminders(reminders, today);
  const nameOf = (id?: string) => members.find((m) => m.id === id)?.name ?? '全家';

  return (
    <div className="space-y-3 px-4">
      {sorted.map((r) => {
        const left = daysLeft(r, today);
        const tone = toneOf(left);
        const style = TONE_STYLE[tone];
        const cd = countdownText(left);
        return (
          <button
            key={r.id}
            onClick={() => onEdit(r)}
            className={`flex w-full items-center justify-between rounded-[20px] p-4 text-left transition active:scale-[0.98] ${style.bg}`}
          >
            <div className="min-w-0">
              <p className={`text-[12px] font-medium uppercase tracking-wide ${style.label}`}>
                {REMINDER_TYPE_LABEL[r.type]}
              </p>
              <p className="mt-0.5 truncate text-[17px] font-semibold">
                {reminderTitle(r)} · {nameOf(r.memberId)}
              </p>
              <p className="font-mono text-[12px] tabular text-[rgba(60,60,67,0.5)]">{r.date}</p>
            </div>
            <div className="shrink-0 pl-3 text-right">
              <p className={`font-rounded text-[40px] font-bold leading-none tabular ${style.accent}`}>
                {cd.big}
              </p>
              <p className="text-[12px] text-[rgba(60,60,67,0.5)]">{cd.small}</p>
            </div>
          </button>
        );
      })}

      <button
        onClick={onAdd}
        className="block w-full rounded-[16px] border border-dashed border-[rgba(60,60,67,0.25)] py-3 text-[15px] font-semibold text-ios-blue"
      >
        ＋ 添加提醒
      </button>
    </div>
  );
}
