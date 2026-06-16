import { useState } from 'react';
import { Member, MemberRole, ROLE_LABEL } from '../types';

const ROLES: MemberRole[] = ['principal', 'spouse', 'child', 'other'];

export function MemberSheet({
  member,
  onClose,
  onSave,
}: {
  member: Member | null; // null = 新增
  onClose: () => void;
  onSave: (fields: { name: string; role: MemberRole; residenceStart?: string }) => void;
}) {
  const [name, setName] = useState(member?.name ?? '');
  const [role, setRole] = useState<MemberRole>(member?.role ?? 'other');
  const [residenceStart, setResidenceStart] = useState(member?.residenceStart ?? '');

  const canSave = name.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="编辑成员">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute inset-x-0 bottom-0 mx-auto max-w-md rounded-t-2xl bg-white px-5 pb-8 pt-5 sm:max-w-lg">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-gray-200" />
        <h2 className="mb-4 text-[16px] font-bold">{member ? '编辑成员' : '添加成员'}</h2>

        <p className="mb-2 text-[12px] text-gray-500">称呼</p>
        <input
          type="text"
          value={name}
          maxLength={12}
          placeholder="如:我 / 太太 / 囡囡"
          onChange={(e) => setName(e.target.value)}
          className="mb-5 w-full rounded-xl border border-gray-200 px-4 py-3 text-[14px] text-gray-800"
        />

        <p className="mb-2 text-[12px] text-gray-500">身份</p>
        <div className="mb-5 flex flex-wrap gap-2">
          {ROLES.map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`rounded-lg px-3 py-1.5 text-[13px] font-medium transition ${
                role === r ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {ROLE_LABEL[r]}
            </button>
          ))}
        </div>

        <p className="mb-2 text-[12px] text-gray-500">永居起算日(选填,默认取首次入境)</p>
        <input
          type="date"
          value={residenceStart}
          onChange={(e) => setResidenceStart(e.target.value)}
          className="mb-6 w-full rounded-xl border border-gray-200 px-4 py-3 font-mono text-[14px] tabular text-gray-800"
        />

        <button
          disabled={!canSave}
          onClick={() =>
            onSave({
              name: name.trim(),
              role,
              ...(residenceStart ? { residenceStart } : {}),
            })
          }
          className="w-full rounded-xl bg-gray-900 py-3.5 text-[15px] font-bold text-white transition active:scale-[0.98] disabled:opacity-40"
        >
          保存
        </button>
      </div>
    </div>
  );
}
