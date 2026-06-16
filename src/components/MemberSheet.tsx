import { useState } from 'react';
import { Member, MemberRole, ROLE_LABEL } from '../types';
import { PrimaryButton, Sheet } from './primitives';

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
    <Sheet title={member ? '编辑成员' : '添加成员'} onClose={onClose}>
      <p className="mb-2 text-[13px] text-[rgba(60,60,67,0.6)]">称呼</p>
      <input
        type="text"
        value={name}
        maxLength={12}
        placeholder="如:我 / 太太 / 囡囡"
        onChange={(e) => setName(e.target.value)}
        className="mb-5 w-full rounded-[12px] border border-[rgba(60,60,67,0.15)] bg-white px-4 py-3 text-black"
      />

      <p className="mb-2 text-[13px] text-[rgba(60,60,67,0.6)]">身份</p>
      <div className="mb-5 flex flex-wrap gap-2">
        {ROLES.map((r) => (
          <button
            key={r}
            onClick={() => setRole(r)}
            className={`rounded-[10px] px-3.5 py-2 text-[15px] font-medium transition ${
              role === r ? 'bg-ios-blue text-white' : 'bg-white text-[rgba(60,60,67,0.7)]'
            }`}
          >
            {ROLE_LABEL[r]}
          </button>
        ))}
      </div>

      <p className="mb-2 text-[13px] text-[rgba(60,60,67,0.6)]">永居起算日(选填,默认取首次入境)</p>
      <input
        type="date"
        value={residenceStart}
        onChange={(e) => setResidenceStart(e.target.value)}
        className="mb-6 w-full rounded-[12px] border border-[rgba(60,60,67,0.15)] bg-white px-4 py-3 font-mono tabular text-black"
      />

      <PrimaryButton
        disabled={!canSave}
        onClick={() =>
          onSave({ name: name.trim(), role, ...(residenceStart ? { residenceStart } : {}) })
        }
      >
        保存
      </PrimaryButton>
    </Sheet>
  );
}
