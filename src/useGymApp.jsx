import React, { useEffect, useRef, useState } from 'react';
import * as cloud from './cloud.js';
import { setAdminIds } from './admin.js';
import { guildErrorText } from './guildSystem.js';
import { DEFAULT_COVER_PHOTOS } from './coverPhotos.js';
import { MUSCLE_SUBGROUPS, getExerciseMuscles } from './data/anatomy.js';
import { ACC_COLORS, BOTTOM_COLORS, EXERCISE_OPTIONS, PROGRAMS, SHIRT_COLORS, SKIN_COLORS, getExId, getExName, getExTarget, ruleOfEx, toolOfEx } from './data/catalog.js';
import { LegendCover } from './legendCovers.jsx';
import { calculate1RM, formatDate } from './lib/dates.js';
import { useWakeLock } from './pwa.jsx';
import { MAX_LEVEL, levelInfo, xpForLevel } from './questSystem.js';
import { CARDIO_DAMAGE_PER_MIN } from './data/cardio.js';
import { computeRecovery } from './recovery.js';
import { DEFAULT_TIMER_SETTINGS, playAlarm, playTick, unlockAudio } from './restAlarm.js';
import { estimateFromLifts } from './strengthRatios.js';
import { nextWeight, setLoad } from './weightRules.js';

// 앱 전체 상태와 동작(기록 저장·클라우드·타이머·친구·길드 등). 화면 파일들은 useApp() 으로 여기서 꺼내 쓴다.
export function useGymApp() {
  const [usersDB, setUsersDB] = useState(() => {
    try { return JSON.parse(localStorage.getItem('gymwork_pro_users_v21')) || {}; } catch (e) { return {}; }
  });
  const [currentScreen, setCurrentScreen] = useState('auth');
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const db = JSON.parse(localStorage.getItem('gymwork_pro_users_v21')) || {};
      return db['guest@gymwork.com'] || null;
    } catch (e) {
      return null;
    }
  });
  const [activeTab, setActiveTab] = useState('workout');
  const [currentDate, setCurrentDate] = useState(() => formatDate(new Date()));
  const [calendarYear, setCalendarYear] = useState(() => new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(() => new Date().getMonth());
  const [session, setSession] = useState([]);
  const [workoutDurationSec, setWorkoutDurationSec] = useState(0);
  const sessionTimerRef = useRef(null);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [maxTime, setMaxTime] = useState(90);
  const [alarmRinging, setAlarmRinging] = useState(false);
  const [workoutMinimized, setWorkoutMinimized] = useState(false);
  // 운동 중에 잠깐 다른 화면을 보는 중
  const [pendingWorkoutStart, setPendingWorkoutStart] = useState(null);
  // 진행 중인 운동이 있을 때 새 운동 시작을 확인
  const [overtimeSec, setOvertimeSec] = useState(null);
  // 휴식이 끝난 뒤 지난 시간(초). null이면 초과 아님
  const [isAlarmSettingsOpen, setIsAlarmSettingsOpen] = useState(false);
  const alarmStopRef = useRef(null);
  const timerRef = useRef(null);
  const [isFullCalendarOpen, setIsFullCalendarOpen] = useState(false);
  const [exerciseOptionsModal, setExerciseOptionsModal] = useState(null);
  const [exerciseHistoryModal, setExerciseHistoryModal] = useState(null);
  const [plateVisualizerModal, setPlateVisualizerModal] = useState(null);
  const [rankingProfileModal, setRankingProfileModal] = useState(null);
  const [isRoutineLoaderOpen, setIsRoutineLoaderOpen] = useState(false);
  const [selectedPastDate, setSelectedPastDate] = useState(null);
  const [isNotiOpen, setIsNotiOpen] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isAddExerciseModalOpen, setIsAddExerciseModalOpen] = useState(false);
  const [exSearchQuery, setExSearchQuery] = useState('');
  const [exCategoryFilter, setExCategoryFilter] = useState('전체');
  const [isAvatarStudioOpen, setIsAvatarStudioOpen] = useState(false);
  const [avatarPose, setAvatarPose] = useState("standard");
  const [toastMessage, setToastMessage] = useState(null);
  const [isBodyStatsModalOpen, setIsBodyStatsModalOpen] = useState(false);
  const [tempStats, setTempStats] = useState({ weight: '', muscle: '', fat: '' });
  const [isOneRmCalculatorOpen, setIsOneRmCalculatorOpen] = useState(false);
  const [calcInputs, setCalcInputs] = useState({ weight: 100, reps: 5 });
  const [isManualRmModalOpen, setIsManualRmModalOpen] = useState(false);
  const [manualRmInputs, setManualRmInputs] = useState({ sq: '', bp: '', dl: '' });
  const [selectedProgramModal, setSelectedProgramModal] = useState(null);
  const [swapTargetExerciseId, setSwapTargetExerciseId] = useState(null);
  const [selectedDayDetailModal, setSelectedDayDetailModal] = useState(null);
  const [programFilter, setProgramFilter] = useState('전체');
  const [muscleConfirmModal, setMuscleConfirmModal] = useState(null);
  // { group, sub? }
  const [muscleSubPicker, setMuscleSubPicker] = useState(null);
  // 세부 부위 선택 팝업이 열린 부위
  const [isExitConfirmOpen, setIsExitConfirmOpen] = useState(false);
  const [selectedLegendModal, setSelectedLegendModal] = useState(null);
  const [substituteModalEx, setSubstituteModalEx] = useState(null);
  const [guideExerciseId, setGuideExerciseId] = useState(null);
  // 운동 설명서 팝업
  const [isPhotoCardModalOpen, setIsPhotoCardModalOpen] = useState(false);
  const [photoCardTheme, setPhotoCardTheme] = useState('neon');
  const [photoCardData, setPhotoCardData] = useState(null);
  const [isAiCoachOpen, setIsAiCoachOpen] = useState(false);
  const [activeRankingTab, setActiveRankingTab] = useState('global');
  const [rankingSortBy, setRankingSortBy] = useState('volume');
  const [isFriendSearchModalOpen, setIsFriendSearchModalOpen] = useState(false);
  const [friendSearchQuery, setFriendSearchQuery] = useState('');
  const [cheersData, setCheersData] = useState({});
  const [cloudUser, setCloudUser] = useState(null);
  // 로그인한 회원 { id, email }
  const [cloudReady, setCloudReady] = useState(false);
  // 클라우드 기록을 다 불러온 뒤에만 저장한다
  const [authChecking, setAuthChecking] = useState(true);
  // 첫 화면에서 로그인 상태 확인 중
  const [authBusy, setAuthBusy] = useState(false);
  const [authNotice, setAuthNotice] = useState('');
  const [signupNickname, setSignupNickname] = useState('');
  const [recoveryMode, setRecoveryMode] = useState(false);
  // 비밀번호 재설정 메일로 들어온 경우
  const [friendState, setFriendState] = useState({ friends: [], sent: [], incoming: [] });
  const [friendRank, setFriendRank] = useState([]);
  // 친구 랭킹 (나 + 서로 친구인 사람)
  const [globalEntries, setGlobalEntries] = useState([]);
  // 전체 랭킹 (등록한 길드 + 개인 참가)
  const [guildData, setGuildData] = useState(null);
  // 내 길드 화면 정보
  const [guildLoading, setGuildLoading] = useState(false);
  const [devMock, setDevMock] = useState(null);
  // 개발 서버에서 ?mockguild 로 길드 화면을 미리 보는 가짜 서버
  const lastContrib = useRef({});
  const [isInstallOpen, setIsInstallOpen] = useState(false);
  // 홈 화면 앱 설치 안내
  const [extraProfiles, setExtraProfiles] = useState({});
  // 친구·요청 보낸 사람 프로필
  const [rankLoading, setRankLoading] = useState(false);
  const [editingNick, setEditingNick] = useState(null);
  const cloudSaveTimer = useRef(null);
  const pendingCloudSave = useRef(null);
  const unreadCount = friendState.incoming.length;
  const [selectedFood, setSelectedFood] = useState(null);
  const [selectedMealId, setSelectedMealId] = useState(null);
  const [isAddFoodModalOpen, setIsAddFoodModalOpen] = useState(false);
  const [foodSearchQuery, setFoodSearchQuery] = useState('');
  const [foodCategoryFilter, setFoodCategoryFilter] = useState('전체');
  const [foodWeight, setFoodWeight] = useState(100);
  const handleCheer = async (userId) => {
    if (!cloudUser) { showToast('응원은 회원가입 후 보낼 수 있어요.'); return; }
    setCheersData(prev => ({ ...prev, [userId]: (prev[userId] || 0) + 1 }));
    try {
      await cloud.sendCheer(cloudUser.id, userId);
      showToast("🔥 힘찬 응원을 보냈습니다!");
    } catch (e) {
      setCheersData(prev => ({ ...prev, [userId]: Math.max(0, (prev[userId] || 1) - 1) }));
      showToast('응원을 보내지 못했어요. 잠시 후 다시 시도해 주세요.');
    }
  };
  // 다른 회원이 가장 최근에 저장한 운동을 오늘 운동으로 불러온다
  const stealRoutine = (user) => guardNewWorkout(() => {
    const items = Array.isArray(user.routine?.items) ? user.routine.items : [];
    if (!items.length) { showToast('가져올 운동 기록이 없어요.'); return; }
    const stamp = Date.now();
    const newSession = items.map((it, i) => ({
      id: `steal-${i}-${stamp}`,
      exercise: EXERCISE_OPTIONS.find(e => e.id === it.id) || EXERCISE_OPTIONS.find(e => e.name === it.name)
        || { id: String(it.id || `custom-${i}`), name: String(it.name || '운동'), target: String(it.target || '기타'), tool: String(it.tool || '바벨') },
      sets: (it.sets || []).map((st, j) => ({ id: `s${i}-${j}-${stamp}`, type: '-', weight: String(st.weight ?? ''), reps: String(st.reps ?? ''), rpe: '', completed: false })),
    }));
    setSession(newSession);
    setCurrentDate(formatDate(new Date()));
    setWorkoutDurationSec(0);
    setRankingProfileModal(null);
    setIsFriendSearchModalOpen(false);
    setCurrentScreen('workout');
    showToast(`${user.name}님의 루틴을 성공적으로 가져왔습니다!`);
  });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [authError, setAuthError] = useState('');
  const [analysisDate, setAnalysisDate] = useState(() => new Date());
  useEffect(() => {
    if (currentUser) {
      try {
        const db = JSON.parse(localStorage.getItem('gymwork_pro_users_v21')) || {};
        const updatedDB = { ...db, [currentUser.email]: currentUser };
        setUsersDB(updatedDB);
        localStorage.setItem('gymwork_pro_users_v21', JSON.stringify(updatedDB));
      } catch (e) {}
    }
  }, [currentUser]);
  // 운동 시간·휴식 타이머는 1초씩 더하고 빼지 않고 실제 시각으로 계산한다.
  // (앱을 내려두면 휴대폰이 타이머를 늦추거나 멈춰서, 1초씩 세면 30초가 지나도 몇 초만 흐른 것처럼 보였다)
  const durRef = useRef(workoutDurationSec); durRef.current = workoutDurationSec;
  const durStartRef = useRef(0);
  const durSetRef = useRef(null);
  useEffect(() => {
    if (currentScreen === 'workout') setWorkoutMinimized(false);
    if (!(currentScreen === 'workout' || workoutMinimized)) return undefined;
    // 바깥에서 운동 시간을 바꿨으면(새 운동 0초, 불러온 운동 등) 그 값부터 다시 잰다
    const rebase = () => { durStartRef.current = Date.now() - durRef.current * 1000; durSetRef.current = durRef.current; };
    if (!durStartRef.current || durSetRef.current !== durRef.current) rebase();
    const tick = () => {
      if (durSetRef.current !== durRef.current) rebase();
      const sec = Math.max(0, Math.floor((Date.now() - durStartRef.current) / 1000));
      if (sec !== durRef.current) { durRef.current = sec; durSetRef.current = sec; setWorkoutDurationSec(sec); }
    };
    sessionTimerRef.current = setInterval(tick, 500);
    document.addEventListener('visibilitychange', tick);
    return () => { clearInterval(sessionTimerRef.current); document.removeEventListener('visibilitychange', tick); };
  }, [currentScreen, workoutMinimized]);
  // 진행 중인 운동을 기기에 저장 (앱이 꺼지거나 새로고침돼도 이어서 할 수 있게)
  const ACTIVE_WORKOUT_KEY = 'gymspirit_active_workout';
  const activeWorkoutRestored = useRef(null);
  const prevSessionLen = useRef(0);
  useEffect(() => {
    if (currentScreen === 'auth' || !currentUser?.email || activeWorkoutRestored.current === currentUser.email) return;
    activeWorkoutRestored.current = currentUser.email;
    try {
      const saved = JSON.parse(localStorage.getItem(ACTIVE_WORKOUT_KEY) || 'null');
      if (!saved || saved.email !== currentUser.email || !Array.isArray(saved.session) || !saved.session.length || session.length) return;
      if (Date.now() - saved.savedAt > 12 * 3600 * 1000) { localStorage.removeItem(ACTIVE_WORKOUT_KEY); return; }
      setSession(saved.session);
      if (saved.date) setCurrentDate(saved.date);
      setWorkoutDurationSec(Math.min(4 * 3600, Math.max(0, Math.round((Date.now() - saved.startedAt) / 1000))));
      setWorkoutMinimized(true);
      showToast('진행 중이던 운동을 불러왔어요. 아래 바를 누르면 이어서 할 수 있어요.');
    } catch (e) {}
  }, [currentScreen, currentUser?.email]);
  useEffect(() => {
    const len = session.length;
    try {
      if (len > 0 && currentUser?.email) {
        localStorage.setItem(ACTIVE_WORKOUT_KEY, JSON.stringify({ email: currentUser.email, date: currentDate, session, startedAt: Date.now() - workoutDurationSec * 1000, savedAt: Date.now() }));
      } else if (len === 0 && prevSessionLen.current > 0) {
        localStorage.removeItem(ACTIVE_WORKOUT_KEY);
      }
    } catch (e) {}
    prevSessionLen.current = len;
  }, [session, currentDate]);
  // 휴식 타이머: '끝나는 시각'을 정해 두고 남은 시간을 계산한다
  const timeLeftRef = useRef(timeLeft); timeLeftRef.current = timeLeft;
  const restEndRef = useRef(0);
  const restSetRef = useRef(null);
  const overtimeStartRef = useRef(0);
  useEffect(() => {
    if (!isTimerActive) return undefined;
    // 시작·다시 시작할 때, 그리고 바깥에서 남은 시간을 바꿨을 때(+30초 등) 그 값부터 다시 잰다
    const rebase = () => { restEndRef.current = Date.now() + timeLeftRef.current * 1000; restSetRef.current = timeLeftRef.current; };
    rebase();
    const tick = () => {
      if (restSetRef.current !== timeLeftRef.current) rebase();
      const left = Math.max(0, Math.ceil((restEndRef.current - Date.now()) / 1000));
      if (left !== timeLeftRef.current) { timeLeftRef.current = left; restSetRef.current = left; setTimeLeft(left); }
    };
    timerRef.current = setInterval(tick, 250);
    document.addEventListener('visibilitychange', tick);
    return () => { clearInterval(timerRef.current); document.removeEventListener('visibilitychange', tick); };
  }, [isTimerActive]);
  useEffect(() => {
    if (timeLeft === 0 && isTimerActive) {
      setIsTimerActive(false);
      clearInterval(timerRef.current);
      // 휴식은 원래 끝났어야 할 시각에 끝난 것으로 보고, 초과 시간도 그때부터 센다
      const endedAt = restEndRef.current || Date.now();
      overtimeStartRef.current = endedAt;
      const lateSec = Math.floor((Date.now() - endedAt) / 1000);
      if (lateSec <= 5) {
        try {
          alarmStopRef.current?.();
          setAlarmRinging(true);
          alarmStopRef.current = playAlarm(timerSettings, () => { setAlarmRinging(false); alarmStopRef.current = null; });
        } catch(e) { console.error("오디오 알림 실패", e); }
        showToast("⏱️ 휴식 종료! 다음 세트를 준비하세요.");
      } else {
        // 앱을 내려둔 사이에 끝났으면 알람 대신 얼마나 지났는지 알려 준다
        showToast(`⏱️ 휴식이 ${lateSec < 60 ? `${lateSec}초` : `${Math.floor(lateSec / 60)}분 ${lateSec % 60}초`} 전에 끝났어요.`);
      }
      setOvertimeSec(Math.max(0, lateSec));
    }
    // 끝나기 3초 전부터 카운트다운
    if (isTimerActive && timeLeft > 0 && timeLeft <= 3 && timerSettings.countdown) {
      try { playTick(timerSettings.volume, timeLeft === 1); } catch (e) {}
    }
  }, [isTimerActive, timeLeft]);
  // 분석 탭의 회복도는 시간이 지나며 바뀌므로 1분마다 다시 그린다
  const [, setNowTick] = useState(0);
  useEffect(() => {
    if (activeTab !== 'analysis') return undefined;
    const t = setInterval(() => setNowTick(n => n + 1), 60000);
    return () => clearInterval(t);
  }, [activeTab]);
  // 휴식 초과 시간: 다음 세트를 시작(세트 완료·휴식 다시 시작)하거나 닫을 때까지 1초씩 센다
  const overtimeOn = overtimeSec !== null;
  useEffect(() => {
    if (!overtimeOn) return undefined;
    const tick = () => {
      const sec = Math.max(0, Math.floor((Date.now() - (overtimeStartRef.current || Date.now())) / 1000));
      setOvertimeSec(prev => (prev === null ? null : sec >= 1800 ? null : sec));
    };
    const t = setInterval(tick, 500);
    document.addEventListener('visibilitychange', tick);
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', tick); };
  }, [overtimeOn]);
  // 사진 표지: 흐린 사진을 배경으로 깔고, 선명한 사진은 오른쪽에 두어 왼쪽 글자와 겹치지 않게 한다. 사진이 없으면 3D 일러스트
  const LegendArt = ({ id }) => (DEFAULT_COVER_PHOTOS[id]
    ? (
      <>
        <img src={DEFAULT_COVER_PHOTOS[id]} alt="" className="absolute inset-0 w-full h-full object-cover scale-125 blur-xl opacity-70" />
        <img src={DEFAULT_COVER_PHOTOS[id]} alt="" className="absolute right-0 top-0 h-full w-[62%] object-cover" style={{ objectPosition: '50% 15%', WebkitMaskImage: 'linear-gradient(to right, transparent, #000 35%)', maskImage: 'linear-gradient(to right, transparent, #000 35%)' }} />
      </>
    )
    : <LegendCover id={id} className="absolute inset-0 w-full h-full" />);
  const showToast = (msg) => {
    setToastMessage(String(msg));
    setTimeout(() => setToastMessage(null), 3000);
  };
  const activeUser = currentUser;
  // 휴식 알람 설정 (예전 회원은 기본값으로 시작)
  const timerSettings = { ...DEFAULT_TIMER_SETTINGS, ...(activeUser?.timerSettings || {}) };
  const updateTimerSettings = (patch) => setCurrentUser(prev => (prev ? { ...prev, timerSettings: { ...DEFAULT_TIMER_SETTINGS, ...(prev.timerSettings || {}), ...patch } } : prev));
  const stopAlarm = () => { alarmStopRef.current?.(); alarmStopRef.current = null; setAlarmRinging(false); };
  const previewAlarm = (patch) => {
    unlockAudio();
    stopAlarm();
    setAlarmRinging(true);
    alarmStopRef.current = playAlarm({ ...timerSettings, ...patch, repeat: 1, vibrate: false }, () => { setAlarmRinging(false); alarmStopRef.current = null; });
  };
  const timerPagerRef = useRef(null);
  const timerPage = timerSettings.view === 'dial' ? 1 : 0;
  const onTimerPagerScroll = (e) => {
    const el = e.currentTarget;
    const page = Math.round(el.scrollLeft / Math.max(1, el.clientWidth));
    if (page !== timerPage) updateTimerSettings({ view: page ? 'dial' : 'digital' });
  };
  // 타이머가 다시 나타날 때 마지막으로 보던 보기(숫자/시계)로 맞춘다
  const timerVisible = isTimerActive || timeLeft > 0 || overtimeOn;
  useEffect(() => {
    const el = timerPagerRef.current;
    if (el && timerVisible) el.scrollLeft = timerPage * el.clientWidth;
  }, [timerVisible, currentScreen]);
  const scrollTimerPage = (page) => {
    const el = timerPagerRef.current;
    if (el) el.scrollTo({ left: page * el.clientWidth, behavior: 'smooth' });
  };
  const startRest = (sec) => { unlockAudio(); stopAlarm(); setOvertimeSec(null); setTimeLeft(sec); setMaxTime(sec); setIsTimerActive(true); };
  // 세트 볼륨 = 실제 부하 × 횟수 (맨몸 종목은 체중 포함, 어시스트는 체중에서 도움 무게를 뺀 값)
  const bodyWeightKg = parseFloat(activeUser?.bodyStats?.weight) || 0;
  const setVolume = (ex, s) => setLoad(String(getExId(ex)), toolOfEx(ex), s.weight, bodyWeightKg) * (parseInt(s.reps, 10) || 0);
  const safeWorkouts = activeUser?.workouts || {};
  const pastWorkoutDates = Object.keys(safeWorkouts)
  .filter(d => Array.isArray(safeWorkouts[d]) && safeWorkouts[d].length > 0)
  .sort((a,b) => new Date(b) - new Date(a));
  // 오늘(또는 오늘 아직 안 했으면 어제)부터 거꾸로 이어지는 연속 운동일 수
  // 유산소 기록 (근력과 따로 저장, 출석·연속 운동·퀘스트·랭킹·길드에는 함께 반영)
  const safeCardio = activeUser?.cardio || {};
  const cardioMinOn = (key) => (Array.isArray(safeCardio[key]) ? safeCardio[key] : []).reduce((s, e) => s + (Number(e.min) || 0), 0);
  const isActiveDay = (key) => pastWorkoutDates.includes(key) || cardioMinOn(key) > 0;
  const getWorkoutStreak = () => {
    const d = new Date();
    if (!isActiveDay(formatDate(d))) d.setDate(d.getDate() - 1);
    let streak = 0;
    while (isActiveDay(formatDate(d))) {
      streak++;
      d.setDate(d.getDate() - 1);
    }
    return streak;
  };
  const safeDiet = activeUser?.diet || {};
  const defaultMeals = [
    { id: 'm1', name: '1끼', items: [] },
    { id: 'm2', name: '2끼', items: [] },
    { id: 'm3', name: '3끼', items: [] }
  ];
  const todayDiet = safeDiet[currentDate] || { meals: defaultMeals };
  const getWeekDays = (baseDateStr) => {
    const base = new Date(baseDateStr);
    const day = base.getDay();
    const diff = base.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(base.setDate(diff));
    return Array.from({length: 7}, (_, i) => {
      const d = new Date(monday);
      d.setDate(d.getDate() + i);
      return d;
    });
  };
  const weekDays = getWeekDays(currentDate);
  // 회원 기록을 불러와 앱에 들어간다. 클라우드에 기록이 없으면 이 기기의 예전 기록(같은 이메일 또는 게스트)을 옮겨온다
  const enterCloud = async (user) => {
    const [data, prof] = await Promise.all([cloud.loadUserData(user.id), cloud.loadMyProfile(user.id)]);
    let base = data && Object.keys(data).length ? data : null;
    if (!base) {
      let local = null;
      try { local = (JSON.parse(localStorage.getItem('gymwork_pro_users_v21')) || {})[user.email] || null; } catch (e) {}
      if (!local && currentUser?.email === 'guest@gymwork.com') local = currentUser;
      if (local) {
        const { password: _pw, email: _em, friends: _f, sentRequests: _s, pendingRequests: _p, ...rest } = local;
        base = rest;
      } else {
        base = {
          profile: { years: 1, avatarColor: '#171717', skinColor: SKIN_COLORS[0], shirtColor: SHIRT_COLORS[0], bottomColor: BOTTOM_COLORS[0], gender: 'male', faceExpression: 'normal' },
          bodyStats: { weight: '', muscle: '', fat: '' }, workouts: {}, diet: {},
        };
      }
    }
    const nickname = prof?.nickname || base.profile?.nickname || user.email.split('@')[0];
    setCloudUser({ id: user.id, email: user.email });
    setCurrentUser({ ...base, email: user.email, cloudId: user.id, profile: { ...(base.profile || {}), nickname } });
    setCloudReady(true);
    setCurrentScreen('home');
  };
  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError(''); setAuthNotice('');
    if (recoveryMode) {
      if (password.length < 6) { setAuthError('비밀번호는 6자리 이상이어야 해요.'); return; }
      setAuthBusy(true);
      try {
        await cloud.updatePassword(password);
        setRecoveryMode(false);
        const { data } = await cloud.supabase.auth.getUser();
        if (data.user) await enterCloud(data.user);
        setPassword('');
        showToast('비밀번호를 바꿨어요.');
      } catch (err) { setAuthError(cloud.authErrorText(err)); }
      finally { setAuthBusy(false); }
      return;
    }
    if (!email || password.length < 6) { setAuthError('이메일과 6자리 이상 비밀번호를 입력해주세요.'); return; }
    if (!isLoginMode && !signupNickname.trim()) { setAuthError('랭킹에 보일 닉네임을 입력해주세요.'); return; }
    setAuthBusy(true);
    try {
      if (isLoginMode) {
        const { user } = await cloud.signIn({ email, password });
        await enterCloud(user);
        setPassword('');
        showToast("로그인 성공! 환영합니다.");
      } else {
        const { session, user } = await cloud.signUp({ email, password, nickname: signupNickname.trim().slice(0, 12) });
        if (session && user) {
          await enterCloud(user);
          setPassword('');
          setIsAvatarStudioOpen(true);
          showToast("회원가입 완료! 아바타를 꾸며보세요.");
        } else {
          setIsLoginMode(true);
          setAuthNotice(`${email} 로 인증 메일을 보냈어요. 메일 속 링크를 누르면 바로 시작돼요.`);
        }
      }
    } catch (err) { setAuthError(cloud.authErrorText(err)); }
    finally { setAuthBusy(false); }
  };
  const handlePasswordReset = async () => {
    setAuthError(''); setAuthNotice('');
    if (!email) { setAuthError('비밀번호를 재설정할 이메일을 먼저 입력해 주세요.'); return; }
    setAuthBusy(true);
    try { await cloud.sendPasswordReset(email); setAuthNotice(`${email} 로 비밀번호 재설정 메일을 보냈어요.`); }
    catch (err) { setAuthError(cloud.authErrorText(err)); }
    finally { setAuthBusy(false); }
  };
  const goToSignup = () => {
    setIsFriendSearchModalOpen(false);
    setIsLoginMode(false);
    setAuthError(''); setAuthNotice('');
    setCurrentScreen('auth');
  };
  const handleGuestLogin = () => {
    let db = usersDB;
    try { db = JSON.parse(localStorage.getItem('gymwork_pro_users_v21')) || usersDB; } catch (e) {}
    if (db['guest@gymwork.com']) {
       setCurrentUser(db['guest@gymwork.com']);
       setCurrentScreen('home');
       showToast("기존 게스트 데이터를 불러왔습니다.");
       return;
    }
    const guestUser = {
      email: 'guest@gymwork.com', password: 'guest',
      profile: { nickname: '게스트', years: 1, avatarColor: '#171717', skinColor: SKIN_COLORS[0], shirtColor: SHIRT_COLORS[0], bottomColor: BOTTOM_COLORS[0], gender: 'male', faceExpression: 'normal' },
      bodyStats: { weight: '', muscle: '', fat: '' },
      workouts: {}, diet: {}, friends: [], pendingRequests: []
    };
    setUsersDB(prev => ({...prev, 'guest@gymwork.com': guestUser}));
    setCurrentUser(guestUser);
    setCurrentScreen('home');
    showToast("게스트 모드로 시작합니다.");
  };
  const handleLogout = async () => {
    if (cloudUser) {
      clearTimeout(cloudSaveTimer.current);
      try { await pendingCloudSave.current?.(); } catch (e) {}
      pendingCloudSave.current = null;
      try { await cloud.signOut(); } catch (e) {}
      try {
        const db = JSON.parse(localStorage.getItem('gymwork_pro_users_v21')) || {};
        delete db[cloudUser.email];
        localStorage.setItem('gymwork_pro_users_v21', JSON.stringify(db));
        setUsersDB(db);
      } catch (e) {}
      setCloudUser(null);
      setCloudReady(false);
      setFriendRank([]); setGuildData(null); lastContrib.current = {};
    }
    setCurrentUser(null);
    setCurrentScreen('auth');
    setActiveTab('workout');
    setEmail(''); setPassword('');
    showToast("로그아웃 되었습니다.");
  };
  const updateProfile = (updates) => {
    if (!currentUser) return;
    setCurrentUser(prev => ({ ...prev, profile: { ...prev.profile, ...updates } }));
  };
  const openBodyStatsModal = () => {
    setTempStats({ weight: '', muscle: '', fat: '', ...(currentUser?.bodyStats || {}) });
    setIsBodyStatsModalOpen(true);
  };
  // 체성분 기록(바디 트랜스포메이션): 같은 날짜는 덮어쓰고, 가장 최근 기록을 신체 정보에도 반영
  const withBodyEntry = (prev, entry) => {
    const hist = (prev.bodyHistory || []).filter(e => e.date !== entry.date).concat([entry]).sort((a, b) => a.date.localeCompare(b.date));
    const latest = hist[hist.length - 1];
    return { ...prev, bodyHistory: hist, bodyStats: latest.date === entry.date ? { weight: entry.weight, muscle: entry.muscle, fat: entry.fat } : prev.bodyStats };
  };
  const upsertBodyEntry = (entry) => {
    if (!currentUser) return;
    setCurrentUser(prev => withBodyEntry(prev, entry));
    showToast(`${entry.date.slice(5).replace('-', '월 ')}일 체성분을 기록했어요.`);
  };
  const deleteBodyEntry = (date) => {
    if (!currentUser) return;
    setCurrentUser(prev => ({ ...prev, bodyHistory: (prev.bodyHistory || []).filter(e => e.date !== date) }));
    showToast('기록을 삭제했어요.');
  };
  const saveBodyGoal = (goal) => {
    if (!currentUser) return;
    setCurrentUser(prev => ({ ...prev, bodyGoal: { ...goal } }));
    showToast('목표를 저장했어요.');
  };
  const saveBodyStats = () => {
    if (!currentUser) return;
    setCurrentUser(prev => withBodyEntry(prev, { date: formatDate(new Date()), weight: tempStats.weight, muscle: tempStats.muscle, fat: tempStats.fat }));
    setIsBodyStatsModalOpen(false);
    showToast("신체 정보가 성공적으로 저장되었습니다.");
  };
  const triggerSaveWorkout = (source) => {
    const src = Array.isArray(source) ? source : session;
    if (!src || src.length === 0) { showToast("운동 기록이 없습니다. 먼저 종목을 추가해주세요."); return; }
    setWorkoutMinimized(false);
    try { localStorage.removeItem(ACTIVE_WORKOUT_KEY); } catch (e) {}
    const cleanSession = src.map(ex => ({
      id: String(ex.id || Date.now()),
      exercise: { id: String(getExId(ex)), name: String(getExName(ex)), target: String(getExTarget(ex)), tool: String(ex.exercise?.tool || ex.tool || '바벨') },
      sets: (ex.sets || []).map(s => ({ id: String(s.id || Date.now()), type: String(s.type || '-'), weight: String(s.weight || '0'), reps: String(s.reps || '0'), rpe: String(s.rpe || ''), completed: Boolean(s.completed), ...(s.completed && s.doneAt ? { doneAt: String(s.doneAt) } : {}) }))
    }));
    const dateKey = String(currentDate);
    // 운동이 끝난 시각 = 마지막으로 완료 체크한 세트 시각 (자정을 넘겨 끝난 운동도 그대로).
    // 그 날짜와 동떨어진 시각(지난 날짜를 나중에 적은 경우)은 쓰지 않고, 이미 저장된 시각이 있으면 그대로 둔다
    const nowMs = Date.now();
    const [dy, dm, dd] = dateKey.split('-').map(Number);
    const dayStart = new Date(dy, dm - 1, dd).getTime();
    const lastDone = cleanSession.flatMap(ex => ex.sets).filter(st => st.completed && st.doneAt)
      .map(st => new Date(st.doneAt).getTime()).filter(t => !isNaN(t) && t >= dayStart && t <= dayStart + 36 * 3600 * 1000 && t <= nowMs)
      .reduce((a, b) => Math.max(a, b), 0);
    setCurrentUser(prev => {
      const existingWorkouts = prev.workouts || {};
      const prevTimes = prev.workoutTimes || {};
      const endAt = lastDone ? new Date(lastDone).toISOString() : prevTimes[dateKey] || (dateKey === formatDate(new Date()) ? new Date().toISOString() : null);
      const workoutTimes = endAt ? { ...prevTimes, [dateKey]: endAt } : prevTimes;
      const updatedUser = { ...prev, workouts: { ...existingWorkouts, [dateKey]: cleanSession }, workoutTimes };
      try {
        const db = JSON.parse(localStorage.getItem('gymwork_pro_users_v21')) || {};
        db[updatedUser.email] = updatedUser;
        localStorage.setItem('gymwork_pro_users_v21', JSON.stringify(db));
      } catch (e) { console.error("Local storage sync failed", e); }
      return updatedUser;
    });
    setIsTimerActive(false);
    setTimeLeft(0);
    setOvertimeSec(null);
    setShowCelebration(true);
  };
  // 운동을 잠깐 내려두고 다른 화면으로 (기록·시간·휴식 타이머는 계속 돈다)
  const minimizeWorkout = () => {
    if (session.length === 0) { exitWorkout(); return; }
    setWorkoutMinimized(true);
    setCurrentScreen('home');
    showToast('운동을 잠깐 내려놨어요. 아래 바를 누르면 이어서 할 수 있어요.');
  };
  const resumeWorkout = () => { setCurrentScreen('workout'); };
  // 진행 중인 운동이 있으면 덮어쓰기 전에 물어본다
  const guardNewWorkout = (start) => {
    if (workoutMinimized && session.length > 0) { setPendingWorkoutStart(() => start); return; }
    start();
  };
  const discardAndStart = () => {
    const start = pendingWorkoutStart;
    setPendingWorkoutStart(null);
    stopAlarm();
    setIsTimerActive(false); setTimeLeft(0); setOvertimeSec(null);
    setSession([]); setWorkoutDurationSec(0); setWorkoutMinimized(false);
    start?.();
  };
  // 완료 체크를 안 한 세트가 있으면 저장 전에 한 번 묻는다 (체크한 세트만 볼륨·랭킹에 들어가기 때문)
  const [saveCheck, setSaveCheck] = useState(null);
  const hasReps = (st) => Number(st.reps) > 0;
  const requestSaveWorkout = () => {
    const sets = session.flatMap(ex => ex.sets || []);
    const unticked = sets.filter(st => !st.completed && hasReps(st)).length;
    if (session.length > 0 && unticked > 0) { setSaveCheck({ unticked, done: sets.filter(st => st.completed).length }); return; }
    triggerSaveWorkout();
  };
  const saveAllAsDone = () => {
    const at = new Date().toISOString();
    const all = session.map(ex => ({ ...ex, sets: (ex.sets || []).map(st => (hasReps(st) && !st.completed ? { ...st, completed: true, doneAt: at } : st)) }));
    setSaveCheck(null);
    setSession(all);
    triggerSaveWorkout(all);
  };
  const saveTickedOnly = () => {
    setSaveCheck(null);
    const done = completedOnlySession();
    if (!done.length) { showToast('완료 체크한 세트가 없어요. 세트 오른쪽 DONE을 눌러 주세요.'); return; }
    triggerSaveWorkout(done);
  };
  const completedOnlySession = () => session
  .map(ex => ({ ...ex, sets: (ex.sets || []).filter(st => st.completed) }))
  .filter(ex => ex.sets.length > 0);
  const quitAndSaveDone = () => {
    const done = completedOnlySession();
    setIsExitConfirmOpen(false);
    if (!done.length) { exitWorkout(); return; }
    triggerSaveWorkout(done);
  };
  const exitWorkout = () => {
    setIsExitConfirmOpen(false);
    setWorkoutMinimized(false);
    setWorkoutDurationSec(0);
    setSession([]);
    setIsTimerActive(false);
    setTimeLeft(0);
    setOvertimeSec(null);
    setCurrentScreen('home');
  };
  const finishCelebration = () => {
    setShowCelebration(false);
    setCurrentScreen('home');
    setActiveTab('workout');
    setSession([]);
    setWorkoutDurationSec(0);
    showToast("오운완! 오늘의 훈련이 홈 화면에 저장되었습니다. 🔥");
  };
  const loadSpecificWorkout = (dateStr) => guardNewWorkout(() => {
    if (!activeUser || !safeWorkouts || !safeWorkouts[dateStr]) return;
    const copiedSession = safeWorkouts[dateStr].map(ex => {
      const exId = getExId(ex);
      const exName = getExName(ex);
      const foundOption = EXERCISE_OPTIONS.find(e => e.id === exId || e.name === exName) || EXERCISE_OPTIONS[0];
      return { ...ex, id: Date.now().toString() + Math.random(), exercise: foundOption,
        sets: (ex.sets || []).map(s => ({ ...s, id: Date.now().toString() + Math.random(), completed: false })) };
    });
    setSession(copiedSession);
    setCurrentDate(formatDate(new Date()));
    setWorkoutDurationSec(0);
    setCurrentScreen('workout');
    showToast(`${dateStr} 루틴을 성공적으로 복사했습니다!`);
  });
  const loadProgramWorkout = (programId) => guardNewWorkout(() => {
    const prog = PROGRAMS.find(p => p.id === String(programId));
    if (!prog) return;
    const mappedSession = prog.workouts.map((rec, i) => {
      const exOption = EXERCISE_OPTIONS.find(e => e.id === rec.exerciseId) || EXERCISE_OPTIONS[0];
      return { id: `prog-${Date.now()}-${i}`, exercise: exOption,
        sets: Array.from({length: rec.sets}).map((_, j) => ({ id: `set-${Date.now()}-${i}-${j}`, type: '-', weight: String(rec.weight), reps: String(rec.reps), rpe: '', completed: false })) };
    });
    setSession(mappedSession);
    setCurrentDate(formatDate(new Date()));
    setWorkoutDurationSec(0);
    setCurrentScreen('workout');
    showToast(`'${prog.title}' 프로그램을 시작합니다. 화이팅!`);
  });
  const loadLegendRoutine = (routine) => guardNewWorkout(() => {
    const mappedSession = routine.workouts.map((rec, i) => {
      const exOption = EXERCISE_OPTIONS.find(e => e.id === rec.exerciseId) || EXERCISE_OPTIONS[0];
      return { id: `leg-${Date.now()}-${i}`, exercise: exOption,
        sets: Array.from({length: rec.sets}).map((_, j) => ({ id: `set-${Date.now()}-${i}-${j}`, type: '-', weight: String(rec.weight), reps: String(rec.reps), rpe: '', completed: false })) };
    });
    setSession(mappedSession);
    setCurrentDate(formatDate(new Date()));
    setWorkoutDurationSec(0);
    setSelectedLegendModal(null);
    setCurrentScreen('workout');
    showToast(`전설의 루틴 [${routine.title}]을(를) 시작합니다!`);
  });
  const handleMuscleClick = (part) => {
    let searchTarget = '';
    if(part.includes('가슴')) searchTarget = '가슴';
    else if(part.includes('등')) searchTarget = '등';
    else if(part.includes('하체')) searchTarget = '하체';
    else if(part.includes('어깨')) searchTarget = '어깨';
    else if(part.includes('팔')) searchTarget = '팔';
    else if(part.includes('복근')) searchTarget = '복근';
    if(!searchTarget) return;
    // 세부 부위가 있는 부위(가슴/등/어깨/팔/하체)는 먼저 세부 부위를 고르게 한다
    if (MUSCLE_SUBGROUPS[searchTarget]) setMuscleSubPicker(searchTarget);
    else setMuscleConfirmModal({ group: searchTarget });
  };
  const pickMuscleSub = (group, sub) => {
    setMuscleSubPicker(null);
    setMuscleConfirmModal({ group, sub });
  };
  const getMuscleExercises = ({ group, sub }) => {
    if (sub?.ids) return sub.ids.map(id => EXERCISE_OPTIONS.find(ex => ex.id === id)).filter(Boolean);
    return EXERCISE_OPTIONS.filter(ex => sub ? sub.match(String(ex.target), ex) : String(ex.target).includes(group));
  };
  const startMuscleRoutine = () => guardNewWorkout(() => {
    if(!muscleConfirmModal) return;
    const routineLabel = muscleConfirmModal.sub ? `${muscleConfirmModal.group} ${muscleConfirmModal.sub.key}` : muscleConfirmModal.group;
    const recommended = getMuscleExercises(muscleConfirmModal).slice(0, 4);
    if(recommended.length === 0) return;
    const mappedSession = recommended.map((ex, i) => ({
        id: `rec-${Date.now()}-${i}`, exercise: ex,
        sets: Array.from({length: 4}).map((_, j) => ({ id: `set-${Date.now()}-${i}-${j}`, type: '-', weight: '20', reps: '10', rpe: '', completed: false }))
    }));
    setSession(mappedSession);
    setCurrentDate(formatDate(new Date()));
    setWorkoutDurationSec(0);
    setMuscleConfirmModal(null);
    setCurrentScreen('workout');
    showToast(`${routineLabel} 집중 추천 루틴이 세팅되었습니다!`);
  });
  const addExerciseFromModal = (exOption) => {
    setSession([...session, { id: Date.now().toString(), exercise: exOption,
      sets: [{ id: Date.now().toString(), type: '-', weight: '', reps: '', rpe: '', completed: false }] }]);
    setIsAddExerciseModalOpen(false);
    showToast(`${exOption.name} 종목이 추가되었습니다.`);
  };
  const swapExercise = (newExerciseObj, targetId = swapTargetExerciseId) => {
    setSession(session.map(ex => {
      if(ex.id === targetId) return { ...ex, exercise: newExerciseObj };
      return ex;
    }));
    setSwapTargetExerciseId(null);
    setIsAddExerciseModalOpen(false);
    setSubstituteModalEx(null);
    showToast(`종목이 성공적으로 변경되었습니다.`);
  };
  const removeExercise = (exerciseId) => {
    setSession(session.filter(s => s.id !== String(exerciseId)));
    setExerciseOptionsModal(null);
    showToast("루틴에서 종목이 삭제되었습니다.");
  };
  const addSet = (exerciseId) => {
    setSession(session.map(ex => {
      if (ex.id === exerciseId) {
        const lastSet = ex.sets[ex.sets.length - 1];
        return { ...ex, sets: [...ex.sets, { id: Date.now().toString(), type: lastSet ? lastSet.type : '-', weight: lastSet ? lastSet.weight : '', reps: lastSet ? lastSet.reps : '', rpe: '', completed: false }] };
      }
      return ex;
    }));
  };
  const removeSet = (exerciseId, setId) => {
    setSession(session.map(ex => {
      if (ex.id === exerciseId) return { ...ex, sets: ex.sets.filter(s => s.id !== setId) };
      return ex;
    }));
  };
  const cycleSetType = (exerciseId, setId) => {
    const types = ['W', '-', 'D'];
    setSession(session.map(ex => {
      if (ex.id === exerciseId) return { ...ex, sets: ex.sets.map(s => s.id === setId ? { ...s, type: types[(types.indexOf(s.type) + 1) % types.length] } : s) };
      return ex;
    }));
  };
  const updateSet = (exerciseId, setId, field, value) => {
    setSession(session.map(ex => {
      if (ex.id === exerciseId) return { ...ex, sets: ex.sets.map(s => {
        if (s.id !== setId) return s;
        const next = { ...s, [field]: String(value), ...(field === 'rpe' ? { rpeAuto: false } : {}) };
        // 완료한 세트에 무게·횟수를 나중에 넣거나 고쳐도, RPE가 비었거나 자동값이면 다시 계산해 넣는다
        if ((field === 'weight' || field === 'reps') && next.completed && (!String(next.rpe || '').trim() || next.rpeAuto)) {
          const auto = suggestRpe(ex, next);
          return auto !== null ? { ...next, rpe: String(auto), rpeAuto: true } : { ...next, rpe: next.rpeAuto ? '' : next.rpe, rpeAuto: false };
        }
        return next;
      }) };
      return ex;
    }));
  };
  // 추천 RPE: 1RM(3대는 분석 탭에 입력한 값과 기록 중 큰 값, 그 외 종목은 내 최고 기록)으로
  // 이 무게를 최대 몇 번 들 수 있는지(Epley 역산) 구하고, 남은 반복 수를 RPE로 바꾼다 (RPE = 10 - 남은 반복)
  const exOneRM = (ex) => {
    const id = String(getExId(ex));
    if (['sq', 'bp', 'dl'].includes(id)) return getEffective1RM(id);
    // 내 기록이 있으면 그 기록, 없으면 3대 수준으로 추정 (strengthRatios.js)
    const own = getTop1RM(id);
    if (own > 0) return own;
    return estimateFromLifts(id, { sq: getEffective1RM('sq'), bp: getEffective1RM('bp'), dl: getEffective1RM('dl') })?.rm || 0;
  };
  const suggestRpe = (ex, set, oneRM = exOneRM(ex)) => {
    const rule = ruleOfEx(ex);
    if (rule.key === 'bodyweight' || rule.key === 'assist') return null;
    const w = parseFloat(set.weight), r = parseInt(set.reps, 10);
    if (!(oneRM > 0) || !(w > 0) || !(r > 0)) return null;
    const maxReps = w >= oneRM ? 1 : 30 * (oneRM / w - 1);
    const rpe = Math.max(5, Math.min(10, 10 - (maxReps - r)));
    return Math.round(rpe * 2) / 2;
  };
  const toggleSetComplete = (exerciseId, setId) => {
    let justCompleted = false;
    setSession(session.map(ex => {
      if (ex.id === exerciseId) {
        return { ...ex, sets: ex.sets.map(s => {
            if (s.id === setId) {
              justCompleted = !s.completed;
              // 완료할 때 RPE를 비워 뒀으면 추천값을 자동으로 넣는다 (직접 적은 값은 그대로)
              const auto = justCompleted && !String(s.rpe || '').trim() ? suggestRpe(ex, s) : null;
              const next = { ...s, completed: !s.completed, ...(auto !== null ? { rpe: String(auto), rpeAuto: true } : {}) };
              // 완료한 시각을 남겨 두고, 회복 카운트다운은 마지막으로 완료한 세트 시각부터 센다
              if (justCompleted) next.doneAt = new Date().toISOString(); else delete next.doneAt;
              return next;
            }
            return s;
          }) };
      }
      return ex;
    }));
    if (justCompleted) startRest(timerSettings.defaultRest);
  };
  const adjustTimer = (amount) => setTimeLeft(prev => Math.max(0, prev + amount));
  const getPreviousRecord = (exerciseId, setIndex) => {
    if (!activeUser || !safeWorkouts) return null;
    for (const date of pastWorkoutDates) {
      if (date >= currentDate) continue;
      const pastSession = safeWorkouts[date];
      if (!Array.isArray(pastSession)) continue;
      const pastEx = pastSession.find(ex => getExId(ex) === exerciseId);
      if (pastEx && pastEx.sets && pastEx.sets[setIndex] && pastEx.sets[setIndex].weight) return pastEx.sets[setIndex];
    }
    return null;
  };
  const getAlternativeExercises = (currentExObj) => {
    if (!currentExObj) return [];
    const currentId = getExId(currentExObj);
    const targetGroup = getExTarget(currentExObj).split('(')[0];
    return EXERCISE_OPTIONS.filter(ex => ex.id !== currentId && ex.target.includes(targetGroup)).slice(0, 3);
  };
  const checkOverloadRecommendation = (exerciseId) => {
    if (!activeUser || !safeWorkouts || pastWorkoutDates.length === 0) return false;
    const lastDate = pastWorkoutDates.find(d => d < currentDate);
    if (!lastDate) return false;
    const lastSession = safeWorkouts[lastDate];
    if (!Array.isArray(lastSession)) return false;
    const pastEx = lastSession.find(e => getExId(e) === exerciseId);
    if (!pastEx || !pastEx.sets || pastEx.sets.length === 0) return false;
    return pastEx.sets.every(s => s.completed && parseFloat(s.weight) > 0);
  };
  const applyProgressiveOverload = (sessionExId) => {
    setSession(session.map(ex => {
      if (ex.id === sessionExId) {
        return { ...ex, sets: ex.sets.map(s => {
            return { ...s, weight: nextWeight(ruleOfEx(ex), s.weight) };
          }) };
      }
      return ex;
    }));
    showToast("🔥 점진적 과부하! 전 세트에 +2.5kg이 추가되었습니다.");
  };
  const openPhotoCard = (dateKey) => {
    const sessionData = safeWorkouts[dateKey] || session;
    let totalVol = 0;
    sessionData.forEach(ex => {
      if (ex.sets) ex.sets.forEach(s => {
        if (s.completed && s.reps) totalVol += setVolume(ex, s);
      });
    });
    setPhotoCardData({
      date: dateKey || currentDate,
      workoutCount: sessionData.length,
      totalVolume: totalVol,
      durationStr: `${Math.floor(workoutDurationSec / 60)}분`,
      exercises: sessionData.map(e => getExName(e)),
      // 종목별 세트 수 (완료한 세트, 하나도 없으면 적어 둔 세트). 같은 종목은 합친다
      items: Object.values(sessionData.reduce((acc, ex) => {
        const sets = ex.sets || [];
        const done = sets.filter(st => st.completed).length || sets.length;
        const name = String(getExName(ex));
        acc[name] = { name, sets: (acc[name]?.sets || 0) + done };
        return acc;
      }, {})).filter(it => it.sets > 0),
    });
    setIsPhotoCardModalOpen(true);
  };
  const getExerciseLogsHistory = (exerciseId) => {
    const history = [];
    if (!activeUser || !safeWorkouts) return history;
    Object.keys(safeWorkouts).sort((a,b) => new Date(b) - new Date(a)).forEach(date => {
      const sess = safeWorkouts[date];
      if (!Array.isArray(sess)) return;
      const found = sess.find(e => getExId(e) === exerciseId);
      if (found && found.sets) history.push({ date, sets: found.sets });
    });
    return history;
  };
  const getAnalysisWeekInfo = (dateObj) => {
    const d = new Date(dateObj);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);
    const firstDayOfMonth = new Date(monday.getFullYear(), monday.getMonth(), 1);
    const weekNum = Math.ceil((monday.getDate() + firstDayOfMonth.getDay() - 1) / 7);
    return {
      title: `${monday.getMonth() + 1}월 ${weekNum === 0 ? 1 : weekNum}주차`,
      subtitle: `${monday.getMonth() + 1}월 ${monday.getDate()}일(월) ~ ${sunday.getMonth() + 1}월 ${sunday.getDate()}일(일)`,
      monday: monday
    };
  };
  const getWeeklyVolumeData = (mondayDate) => {
    const volumes = [0,0,0,0,0,0,0];
    const dayDates = [];
    let total = 0; let prevTotal = 0;
    const muscleShare = { '가슴': 0, '등': 0, '하체': 0, '어깨': 0, '팔': 0, '복근': 0 };
    if(!activeUser || !safeWorkouts) return { volumes, total, prevTotal, maxVolume: 100, dayDates, muscleShare };
    for(let i=0; i<7; i++) {
       const curr = new Date(mondayDate);
       curr.setDate(curr.getDate() + i);
       dayDates.push(new Date(curr));
       const sessionData = safeWorkouts[formatDate(curr)];
       if(Array.isArray(sessionData)) {
          sessionData.forEach(ex => {
            if (!ex || !ex.sets) return;
            const targetGroup = getExTarget(ex).split('(')[0];
            ex.sets.forEach(set => {
               if(set.completed && set.reps) {
                  const v = setVolume(ex, set);
                  if (!isNaN(v)) { volumes[i] += v; total += v; if (muscleShare[targetGroup] !== undefined) muscleShare[targetGroup] += v; }
               }
            });
          });
       }
       const prev = new Date(curr); prev.setDate(prev.getDate() - 7);
       const prevSession = safeWorkouts[formatDate(prev)];
       if(Array.isArray(prevSession)) {
          prevSession.forEach(ex => {
            if (!ex || !ex.sets) return;
            ex.sets.forEach(set => {
               if(set.completed && set.reps) {
                 const v = setVolume(ex, set);
                 if (!isNaN(v)) prevTotal += v;
               }
            });
          });
       }
    }
    return { volumes, total, prevTotal, maxVolume: Math.max(...volumes, 100), dayDates, muscleShare };
  };
  // 주간 부하 리포트
  // - 부하 비율(ACWR): 이번 주 세트 수 ÷ 최근 4주(기록 있는 주) 평균. 0.8~1.3이 안전하게 성장하는 구간, 1.5 이상은 부상 위험이 커지는 급증 구간
  // - 부위별 주간 세트: 근비대 권장 범위 10~20세트 (워밍업 세트 제외)
  const LOAD_GROUPS = ['가슴', '등', '하체', '어깨', '팔', '복근'];
  const getWeeklyLoadReport = (mondayDate) => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const weekLoad = (startDate) => {
      let volume = 0, sets = 0, days = 0, rpeSum = 0, rpeCount = 0;
      const groupSets = Object.fromEntries(LOAD_GROUPS.map(g => [g, 0]));
      for (let i = 0; i < 7; i++) {
        const d = new Date(startDate); d.setDate(d.getDate() + i);
        const sessionData = safeWorkouts[formatDate(d)];
        let daySets = 0;
        if (Array.isArray(sessionData)) sessionData.forEach(ex => {
          const group = getExTarget(ex).split('(')[0];
          (ex.sets || []).forEach(s => {
            if (!s.completed) return;
            const v = setVolume(ex, s);
            if (!isNaN(v)) volume += v;
            if (s.type === 'W') return;
            daySets++;
            if (groupSets[group] !== undefined) groupSets[group]++;
            const r = parseFloat(s.rpe);
            if (!isNaN(r) && r > 0) { rpeSum += r; rpeCount++; }
          });
        });
        if (daySets > 0) days++;
        sets += daySets;
      }
      return { volume, sets, days, groupSets, avgRpe: rpeCount ? rpeSum / rpeCount : null, rpeCount };
    };

    const current = weekLoad(mondayDate);
    const history = [4, 3, 2, 1].map(w => { const d = new Date(mondayDate); d.setDate(d.getDate() - 7 * w); return { ...weekLoad(d), monday: d }; });
    const pastWithData = history.filter(h => h.sets > 0);
    const chronicSets = pastWithData.length ? pastWithData.reduce((a, h) => a + h.sets, 0) / pastWithData.length : 0;
    const acwr = pastWithData.length >= 2 && chronicSets > 0 ? current.sets / chronicSets : null;

    // 연속 운동일: 이번 주 마지막 날(현재 주라면 오늘)부터 거꾸로
    const sunday = new Date(mondayDate); sunday.setDate(sunday.getDate() + 6);
    const end = sunday < today ? sunday : today;
    const trained = (d) => Array.isArray(safeWorkouts[formatDate(d)]) && safeWorkouts[formatDate(d)].length > 0;
    const cursor = new Date(end);
    if (!trained(cursor)) cursor.setDate(cursor.getDate() - 1);
    let streak = 0;
    while (trained(cursor) && streak < 30) { streak++; cursor.setDate(cursor.getDate() - 1); }

    const groupStatus = LOAD_GROUPS.map(g => {
      const n = current.groupSets[g];
      const status = n === 0 ? 'none' : n < 10 ? 'low' : n <= 20 ? 'good' : 'high';
      return { group: g, sets: n, status };
    });

    // 종합 상태
    let level = 'good';
    if (current.sets === 0) level = 'empty';
    else if ((acwr !== null && acwr > 1.5) || groupStatus.some(gs => gs.sets > 25) || streak >= 5) level = 'danger';
    else if ((acwr !== null && acwr > 1.3) || (current.avgRpe !== null && current.avgRpe >= 9) || groupStatus.some(gs => gs.status === 'high') || streak >= 4) level = 'caution';
    else if (acwr !== null && acwr < 0.8) level = 'low';
    if (level === 'good' && acwr === null) level = 'collecting';

    // 코치 제안
    const advice = [];
    if (current.sets === 0) advice.push({ tone: 'info', text: '이 주에는 완료한 세트가 없습니다. 세트를 완료(체크)해야 분석에 반영됩니다.' });
    if (current.sets > 0 && acwr === null) advice.push({ tone: 'info', text: '2주 이상 기록이 쌓이면 평소 대비 부하가 급하게 늘었는지 알려 드릴게요.' });
    if (acwr !== null && acwr > 1.5) advice.push({ tone: 'danger', text: `이번 주 세트 수가 최근 평균의 ${acwr.toFixed(1)}배로 급증했습니다. 부상 위험이 커지는 구간이니 다음 2~3회는 세트나 무게를 20~30% 줄이세요.` });
    else if (acwr !== null && acwr > 1.3) advice.push({ tone: 'caution', text: `평소보다 ${Math.round((acwr - 1) * 100)}% 많이 했습니다. 이번 주는 이 정도에서 유지하고 더 늘리지 마세요.` });
    else if (acwr !== null && acwr >= 0.8) advice.push({ tone: 'good', text: '평소 대비 훈련량이 안전한 범위에서 늘고 있습니다. 다음 주에 세트를 5~10% 늘려도 좋습니다.' });
    else if (acwr !== null) advice.push({ tone: 'info', text: '평소보다 훈련량이 적습니다. 회복 주간이 아니라면 세트를 조금 늘려 보세요.' });
    const high = groupStatus.filter(gs => gs.status === 'high');
    if (high.length) advice.push({ tone: 'caution', text: `${high.map(gs => `${gs.group}(${gs.sets}세트)`).join(', ')}는 주 20세트를 넘었습니다. 회복이 더딜 수 있으니 다음 주엔 줄여 보세요.` });
    const low = groupStatus.filter(gs => ['가슴', '등', '하체', '어깨'].includes(gs.group) && gs.status !== 'good' && gs.status !== 'high');
    // 마지막 글자에 받침이 있으면 '은', 없으면 '는'
    const topic = (word) => { const c = word.charCodeAt(word.length - 1) - 0xac00; return c >= 0 && c <= 11171 && c % 28 !== 0 ? '은' : '는'; };
    const lowNames = low.map(gs => gs.group).join(', ');
    if (current.sets > 0 && low.length) advice.push({ tone: 'info', text: `${lowNames}${topic(lowNames)} 이번 주 10세트 미만입니다. 근육을 키우려면 부위당 주 10세트 이상을 목표로 하세요.` });
    if (current.avgRpe !== null && current.avgRpe >= 9) advice.push({ tone: 'caution', text: `평균 RPE ${current.avgRpe.toFixed(1)}로 한계에 가까운 세트가 많습니다. 대부분의 세트는 1~2회 여유(RPE 7~8)를 남기면 회복이 빨라집니다.` });
    if (current.sets > 0 && current.rpeCount === 0) advice.push({ tone: 'info', text: '세트에 RPE(체감 강도 1~10)를 적으면 강도까지 함께 분석해 드려요.' });
    if (streak >= 4) advice.push({ tone: streak >= 5 ? 'danger' : 'caution', text: `${streak}일 연속 운동 중입니다. 내일은 쉬거나 가벼운 유산소만 하세요.` });

    return { current, history, chronicSets, acwr, streak, groupStatus, level, advice, isCurrentWeek: mondayDate <= today && today <= sunday };
  };
  // AI 코치 1RM 계산기용: 완료한 세트 중 추정 1RM이 가장 높은 세트 (12회 이하만)
  const getBestLifts = () => {
    const best = {};
    Object.values(safeWorkouts).forEach(session => {
      if (!Array.isArray(session)) return;
      session.forEach(ex => {
        const id = getExId(ex);
        if (!['bp', 'sq', 'dl'].includes(id)) return;
        (ex.sets || []).forEach(st => {
          const w = parseFloat(st.weight), r = parseInt(st.reps, 10);
          if (!st.completed || st.type === 'W' || !(w > 0) || !(r > 0) || r > 12) return;
          const e1rm = r === 1 ? w : w * (1 + r / 30);
          if (!best[id] || e1rm > best[id].e1rm) best[id] = { weight: w, reps: r, e1rm };
        });
      });
    });
    return best;
  };
  // 부위별 회복도: 운동이 끝난 시각과 그 운동의 세트 수·무게 강도·RPE로 계산 (recovery.js)
  const getMuscleRecoveryStatus = () => computeRecovery({
    workouts: safeWorkouts,
    workoutTimes: activeUser?.workoutTimes || {},
    now: new Date(),
    idOf: (ex) => String(getExId(ex)),
    musclesOf: (ex) => getExerciseMuscles(EXERCISE_OPTIONS.find(e => e.id === String(getExId(ex))) || ex.exercise || ex),
    bestOf: (id) => getTop1RM(id),
  });
  const getTop1RM = (exerciseId) => {
    let max1RM = 0;
    if(!activeUser || !safeWorkouts) return 0;
    Object.values(safeWorkouts).forEach(sessionData => {
       if(!Array.isArray(sessionData)) return;
       sessionData.forEach(ex => {
         if (getExId(ex) === exerciseId && ex.sets) {
           ex.sets.forEach(set => {
              if(set.completed && set.weight && set.reps && set.type === '-') {
                 const rm = calculate1RM(set.weight, set.reps);
                 if(rm > max1RM) max1RM = rm;
              }
           });
         }
       });
    });
    return max1RM;
  };
  const getEffective1RM = (exerciseId) => {
    const recordedRM = getTop1RM(exerciseId);
    const manualRM = activeUser?.manual1RM?.[exerciseId] || 0;
    return Math.max(recordedRM, parseInt(manualRM, 10) || 0);
  };
  const getTotalLift3 = () => getEffective1RM('sq') + getEffective1RM('bp') + getEffective1RM('dl');
  // 퀘스트·업적 보상: 받은 항목과 누적 XP를 사용자 기록에 저장
  const claimQuestRewards = (items) => {
    if (!activeUser || !items.length) return;
    setCurrentUser(prev => {
      const qs = prev.questState || { xp: 0, claimed: {} };
      const fresh = items.filter(it => !qs.claimed?.[it.key]);
      if (!fresh.length) return prev;
      const claimed = { ...(qs.claimed || {}) };
      fresh.forEach(it => { claimed[it.key] = Date.now(); });
      return { ...prev, questState: { ...qs, xp: (qs.xp || 0) + fresh.reduce((a, it) => a + it.xp, 0), claimed } };
    });
    showToast(items.length === 1 ? `🎁 ${items[0].label} 보상 +${items[0].xp} XP` : `🎁 보상 ${items.length}개 +${items.reduce((a, it) => a + it.xp, 0)} XP`);
  };
  // 100레벨에서 각성: 레벨은 1부터 다시, 각성 횟수 +1, 넘친 XP는 이어진다 (업적·기록은 그대로)
  const awakenLevel = () => {
    setCurrentUser(prev => {
      const qs = prev.questState || { xp: 0, claimed: {} };
      if (!levelInfo(qs.xp || 0, qs.awakenBase || 0).max) return prev;
      return { ...prev, questState: { ...qs, awaken: (qs.awaken || 0) + 1, awakenBase: (qs.awakenBase || 0) + xpForLevel(MAX_LEVEL), awakenedAt: [...(qs.awakenedAt || []), new Date().toISOString()] } };
    });
    showToast(`⚡ 각성 ${((activeUser?.questState?.awaken) || 0) + 1}회! 새로운 여정이 시작됩니다.`);
  };
  // 3대 합계 기준 등급 (업적 '3대 중량 마스터' 구간과 동일)
  const getUserLevel = () => {
    const total = getTotalLift3();
    if (total >= 500) return '고수';
    if (total >= 400) return '상급';
    if (total >= 300) return '중급';
    if (total >= 200) return '초급';
    return '입문';
  };
  const getLiftPercentile = (liftType, weight, gender) => {
    if (weight <= 0) return { tier: '-', label: '기록 없음', color: 'text-neutral-400 bg-neutral-100 border-neutral-200' };
    const thresholds = gender === 'female' ? { sq: [100, 80, 60, 40], bp: [60, 45, 35, 20], dl: [110, 90, 70, 50] }
      : { sq: [180, 140, 100, 70], bp: [120, 100, 80, 60], dl: [200, 160, 120, 80] };
    const t = thresholds[liftType];
    if (weight >= t[0]) return { tier: 'SS급', label: '상위 1%', color: 'text-rose-500 bg-rose-50 border-rose-200' };
    if (weight >= t[1]) return { tier: 'S급', label: '상위 10%', color: 'text-purple-600 bg-purple-50 border-purple-200' };
    if (weight >= t[2]) return { tier: 'A급', label: '상위 30%', color: 'text-amber-600 bg-amber-50 border-amber-200' };
    if (weight >= t[3]) return { tier: 'B급', label: '상위 60%', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
    return { tier: 'C급', label: '상위 90%', color: 'text-slate-600 bg-slate-50 border-slate-200' };
  };
  const saveManualRm = () => {
    if (!activeUser) return;
    setCurrentUser(prev => ({ ...prev, manual1RM: { ...manualRmInputs } }));
    setIsManualRmModalOpen(false);
    showToast("수동 1RM 기록이 성공적으로 저장되었습니다!");
  };
  const addDietMeal = () => {
    const newMeals = [...todayDiet.meals];
    const nextNum = newMeals.length + 1;
    newMeals.push({ id: `m${Date.now()}`, name: `${nextNum}끼`, items: [] });
    setCurrentUser(prev => ({ ...prev, diet: { ...(prev.diet || {}), [currentDate]: { meals: newMeals } } }));
    showToast(`${nextNum}끼 식단이 추가되었습니다.`);
  };
  const removeDietMeal = (mealId) => {
    const newMeals = todayDiet.meals.filter(meal => meal.id !== mealId);
    setCurrentUser(prev => ({ ...prev, diet: { ...(prev.diet || {}), [currentDate]: { meals: newMeals } } }));
    showToast("끼니가 삭제되었습니다.");
  };
  const removeFoodFromMeal = (mealId, itemId) => {
    const newDietMeals = todayDiet.meals.map(meal => {
      if(meal.id === mealId) return { ...meal, items: meal.items.filter(it => it.id !== itemId) };
      return meal;
    });
    setCurrentUser(prev => ({ ...prev, diet: { ...(prev.diet || {}), [currentDate]: { meals: newDietMeals } } }));
    showToast("식단에서 음식을 삭제했습니다.");
  };
  const addFoodToMeal = () => {
    if(!selectedFood || !selectedMealId) return;
    const factor = foodWeight / (selectedFood.per || 100);
    const foodItem = {
      id: Date.now().toString(), foodId: String(selectedFood.id), name: String(selectedFood.name), icon: String(selectedFood.icon),
      weight: Number(foodWeight), unit: String(selectedFood.unit || 'g'), calories: Math.round(selectedFood.calories * factor),
      protein: Number((selectedFood.protein * factor).toFixed(1)), carbs: Number((selectedFood.carbs * factor).toFixed(1)), fat: Number((selectedFood.fat * factor).toFixed(1)),
    };
    const newDietMeals = todayDiet.meals.map(meal => {
      if(meal.id === selectedMealId) return { ...meal, items: [...meal.items, foodItem] };
      return meal;
    });
    setCurrentUser(prev => ({ ...prev, diet: { ...(prev.diet || {}), [currentDate]: { meals: newDietMeals } } }));
    setIsAddFoodModalOpen(false);
    setSelectedFood(null);
    setFoodWeight(100);
    showToast(`${selectedFood.name} ${foodWeight}${selectedFood.unit || 'g'}을 식단에 추가했어요.`);
  };
  // AI 코치가 짠 하루 식단 예시를 보고 있는 날짜의 식단에 담는다 (끼니 순서대로, 모자라면 끼니를 늘린다)
  const applyMealPlan = (plan) => {
    const stamp = Date.now();
    setCurrentUser(prev => {
      const meals = ((prev.diet || {})[currentDate]?.meals || defaultMeals).map(m => ({ ...m, items: [...m.items] }));
      plan.forEach((pm, i) => {
        if (!meals[i]) meals.push({ id: `m${stamp}${i}`, name: `${i + 1}끼`, items: [] });
        pm.items.forEach((it, k) => {
          const f = it.food, factor = it.g / (f.per || 100);
          meals[i].items.push({
            id: `${stamp}${i}${k}`, foodId: String(f.id), name: String(f.name), icon: String(f.icon), weight: Number(it.g), unit: String(f.unit || 'g'),
            calories: Math.round(f.calories * factor), protein: Number((f.protein * factor).toFixed(1)), carbs: Number((f.carbs * factor).toFixed(1)), fat: Number((f.fat * factor).toFixed(1)),
          });
        });
      });
      return { ...prev, diet: { ...(prev.diet || {}), [currentDate]: { meals } } };
    });
    showToast('식단 예시를 식단 플래너에 담았어요');
  };
  const calculateTotalMacros = (meals) => {
    let cal=0, p=0, c=0, f=0;
    meals.forEach(m => m.items.forEach(item => { cal += item.calories; p += item.protein; c += item.carbs; f += item.fat; }));
    return { cal, p, c, f };
  };
  const todayMacros = calculateTotalMacros(todayDiet.meals);
  const refreshFriends = async (uid = cloudUser?.id) => {
    if (!uid) return;
    const st = cloud.summarizeFriends(await cloud.fetchFriendRequests(uid), uid);
    setFriendState(st);
    const ids = [...new Set([...st.friends, ...st.sent, ...st.incoming.map(r => r.from)])];
    const profs = await cloud.fetchProfiles(ids);
    setExtraProfiles(prev => ({ ...prev, ...Object.fromEntries(profs.map(p => [p.id, cloud.toRankUser(p)])) }));
  };
  const sendFriendRequest = async (targetId) => {
    if (!cloudUser) { showToast('친구 추가는 회원가입 후 할 수 있어요.'); return; }
    try {
      const r = await cloud.requestFriend(cloudUser.id, targetId);
      showToast(r === 'accepted' ? '🤝 서로 친구가 되었어요!' : '친구 요청을 보냈어요! 상대가 수락하면 친구가 돼요.');
      await refreshFriends();
    } catch (e) { showToast('친구 요청을 보내지 못했어요. 잠시 후 다시 시도해 주세요.'); }
  };
  const acceptFriend = async (requestId) => {
    try { await cloud.acceptFriendRequest(requestId); showToast("친구 수락이 완료되었습니다!"); await refreshFriends(); }
    catch (e) { showToast('수락하지 못했어요. 다시 시도해 주세요.'); }
  };
  const declineFriend = async (requestId) => {
    try { await cloud.deleteFriendRequest(requestId); await refreshFriends(); }
    catch (e) { showToast('거절하지 못했어요. 다시 시도해 주세요.'); }
  };
  const removeFriendship = async (otherId) => {
    try { await cloud.removeFriend(cloudUser.id, otherId); showToast('친구 목록에서 삭제했어요.'); await refreshFriends(); }
    catch (e) { showToast('삭제하지 못했어요. 다시 시도해 주세요.'); }
  };
  const inviteFriends = async () => {
    const text = 'GYM SPIRIT에서 같이 운동 기록하고 랭킹 겨뤄요! 💪';
    if (navigator.share) {
      try { await navigator.share({ title: 'GYM SPIRIT', text, url: cloud.SITE_URL }); } catch (e) {}
      return;
    }
    try { await navigator.clipboard.writeText(`${text} ${cloud.SITE_URL}`); showToast('초대 링크를 복사했어요. 친구에게 붙여넣어 보내 주세요!'); }
    catch (e) { showToast(`초대 링크: ${cloud.SITE_URL}`); }
  };
  const renderAccessoryCategory = (title, typeKey, colorKey, options, colorsArray = ACC_COLORS, defaultValue = 'none', alwaysShowColors = false) => {
    const currentVal = currentUser?.profile?.[typeKey] || defaultValue;
    const currentCol = currentUser?.profile?.[colorKey] || colorsArray[0];
    return (
      <div className="mb-6">
        <span className="text-xs font-black text-neutral-500 mb-3 block tracking-widest uppercase">{title}</span>
        <div className="flex flex-wrap gap-2">
          {options.map(opt => (
            <button key={opt.value} onClick={() => updateProfile({ [typeKey]: opt.value })} className={`py-2.5 px-4 rounded-xl font-black text-sm transition-all border-2 flex-grow ${currentVal === opt.value ? 'bg-[#4768ff] text-white border-[#4768ff] shadow-md' : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:bg-neutral-800'}`}>{opt.label}</button>
          ))}
        </div>
        {(currentVal !== 'none' || alwaysShowColors) && colorKey && (
          <div className="mt-3 bg-neutral-900 p-3 rounded-[16px] border border-neutral-800 flex gap-3 overflow-x-auto hide-scrollbar animate-fade-in shadow-inner">
            {colorsArray.map(color => (
              <button key={color} onClick={() => updateProfile({ [colorKey]: color })} style={{ backgroundColor: color }} className={`w-9 h-9 flex-shrink-0 rounded-full border-2 ${currentCol === color ? 'border-white scale-110 shadow-md ring-2 ring-white/20' : 'border-neutral-700 opacity-50 hover:opacity-100'} transition-all`} />
            ))}
          </div>
        )}
      </div>
    );
  };
  // 랭킹에 공개되는 내 정보: 닉네임, 아바타, 이번 주 볼륨, 3대, 최애 종목, 최근 운동
  const buildPublicProfile = () => {
    const vol = getWeeklyVolumeData(getAnalysisWeekInfo(new Date()).monday).total;
    const count = {};
    pastWorkoutDates.slice(0, 20).forEach(d => (safeWorkouts[d] || []).forEach(ex => { const n = getExName(ex); count[n] = (count[n] || 0) + 1; }));
    const fav = Object.entries(count).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
    // 최근 루틴은 볼륨과 같은 기준(완료 체크한 세트)으로 보여준다
    const doneOf = (d) => (safeWorkouts[d] || []).map(ex => ({ ex, sets: (ex.sets || []).filter(st => st.completed) })).filter(x => x.sets.length);
    const lastDate = pastWorkoutDates.find(d => doneOf(d).length > 0);
    const last_routine = lastDate ? {
      date: lastDate,
      items: doneOf(lastDate).slice(0, 12).map(({ ex, sets }) => ({
        id: String(getExId(ex)), name: getExName(ex), target: getExTarget(ex), tool: String(ex.exercise?.tool || ex.tool || ''),
        sets: sets.slice(0, 10).map(st => ({ weight: String(st.weight || ''), reps: String(st.reps || '') })),
      })),
    } : null;
    return {
      nickname: String(currentUser?.profile?.nickname || '짐스피릿 유저').slice(0, 20),
      avatar: currentUser?.profile || {},
      week_start: cloud.mondayKey(), weekly_volume: Math.round(vol || 0), lift3: getTotalLift3() || 0, fav, last_routine,
      weekly_cardio: Array.from({ length: 7 }, (_, i) => { const x = new Date(getAnalysisWeekInfo(new Date()).monday); x.setDate(x.getDate() + i); return cardioMinOn(formatDate(x)); }).reduce((a, b) => a + b, 0),
    };
  };
  // 앱을 열면 로그인 상태를 확인하고, 회원이면 클라우드 기록으로 바로 들어간다
  useEffect(() => {
    let alive = true;
    cloud.supabase.auth.getSession()
      .then(async ({ data }) => { if (alive && data.session?.user) await enterCloud(data.session.user); })
      .catch(() => {})
      .finally(() => { if (alive) setAuthChecking(false); });
    const { data: sub } = cloud.supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') { setRecoveryMode(true); setPassword(''); setCurrentScreen('auth'); }
    });
    return () => { alive = false; sub.subscription.unsubscribe(); };
  }, []);
  // 회원이면 기록이 바뀔 때마다 잠시 뒤 클라우드에 저장 (개인 기록 + 랭킹용 공개 프로필)
  useEffect(() => {
    if (!cloudReady || !cloudUser || currentUser?.cloudId !== cloudUser.id) return undefined;
    const uid = cloudUser.id;
    const data = Object.fromEntries(Object.entries(currentUser).filter(([k]) => !['email', 'password', 'cloudId', 'friends', 'sentRequests', 'pendingRequests'].includes(k)));
    const pub = buildPublicProfile();
    const save = () => Promise.all([cloud.saveUserData(uid, data), cloud.savePublicProfile(uid, pub)]);
    pendingCloudSave.current = save;
    clearTimeout(cloudSaveTimer.current);
    cloudSaveTimer.current = setTimeout(() => {
      pendingCloudSave.current = null;
      save().catch(() => showToast('클라우드 저장에 실패했어요. 인터넷 연결을 확인해 주세요.'));
    }, 1200);
    return undefined;
  }, [currentUser, cloudReady, cloudUser]);
  // 화면을 떠나거나 앱을 내릴 때 아직 저장 안 된 기록을 바로 보낸다
  useEffect(() => {
    const flush = () => {
      if (document.visibilityState !== 'hidden' || !pendingCloudSave.current) return;
      clearTimeout(cloudSaveTimer.current);
      const save = pendingCloudSave.current; pendingCloudSave.current = null;
      save().catch(() => {});
    };
    document.addEventListener('visibilitychange', flush);
    return () => document.removeEventListener('visibilitychange', flush);
  }, []);
  // 친구 요청: 로그인하면 불러오고, 새 요청·수락은 실시간으로 받는다
  useEffect(() => {
    if (!cloudUser) { setFriendState({ friends: [], sent: [], incoming: [] }); return undefined; }
    const uid = cloudUser.id;
    refreshFriends(uid).catch(() => {});
    return cloud.subscribeFriendRequests(uid, (payload, side) => {
      if (payload.eventType === 'INSERT' && side === 'to') showToast('💌 새 친구 요청이 도착했어요!');
      if (payload.eventType === 'UPDATE' && side === 'from' && payload.new?.status === 'accepted') showToast('🤝 친구 요청이 수락됐어요!');
      refreshFriends(uid).catch(() => {});
    });
  }, [cloudUser]);
  // 개발 서버에서 주소 끝에 ?mockguild 를 붙이면 로그인 없이 길드·랭킹 화면을 가짜 데이터로 확인할 수 있다 (배포본에는 포함되지 않음)
  useEffect(() => {
    if (import.meta.env.DEV && new URLSearchParams(window.location.search).has('mockguild')) import('./guildMock.js').then(m => setDevMock(m.createGuildMock()));
  }, []);
  const rankingUser = devMock ? { id: devMock.meId } : cloudUser;
  const guildApiImpl = devMock ? devMock.guildApi : cloud.guildApi;

  // 길드 초대 링크(?guild=코드)로 들어오면 코드를 기억했다가, 앱에 들어온 뒤 가입할지 묻는다 (회원가입을 거쳐도 유지)
  const [pendingGuildCode, setPendingGuildCode] = useState(() => {
    try {
      const fromUrl = new URLSearchParams(window.location.search).get('guild');
      if (fromUrl) {
        localStorage.setItem('gymspirit_pending_guild', fromUrl);
        const u = new URL(window.location.href); u.searchParams.delete('guild'); window.history.replaceState(null, '', u.toString());
      }
      return String(localStorage.getItem('gymspirit_pending_guild') || '').toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 6);
    } catch (e) { return ''; }
  });
  const [rankingScope, setRankingScope] = useState('global'); // 랭킹 탭을 열 때 처음 보여줄 화면
  const clearPendingGuild = () => { setPendingGuildCode(''); try { localStorage.removeItem('gymspirit_pending_guild'); } catch (e) {} };
  const joinPendingGuild = async () => {
    const code = pendingGuildCode;
    clearPendingGuild();
    try {
      await guildApiImpl.joinByCode(code);
      showToast('🎉 초대받은 길드에 가입했어요!');
      setRankingScope('guild'); setActiveTab('ranking'); reloadGuild();
    } catch (e) { showToast(guildErrorText(e)); }
  };

  // 운영자: 운영자 명단과 전체 공지를 불러온다 (운영자 기능은 DB 함수가 다시 확인한다)
  const [adminIdList, setAdminIdList] = useState(null); // null = 아직 못 불러옴
  const [appNotice, setAppNotice] = useState(null);
  const [isAdminConsoleOpen, setIsAdminConsoleOpen] = useState(false);
  const refreshNotice = () => (devMock ? devMock.notice() : cloud.fetchActiveNotice()).then(setAppNotice).catch(() => {});
  useEffect(() => {
    let alive = true; // 먼저 보낸 요청이 늦게 도착해 덮어쓰지 않게
    (devMock ? devMock.adminIds() : cloud.fetchAdminIds()).then(ids => { if (!alive) return; setAdminIds(ids); setAdminIdList(ids); }).catch(() => {});
    refreshNotice();
    return () => { alive = false; };
  }, [devMock]);
  const amAdmin = !!rankingUser && !!adminIdList?.includes(rankingUser.id);
  const adminMode = amAdmin && !!currentUser?.adminMode;
  const adminApiImpl = devMock ? devMock.adminApi : cloud.adminApi;
  // 운영자 모드: 켜면 운영자 칭호와 전용 흰 정장·모자, 끄면 일반 유저처럼 보인다
  const setAdminMode = (on) => {
    setCurrentUser(prev => ({ ...prev, adminMode: on, profile: { ...(prev.profile || {}), gm: on } }));
    showToast(on ? '👑 운영자 모드를 켰어요' : '일반 유저 모드로 바꿨어요');
  };
  // 운영자가 아닌데 운영자 의상이 남아 있으면 벗긴다 (명단을 제대로 불러온 뒤에만)
  useEffect(() => {
    if (adminIdList && rankingUser && !amAdmin && currentUser?.profile?.gm) setCurrentUser(prev => ({ ...prev, adminMode: false, profile: { ...(prev.profile || {}), gm: false } }));
  }, [adminIdList, rankingUser, amAdmin]);
  const reloadGuild = async () => {
    if (!rankingUser) { setGuildData(null); return; }
    setGuildLoading(true);
    try {
      const [mine, global] = await Promise.all([guildApiImpl.my(), devMock ? devMock.globalRanking() : cloud.fetchGlobalRanking()]);
      setGuildData(mine); setGlobalEntries(global || []);
    } catch (e) { setGuildData(null); }
    finally { setGuildLoading(false); }
  };
  // 랭킹 탭을 열 때마다 전체 랭킹·친구 랭킹·내 길드·이번 주 응원 수를 불러온다
  useEffect(() => {
    if (activeTab !== 'ranking') return undefined;
    let alive = true;
    setRankLoading(true);
    const src = devMock
      ? [devMock.globalRanking(), devMock.friendRanking(), Promise.resolve({}), devMock.guildApi.my()]
      : [cloud.fetchGlobalRanking(), cloudUser ? cloud.fetchFriendRanking() : [], cloud.fetchCheerCounts(), cloudUser ? cloud.guildApi.my() : null];
    Promise.allSettled(src).then(([g, f, c, m]) => {
      if (!alive) return;
      if (g.status === 'fulfilled') setGlobalEntries(g.value || []);
      if (f.status === 'fulfilled') setFriendRank((f.value || []).map(cloud.friendRowToRankUser));
      if (c.status === 'fulfilled') setCheersData(c.value || {});
      if (m.status === 'fulfilled') setGuildData(m.value);
      if ([g, f, m].some(r => r.status === 'rejected')) showToast('랭킹을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.');
    }).finally(() => { if (alive) setRankLoading(false); });
    return () => { alive = false; };
  }, [activeTab, cloudUser, devMock]);
  // 오늘·어제 운동을 저장하면 길드 경험치로 반영 (길드가 없으면 DB가 무시한다)
  useEffect(() => {
    if (!cloudReady || !cloudUser || currentUser?.cloudId !== cloudUser.id) return undefined;
    const t = setTimeout(() => {
      [0, 1].forEach(back => {
        const d = new Date(); d.setDate(d.getDate() - back);
        const key = formatDate(d);
        // 근력 볼륨 + 유산소 1분당 100 (보스 피해·출석으로 함께 들어간다)
        const vol = Math.round((safeWorkouts[key] || []).reduce((sum, ex) => sum + (ex.sets || []).reduce((a, st) => a + (st.completed && st.reps ? setVolume(ex, st) : 0), 0), 0)) + cardioMinOn(key) * CARDIO_DAMAGE_PER_MIN;
        if (!vol || lastContrib.current[key] === vol) return;
        lastContrib.current[key] = vol;
        cloud.guildApi.contribute(key, vol).catch(() => { delete lastContrib.current[key]; });
      });
    }, 2500);
    return () => clearTimeout(t);
  }, [currentUser, cloudReady, cloudUser]);
  const profilesById = { ...extraProfiles, ...Object.fromEntries(friendRank.map(u => [u.id, u])) };
  // 운동 기록 중에는 화면이 꺼지지 않게
  useWakeLock(currentScreen === 'workout');

  return {
    usersDB,
    setUsersDB,
    currentScreen,
    setCurrentScreen,
    currentUser,
    setCurrentUser,
    activeTab,
    setActiveTab,
    currentDate,
    setCurrentDate,
    calendarYear,
    setCalendarYear,
    calendarMonth,
    setCalendarMonth,
    session,
    setSession,
    workoutDurationSec,
    setWorkoutDurationSec,
    sessionTimerRef,
    isTimerActive,
    setIsTimerActive,
    timeLeft,
    setTimeLeft,
    maxTime,
    setMaxTime,
    alarmRinging,
    setAlarmRinging,
    workoutMinimized,
    setWorkoutMinimized,
    pendingWorkoutStart,
    setPendingWorkoutStart,
    overtimeSec,
    setOvertimeSec,
    isAlarmSettingsOpen,
    setIsAlarmSettingsOpen,
    alarmStopRef,
    timerRef,
    isFullCalendarOpen,
    setIsFullCalendarOpen,
    exerciseOptionsModal,
    setExerciseOptionsModal,
    exerciseHistoryModal,
    setExerciseHistoryModal,
    plateVisualizerModal,
    setPlateVisualizerModal,
    rankingProfileModal,
    setRankingProfileModal,
    isRoutineLoaderOpen,
    setIsRoutineLoaderOpen,
    selectedPastDate,
    setSelectedPastDate,
    isNotiOpen,
    setIsNotiOpen,
    showCelebration,
    setShowCelebration,
    isAddExerciseModalOpen,
    setIsAddExerciseModalOpen,
    exSearchQuery,
    setExSearchQuery,
    exCategoryFilter,
    setExCategoryFilter,
    isAvatarStudioOpen,
    setIsAvatarStudioOpen,
    avatarPose,
    setAvatarPose,
    toastMessage,
    setToastMessage,
    isBodyStatsModalOpen,
    setIsBodyStatsModalOpen,
    tempStats,
    setTempStats,
    isOneRmCalculatorOpen,
    setIsOneRmCalculatorOpen,
    calcInputs,
    setCalcInputs,
    isManualRmModalOpen,
    setIsManualRmModalOpen,
    manualRmInputs,
    setManualRmInputs,
    selectedProgramModal,
    setSelectedProgramModal,
    swapTargetExerciseId,
    setSwapTargetExerciseId,
    selectedDayDetailModal,
    setSelectedDayDetailModal,
    programFilter,
    setProgramFilter,
    muscleConfirmModal,
    setMuscleConfirmModal,
    muscleSubPicker,
    setMuscleSubPicker,
    isExitConfirmOpen,
    setIsExitConfirmOpen,
    selectedLegendModal,
    setSelectedLegendModal,
    substituteModalEx,
    setSubstituteModalEx,
    guideExerciseId,
    setGuideExerciseId,
    isPhotoCardModalOpen,
    setIsPhotoCardModalOpen,
    photoCardTheme,
    setPhotoCardTheme,
    photoCardData,
    setPhotoCardData,
    isAiCoachOpen,
    setIsAiCoachOpen,
    activeRankingTab,
    setActiveRankingTab,
    rankingSortBy,
    setRankingSortBy,
    isFriendSearchModalOpen,
    setIsFriendSearchModalOpen,
    friendSearchQuery,
    setFriendSearchQuery,
    cheersData,
    setCheersData,
    cloudUser,
    setCloudUser,
    cloudReady,
    setCloudReady,
    authChecking,
    setAuthChecking,
    authBusy,
    setAuthBusy,
    authNotice,
    setAuthNotice,
    signupNickname,
    setSignupNickname,
    recoveryMode,
    setRecoveryMode,
    friendState,
    setFriendState,
    friendRank,
    setFriendRank,
    globalEntries,
    setGlobalEntries,
    guildData,
    setGuildData,
    guildLoading,
    setGuildLoading,
    devMock,
    pendingGuildCode,
    clearPendingGuild,
    joinPendingGuild,
    rankingScope,
    setRankingScope,
    adminIdList,
    appNotice,
    refreshNotice,
    isAdminConsoleOpen,
    setIsAdminConsoleOpen,
    amAdmin,
    adminMode,
    adminApiImpl,
    setAdminMode,
    setDevMock,
    lastContrib,
    isInstallOpen,
    setIsInstallOpen,
    extraProfiles,
    setExtraProfiles,
    rankLoading,
    setRankLoading,
    editingNick,
    setEditingNick,
    cloudSaveTimer,
    pendingCloudSave,
    unreadCount,
    selectedFood,
    setSelectedFood,
    selectedMealId,
    setSelectedMealId,
    isAddFoodModalOpen,
    setIsAddFoodModalOpen,
    foodSearchQuery,
    setFoodSearchQuery,
    foodCategoryFilter,
    setFoodCategoryFilter,
    foodWeight,
    setFoodWeight,
    handleCheer,
    stealRoutine,
    email,
    setEmail,
    password,
    setPassword,
    isLoginMode,
    setIsLoginMode,
    authError,
    setAuthError,
    analysisDate,
    setAnalysisDate,
    setNowTick,
    overtimeOn,
    LegendArt,
    showToast,
    activeUser,
    timerSettings,
    updateTimerSettings,
    stopAlarm,
    previewAlarm,
    timerPagerRef,
    timerPage,
    onTimerPagerScroll,
    timerVisible,
    scrollTimerPage,
    startRest,
    bodyWeightKg,
    setVolume,
    safeWorkouts,
    pastWorkoutDates,
    getWorkoutStreak,
    safeCardio,
    cardioMinOn,
    safeDiet,
    defaultMeals,
    todayDiet,
    getWeekDays,
    weekDays,
    enterCloud,
    handleAuth,
    handlePasswordReset,
    goToSignup,
    handleGuestLogin,
    handleLogout,
    updateProfile,
    openBodyStatsModal,
    withBodyEntry,
    upsertBodyEntry,
    deleteBodyEntry,
    saveBodyGoal,
    saveBodyStats,
    triggerSaveWorkout,
    requestSaveWorkout,
    saveCheck,
    setSaveCheck,
    saveAllAsDone,
    saveTickedOnly,
    buildPublicProfile,
    minimizeWorkout,
    resumeWorkout,
    guardNewWorkout,
    discardAndStart,
    completedOnlySession,
    quitAndSaveDone,
    exitWorkout,
    finishCelebration,
    loadSpecificWorkout,
    loadProgramWorkout,
    loadLegendRoutine,
    handleMuscleClick,
    pickMuscleSub,
    getMuscleExercises,
    startMuscleRoutine,
    addExerciseFromModal,
    swapExercise,
    removeExercise,
    addSet,
    removeSet,
    cycleSetType,
    updateSet,
    exOneRM,
    suggestRpe,
    toggleSetComplete,
    adjustTimer,
    getPreviousRecord,
    getAlternativeExercises,
    checkOverloadRecommendation,
    applyProgressiveOverload,
    openPhotoCard,
    getExerciseLogsHistory,
    getAnalysisWeekInfo,
    getWeeklyVolumeData,
    LOAD_GROUPS,
    getWeeklyLoadReport,
    getBestLifts,
    getMuscleRecoveryStatus,
    getTop1RM,
    getEffective1RM,
    getTotalLift3,
    claimQuestRewards,
    awakenLevel,
    getUserLevel,
    getLiftPercentile,
    saveManualRm,
    addDietMeal,
    removeDietMeal,
    removeFoodFromMeal,
    addFoodToMeal,
    applyMealPlan,
    calculateTotalMacros,
    todayMacros,
    refreshFriends,
    sendFriendRequest,
    acceptFriend,
    declineFriend,
    removeFriendship,
    inviteFriends,
    renderAccessoryCategory,
    buildPublicProfile,
    rankingUser,
    guildApiImpl,
    reloadGuild,
    profilesById,
  };
}
