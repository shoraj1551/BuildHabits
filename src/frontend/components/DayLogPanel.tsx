import React, { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import type { DayLogEntry, DayLogEvidence } from '../../backend/store/useHabitStore';
import { generateDateRange } from '../../shared/utils/dateUtils';
import { generateId } from '../../shared/utils/uuid';

interface DayLogPanelProps {
  todayIso: string;
  canModifyToday: boolean;
  dayLogs: DayLogEntry[];
  archivedLogsLookup: (dateIso: string) => DayLogEntry[];
  onSaveLog: (activity: string, evidences: DayLogEvidence[]) => void;
}

export const DayLogPanel: React.FC<DayLogPanelProps> = ({
  todayIso,
  canModifyToday,
  dayLogs,
  archivedLogsLookup,
  onSaveLog,
}) => {
  const [selectedLogDate, setSelectedLogDate] = useState(todayIso);
  const [dayActivity, setDayActivity] = useState('');
  const [evidenceType, setEvidenceType] = useState<DayLogEvidence['kind']>('other');
  const [pendingEvidence, setPendingEvidence] = useState<DayLogEvidence[]>([]);

  const recent300Days = useMemo(() => generateDateRange(300).reverse(), []);
  const logsForSelectedDate = useMemo(() => dayLogs.filter((log) => log.date === selectedLogDate), [dayLogs, selectedLogDate]);
  const archivedLogsForSelectedDate = useMemo(() => archivedLogsLookup(selectedLogDate), [archivedLogsLookup, selectedLogDate]);

  const handleEvidenceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = typeof reader.result === 'string' ? reader.result : '';
        if (!dataUrl) return;
        setPendingEvidence((prev) => [...prev, { id: generateId(), kind: evidenceType, name: file.name, mimeType: file.type || 'application/octet-stream', dataUrl, addedAt: new Date() }]);
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const handleSave = () => {
    if (!canModifyToday || (!dayActivity.trim() && pendingEvidence.length === 0)) return;
    onSaveLog(dayActivity, pendingEvidence);
    setDayActivity('');
    setPendingEvidence([]);
  };

  return (
    <section className="mb-xxl bg-slate-900/40 backdrop-blur-xl rounded-[24px] shadow-2xl border border-white/10 p-lg">
      <div className="flex items-center justify-between mb-md">
        <h3 className="font-headline-md text-on-surface">Log Your Day</h3>
        <span className="text-xs text-on-surface-variant">{format(new Date(), 'MMMM d, yyyy')}</span>
      </div>
      <div className="mb-md grid grid-cols-1 md:grid-cols-3 gap-sm">
        <label className="text-xs text-on-surface-variant">Select Date
          <input type="date" value={selectedLogDate} onChange={(e) => setSelectedLogDate(e.target.value)} className="mt-1 w-full rounded-lg border border-outline-variant/30 px-sm py-xs bg-surface" />
        </label>
        <label className="text-xs text-on-surface-variant md:col-span-2">Quick date picker (last 300 days)
          <select value={selectedLogDate} onChange={(e) => setSelectedLogDate(e.target.value)} className="mt-1 w-full rounded-lg border border-outline-variant/30 px-sm py-xs bg-surface">
            {recent300Days.map((day) => <option key={day.iso} value={day.iso}>{format(day.date, 'EEE, MMM d, yyyy')}</option>)}
          </select>
        </label>
      </div>
      <div className="space-y-sm">
        <textarea rows={3} value={dayActivity} onChange={(e) => setDayActivity(e.target.value)} disabled={!canModifyToday} placeholder="What did you do today? Wins, blockers, routines..." className="w-full rounded-xl border border-outline-variant/30 bg-surface px-md py-sm text-sm outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary" />
        <div className="flex justify-end">
          <button onClick={handleSave} disabled={(!dayActivity.trim() && pendingEvidence.length === 0) || !canModifyToday} className="rounded-lg bg-primary text-on-primary px-lg py-sm font-semibold disabled:opacity-50">Save Activity</button>
        </div>
        <label className="text-xs text-on-surface-variant">Evidence Type
          <select value={evidenceType} onChange={(ev) => setEvidenceType(ev.target.value as DayLogEvidence['kind'])} className="mt-1 w-full rounded-lg border border-outline-variant/30 px-sm py-xs bg-surface">
            <option value="other">Other</option><option value="finance_bill">Finance Bill</option><option value="food_image">Food Image</option>
          </select>
        </label>
        <label className="text-xs text-on-surface-variant">Upload Supporting Evidence
          <input type="file" accept="image/*,.pdf" multiple onChange={handleEvidenceUpload} className="mt-1 block w-full text-xs" />
        </label>
      </div>
      <div className="mt-lg">
        <p className="text-sm font-semibold text-on-surface mb-sm">Timeline for {selectedLogDate}</p>
        <div className="relative ml-2 border-l-2 border-primary/20 pl-md space-y-md">
          {[...logsForSelectedDate, ...archivedLogsForSelectedDate].sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt)).map((log) => (
            <motion.div key={log.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="relative rounded-xl border border-white/5 bg-slate-800/40 p-sm shadow-lg">
              <span className="absolute -left-[22px] top-4 h-3 w-3 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
              <p className="text-sm text-on-surface">{log.activity}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
