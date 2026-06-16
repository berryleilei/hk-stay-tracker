import { describe, expect, it } from 'vitest';
import { Reminder } from '../types';
import {
  countdownText,
  daysLeft,
  reminderTitle,
  sortReminders,
  toneOf,
} from './reminder';

const R = (id: string, date: string, extra?: Partial<Reminder>): Reminder => ({
  id,
  type: 'sim',
  date,
  ...extra,
});

describe('daysLeft', () => {
  it('未来为正、过期为负、今天为 0', () => {
    expect(daysLeft(R('a', '2026-07-01'), '2026-06-16')).toBe(15);
    expect(daysLeft(R('a', '2026-06-10'), '2026-06-16')).toBe(-6);
    expect(daysLeft(R('a', '2026-06-16'), '2026-06-16')).toBe(0);
  });
});

describe('toneOf 紧急度', () => {
  it('阈值 30 / 7 边界', () => {
    expect(toneOf(31)).toBe('normal');
    expect(toneOf(30)).toBe('soon');
    expect(toneOf(8)).toBe('soon');
    expect(toneOf(7)).toBe('urgent');
    expect(toneOf(0)).toBe('urgent');
    expect(toneOf(-1)).toBe('expired');
  });
});

describe('countdownText', () => {
  it('正常 / 临近 / 过期 文案', () => {
    expect(countdownText(288)).toMatchObject({ big: '288', small: '天后' });
    expect(countdownText(15)).toMatchObject({ big: '15', small: '天后到期' });
    expect(countdownText(0)).toMatchObject({ big: '今天' });
    expect(countdownText(-6)).toMatchObject({ big: '6', small: '天 · 已过期' });
  });
});

describe('reminderTitle', () => {
  it('优先自定义,否则按类型', () => {
    expect(reminderTitle(R('a', '2026-07-01'))).toBe('储值电话卡');
    expect(reminderTitle(R('a', '2026-07-01', { title: '我的中移卡' }))).toBe('我的中移卡');
    expect(reminderTitle(R('a', '2026-07-01', { type: 'visa' }))).toBe('签证续签');
  });
});

describe('sortReminders', () => {
  it('最紧急(剩余天数最少)在前', () => {
    const list = [R('far', '2027-01-01'), R('near', '2026-06-20'), R('expired', '2026-06-01')];
    const sorted = sortReminders(list, '2026-06-16');
    expect(sorted.map((r) => r.id)).toEqual(['expired', 'near', 'far']);
  });
});
