import { roster } from './roster.js';
import { START, END, GOAL, days, koreaToday, rankParticipants } from './model.js';
const preview = location.protocol === 'file:';
let records = [], loaded = false, today = koreaToday(), selected = today < START ? START : today > END ? END : today;
let saving = false;
let admin = false;
const $ = id => document.getElementById(id);
const esc = text => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function showNotice(text, retry = false) {
  $('notice').hidden = !text;
  $('notice').textContent = text;
  if (retry) { const b = document.createElement('button'); b.textContent = '다시 불러오기'; b.onclick = load; $('notice').append(b); }
}
function render() {
  $('admin-login').hidden = admin;
  $('admin-logout').hidden = !admin;
  $('admin-status').textContent = admin ? '관리자 · 출석 변경 가능' : '조회 전용 · 출석 변경은 관리자만 가능합니다';
  const ranked = rankParticipants(roster, records);
  $('total-members').innerHTML = `${roster.length}<small>명</small>`;
  $('goal-members').innerHTML = `${ranked.filter(p => p.count >= GOAL).length}<small>명</small>`;
  $('rank-count').textContent = roster.length;
  $('period-status').textContent = today < START ? '10월 5일 시작' : today > END ? '스터디 종료' : '스터디 진행 중';
  $('podium').innerHTML = [2,1,3].map(rank => {
    const group = ranked.filter(p => p.rank === rank);
    return `<div class="place ${rank === 1 ? 'first' : rank === 3 ? 'third' : 'second'}"><div class="person"><div class="avatar">${group.length ? esc(group[0].name.slice(-2)) : '—'}</div><strong>${group.length ? group.map(p => esc(p.name)).join(' · ') : '—'}</strong><small>${group.length ? `${group[0].tied ? '공동 ' : ''}${rank}위 · ${group[0].count}일 출석` : loaded || preview ? '기록 없음' : '불러오는 중'}</small></div><div class="step"><b>${rank}</b></div></div>`;
  }).join('');
  $('ranking-body').innerHTML = ranked.map(p => `<tr><td class="rank">${p.rank ? `${p.tied ? '공동 ' : ''}${p.rank}` : '—'}</td><td><strong>${esc(p.name)}</strong></td><td class="count">${loaded || preview ? p.count : '—'}<small>일</small></td><td class="progress-td"><div class="progress"><div class="track"><div class="fill" style="width:${Math.min(p.count / GOAL * 100, 100)}%"></div></div><small>${p.count} / ${GOAL}</small></div></td><td><span class="badge ${p.count >= GOAL ? 'complete' : ''}">${p.count >= GOAL ? '목표 달성' : p.count > 0 ? '도전 중' : '시작 전'}</span></td></tr>`).join('');
  $('attendance-date').value = selected;
  $('date-strip').innerHTML = days().map(date => `<button class="date-button ${selected === date ? 'selected' : ''}" data-date="${date}" aria-pressed="${selected === date}"><span>${['일','월','화','수','목','금','토'][new Date(date+'T12:00:00+09:00').getUTCDay()]}</span>${Number(date.slice(-2))}</button>`).join('');
  document.querySelectorAll('[data-date]').forEach(b => b.onclick = () => { selected = b.dataset.date; render(); });
  $('selected-label').textContent = `10월 ${Number(selected.slice(-2))}일 출석`;
  $('selected-count').textContent = `${records.filter(r => r.date === selected).length} / ${roster.length}명`;
  $('attendance-list').innerHTML = roster.map(p => {
    const present = records.some(r => r.participant_id === p.id && r.date === selected);
    return `<div class="check-row"><div class="avatar">${esc(p.name.slice(-2))}</div><div class="info"><strong>${esc(p.name)}</strong></div><button class="check-btn ${present ? 'present' : ''}" data-id="${p.id}" aria-label="${esc(p.name)} 출석 ${present ? '취소' : '체크'}" aria-pressed="${present}" ${!admin || !loaded || saving || selected > today ? 'disabled' : ''}>${present ? '✓ 출석 완료' : selected > today ? '출석 대기' : '출석 체크'}</button></div>`;
  }).join('');
  document.querySelectorAll('[data-id]').forEach(b => b.onclick = () => save(b.dataset.id));
}
async function load() {
  if (preview) { showNotice('미리보기 · 출석 저장 불가'); render(); return; }
  try {
    const response = await fetch('/api/attendance', { cache: 'no-store' });
    const data = await response.json();
    if (!response.ok) throw Error(data.error || '출석 기록을 불러오지 못했습니다.');
    records = data.records; today = data.today; loaded = true; showNotice(''); render();
  } catch (e) { loaded = false; showNotice(e.message || '연결을 확인하고 다시 시도해 주세요.', true); render(); }
}
async function save(id) {
  if (!admin) return;
  if (saving || !loaded || selected > today) return;
  const date = selected;
  const present = !records.some(r => r.participant_id === id && r.date === date);
  saving = true; render();
  try {
    const response = await fetch('/api/attendance', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ participant_id:id, date, present }) });
    const data = await response.json(); if (!response.ok) { if (response.status === 401) admin = false; throw Error(data.error); }
    records = records.filter(r => !(r.participant_id === id && r.date === date));
    if (present) records.push({ participant_id:id, date });
    showNotice(`${roster.find(p => p.id === id).name} 님의 10월 ${Number(date.slice(-2))}일 출석을 ${present ? '저장' : '취소'}했습니다.`);
  } catch (e) { showNotice(e.message || '저장하지 못했습니다. 다시 시도해 주세요.'); }
  finally { saving = false; render(); }
}
function tab(mode) {
  for (const name of ['ranking','attendance']) { $(name+'-panel').hidden = name !== mode; $(name+'-tab').classList.toggle('active', name === mode); $(name+'-tab').setAttribute('aria-selected', name === mode); }
}
$('ranking-tab').onclick = () => tab('ranking');
$('attendance-tab').onclick = () => tab('attendance');
$('attendance-date').onchange = e => { if (days().includes(e.target.value)) { selected = e.target.value; render(); } else { e.target.value = selected; } };
async function checkAuth() {
  try {
    const response = await fetch('/api/auth', { cache: 'no-store' });
    const data = await response.json();
    admin = response.ok && data.admin === true;
  } catch { admin = false; }
  render();
}
$('admin-login').onsubmit = async event => {
  event.preventDefault();
  const password = $('admin-password').value;
  $('admin-password').value = '';
  try {
    const response = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
    const data = await response.json();
    if (!response.ok) throw Error(data.error);
    admin = data.admin === true;
    showNotice('관리자로 로그인했습니다.');
  } catch (error) { admin = false; showNotice(error.message); }
  render();
};
$('admin-logout').onclick = async () => {
  try {
    const response = await fetch('/api/auth', { method: 'DELETE' });
    if (!response.ok) throw Error('로그아웃하지 못했습니다. 다시 시도하세요.');
    admin = false; showNotice('로그아웃했습니다.');
  } catch (error) { showNotice(error.message); }
  render();
};
render(); load(); checkAuth();
