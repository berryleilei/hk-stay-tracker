// 日期工具:全部基于「UTC 天序号」(自 1970-01-01 起的整数天)做运算。
// 这样加减天数 / 求差 不受时区、夏令时影响,也跟 'YYYY-MM-DD' 一一对应。

const MS_PER_DAY = 86_400_000;
const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** 'YYYY-MM-DD' → 天序号。非法格式或非法日期(如 2 月 30 日)抛错。 */
export function toDay(iso: string): number {
  const m = ISO_RE.exec(iso);
  if (!m) throw new Error(`非法日期格式: ${iso}(应为 YYYY-MM-DD)`);
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const ts = Date.UTC(y, mo - 1, d);
  const dt = new Date(ts);
  // 校验回写一致,挡住 2025-02-30 / 2025-13-01 这类「合法格式但非法日期」
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) {
    throw new Error(`非法日期: ${iso}`);
  }
  return Math.floor(ts / MS_PER_DAY);
}

/** 天序号 → 'YYYY-MM-DD' */
export function fromDay(day: number): string {
  const dt = new Date(day * MS_PER_DAY);
  const y = dt.getUTCFullYear();
  const mo = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const d = String(dt.getUTCDate()).padStart(2, '0');
  return `${y}-${mo}-${d}`;
}

/** a、b 两个 ISO 日期相差天数(b - a) */
export function diffDays(b: string, a: string): number {
  return toDay(b) - toDay(a);
}

/** ISO 日期加 n 天(可负) */
export function addDays(iso: string, n: number): string {
  return fromDay(toDay(iso) + n);
}

/** ISO 日期加 n 个月(可负)。溢出按 JS 规则归一(如 1/31 + 1 月 → 3/2/3 取决于年份) */
export function addMonths(iso: string, n: number): string {
  const m = ISO_RE.exec(iso);
  if (!m) throw new Error(`非法日期格式: ${iso}`);
  const ts = Date.UTC(Number(m[1]), Number(m[2]) - 1 + n, Number(m[3]));
  return fromDay(Math.floor(ts / MS_PER_DAY));
}

/** ISO 日期加 n 年(可负)。2/29 落到非闰年时按 JS 规则归一到 3/1 */
export function addYears(iso: string, n: number): string {
  const m = ISO_RE.exec(iso);
  if (!m) throw new Error(`非法日期格式: ${iso}`);
  const ts = Date.UTC(Number(m[1]) + n, Number(m[2]) - 1, Number(m[3]));
  return fromDay(Math.floor(ts / MS_PER_DAY));
}

/** from → to 的「整年整月」时长(用于永居进度「X 年 Y 月」展示) */
export function ymBetween(fromIso: string, toIso: string): { years: number; months: number } {
  const a = ISO_RE.exec(fromIso);
  const b = ISO_RE.exec(toIso);
  if (!a || !b) throw new Error('非法日期格式');
  let years = Number(b[1]) - Number(a[1]);
  let months = Number(b[2]) - Number(a[2]);
  const days = Number(b[3]) - Number(a[3]);
  if (days < 0) months -= 1;
  if (months < 0) {
    months += 12;
    years -= 1;
  }
  if (years < 0) return { years: 0, months: 0 };
  return { years, months };
}
