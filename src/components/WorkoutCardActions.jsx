import React, { useEffect, useRef, useState } from 'react';
import { Download, Share2, X } from 'lucide-react';
import { isIOS, renderWorkoutCard, saveCardToPhotos, shareCard } from '../lib/workoutCard.js';

// 오운완 카드 아래 버튼: 사진첩에 저장 / 공유.
// 카드 이미지는 창이 열리거나 테마를 바꿀 때 미리 만들어 둔다 (아이폰은 버튼을 누른 순간에 바로 공유 창을 열어야 해서)
export function WorkoutCardActions({ theme, data, avatarRef, showToast, onClose }) {
  const [blob, setBlob] = useState(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(null);
  const pending = useRef(null);
  const name = `GYM-SPIRIT-오운완-${data?.date || 'card'}.png`;

  useEffect(() => {
    let alive = true;
    setBlob(null);
    const p = renderWorkoutCard({ theme, data, avatarSvg: avatarRef.current?.querySelector('svg') });
    pending.current = p;
    p.then((b) => { if (alive) setBlob(b); }).catch(() => {});
    return () => { alive = false; };
  }, [theme, data]);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const run = async (action) => {
    if (busy) return;
    setBusy(true);
    try {
      const b = blob || await pending.current;
      if (!b) { showToast('카드 이미지를 만들지 못했어요. 잠시 뒤 다시 눌러 주세요.'); return; }
      const result = await action(b, name);
      if (result === 'preview') { setPreview(URL.createObjectURL(b)); return; }
      if (result === 'downloaded') showToast('📸 오운완 카드를 저장했어요! 갤러리의 Download(다운로드) 앨범에서 볼 수 있어요.');
      if (result === 'shared' && action === saveCardToPhotos) showToast('📸 저장 완료! 사진 앱에서 확인해 보세요.');
    } finally { setBusy(false); }
  };

  return (
    <>
      <div className="flex gap-2 w-full mt-4">
        <button onClick={() => run(saveCardToPhotos)} disabled={busy} className="flex-1 bg-emerald-500 text-neutral-950 font-black py-3.5 rounded-2xl shadow-lg hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 active:scale-95 text-sm disabled:opacity-60"><Download className="w-4 h-4"/> 사진첩에 저장</button>
        <button onClick={() => run(shareCard)} disabled={busy} className="flex-1 bg-neutral-800 text-white font-black py-3.5 rounded-2xl border border-neutral-700 hover:bg-neutral-700 transition-all flex items-center justify-center gap-2 active:scale-95 text-sm disabled:opacity-60"><Share2 className="w-4 h-4"/> 공유</button>
        <button onClick={onClose} className="p-3.5 bg-neutral-900 text-neutral-400 hover:text-white rounded-2xl border border-neutral-800 transition-colors" aria-label="닫기"><X className="w-5 h-5"/></button>
      </div>
      {isIOS() && <p className="text-[11px] font-bold text-neutral-400 mt-3 text-center leading-relaxed">공유 창이 뜨면 <span className="text-white">‘이미지 저장’</span>을 누르면 사진첩에 들어가요.<br/>처음 한 번은 사진 접근 허용을 물어봐요.</p>}
      {preview && (
        <div className="fixed inset-0 bg-black/95 z-[96] flex flex-col items-center justify-center p-6" onClick={() => setPreview(null)}>
          <img src={preview} alt="오운완 카드" className="max-h-[75vh] w-auto rounded-3xl shadow-2xl" onClick={e => e.stopPropagation()} />
          <p className="text-white font-black text-sm mt-5 text-center">이미지를 <span className="text-emerald-400">길게 눌러</span> ‘사진에 저장’을 선택해 주세요.</p>
          <button onClick={() => setPreview(null)} className="mt-4 px-6 py-3 bg-neutral-800 text-neutral-200 font-black rounded-2xl text-sm">닫기</button>
        </div>
      )}
    </>
  );
}
