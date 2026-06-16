import { useState } from 'react';
import { Direction, Member } from '../types';
import { PrimaryButton, Sheet } from './primitives';

export function RecordSheet({
  members,
  today,
  defaultMemberIds,
  onClose,
  onSave,
}: {
  members: Member[];
  today: string;
  defaultMemberIds: string[];
  onClose: () => void;
  onSave: (memberIds: string[], direction: Direction, date: string) => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(defaultMemberIds));
  const [direction, setDirection] = useState<Direction>('in');
  const [date, setDate] = useState(today);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const canSave = selected.size > 0 && /^\d{4}-\d{2}-\d{2}$/.test(date);
  const isBackfill = date < today;

  return (
    <Sheet title="记一笔" onClose={onClose}>
      <p className="mb-2 text-[13px] text-[rgba(60,60,67,0.6)]">谁(可多选,全家一起就全选)</p>
      <div className="mb-5 flex flex-wrap gap-2">
        {members.map((m) => {
          const on = selected.has(m.id);
          return (
            <button
              key={m.id}
              onClick={() => toggle(m.id)}
              className={`rounded-[10px] px-3.5 py-2 text-[15px] font-medium transition ${
                on ? 'bg-ios-blue text-white' : 'bg-white text-[rgba(60,60,67,0.7)]'
              }`}
            >
              {m.name}
              {on ? ' ✓' : ''}
            </button>
          );
        })}
      </div>

      <p className="mb-2 text-[13px] text-[rgba(60,60,67,0.6)]">方向</p>
      <div className="mb-5 grid grid-cols-2 gap-3">
        <button
          onClick={() => setDirection('in')}
          className={`rounded-[14px] py-3.5 text-[16px] font-semibold transition ${
            direction === 'in' ? 'bg-ios-green/15 text-ios-green-text' : 'bg-white text-[rgba(60,60,67,0.5)]'
          }`}
        >
          ＋ 入境
        </button>
        <button
          onClick={() => setDirection('out')}
          className={`rounded-[14px] py-3.5 text-[16px] font-semibold transition ${
            direction === 'out' ? 'bg-black text-white' : 'bg-white text-[rgba(60,60,67,0.5)]'
          }`}
        >
          － 离境
        </button>
      </div>

      <p className="mb-2 text-[13px] text-[rgba(60,60,67,0.6)]">日期</p>
      <input
        type="date"
        value={date}
        max={today}
        onChange={(e) => setDate(e.target.value)}
        className="mb-2 w-full rounded-[12px] border border-[rgba(60,60,67,0.15)] bg-white px-4 py-3 font-mono tabular text-black"
      />
      <p className="mb-6 text-[12px] text-[rgba(60,60,67,0.5)]">
        {isBackfill
          ? '补录历史打卡:这条会按所选过去日期计入。'
          : '选过去的日期 = 补录历史打卡(忘了打 / 刚开始用都能补)。'}
      </p>

      <PrimaryButton disabled={!canSave} onClick={() => onSave([...selected], direction, date)}>
        保存
      </PrimaryButton>
    </Sheet>
  );
}
