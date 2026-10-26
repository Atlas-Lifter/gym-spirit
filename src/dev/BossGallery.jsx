import React from 'react';
import { BossArt } from '../BossArt.jsx';
import { BOSS_KINDS, BOSS_ELEMENTS } from '../guildSystem.js';

// 개발 서버 전용: ?bossgallery 로 열면 레이드 보스 52종을 한눈에 확인 (배포본에는 포함되지 않음)
export default function BossGallery() {
  return (
    <div style={{ background: '#070b0f', minHeight: '100vh', padding: 16, color: '#fff', fontFamily: 'sans-serif' }}>
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
