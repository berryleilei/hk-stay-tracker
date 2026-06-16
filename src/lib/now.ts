// 唯一读取系统时间的地方。隔离在此,核心算法保持纯函数可测。

import { fromDay } from './date';

/** 今天的本地日历日 'YYYY-MM-DD' */
export function todayISO(): string {
  const d = new Date();
  // 用本地年月日(用户身处的时区),再交给基于 UTC 天序号的工具,二者只在「同一日历日」语义上对接
  const ms = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  return fromDay(Math.floor(ms / 86_400_000));
}
