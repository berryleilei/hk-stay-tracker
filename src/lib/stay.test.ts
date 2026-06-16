import { describe, expect, it } from 'vitest';
import { Member } from '../types';
import {
  buildSegments,
  buildTimeline,
  computeStats,
  countInWindow,
  mergeDays,
  reachesTaxThreshold,
} from './stay';

function member(crossings: Member['crossings'], extra?: Partial<Member>): Member {
  return { id: 'm', name: '测试', role: 'principal', crossings, ...extra };
}
const C = (date: string, direction: 'in' | 'out') => ({ id: date + direction, date, direction });

describe('buildSegments 状态机', () => {
  it('一进一出 → 一段', () => {
    const segs = buildSegments([C('2026-01-01', 'in'), C('2026-01-10', 'out')], '2026-02-01');
    expect(segs).toHaveLength(1);
    expect(segs[0]).toMatchObject({ open: false });
  });

  it('仅入境 → 开放区间 end=today', () => {
    const segs = buildSegments([C('2026-06-01', 'in')], '2026-06-16');
    expect(segs[0]!.open).toBe(true);
    expect(segs[0]!.end - segs[0]!.start).toBe(15);
  });

  it('首条离境(无入境)被忽略', () => {
    const segs = buildSegments([C('2026-01-05', 'out'), C('2026-01-10', 'in')], '2026-01-20');
    expect(segs).toHaveLength(1);
    expect(segs[0]!.open).toBe(true);
  });

  it('重复入境被忽略(取第一条)', () => {
    const segs = buildSegments(
      [C('2026-01-01', 'in'), C('2026-01-05', 'in'), C('2026-01-10', 'out')],
      '2026-02-01'
    );
    expect(segs).toHaveLength(1);
    expect(segs[0]!.end - segs[0]!.start).toBe(9); // 01-01..01-10
  });
});

describe('两端都算口径', () => {
  it('入境到离境含头含尾', () => {
    // 01-01 入,01-10 出 → 10 天
    const s = computeStats(member([C('2026-01-01', 'in'), C('2026-01-10', 'out')]), '2026-02-01');
    expect(s.totalInHK).toBe(10);
  });

  it('当天进当天出 = 1 天', () => {
    const s = computeStats(member([C('2026-02-01', 'in'), C('2026-02-01', 'out')]), '2026-03-01');
    expect(s.totalInHK).toBe(1);
  });

  it('仍在港:本次连续含今天', () => {
    const s = computeStats(member([C('2026-06-01', 'in')]), '2026-06-16');
    expect(s.inHK).toBe(true);
    expect(s.currentStreak).toBe(16); // 06-01..06-16
    expect(s.sinceDate).toBe('2026-06-01');
  });
});

describe('mergeDays 防重复计数', () => {
  it('共享端点(同日出又进)只计一次', () => {
    // 01-01..01-10(10)与 01-10..01-15(6)共享 01-10 → 合并 15 天,而非 16
    const s = computeStats(
      member([
        C('2026-01-01', 'in'),
        C('2026-01-10', 'out'),
        C('2026-01-10', 'in'),
        C('2026-01-15', 'out'),
      ]),
      '2026-02-01'
    );
    expect(s.totalInHK).toBe(15);
  });

  it('mergeDays 相邻不重叠各自计数', () => {
    const merged = mergeDays([
      { start: 0, end: 9, open: false },
      { start: 11, end: 15, open: false }, // 中间第 10 天是空隙
    ]);
    expect(merged).toHaveLength(2);
  });

  it('countInWindow 裁剪窗口', () => {
    const merged = [{ start: 0, end: 100 }];
    expect(countInWindow(merged, 10, 19)).toBe(10);
    expect(countInWindow(merged, 50, 49)).toBe(0); // 空窗口
  });
});

describe('computeStats 综合场景', () => {
  // 2025-01-01 入 → 01-31 出(31 天);2025-03-01 入 → 至今(开放)。today=2025-03-10。
  const m = member([C('2025-01-01', 'in'), C('2025-01-31', 'out'), C('2025-03-01', 'in')]);
  const s = computeStats(m, '2025-03-10');

  it('累计在港 = 31 + 10 = 41', () => {
    expect(s.totalInHK).toBe(41);
  });
  it('累计离港 = 2 月整月 28 天', () => {
    expect(s.totalAway).toBe(28);
  });
  it('当前在港、连续 10 天', () => {
    expect(s.inHK).toBe(true);
    expect(s.currentStreak).toBe(10);
  });
  it('首次入境 / 记录条数', () => {
    expect(s.firstEntry).toBe('2025-01-01');
    expect(s.crossingCount).toBe(3);
  });
  it('滚动 12 个月在港 41 天,窗口约一年', () => {
    expect(s.rolling12mInHK).toBe(41);
    expect(s.rolling12mWindowDays).toBeGreaterThanOrEqual(365);
    expect(s.rolling12mWindowDays).toBeLessThanOrEqual(366);
  });
  it('本公历年(2025)至今在港 41 天', () => {
    expect(s.taxCalendarYear).toBe(41);
  });
  it('永居目标日 = 起算 + 7 年', () => {
    expect(s.prTargetDate).toBe('2032-01-01');
    expect(s.prElapsedDays).toBe(68); // 01-01 → 03-10
  });
});

describe('上一次离港', () => {
  it('取最近一条离境记录 + 距今天数', () => {
    // 2025-01-31 出、2026-04-10 出 → 最近离港 2026-04-10
    const m = member([
      C('2025-01-01', 'in'),
      C('2025-01-31', 'out'),
      C('2026-02-15', 'in'),
      C('2026-04-10', 'out'),
    ]);
    const s = computeStats(m, '2026-06-16');
    expect(s.lastDeparture).toBe('2026-04-10');
    expect(s.daysSinceLastDeparture).toBe(67); // 04-10 → 06-16
  });

  it('从未离港返回 null', () => {
    const s = computeStats(member([C('2026-06-01', 'in')]), '2026-06-16');
    expect(s.lastDeparture).toBeNull();
    expect(s.daysSinceLastDeparture).toBeNull();
  });

  it('当前在港时仍指向上一次离开', () => {
    const m = member([C('2026-02-15', 'in'), C('2026-04-10', 'out'), C('2026-05-02', 'in')]);
    const s = computeStats(m, '2026-06-16');
    expect(s.inHK).toBe(true);
    expect(s.lastDeparture).toBe('2026-04-10');
  });
});

describe('滚动 12 个月剔除窗口外旧记录', () => {
  it('一年前的在港天数不计入滚动 12 个月', () => {
    // 早期 2024 年待了一整段,今天 2026-06-16,该段在窗口外
    const m = member([
      C('2024-01-01', 'in'),
      C('2024-03-01', 'out'), // 窗口外
      C('2026-05-01', 'in'),
      C('2026-05-31', 'out'), // 窗口内 31 天
    ]);
    const s = computeStats(m, '2026-06-16');
    expect(s.rolling12mInHK).toBe(31);
    expect(s.totalInHK).toBeGreaterThan(31); // 累计含旧段
  });
});

describe('离港状态', () => {
  it('已离港天数 = today − 最近离境日', () => {
    const s = computeStats(member([C('2026-05-01', 'in'), C('2026-06-10', 'out')]), '2026-06-16');
    expect(s.inHK).toBe(false);
    expect(s.awayDays).toBe(6); // 06-10 → 06-16
    expect(s.sinceDate).toBe('2026-06-10');
    expect(s.currentStreak).toBe(0);
  });
});

describe('183 阈值', () => {
  it('恰好 183 触及,182 未触及', () => {
    expect(reachesTaxThreshold(183)).toBe(true);
    expect(reachesTaxThreshold(182)).toBe(false);
  });
});

describe('buildTimeline', () => {
  const rows = buildTimeline(
    [C('2025-01-01', 'in'), C('2025-01-31', 'out'), C('2025-03-01', 'in')],
    '2025-03-10'
  );
  it('倒序、最新在上、标注每段时长', () => {
    expect(rows[0]).toMatchObject({ label: '至今 10 天', ongoing: true });
    expect(rows[1]).toMatchObject({ label: '离港 28 天', ongoing: false });
    expect(rows[2]).toMatchObject({ label: '在港 31 天', ongoing: false });
  });

  it('当前离港 → 已离港标签', () => {
    const r = buildTimeline([C('2026-05-01', 'in'), C('2026-06-10', 'out')], '2026-06-16');
    expect(r[0]).toMatchObject({ direction: 'out', label: '已离港 6 天', ongoing: true });
  });
});

describe('空数据不崩', () => {
  it('无记录返回零值', () => {
    const s = computeStats(member([]), '2026-06-16');
    expect(s.inHK).toBe(false);
    expect(s.totalInHK).toBe(0);
    expect(s.firstEntry).toBeNull();
    expect(s.prTargetDate).toBeNull();
  });
});
