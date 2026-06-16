// 到期提醒:剩余天数 + 紧急度配色。纯函数,today 传入。

import { Reminder, REMINDER_TYPE_LABEL } from '../types';
import { diffDays } from './date';

/** 临近 / 紧急阈值(天) */
export const SOON_DAYS = 30;
export const URGENT_DAYS = 7;

export type ReminderTone = 'normal' | 'soon' | 'urgent' | 'expired';

/** 距到期还有几天(负数 = 已过期) */
export function daysLeft(reminder: Reminder, todayIso: string): number {
  return diffDays(reminder.date, todayIso);
}

export function toneOf(daysLeftValue: number): ReminderTone {
  if (daysLeftValue < 0) return 'expired';
  if (daysLeftValue <= URGENT_DAYS) return 'urgent';
  if (daysLeftValue <= SOON_DAYS) return 'soon';
  return 'normal';
}

/** 每种紧急度的配色 class(对齐 iOS 系统色) */
export const TONE_STYLE: Record<
  ReminderTone,
  { bg: string; accent: string; label: string }
> = {
  normal: { bg: 'bg-ios-blue/[0.08]', accent: 'text-ios-blue', label: 'text-ios-blue' },
  soon: { bg: 'bg-ios-orange/[0.10]', accent: 'text-ios-orange', label: 'text-ios-orange-text' },
  urgent: { bg: 'bg-ios-red/[0.10]', accent: 'text-ios-red', label: 'text-ios-red-text' },
  expired: { bg: 'bg-ios-red/[0.10]', accent: 'text-ios-red', label: 'text-ios-red-text' },
};

/** 倒数文案:正常「N 天后」、临近/紧急「N 天后到期」、已过期「已过期 N 天」 */
export function countdownText(daysLeftValue: number): { big: string; small: string } {
  if (daysLeftValue < 0) return { big: String(-daysLeftValue), small: '天 · 已过期' };
  if (daysLeftValue === 0) return { big: '今天', small: '到期' };
  return { big: String(daysLeftValue), small: daysLeftValue <= SOON_DAYS ? '天后到期' : '天后' };
}

/** 提醒标题:优先自定义,否则按类型 */
export function reminderTitle(reminder: Reminder): string {
  return reminder.title?.trim() || REMINDER_TYPE_LABEL[reminder.type];
}

/** 排序:按剩余天数升序(最紧急在前),已过期排最前 */
export function sortReminders(reminders: readonly Reminder[], todayIso: string): Reminder[] {
  return [...reminders].sort((a, b) => daysLeft(a, todayIso) - daysLeft(b, todayIso));
}
