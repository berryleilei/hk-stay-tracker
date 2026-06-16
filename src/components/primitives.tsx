// 共享小组件 + 视觉原子。整站 editorial 风:muted 冷灰、system sans、克制。
import { MemberRole } from '../types';

/** 区块标题:mono 编号 + 标题 + 分隔线(对齐 okschool SectionGroupHeader 风) */
export function SectionHeader({
  index,
  title,
  right,
}: {
  index: string;
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center gap-2.5">
      <span className="font-mono text-[11px] text-gray-400">{index}</span>
      <h2 className="text-[13px] font-bold tracking-tight">{title}</h2>
      <span className="h-px flex-1 border-t border-black/[0.07]" />
      {right}
    </div>
  );
}

/** 进度条。variant 决定配色:neutral 灰 / amber 警示 */
export function ProgressBar({
  value,
  max,
  variant = 'neutral',
}: {
  value: number;
  max: number;
  variant?: 'neutral' | 'amber';
}) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const track = variant === 'amber' ? 'bg-amber-100' : 'bg-gray-100';
  const fill = variant === 'amber' ? 'bg-amber-500' : 'bg-gray-800';
  return (
    <div className={`h-1.5 w-full overflow-hidden rounded-full ${track}`}>
      <div className={`h-full rounded-full ${fill}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

const ROLE_AVATAR_BG: Record<MemberRole, string> = {
  principal: 'bg-gray-900',
  spouse: 'bg-gray-400',
  child: 'bg-gray-300',
  other: 'bg-gray-300',
};

/** 成员头像:首字 + 按身份的灰阶底色 */
export function Avatar({ name, role, size = 36 }: { name: string; role: MemberRole; size?: number }) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-white ${ROLE_AVATAR_BG[role]}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      {name.slice(0, 1)}
    </span>
  );
}

/** 在港 / 离港 状态点 + 文字 */
export function StatusBadge({ inHK, text }: { inHK: boolean; text: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${inHK ? 'bg-emerald-600' : 'bg-gray-300'}`} />
      <span className={`text-[12px] font-bold ${inHK ? 'text-emerald-700' : 'text-gray-400'}`}>
        {text}
      </span>
    </div>
  );
}
