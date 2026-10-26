import React from 'react';
import { BossArt, rageName } from '../BossArt.jsx';
import { FullBodyAvatar } from '../realAvatar.jsx';
import { BOSS_KINDS, BOSS_ELEMENTS } from '../guildSystem.js';

// 개발 서버 전용: ?bossgallery 로 열면 레이드 보스 52종을 한눈에 확인 (배포본에는 포함되지 않음)
export default function BossGallery() {
  return (
    <div style={{ background: '#070b0f', minHeight: '100vh', padding: 16, color: '#fff', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, background: '#f5f5f5', borderRadius: 16, padding: 8 }}>
        {[['male', 'standard'], ['male', 'flex'], ['male', 'hip'], ['female', 'standard']].map(([g, pose]) => (
          <FullBodyAvatar key={g + pose} profile={{ gm: true, gender: g, hairStyle: g === 'female' ? 'long' : 'short' }} size="w-36 h-72" pose={pose} />
        ))}
      </div>
      {/* 부활 단계별 분노 연출 미리보기 */}
      {[BOSS_KINDS[0], BOSS_KINDS[1], BOSS_KINDS[9]].map((k, ki) => (
        <div key={k.key} style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          {[1, 2, 3, 4, 5].map(st => (
            <div key={st} style={{ width: 150, textAlign: 'center', background: `linear-gradient(${BOSS_ELEMENTS[ki % BOSS_ELEMENTS.length].bg[0]}, ${BOSS_ELEMENTS[ki % BOSS_ELEMENTS.length].bg[1]})`, borderRadius: 14, padding: 4 }}>
              <BossArt kind={k.key} element={BOSS_ELEMENTS[ki % BOSS_ELEMENTS.length]} size={140} stage={st} />
              <div style={{ fontSize: 11, fontWeight: 900 }}>{st}단계 {rageName(st)}</div>
            </div>
          ))}
        </div>
      ))}
      {BOSS_ELEMENTS.map(el => (
        <div key={el.key} style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 900, marginBottom: 6, color: el.glow }}>{el.name} · {el.season}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {BOSS_KINDS.map(k => (
              <div key={k.key} style={{ width: 120, textAlign: 'center', background: `linear-gradient(${el.bg[0]}, ${el.bg[1]})`, borderRadius: 14, padding: 4 }}>
                <BossArt kind={k.key} element={el} size={112} />
                <div style={{ fontSize: 10, fontWeight: 800 }}>{el.name}의 {k.name}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
