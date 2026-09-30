const encoder = new TextEncoder();
const cookieName = '__Host-study_admin';
export const configured = env => typeof env.ADMIN_PASSWORD === 'string' && env.ADMIN_PASSWORD.length >= 20;
export async function digest(value) {
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value))), b => b.toString(16).padStart(2, '0')).join('');
}
const tokenFrom = request => (request.headers.get('cookie') || '').split(';').map(s => s.trim()).find(s => s.startsWith(cookieName + '='))?.slice(cookieName.length + 1);
const cookie = (value, age) => `${cookieName}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${age}`;
const response = (body, status = 200, headers = {}) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store', ...headers } });
export async function isAdmin(request, env, now) {
  const token = tokenFrom(request);
  if (!configured(env) || !env.DB || !token || !/^[a-f0-9]{64}$/.test(token)) return false;
  const row = await env.DB.prepare('SELECT password_version FROM admin_sessions WHERE token_hash = ? AND expires_at > ?').bind(await digest(token), now).first();
  return !!row && row.password_version === await digest(env.ADMIN_PASSWORD);
}
export async function authRoute(request, env, now) {
  if (request.method === 'GET') return response({ admin: await isAdmin(request, env, now) });
  if (!['POST', 'DELETE'].includes(request.method)) return response({ error: '허용되지 않은 요청입니다.' }, 405);
  if (request.headers.get('origin') !== new URL(request.url).origin) return response({ error: '잘못된 요청 출처입니다.' }, 403);
  if (!env.DB) return response({ error: '저장소가 연결되지 않았습니다.' }, 503);
  if (request.method === 'DELETE') {
    const token = tokenFrom(request);
    if (token) await env.DB.prepare('DELETE FROM admin_sessions WHERE token_hash = ?').bind(await digest(token)).run();
    return response({ admin: false }, 200, { 'Set-Cookie': cookie('', 0) });
  }
  if (!configured(env)) return response({ error: '관리자 비밀번호 설정이 필요합니다.' }, 503);
  const bucket = Math.floor(now / 60000);
  const key = await digest(request.headers.get('CF-Connecting-IP') || 'unknown');
  const attempt = await env.DB.prepare('INSERT INTO login_attempts (ip_hash, bucket, attempts) VALUES (?, ?, 1) ON CONFLICT(ip_hash, bucket) DO UPDATE SET attempts = attempts + 1 RETURNING attempts').bind(key, bucket).first();
  if (attempt.attempts > 5) return response({ error: '로그인 시도가 많습니다. 1분 후 다시 시도하세요.' }, 429, { 'Retry-After': '60' });
  let input;
  try { input = await request.json(); } catch { return response({ error: '잘못된 요청입니다.' }, 400); }
  if (typeof input?.password !== 'string' || input.password.length > 512) return response({ error: '비밀번호를 확인하세요.' }, 401);
  const actual = await digest(input.password), expected = await digest(env.ADMIN_PASSWORD);
  let difference = 0;
  for (let i = 0; i < expected.length; i++) difference |= actual.charCodeAt(i) ^ expected.charCodeAt(i);
  if (difference) return response({ error: '비밀번호를 확인하세요.' }, 401);
  const token = Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, '0')).join('');
  await env.DB.prepare('INSERT INTO admin_sessions (token_hash, password_version, expires_at) VALUES (?, ?, ?)').bind(await digest(token), expected, now + 28800000).run();
  await env.DB.prepare('DELETE FROM admin_sessions WHERE expires_at <= ?').bind(now).run();
  await env.DB.prepare('DELETE FROM login_attempts WHERE bucket < ?').bind(bucket - 1).run();
  return response({ admin: true }, 200, { 'Set-Cookie': cookie(token, 28800) });
}
