import { useEffect, useMemo, useRef, useState } from 'react';
import { AppData, Direction, Member, MemberRole, Reminder, ReminderType } from './types';
import { todayISO } from './lib/now';
import {
  addCrossing,
  exportJSON,
  importJSON,
  load,
  newId,
  removeCrossing,
  removeMember,
  removeReminder,
  save,
  upsertMember,
  upsertReminder,
} from './lib/storage';
import { cachedRate, fetchRate, RateData } from './lib/rates';
import { Home } from './components/Home';
import { PersonDetail } from './components/PersonDetail';
import { RecordSheet } from './components/RecordSheet';
import { MemberSheet } from './components/MemberSheet';
import { ReminderSheet } from './components/ReminderSheet';
import { RatesDetail } from './components/RatesDetail';

type View = { screen: 'home' } | { screen: 'person'; memberId: string } | { screen: 'rates' };

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
  const [reminderSheet, setReminderSheet] = useState<{ open: boolean; reminder: Reminder | null }>({
    open: false,
    reminder: null,
  });
  const fileInput = useRef<HTMLInputElement>(null);
  const [rate, setRate] = useState<RateData | null>(() => cachedRate());
  const [rateError, setRateError] = useState(false);

  const today = useMemo(() => todayISO(), []);

  useEffect(() => {
    save(data);
  }, [data]);

  // 拉取实时汇率(失败回退到缓存)
  useEffect(() => {
    fetchRate(today, Date.now())
      .then((r) => {
        setRate(r);
        setRateError(false);
      })
      .catch(() => setRateError(true));
  }, [today]);

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

  // ───────── 到期提醒 ─────────
  function handleSaveReminder(fields: {
    type: ReminderType;
    date: string;
    memberId?: string;
    title?: string;
  }) {
    const base = reminderSheet.reminder;
    const reminder: Reminder = {
      id: base?.id ?? newId(),
      type: fields.type,
      date: fields.date,
      ...(fields.memberId ? { memberId: fields.memberId } : {}),
      ...(fields.title ? { title: fields.title } : {}),
    };
    setData((prev) => upsertReminder(prev, reminder));
    setReminderSheet({ open: false, reminder: null });
  }

  function handleDeleteReminder(id: string) {
    setData((prev) => removeReminder(prev, id));
    setReminderSheet({ open: false, reminder: null });
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
    e.target.value = '';
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
      {view.screen === 'rates' ? (
        <RatesDetail
          rate={rate}
          error={rateError}
          today={today}
          onBack={() => setView({ screen: 'home' })}
        />
      ) : view.screen === 'home' || !currentMember ? (
        <Home
          data={data}
          today={today}
          rate={rate}
          rateError={rateError}
          onOpenPerson={(id) => setView({ screen: 'person', memberId: id })}
          onOpenRates={() => setView({ screen: 'rates' })}
          onAddMember={() => setMemberSheet({ open: true, member: null })}
          onAddReminder={() => setReminderSheet({ open: true, reminder: null })}
          onEditReminder={(reminder) => setReminderSheet({ open: true, reminder })}
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

      {/* 底部毛玻璃「记一笔」(安全区);汇率页不显示 */}
      <div
        hidden={view.screen === 'rates'}
        className="safe-bottom fixed inset-x-0 bottom-0 border-t border-[rgba(60,60,67,0.12)] bg-ios-bg/80 px-5 pt-3 backdrop-blur-xl"
      >
        <button
          onClick={() =>
            setRecordSheet({
              open: true,
              defaults:
                view.screen === 'person' ? [view.memberId] : data.members.map((m) => m.id),
            })
          }
          className="mx-auto block w-full max-w-md rounded-[14px] bg-ios-blue py-3.5 text-center text-[17px] font-semibold text-white transition active:scale-[0.98]"
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

      {reminderSheet.open && (
        <ReminderSheet
          reminder={reminderSheet.reminder}
          members={data.members}
          today={today}
          onClose={() => setReminderSheet({ open: false, reminder: null })}
          onSave={handleSaveReminder}
          onDelete={handleDeleteReminder}
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
