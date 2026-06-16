import { useEffect, useMemo, useRef, useState } from 'react';
import { AppData, Direction, Member, MemberRole } from './types';
import { todayISO } from './lib/now';
import { toDay } from './lib/date';
import {
  addCrossing,
  exportJSON,
  importJSON,
  load,
  newId,
  removeCrossing,
  removeMember,
  save,
  upsertMember,
} from './lib/storage';
import { Home } from './components/Home';
import { PersonDetail } from './components/PersonDetail';
import { RecordSheet } from './components/RecordSheet';
import { MemberSheet } from './components/MemberSheet';

type View = { screen: 'home' } | { screen: 'person'; memberId: string };

export default function App() {
  const [data, setData] = useState<AppData>(() => load());
  const [view, setView] = useState<View>({ screen: 'home' });
  const [recordSheet, setRecordSheet] = useState<{ open: boolean; defaults: string[] }>({
    open: false,
    defaults: [],
  });
  const [memberSheet, setMemberSheet] = useState<{ open: boolean; member: Member | null }>({
    open: false,
    member: null,
  });
  const fileInput = useRef<HTMLInputElement>(null);

  const today = useMemo(() => todayISO(), []);

  // 任何数据变更 → 落盘 localStorage(本机,不联网)
  useEffect(() => {
    save(data);
  }, [data]);

  const currentMember =
    view.screen === 'person' ? data.members.find((m) => m.id === view.memberId) : undefined;

  // ───────── 打卡 / 补打卡 ─────────
  function handleSaveRecord(memberIds: string[], direction: Direction, date: string) {
    setData((prev) => {
      let next = prev;
      for (const id of memberIds) {
        const m = next.members.find((x) => x.id === id);
        if (m) next = upsertMember(next, addCrossing(m, { date, direction }));
      }
      return next;
    });
    setRecordSheet({ open: false, defaults: [] });
  }

  function handleDeleteCrossing(memberId: string, crossingId: string) {
    if (!window.confirm('删除这条出入境记录?')) return;
    const m = data.members.find((x) => x.id === memberId);
    if (m) setData((prev) => upsertMember(prev, removeCrossing(m, crossingId)));
  }

  // ───────── 成员增删改 ─────────
  function handleSaveMember(fields: { name: string; role: MemberRole; residenceStart?: string }) {
    const base = memberSheet.member;
    const member: Member = base
      ? { ...base, name: fields.name, role: fields.role, ...rs(fields.residenceStart) }
      : { id: newId(), name: fields.name, role: fields.role, crossings: [], ...rs(fields.residenceStart) };
    setData((prev) => upsertMember(prev, member));
    setMemberSheet({ open: false, member: null });
  }

  function handleDeleteMember(memberId: string) {
    if (data.members.length <= 1) {
      window.alert('至少保留一位成员。');
      return;
    }
    if (!window.confirm('删除该成员及其全部出入境记录?此操作不可撤销。')) return;
    setData((prev) => removeMember(prev, memberId));
    setView({ screen: 'home' });
  }

  // ───────── 续签到期日 ─────────
  function handleEditVisa() {
    const input = window.prompt('签证续签到期日(YYYY-MM-DD,留空清除)', data.visaExpiry ?? '');
    if (input === null) return;
    const v = input.trim();
    if (v === '') {
      setData((prev) => {
        const { visaExpiry: _drop, ...rest } = prev;
        void _drop;
        return rest;
      });
      return;
    }
    try {
      toDay(v); // 校验合法日期
      setData((prev) => ({ ...prev, visaExpiry: v }));
    } catch {
      window.alert('日期格式应为 YYYY-MM-DD,例如 2027-03-31。');
    }
  }

  // ───────── 备份导出 / 导入 ─────────
  function handleExport() {
    const blob = new Blob([exportJSON(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `在港天数备份-${today}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // 允许重复选同一文件
    if (!file) return;
    file.text().then((text) => {
      const imported = importJSON(text);
      if (!imported) {
        window.alert('导入失败:文件格式不对或已损坏。');
        return;
      }
      if (window.confirm('导入会覆盖当前全部数据,继续?(建议先导出备份)')) {
        setData(imported);
        setView({ screen: 'home' });
      }
    });
  }

  return (
    <>
      {view.screen === 'home' || !currentMember ? (
        <Home
          data={data}
          today={today}
          onOpenPerson={(id) => setView({ screen: 'person', memberId: id })}
          onAddMember={() => setMemberSheet({ open: true, member: null })}
          onEditVisa={handleEditVisa}
          onExport={handleExport}
          onImport={() => fileInput.current?.click()}
        />
      ) : (
        <PersonDetail
          member={currentMember}
          today={today}
          canDelete={data.members.length > 1}
          onBack={() => setView({ screen: 'home' })}
          onAddRecord={() => setRecordSheet({ open: true, defaults: [currentMember.id] })}
          onDeleteCrossing={(cid) => handleDeleteCrossing(currentMember.id, cid)}
          onEditMember={() => setMemberSheet({ open: true, member: currentMember })}
          onDeleteMember={() => handleDeleteMember(currentMember.id)}
        />
      )}

      {/* 底部主操作:记一笔(贯穿全屏) */}
      <div className="fixed inset-x-0 bottom-0 border-t border-black/[0.07] bg-white/90 px-5 py-3 backdrop-blur">
        <button
          onClick={() =>
            setRecordSheet({
              open: true,
              defaults:
                view.screen === 'person' ? [view.memberId] : data.members.map((m) => m.id),
            })
          }
          className="mx-auto flex w-full max-w-md items-center justify-center gap-2 rounded-xl bg-gray-900 py-3.5 text-[15px] font-bold text-white transition active:scale-[0.98]"
        >
          ＋ 记一笔
        </button>
      </div>

      {recordSheet.open && (
        <RecordSheet
          members={data.members}
          today={today}
          defaultMemberIds={recordSheet.defaults}
          onClose={() => setRecordSheet({ open: false, defaults: [] })}
          onSave={handleSaveRecord}
        />
      )}

      {memberSheet.open && (
        <MemberSheet
          member={memberSheet.member}
          onClose={() => setMemberSheet({ open: false, member: null })}
          onSave={handleSaveMember}
        />
      )}

      <input
        ref={fileInput}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={handleImportFile}
      />
    </>
  );
}

/** 仅在有值时带上 residenceStart 键(配合 exactOptionalPropertyTypes) */
function rs(v?: string): { residenceStart?: string } {
  return v ? { residenceStart: v } : {};
}
