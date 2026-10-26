import React from 'react';

// 운영자 칭호 배지 (메이플스토리 GM 느낌의 금색 배지)
export const GmBadge = ({ small }) => (
  <span className={`inline-flex items-center gap-0.5 font-black rounded-md text-neutral-950 bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-200 shadow-[0_0_8px_rgba(250,204,21,.6)] whitespace-nowrap ${small ? 'text-[8px] px-1 py-[1px]' : 'text-[10px] px-1.5 py-0.5'}`}>👑 운영자</span>
);
