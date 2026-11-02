import React, { useEffect, useRef, useState } from 'react';
import { BookOpen, Camera, CheckCircle2, FileVideo, List, MessageSquare, Plus, RotateCcw, SwitchCamera, Target, X } from 'lucide-react';
import { BONES, LM, loadPose, nextTs } from '../lib/pose.js';
import { createRepCounter, measure, profileFor, setSummary, SUPPORTED_LABELS } from '../lib/formRules.js';
import { identifyExercise } from '../lib/exerciseIdentify.js';

// 실시간 자세 체크: 카메라(또는 찍어 둔 영상) → (휴대폰 안에서) 관절 찾기 → 각도·반복 세기·반복마다 피드백
// exercise 가 없으면(종목 추가 화면의 카메라) 먼저 어떤 운동인지 알아낸다: 장면 몇 장 + 관절 움직임을 AI 에 보내 앱 종목 중에서 고른다
// 영상 자체는 밖으로 보내지 않는다 (운동 알아보기에 장면 사진 몇 장만, 세트 요약은 숫자만)
const ANGLE_NAME = { knee: '무릎', kneeMin: '무릎', hip: '엉덩이', elbow: '팔꿈치', elbowMin: '팔꿈치', shoulder: '어깨' };
const ID_FRAMES = 5;

// 지금 화면을 작은 JPEG 로 (운동 알아보기용)
const snapshot = (v) => {
  const scale = Math.min(1, 512 / Math.max(v.videoWidth, v.videoHeight));
  const c = document.createElement('canvas');
  c.width = Math.round(v.videoWidth * scale);
  c.height = Math.round(v.videoHeight * scale);
  c.getContext('2d').drawImage(v, 0, 0, c.width, c.height);
  return c;
};
const handsAboveHead = (pts) => !!pts && Math.min(pts[LM.lWrist].y, pts[LM.rWrist].y) < pts[LM.nose].y;
const wristAboveElbow = (pts) => !!pts && (pts[LM.lWrist].y < pts[LM.lElbow].y - 0.02 || pts[LM.rWrist].y < pts[LM.rElbow].y - 0.02);
const moved = (samples) => {
  const ms = samples.map(s => s.m).filter(Boolean);
  const r = (f) => { const v = ms.map(f).filter(x => x != null && x < 999); return v.length > 1 ? Math.max(...v) - Math.min(...v) : 0; };
  return Math.max(r(m => m.elbowMin), r(m => m.knee), r(m => m.hip), r(m => m.shoulder)) >= 25;
};

export function FormCheck({ exercise, onClose, onAskCoach, onOpenGuide, onAddExercise, addLabel = '오늘 운동에 추가' }) {
  const identify = !exercise;
  const [ex, setEx] = useState(exercise || null);
  const profile = ex ? profileFor(ex) : null;
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(0);
  const counterRef = useRef(null);
  const profileRef = useRef(profile);
  const idRef = useRef({ samples: [], frames: [], last: 0, busy: false });
  const [step, setStep] = useState('intro'); // intro → loading → live → summary | error
  const [loadingText, setLoadingText] = useState('자세 인식 준비 중…');
  const [facing, setFacing] = useState('environment');
  const [error, setError] = useState('');
  const [view, setView] = useState({ reps: 0, angle: null, cue: null, seen: true, angles: {} });
  const [reps, setReps] = useState([]);
  const [source, setSource] = useState('camera'); // camera | file
  const [progress, setProgress] = useState(0); // 올린 영상 재생 위치 0~1
  const [cands, setCands] = useState([]); // 알아낸 운동 후보 [{ exercise, confidence }]
  const [idState, setIdState] = useState(identify ? 'waiting' : 'done'); // waiting → asking → done | failed
  const fileInput = useRef(null);
  const fileUrl = useRef(null);

  // 운동이 정해지면(또는 바꾸면) 그 규칙으로 처음부터 센다
  const chooseExercise = (e) => {
    setEx(e);
    const p = profileFor(e);
    profileRef.current = p;
    counterRef.current = p ? createRepCounter(p) : null;
    setReps([]);
    setView(v => ({ ...v, reps: 0, cue: null }));
    setIdState('done');
  };

  const stop = () => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    const v = videoRef.current;
    if (v) { v.pause(); v.onended = null; }
    if (fileUrl.current) { URL.revokeObjectURL(fileUrl.current); fileUrl.current = null; }
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

  const runIdentify = async (frames, samples) => {
    setIdState('asking');
    try {
      const list = await identifyExercise(frames, samples);
      if (!list.length) throw new Error('어떤 운동인지 알아보지 못했어요. 목록에서 골라 주세요.');
      setCands(list);
      chooseExercise(list[0].exercise);
    } catch (e) {
      setError(e.message === 'Failed to fetch' ? '인터넷 연결을 확인해 주세요.' : e.message);
      setIdState('failed');
    }
  };

  // 영상 파일: 길이를 알면 재생 전에 장면 5장을 뽑아 운동을 알아낸다 (모르면 false → 재생하면서 알아본다)
  const identifyFromFile = async (v) => {
    setLoadingText('어떤 운동인지 보는 중…');
    if (v.readyState < 1) await new Promise((ok, no) => { v.onloadedmetadata = ok; v.onerror = no; });
    if (!isFinite(v.duration) || v.duration <= 0) return false;
    const lm = await loadPose('VIDEO'); // 사진 모드로 바꾸지 않고 영상 모드 그대로 (모드 전환은 다른 화면과 부딪힐 수 있다)
    const frames = [], samples = [];
    for (const at of [0.15, 0.35, 0.55, 0.75, 0.9]) {
      const ok = await new Promise(done => { const t = setTimeout(() => done(false), 3000); v.onseeked = () => { clearTimeout(t); done(true); }; v.currentTime = v.duration * at; });
      if (!ok) { v.onseeked = null; return false; }
      const c = snapshot(v);
      frames.push(c.toDataURL('image/jpeg', 0.7));
      const r = lm.detectForVideo(c, nextTs());
      samples.push({ m: measure(r.landmarks?.[0], r.worldLandmarks?.[0], c.width / c.height), handsAbove: handsAboveHead(r.landmarks?.[0]), wristUp: wristAboveElbow(r.landmarks?.[0]) });
    }
    v.onseeked = null;
    await runIdentify(frames, samples);
    v.currentTime = 0;
    return true;
  };

  // 카메라(mode) 또는 영상 파일(file)로 시작. 영상은 끝까지 재생되면 세트를 자동으로 끝낸다
  const start = async (mode = facing, file = null) => {
    stop();
    setSource(file ? 'file' : 'camera');
    setStep('loading');
    setLoadingText('자세 인식 준비 중…');
    setError('');
    setProgress(0);
    idRef.current = { samples: [], frames: [], last: 0, busy: false };
    let liveId = !file; // 재생(촬영)하면서 운동을 알아볼지
    try {
      const v = videoRef.current;
      if (file) {
        v.srcObject = null;
        fileUrl.current = URL.createObjectURL(file);
        v.src = fileUrl.current;
        if (identify && !ex) liveId = !(await identifyFromFile(v));
        v.onended = () => finishSet();
      } else {
        await loadPose('VIDEO');
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
        streamRef.current = stream;
        v.removeAttribute('src');
        v.srcObject = stream;
      }
      const landmarker = await loadPose('VIDEO');
      await v.play();
      counterRef.current = profileRef.current ? createRepCounter(profileRef.current) : null;
      setReps([]);
      setView({ reps: 0, angle: null, cue: null, seen: true, angles: {} });
      setStep('live');
      let last = -1, lastUi = 0;
      const loop = () => {
        rafRef.current = requestAnimationFrame(loop);
        if (v.readyState < 2 || v.currentTime === last) return;
        last = v.currentTime;
        const now = performance.now();
        const res = landmarker.detectForVideo(v, nextTs());
        const pts = res.landmarks?.[0], world = res.worldLandmarks?.[0];
        draw(pts);
        const m = measure(pts, world, v.videoWidth / (v.videoHeight || 1));
        // 촬영(또는 길이를 모르는 영상)으로 운동 알아보기: 0.6초마다 장면을 모으다가, 움직임이 보이면 AI 에 묻는다
        // 영상이면 알아낸 뒤 처음으로 되감아 처음부터 센다
        const id = idRef.current;
        if (liveId && identify && !exRef.current && !id.busy && now - id.last > 600) {
          id.last = now;
          id.frames.push(snapshot(v).toDataURL('image/jpeg', 0.7));
          id.samples.push({ m, handsAbove: handsAboveHead(pts), wristUp: wristAboveElbow(pts) });
          if (id.frames.length > ID_FRAMES) { id.frames.shift(); id.samples.shift(); }
          if (id.frames.length === ID_FRAMES && moved(id.samples)) {
            id.busy = true;
            if (file) v.pause();
            runIdentify([...id.frames], [...id.samples]).finally(() => { id.busy = false; if (file) { v.currentTime = 0; v.play(); } });
          }
        }
        const r = counterRef.current?.update(m);
        if (r?.counted || r?.done) setReps([...counterRef.current.reps]);
        // 화면 숫자는 초당 8번 정도만 바꾼다
        if (now - lastUi > 120 || r?.counted || r?.done) {
          lastUi = now;
          if (file && v.duration) setProgress(v.currentTime / v.duration);
          setView(prev => ({
            reps: counterRef.current ? counterRef.current.reps.length : 0,
            angle: r?.value ?? null,
            seen: !!m && (!profileRef.current?.needLegs || m.fullBody),
            angles: m ? { knee: m.knee, hip: m.hip, elbow: m.elbow } : {},
            cue: r?.done ? r.done.feedback : prev.cue,
          }));
        }
      };
      loop();
    } catch (e) {
      stop();
      setError(file ? '이 영상을 열지 못했어요. 다른 영상(mp4·mov)으로 해 주세요.'
        : e?.name === 'NotAllowedError' ? '카메라 사용을 허용해 주세요. (설정 → 사파리/브라우저 → 카메라)' : e?.name === 'NotFoundError' ? '카메라를 찾지 못했어요.' : '자세 인식을 시작하지 못했어요. 인터넷 연결을 확인하고 다시 해 주세요.');
      setStep('error');
    }
  };
  // loop 안에서 최신 운동을 보도록
  const exRef = useRef(ex);
  exRef.current = ex;
  profileRef.current = profile;

  const pickFile = () => { if (fileInput.current) { fileInput.current.value = ''; fileInput.current.click(); } };
  const finishSet = () => {
    const done = counterRef.current ? counterRef.current.finish() : [];
    stop();
    setReps([...done]);
    setStep('summary');
  };
  const flip = () => { const next = facing === 'user' ? 'environment' : 'user'; setFacing(next); start(next); };
  const close = () => { stop(); onClose(); };
  // 종목 추가 화면에서 열었으면, 닫을 때 알아낸 운동의 설명서로 넘어간다
  const closeToGuide = () => { stop(); if (identify && ex && onOpenGuide) onOpenGuide(ex.id); else onClose(); };
  const mirror = source === 'camera' && facing === 'user' ? { transform: 'scaleX(-1)' } : undefined;
  const issues = reps.flatMap(r => r.feedback.filter(f => !f.ok).map(f => f.text.replace(/\s*\(.*\)$/, '')));
  const issueCount = Object.entries(issues.reduce((o, t) => ({ ...o, [t]: (o[t] || 0) + 1 }), {})).sort((a, b) => b[1] - a[1]);

  // 알아낸 운동 + 다른 후보로 바꾸기
  const IdBar = () => (identify && (idState !== 'waiting' || step === 'live')) ? (
    <div className="bg-black/60 backdrop-blur rounded-2xl px-3 py-2.5 space-y-2">
      {idState === 'waiting' && <div className="text-[13px] font-black flex items-center gap-1.5"><Target className="w-4 h-4 text-[#8ea2ff]" />운동을 시작하면 어떤 운동인지 알아볼게요</div>}
      {idState === 'asking' && <div className="text-[13px] font-black flex items-center gap-1.5"><Target className="w-4 h-4 text-[#8ea2ff] animate-pulse" />어떤 운동인지 보는 중…</div>}
      {idState === 'failed' && <div className="text-[13px] font-black text-amber-300">{error}</div>}
      {idState === 'done' && ex && <div className="text-[13px] font-black flex items-center gap-1.5"><Target className="w-4 h-4 text-emerald-400" />인식한 운동: {ex.name}</div>}
      <div className="flex gap-1.5 overflow-x-auto hide-scrollbar">
        {cands.filter(c => c.exercise.id !== ex?.id).map(c => (
          <button key={c.exercise.id} onClick={() => chooseExercise(c.exercise)} className="px-2.5 py-1 rounded-lg bg-white/15 text-[11px] font-black whitespace-nowrap active:scale-95">{c.exercise.name}(으)로 바꾸기</button>
        ))}
        {(idState === 'done' || idState === 'failed') && <button onClick={close} className="px-2.5 py-1 rounded-lg bg-white/15 text-[11px] font-black whitespace-nowrap flex items-center gap-1 active:scale-95"><List className="w-3 h-3" />목록에서 고르기</button>}
      </div>
    </div>
  ) : null;

  return (
    <div className="fixed inset-0 z-[115] bg-black text-white flex flex-col">
      <div className="flex items-center justify-between px-4 pt-4 pb-3 bg-gradient-to-b from-black/80 to-transparent absolute top-0 inset-x-0 z-10">
        <div className="min-w-0">
          <div className="text-[11px] font-black text-[#8ea2ff]">{identify ? '영상으로 운동 찾기' : source === 'file' && step !== 'intro' ? '영상 자세 체크' : '실시간 자세 체크'}{profile ? ` · ${profile.label}` : ''}</div>
          <div className="text-lg font-black truncate">{ex ? ex.name : '어떤 운동일까요?'}</div>
        </div>
        <div className="flex gap-2">
          {step === 'live' && source === 'camera' && <button onClick={flip} aria-label="카메라 바꾸기" className="p-2.5 bg-white/15 rounded-full active:scale-90"><SwitchCamera className="w-5 h-5" /></button>}
          <button onClick={closeToGuide} aria-label="닫기" className="p-2.5 bg-white/15 rounded-full active:scale-90"><X className="w-5 h-5" /></button>
        </div>
      </div>

      {/* 카메라 */}
      <div className={`relative flex-1 ${step === 'live' || step === 'loading' ? '' : 'hidden'}`}>
        <input ref={fileInput} type="file" accept="video/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) start(facing, f); }} />
        <video ref={videoRef} playsInline muted className="absolute inset-0 w-full h-full object-contain" style={mirror} />
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-contain pointer-events-none" style={mirror} />
        {step === 'loading' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60">
            <div className="inline-flex gap-1">{[0, 1, 2].map(d => <span key={d} className="w-2.5 h-2.5 rounded-full bg-white/70 animate-bounce" style={{ animationDelay: `${d * 0.15}s` }} />)}</div>
            <div className="text-sm font-black">{loadingText}</div>
            <div className="text-[11px] font-bold text-white/60">처음 한 번은 10~20MB를 받아서 조금 걸려요</div>
          </div>
        )}
        {step === 'live' && (
          <>
            {identify && <div className="absolute top-20 inset-x-4"><IdBar /></div>}
            {profile && (
              <div className={`absolute ${identify ? 'top-44' : 'top-20'} inset-x-0 flex flex-col items-center pointer-events-none`}>
                <div className="text-7xl font-black tabular-nums drop-shadow-lg">{view.reps}</div>
                <div className="text-xs font-black text-white/80">회</div>
                {view.angle != null && <div className="mt-1 text-sm font-black bg-black/40 rounded-full px-3 py-1">{ANGLE_NAME[profile.metric]} {Math.round(view.angle)}°</div>}
              </div>
            )}
            {!profile && (
              <div className={`absolute ${identify ? 'top-44' : 'top-20'} inset-x-0 flex justify-center gap-2 pointer-events-none`}>
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
              {source === 'file' && <div className="h-1.5 rounded-full bg-white/20 mb-3 overflow-hidden"><div className="h-full bg-[#4768ff] transition-all" style={{ width: `${Math.round(progress * 100)}%` }} /></div>}
              <button onClick={finishSet} className="w-full py-3.5 rounded-xl bg-white text-neutral-900 font-black active:scale-95">{source === 'file' ? '여기까지 보고 끝내기' : '세트 끝내기'}</button>
            </div>
          </>
        )}
      </div>

      {step === 'intro' && (
        <div className="flex-1 overflow-y-auto px-5 pt-24 pb-6 space-y-4">
          <div className="text-2xl font-black leading-snug">{identify ? <>운동하는 모습을 보여 주면<br />어떤 운동인지 알아봐요</> : <>휴대폰을 세워 두고<br />한 세트 해 보세요</>}</div>
          <p className="text-[13px] font-bold text-white/60 -mt-2">{identify ? '찾은 운동의 기준으로 자세를 보고, 끝나면 그 운동 설명으로 넘어가요.' : '미리 찍어 둔 영상을 올려도 돼요. 영상도 휴대폰 안에서만 분석해요.'}</p>
          <div className="space-y-2 text-[14px] font-bold text-white/85">
            <div className="bg-white/10 rounded-2xl p-3.5">📐 {profile ? profile.view : '몸 전체가 나오게'} 보이도록 2~3m 떨어진 곳에 휴대폰을 세워요</div>
            <div className="bg-white/10 rounded-2xl p-3.5">💡 밝은 곳에서, 몸에 붙는 옷이면 더 정확해요</div>
            <div className="bg-white/10 rounded-2xl p-3.5">🔒 {identify ? '운동을 알아볼 때 장면 사진 5장만 AI 에 보내요. 영상은 휴대폰 안에서만 분석해요' : '영상은 휴대폰 안에서만 쓰고 저장하거나 보내지 않아요'}</div>
            {!identify && (profile
              ? <div className="bg-white/10 rounded-2xl p-3.5">🔢 {profile.label} 기준으로 반복을 세고, 반복마다 깊이·자세를 알려줘요</div>
              : <div className="bg-amber-500/20 text-amber-200 rounded-2xl p-3.5">이 종목은 아직 자동 피드백 기준이 없어 관절 표시와 각도만 보여줘요. (자동 피드백: {SUPPORTED_LABELS.join(', ')})</div>)}
          </div>
          <div className="flex gap-2">
            {[['environment', '뒤 카메라'], ['user', '앞 카메라(셀카)']].map(([m, l]) => (
              <button key={m} onClick={() => setFacing(m)} className={`flex-1 py-2.5 rounded-xl text-[13px] font-black border ${facing === m ? 'bg-white text-neutral-900 border-white' : 'border-white/30 text-white/80'}`}>{l}</button>
            ))}
          </div>
          <button onClick={() => start()} className="w-full py-4 rounded-xl bg-[#4768ff] font-black text-lg flex items-center justify-center gap-2 active:scale-95"><Camera className="w-5 h-5" />{identify ? '카메라로 실시간 찍기' : '카메라 켜기'}</button>
          <button onClick={pickFile} className="w-full py-3.5 rounded-xl bg-white/15 font-black flex items-center justify-center gap-2 active:scale-95"><FileVideo className="w-5 h-5" />찍어 둔 영상 올리기</button>
          <p className="text-[11px] font-bold text-white/40 text-center">AI가 관절 위치로 판단하는 참고용이에요. 통증이 있으면 바로 멈추세요.</p>
        </div>
      )}

      {step === 'error' && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
          <div className="text-base font-black">{error}</div>
          <button onClick={() => (source === 'file' ? pickFile() : start())} className="px-5 py-3 rounded-xl bg-[#4768ff] font-black flex items-center gap-2"><RotateCcw className="w-4 h-4" />{source === 'file' ? '다른 영상 고르기' : '다시 시도'}</button>
        </div>
      )}

      {step === 'summary' && (
        <div className="flex-1 overflow-y-auto px-5 pt-24 pb-6 space-y-4">
          {identify && <IdBar />}
          <div className="flex items-center gap-2 text-2xl font-black"><CheckCircle2 className="w-7 h-7 text-emerald-400" />{profile ? `${reps.length}회 했어요` : '세트 끝'}</div>
          {profile && reps.length === 0 && <div className="bg-white/10 rounded-2xl p-4 text-sm font-bold text-white/80">반복을 세지 못했어요. 몸 전체가 보이게, {profile.view} 보이도록 다시 해 보세요.</div>}
          {ex && !profile && <div className="bg-white/10 rounded-2xl p-4 text-sm font-bold text-white/80">{ex.name}은(는) 아직 자동 피드백 기준이 없어 횟수는 세지 않았어요.</div>}
          {issueCount.length > 0 && (
            <div className="bg-rose-500/15 rounded-2xl p-4 space-y-1.5">
              <div className="text-sm font-black text-rose-300">고칠 점</div>
              {issueCount.map(([t, n]) => <div key={t} className="text-[13px] font-bold text-white/90">• {t} <span className="text-white/50">({n}회)</span></div>)}
            </div>
          )}
          {reps.length > 0 && issueCount.length === 0 && <div className="bg-emerald-500/15 rounded-2xl p-4 text-sm font-black text-emerald-300">모든 반복이 기준을 지켰어요 👍</div>}
          <div className="space-y-1.5">
            {profile && reps.map((r, i) => (
              <div key={i} className="bg-white/5 rounded-xl px-3 py-2 text-[12px] font-bold text-white/80 flex gap-2">
                <span className="text-white font-black w-8">{i + 1}회</span>
                <span className="flex-1">{ANGLE_NAME[profile.metric]} {Math.round(r.min[profile.metric])}°~{Math.round(r.max[profile.metric])}° · {r.feedback.map(f => (f.ok ? '✓' : '✗')).join(' ')}</span>
              </div>
            ))}
          </div>
          <div className="space-y-2 pt-2">
            {identify && ex && onOpenGuide && (
              <button onClick={closeToGuide} className="w-full py-3.5 rounded-xl bg-white text-neutral-900 font-black flex items-center justify-center gap-2 active:scale-95"><BookOpen className="w-5 h-5" />{ex.name} 설명 보기</button>
            )}
            {identify && ex && onAddExercise && (
              <button onClick={() => { stop(); onAddExercise(ex); }} className="w-full py-3.5 rounded-xl bg-emerald-500 font-black flex items-center justify-center gap-2 active:scale-95"><Plus className="w-5 h-5" />{addLabel}</button>
            )}
            {profile && reps.length > 0 && onAskCoach && (
              <button onClick={() => { onAskCoach(ex, setSummary(profile, ex, reps)); }} className="w-full py-3.5 rounded-xl bg-[#4768ff] font-black flex items-center justify-center gap-2 active:scale-95"><MessageSquare className="w-5 h-5" />AI 코치에게 이 세트 피드백 받기</button>
            )}
            <button onClick={() => start()} className="w-full py-3.5 rounded-xl bg-white/15 font-black flex items-center justify-center gap-2 active:scale-95"><Camera className="w-4 h-4" />카메라로 한 세트 더</button>
            <button onClick={pickFile} className="w-full py-3.5 rounded-xl bg-white/15 font-black flex items-center justify-center gap-2 active:scale-95"><FileVideo className="w-4 h-4" />영상 올리기</button>
            <button onClick={close} className="w-full py-3 rounded-xl text-white/60 font-black">닫기</button>
          </div>
        </div>
      )}
    </div>
  );
}
