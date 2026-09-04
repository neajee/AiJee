export interface LogEntry {
  hash: string;
  short_hash: string;
  author: string;
  date: string;
  message: string;
}

export const LOG_MAX_HEIGHT = 190;
export const SPINE_COLUMN = 14;
export const SPINE_X = 6;
export const DOT_SIZE = 4;
export const DOT_TOP = 9;

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy.getTime();
}

function dateBin(date: Date, now: Date): string {
  const days = Math.round((startOfDay(now) - startOfDay(date)) / 86400000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return WEEKDAYS[date.getDay()];
  if (days <= 30) return 'Past 30 Days';
  if (date.getFullYear() === now.getFullYear()) return MONTHS[date.getMonth()];
  return `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function binEntries(entries: LogEntry[]) {
  const now = new Date();
  const bins: { label: string; entries: LogEntry[] }[] = [];
  for (const entry of entries) {
    const label = dateBin(new Date(entry.date), now);
    const last = bins[bins.length - 1];
    if (last && last.label === label) last.entries.push(entry);
    else bins.push({ label, entries: [entry] });
  }
  return bins;
}
