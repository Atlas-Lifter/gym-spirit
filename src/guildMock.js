// 개발 서버 전용: ?mockguild 로 열면 DB 없이 길드·랭킹 화면을 확인하는 가짜 서버 (배포본에는 포함되지 않음)
// 규칙은 supabase/guilds.sql 을 단순하게 흉내 낸다.
import { guildLevelInfo, guildCap, skillLv, skillPoints, dayXp, COACH_MAX } from './guildSystem.js';

const wait = (v) => new Promise(r => setTimeout(() => r(v), 180));
const fail = (code) => Promise.reject(new Error(code));
const pad = (n) => String(n).padStart(2, '0');
const key = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const monday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d; };

export const createGuildMock = () => {
  const ME = 'me';
  const users = {
    me: { nickname: '나', volume: 18400, lift: 420, solo: false },
    u1: { nickname: '새벽헬창', volume: 32100, lift: 510, solo: false },
    u2: { nickname: '데드킹', volume: 27500, lift: 560, solo: false },
    u3: { nickname: '하체러버', volume: 12100, lift: 380, solo: false },
    u4: { nickname: '벤치요정', volume: 21400, lift: 400, solo: true },
    u5: { nickname: '득근중', volume: 9800, lift: 300, solo: true },
    u6: { nickname: '쇠질장인', volume: 41000, lift: 600, solo: false },
  };
  const ws = monday();
  const dayKey = (i) => { const d = new Date(ws); d.setDate(d.getDate() + i); return key(d); };
  const guilds = {
    g1: { id: 'g1', name: '아이언 새벽반', emblem: '⚡', color: 'blue', intro: '매일 새벽 6시 출석하는 모임', join_mode: 'open', invite_code: 'IRON06', xp: 2350, skills: { pt: 1 }, ranked: true },
    g2: { id: 'g2', name: '데드리프트클럽', emblem: '🦍', color: 'black', intro: '바닥에서 들어올리는 자들', join_mode: 'approval', invite_code: 'DEAD99', xp: 5200, skills: { rack: 2, pt: 2 }, ranked: true },
  };
  const members = {
    u1: { guild: 'g1', role: 'leader', contrib: 2600 }, u3: { guild: 'g1', role: 'member', contrib: 450 },
    u2: { guild: 'g2', role: 'leader', contrib: 4100 }, u6: { guild: 'g2', role: 'coach', contrib: 5300 },
  };
  let requests = []; // { user, guild }
  const activity = []; // { guild, user, day, volume, xp }
  [['g1', 'u1', 0, 9000], ['g1', 'u1', 2, 11000], ['g1', 'u3', 1, 7000], ['g2', 'u2', 0, 14000], ['g2', 'u6', 0, 16000], ['g2', 'u6', 1, 12000]]
    .forEach(([g, u, i, v]) => activity.push({ guild: g, user: u, day: dayKey(i), volume: v, xp: dayXp(v, guilds[g].skills), at: Date.now() - i * 3600e3 }));
  const claims = []; // { guild, week, key }
  const lastWs = (() => { const d = new Date(ws); d.setDate(d.getDate() - 7); return key(d); })();
  let posts = []; // { id, guild, user, body, kind, at }
  let cheers = []; // { guild, from, to, day }
  let postSeq = 1;
  const today = key(new Date());

  const count = (gid) => Object.values(members).filter(m => m.guild === gid).length;
  const cap = (g) => guildCap(g.xp, g.skills);
  const mine = () => members[ME];
  const weekStats = (gid) => {
    const act = activity.filter(a => a.guild === gid && a.volume > 0 && a.day >= key(ws));
    const perDay = {};
    act.forEach(a => { perDay[a.day] = (perDay[a.day] || new Set()).add(a.user); });
    const n = count(gid);
    return { week_start: key(ws), volume: act.reduce((s, a) => s + a.volume, 0), days: act.length, together: Object.values(perDay).filter(s => s.size >= Math.max(2, Math.min(3, n))).length, members: n };
  };
  const addMember = (uid, gid) => {
    const g = guilds[gid];
    if (!g) return 'GS:NO_GUILD';
    if (members[uid]) return 'GS:IN_GUILD';
    if (count(gid) >= cap(g)) return 'GS:FULL';
    members[uid] = { guild: gid, role: 'member', contrib: 0 };
    requests = requests.filter(r => r.user !== uid);
    users[uid].solo = false;
    return null;
  };
  const staff = () => { const m = mine(); return m && m.role !== 'member' ? m : null; };
  const leader = () => { const m = mine(); return m && m.role === 'leader' ? m : null; };

  const globalRanking = () => wait([
    ...Object.values(guilds).filter(g => g.ranked && count(g.id) >= 2).map(g => {
      const ms = Object.entries(members).filter(([, m]) => m.guild === g.id).map(([u]) => users[u]);
      return { kind: 'guild', id: g.id, name: g.name, emblem: g.emblem, color: g.color, avatar: null, level: guildLevelInfo(g.xp).level, members: ms.length,
        volume: Math.round(ms.reduce((s, u) => s + u.volume, 0) / ms.length), lift: Math.round(ms.reduce((s, u) => s + u.lift, 0) / ms.length) };
    }),
    ...Object.entries(users).filter(([u, x]) => x.solo && !members[u]).map(([u, x]) => ({ kind: 'solo', id: u, name: x.nickname, emblem: null, color: null, avatar: null, level: null, members: 1, volume: x.volume, lift: x.lift })),
  ]);
  const friendRanking = () => wait(['me', 'u1', 'u4'].map(u => {
    const g = members[u] && guilds[members[u].guild];
    return { id: u, nickname: users[u].nickname, avatar: null, volume: users[u].volume, lift: users[u].lift, fav: '벤치프레스', last_routine: null, guild_name: g?.name || null, guild_emblem: g?.emblem || null };
  }));

  const guildApi = {
    my: () => {
      const m = mine();
      if (!m) {
        const r = requests.find(x => x.user === ME);
        return wait({ guild: null, solo_ranked: users.me.solo, request: r ? { guild_id: r.guild, name: guilds[r.guild].name, emblem: guilds[r.guild].emblem } : null });
      }
      const g = guilds[m.guild];
      const ms = Object.entries(members).filter(([, x]) => x.guild === g.id).map(([u, x]) => {
        const mine7 = activity.filter(a => a.guild === g.id && a.user === u && a.volume > 0 && a.day >= key(ws));
        return { id: u, nickname: users[u].nickname, avatar: null, role: x.role, contrib: x.contrib, volume: users[u].volume, lift: users[u].lift, days: mine7.length,
          week_days: mine7.map(a => ((new Date(`${a.day}T00:00:00`).getDay() + 6) % 7) + 1),
          cheers: cheers.filter(c => c.guild === g.id && c.to === u && c.day >= key(ws)).length,
          cheered_today: cheers.some(c => c.from === ME && c.to === u && c.day === today) };
      }).sort((a, b) => (b.role === 'leader') - (a.role === 'leader') || (b.role === 'coach') - (a.role === 'coach') || b.contrib - a.contrib);
      return wait({
        guild: { ...g, level: guildLevelInfo(g.xp).level, cap: cap(g) }, my_role: m.role, members: ms,
        requests: m.role === 'member' ? [] : requests.filter(r => r.guild === g.id).map(r => ({ id: r.user, nickname: users[r.user].nickname, avatar: null })),
        week: weekStats(g.id), claims: claims.filter(c => c.guild === g.id && c.week === key(ws)).map(c => c.key),
        feed: activity.filter(a => a.guild === g.id && a.volume > 0).sort((a, b) => b.at - a.at).slice(0, 15).map(a => ({ nickname: users[a.user].nickname, day: a.day, volume: a.volume, xp: a.xp })),
        my_cheers_today: cheers.filter(c => c.from === ME && c.day === today).length,
        posts: posts.filter(p => p.guild === g.id).sort((a, b) => b.at - a.at).map(p => ({ id: p.id, body: p.body, kind: p.kind, at: new Date(p.at).toISOString(), mine: p.user === ME, nickname: users[p.user].nickname, avatar: null, role: members[p.user]?.role })),
        mvp: (() => {
          const by = {};
          activity.filter(a => a.guild === g.id && a.volume > 0 && a.day >= key(ws)).forEach(a => { by[a.user] = by[a.user] || { v: 0, d: 0 }; by[a.user].v += a.volume; by[a.user].d += 1; });
          const top = Object.entries(by).sort((a, b) => b[1].v - a[1].v)[0];
          return top ? { nickname: users[top[0]].nickname, avatar: null, volume: top[1].v, days: top[1].d } : null;
        })(),
        last_week: { mvp: { nickname: users.u1?.nickname || '새벽헬창', avatar: null, volume: 52300 }, volume: 88400, claims: ['volume', 'raid'] },
        stats: { raids: 1, missions: claims.filter(c => c.guild === g.id && c.key !== 'raid').length + 3, cheers: cheers.filter(c => c.guild === g.id).length,
          posts: posts.filter(p => p.guild === g.id).length, claim_weeks: [...new Set([lastWs, ...claims.filter(c => c.guild === g.id).map(c => c.week)])] },
      });
    },
    search: (q) => wait(Object.values(guilds).filter(g => !q || g.name.includes(q)).map(g => ({ ...g, level: guildLevelInfo(g.xp).level, members: count(g.id), cap: cap(g) }))),
    view: (id) => {
      const g = guilds[id];
      if (!g) return fail('GS:NO_GUILD');
      return wait({ ...g, level: guildLevelInfo(g.xp).level, members: count(id), cap: cap(g),
        member_list: Object.entries(members).filter(([, m]) => m.guild === id).map(([u, m]) => ({ nickname: users[u].nickname, avatar: null, role: m.role, contrib: m.contrib })) });
    },
    create: (f) => {
      if (mine()) return fail('GS:IN_GUILD');
      if (f.name.length < 2 || f.name.length > 12) return fail('GS:NAME_LEN');
      if (Object.values(guilds).some(g => g.name.toLowerCase() === f.name.toLowerCase())) return fail('GS:NAME_TAKEN');
      const id = `g${Date.now()}`;
      guilds[id] = { id, name: f.name, emblem: f.emblem, color: f.color, intro: f.intro, join_mode: f.joinMode, invite_code: 'NEW123', xp: 0, skills: {}, ranked: false };
      members[ME] = { guild: id, role: 'leader', contrib: 0 };
      users.me.solo = false;
      requests = requests.filter(r => r.user !== ME);
      // 체험용: 가입 신청 한 명과 이번 주 기록을 미리 넣어 둔다
      requests.push({ user: 'u5', guild: id });
      activity.push({ guild: id, user: ME, day: key(new Date()), volume: 18400, xp: dayXp(18400, {}), at: Date.now() });
      members[ME].contrib = dayXp(18400, {}); guilds[id].xp = dayXp(18400, {});
      posts.push({ id: postSeq++, guild: id, user: ME, body: '이번 주 목표: 레이드 보스 잡기! 다들 하체 빼먹지 말기 🔥', kind: 'notice', at: Date.now() - 600000 });
      return wait(id);
    },
    update: (f) => { const m = leader(); if (!m) return fail('GS:NOT_LEADER'); Object.assign(guilds[m.guild], { name: f.name, emblem: f.emblem, color: f.color, intro: f.intro, join_mode: f.joinMode }); return wait(null); },
    join: (id) => {
      const g = guilds[id];
      if (!g) return fail('GS:NO_GUILD');
      if (mine()) return fail('GS:IN_GUILD');
      if (g.join_mode === 'open') { const e = addMember(ME, id); return e ? fail(e) : wait('joined'); }
      requests = requests.filter(r => r.user !== ME); requests.push({ user: ME, guild: id });
      return wait('requested');
    },
    joinByCode: (code) => { const g = Object.values(guilds).find(x => x.invite_code === code.toUpperCase()); if (!g) return fail('GS:BAD_CODE'); const e = addMember(ME, g.id); return e ? fail(e) : wait(g.id); },
    cancelRequest: () => { requests = requests.filter(r => r.user !== ME); return wait(null); },
    respond: (uid, accept) => {
      const m = staff(); if (!m) return fail('GS:NO_PERMISSION');
      if (!requests.some(r => r.user === uid && r.guild === m.guild)) return fail('GS:NO_REQUEST');
      if (accept) { const e = addMember(uid, m.guild); if (e) return fail(e); } else requests = requests.filter(r => !(r.user === uid && r.guild === m.guild));
      return wait(null);
    },
    leave: () => {
      const m = mine(); if (!m) return wait(null);
      if (m.role === 'leader') {
        const heir = Object.entries(members).filter(([u, x]) => x.guild === m.guild && u !== ME).sort(([, a], [, b]) => (b.role === 'coach') - (a.role === 'coach') || b.contrib - a.contrib)[0];
        if (!heir) { delete guilds[m.guild]; delete members[ME]; return wait(null); }
        heir[1].role = 'leader';
      }
      const gid = m.guild; delete members[ME];
      if (count(gid) < 2) guilds[gid].ranked = false;
      return wait(null);
    },
    kick: (uid) => {
      const m = mine(), t = members[uid];
      if (!m || !t || t.guild !== m.guild || uid === ME) return fail('GS:NO_MEMBER');
      if (!(m.role === 'leader' || (m.role === 'coach' && t.role === 'member'))) return fail('GS:NO_PERMISSION');
      delete members[uid];
      if (count(m.guild) < 2) guilds[m.guild].ranked = false;
      return wait(null);
    },
    setRole: (uid, role) => {
      const m = leader(); if (!m) return fail('GS:NOT_LEADER');
      if (role === 'coach' && Object.entries(members).filter(([u, x]) => x.guild === m.guild && x.role === 'coach' && u !== uid).length >= COACH_MAX) return fail('GS:COACH_MAX');
      members[uid].role = role; return wait(null);
    },
    transfer: (uid) => { const m = leader(); if (!m) return fail('GS:NOT_LEADER'); m.role = 'coach'; members[uid].role = 'leader'; return wait(null); },
    disband: () => { const m = leader(); if (!m) return fail('GS:NOT_LEADER'); const gid = m.guild; Object.keys(members).forEach(u => { if (members[u].guild === gid) delete members[u]; }); delete guilds[gid]; return wait(null); },
    setRanked: (on) => { const m = leader(); if (!m) return fail('GS:NOT_LEADER'); if (on && count(m.guild) < 2) return fail('GS:MIN2'); guilds[m.guild].ranked = on; return wait(null); },
    setSolo: (on) => { if (on && mine()) return fail('GS:IN_GUILD'); users.me.solo = on; return wait(null); },
    contribute: () => wait(0),
    post: (body, notice) => {
      const m = mine(); if (!m) return fail('GS:NO_GUILD');
      if (!body || body.length > 200) return fail('GS:POST_LEN');
      if (notice && m.role === 'member') return fail('GS:NO_PERMISSION');
      posts.push({ id: postSeq++, guild: m.guild, user: ME, body, kind: notice ? 'notice' : 'talk', at: Date.now() });
      return wait(postSeq);
    },
    deletePost: (id) => {
      const m = mine(), p = posts.find(x => x.id === id);
      if (!p || !m || p.guild !== m.guild) return fail('GS:NO_POST');
      if (p.user !== ME && m.role === 'member') return fail('GS:NO_PERMISSION');
      posts = posts.filter(x => x.id !== id); return wait(null);
    },
    cheer: (uid) => {
      const m = mine(); if (!m || uid === ME || members[uid]?.guild !== m.guild) return fail('GS:NO_MEMBER');
      if (cheers.filter(c => c.from === ME && c.day === today).length >= 5) return fail('GS:CHEER_LIMIT');
      if (cheers.some(c => c.from === ME && c.to === uid && c.day === today)) return fail('GS:CHEERED');
      cheers.push({ guild: m.guild, from: ME, to: uid, day: today });
      guilds[m.guild].xp += 10; members[uid].contrib += 10;
      return wait(10);
    },
    upgradeSkill: (k) => {
      const m = leader(); if (!m) return fail('GS:NOT_LEADER');
      const g = guilds[m.guild];
      if (skillPoints(g.xp, g.skills) <= 0) return fail('GS:NO_POINTS');
      g.skills = { ...g.skills, [k]: skillLv(g.skills, k) + 1 }; return wait(null);
    },
    claim: (k) => {
      const m = mine(); if (!m) return fail('GS:NO_GUILD');
      const g = guilds[m.guild], s = weekStats(g.id), n = s.members;
      const ok = { volume: s.volume >= 15000 * n, attend: s.days >= 3 * n, together: n >= 2 && s.together >= 2, raid: s.volume * (1 + 0.1 * skillLv(g.skills, 'rack')) >= 25000 * n }[k];
      if (!ok) return fail('GS:NOT_DONE');
      if (claims.some(c => c.guild === g.id && c.week === key(ws) && c.key === k)) return fail('GS:CLAIMED');
      const reward = k === 'raid' ? 500 : Math.round((k === 'together' ? 200 : 300) * (1 + 0.2 * skillLv(g.skills, 'protein')));
      claims.push({ guild: g.id, week: key(ws), key: k }); g.xp += reward;
      return wait(reward);
    },
  };
  // 체험용 단축키: 콘솔에서 __guildMock.boost() 하면 이번 주 기록이 크게 늘어 미션·레이드 완료 화면을 볼 수 있다
  const boost = () => { const m = mine(); if (!m) return; Object.entries(members).filter(([, x]) => x.guild === m.guild).forEach(([u], i) => [0, 1, 2].forEach(d => activity.push({ guild: m.guild, user: u, day: dayKey(d), volume: 30000 + i * 1000, xp: 100, at: Date.now() }))); };
  const api = { meId: ME, guildApi, globalRanking, friendRanking, boost };
  window.__guildMock = api;
  return api;
};
