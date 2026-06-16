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

export interface AppData {
  /** schema 版本,用于将来迁移 localStorage 数据 */
  version: number;
  members: Member[];
  /** 全家签证续签到期日 'YYYY-MM-DD'(受养人跟随主申请人) */
  visaExpiry?: string;
}

export const ROLE_LABEL: Record<MemberRole, string> = {
  principal: '主申请人',
  spouse: '配偶 · 受养人',
  child: '子女 · 受养人',
  other: '其他',
};
