// 持久层:数据只存浏览器 localStorage,全程不联网、不上传。
// 提供:读取(带默认种子)、保存、导出 JSON、导入 JSON(防丢:清缓存前可备份)。

import { AppData, Crossing, Member, Reminder } from '../types';

const STORAGE_KEY = 'hk-stay-tracker:v1';
const SCHEMA_VERSION = 2;

/** 生成 id(优先用原生 crypto.randomUUID,降级到时间戳+随机) */
export function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** 首次使用的默认数据:只有一个空的主申请人 */
export function seedData(): AppData {
  return {
    version: SCHEMA_VERSION,
    members: [{ id: newId(), name: '我', role: 'principal', crossings: [] }],
    reminders: [],
  };
}

/** 迁移:旧的 visaExpiry 字段 → reminders 里的一条签证提醒;补齐缺失的 reminders */
function migrate(data: AppData): AppData {
  const reminders: Reminder[] = Array.isArray(data.reminders) ? [...data.reminders] : [];
  let next = { ...data, reminders };
  if (data.visaExpiry) {
    const already = reminders.some((r) => r.type === 'visa' && r.date === data.visaExpiry);
    if (!already) reminders.push({ id: newId(), type: 'visa', date: data.visaExpiry });
    const { visaExpiry: _drop, ...rest } = next;
    void _drop;
    next = { ...rest, reminders };
  }
  return { ...next, version: SCHEMA_VERSION };
}

/** 轻量校验:挡住结构不对的导入文件,避免污染状态 */
function isValidAppData(v: unknown): v is AppData {
  if (typeof v !== 'object' || v === null) return false;
  const o = v as Record<string, unknown>;
  if (!Array.isArray(o.members)) return false;
  return o.members.every((m) => {
    if (typeof m !== 'object' || m === null) return false;
    const mm = m as Record<string, unknown>;
    return (
      typeof mm.id === 'string' &&
      typeof mm.name === 'string' &&
      Array.isArray(mm.crossings) &&
      (mm.crossings as unknown[]).every((c) => {
        if (typeof c !== 'object' || c === null) return false;
        const cc = c as Record<string, unknown>;
        return (
          typeof cc.date === 'string' && (cc.direction === 'in' || cc.direction === 'out')
        );
      })
    );
  });
}

export function load(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedData();
    const parsed: unknown = JSON.parse(raw);
    if (!isValidAppData(parsed)) return seedData();
    return migrate(parsed);
  } catch {
    return seedData();
  }
}

export function save(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/** 导出为可下载的 JSON 文本(用于备份 / 换设备迁移) */
export function exportJSON(data: AppData): string {
  return JSON.stringify(data, null, 2);
}

/** 从 JSON 文本导入。失败返回 null,不抛错,UI 据此提示。 */
export function importJSON(text: string): AppData | null {
  try {
    const parsed: unknown = JSON.parse(text);
    if (!isValidAppData(parsed)) return null;
    return migrate(parsed);
  } catch {
    return null;
  }
}

// ───────── 纯数据操作(返回新对象,配合 React 状态)─────────

export function addCrossing(member: Member, crossing: Omit<Crossing, 'id'>): Member {
  return { ...member, crossings: [...member.crossings, { ...crossing, id: newId() }] };
}

export function removeCrossing(member: Member, crossingId: string): Member {
  return { ...member, crossings: member.crossings.filter((c) => c.id !== crossingId) };
}

export function upsertMember(data: AppData, member: Member): AppData {
  const exists = data.members.some((m) => m.id === member.id);
  return {
    ...data,
    members: exists
      ? data.members.map((m) => (m.id === member.id ? member : m))
      : [...data.members, member],
  };
}

export function removeMember(data: AppData, memberId: string): AppData {
  return {
    ...data,
    members: data.members.filter((m) => m.id !== memberId),
    // 同时清掉关联到该成员的提醒
    reminders: data.reminders.filter((r) => r.memberId !== memberId),
  };
}

// ───────── 到期提醒 ─────────

export function upsertReminder(data: AppData, reminder: Reminder): AppData {
  const exists = data.reminders.some((r) => r.id === reminder.id);
  return {
    ...data,
    reminders: exists
      ? data.reminders.map((r) => (r.id === reminder.id ? reminder : r))
      : [...data.reminders, reminder],
  };
}

export function removeReminder(data: AppData, reminderId: string): AppData {
  return { ...data, reminders: data.reminders.filter((r) => r.id !== reminderId) };
}
