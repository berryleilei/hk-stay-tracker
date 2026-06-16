import { useState } from 'react';
import { Direction, Member } from '../types';

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
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="记一笔">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute inset-x-0 bottom-0 mx-auto max-w-md rounded-t-2xl bg-white px-5 pb-8 pt-5 sm:max-w-lg">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-gray-200" />
        <h2 className="mb-4 text-[16px] font-bold">记一笔</h2>

        <p className="mb-2 text-[12px] text-gray-500">谁(可多选,全家一起就全选)</p>
        <div className="mb-5 flex flex-wrap gap-2">
          {members.map((m) => {
            const on = selected.has(m.id);
            return (
              <button
                key={m.id}
                onClick={() => toggle(m.id)}
                className={`rounded-lg px-3.5 py-1.5 text-[13px] font-medium transition ${
                  on ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {m.name}
                {on ? ' ✓' : ''}
              </button>
            );
          })}
        </div>

        <p className="mb-2 text-[12px] text-gray-500">方向</p>
        <div className="mb-5 grid grid-cols-2 gap-3">
          <button
            onClick={() => setDirection('in')}
            className={`rounded-xl border py-3 text-[14px] font-bold transition ${
              direction === 'in'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-gray-200 bg-white text-gray-400'
            }`}
          >
            ＋ 入境
          </button>
          <button
            onClick={() => setDirection('out')}
            className={`rounded-xl border py-3 text-[14px] font-bold transition ${
              direction === 'out'
                ? 'border-gray-900 bg-gray-900 text-white'
                : 'border-gray-200 bg-white text-gray-400'
            }`}
          >
            － 离境
          </button>
        </div>

        <p className="mb-2 text-[12px] text-gray-500">日期</p>
        <input
          type="date"
          value={date}
          max={today}
          onChange={(e) => setDate(e.target.value)}
          className="mb-2 w-full rounded-xl border border-gray-200 px-4 py-3 font-mono text-[14px] tabular text-gray-800"
        />
        <p className="mb-5 text-[11px] text-gray-400">
          {isBackfill
            ? '补录历史打卡:这条会按所选过去日期计入。'
            : '选过去的日期 = 补录历史打卡(忘了打 / 刚开始用都能补)。'}
        </p>

        <button
          disabled={!canSave}
          onClick={() => onSave([...selected], direction, date)}
          className="w-full rounded-xl bg-gray-900 py-3.5 text-[15px] font-bold text-white transition active:scale-[0.98] disabled:opacity-40"
        >
          保存
        </button>
      </div>
    </div>
  );
}
