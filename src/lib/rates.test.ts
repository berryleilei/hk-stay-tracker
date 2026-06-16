import { describe, expect, it } from 'vitest';
import { computeChange, convert, formatMoney, upsertSnapshot } from './rates';

describe('convert 换算', () => {
  it('HKD→CNY 与反向', () => {
    expect(convert(10000, 0.8644, 'hkd2cny')).toBeCloseTo(8644, 0);
    expect(convert(100, 0.8644, 'cny2hkd')).toBeCloseTo(115.69, 1);
  });
});

describe('formatMoney 千分位', () => {
  it('两位小数 + 逗号', () => {
    expect(formatMoney(8643.75)).toBe('8,643.75');
    expect(formatMoney(1156.9, 1)).toBe('1,156.9');
  });
});

describe('upsertSnapshot 历史快照', () => {
  it('同日替换、不重复', () => {
    let h = upsertSnapshot([], { date: '2026-06-15', rate: 0.86 });
    h = upsertSnapshot(h, { date: '2026-06-16', rate: 0.87 });
    h = upsertSnapshot(h, { date: '2026-06-16', rate: 0.865 }); // 替换当日
    expect(h).toHaveLength(2);
    expect(h.find((x) => x.date === '2026-06-16')!.rate).toBe(0.865);
  });
  it('只保留最近 90 条', () => {
    let h: { date: string; rate: number }[] = [];
    for (let i = 0; i < 100; i++) h = upsertSnapshot(h, { date: `2026-01-${i}`, rate: i });
    expect(h.length).toBe(90);
  });
});

describe('computeChange 涨跌', () => {
  const hist = [
    { date: '2026-06-14', rate: 0.86 },
    { date: '2026-06-15', rate: 0.862 },
  ];
  it('对比最近一个更早日期', () => {
    const c = computeChange(0.865, hist, '2026-06-16');
    expect(c).not.toBeNull();
    expect(c!.sinceDate).toBe('2026-06-15');
    expect(c!.delta).toBeCloseTo(0.003, 4);
    expect(c!.pct).toBeCloseTo(0.348, 2);
  });
  it('无更早快照返回 null', () => {
    expect(computeChange(0.865, [{ date: '2026-06-16', rate: 0.865 }], '2026-06-16')).toBeNull();
  });
});
