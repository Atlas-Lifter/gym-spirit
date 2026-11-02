import React, { useEffect, useRef, useState } from 'react';
import { Camera, CheckCircle2, MessageSquare, RotateCcw, SwitchCamera, X } from 'lucide-react';
import { BONES, loadPose } from '../lib/pose.js';
import { createRepCounter, measure, profileFor, setSummary, SUPPORTED_LABELS } from '../lib/formRules.js';

// 실시간 자세 체크: 카메라 → (휴대폰 안에서) 관절 찾기 → 각도·반복 세기·반복마다 피드백
// 영상은 저장하거나 밖으로 보내지 않는다. 세트가 끝나면 숫자 요약만 AI 코치에게 보낼 수 있다
const ANGLE_NAME = { knee: '무릎', kneeMin: '무릎', hip: '엉덩이', elbow: '팔꿈치', elbowMin: '팔꿈치', shoulder: '어깨' };

export function FormCheck({ exercise, onClose, onAskCoach }) {
  const profile = profileFor(exercise);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(0);
  const counterRef = useRef(null);
  const [step, setStep] = useState('intro'); // intro → loading → live → summary | error
  const [facing, setFacing] = useState('environment');
  const [error, setError] = useState('');
  const [view, setView] = useState({ reps: 0, angle: null, cue: null, seen: true, angles: {} });
  const [reps, setReps] = useState([]);

  const stop = () => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  };
  useEffect(() => stop, []);

  const draw = (pts) => {
    const c = canvasRef.current, v = videoRef.current;
    if (!c || !v) return;
    if (c.width !== v.videoWidth) { c.width = v.videoWidth; c.height = v.videoHeight; }
    const g = c.getContext('2d');
    g.clearRect(0, 0, c.width, c.height);
    if (!pts) return;
    g.lineWidth = Math.max(3, c.width / 160);
    g.strokeStyle = 'rgba(71,104,255,0.9)';
    BONES.forEach(([a, b]) => {
      if ((pts[a].visibility ?? 1) < 0.4 || (pts[b].visibility ?? 1) < 0.4) return;
      g.beginPath(); g.moveTo(pts[a].x * c.width, pts[a].y * c.height); g.lineTo(pts[b].x * c.width, pts[b].y * c.height); g.stroke();
    });
    g.fillStyle = '#fff';
    pts.slice(11).forEach(p => { if ((p.visibility ?? 1) < 0.4) return; g.beginPath(); g.arc(p.x * c.width, p.y * c.height, g.lineWidth * 1.3, 0, Math.PI * 2); g.fill(); });
  };

  const start = async (mode = facing) => {
    stop();
    setStep('loading');
    setError('');
    try {
      const [landmarker, stream] = await Promise.all([
        loadPose('VIDEO'),
        navigator.mediaDevices.getUserMedia({ video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false }),
      ]);
      streamRef.current = stream;
      const v = videoRef.current;
      v.srcObject = stream;
      await v.play();
      counterRef.current = profile ? createRepCounter(profile) : null;
      setReps([]);
      setView({ reps: 0, angle: null, cue: null, seen: true, angles: {} });
      setStep('live');
      let last = -1, lastUi = 0;
      const loop = () => {
        rafRef.current = requestAnimationFrame(loop);
        if (v.readyState < 2 || v.currentTime === last) return;
        last = v.currentTime;
        const now = performance.now();
        const res = landmarker.detectForVideo(v, now);
        const pts = res.landmarks?.[0], world = res.worldLandmarks?.[0];
        draw(pts);
        const m = measure(pts, world, v.videoWidth / (v.videoHeight || 1));
        const r = counterRef.current?.update(m);
        if (r?.counted || r?.done) setReps([...counterRef.current.reps]);
        // 화면 숫자는 초당 8번 정도만 바꾼다
        if (now - lastUi > 120 || r?.counted || r?.done) {
          lastUi = now;
          setView(prev => ({
            reps: counterRef.current ? counterRef.current.reps.length : 0,
            angle: r?.value ?? null,
            seen: !!m && (!profile?.needLegs || m.fullBody),
            angles: m ? { knee: m.knee, hip: m.hip, elbow: m.elbow } : {},
            cue: r?.done ? r.done.feedback : prev.cue,
          }));
        }
      };
      loop();
    } catch (e) {
      stop();
      setError(e?.name === 'NotAllowedError' ? '카메라 사용을 허용해 주세요. (설정 → 사파리/브라우저 → 카메라)' : e?.name === 'NotFoundError' ? '카메라를 찾지 못했어요.' : '자세 인식을 시작하지 못했어요. 인터넷 연결을 확인하고 다시 해 주세요.');
      setStep('error');
    }
  };

  const finishSet = () => {
    const done = counterRef.current ? counterRef.current.finish() : [];
    stop();
    setReps([...done]);
    setStep('summary');
  };
  const flip = () => { const next = facing === 'user' ? 'environment' : 'user'; setFacing(next); start(next); };
  const close = () => { stop(); onClose(); };
  const mirror = facing === 'user' ? { transform: 'scaleX(-1)' } : undefined;
  const issues = reps.flatMap(r => r.feedback.filter(f => !f.ok).map(f => f.text.replace(/\s*\(.*\)$/, '')));
  const issueCount = Object.entries(issues.reduce((o, t) => ({ ...o, [t]: (o[t] || 0) + 1 }), {})).sort((a, b) => b[1] - a[1]);

  return (
    <div className="fixed inset-0 z-[115] bg-black text-white flex flex-col">
      <div className="flex items-center justify-between px-4 pt-4 pb-3 bg-gradient-to-b from-black/80 to-transparent absolute top-0 inset-x-0 z-10">
        <div className="min-w-0">
          <div className="text-[11px] font-black text-[#8ea2ff]">실시간 자세 체크{profile ? ` · ${profile.label}` : ''}</div>
          <div className="text-lg font-black truncate">{exercise.name}</div>
        </div>
        <div className="flex gap-2">
          {step === 'live' && <button onClick={flip} aria-label="카메라 바꾸기" className="p-2.5 bg-white/15 rounded-full active:scale-90"><SwitchCamera className="w-5 h-5" /></button>}
          <button onClick={close} aria-label="닫기" className="p-2.5 bg-white/15 rounded-full active:scale-90"><X className="w-5 h-5" /></button>
        </div>
      </div>

      {/* 카메라 */}
      <div className={`relative flex-1 ${step === 'live' || step === 'loading' ? '' : 'hidden'}`}>
        <video ref={videoRef} playsInline muted className="absolute inset-0 w-full h-full object-contain" style={mirror} />
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-contain pointer-events-none" style={mirror} />
        {step === 'loading' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60">
            <div className="inline-flex gap-1">{[0, 1, 2].map(d => <span key={d} className="w-2.5 h-2.5 rounded-full bg-white/70 animate-bounce" style={{ animationDelay: `${d * 0.15}s` }} />)}</div>
            <div className="text-sm font-black">자세 인식 준비 중…</div>
            <div className="text-[11px] font-bold text-white/60">처음 한 번은 10~20MB를 받아서 조금 걸려요</div>
          </div>
        )}
        {step === 'live' && (
          <>
            {profile && (
              <div className="absolute top-20 inset-x-0 flex flex-col items-center pointer-events-none">
                <div className="text-7xl font-black tabular-nums drop-shadow-lg">{view.reps}</div>
                <div className="text-xs font-black text-white/80">회</div>
                {view.angle != null && <div className="mt-1 text-sm font-black bg-black/40 rounded-full px-3 py-1">{ANGLE_NAME[profile.metric]} {Math.round(view.angle)}°</div>}
              </div>
            )}
            {!profile && (
              <div className="absolute top-20 inset-x-0 flex justify-center gap-2 pointer-events-none">
                {Object.entries(view.angles).filter(([, v]) => v != null).map(([k, v]) => <div key={k} className="text-sm font-black bg-black/50 rounded-full px-3 py-1">{ANGLE_NAME[k]} {Math.round(v)}°</div>)}
              </div>
            )}
            {!view.seen && <div className="absolute top-1/2 inset-x-6 -translate-y-1/2 text-center text-sm font-black bg-amber-500/90 rounded-2xl px-4 py-3">몸 전체가 화면에 들어오게 뒤로 가 주세요</div>}
            {view.cue && view.cue.length > 0 && (
              <div className="absolute bottom-28 inset-x-4 space-y-1.5">
                {view.cue.map((f, i) => <div key={i} className={`text-[13px] font-black rounded-xl px-3 py-2 ${f.ok ? 'bg-emerald-500/90' : 'bg-rose-500/90'}`}>{f.ok ? '👍 ' : '🔧 '}{f.text}</div>)}
              </div>
            )}
            <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
              <button onClick={finishSet} className="w-full py-3.5 rounded-xl bg-white text-neutral-900 font-black active:scale-95">세트 끝내기</button>
            </div>
          </>
        )}
      </div>

      {step === 'intro' && (
        <div className="flex-1 overflow-y-auto px-5 pt-24 pb-6 space-y-4">
          <div className="text-2xl font-black leading-snug">휴대폰을 세워 두고<br />한 세트 해 보세요</div>
          <div className="space-y-2 text-[14px] font-bold text-white/85">
            <div className="bg-white/10 rounded-2xl p-3.5">📐 {profile ? profile.view : '몸 전체가 나오게'} 보이도록 2~3m 떨어진 곳에 휴대폰을 세워요</div>
            <div className="bg-white/10 rounded-2xl p-3.5">💡 밝은 곳에서, 몸에 붙는 옷이면 더 정확해요</div>
            <div className="bg-white/10 rounded-2xl p-3.5">🔒 영상은 휴대폰 안에서만 쓰고 저장하거나 보내지 않아요</div>
            {profile
              ? <div className="bg-white/10 rounded-2xl p-3.5">🔢 {profile.label} 기준으로 반복을 세고, 반복마다 깊이·자세를 알려줘요</div>
              : <div className="bg-amber-500/20 text-amber-200 rounded-2xl p-3.5">이 종목은 아직 자동 피드백 기준이 없어 관절 표시와 각도만 보여줘요. (자동 피드백: {SUPPORTED_LABELS.join(', ')})</div>}
          </div>
          <div className="flex gap-2">
            {[['environment', '뒤 카메라'], ['user', '앞 카메라(셀카)']].map(([m, l]) => (
              <button key={m} onClick={() => setFacing(m)} className={`flex-1 py-2.5 rounded-xl text-[13px] font-black border ${facing === m ? 'bg-white text-neutral-900 border-white' : 'border-white/30 text-white/80'}`}>{l}</button>
            ))}
          </div>
          <button onClick={() => start()} className="w-full py-4 rounded-xl bg-[#4768ff] font-black text-lg flex items-center justify-center gap-2 active:scale-95"><Camera className="w-5 h-5" />카메라 켜기</button>
          <p className="text-[11px] font-bold text-white/40 text-center">AI가 관절 위치로 판단하는 참고용이에요. 통증이 있으면 바로 멈추세요.</p>
        </div>
      )}

      {step === 'error' && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
          <div className="text-base font-black">{error}</div>
          <button onClick={() => start()} className="px-5 py-3 rounded-xl bg-[#4768ff] font-black flex items-center gap-2"><RotateCcw className="w-4 h-4" />다시 시도</button>
        </div>
      )}

      {step === 'summary' && (
        <div className="flex-1 overflow-y-auto px-5 pt-24 pb-6 space-y-4">
          <div className="flex items-center gap-2 text-2xl font-black"><CheckCircle2 className="w-7 h-7 text-emerald-400" />{profile ? `${reps.length}회 했어요` : '세트 끝'}</div>
          {profile && reps.length === 0 && <div className="bg-white/10 rounded-2xl p-4 text-sm font-bold text-white/80">반복을 세지 못했어요. 몸 전체가 보이게, {profile.view} 보이도록 다시 해 보세요.</div>}
          {issueCount.length > 0 && (
            <div className="bg-rose-500/15 rounded-2xl p-4 space-y-1.5">
              <div className="text-sm font-black text-rose-300">고칠 점</div>
              {issueCount.map(([t, n]) => <div key={t} className="text-[13px] font-bold text-white/90">• {t} <span className="text-white/50">({n}회)</span></div>)}
            </div>
          )}
          {reps.length > 0 && issueCount.length === 0 && <div className="bg-emerald-500/15 rounded-2xl p-4 text-sm font-black text-emerald-300">모든 반복이 기준을 지켰어요 👍</div>}
          <div className="space-y-1.5">
            {reps.map((r, i) => (
              <div key={i} className="bg-white/5 rounded-xl px-3 py-2 text-[12px] font-bold text-white/80 flex gap-2">
                <span className="text-white font-black w-8">{i + 1}회</span>
                <span className="flex-1">{ANGLE_NAME[profile.metric]} {Math.round(r.min[profile.metric])}°~{Math.round(r.max[profile.metric])}° · {r.feedback.map(f => (f.ok ? '✓' : '✗')).join(' ')}</span>
              </div>
            ))}
          </div>
          <div className="space-y-2 pt-2">
            {profile && reps.length > 0 && onAskCoach && (
              <button onClick={() => { onAskCoach(setSummary(profile, exercise, reps)); }} className="w-full py-3.5 rounded-xl bg-[#4768ff] font-black flex items-center justify-center gap-2 active:scale-95"><MessageSquare className="w-5 h-5" />AI 코치에게 이 세트 피드백 받기</button>
            )}
            <button onClick={() => start()} className="w-full py-3.5 rounded-xl bg-white/15 font-black flex items-center justify-center gap-2 active:scale-95"><RotateCcw className="w-4 h-4" />한 세트 더</button>
            <button onClick={close} className="w-full py-3 rounded-xl text-white/60 font-black">닫기</button>
          </div>
        </div>
      )}
    </div>
  );
}
