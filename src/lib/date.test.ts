import { describe, expect, it } from 'vitest';
import { addDays, addMonths, addYears, diffDays, fromDay, toDay } from './date';

describe('date 工具', () => {
  it('toDay / fromDay 往返一致', () => {
    for (const iso of ['1970-01-01', '2024-02-29', '2026-06-16', '2032-12-31']) {
      expect(fromDay(toDay(iso))).toBe(iso);
    }
  });

  it('1970-01-01 是第 0 天', () => {
    expect(toDay('1970-01-01')).toBe(0);
  });

  it('diffDays 求差', () => {
    expect(diffDays('2026-01-11', '2026-01-01')).toBe(10);
    expect(diffDays('2026-01-01', '2026-01-11')).toBe(-10);
    expect(diffDays('2026-01-01', '2026-01-01')).toBe(0);
  });

  it('addDays 跨月、跨年', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('addDays 闰年 2 月', () => {
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29'); // 2024 闰年
    expect(addDays('2025-02-28', 1)).toBe('2025-03-01'); // 2025 平年
  });

  it('addMonths 往前推 12 个月', () => {
    expect(addMonths('2026-06-16', -12)).toBe('2025-06-16');
    expect(addMonths('2026-01-15', 1)).toBe('2026-02-15');
  });

  it('addYears 加 7 年;2/29 平年归一到 3/1', () => {
    expect(addYears('2025-01-01', 7)).toBe('2032-01-01');
    expect(addYears('2024-02-29', 7)).toBe('2031-03-01'); // 2031 非闰年
  });

  it('非法日期抛错', () => {
    expect(() => toDay('2025-02-30')).toThrow();
    expect(() => toDay('2025-13-01')).toThrow();
    expect(() => toDay('2025-1-1')).toThrow(); // 必须零填充
    expect(() => toDay('abc')).toThrow();
  });
});
