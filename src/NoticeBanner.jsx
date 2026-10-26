import React, { useState } from 'react';
import { Megaphone, X } from 'lucide-react';

// 운영자 전체 공지 배너 (홈 맨 위). 닫으면 그 공지는 이 기기에서 다시 안 보인다
const KEY = 'gymspirit_notice_closed';
export const NoticeBanner = ({ notice }) => {
  const [closed, setClosed] = useState(() => { try { return localStorage.getItem(KEY) || ''; } catch (e) { return ''; } });
  if (!notice || String(notice.id) === closed) return null;
  const close = () => { setClosed(String(notice.id)); try { localStorage.setItem(KEY, String(notice.id)); } catch (e) {} };
  return (
    <div className="flex items-start gap-3 rounded-2xl px-4 py-3 mb-4 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 shadow-sm">
      <Megaphone className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-black text-amber-700">👑 운영자 공지</div>
        <div className="text-sm font-bold text-amber-950 break-words">{notice.body}</div>
      </div>
      <button onClick={close} aria-label="공지 닫기" className="p-1 text-amber-400"><X className="w-4 h-4" /></button>
    </div>
  );
};
