import { useState } from 'react';
import { Member, Reminder, ReminderType, REMINDER_TYPE_LABEL } from '../types';
import { PrimaryButton, Sheet } from './primitives';

const TYPES: ReminderType[] = ['visa', 'sim', 'other'];
const FAMILY = '__family__';

export function ReminderSheet({
  reminder,
  members,
  today,
  onClose,
  onSave,
  onDelete,
}: {
  reminder: Reminder | null; // null = 新增
  members: Member[];
  today: string;
  onClose: () => void;
  onSave: (fields: { type: ReminderType; date: string; memberId?: string; title?: string }) => void;
  onDelete: (id: string) => void;
}) {
  const [type, setType] = useState<ReminderType>(reminder?.type ?? 'sim');
  const [date, setDate] = useState(reminder?.date ?? today);
  const [memberSel, setMemberSel] = useState<string>(reminder?.memberId ?? FAMILY);
  const [title, setTitle] = useState(reminder?.title ?? '');

  const canSave = /^\d{4}-\d{2}-\d{2}$/.test(date);

  return (
    <Sheet title={reminder ? '编辑提醒' : '添加提醒'} onClose={onClose}>
      <p className="mb-2 text-[13px] text-[rgba(60,60,67,0.6)]">类型</p>
      <div className="mb-5 flex flex-wrap gap-2">
        {TYPES.map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`rounded-[10px] px-3.5 py-2 text-[15px] font-medium transition ${
              type === t ? 'bg-ios-blue text-white' : 'bg-white text-[rgba(60,60,67,0.7)]'
            }`}
          >
            {REMINDER_TYPE_LABEL[t]}
          </button>
        ))}
      </div>

      <p className="mb-2 text-[13px] text-[rgba(60,60,67,0.6)]">关联成员(储值电话卡每人一张)</p>
      <div className="mb-5 flex flex-wrap gap-2">
        {members.map((m) => (
          <button
            key={m.id}
            onClick={() => setMemberSel(m.id)}
            className={`rounded-[10px] px-3.5 py-2 text-[15px] font-medium transition ${
              memberSel === m.id ? 'bg-ios-blue text-white' : 'bg-white text-[rgba(60,60,67,0.7)]'
            }`}
          >
            {m.name}
          </button>
        ))}
        <button
          onClick={() => setMemberSel(FAMILY)}
          className={`rounded-[10px] px-3.5 py-2 text-[15px] font-medium transition ${
            memberSel === FAMILY ? 'bg-ios-blue text-white' : 'bg-white text-[rgba(60,60,67,0.7)]'
          }`}
        >
          全家共享
        </button>
      </div>

      <p className="mb-2 text-[13px] text-[rgba(60,60,67,0.6)]">标题(选填,默认按类型)</p>
      <input
        type="text"
        value={title}
        maxLength={20}
        placeholder={REMINDER_TYPE_LABEL[type]}
        onChange={(e) => setTitle(e.target.value)}
        className="mb-5 w-full rounded-[12px] border border-[rgba(60,60,67,0.15)] bg-white px-4 py-3 text-black"
      />

      <p className="mb-2 text-[13px] text-[rgba(60,60,67,0.6)]">到期日</p>
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="mb-6 w-full rounded-[12px] border border-[rgba(60,60,67,0.15)] bg-white px-4 py-3 font-mono tabular text-black"
      />

      <PrimaryButton
        disabled={!canSave}
        onClick={() =>
          onSave({
            type,
            date,
            ...(memberSel !== FAMILY ? { memberId: memberSel } : {}),
            ...(title.trim() ? { title: title.trim() } : {}),
          })
        }
      >
        保存
      </PrimaryButton>

      {reminder && (
        <button
          onClick={() => onDelete(reminder.id)}
          className="mt-3 w-full py-2 text-center text-[15px] font-medium text-ios-red"
        >
          删除提醒
        </button>
      )}
    </Sheet>
  );
}
