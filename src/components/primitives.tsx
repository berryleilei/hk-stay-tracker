// 共享 iOS 风视觉原子。系统色、SF 字体、inset grouped 卡、底部面板。
import { ReactNode } from 'react';
import { MemberRole } from '../types';

/** 分组小标题(大写灰) */
export function GroupLabel({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-2 flex items-center justify-between px-2">
      <span className="ios-group-label">{children}</span>
      {right}
    </div>
  );
}

/** iOS 白色大圆角卡 */
export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`ios-card ${className}`}>{children}</div>;
}

/** 进度条 */
export function ProgressBar({
  value,
  max,
  color = 'bg-ios-blue',
}: {
  value: number;
  max: number;
  color?: string;
}) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-[#787880]/15">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

const ROLE_AVATAR_BG: Record<MemberRole, string> = {
  principal: 'bg-black',
  spouse: 'bg-[#8E8E93]',
  child: 'bg-[#C7C7CC]',
  other: 'bg-[#C7C7CC]',
};

export function Avatar({ name, role, size = 44 }: { name: string; role: MemberRole; size?: number }) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full text-[15px] font-semibold text-white ${ROLE_AVATAR_BG[role]}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      {name.slice(0, 1)}
    </span>
  );
}

/** 在港 / 离港 状态胶囊 */
export function StatusPill({ inHK, text }: { inHK: boolean; text: string }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[13px] font-semibold ${
        inHK ? 'bg-ios-green/15 text-ios-green-text' : 'bg-[#787880]/12 text-[rgba(60,60,67,0.6)]'
      }`}
    >
      {text}
    </span>
  );
}

/** 底部弹出面板容器(毛玻璃遮罩 + 安全区 + 防滚动穿透) */
export function Sheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="no-scroll-chain absolute inset-x-0 bottom-0 mx-auto max-h-[88vh] max-w-md overflow-y-auto rounded-t-[24px] bg-ios-bg px-5 pb-[calc(24px+env(safe-area-inset-bottom))] pt-3 sm:max-w-lg">
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-[rgba(60,60,67,0.3)]" />
        <h2 className="mb-5 text-[20px] font-bold">{title}</h2>
        {children}
      </div>
    </div>
  );
}

/** 面板内统一的主按钮 */
export function PrimaryButton({
  children,
  disabled,
  onClick,
}: {
  children: ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className="w-full rounded-[14px] bg-ios-blue py-3.5 text-[17px] font-semibold text-white transition active:scale-[0.98] disabled:opacity-40"
    >
      {children}
    </button>
  );
}
