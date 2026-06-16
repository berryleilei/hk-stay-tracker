// 在港天数计算核心 —— 全部纯函数,today 作为参数传入(不读系统时间),便于测试。
//
// 天数口径(用户确认):入境日与离境日两端均计入在港天数(香港入境处通行算法)。
// 即一段「入境 A → 离境 B」的在港天数 = B − A + 1(含头含尾)。
// 仍在港(最后一条是入境、无对应离境)的开放区间,end 取 today。

import { Member } from '../types';
import { addMonths, addYears, fromDay, toDay } from './date';

/** 在港区间,用天序号表示,[start, end] 含端点。open 表示仍在港(end = today)。 */
export interface Segment {
  start: number;
  end: number;
  open: boolean;
}

/** 把成员的出入境记录按日期升序排好(稳定:同日按数组原顺序) */
export function sortCrossings<T extends { date: string }>(crossings: readonly T[]): T[] {
  return [...crossings].sort((a, b) => toDay(a.date) - toDay(b.date));
}

/**
 * 由出入境记录推导在港区间。
 * 状态机容错:已在港时再来一条「入境」忽略;已离港时再来一条「离境」忽略。
 * 首条若是「离境」(无对应入境)忽略。
 */
export function buildSegments(crossings: readonly { date: string; direction: 'in' | 'out' }[], todayIso: string): Segment[] {
  const today = toDay(todayIso);
  const sorted = sortCrossings(crossings);
  const segs: Segment[] = [];
  let entry: number | null = null;

  for (const c of sorted) {
    const day = toDay(c.date);
    if (c.direction === 'in') {
      if (entry === null) entry = day;
    } else {
      if (entry !== null) {
        segs.push({ start: entry, end: day, open: false });
        entry = null;
      }
    }
  }
  if (entry !== null) {
    // 开放区间:end 取 today。若入境日在未来(> today),clamp 成 0 天(start>end 时下游会处理)
    segs.push({ start: entry, end: Math.max(entry, today), open: true });
  }
  return segs;
}

/** 合并重叠或共享端点的区间,得到「互不重叠的在港日集合」,避免同一天被重复计数。 */
export function mergeDays(segs: readonly Segment[]): Array<{ start: number; end: number }> {
  const valid = segs.filter((s) => s.end >= s.start).map((s) => ({ start: s.start, end: s.end }));
  valid.sort((a, b) => a.start - b.start);
  const merged: Array<{ start: number; end: number }> = [];
  for (const s of valid) {
    const last = merged[merged.length - 1];
    // 含端点重叠(start <= last.end)才合并;相邻不重叠(start === last.end + 1)各自计数,不会重复
    if (last && s.start <= last.end) {
      last.end = Math.max(last.end, s.end);
    } else {
      merged.push({ ...s });
    }
  }
  return merged;
}

/** 统计区间集合落在窗口 [winStart, winEnd](含端点,天序号)内的去重在港天数 */
export function countInWindow(
  merged: readonly { start: number; end: number }[],
  winStart: number,
  winEnd: number
): number {
  if (winEnd < winStart) return 0;
  let sum = 0;
  for (const s of merged) {
    const a = Math.max(s.start, winStart);
    const b = Math.min(s.end, winEnd);
    if (b >= a) sum += b - a + 1;
  }
  return sum;
}

/** 单个成员的全部统计结果(对外 ISO 字符串 / 天数) */
export interface MemberStats {
  /** 当前是否在港 */
  inHK: boolean;
  /** 关键日期:在港时=最近入境日;离港时=最近离境日;无记录=null */
  sinceDate: string | null;
  /** 在港时:本次连续在港天数(含头含尾);离港时:0 */
  currentStreak: number;
  /** 离港时:已离港天数(today − 最近离境日);在港时:0 */
  awayDays: number;
  /** 首次入境日 */
  firstEntry: string | null;
  /** 上一次离港日期(最近一条离境记录;从未离港则为 null) */
  lastDeparture: string | null;
  /** 距上一次离港至今多少天(today − 上次离港日;从未离港则为 null) */
  daysSinceLastDeparture: number | null;
  /** 累计在港总天数(去重) */
  totalInHK: number;
  /** 累计离港天数(自首次入境至今的总跨度 − 在港天数) */
  totalAway: number;
  /** 出入境记录条数 */
  crossingCount: number;
  /** 滚动 12 个月内在港天数(续签佐证) */
  rolling12mInHK: number;
  /** 滚动 12 个月窗口长度(分母,365 或 366) */
  rolling12mWindowDays: number;
  /** 本公历年(1/1 至 today)在港天数(税务) */
  taxCalendarYear: number;
  /** 永居「满 7 年」目标日 */
  prTargetDate: string | null;
  /** 永居已累计居住天数(自起算日至今) */
  prElapsedDays: number;
  /** 永居 7 年总天数(起算日至目标日) */
  prTotalDays: number;
}

const TAX_THRESHOLD = 183;
const PR_YEARS = 7;

export function computeStats(member: Member, todayIso: string): MemberStats {
  const today = toDay(todayIso);
  const sorted = sortCrossings(member.crossings);
  const lastOut = [...sorted].reverse().find((c) => c.direction === 'out') ?? null;
  const segs = buildSegments(sorted, todayIso);
  const merged = mergeDays(segs);

  const totalInHK = merged.reduce((acc, s) => acc + (s.end - s.start + 1), 0);
  const openSeg = segs.find((s) => s.open) ?? null;
  const inHK = openSeg !== null;
  const firstEntryDay = segs.length > 0 ? segs[0]!.start : null;

  // 当前状态
  let sinceDate: string | null = null;
  let currentStreak = 0;
  let awayDays = 0;
  if (inHK && openSeg) {
    sinceDate = fromDay(openSeg.start);
    currentStreak = Math.max(0, today - openSeg.start + 1);
  } else if (sorted.length > 0) {
    const lastOut = sorted[sorted.length - 1]!;
    sinceDate = lastOut.date;
    awayDays = Math.max(0, today - toDay(lastOut.date));
  }

  // 滚动 12 个月:窗口 = [今天往前推 12 个月 + 1 天, 今天],含端点
  const winStart = toDay(addMonths(todayIso, -12)) + 1;
  const rolling12mInHK = countInWindow(merged, winStart, today);
  const rolling12mWindowDays = today - winStart + 1;

  // 本公历年至今
  const year = todayIso.slice(0, 4);
  const taxCalendarYear = countInWindow(merged, toDay(`${year}-01-01`), today);

  // 永居:起算日 = 自定义 residenceStart,否则首次入境
  const prStart = member.residenceStart ?? (firstEntryDay !== null ? fromDay(firstEntryDay) : null);
  let prTargetDate: string | null = null;
  let prElapsedDays = 0;
  let prTotalDays = 0;
  if (prStart) {
    prTargetDate = addYears(prStart, PR_YEARS);
    prElapsedDays = Math.max(0, today - toDay(prStart));
    prTotalDays = toDay(prTargetDate) - toDay(prStart);
  }

  return {
    inHK,
    sinceDate,
    currentStreak,
    awayDays,
    firstEntry: firstEntryDay !== null ? fromDay(firstEntryDay) : null,
    lastDeparture: lastOut ? lastOut.date : null,
    daysSinceLastDeparture: lastOut ? today - toDay(lastOut.date) : null,
    totalInHK,
    totalAway: firstEntryDay !== null ? Math.max(0, today - firstEntryDay + 1 - totalInHK) : 0,
    crossingCount: sorted.length,
    rolling12mInHK,
    rolling12mWindowDays,
    taxCalendarYear,
    prTargetDate,
    prElapsedDays,
    prTotalDays,
  };
}

/** 是否触及 183 天税务阈值 */
export function reachesTaxThreshold(days: number): boolean {
  return days >= TAX_THRESHOLD;
}

export const TAX_DAYS = TAX_THRESHOLD;
export const PR_TOTAL_YEARS = PR_YEARS;

// ───────── 时间轴(给详情页用)─────────

export interface TimelineRow {
  date: string;
  direction: 'in' | 'out';
  /** 显示标签,如「在港 55 天」「至今 46 天」「离港 21 天」「已离港 6 天」 */
  label: string;
  /** 该段是否仍在进行(在港中 / 离港中) */
  ongoing: boolean;
}

/**
 * 构建时间轴行(按日期倒序,最新在上)。
 * 入境行 → 标注这段在港多少天;离境行 → 标注这段离港多少天。
 */
export function buildTimeline(crossings: readonly { date: string; direction: 'in' | 'out' }[], todayIso: string): TimelineRow[] {
  const today = toDay(todayIso);
  const sorted = sortCrossings(crossings);
  const rows: TimelineRow[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const c = sorted[i]!;
    const cur = toDay(c.date);
    const next = sorted[i + 1];

    if (c.direction === 'in') {
      if (!next) {
        const days = Math.max(0, today - cur + 1);
        rows.push({ date: c.date, direction: 'in', label: `至今 ${days} 天`, ongoing: true });
      } else if (next.direction === 'out') {
        const days = toDay(next.date) - cur + 1; // 含头含尾
        rows.push({ date: c.date, direction: 'in', label: `在港 ${days} 天`, ongoing: false });
      } else {
        // 异常:连续两条入境,按到下一条入境前一天估算,不含尾
        const days = Math.max(0, toDay(next.date) - cur);
        rows.push({ date: c.date, direction: 'in', label: `在港 ${days} 天`, ongoing: false });
      }
    } else {
      if (!next) {
        const days = Math.max(0, today - cur); // 离境日仍算在港,故不 +1
        rows.push({ date: c.date, direction: 'out', label: `已离港 ${days} 天`, ongoing: true });
      } else if (next.direction === 'in') {
        const days = Math.max(0, toDay(next.date) - cur - 1); // 两端皆在港,故 −1
        rows.push({ date: c.date, direction: 'out', label: `离港 ${days} 天`, ongoing: false });
      } else {
        const days = Math.max(0, toDay(next.date) - cur);
        rows.push({ date: c.date, direction: 'out', label: `离港 ${days} 天`, ongoing: false });
      }
    }
  }

  return rows.reverse();
}
