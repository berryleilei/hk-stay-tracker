// 港币兑人民币汇率:实时市场中间价(= ZA Bank App 内兑换采用的价)。
// 拉取公开免费源 open.er-api(支持浏览器跨域),带本地缓存 + 按日历史快照做涨跌对比。
// 只读取公开汇率,不上传任何用户数据。

export const ZA_FX_URL = 'https://bank.za.group/hk/foreignexchange';
const API = 'https://open.er-api.com/v6/latest/HKD';
const CACHE_KEY = 'hk-stay-tracker:rates';

export interface RateData {
  /** 1 HKD = rate CNY */
  rate: number;
  /** 来源更新时间(人读文本) */
  updatedText: string;
  /** 本地拉取时间戳 ms */
  fetchedAt: number;
}
export interface RateSnapshot {
  date: string;
  rate: number;
}
interface Cache {
  last: RateData | null;
  history: RateSnapshot[];
}

function readCache(): Cache {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) return JSON.parse(raw) as Cache;
  } catch {
    /* ignore */
  }
  return { last: null, history: [] };
}

function writeCache(c: Cache): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(c));
  } catch {
    /* ignore */
  }
}

/** 最近一次成功拉取的汇率(离线时回退用) */
export function cachedRate(): RateData | null {
  return readCache().last;
}

export function rateHistory(): RateSnapshot[] {
  return readCache().history;
}

/** 拉取实时汇率;成功后写缓存 + 记录当日快照(每天一条) */
export async function fetchRate(todayIso: string, nowMs: number): Promise<RateData> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10_000);
  try {
    const res = await fetch(API, { signal: ctrl.signal });
    const j: { result?: string; rates?: { CNY?: number }; time_last_update_utc?: string } =
      await res.json();
    if (j.result !== 'success' || typeof j.rates?.CNY !== 'number') {
      throw new Error('汇率源返回异常');
    }
    const data: RateData = {
      rate: j.rates.CNY,
      updatedText: j.time_last_update_utc ?? '',
      fetchedAt: nowMs,
    };
    const c = readCache();
    const history = upsertSnapshot(c.history, { date: todayIso, rate: data.rate });
    writeCache({ last: data, history });
    return data;
  } finally {
    clearTimeout(timer);
  }
}

/** 把当日快照写进历史(替换当日已有),只保留最近 90 条 */
export function upsertSnapshot(history: readonly RateSnapshot[], snap: RateSnapshot): RateSnapshot[] {
  const rest = history.filter((h) => h.date !== snap.date);
  return [...rest, snap].slice(-90);
}

/** 与最近一个更早日期的快照对比,得出涨跌 */
export function computeChange(
  currentRate: number,
  history: readonly RateSnapshot[],
  todayIso: string
): { delta: number; pct: number; sinceDate: string } | null {
  const prior = history
    .filter((h) => h.date < todayIso)
    .sort((a, b) => (a.date < b.date ? 1 : -1))[0];
  if (!prior) return null;
  const delta = currentRate - prior.rate;
  return { delta, pct: (delta / prior.rate) * 100, sinceDate: prior.date };
}

/** 货币换算 */
export function convert(amount: number, rate: number, dir: 'hkd2cny' | 'cny2hkd'): number {
  return dir === 'hkd2cny' ? amount * rate : amount / rate;
}

/** 金额千分位格式化 */
export function formatMoney(n: number, dp = 2): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp });
}
