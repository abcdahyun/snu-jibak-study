import { roster } from './roster.js';
import { START, END, days, koreaToday } from './model.js';
import { authRoute, isAdmin } from './auth.js';
const json = (body, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
export function createHandler(html, clock = () => new Date()) {
  return {
    async fetch(request, env) {
      const url = new URL(request.url);
      if (url.pathname === '/api/auth') {
        try { return await authRoute(request, env, clock().getTime()); }
        catch { return json({ error: '관리자 인증을 처리하지 못했습니다.' }, 503); }
      }
      if (url.pathname === '/api/attendance' && request.method !== 'GET') {
        try {
          if (!await isAdmin(request, env, clock().getTime())) return json({ error: '관리자 로그인 후 출석을 변경할 수 있습니다.' }, 401);
        } catch { return json({ error: '관리자 인증을 확인할 수 없습니다.' }, 503); }
      }
      if (url.pathname === '/' && request.method === 'GET') return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'same-origin' } });
      if (url.pathname !== '/api/attendance') return json({ error: '페이지를 찾을 수 없습니다.' }, 404);
      if (!env.DB) return json({ error: '출석 저장소에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.' }, 503);
      try {
        if (request.method === 'GET') {
          const result = await env.DB.prepare('SELECT participant_id, date FROM attendance ORDER BY date, participant_id').all();
          return json({ roster, records: result.results, today: koreaToday(clock()), start: START, end: END });
        }
        if (request.method !== 'PUT') return json({ error: '지원하지 않는 요청입니다.' }, 405);
        if (request.headers.get('origin') !== url.origin) return json({ error: '사이트에서 출석을 기록해 주세요.' }, 403);
        let input;
        try { input = await request.json(); } catch { return json({ error: '요청 형식이 올바르지 않습니다.' }, 400); }
        const { participant_id, date, present } = input || {};
        if (!roster.some(p => p.id === participant_id) || !days().includes(date) || typeof present !== 'boolean') return json({ error: '참가자와 출석 날짜를 확인해 주세요.' }, 400);
        if (date > koreaToday(clock())) return json({ error: '미래 날짜에는 출석을 기록할 수 없습니다.' }, 400);
        if (present) await env.DB.prepare('INSERT INTO attendance (participant_id, date) VALUES (?, ?) ON CONFLICT (participant_id, date) DO NOTHING').bind(participant_id, date).run();
        else await env.DB.prepare('DELETE FROM attendance WHERE participant_id = ? AND date = ?').bind(participant_id, date).run();
        return json({ ok: true });
      } catch (error) {
        console.error('Attendance storage error', error);
        return json({ error: '출석을 불러오거나 저장하지 못했습니다. 다시 시도해 주세요.' }, 503);
      }
    }
  };
}
