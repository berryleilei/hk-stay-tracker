// 全站数据模型。日期一律用 'YYYY-MM-DD' 字符串(本地日历日,不含时分秒,回避时区问题)。

/** 出入境方向 */
export type Direction = 'in' | 'out';

/** 一条出入境记录(打卡 / 补打卡都生成这个) */
export interface Crossing {
  id: string;
  /** 'YYYY-MM-DD' */
  date: string;
  direction: Direction;
  /** 可选备注,如「回内地探亲」 */
  note?: string;
}

/** 成员身份。受养人(配偶 / 子女)续签跟随主申请人,但永居各自满 7 年通常性居住 */
export type MemberRole = 'principal' | 'spouse' | 'child' | 'other';

export interface Member {
  id: string;
  name: string;
  role: MemberRole;
  /**
   * 永居「通常性居住」起算日 'YYYY-MM-DD'。
   * 不填则默认取该成员首次入境日。
   */
  residenceStart?: string;
  crossings: Crossing[];
}

/** 到期提醒类型 */
export type ReminderType = 'visa' | 'sim' | 'other';

export interface Reminder {
  id: string;
  type: ReminderType;
  /** 到期日 'YYYY-MM-DD' */
  date: string;
  /** 关联成员 id;不填 = 全家共享(如签证) */
  memberId?: string;
  /** 自定义标题(选填,默认按类型生成) */
  title?: string;
}

export interface AppData {
  /** schema 版本,用于将来迁移 localStorage 数据 */
  version: number;
  members: Member[];
  /** 到期提醒:签证续签 / 储值电话卡 / 其它 */
  reminders: Reminder[];
  /** @deprecated 旧字段,load 时迁移进 reminders */
  visaExpiry?: string;
}

export const REMINDER_TYPE_LABEL: Record<ReminderType, string> = {
  visa: '签证续签',
  sim: '储值电话卡',
  other: '其它',
};

export const ROLE_LABEL: Record<MemberRole, string> = {
  principal: '主申请人',
  spouse: '配偶 · 受养人',
  child: '子女 · 受养人',
  other: '其他',
};
