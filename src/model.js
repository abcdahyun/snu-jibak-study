export const START = '2026-10-05';
export const END = '2026-10-25';
export const GOAL = 15;
export function koreaToday(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}
export function days() {
  return Array.from({ length: 21 }, (_, i) => `2026-10-${String(i + 5).padStart(2, '0')}`);
}
export function rankParticipants(roster, records) {
  const totals = new Map(roster.map(p => [p.id, new Set()]));
  records.forEach(r => { if (days().includes(r.date)) totals.get(r.participant_id)?.add(r.date); });
  const sorted = roster.map(p => ({ ...p, count: totals.get(p.id).size })).sort((a,b) => b.count-a.count || a.name.localeCompare(b.name, 'ko') || a.id.localeCompare(b.id));
  return sorted.map((p, i) => ({ ...p, rank: p.count === 0 ? null : sorted.findIndex(q => q.count === p.count) + 1, tied: p.count > 0 && sorted.filter(q => q.count === p.count).length > 1 }));
}
