import React, { useState, useEffect, useLayoutEffect, useRef, useMemo } from 'react';
import {
  CalendarDays, ChevronLeft, ChevronRight, User, Plus, Check, Play,
  Pause, Save, LogOut, X, Dumbbell,
  Bell, Utensils, Zap, MoreVertical, Sparkles, BarChart2, LayoutGrid, Trophy,
  TrendingUp, TrendingDown, Flame, CheckCircle2, Crown, Medal,
  History, Heart, Info, Target, Activity, Search, Camera, Share2, Menu,
  Minus, Settings, PersonStanding, FlameKindling, PieChart, Users, Eye, RotateCw, Volume2, Trash2, Edit3, MessageSquare, Smile, Calculator, Clock, Star, BookOpen, Lightbulb, AlertTriangle
} from 'lucide-react';
import { PoseFigure } from './poseFigure.jsx';
import { PATTERNS } from './movementPatterns.jsx';
import { EXERCISE_GUIDES } from './exerciseGuides.js';
import { LegendCover } from './legendCovers.jsx';
import { DEFAULT_COVER_PHOTOS } from './coverPhotos.js';
import { AiCoach } from './aiCoach.jsx';
import { PosingGuideSection } from './PosingGuide.jsx';
import { QuestCenter } from './QuestCenter.jsx';
import { levelInfo, xpForLevel, MAX_LEVEL } from './questSystem.js';
import { BodyTransform } from './BodyTransform.jsx';
import { RankingTab } from './RankingTab.jsx';
import { StopwatchDial } from './StopwatchDial.jsx';
import { computeRecovery } from './recovery.js';
import { estimateFromLifts } from './strengthRatios.js';
import { weightRule, platesFor, setLoad, nextWeight, formatPlates, sideWeight } from './weightRules.js';
import { DEFAULT_TIMER_SETTINGS, ALARM_SOUNDS, REPEAT_OPTIONS, REST_OPTIONS, playAlarm, playTick, unlockAudio } from './restAlarm.js';
import { FriendCenter } from './FriendCenter.jsx';
import * as cloud from './cloud.js';
import { FullBodyAvatar, AVATAR_SKIN_TONES, AVATAR_EYE_COLORS, AVATAR_SHOE_COLORS } from './realAvatar.jsx';

const formatDate = (date) => {
  const d = new Date(date);
  const offset = d.getTimezoneOffset() * 60000;
  return (new Date(d.getTime() - offset)).toISOString().split('T')[0];
};

const getMonthDays = (year, month) => {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
  return days;
};

const calculate1RM = (weight, reps) => {
  const w = parseFloat(weight);
  const r = parseInt(reps, 10);
  if (!w || !r || r < 1) return 0;
  if (r === 1) return w;
  return Math.round(w * (36 / (37 - r)));
};

const EXERCISE_OPTIONS = [
  { id: 'sq', name: '바벨 스쿼트', target: '하체(전면)', tool: '바벨' },
  { id: 'fsq', name: '프론트 스쿼트', target: '하체(전면)', tool: '바벨' },
  { id: 'vsq', name: '브이스쿼트', target: '하체(전면)', tool: '머신' },
  { id: 'hack_sq', name: '핵 스쿼트', target: '하체(전면)', tool: '머신' },
  { id: 'smith_sq', name: '스미스머신 스쿼트', target: '하체(전면)', tool: '머신' },
  { id: 'lpd', name: '레그 프레스', target: '하체(전면)', tool: '머신' },
  { id: 's_lpd', name: '원레그 프레스', target: '하체(전체)', tool: '머신' },
  { id: 'le', name: '레그 익스텐션', target: '하체(전면)', tool: '머신' },
  { id: 'lc', name: '레그 컬', target: '하체(후면)', tool: '머신' },
  { id: 'rdl', name: '루마니안 데드리프트', target: '하체(후면)', tool: '바벨' },
  { id: 'stiff_dl', name: '스티프 레그 데드리프트', target: '하체(후면)', tool: '바벨' },
  { id: 'lunge', name: '덤벨 런지', target: '하체(전체)', tool: '덤벨' },
  { id: 'walk_lunge', name: '바벨 워킹 런지', target: '하체(전체)', tool: '바벨' },
  { id: 'bss', name: '불가리안 스플릿 스쿼트', target: '하체(둔근)', tool: '덤벨' },
  { id: 'ht', name: '힙 쓰러스트', target: '하체(둔근)', tool: '바벨' },
  { id: 'glute_kick', name: '글루트 킥백', target: '하체(둔근)', tool: '케이블' },
  { id: 'inth', name: '이너 타이 (어덕터)', target: '하체(내전근)', tool: '머신' },
  { id: 'outh', name: '아웃 타이 (앱덕터)', target: '하체(둔근)', tool: '머신' },
  { id: 'calf', name: '카프 레이즈', target: '하체(종아리)', tool: '머신' },
  { id: 'goblet', name: '고블렛 스쿼트', target: '하체(전면)', tool: '덤벨' },
  { id: 'kb_swing', name: '케틀벨 스윙', target: '하체(둔근/전신)', tool: '도구' },
  { id: 'pistol_sq', name: '피스톨 스쿼트', target: '하체(전면)', tool: '맨몸' },
  { id: 'sissy_sq', name: '씨씨 스쿼트', target: '하체(전면)', tool: '맨몸' },
  { id: 'step_up', name: '스텝업', target: '하체(둔근/전면)', tool: '덤벨' },
  { id: 'bp', name: '벤치프레스', target: '가슴(중부)', tool: '바벨' },
  { id: 'ip', name: '인클라인 벤치프레스', target: '가슴(상부)', tool: '바벨' },
  { id: 'dbp', name: '디클라인 벤치프레스', target: '가슴(하부)', tool: '바벨' },
  { id: 'sip', name: '스미스머신 인클라인 프레스', target: '가슴(상부)', tool: '머신' },
  { id: 'cpm', name: '체스트 프레스 머신', target: '가슴(중부)', tool: '머신' },
  { id: 'dp_chest', name: '덤벨 프레스', target: '가슴(중부)', tool: '덤벨' },
  { id: 'idp', name: '인클라인 덤벨 프레스', target: '가슴(상부)', tool: '덤벨' },
  { id: 'dfly', name: '덤벨 플라이', target: '가슴(전체)', tool: '덤벨' },
  { id: 'cf', name: '케이블 크로스 오버', target: '가슴(하부)', tool: '케이블' },
  { id: 'pdf', name: '펙 덱 플라이', target: '가슴(전체)', tool: '머신' },
  { id: 'db_pullover', name: '덤벨 풀오버', target: '가슴(전체/광배)', tool: '덤벨' },
  { id: 'cable_press', name: '케이블 체스트 프레스', target: '가슴(전체)', tool: '케이블' },
  { id: 'floor_press', name: '플로어 프레스', target: '가슴(중부)', tool: '바벨' },
  { id: 'hex_press', name: '헥스 프레스', target: '가슴(안쪽)', tool: '덤벨' },
  { id: 'cg_bench', name: '클로즈그립 벤치프레스', target: '가슴(삼두/안쪽)', tool: '바벨' },
  { id: 'pushup', name: '푸시업 (팔굽혀펴기)', target: '가슴(전체)', tool: '맨몸' },
  { id: 'dips', name: '딥스', target: '가슴(하부)', tool: '맨몸' },
  { id: 'dl', name: '컨벤셔널 데드리프트', target: '등(기립근)', tool: '바벨' },
  { id: 'rack_pull', name: '랙 풀', target: '등(기립근/상부)', tool: '바벨' },
  { id: 'pu', name: '풀업 (턱걸이)', target: '등(광배)', tool: '맨몸' },
  { id: 'astpu', name: '어시스트 풀업', target: '등(광배)', tool: '머신' },
  { id: 'cu', name: '친업', target: '등(광배)', tool: '맨몸' },
  { id: 'pd', name: '랫풀다운', target: '등(광배)', tool: '머신' },
  { id: 'cg_pd', name: '클로즈그립 랫풀다운', target: '등(광배 하부)', tool: '머신' },
  { id: 'br', name: '바벨 로우', target: '등(전체)', tool: '바벨' },
  { id: 'prow', name: '펜들레이 로우', target: '등(전체)', tool: '바벨' },
  { id: 'meadows_row', name: '메도우스 로우', target: '등(광배)', tool: '바벨' },
  { id: 'dr_back', name: '덤벨 로우', target: '등(광배)', tool: '덤벨' },
  { id: 'sr', name: '시티드 로우', target: '등(중하부승모)', tool: '머신' },
  { id: 'csr', name: '케이블 시티드 로우', target: '등(중하부승모)', tool: '케이블' },
  { id: 'chest_row', name: '체스트 서포티드 로우', target: '등(광배/승모)', tool: '머신' },
  { id: 'tbar', name: '티바 로우', target: '등(전체)', tool: '머신' },
  { id: 'apd', name: '암풀다운', target: '등(광배)', tool: '케이블' },
  { id: 'shrug_bb', name: '바벨 슈러그', target: '등(상부승모)', tool: '바벨' },
  { id: 'shrug_db', name: '덤벨 슈러그', target: '등(상부승모)', tool: '덤벨' },
  { id: 'inv_row', name: '인버티드 로우', target: '등(전체)', tool: '맨몸' },
  { id: 'ohp', name: '오버헤드 프레스', target: '어깨(전면)', tool: '바벨' },
  { id: 'smith_ohp', name: '스미스머신 숄더 프레스', target: '어깨(전면)', tool: '머신' },
  { id: 'spm', name: '숄더 프레스 머신', target: '어깨(전면)', tool: '머신' },
  { id: 'dp', name: '덤벨 숄더 프레스', target: '어깨(전면)', tool: '덤벨' },
  { id: 'arnold', name: '아놀드 프레스', target: '어깨(전/측면)', tool: '덤벨' },
  { id: 'landmine_p', name: '랜드마인 프레스', target: '어깨(전면/가슴)', tool: '바벨' },
  { id: 'fr', name: '프론트 레이즈', target: '어깨(전면)', tool: '덤벨' },
  { id: 'cable_front', name: '케이블 프론트 레이즈', target: '어깨(전면)', tool: '케이블' },
  { id: 'plate_front', name: '원판 프론트 레이즈', target: '어깨(전면)', tool: '도구' },
  { id: 'lr', name: '사이드 레터럴 레이즈', target: '어깨(측면)', tool: '덤벨' },
  { id: 'clr', name: '케이블 레터럴 레이즈', target: '어깨(측면)', tool: '케이블' },
  { id: 'egyptian_lr', name: '이집시안 레터럴 레이즈', target: '어깨(측면)', tool: '케이블' },
  { id: 'uprow', name: '업라이트 로우', target: '어깨(측면)', tool: '바벨' },
  { id: 'rpdf', name: '리버스 펙 덱 플라이', target: '어깨(후면)', tool: '머신' },
  { id: 'bentover', name: '벤트오버 레터럴 레이즈', target: '어깨(후면)', tool: '덤벨' },
  { id: 'face_pull', name: '페이스 풀', target: '등(후면삼각근/승모)', tool: '케이블' },
  { id: 'y_raise', name: 'Y 레이즈', target: '어깨(측면/하부승모)', tool: '덤벨' },
  { id: 'bc', name: '바벨 컬', target: '팔(이두)', tool: '바벨' },
  { id: 'ez_curl', name: 'EZ바 컬', target: '팔(이두)', tool: '바벨' },
  { id: 'dc', name: '덤벨 컬', target: '팔(이두)', tool: '덤벨' },
  { id: 'hc', name: '해머 컬', target: '팔(이두)', tool: '덤벨' },
  { id: 'inc_curl', name: '인클라인 덤벨 컬', target: '팔(이두 장두)', tool: '덤벨' },
  { id: 'spider_curl', name: '스파이더 컬', target: '팔(이두 단두)', tool: '덤벨' },
  { id: 'con_curl', name: '컨센트레이션 컬', target: '팔(이두 단두)', tool: '덤벨' },
  { id: 'cable_curl', name: '케이블 컬', target: '팔(이두)', tool: '케이블' },
  { id: 'pcurl', name: '프리처 컬', target: '팔(이두)', tool: '머신' },
  { id: 'rcurl', name: '리버스 컬', target: '팔(전완)', tool: '바벨' },
  { id: 'tc', name: '트라이셉스 푸시다운', target: '팔(삼두)', tool: '케이블' },
  { id: 'rope_pd', name: '케이블 로프 푸시다운', target: '팔(삼두 외측두)', tool: '케이블' },
  { id: 'ct', name: '오버헤드 트라이셉스 익스텐션', target: '팔(삼두)', tool: '케이블' },
  { id: 'sc', name: '라잉 트라이셉스 익스텐션', target: '팔(삼두)', tool: '바벨' },
  { id: 'french_p', name: '프렌치 프레스', target: '팔(삼두 장두)', tool: '덤벨' },
  { id: 'tkb', name: '덤벨 킥백', target: '팔(삼두)', tool: '덤벨' },
  { id: 'kickback_cable', name: '케이블 킥백', target: '팔(삼두)', tool: '케이블' },
  { id: 'wrist_curl', name: '리스트 컬', target: '팔(전완 굴곡근)', tool: '바벨' },
  { id: 'rev_wrist', name: '리버스 리스트 컬', target: '팔(전완 신전근)', tool: '바벨' },
  { id: 'farmers_walk', name: '파머스 워크', target: '팔(전완/전신)', tool: '덤벨' },
  { id: 'cr', name: '크런치', target: '복근(상복부)', tool: '맨몸' },
  { id: 'decline_cr', name: '디클라인 크런치', target: '복근(상복부)', tool: '맨몸' },
  { id: 'ccrunch', name: '케이블 크런치', target: '복근(상복부)', tool: '케이블' },
  { id: 'hl', name: '행잉 레그레이즈', target: '복근(하복부)', tool: '맨몸' },
  { id: 'leg_raise_floor', name: '라잉 레그레이즈', target: '복근(하복부)', tool: '맨몸' },
  { id: 'toes_to_bar', name: '토즈 투 바 (T2B)', target: '복근(하복부)', tool: '맨몸' },
  { id: 'rtwist', name: '러시안 트위스트', target: '복근(외복사근)', tool: '맨몸' },
  { id: 'woodchop', name: '케이블 우드찹', target: '복근(외복사근)', tool: '케이블' },
  { id: 'bicycle', name: '바이시클 크런치', target: '복근(외복사근)', tool: '맨몸' },
  { id: 'v_up', name: 'V-업', target: '복근(전체)', tool: '맨몸' },
  { id: 'abroll', name: 'AB 롤아웃 (앱롤러)', target: '복근(전체)', tool: '도구' },
  { id: 'plank', name: '플랭크', target: '복근(전체)', tool: '맨몸' },
  { id: 'side_plank', name: '사이드 플랭크', target: '복근(외복사근)', tool: '맨몸' },
  { id: 'dragon_flag', name: '드래곤 플래그', target: '복근(코어 전체)', tool: '맨몸' },
  { id: 'zercher_sq', name: '제르셔 스쿼트', target: '하체(전면/코어)', tool: '바벨' },
  { id: 'nordic_curl', name: '노르딕 컬', target: '하체(햄스트링)', tool: '맨몸' },
  { id: 'deficit_dl', name: '데피싯 데드리프트', target: '하체(후면/기립근)', tool: '바벨' },
  { id: 'seal_row', name: '씰 로우', target: '등(중상부)', tool: '바벨' },
  { id: 'onearm_lpd', name: '원암 랫풀다운', target: '등(광배 하부)', tool: '케이블' },
  { id: 'pullover_mac', name: '풀오버 머신', target: '등(광배 전체)', tool: '머신' },
  { id: 'mag_lpd', name: '맥그립 랫풀다운', target: '등(광배/승모)', tool: '머신' },
  { id: 'spoto_press', name: '스포토 프레스', target: '가슴(중부/삼두)', tool: '바벨' },
  { id: 'cable_fly_stand', name: '스탠딩 케이블 플라이', target: '가슴(전체)', tool: '케이블' },
  { id: 'cable_y', name: '케이블 Y-레이즈', target: '어깨(하부승모/후면)', tool: '케이블' },
  { id: 'z_press', name: 'Z 프레스', target: '어깨(전면/코어)', tool: '바벨' },
  { id: 'machine_lr', name: '머신 레터럴 레이즈', target: '어깨(측면)', tool: '머신' },
  { id: 'bayesian_curl', name: '베이시안 컬', target: '팔(이두 장두)', tool: '케이블' },
  { id: 'zottman_curl', name: '조트만 컬', target: '팔(이두/전완)', tool: '덤벨' },
  { id: 'tgu', name: '터키시 겟업', target: '전신(코어/협응)', tool: '도구' },
  { id: 'battle_rope', name: '배틀 로프', target: '전신(유산소/심폐)', tool: '도구' }
];

const PROGRAMS = [
  { id: 'p1', title: '괴물 3분할 훈련법 (밀/당/하)', author: '대중적 근비대', level: '초중급', duration: '주 6일', type: '근비대', tags: ['추천', '근비대', '상체', '하체'], badgeColor: 'bg-purple-100 text-purple-700', desc: '가장 대중적이고 확실한 근비대를 위한 가슴/등/하체 3분할 루틴', workouts: [{ exerciseId: 'bp', sets: 4, reps: 8, weight: 60 }, { exerciseId: 'ohp', sets: 4, reps: 10, weight: 40 }, { exerciseId: 'ip', sets: 3, reps: 10, weight: 40 }, { exerciseId: 'dp', sets: 3, reps: 12, weight: 15 }, { exerciseId: 'tc', sets: 4, reps: 15, weight: 25 }] },
  { id: 'p2', title: '스트렝스 5x5 파워빌딩', author: '전통 리프팅', level: '중급', duration: '주 3일', type: '스트렝스', tags: ['추천', '스트렝스', '전신'], badgeColor: 'bg-emerald-100 text-emerald-700', desc: '3대 중량을 폭발적으로 늘리기 위한 전통적인 5x5 프로그램', workouts: [{ exerciseId: 'sq', sets: 5, reps: 5, weight: 80 }, { exerciseId: 'bp', sets: 5, reps: 5, weight: 70 }, { exerciseId: 'br', sets: 5, reps: 5, weight: 60 }] },
  { id: 'p3', title: '직장인 주 2회 전신 압축', author: '효율 극대화', level: '초급', duration: '주 2~3일', type: '전신', tags: ['직장인', '전신'], badgeColor: 'bg-blue-100 text-blue-700', desc: '바쁜 직장인을 위해 전신을 한 번에 강하게 털어주는 가성비 루틴', workouts: [{ exerciseId: 'sq', sets: 4, reps: 10, weight: 60 }, { exerciseId: 'pd', sets: 4, reps: 12, weight: 40 }, { exerciseId: 'bp', sets: 4, reps: 10, weight: 50 }, { exerciseId: 'dp', sets: 3, reps: 12, weight: 15 }] },
  { id: 'p4', title: '입문자 안전 머신 루틴', author: '초보자 가이드', level: '입문', duration: '주 3일', type: '기초', tags: ['초보', '머신'], badgeColor: 'bg-orange-100 text-orange-700', desc: '프리웨이트가 두려운 초보자를 위한 안전하고 자극 위주의 머신 세팅', workouts: [{ exerciseId: 'lpd', sets: 3, reps: 15, weight: 40 }, { exerciseId: 'pd', sets: 3, reps: 15, weight: 25 }, { exerciseId: 'pdf', sets: 3, reps: 15, weight: 20 }, { exerciseId: 'sr', sets: 3, reps: 15, weight: 25 }] },
  { id: 'p5', title: '하체 폭파 힙업 집중', author: '하체 마스터', level: '중급', duration: '주 2일', type: '하체', tags: ['하체', '근비대'], badgeColor: 'bg-pink-100 text-pink-700', desc: '탄탄한 둔근과 햄스트링을 만들기 위한 하체 후면 집중 타겟 루틴', workouts: [{ exerciseId: 'sq', sets: 4, reps: 10, weight: 50 }, { exerciseId: 'ht', sets: 4, reps: 12, weight: 60 }, { exerciseId: 'rdl', sets: 4, reps: 12, weight: 40 }, { exerciseId: 'lc', sets: 3, reps: 15, weight: 25 }] },
  { id: 'p6', title: '역삼각형 등 프레임 만들기', author: '등 집중', level: '중급', duration: '주 2일', type: '등', tags: ['등', '근비대'], badgeColor: 'bg-indigo-100 text-indigo-700', desc: '광배근 하부와 승모근까지 꽉 채우는 볼륨 위주의 등 훈련', workouts: [{ exerciseId: 'pu', sets: 5, reps: 8, weight: 0 }, { exerciseId: 'br', sets: 4, reps: 10, weight: 50 }, { exerciseId: 'pd', sets: 4, reps: 12, weight: 45 }, { exerciseId: 'sr', sets: 4, reps: 12, weight: 40 }] },
  { id: 'p7', title: '대포알 어깨 볼륨 루틴', author: '어깨 집중', level: '중급', duration: '주 2일', type: '어깨', tags: ['어깨', '근비대'], badgeColor: 'bg-teal-100 text-teal-700', desc: '전/측/후면 삼각근을 골고루 타격하여 입체적인 대포알 어깨 만들기', workouts: [{ exerciseId: 'ohp', sets: 4, reps: 8, weight: 40 }, { exerciseId: 'dp', sets: 4, reps: 10, weight: 15 }, { exerciseId: 'lr', sets: 5, reps: 15, weight: 5 }, { exerciseId: 'rpdf', sets: 4, reps: 15, weight: 25 }] },
  { id: 'p8', title: '홈트레이닝 맨몸 마스터', author: '방구석 트레이너', level: '초중급', duration: '주 4일', type: '맨몸', tags: ['맨몸운동', '전신'], badgeColor: 'bg-yellow-100 text-yellow-700', desc: '헬스장에 가지 않고 집이나 공원에서 할 수 있는 강력한 맨몸 운동', workouts: [{ exerciseId: 'pu', sets: 4, reps: 10, weight: 0 }, { exerciseId: 'pushup', sets: 4, reps: 20, weight: 0 }, { exerciseId: 'dips', sets: 4, reps: 12, weight: 0 }, { exerciseId: 'plank', sets: 3, reps: 60, weight: 0 }] },
  { id: 'p9', title: '바디프로필 D-30 극한 커팅', author: '다이어트 마스터', level: '고급', duration: '주 5일', type: '다이어트', tags: ['추천', '다이어트', '전신'], badgeColor: 'bg-red-100 text-red-700', desc: '휴식시간을 최소화하고 칼로리 소모를 극대화하는 고강도 서킷 베이스 루틴', workouts: [{ exerciseId: 'sq', sets: 5, reps: 15, weight: 40 }, { exerciseId: 'lpd', sets: 4, reps: 20, weight: 80 }, { exerciseId: 'lunge', sets: 4, reps: 20, weight: 10 }, { exerciseId: 'pushup', sets: 4, reps: 15, weight: 0 }, { exerciseId: 'abroll', sets: 4, reps: 15, weight: 0 }] },
  { id: 'p10', title: '어깨 깡패 프레임 메이커', author: '어깨 집중', level: '중급', duration: '주 2일', type: '어깨/등', tags: ['어깨', '등', '근비대'], badgeColor: 'bg-teal-100 text-teal-700', desc: '넓은 프레임을 만들기 위해 측면/후면 어깨와 광배근 상부를 집중 타격', workouts: [{ exerciseId: 'ohp', sets: 4, reps: 8, weight: 40 }, { exerciseId: 'lr', sets: 6, reps: 15, weight: 5 }, { exerciseId: 'uprow', sets: 4, reps: 12, weight: 20 }, { exerciseId: 'rpdf', sets: 4, reps: 15, weight: 25 }, { exerciseId: 'pd', sets: 4, reps: 12, weight: 45 }] },
  { id: 'p11', title: '오운완! 30분 덤벨 전신 타격', author: '효율 극대화', level: '초중급', duration: '주 3일', type: '전신', tags: ['전신', '직장인'], badgeColor: 'bg-blue-100 text-blue-700', desc: '바벨이나 머신 눈치 볼 필요 없이 덤벨 하나로 전신을 빠르게 털어주는 루틴', workouts: [{ exerciseId: 'goblet', sets: 4, reps: 15, weight: 15 }, { exerciseId: 'dp_chest', sets: 4, reps: 12, weight: 15 }, { exerciseId: 'dr_back', sets: 4, reps: 12, weight: 15 }, { exerciseId: 'dp', sets: 3, reps: 12, weight: 10 }] },
  { id: 'p12', title: '초보자 등 자극 마스터', author: '초보자 가이드', level: '입문', duration: '주 1~2일', type: '등', tags: ['초보', '등', '머신'], badgeColor: 'bg-orange-100 text-orange-700', desc: '등 근육 사용법을 모르는 초보자를 위해 자극 위주의 머신들로만 구성된 루틴', workouts: [{ exerciseId: 'pd', sets: 4, reps: 15, weight: 25 }, { exerciseId: 'astpu', sets: 3, reps: 10, weight: 30 }, { exerciseId: 'sr', sets: 4, reps: 15, weight: 25 }, { exerciseId: 'apd', sets: 3, reps: 15, weight: 15 }] },
  { id: 'p13', title: 'PHUL 4분할 파워빌딩', author: '해외 스트렝스', level: '중고급', duration: '주 4일', type: '파워빌딩', tags: ['추천', '스트렝스', '근비대', '상체', '하체'], badgeColor: 'bg-purple-100 text-purple-700', desc: 'Power Hypertrophy Upper Lower: 스트렝스(파워)와 근비대(볼륨)를 동시에 잡기 위해 상하체를 번갈아 고중량과 고반복으로 타격하는 하이브리드 루틴 (상체 파워 데이 예시).', workouts: [{ exerciseId: 'bp', sets: 4, reps: 5, weight: 80 }, { exerciseId: 'br', sets: 4, reps: 5, weight: 80 }, { exerciseId: 'ip', sets: 3, reps: 8, weight: 60 }, { exerciseId: 'pd', sets: 3, reps: 8, weight: 55 }, { exerciseId: 'ohp', sets: 3, reps: 8, weight: 50 }] },
  { id: 'p14', title: 'GVT 10x10 매스업', author: '클래식 보디빌딩', level: '고급', duration: '주 3일', type: '근비대', tags: ['근비대', '전신'], badgeColor: 'bg-rose-100 text-rose-700', desc: 'German Volume Training: 단일 종목을 1RM 60% 무게로 10세트 10회 반복하여 근육을 극한으로 파괴, 한계점 이상의 사이즈(매스업)를 끌어내는 악명 높은 루틴 (가슴/등 데이 예시).', workouts: [{ exerciseId: 'bp', sets: 10, reps: 10, weight: 60 }, { exerciseId: 'br', sets: 10, reps: 10, weight: 60 }, { exerciseId: 'dfly', sets: 3, reps: 15, weight: 15 }, { exerciseId: 'sr', sets: 3, reps: 15, weight: 40 }] },
  { id: 'p15', title: 'PHAT 5분할 (하체 비대)', author: 'Layne Norton', level: '고급', duration: '주 5일', type: '파워빌딩', tags: ['추천', '하체', '스트렝스'], badgeColor: 'bg-indigo-100 text-indigo-700', desc: '근비대 전문 박사 레인 노튼의 5분할 루틴. 파워 2일, 근비대 3일로 나뉘며, 본 루틴은 스피드 훈련과 펌핑을 결합한 하체 근비대(Hypertrophy) 데이입니다.', workouts: [{ exerciseId: 'sq', sets: 6, reps: 3, weight: 90 }, { exerciseId: 'hack_sq', sets: 3, reps: 10, weight: 100 }, { exerciseId: 'lpd', sets: 3, reps: 15, weight: 160 }, { exerciseId: 'le', sets: 4, reps: 20, weight: 40 }, { exerciseId: 'rdl', sets: 3, reps: 10, weight: 80 }, { exerciseId: 'lc', sets: 4, reps: 15, weight: 35 }] },
  { id: 'p16', title: '6일 PPL (Push-밀기)', author: '가장 완벽한 분할', level: '중고급', duration: '주 6일', type: '근비대', tags: ['가슴', '어깨', '근비대'], badgeColor: 'bg-blue-100 text-blue-700', desc: '현대 보디빌딩에서 가장 선호되는 PPL(밀/당/하) 주 2회 타격 루틴 중, 가슴/어깨/삼두를 묶어서 폭파시키는 강력한 밀기(Push) 데이 세팅입니다.', workouts: [{ exerciseId: 'bp', sets: 4, reps: 8, weight: 80 }, { exerciseId: 'ohp', sets: 4, reps: 10, weight: 50 }, { exerciseId: 'idp', sets: 3, reps: 12, weight: 25 }, { exerciseId: 'lr', sets: 5, reps: 15, weight: 10 }, { exerciseId: 'tc', sets: 4, reps: 15, weight: 35 }] }
];

const OLYMPIA_LEGENDS = [
  {
    id: 'leg_ronnie', name: '로니 콜먼 (Ronnie Coleman)', nickname: 'The King', era: '1998-2005 (올림피아 8회 우승)',
    desc: '"Yeah Buddy! Light weight, baby!" 역대 최고의 등과 하체를 지닌 압도적인 매스 몬스터. 초고중량 프리웨이트를 즐겨했습니다.',
    imageColor: 'from-blue-700 to-blue-900',
    split: '주 6일 · 3분할을 주 2회 (등·이두·어깨 / 하체 / 가슴·삼두)',
    basis: '로니 콜먼이 훈련 영상과 인터뷰에서 밝힌 주 6일 3분할을 바탕으로, 그가 즐겨 한 종목으로 구성했어요. 세트·횟수는 따라 하기 좋게 다듬은 값이에요.',
    routines: [
      { id: 'r_d1', title: '등·이두·어깨 (A)', desc: '데드리프트로 시작하는 두께 중심의 등, 바벨 컬, 밀리터리 프레스까지 한 번에', workouts: [{exerciseId: 'dl', sets: 4, reps: 8, weight: 160, note: '점점 무겁게'}, {exerciseId: 'br', sets: 4, reps: 10, weight: 110}, {exerciseId: 'tbar', sets: 3, reps: 10, weight: 90}, {exerciseId: 'dr_back', sets: 3, reps: 10, weight: 50}, {exerciseId: 'bc', sets: 4, reps: 12, weight: 45}, {exerciseId: 'dc', sets: 3, reps: 12, weight: 20}, {exerciseId: 'ohp', sets: 4, reps: 10, weight: 70}, {exerciseId: 'fr', sets: 3, reps: 12, weight: 15}, {exerciseId: 'lr', sets: 3, reps: 12, weight: 15}] },
      { id: 'r_d2', title: '하체 (A) 스쿼트 데이', desc: '"Light weight, baby!" 초고중량 스쿼트와 바벨 워킹 런지로 다리를 키우는 날', workouts: [{exerciseId: 'sq', sets: 5, reps: 10, weight: 160, note: '허벅지가 평행이 될 때까지'}, {exerciseId: 'lpd', sets: 4, reps: 12, weight: 300}, {exerciseId: 'hack_sq', sets: 3, reps: 12, weight: 140}, {exerciseId: 'walk_lunge', sets: 2, reps: 24, weight: 60, note: '좌우 합쳐 24걸음'}, {exerciseId: 'stiff_dl', sets: 3, reps: 12, weight: 100}, {exerciseId: 'lc', sets: 3, reps: 12, weight: 50}] },
      { id: 'r_d3', title: '가슴·삼두 (A)', desc: '벤치프레스 중심으로 가슴 매스를 쌓고 클로즈그립으로 삼두를 마무리', workouts: [{exerciseId: 'bp', sets: 5, reps: 12, weight: 130}, {exerciseId: 'ip', sets: 3, reps: 12, weight: 100}, {exerciseId: 'dp_chest', sets: 3, reps: 12, weight: 50}, {exerciseId: 'dfly', sets: 3, reps: 12, weight: 25}, {exerciseId: 'cg_bench', sets: 3, reps: 12, weight: 90}, {exerciseId: 'sc', sets: 3, reps: 12, weight: 45}, {exerciseId: 'tc', sets: 3, reps: 15, weight: 40}] },
      { id: 'r_d4', title: '등·이두·어깨 (B)', desc: '풀다운과 케이블 로우로 등 너비를, 덤벨 프레스로 어깨를 채우는 날', workouts: [{exerciseId: 'pd', sets: 4, reps: 12, weight: 90}, {exerciseId: 'pu', sets: 3, reps: 10, weight: 0}, {exerciseId: 'csr', sets: 3, reps: 12, weight: 80}, {exerciseId: 'pcurl', sets: 3, reps: 12, weight: 35}, {exerciseId: 'cable_curl', sets: 3, reps: 12, weight: 30}, {exerciseId: 'dp', sets: 4, reps: 12, weight: 40}, {exerciseId: 'lr', sets: 3, reps: 15, weight: 15}, {exerciseId: 'bentover', sets: 3, reps: 15, weight: 14}] },
      { id: 'r_d5', title: '하체 (B) 프론트 스쿼트 데이', desc: '프론트 스쿼트와 레그 익스텐션으로 대퇴사두를, 루마니안 데드로 뒷다리를', workouts: [{exerciseId: 'fsq', sets: 4, reps: 10, weight: 120}, {exerciseId: 'lpd', sets: 4, reps: 15, weight: 280}, {exerciseId: 'le', sets: 4, reps: 15, weight: 60}, {exerciseId: 'lc', sets: 4, reps: 12, weight: 50}, {exerciseId: 'rdl', sets: 3, reps: 10, weight: 120}, {exerciseId: 'calf', sets: 4, reps: 15, weight: 100}] },
      { id: 'r_d6', title: '가슴·삼두 (B) 덤벨 데이', desc: '90kg 덤벨 프레스로 유명했던 로니의 덤벨 중심 가슴 루틴', workouts: [{exerciseId: 'dp_chest', sets: 4, reps: 12, weight: 55}, {exerciseId: 'idp', sets: 3, reps: 12, weight: 45}, {exerciseId: 'dbp', sets: 3, reps: 12, weight: 100}, {exerciseId: 'pdf', sets: 3, reps: 15, weight: 50}, {exerciseId: 'french_p', sets: 3, reps: 12, weight: 30}, {exerciseId: 'rope_pd', sets: 3, reps: 15, weight: 35}, {exerciseId: 'dips', sets: 3, reps: 12, weight: 0}] }
    ]
  },
  {
    id: 'leg_jay', name: '제이 커틀러 (Jay Cutler)', nickname: 'The Comeback Kid', era: '2006-2007, 2009-2010 (올림피아 4회 우승)',
    desc: '엄청난 볼륨과 근육의 고립, 철저한 식단과 정석적인 펌핑으로 로니 콜먼의 시대를 끝낸 장본인입니다.',
    imageColor: 'from-amber-600 to-amber-900',
    split: '주 5~6일 · 부위별 분할 (가슴 / 등 / 팔 / 어깨 / 대퇴사두 / 햄스트링)',
    basis: '제이 커틀러가 오래 써 온 부위별 분할과 그가 자주 소개한 종목을 바탕으로 구성했어요. 대회 시즌마다 바꿔서 하나의 공식 루틴은 없어요.',
    routines: [
      { id: 'j_chest', title: '가슴', desc: '인클라인 덤벨로 시작하는 커틀러식 가슴. 수축 구간을 끝까지 쥐어짜요.', workouts: [{exerciseId: 'idp', sets: 4, reps: 10, weight: 45}, {exerciseId: 'dp_chest', sets: 3, reps: 10, weight: 45}, {exerciseId: 'sip', sets: 3, reps: 10, weight: 100}, {exerciseId: 'dfly', sets: 3, reps: 12, weight: 22}, {exerciseId: 'cf', sets: 3, reps: 15, weight: 25}] },
      { id: 'j_back', title: '등', desc: '너비(풀다운)와 두께(로우)를 모두 잡는 고볼륨 등', workouts: [{exerciseId: 'pd', sets: 4, reps: 10, weight: 90}, {exerciseId: 'dr_back', sets: 3, reps: 10, weight: 55}, {exerciseId: 'chest_row', sets: 3, reps: 10, weight: 90}, {exerciseId: 'csr', sets: 3, reps: 12, weight: 80}, {exerciseId: 'apd', sets: 3, reps: 15, weight: 35}, {exerciseId: 'dl', sets: 3, reps: 8, weight: 180}] },
      { id: 'j_arm', title: '팔 (이두·삼두)', desc: '이두와 삼두를 번갈아 다양한 각도로 고립', workouts: [{exerciseId: 'ez_curl', sets: 4, reps: 10, weight: 45}, {exerciseId: 'dc', sets: 3, reps: 10, weight: 20}, {exerciseId: 'pcurl', sets: 3, reps: 12, weight: 35}, {exerciseId: 'hc', sets: 3, reps: 12, weight: 22}, {exerciseId: 'tc', sets: 4, reps: 12, weight: 45}, {exerciseId: 'sc', sets: 3, reps: 10, weight: 45}, {exerciseId: 'ct', sets: 3, reps: 12, weight: 35}] },
      { id: 'j_sh', title: '어깨·승모', desc: '앉아서 하는 덤벨 프레스, 측면 고볼륨, 슈러그까지', workouts: [{exerciseId: 'dp', sets: 4, reps: 10, weight: 40}, {exerciseId: 'lr', sets: 4, reps: 12, weight: 16}, {exerciseId: 'clr', sets: 3, reps: 15, weight: 12}, {exerciseId: 'rpdf', sets: 3, reps: 15, weight: 50}, {exerciseId: 'bentover', sets: 3, reps: 15, weight: 14}, {exerciseId: 'shrug_db', sets: 4, reps: 12, weight: 45}] },
      { id: 'j_quad', title: '대퇴사두 (Quad Stomp)', desc: '"Quad Stomp"로 알려진 커틀러의 앞허벅지 집중 하체', workouts: [{exerciseId: 'le', sets: 4, reps: 20, weight: 50, note: '예비 피로용 고반복'}, {exerciseId: 'hack_sq', sets: 4, reps: 10, weight: 160}, {exerciseId: 'lpd', sets: 4, reps: 12, weight: 300}, {exerciseId: 'smith_sq', sets: 3, reps: 10, weight: 100}, {exerciseId: 'lunge', sets: 3, reps: 12, weight: 25}] },
      { id: 'j_ham', title: '햄스트링·종아리', desc: '레그 컬과 스티프 데드리프트로 뒷다리 결을 살리는 날', workouts: [{exerciseId: 'lc', sets: 4, reps: 12, weight: 50}, {exerciseId: 'stiff_dl', sets: 4, reps: 10, weight: 110}, {exerciseId: 's_lpd', sets: 3, reps: 12, weight: 120, note: '발을 발판 위쪽에'}, {exerciseId: 'calf', sets: 5, reps: 15, weight: 120}] }
    ]
  },
  {
    id: 'leg_arnold', name: '아놀드 슈왈제네거 (Arnold)', nickname: 'The Austrian Oak', era: '1970-1975, 1980 (올림피아 7회 우승)',
    desc: '보디빌딩의 상징. 조각 같은 가슴과 봉우리 같은 이두근, 그리고 펌핑을 극대화하는 슈퍼세트의 창시자입니다.',
    imageColor: 'from-emerald-600 to-emerald-900',
    split: '주 6일 · 가슴·등 / 어깨·팔 / 하체를 주 2회 (더블 스플릿)',
    basis: '아놀드가 「보디빌딩 백과사전(The New Encyclopedia of Modern Bodybuilding)」에서 소개한 주 6일 분할을 바탕으로 구성했어요. 가슴과 등은 슈퍼세트로 번갈아 하던 방식이에요.',
    routines: [
      { id: 'a_cb_1', title: '가슴·등 (A) 슈퍼세트', desc: '벤치프레스와 턱걸이를 번갈아 하는 아놀드의 대표 상체 훈련', workouts: [{exerciseId: 'bp', sets: 5, reps: 10, weight: 100, note: '턱걸이와 슈퍼세트'}, {exerciseId: 'pu', sets: 5, reps: 10, weight: 0, note: '와이드 그립'}, {exerciseId: 'ip', sets: 4, reps: 10, weight: 80}, {exerciseId: 'br', sets: 4, reps: 10, weight: 90}, {exerciseId: 'dfly', sets: 4, reps: 10, weight: 22}, {exerciseId: 'tbar', sets: 4, reps: 10, weight: 80}, {exerciseId: 'db_pullover', sets: 4, reps: 12, weight: 30, note: '흉곽을 넓히는 느낌으로'}] },
      { id: 'a_sa_1', title: '어깨·팔 (A)', desc: '프레스와 레이즈로 어깨를, 바벨 컬로 봉우리 이두를', workouts: [{exerciseId: 'ohp', sets: 4, reps: 10, weight: 60}, {exerciseId: 'arnold', sets: 4, reps: 10, weight: 26}, {exerciseId: 'lr', sets: 4, reps: 10, weight: 12}, {exerciseId: 'bentover', sets: 4, reps: 10, weight: 12}, {exerciseId: 'bc', sets: 4, reps: 10, weight: 45}, {exerciseId: 'inc_curl', sets: 3, reps: 10, weight: 16}, {exerciseId: 'sc', sets: 4, reps: 10, weight: 40}, {exerciseId: 'tc', sets: 4, reps: 12, weight: 35}] },
      { id: 'a_leg_1', title: '하체 (A)', desc: '스쿼트와 "종아리 10세트"로 유명한 클래식 하체', workouts: [{exerciseId: 'sq', sets: 5, reps: 10, weight: 120}, {exerciseId: 'fsq', sets: 4, reps: 10, weight: 90}, {exerciseId: 'le', sets: 4, reps: 12, weight: 55}, {exerciseId: 'lc', sets: 4, reps: 10, weight: 45}, {exerciseId: 'stiff_dl', sets: 3, reps: 10, weight: 90}, {exerciseId: 'calf', sets: 10, reps: 10, weight: 100, note: '아놀드식 10×10'}] },
      { id: 'a_cb_2', title: '가슴·등 (B)', desc: '인클라인 덤벨과 친업, 딥스와 로우로 다른 각도를 채우는 날', workouts: [{exerciseId: 'idp', sets: 4, reps: 10, weight: 36}, {exerciseId: 'cu', sets: 4, reps: 10, weight: 0, note: '인클라인과 슈퍼세트'}, {exerciseId: 'dips', sets: 4, reps: 12, weight: 0}, {exerciseId: 'csr', sets: 4, reps: 10, weight: 70}, {exerciseId: 'cf', sets: 4, reps: 12, weight: 22}, {exerciseId: 'dr_back', sets: 4, reps: 10, weight: 45}, {exerciseId: 'dl', sets: 3, reps: 8, weight: 160}] },
      { id: 'a_sa_2', title: '어깨·팔 (B)', desc: '업라이트 로우와 컨센트레이션 컬, 프렌치 프레스로 디테일을', workouts: [{exerciseId: 'dp', sets: 4, reps: 10, weight: 30}, {exerciseId: 'uprow', sets: 4, reps: 10, weight: 40}, {exerciseId: 'clr', sets: 3, reps: 12, weight: 10}, {exerciseId: 'dc', sets: 4, reps: 10, weight: 18}, {exerciseId: 'con_curl', sets: 3, reps: 10, weight: 14}, {exerciseId: 'french_p', sets: 4, reps: 10, weight: 28}, {exerciseId: 'tkb', sets: 3, reps: 12, weight: 12}, {exerciseId: 'wrist_curl', sets: 3, reps: 15, weight: 30}] },
      { id: 'a_leg_2', title: '하체 (B)·복근', desc: '핵 스쿼트와 런지, 그리고 매일 하던 복근 운동', workouts: [{exerciseId: 'hack_sq', sets: 4, reps: 10, weight: 120}, {exerciseId: 'lunge', sets: 4, reps: 12, weight: 22}, {exerciseId: 'lc', sets: 4, reps: 10, weight: 45}, {exerciseId: 'calf', sets: 5, reps: 15, weight: 100}, {exerciseId: 'hl', sets: 4, reps: 15, weight: 0}, {exerciseId: 'cr', sets: 4, reps: 25, weight: 0}] }
    ]
  },
  {
    id: 'leg_cbum', name: '크리스 범스테드 (CBUM)', nickname: 'Daddy CBum', era: '2019-2023 (클래식 피지크 5연패)',
    desc: '현대 클래식 피지크의 완벽한 표본. 넓은 어깨와 잘록한 허리로 완벽한 V테이퍼를 자랑합니다.',
    imageColor: 'from-rose-600 to-rose-900',
    split: '3일 운동 · 1일 휴식 (대퇴사두 / 가슴·등 / 어깨 / 햄스트링 / 팔)',
    basis: '크리스 범스테드의 2023 올림피아 준비 분할(3일 운동, 1일 휴식)과 그가 영상에서 자주 보여준 종목을 바탕으로 구성했어요. 세트 수는 적게, 대신 실패 지점까지 하는 방식이에요.',
    routines: [
      { id: 'c_quad', title: '대퇴사두·종아리', desc: '레그 익스텐션 드롭세트로 시작해 스미스 스쿼트, 한 다리 레그 프레스로 마무리', workouts: [{exerciseId: 'le', sets: 2, reps: 10, weight: 60, note: '마지막 세트 드롭세트'}, {exerciseId: 'smith_sq', sets: 2, reps: 8, weight: 120, note: '실패 지점까지'}, {exerciseId: 's_lpd', sets: 3, reps: 10, weight: 120, note: '한 다리씩'}, {exerciseId: 'sissy_sq', sets: 3, reps: 10, weight: 0}, {exerciseId: 'calf', sets: 3, reps: 10, weight: 80}] },
      { id: 'c_pp', title: '가슴·등 (푸시 & 풀)', desc: '인클라인 스미스로 윗가슴을, 클로즈그립 풀다운과 머신 로우로 등을', workouts: [{exerciseId: 'sip', sets: 3, reps: 8, weight: 100}, {exerciseId: 'dp_chest', sets: 2, reps: 10, weight: 45}, {exerciseId: 'pdf', sets: 2, reps: 12, weight: 50}, {exerciseId: 'cg_pd', sets: 3, reps: 10, weight: 80}, {exerciseId: 'chest_row', sets: 3, reps: 10, weight: 90}, {exerciseId: 'apd', sets: 2, reps: 15, weight: 35, note: '케이블 랫 익스텐션'}] },
      { id: 'c_sh', title: '어깨', desc: '무거운 덤벨 레터럴로 시작하는 2023 올림피아 준비 어깨 루틴', workouts: [{exerciseId: 'lr', sets: 3, reps: 12, weight: 20}, {exerciseId: 'spm', sets: 3, reps: 10, weight: 90}, {exerciseId: 'clr', sets: 2, reps: 12, weight: 12}, {exerciseId: 'rpdf', sets: 3, reps: 12, weight: 55, note: '마지막 세트 드롭세트'}, {exerciseId: 'machine_lr', sets: 2, reps: 15, weight: 40}] },
      { id: 'c_ham', title: '햄스트링·둔근', desc: '앉아서 하는 레그 컬과 루마니안 데드리프트로 뒷다리와 엉덩이 경계를 선명하게', workouts: [{exerciseId: 'lc', sets: 3, reps: 10, weight: 50}, {exerciseId: 'rdl', sets: 3, reps: 8, weight: 120}, {exerciseId: 'bss', sets: 2, reps: 10, weight: 24}, {exerciseId: 'inth', sets: 2, reps: 15, weight: 60}] },
      { id: 'c_arm', title: '팔', desc: '프리처 컬과 로프 푸시다운 중심으로 팔을 펌핑', workouts: [{exerciseId: 'pcurl', sets: 3, reps: 10, weight: 35}, {exerciseId: 'inc_curl', sets: 3, reps: 10, weight: 14}, {exerciseId: 'bayesian_curl', sets: 2, reps: 12, weight: 15}, {exerciseId: 'rope_pd', sets: 3, reps: 12, weight: 35}, {exerciseId: 'ct', sets: 3, reps: 12, weight: 30}, {exerciseId: 'dips', sets: 2, reps: 12, weight: 0}] }
    ]
  }
];

const KOREAN_LEGENDS = [
  {
    id: 'k_park', name: '박재훈 (Jaehoon Park)', nickname: 'Korean Classic', era: 'IFBB 프로 클래식 피지크 · 2022 올림피아 TOP 15',
    desc: '한국을 대표하는 클래식 피지크 프로. 넓은 어깨와 윗가슴, 잘록한 허리로 만드는 V라인과 무대에서 빛나는 다리 라인이 강점이에요.',
    imageColor: 'from-blue-600 to-indigo-900',
    split: '주 5~6일 · 부위별 분할 (하체 2회)',
    basis: '공개된 대회 이력과 체급 특성, 선수가 유튜브에서 보여준 훈련 스타일을 바탕으로 재구성한 루틴이에요. 선수 본인의 실제 루틴과 다를 수 있으니 정확한 방법은 선수 채널에서 확인해 주세요.',
    routines: [
      { id: 'kp_leg_1', title: '하체 전면 (멘탈 붕괴 볼륨)', desc: '토가 나올 때까지 밀어붙이는 고강도 대퇴사두 타격', workouts: [{exerciseId: 'sq', sets: 5, reps: 10, weight: 140}, {exerciseId: 'vsq', sets: 4, reps: 12, weight: 120}, {exerciseId: 'lpd', sets: 5, reps: 15, weight: 240}, {exerciseId: 'le', sets: 4, reps: 20, weight: 60}] },
      { id: 'kp_leg_2', title: '하체 후면 (둔근/햄스트링 분리)', desc: '클래식 피지크의 완성, 다리 후면부를 깊게 파는 루틴', workouts: [{exerciseId: 'rdl', sets: 5, reps: 12, weight: 100}, {exerciseId: 'lc', sets: 5, reps: 15, weight: 45}, {exerciseId: 'bss', sets: 4, reps: 12, weight: 40}, {exerciseId: 'calf', sets: 4, reps: 20, weight: 60}] },
      { id: 'kp_chest_1', title: '가슴 상부 (윗가슴 매스업)', desc: '웅장한 윗가슴 볼륨을 채우는 인클라인 위주의 훈련', workouts: [{exerciseId: 'ip', sets: 5, reps: 10, weight: 90}, {exerciseId: 'idp', sets: 4, reps: 12, weight: 35}, {exerciseId: 'sip', sets: 4, reps: 12, weight: 80}, {exerciseId: 'cf', sets: 4, reps: 15, weight: 25}] },
      { id: 'kp_chest_2', title: '가슴 전체 (흉곽 확장 펌핑)', desc: '가슴의 너비와 두께를 동시에 잡는 베이직 루틴', workouts: [{exerciseId: 'bp', sets: 5, reps: 10, weight: 100}, {exerciseId: 'cpm', sets: 4, reps: 12, weight: 80}, {exerciseId: 'dips', sets: 4, reps: 15, weight: 0}, {exerciseId: 'pdf', sets: 4, reps: 15, weight: 35}] },
      { id: 'kp_back_1', title: '등 (V테이퍼 광배 너비)', desc: '클래식 피지크의 핵심인 V라인을 위한 광배 너비·하부 집중', workouts: [{exerciseId: 'pd', sets: 5, reps: 12, weight: 70}, {exerciseId: 'onearm_lpd', sets: 4, reps: 12, weight: 30}, {exerciseId: 'apd', sets: 4, reps: 15, weight: 30}, {exerciseId: 'csr', sets: 4, reps: 12, weight: 60}] },
      { id: 'kp_back_2', title: '등 (두께감 집중 매스업)', desc: '등판의 두께를 거대하게 만드는 프리웨이트 로우', workouts: [{exerciseId: 'br', sets: 5, reps: 10, weight: 100}, {exerciseId: 'tbar', sets: 4, reps: 12, weight: 80}, {exerciseId: 'pu', sets: 4, reps: 10, weight: 0}, {exerciseId: 'csr', sets: 4, reps: 15, weight: 55}] },
      { id: 'kp_sh_1', title: '어깨 전/측면 (대포알 볼륨)', desc: '둥글고 거대한 어깨를 만드는 측면 고반복 훈련', workouts: [{exerciseId: 'ohp', sets: 5, reps: 10, weight: 60}, {exerciseId: 'dp', sets: 4, reps: 12, weight: 25}, {exerciseId: 'lr', sets: 6, reps: 15, weight: 12}, {exerciseId: 'clr', sets: 4, reps: 15, weight: 15}] },
      { id: 'kp_sh_2', title: '어깨 후면 (입체감 완성)', desc: '어깨의 완성도를 높이는 후면 삼각근 폭격', workouts: [{exerciseId: 'rpdf', sets: 5, reps: 15, weight: 40}, {exerciseId: 'bentover', sets: 4, reps: 15, weight: 10}, {exerciseId: 'uprow', sets: 4, reps: 12, weight: 40}, {exerciseId: 'fr', sets: 4, reps: 15, weight: 15}] },
      { id: 'kp_arm_1', title: '이두근 (봉우리 펌핑)', desc: '이두의 높이와 분리도를 위한 고립 컬', workouts: [{exerciseId: 'bc', sets: 4, reps: 12, weight: 40}, {exerciseId: 'pcurl', sets: 4, reps: 12, weight: 30}, {exerciseId: 'dc', sets: 4, reps: 15, weight: 15}] },
      { id: 'kp_arm_2', title: '삼두근 (말굽 두께감)', desc: '팔의 전체적인 두께를 키우는 삼두 훈련', workouts: [{exerciseId: 'tc', sets: 4, reps: 15, weight: 35}, {exerciseId: 'sc', sets: 4, reps: 12, weight: 35}, {exerciseId: 'ct', sets: 4, reps: 15, weight: 25}] }
    ]
  },
  {
    id: 'k_kim_gw', name: '김건우 (Gunwoo Kim)', nickname: '건담포스 (Gundam Force)', era: 'IFBB 프로 212 · 2024 올림피아 진출',
    desc: "'건담포스'로 활동하는 212 보디빌더. 2023 몬스터짐 프로 퀄리파이어 212 종합 우승과 같은 날 열린 프로쇼 우승으로 IFBB 프로카드와 올림피아 출전권을 함께 얻었어요.",
    imageColor: 'from-emerald-600 to-teal-900',
    split: '주 5~6일 · 부위별 분할',
    basis: '공개된 대회 이력과 체급 특성, 선수가 유튜브에서 보여준 훈련 스타일을 바탕으로 재구성한 루틴이에요. 선수 본인의 실제 루틴과 다를 수 있으니 정확한 방법은 선수 채널에서 확인해 주세요.',
    routines: [
      { id: 'kg_back_1', title: '등 (너비감 극대화 랫풀)', desc: '넓은 프레임을 위한 랫풀다운/풀업 위주 타격', workouts: [{exerciseId: 'pd', sets: 5, reps: 12, weight: 80}, {exerciseId: 'pu', sets: 4, reps: 10, weight: 0}, {exerciseId: 'apd', sets: 4, reps: 15, weight: 30}, {exerciseId: 'csr', sets: 4, reps: 12, weight: 60}] },
      { id: 'kg_back_2', title: '등 (두께감 머신/바벨 로우)', desc: '등 상/중부를 꽉 채우는 묵직한 로우 루틴', workouts: [{exerciseId: 'br', sets: 5, reps: 10, weight: 100}, {exerciseId: 'sr', sets: 4, reps: 12, weight: 70}, {exerciseId: 'tbar', sets: 4, reps: 12, weight: 80}, {exerciseId: 'dr_back', sets: 4, reps: 10, weight: 45}] },
      { id: 'kg_sh_1', title: '어깨 (3D 측면 고립)', desc: '태평양 어깨를 위한 디테일한 측면 레이즈 중심', workouts: [{exerciseId: 'lr', sets: 6, reps: 20, weight: 10}, {exerciseId: 'clr', sets: 4, reps: 15, weight: 15}, {exerciseId: 'spm', sets: 4, reps: 12, weight: 70}, {exerciseId: 'dp', sets: 4, reps: 10, weight: 25}] },
      { id: 'kg_sh_2', title: '어깨 (전/후면 밸런스)', desc: '전면과 후면을 골고루 채워 입체감을 만드는 루틴', workouts: [{exerciseId: 'ohp', sets: 4, reps: 10, weight: 70}, {exerciseId: 'fr', sets: 4, reps: 15, weight: 15}, {exerciseId: 'rpdf', sets: 5, reps: 15, weight: 45}, {exerciseId: 'bentover', sets: 4, reps: 15, weight: 12}] },
      { id: 'kg_chest_1', title: '가슴 (덤벨 위주 가동범위)', desc: '가동범위를 극한으로 쓰는 덤벨 프레스/플라이', workouts: [{exerciseId: 'dp_chest', sets: 5, reps: 10, weight: 40}, {exerciseId: 'idp', sets: 4, reps: 12, weight: 35}, {exerciseId: 'dfly', sets: 4, reps: 15, weight: 20}, {exerciseId: 'cpm', sets: 4, reps: 12, weight: 70}] },
      { id: 'kg_chest_2', title: '가슴 (프레스 고중량 타격)', desc: '안전한 머신과 바벨로 밀어붙이는 매스업', workouts: [{exerciseId: 'bp', sets: 5, reps: 8, weight: 110}, {exerciseId: 'sip', sets: 4, reps: 10, weight: 90}, {exerciseId: 'dbp', sets: 4, reps: 12, weight: 100}, {exerciseId: 'cf', sets: 4, reps: 15, weight: 30}] },
      { id: 'kg_leg_1', title: '하체 (대퇴사두 분리도)', desc: '갈라지는 앞다리를 위한 익스텐션/프론트 스쿼트', workouts: [{exerciseId: 'le', sets: 5, reps: 20, weight: 60}, {exerciseId: 'fsq', sets: 4, reps: 10, weight: 90}, {exerciseId: 'lpd', sets: 4, reps: 15, weight: 260}, {exerciseId: 'vsq', sets: 4, reps: 12, weight: 140}] },
      { id: 'kg_leg_2', title: '하체 (후면 파워 훈련)', desc: '햄스트링과 둔근의 두께를 키우는 데드리프트 베이스', workouts: [{exerciseId: 'dl', sets: 5, reps: 5, weight: 140}, {exerciseId: 'rdl', sets: 4, reps: 10, weight: 110}, {exerciseId: 'lc', sets: 4, reps: 15, weight: 50}, {exerciseId: 'ht', sets: 4, reps: 12, weight: 100}] },
      { id: 'kg_arm_1', title: '팔 (이두 터질듯한 펌핑)', desc: '전완과 이두를 동시에 잡는 해머컬 포함 루틴', workouts: [{exerciseId: 'hc', sets: 4, reps: 12, weight: 20}, {exerciseId: 'dc', sets: 4, reps: 12, weight: 15}, {exerciseId: 'bc', sets: 4, reps: 10, weight: 40}] },
      { id: 'kg_arm_2', title: '팔 (삼두 꽉 채우기)', desc: '삼두 장두를 길게 뽑아내는 익스텐션 위주 훈련', workouts: [{exerciseId: 'sc', sets: 5, reps: 12, weight: 40}, {exerciseId: 'tc', sets: 4, reps: 15, weight: 40}, {exerciseId: 'tkb', sets: 3, reps: 15, weight: 10}] }
    ]
  },
  {
    id: 'k_jang', name: '장성엽 (Sungyeop Jang)', nickname: '리틀성엽', era: 'IFBB 프로 212 · 2025 올림피아 출전',
    desc: '안양에서 체육관을 운영하는 212 프로. 2022 재팬 프로와 2024 차이나 프로에서 우승했고 2025 212 올림피아 무대에 섰어요. 정확한 자세와 느린 네거티브를 강조하는 운동 영상으로 유명해요.',
    imageColor: 'from-rose-600 to-red-900',
    split: '주 5~6일 · 부위별 분할',
    basis: '공개된 대회 이력과 체급 특성, 선수가 유튜브에서 보여준 훈련 스타일을 바탕으로 재구성한 루틴이에요. 선수 본인의 실제 루틴과 다를 수 있으니 정확한 방법은 선수 채널에서 확인해 주세요.',
    routines: [
      { id: 'kj_leg_1', title: '하체 (매스업 V스쿼트 중심)', desc: '거대한 대퇴사두를 만드는 초고중량 머신 훈련', workouts: [{exerciseId: 'vsq', sets: 5, reps: 10, weight: 160, note: '네거티브 3~4초'}, {exerciseId: 'lpd', sets: 5, reps: 12, weight: 300}, {exerciseId: 'sq', sets: 4, reps: 8, weight: 140}, {exerciseId: 'le', sets: 4, reps: 15, weight: 70}] },
      { id: 'kj_leg_2', title: '하체 (후면 고중량 데드)', desc: '212 파운드를 꽉 채운 거대한 하체 후면 두께', workouts: [{exerciseId: 'rdl', sets: 5, reps: 8, weight: 140, note: '네거티브 3~4초'}, {exerciseId: 'lc', sets: 5, reps: 12, weight: 55}, {exerciseId: 'ht', sets: 4, reps: 10, weight: 140}, {exerciseId: 'calf', sets: 4, reps: 15, weight: 80}] },
      { id: 'kj_chest_1', title: '가슴 (스트렝스 고중량 프레스)', desc: '가슴 두께를 무식하게 키우는 베이직 프레스', workouts: [{exerciseId: 'bp', sets: 5, reps: 8, weight: 120, note: '네거티브 3~4초'}, {exerciseId: 'ip', sets: 4, reps: 8, weight: 100}, {exerciseId: 'dips', sets: 4, reps: 12, weight: 20}, {exerciseId: 'dp_chest', sets: 4, reps: 10, weight: 45}] },
      { id: 'kj_chest_2', title: '가슴 (윗가슴 집중 두께)', desc: '비어있는 윗가슴을 꽉 채우는 인클라인 타격', workouts: [{exerciseId: 'sip', sets: 5, reps: 10, weight: 100}, {exerciseId: 'idp', sets: 4, reps: 10, weight: 40}, {exerciseId: 'pdf', sets: 4, reps: 12, weight: 50}, {exerciseId: 'cf', sets: 4, reps: 15, weight: 35}] },
      { id: 'kj_back_1', title: '등 (등신 바벨로우)', desc: '등을 가장 두껍게 만드는 프리웨이트 로우 마스터', workouts: [{exerciseId: 'br', sets: 5, reps: 8, weight: 120, note: '네거티브 3~4초'}, {exerciseId: 'prow', sets: 4, reps: 8, weight: 100}, {exerciseId: 'tbar', sets: 4, reps: 10, weight: 100}, {exerciseId: 'sr', sets: 4, reps: 12, weight: 80}] },
      { id: 'kj_back_2', title: '등 (너비감 케이블/머신)', desc: '안전하고 강하게 광배근을 뽑아내는 훈련', workouts: [{exerciseId: 'pd', sets: 5, reps: 10, weight: 90, note: '네거티브 3~4초'}, {exerciseId: 'csr', sets: 4, reps: 12, weight: 70}, {exerciseId: 'apd', sets: 4, reps: 15, weight: 35}, {exerciseId: 'astpu', sets: 4, reps: 10, weight: 20}] },
      { id: 'kj_sh_1', title: '어깨 (고중량 숄더프레스)', desc: '밀어올리는 힘으로 삼각근 전체 사이즈업', workouts: [{exerciseId: 'spm', sets: 5, reps: 10, weight: 100, note: '네거티브 3~4초'}, {exerciseId: 'ohp', sets: 4, reps: 8, weight: 80}, {exerciseId: 'dp', sets: 4, reps: 10, weight: 35}, {exerciseId: 'uprow', sets: 4, reps: 12, weight: 50}] },
      { id: 'kj_sh_2', title: '어깨 (측/후면 입체 타격)', desc: '어깨 측면과 후면을 찢어놓는 디테일 루틴', workouts: [{exerciseId: 'lr', sets: 5, reps: 15, weight: 15}, {exerciseId: 'rpdf', sets: 5, reps: 15, weight: 50}, {exerciseId: 'bentover', sets: 4, reps: 15, weight: 15}, {exerciseId: 'clr', sets: 4, reps: 15, weight: 15}] },
      { id: 'kj_arm_1', title: '이두 (고중량 바벨컬)', desc: '무거운 바벨로 이두근의 매스를 극한으로 키움', workouts: [{exerciseId: 'bc', sets: 5, reps: 8, weight: 50, note: '네거티브 3~4초'}, {exerciseId: 'hc', sets: 4, reps: 10, weight: 25}, {exerciseId: 'dc', sets: 4, reps: 12, weight: 20}] },
      { id: 'kj_arm_2', title: '삼두 (헤비 프레스)', desc: '팔 둘레를 넓히는 고중량 삼두 프레스와 익스텐션', workouts: [{exerciseId: 'tc', sets: 5, reps: 10, weight: 50}, {exerciseId: 'sc', sets: 4, reps: 10, weight: 45, note: '네거티브 3~4초'}, {exerciseId: 'ct', sets: 4, reps: 12, weight: 35}] }
    ]
  },
  {
    id: 'k_kim_km', name: '김강민 (Kangmin Kim)', nickname: '나바의 왕', era: 'NABBA 프로전 5회 우승',
    desc: "NABBA 프로전에서 다섯 번 우승해 '나바의 왕'으로 불리는 보디빌더. 단점 없는 밸런스를 위해 고반복과 짧은 휴식으로 펌핑을 극대화하는 스타일이에요.",
    imageColor: 'from-amber-500 to-orange-800',
    split: '주 5~6일 · 부위별 분할 (고볼륨)',
    basis: '공개된 대회 이력과 체급 특성, 선수가 유튜브에서 보여준 훈련 스타일을 바탕으로 재구성한 루틴이에요. 선수 본인의 실제 루틴과 다를 수 있으니 정확한 방법은 선수 채널에서 확인해 주세요.',
    routines: [
      { id: 'kk_sh_1', title: '어깨 (쉬는 시간 없는 측면 폭격)', desc: '지독한 고반복으로 어깨 측면을 불태우는 볼륨 루틴', workouts: [{exerciseId: 'lr', sets: 8, reps: 20, weight: 8}, {exerciseId: 'clr', sets: 5, reps: 15, weight: 10}, {exerciseId: 'spm', sets: 4, reps: 15, weight: 50}, {exerciseId: 'uprow', sets: 4, reps: 15, weight: 30}] },
      { id: 'kk_sh_2', title: '어깨 (전/후면 입체 슈퍼세트)', desc: '전면과 후면을 번갈아 타격하여 펌핑 극대화', workouts: [{exerciseId: 'ohp', sets: 5, reps: 12, weight: 50}, {exerciseId: 'rpdf', sets: 5, reps: 20, weight: 35}, {exerciseId: 'fr', sets: 4, reps: 15, weight: 12}, {exerciseId: 'bentover', sets: 4, reps: 20, weight: 8}] },
      { id: 'kk_arm_1', title: '팔 (이두/삼두 터닝 슈퍼세트)', desc: '이두와 삼두를 쉬지 않고 번갈아 묶어서 진행', workouts: [{exerciseId: 'bc', sets: 5, reps: 15, weight: 30}, {exerciseId: 'tc', sets: 5, reps: 15, weight: 35}, {exerciseId: 'pcurl', sets: 4, reps: 15, weight: 20}, {exerciseId: 'ct', sets: 4, reps: 15, weight: 20}] },
      { id: 'kk_arm_2', title: '팔 (고립 자이언트 세트)', desc: '가벼운 무게로 혈류량을 폭발시키는 미친 펌핑감', workouts: [{exerciseId: 'dc', sets: 4, reps: 20, weight: 10}, {exerciseId: 'sc', sets: 4, reps: 15, weight: 25}, {exerciseId: 'hc', sets: 4, reps: 15, weight: 12}, {exerciseId: 'tkb', sets: 4, reps: 15, weight: 8}] },
      { id: 'kk_leg_1', title: '하체 (전면 고볼륨 서킷)', desc: '다리가 후들거릴 때까지 반복하는 대퇴사두 훈련', workouts: [{exerciseId: 'sq', sets: 5, reps: 15, weight: 100}, {exerciseId: 'le', sets: 5, reps: 25, weight: 50}, {exerciseId: 'lpd', sets: 4, reps: 20, weight: 200}, {exerciseId: 'goblet', sets: 4, reps: 15, weight: 25}] },
      { id: 'kk_leg_2', title: '하체 (둔근/햄스트링 고문)', desc: '탄탄한 둔근과 뒷다리를 위한 혹독한 프리웨이트', workouts: [{exerciseId: 'bss', sets: 5, reps: 15, weight: 20}, {exerciseId: 'rdl', sets: 4, reps: 15, weight: 80}, {exerciseId: 'lc', sets: 5, reps: 20, weight: 40}, {exerciseId: 'lunge', sets: 4, reps: 20, weight: 15}] },
      { id: 'kk_chest_1', title: '가슴 (인클라인 펌핑 집중)', desc: '가슴 윗부분을 꽉 채우는 고반복 인클라인', workouts: [{exerciseId: 'ip', sets: 5, reps: 12, weight: 70}, {exerciseId: 'idp', sets: 4, reps: 15, weight: 25}, {exerciseId: 'cf', sets: 5, reps: 20, weight: 20}, {exerciseId: 'pushup', sets: 3, reps: 20, weight: 0}] },
      { id: 'kk_chest_2', title: '가슴 (머신 프레스/플라이 볼륨)', desc: '머신을 이용해 가슴 근육에만 타격감을 집중', workouts: [{exerciseId: 'cpm', sets: 5, reps: 15, weight: 60}, {exerciseId: 'pdf', sets: 5, reps: 15, weight: 30}, {exerciseId: 'dips', sets: 4, reps: 15, weight: 0}, {exerciseId: 'dfly', sets: 4, reps: 15, weight: 15}] },
      { id: 'kk_back_1', title: '등 (너비감 극대화 턱걸이)', desc: '등의 넓이를 한계까지 뽑아내는 풀다운 계열', workouts: [{exerciseId: 'pu', sets: 5, reps: 12, weight: 0}, {exerciseId: 'pd', sets: 4, reps: 15, weight: 60}, {exerciseId: 'apd', sets: 4, reps: 15, weight: 25}, {exerciseId: 'cu', sets: 3, reps: 12, weight: 0}] },
      { id: 'kk_back_2', title: '등 (두께 및 승모 디테일)', desc: '오밀조밀한 등 근육의 디테일을 채우는 로우 훈련', workouts: [{exerciseId: 'sr', sets: 5, reps: 15, weight: 60}, {exerciseId: 'br', sets: 4, reps: 12, weight: 70}, {exerciseId: 'uprow', sets: 4, reps: 15, weight: 30}, {exerciseId: 'dr_back', sets: 4, reps: 15, weight: 25}] }
    ]
  }
];

const FOOD_DB = [
  { id: 'f1', name: '닭가슴살', category: '단백질', unit: '100g', calories: 109, protein: 23, carbs: 0, fat: 1.2, icon: '🍗', bgColor: 'bg-orange-100', txColor: 'text-orange-600' },
  { id: 'f2', name: '고구마 (삶은것)', category: '탄수화물', unit: '100g', calories: 86, protein: 1.6, carbs: 20, fat: 0.1, icon: '🍠', bgColor: 'bg-purple-100', txColor: 'text-purple-600' },
  { id: 'f3', name: '현미밥', category: '탄수화물', unit: '100g', calories: 111, protein: 2.6, carbs: 23, fat: 0.9, icon: '🍚', bgColor: 'bg-amber-100', txColor: 'text-amber-700' },
  { id: 'f4', name: '계란 (전란 1개)', category: '단백질/지방', unit: '50g', calories: 72, protein: 6.3, carbs: 0.4, fat: 4.8, icon: '🥚', bgColor: 'bg-yellow-100', txColor: 'text-yellow-700' },
  { id: 'f5', name: '브로콜리', category: '채소', unit: '100g', calories: 34, protein: 2.8, carbs: 6.6, fat: 0.4, icon: '🥦', bgColor: 'bg-emerald-100', txColor: 'text-emerald-700' },
  { id: 'f6', name: '아몬드', category: '지방', unit: '10g', calories: 58, protein: 2.1, carbs: 2.1, fat: 4.9, icon: '🥜', bgColor: 'bg-amber-200', txColor: 'text-amber-800' },
  { id: 'f7', name: '연어', category: '단백질/지방', unit: '100g', calories: 208, protein: 20, carbs: 0, fat: 13, icon: '🐟', bgColor: 'bg-rose-100', txColor: 'text-rose-600' },
  { id: 'f8', name: '오트밀', category: '탄수화물', unit: '100g', calories: 389, protein: 16, carbs: 66, fat: 6.9, icon: '🥣', bgColor: 'bg-stone-100', txColor: 'text-stone-600' },
  { id: 'f9', name: '소고기 우둔살', category: '단백질', unit: '100g', calories: 132, protein: 22, carbs: 0, fat: 4.5, icon: '🥩', bgColor: 'bg-red-100', txColor: 'text-red-600' },
  { id: 'f10', name: '바나나', category: '탄수화물', unit: '100g', calories: 89, protein: 1.1, carbs: 23, fat: 0.3, icon: '🍌', bgColor: 'bg-yellow-100', txColor: 'text-yellow-700' },
  { id: 'f11', name: '단백질 쉐이크', category: '단백질', unit: '1스쿱(30g)', calories: 120, protein: 24, carbs: 3, fat: 1.5, icon: '🥛', bgColor: 'bg-cyan-100', txColor: 'text-cyan-600' },
  { id: 'f12', name: '방울토마토', category: '채소', unit: '100g', calories: 16, protein: 0.9, carbs: 3.9, fat: 0.2, icon: '🍅', bgColor: 'bg-red-100', txColor: 'text-red-600' },
  { id: 'f13', name: '아보카도', category: '지방', unit: '100g', calories: 160, protein: 2, carbs: 8.5, fat: 14.7, icon: '🥑', bgColor: 'bg-emerald-200', txColor: 'text-emerald-800' },
  { id: 'f14', name: '틸라피아 (역돔)', category: '단백질', unit: '100g', calories: 96, protein: 20, carbs: 0, fat: 1.7, icon: '🐟', bgColor: 'bg-blue-100', txColor: 'text-blue-600' },
  { id: 'f15', name: '돼지고기 목살 (구이)', category: '단백질/지방', unit: '100g', calories: 268, protein: 17.2, carbs: 0, fat: 21.5, icon: '🥩', bgColor: 'bg-rose-200', txColor: 'text-rose-700' },
  { id: 'f16', name: '두부', category: '단백질', unit: '100g', calories: 84, protein: 8, carbs: 2, fat: 5.3, icon: '🧊', bgColor: 'bg-stone-100', txColor: 'text-stone-600' },
  { id: 'f17', name: '그릭요거트 (무가당)', category: '단백질', unit: '100g', calories: 90, protein: 10, carbs: 3, fat: 4, icon: '🥣', bgColor: 'bg-blue-50', txColor: 'text-blue-500' },
  { id: 'f18', name: '단호박 (찐것)', category: '탄수화물', unit: '100g', calories: 66, protein: 1.5, carbs: 15, fat: 0.2, icon: '🎃', bgColor: 'bg-amber-100', txColor: 'text-amber-600' },
  { id: 'f19', name: '호밀빵', category: '탄수화물', unit: '100g', calories: 259, protein: 8.5, carbs: 48, fat: 3.3, icon: '🍞', bgColor: 'bg-amber-200', txColor: 'text-amber-800' },
  { id: 'f20', name: '참치 캔 (기름뺀것)', category: '단백질', unit: '100g', calories: 116, protein: 25.5, carbs: 0, fat: 0.8, icon: '🥫', bgColor: 'bg-neutral-200', txColor: 'text-neutral-700' },
  { id: 'f21', name: '저지방 우유', category: '단백질/지방', unit: '100ml', calories: 43, protein: 3.4, carbs: 5, fat: 1, icon: '🥛', bgColor: 'bg-cyan-50', txColor: 'text-cyan-600' },
  { id: 'f22', name: '사과', category: '탄수화물', unit: '100g', calories: 52, protein: 0.3, carbs: 14, fat: 0.2, icon: '🍎', bgColor: 'bg-red-50', txColor: 'text-red-500' },
  { id: 'f23', name: '블루베리', category: '탄수화물', unit: '100g', calories: 57, protein: 0.7, carbs: 14.5, fat: 0.3, icon: '🫐', bgColor: 'bg-indigo-100', txColor: 'text-indigo-600' },
  { id: 'f24', name: '양배추', category: '채소', unit: '100g', calories: 25, protein: 1.3, carbs: 5.8, fat: 0.1, icon: '🥬', bgColor: 'bg-emerald-100', txColor: 'text-emerald-600' }
];

const SKIN_COLORS = ['#eec4a6', '#f6dccb', '#e0ab86', '#c98d64', '#a46a45', '#74472c'];
const SHIRT_COLORS = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#171717', '#ffffff', '#eab308', '#ec4899', '#06b6d4'];
const BOTTOM_COLORS = ['#171717', '#4b5563', '#1e3a8a', '#3b82f6', '#f3f4f6', '#a8a29e', '#7f1d1d'];
const ACC_COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#171717', '#ffffff', '#fbbf24', '#9ca3af', '#ec4899', '#06b6d4'];
const HAIR_COLORS = ['#171717', '#451a03', '#b45309', '#fcd34d', '#dc2626', '#e4e4e7', '#a855f7'];

const getExName = (exItem) => {
  if (!exItem) return '운동';
  if (typeof exItem === 'string') return exItem;
  if (exItem.exercise && exItem.exercise.name) return String(exItem.exercise.name);
  if (exItem.name) return String(exItem.name);
  return '운동';
};

const getExTarget = (exItem) => {
  if (!exItem) return '전신';
  if (exItem.exercise && exItem.exercise.target) return String(exItem.exercise.target);
  if (exItem.target) return String(exItem.target);
  return '전신';
};

const getExId = (exItem) => {
  if (!exItem) return '';
  if (exItem.exercise && exItem.exercise.id) return String(exItem.exercise.id);
  if (exItem.id) return String(exItem.id);
  return '';
};

// 세트 종류: 저장 값은 예전 그대로 W(워밍업)·-(메인)·D(드랍), 화면에는 한글로
const SET_TYPE_LABEL = { W: '워밍업', '-': '메인', D: '드랍' };
const SET_TYPE_STYLE = {
  W: 'text-sky-300 bg-sky-400/10 border-sky-400/40',
  '-': 'text-yellow-300 bg-yellow-400/10 border-yellow-400/50 shadow-[0_0_8px_rgba(250,204,21,0.35)]',
  D: 'text-rose-400 bg-rose-500/10 border-rose-500/50 shadow-[0_0_8px_rgba(244,63,94,0.3)]',
};

// 비상구 표지판 모양 아이콘 (운동 화면 최소화 버튼)
const EmergencyExitIcon = ({ className = 'w-7 h-7' }) => (
  <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
    <rect x="1" y="4" width="30" height="24" rx="5" fill="#10b981" />
    <rect x="20" y="8" width="8" height="16" rx="1" fill="#ecfdf5" />
    <rect x="22.2" y="10.2" width="3.6" height="13.8" fill="#047857" />
    <circle cx="11.5" cy="9.6" r="2.3" fill="#ecfdf5" />
    <path d="M11 12.6 L12.8 18.4 M8.2 14.6 L11.3 12.9 L14.8 15 M12.8 18.4 L16 21.4 L15.6 25 M12.8 18.4 L9.8 21.4 L6.6 22.2" fill="none" stroke="#ecfdf5" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// 종목의 중량 기준(바벨·덤벨·머신·맨몸). 종목표의 기구 정보를 우선 쓴다
const ruleOfEx = (exItem) => {
  const id = String(getExId(exItem));
  const opt = EXERCISE_OPTIONS.find(e => e.id === id);
  return weightRule(id, opt?.tool || exItem?.exercise?.tool || exItem?.tool);
};
const toolOfEx = (exItem) => {
  const id = String(getExId(exItem));
  return EXERCISE_OPTIONS.find(e => e.id === id)?.tool || exItem?.exercise?.tool || exItem?.tool;
};

// 동작 그림 썸네일에서 사람과 기구가 꽉 차게 보이도록 바닥선을 뺀 그림 영역으로 잘라낸다 (종목별로 한 번만 계산)
const MOTION_CROP_CACHE = new Map();
const motionFrameOf = (guide) => {
  const first = guide.steps[0][0];
  return (guide.steps.find(st => st[0] !== first) || guide.steps[0])[0];
};
const ExerciseMotionThumb = ({ exerciseId, size = 'w-14 h-14', showShadow = false }) => {
  const ref = useRef(null);
  const guide = EXERCISE_GUIDES[exerciseId];
  useLayoutEffect(() => {
    const svg = ref.current?.querySelector('svg');
    if (!svg) return;
    let vb = MOTION_CROP_CACHE.get(exerciseId);
    if (!vb) {
      let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
      Array.from(svg.children).slice(1).forEach(el => {
        try {
          const b = el.getBBox();
          if (!b.width && !b.height) return;
          x1 = Math.min(x1, b.x); y1 = Math.min(y1, b.y); x2 = Math.max(x2, b.x + b.width); y2 = Math.max(y2, b.y + b.height);
        } catch (e) {}
      });
      if (!isFinite(x1)) return;
      // getBBox는 굵은 선(팔다리) 두께를 빼고 재므로 여백을 넉넉히
      const side = Math.max(x2 - x1, y2 - y1) * 1.12 + 28;
      vb = `${(x1 + x2) / 2 - side / 2} ${(y1 + y2) / 2 - side / 2} ${side} ${side}`;
      MOTION_CROP_CACHE.set(exerciseId, vb);
    }
    svg.setAttribute('viewBox', vb);
  }, [exerciseId]);
  if (!guide || !PATTERNS[guide.pt]) return null;
  const pattern = { ...PATTERNS[guide.pt], ...(guide.eq ? { equip: guide.eq } : {}) };
  const ex = EXERCISE_OPTIONS.find(e => e.id === exerciseId);
  const muscles = ex ? getExerciseMuscles(ex) : { p: [], s: [] };
  return (
    <div ref={ref} className={`${size} bg-[#f3f4f7] rounded-xl flex items-center justify-center overflow-hidden border border-neutral-200 flex-shrink-0 ${showShadow ? 'shadow-md' : ''}`}>
      <PoseFigure pattern={pattern} frame={motionFrameOf(guide)} p={muscles.p} s={muscles.s} className="w-full h-full" />
    </div>
  );
};

// 종목 썸네일: 실제 동작(사람·기구) 그림을 먼저, 그 옆에 해부도로 주동근(진한 빨강)·협응근(연한 빨강)을 보여준다
const SmartExerciseThumbnail = ({ exerciseId, target, size = "w-14 h-14", showShadow = true, motion = true }) => {
  const exercise = EXERCISE_OPTIONS.find(e => e.id === exerciseId) || { id: exerciseId, name: '', target: target || '전신' };
  const muscleBox = (
    <div className={`${size} bg-[#f3f4f7] rounded-xl flex items-center justify-center overflow-hidden border border-neutral-200 flex-shrink-0 ${showShadow ? 'shadow-md' : ''}`}>
      <ExerciseMuscleMap exercise={exercise} />
    </div>
  );
  if (!motion || !EXERCISE_GUIDES[exerciseId]) return muscleBox;
  return (
    <div className="flex gap-1 flex-shrink-0">
      <ExerciseMotionThumb exerciseId={exerciseId} size={size} showShadow={showShadow} />
      {muscleBox}
    </div>
  );
};

// 근육 그림에서 부위를 누르면 고르는 세부 부위. match는 EXERCISE_OPTIONS의 target 문자열(또는 ids 목록)로 종목을 거른다.
const byIds = (ids) => (t, ex) => ids.includes(ex?.id);
const MUSCLE_SUBGROUPS = {
  '가슴': [
    { key: '상부', label: '윗가슴 (대흉근 상부)', desc: '인클라인 바벨·덤벨 프레스, 랜드마인 프레스', ids: ['ip', 'idp', 'sip', 'landmine_p'] },
    { key: '중부', label: '가슴 중앙 (중부·안쪽)', desc: '벤치프레스, 체스트 프레스, 플라이, 헥스 프레스', ids: ['bp', 'dp_chest', 'pdf', 'cpm', 'dfly', 'hex_press', 'cable_press', 'cable_fly_stand', 'floor_press', 'spoto_press', 'pushup', 'cg_bench'] },
    { key: '하부', label: '아랫가슴 (대흉근 하부)', desc: '딥스, 디클라인 벤치프레스, 케이블 크로스오버', ids: ['dips', 'dbp', 'cf'] },
  ],
  '등': [
    { key: '상부', label: '등 상부 (승모·능형근)', desc: '슈러그, 페이스 풀, 체스트 서포티드·씰 로우', ids: ['chest_row', 'seal_row', 'face_pull', 'shrug_bb', 'shrug_db', 'mag_lpd'] },
    { key: '중부', label: '등 중부 (광배 폭·두께)', desc: '풀업, 랫풀다운, 바벨·티바·시티드 로우', ids: ['pu', 'pd', 'br', 'sr', 'tbar', 'csr', 'cu', 'astpu', 'prow', 'meadows_row', 'inv_row', 'apd', 'pullover_mac'] },
    { key: '하부', label: '등 하부 (광배 하부·기립근)', desc: '원암·클로즈그립 랫풀다운, 덤벨 로우, 데드리프트', ids: ['onearm_lpd', 'cg_pd', 'dr_back', 'dl', 'rack_pull'] },
  ],
  '어깨': [
    { key: '전면', label: '전면 삼각근', desc: '오버헤드·숄더 프레스, 프론트 레이즈', match: t => t.startsWith('어깨') && /전면|전\//.test(t) },
    { key: '측면', label: '측면 삼각근', desc: '사이드 레터럴 레이즈, 업라이트 로우', match: t => t.startsWith('어깨') && t.includes('측면') },
    { key: '후면', label: '후면 삼각근', desc: '리버스 펙덱, 벤트오버 레이즈, 페이스 풀', match: t => (t.startsWith('어깨') && t.includes('후면')) || t.includes('후면삼각근') },
  ],
  '팔': [
    { key: '이두', label: '이두근', desc: '바벨·덤벨·해머 컬', match: t => t.startsWith('팔') && t.includes('이두') },
    { key: '삼두', label: '삼두근', desc: '푸시다운, 익스텐션, 킥백', match: t => t.startsWith('팔') && t.includes('삼두') },
  ],
  '하체': [
    { key: '전면', label: '전면 (대퇴사두)', desc: '스쿼트, 레그 프레스, 레그 익스텐션', match: t => t.startsWith('하체') && t.includes('전면') },
    { key: '후면', label: '후면 (햄스트링·둔근)', desc: '루마니안 데드리프트, 레그 컬, 힙 쓰러스트', match: t => t.startsWith('하체') && /후면|햄스트링|둔근/.test(t) },
  ],
};

// 해부도 스타일 근육 차트: 몸 왼쪽 절반(화면 기준)만 그리고 x=200 기준으로 좌우 반전해 대칭을 만든다.
// id는 종목 썸네일에서 강조할 세부 근육, group은 분석 탭 회복도 부위.
const ANATOMY_SKIN_HALF = 'M200,62 L189,64 C189,72 190,78 188,84 C176,88 160,90 148,94 C134,98 127,110 127,126 C126,142 126,160 124,176 C121,198 116,222 114,244 C111,254 109,264 112,274 C116,282 124,279 125,270 C126,260 128,251 131,242 C135,222 139,202 141,184 C143,170 146,160 150,148 C153,170 157,194 161,214 C159,228 154,240 154,256 C152,290 155,318 159,340 C157,366 159,396 165,424 L162,436 C170,442 186,442 189,436 L187,424 C190,400 193,372 190,346 C193,318 197,288 198,258 L200,254 Z';
// 몸 중앙선(x=200)은 빼고 바깥 윤곽만
const ANATOMY_OUTLINE_HALF = 'M189,64 C189,72 190,78 188,84 C176,88 160,90 148,94 C134,98 127,110 127,126 C126,142 126,160 124,176 C121,198 116,222 114,244 C111,254 109,264 112,274 C116,282 124,279 125,270 C126,260 128,251 131,242 C135,222 139,202 141,184 C143,170 146,160 150,148 C153,170 157,194 161,214 C159,228 154,240 154,256 C152,290 155,318 159,340 C157,366 159,396 165,424 L162,436 C170,442 186,442 189,436 L187,424 C190,400 193,372 190,346 C193,318 197,288 198,258';

// 전면 (그리는 순서가 곧 겹침 순서)
const ANATOMY_MUSCLES = [
  { id: 'lats', group: '등', d: 'M153,140 C151,160 155,186 160,210 C164,194 167,174 167,156 C162,149 158,143 153,140 Z', fibers: ['M156,150 C157,170 159,188 160,202'] },
  { id: 'traps', group: '등', d: 'M189,82 C178,88 166,91 156,93 C166,96 178,97 188,97 L190,86 Z', fibers: ['M186,88 L162,94'] },
  { id: 'serratus', group: '등', d: 'M166,152 L176,156 L174,162 L165,158 Z' },
  { id: 'serratus', group: '등', d: 'M166,162 L177,167 L175,173 L166,169 Z' },
  { id: 'serratus', group: '등', d: 'M167,172 L177,178 L176,184 L168,180 Z' },
  { id: 'obliques', group: '복근', d: 'M169,186 C166,202 166,218 168,232 C172,241 178,246 184,250 L183,188 C178,186 173,185 169,186 Z', fibers: ['M172,192 L181,212', 'M170,206 L181,226', 'M170,220 L181,240'] },
  { id: 'abs', group: '복근', d: 'M184,157 C190,154 196,154 198,155 L198,175 L184,176 Z' },
  { id: 'abs', group: '복근', d: 'M184,179 L198,178 L198,198 L184,199 Z' },
  { id: 'abs', group: '복근', d: 'M184,202 L198,201 L198,221 L184,222 Z' },
  { id: 'abs', group: '복근', d: 'M184,225 L198,224 L198,252 C193,250 188,248 184,246 Z' },
  { id: 'pec_lower', group: '가슴', d: 'M198,119 C184,119 168,121 153,123 C152,127 152,131 152,134 C160,147 176,153 190,151 C196,150 198,146 198,140 Z', fibers: ['M195,128 L155,128', 'M195,138 L157,136', 'M192,146 L162,141'] },
  { id: 'pec_upper', group: '가슴', d: 'M198,100 C186,97 170,97 160,101 C155,108 153,116 153,123 C168,121 184,119 198,119 Z', fibers: ['M195,106 L157,114', 'M195,114 L155,121'] },
  { id: 'delt_side', group: '어깨', d: 'M154,93 C138,96 128,108 128,124 C128,136 130,144 133,150 C134,134 138,118 146,104 C149,99 152,96 154,93 Z', fibers: ['M146,99 C137,110 132,124 132,142'] },
  { id: 'delt_front', group: '어깨', d: 'M154,93 C148,100 140,114 136,128 C134,138 134,146 136,155 C140,144 143,130 150,120 C155,112 160,104 161,97 Z', fibers: ['M155,100 C147,112 142,126 139,146'] },
  { id: 'triceps', group: '팔', d: 'M128,130 C127,146 127,160 126,172 L131,171 C131,156 131,142 131,132 Z' },
  { id: 'biceps', group: '팔', d: 'M140,116 C134,126 130,144 130,160 C130,170 133,177 139,178 C144,166 147,148 147,132 C147,124 144,118 140,116 Z', fibers: ['M139,122 C136,140 135,158 137,173'] },
  { id: 'forearm', group: '팔', d: 'M126,180 C121,198 117,220 115,242 L121,243 C124,222 129,202 134,184 Z', fibers: ['M126,190 L119,236'] },
  { id: 'forearm', group: '팔', d: 'M134,184 C130,204 125,224 122,243 L130,242 C134,222 138,204 141,186 Z', fibers: ['M136,192 L127,236'] },
  { id: 'adductors', group: '하체', d: 'M181,256 C186,274 191,290 194,302 C196,285 197,270 198,258 Z' },
  { id: 'quads', group: '하체', d: 'M157,256 C152,280 152,310 159,336 C164,322 168,296 168,272 C166,264 162,258 157,256 Z', fibers: ['M159,268 C157,290 158,310 161,328'] },
  { id: 'quads', group: '하체', d: 'M168,256 C165,282 167,310 175,334 C181,312 183,282 181,258 C177,254 172,254 168,256 Z', fibers: ['M174,262 C173,285 174,308 176,328'] },
  { id: 'quads', group: '하체', d: 'M186,300 C179,312 179,328 185,340 C191,336 194,322 191,306 Z' },
  { id: 'calves', group: '하체', d: 'M162,352 C157,368 158,386 163,402 C169,392 172,374 172,356 Z', fibers: ['M165,360 L165,394'] },
  { id: 'calves', group: '하체', d: 'M180,352 C182,370 184,388 187,398 C191,384 191,364 187,350 Z', fibers: ['M185,358 L187,390'] },
  { id: 'tibialis', group: '하체', d: 'M173,358 C171,380 172,400 176,420 L181,420 C180,400 179,378 178,358 Z' },
];

// 후면 (종목 썸네일 전용)
const ANATOMY_BACK_MUSCLES = [
  { id: 'lats', d: 'M150,142 C152,165 156,190 162,214 C170,210 180,200 192,190 L196,165 C186,150 168,144 150,142 Z', fibers: ['M156,150 C164,168 176,182 190,186', 'M154,164 C160,182 170,196 184,200'] },
  { id: 'midback', d: 'M160,106 C152,116 148,128 150,140 C160,140 172,136 184,128 C176,116 168,108 160,106 Z', fibers: ['M156,118 L178,128'] },
  { id: 'traps', d: 'M200,64 L190,66 C188,76 182,86 156,94 C168,100 182,112 192,140 L200,170 Z', fibers: ['M196,74 L162,94', 'M198,100 L172,104', 'M198,130 L186,116'] },
  { id: 'erectors', d: 'M190,172 C188,195 188,220 190,248 L198,250 L198,172 Z', fibers: ['M194,178 L194,244'] },
  { id: 'delt_rear', d: 'M154,93 C138,96 128,108 128,124 C128,136 131,146 136,154 C140,140 146,124 156,112 C160,106 160,99 158,95 Z', fibers: ['M152,100 C142,110 136,126 135,146'] },
  { id: 'triceps', d: 'M128,126 C126,142 126,160 127,176 C132,178 138,176 141,172 C143,158 144,140 142,124 C138,118 132,120 128,126 Z', fibers: ['M134,128 C133,146 133,160 134,172'] },
  { id: 'forearm', d: 'M126,182 C121,200 117,222 115,242 L129,242 C134,222 138,204 141,186 Z', fibers: ['M131,190 L122,236'] },
  { id: 'glutes', d: 'M161,216 C155,230 154,248 156,262 C168,272 186,272 198,262 L198,226 C188,220 174,216 161,216 Z', fibers: ['M164,228 C172,246 184,258 196,262'] },
  { id: 'hamstrings', d: 'M157,270 C154,294 156,316 162,338 C168,320 172,296 172,274 Z', fibers: ['M163,280 L164,330'] },
  { id: 'hamstrings', d: 'M174,274 C174,298 178,320 186,338 C192,318 196,294 196,272 Z', fibers: ['M185,282 L186,330'] },
  { id: 'calves', d: 'M161,348 C154,366 156,388 166,404 C172,392 175,372 175,352 Z', fibers: ['M165,358 L166,396'] },
  { id: 'calves', d: 'M178,350 C178,370 182,390 188,402 C193,386 193,366 189,348 Z', fibers: ['M184,358 L186,394'] },
];

// 종목별 주동근(p) / 협응근(s). 여기 없는 종목은 target 문자열로 추정한다.
const EXERCISE_MUSCLE_OVERRIDES = {
  sq: { p: ['quads', 'glutes'], s: ['hamstrings', 'adductors', 'erectors'] },
  fsq: { p: ['quads'], s: ['glutes', 'abs'] },
  zercher_sq: { p: ['quads'], s: ['glutes', 'abs', 'biceps'] },
  vsq: { p: ['quads'], s: ['glutes'] },
  hack_sq: { p: ['quads'], s: ['glutes'] },
  smith_sq: { p: ['quads'], s: ['glutes', 'adductors'] },
  lpd: { p: ['quads'], s: ['glutes', 'adductors'] },
  s_lpd: { p: ['quads', 'glutes'], s: ['hamstrings'] },
  goblet: { p: ['quads'], s: ['glutes', 'abs'] },
  pistol_sq: { p: ['quads'], s: ['glutes', 'abs'] },
  lunge: { p: ['quads', 'glutes'], s: ['hamstrings', 'adductors'] },
  walk_lunge: { p: ['quads', 'glutes'], s: ['hamstrings', 'adductors', 'abs'] },
  bss: { p: ['glutes', 'quads'], s: ['hamstrings', 'adductors'] },
  step_up: { p: ['glutes', 'quads'], s: ['hamstrings'] },
  rdl: { p: ['hamstrings', 'glutes'], s: ['erectors'] },
  stiff_dl: { p: ['hamstrings'], s: ['glutes', 'erectors'] },
  deficit_dl: { p: ['hamstrings', 'erectors'], s: ['glutes', 'traps', 'forearm'] },
  dl: { p: ['erectors', 'glutes', 'hamstrings'], s: ['traps', 'lats', 'forearm', 'quads'] },
  rack_pull: { p: ['erectors', 'traps'], s: ['glutes', 'lats', 'forearm'] },
  ht: { p: ['glutes'], s: ['hamstrings'] },
  glute_kick: { p: ['glutes'], s: ['hamstrings'] },
  kb_swing: { p: ['glutes', 'hamstrings'], s: ['erectors', 'delt_front'] },
  nordic_curl: { p: ['hamstrings'], s: ['calves'] },
  outh: { p: ['glutes'], s: [] },
  pu: { p: ['lats'], s: ['biceps', 'midback'] },
  cu: { p: ['lats'], s: ['biceps', 'midback'] },
  astpu: { p: ['lats'], s: ['biceps', 'midback'] },
  apd: { p: ['lats'], s: ['triceps'] },
  db_pullover: { p: ['lats', 'pec_lower'], s: ['triceps'] },
  pullover_mac: { p: ['lats'], s: ['triceps'] },
  shrug_bb: { p: ['traps'], s: ['forearm'] },
  shrug_db: { p: ['traps'], s: ['forearm'] },
  face_pull: { p: ['delt_rear', 'midback'], s: ['traps'] },
  ohp: { p: ['delt_front'], s: ['delt_side', 'triceps', 'traps'] },
  smith_ohp: { p: ['delt_front'], s: ['delt_side', 'triceps'] },
  spm: { p: ['delt_front'], s: ['delt_side', 'triceps'] },
  dp: { p: ['delt_front'], s: ['delt_side', 'triceps'] },
  arnold: { p: ['delt_front', 'delt_side'], s: ['triceps'] },
  z_press: { p: ['delt_front'], s: ['triceps', 'abs'] },
  landmine_p: { p: ['delt_front', 'pec_upper'], s: ['triceps'] },
  uprow: { p: ['delt_side', 'traps'], s: ['biceps'] },
  y_raise: { p: ['delt_side', 'traps'], s: ['delt_rear'] },
  cable_y: { p: ['traps', 'delt_rear'], s: ['delt_side'] },
  dips: { p: ['pec_lower', 'triceps'], s: ['delt_front'] },
  cg_bench: { p: ['triceps'], s: ['pec_lower', 'delt_front'] },
  spoto_press: { p: ['pec_lower', 'pec_upper'], s: ['triceps', 'delt_front'] },
  rcurl: { p: ['forearm'], s: ['biceps'] },
  hc: { p: ['biceps', 'forearm'], s: [] },
  zottman_curl: { p: ['biceps', 'forearm'], s: [] },
  farmers_walk: { p: ['forearm', 'traps'], s: ['abs'] },
  plank: { p: ['abs'], s: ['obliques', 'delt_front'] },
  abroll: { p: ['abs'], s: ['lats', 'obliques'] },
  dragon_flag: { p: ['abs'], s: ['obliques'] },
  tgu: { p: ['delt_front', 'abs'], s: ['glutes', 'obliques'] },
  battle_rope: { p: ['delt_front', 'delt_side'], s: ['abs', 'forearm'] },
};

const deriveMusclesFromTarget = (exercise) => {
  const t = String(exercise?.target || '');
  const name = String(exercise?.name || '');
  const group = t.split('(')[0];
  const sub = (t.match(/\((.*)\)/) || [])[1] || '';
  const isPress = /프레스|푸시업|딥스/.test(name);
  if (group === '가슴') {
    const p = sub.includes('상부') ? ['pec_upper'] : sub.includes('하부') ? ['pec_lower'] : ['pec_upper', 'pec_lower'];
    return { p, s: isPress ? ['delt_front', 'triceps'] : ['delt_front'] };
  }
  if (group === '등') {
    if (sub.includes('승모')) return { p: ['traps', 'midback'], s: ['lats', 'biceps', 'delt_rear'] };
    if (sub.includes('광배')) return { p: ['lats'], s: ['biceps', 'midback', 'delt_rear'] };
    return { p: ['lats', 'midback'], s: ['biceps', 'traps', 'delt_rear', 'erectors'] };
  }
  if (group === '어깨') {
    const p = [];
    if (/전면|전\//.test(sub)) p.push('delt_front');
    if (sub.includes('측면')) p.push('delt_side');
    if (sub.includes('후면')) p.push('delt_rear');
    return { p: p.length ? p : ['delt_front', 'delt_side'], s: ['traps'] };
  }
  if (group === '팔') {
    if (sub.includes('삼두')) return { p: ['triceps'], s: [] };
    if (sub.includes('전완')) return { p: ['forearm'], s: [] };
    return { p: ['biceps'], s: ['forearm'] };
  }
  if (group === '복근') {
    if (sub.includes('외복사근')) return { p: ['obliques'], s: ['abs'] };
    return { p: ['abs'], s: ['obliques'] };
  }
  if (group === '하체') {
    if (sub.includes('내전근')) return { p: ['adductors'], s: [] };
    if (sub.includes('종아리')) return { p: ['calves'], s: [] };
    if (sub.includes('후면') || sub.includes('햄스트링')) return { p: ['hamstrings'], s: ['glutes'] };
    if (sub.includes('둔근')) return { p: ['glutes'], s: ['hamstrings'] };
    return { p: ['quads'], s: ['glutes'] };
  }
  return { p: ['abs', 'delt_front'], s: ['glutes', 'quads'] };
};

const getExerciseMuscles = (exercise) => EXERCISE_MUSCLE_OVERRIDES[exercise?.id] || deriveMusclesFromTarget(exercise);

const MUSCLE_LABELS = {
  pec_upper: '윗가슴', pec_lower: '가슴 중·하부', delt_front: '전면 삼각근', delt_side: '측면 삼각근', delt_rear: '후면 삼각근',
  biceps: '이두근', triceps: '삼두근', forearm: '전완근', abs: '복직근', obliques: '복사근', serratus: '전거근',
  lats: '광배근', traps: '승모근', midback: '등 중앙(능형근)', erectors: '척추기립근', quads: '대퇴사두근',
  adductors: '내전근', glutes: '둔근', hamstrings: '햄스트링', calves: '종아리', tibialis: '전경골근',
};

const BACK_VIEW_MUSCLES = ['delt_rear', 'triceps', 'lats', 'traps', 'midback', 'erectors', 'glutes', 'hamstrings', 'calves'];
const FRONT_VIEW_MUSCLES = ['pec_upper', 'pec_lower', 'delt_front', 'delt_side', 'biceps', 'abs', 'obliques', 'serratus', 'quads', 'adductors', 'tibialis'];
const LOWER_BODY_MUSCLES = ['quads', 'adductors', 'glutes', 'hamstrings', 'calves', 'tibialis'];

// 주동근이 잘 보이는 면(앞/뒤)과 확대 영역을 고른다
const getExerciseMuscleView = ({ p, s }) => {
  const score = (list, w) => list.reduce((acc, id) => acc + (BACK_VIEW_MUSCLES.includes(id) ? w : 0) - (FRONT_VIEW_MUSCLES.includes(id) ? w : 0), 0);
  // 주동근끼리 앞뒤가 비기면(예: 스쿼트의 대퇴사두+둔근) 앞면을 보여준다
  const primaryScore = score(p, 1);
  const side = primaryScore > 0 || (primaryScore === 0 && p.every(id => !FRONT_VIEW_MUSCLES.includes(id)) && score(s, 1) > 0) ? 'back' : 'front';
  const lower = p.filter(id => LOWER_BODY_MUSCLES.includes(id)).length;
  const thighOnly = p.every(id => ['quads', 'adductors', 'glutes', 'hamstrings'].includes(id));
  const crop = lower === p.length ? (thighOnly ? 'thigh' : 'lower') : lower === 0 ? 'upper' : 'full';
  return { side, crop };
};

const MUSCLE_THUMB_VIEWBOX = { upper: '104 58 192 192', thigh: '118 204 164 164', lower: '86 212 228 228', full: '72 62 256 300' };

const ExerciseMuscleMap = ({ exercise, className = 'w-full h-full' }) => {
  const muscles = getExerciseMuscles(exercise);
  const { side, crop } = getExerciseMuscleView(muscles);
  const list = side === 'back' ? ANATOMY_BACK_MUSCLES : ANATOMY_MUSCLES;
  const fillFor = (id) => muscles.p.includes(id) ? '#e5484d' : muscles.s.includes(id) ? '#f3a29b' : '#d5d9e0';
  const half = (
    <>
      <path d={ANATOMY_SKIN_HALF} fill="#eceef2" />
      {list.map((m, i) => (
        <g key={i}>
          <path d={m.d} fill={fillFor(m.id)} stroke="#9aa3b2" strokeOpacity="0.7" strokeWidth="0.9" strokeLinejoin="round" />
          <path d={m.d} fill="url(#thumbShade)" />
          {(m.fibers || []).map((f, j) => <path key={j} d={f} fill="none" stroke="#475569" strokeOpacity="0.18" strokeWidth="0.8" strokeLinecap="round" />)}
        </g>
      ))}
      <path d={ANATOMY_OUTLINE_HALF} fill="none" stroke="#9aa3b2" strokeWidth="1.2" strokeLinejoin="round" />
    </>
  );
  return (
    <svg viewBox={MUSCLE_THUMB_VIEWBOX[crop]} className={className} aria-hidden="true">
      <defs>
        <radialGradient id="thumbShade" cx="42%" cy="35%" r="75%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
          <stop offset="55%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="100%" stopColor="#1e293b" stopOpacity="0.18" />
        </radialGradient>
      </defs>
      <ellipse cx="200" cy="40" rx="20" ry="25" fill="#eceef2" stroke="#9aa3b2" strokeWidth="1.2" />
      <g>{half}</g>
      <g transform="matrix(-1 0 0 1 400 0)">{half}</g>
    </svg>
  );
};

const AnimeMuscleBodySVG = ({ recoveryData, onMuscleClick }) => {
  const getRecoveryPercent = (group) => recoveryData[group]?.percent ?? 100;


  const getFillColor = (perc) => {
    if (perc <= 30) return '#ef4f4f'; // 피로 (붉게 충혈된 근육)
    if (perc <= 60) return '#f8c544'; // 회복 중
    if (perc <= 90) return '#7ee0a2'; // 거의 회복
    return '#edd3ca'; // 완전 회복 (차분한 근육 톤)
  };

  const partsInfo = [
    { id: '어깨', title: '어깨', side: 'left', y: 80, target: [138, 112] },
    { id: '가슴', title: '가슴', side: 'right', y: 110, target: [228, 124] },
    { id: '등', title: '등', side: 'left', y: 145, target: [158, 172] },
    { id: '복근', title: '복근', side: 'right', y: 175, target: [209, 200] },
    { id: '팔', title: '팔', side: 'left', y: 215, target: [125, 212] },
    { id: '하체', title: '하체', side: 'right', y: 300, target: [226, 296] }
  ];

  const fillFor = (group) => getFillColor(getRecoveryPercent(group));

  const renderHalf = () => (
    <>
      <path d={ANATOMY_SKIN_HALF} fill="url(#anatSkin)" />
      {ANATOMY_MUSCLES.map((m, i) => (
        <g key={`m-${i}`} onClick={() => onMuscleClick(m.group)} className="cursor-pointer transition-all duration-300 hover:brightness-110 hover:saturate-150">
          <path d={m.d} fill={fillFor(m.group)} stroke="#8a4b42" strokeOpacity="0.55" strokeWidth="0.9" strokeLinejoin="round" />
          <path d={m.d} fill="url(#anatShade)" pointerEvents="none" />
          {(m.fibers || []).map((f, j) => (
            <path key={`f-${j}`} d={f} fill="none" stroke="#7a2e26" strokeOpacity="0.22" strokeWidth="0.8" strokeLinecap="round" pointerEvents="none" />
          ))}
        </g>
      ))}
      {/* 슬개골, 쇄골, 흉쇄유돌근 */}
      <ellipse cx="176" cy="344" rx="6.5" ry="7.5" fill="#f3e3da" stroke="#a1887f" strokeOpacity="0.6" strokeWidth="0.8" />
      <path d="M197,92 C185,92 170,91 156,94" fill="none" stroke="#a1887f" strokeOpacity="0.55" strokeWidth="1" strokeLinecap="round" />
      <path d="M191,66 C192,74 194,84 197,92" fill="none" stroke="#a1887f" strokeOpacity="0.45" strokeWidth="1" strokeLinecap="round" />
    </>
  );

  return (
    <div className="relative w-full h-full flex items-center justify-center py-4">
      <div className="relative w-full max-w-[360px] aspect-[400/450]">
      <svg viewBox="0 0 400 450" className="absolute inset-0 w-full h-full">
        <defs>
          <linearGradient id="anatSkin" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ead6cc" />
            <stop offset="100%" stopColor="#f6ebe4" />
          </linearGradient>
          <radialGradient id="anatShade" cx="42%" cy="35%" r="75%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
            <stop offset="55%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="100%" stopColor="#3b0d08" stopOpacity="0.28" />
          </radialGradient>
        </defs>

        {partsInfo.map(part => {
          const startX = part.side === 'left' ? 110 : 290;
          return (
            <g key={`line-${part.id}`}>
              <path d={`M ${startX} ${part.y} L ${part.target[0]} ${part.target[1]}`} stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 3" fill="none" />
            </g>
          );
        })}

        {/* 머리 */}
        <ellipse cx="200" cy="40" rx="20" ry="25" fill="url(#anatSkin)" stroke="#a1887f" strokeWidth="1.2" />
        <path d="M181,42 C178,40 177,46 180,50 M219,42 C222,40 223,46 220,50" fill="none" stroke="#a1887f" strokeWidth="1" strokeLinecap="round" />

        <g>{renderHalf()}</g>
        <g transform="matrix(-1 0 0 1 400 0)">{renderHalf()}</g>

        {/* 실루엣 외곽선 (좌우) */}
        <path d={ANATOMY_OUTLINE_HALF} fill="none" stroke="#a1887f" strokeWidth="1.2" strokeLinejoin="round" />
        <path d={ANATOMY_OUTLINE_HALF} transform="matrix(-1 0 0 1 400 0)" fill="none" stroke="#a1887f" strokeWidth="1.2" strokeLinejoin="round" />
        <ellipse cx="200" cy="226" rx="1.6" ry="2.4" fill="#a1887f" opacity="0.6" />

        {partsInfo.map(part => (
          <circle key={`dot-${part.id}`} cx={part.target[0]} cy={part.target[1]} r="2.5" fill="#475569" stroke="#ffffff" strokeWidth="1" pointerEvents="none" />
        ))}

      </svg>
      {/* 라벨은 SVG 밖에 겹쳐 그린다: 지시선 끝(x=110 / x=290)에 맞춰 좌우 대칭 */}
      {partsInfo.map(part => {
        const perc = getRecoveryPercent(part.id);
        const pos = part.side === 'left' ? { right: `${(290 / 400) * 100}%` } : { left: `${(290 / 400) * 100}%` };
        return (
          <button key={`label-${part.id}`} onClick={() => onMuscleClick(part.id)} style={{ ...pos, top: `${(part.y / 450) * 100}%` }}
            className="absolute -translate-y-1/2 flex items-center gap-1.5 bg-white/95 px-2.5 py-1.5 rounded-xl border border-neutral-200 shadow-sm cursor-pointer hover:border-[#4768ff] hover:shadow-md transition-[border-color,box-shadow] whitespace-nowrap">
            <span className="text-[11px] font-black text-neutral-700">{part.title}</span>
            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md border ${perc === 100 ? 'bg-slate-50 text-slate-500 border-slate-200' : perc >= 80 ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : perc >= 50 ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-rose-50 text-rose-600 border-rose-200'}`}>{perc}%</span>
          </button>
        );
      })}
      </div>
    </div>
  );
};

export default function App() {
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
  const [workoutMinimized, setWorkoutMinimized] = useState(false); // 운동 중에 잠깐 다른 화면을 보는 중
  const [pendingWorkoutStart, setPendingWorkoutStart] = useState(null); // 진행 중인 운동이 있을 때 새 운동 시작을 확인
  const [overtimeSec, setOvertimeSec] = useState(null); // 휴식이 끝난 뒤 지난 시간(초). null이면 초과 아님
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
  const [muscleConfirmModal, setMuscleConfirmModal] = useState(null); // { group, sub? }
  const [muscleSubPicker, setMuscleSubPicker] = useState(null); // 세부 부위 선택 팝업이 열린 부위
  const [isExitConfirmOpen, setIsExitConfirmOpen] = useState(false);
  const [selectedLegendModal, setSelectedLegendModal] = useState(null);
  const [substituteModalEx, setSubstituteModalEx] = useState(null);
  const [guideExerciseId, setGuideExerciseId] = useState(null); // 운동 설명서 팝업
  const [isPhotoCardModalOpen, setIsPhotoCardModalOpen] = useState(false);
  const [photoCardTheme, setPhotoCardTheme] = useState('neon');
  const [photoCardData, setPhotoCardData] = useState(null);
  const [isAiCoachOpen, setIsAiCoachOpen] = useState(false);
  const [activeRankingTab, setActiveRankingTab] = useState('global');
  const [rankingSortBy, setRankingSortBy] = useState('volume');
  const [isFriendSearchModalOpen, setIsFriendSearchModalOpen] = useState(false);
  const [friendSearchQuery, setFriendSearchQuery] = useState('');
  const [cheersData, setCheersData] = useState({});
  const [cloudUser, setCloudUser] = useState(null); // 로그인한 회원 { id, email }
  const [cloudReady, setCloudReady] = useState(false); // 클라우드 기록을 다 불러온 뒤에만 저장한다
  const [authChecking, setAuthChecking] = useState(true); // 첫 화면에서 로그인 상태 확인 중
  const [authBusy, setAuthBusy] = useState(false);
  const [authNotice, setAuthNotice] = useState('');
  const [signupNickname, setSignupNickname] = useState('');
  const [recoveryMode, setRecoveryMode] = useState(false); // 비밀번호 재설정 메일로 들어온 경우
  const [friendState, setFriendState] = useState({ friends: [], sent: [], incoming: [] });
  const [rankProfiles, setRankProfiles] = useState([]); // 랭킹에 보이는 회원들
  const [extraProfiles, setExtraProfiles] = useState({}); // 친구·요청 보낸 사람 프로필
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

  useEffect(() => {
    if (currentScreen === 'workout') setWorkoutMinimized(false);
    if (currentScreen === 'workout' || workoutMinimized) {
      sessionTimerRef.current = setInterval(() => setWorkoutDurationSec(prev => prev + 1), 1000);
    } else {
      clearInterval(sessionTimerRef.current);
    }
    return () => clearInterval(sessionTimerRef.current);
  }, [currentScreen, workoutMinimized]);

  useEffect(() => {
    if (isTimerActive && timeLeft > 0) {
      timerRef.current = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && isTimerActive) {
      setIsTimerActive(false);
      clearInterval(timerRef.current);
      try {
        alarmStopRef.current?.();
        setAlarmRinging(true);
        alarmStopRef.current = playAlarm(timerSettings, () => { setAlarmRinging(false); alarmStopRef.current = null; });
      } catch(e) { console.error("오디오 알림 실패", e); }
      showToast("⏱️ 휴식 종료! 다음 세트를 준비하세요.");
      setOvertimeSec(0);
    }
    // 끝나기 3초 전부터 카운트다운
    if (isTimerActive && timeLeft > 0 && timeLeft <= 3 && timerSettings.countdown) {
      try { playTick(timerSettings.volume, timeLeft === 1); } catch (e) {}
    }
    return () => clearInterval(timerRef.current);
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
    const t = setInterval(() => setOvertimeSec(prev => (prev === null ? null : prev >= 1800 ? null : prev + 1)), 1000);
    return () => clearInterval(t);
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
  const getWorkoutStreak = () => {
    const d = new Date();
    if (!pastWorkoutDates.includes(formatDate(d))) d.setDate(d.getDate() - 1);
    let streak = 0;
    while (pastWorkoutDates.includes(formatDate(d))) {
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
      setRankProfiles([]);
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
    const cleanSession = src.map(ex => ({
      id: String(ex.id || Date.now()),
      exercise: { id: String(getExId(ex)), name: String(getExName(ex)), target: String(getExTarget(ex)), tool: String(ex.exercise?.tool || ex.tool || '바벨') },
      sets: (ex.sets || []).map(s => ({ id: String(s.id || Date.now()), type: String(s.type || '-'), weight: String(s.weight || '0'), reps: String(s.reps || '0'), rpe: String(s.rpe || ''), completed: Boolean(s.completed) }))
    }));
    const dateKey = String(currentDate);
    setCurrentUser(prev => {
      const existingWorkouts = prev.workouts || {};
      const workoutTimes = dateKey === formatDate(new Date()) ? { ...(prev.workoutTimes || {}), [dateKey]: new Date().toISOString() } : (prev.workoutTimes || {});
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
              return { ...s, completed: !s.completed, ...(auto !== null ? { rpe: String(auto), rpeAuto: true } : {}) };
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
      exercises: sessionData.map(e => getExName(e))
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
    const factor = foodWeight / 100;
    const foodItem = {
      id: Date.now().toString(), foodId: String(selectedFood.id), name: String(selectedFood.name), icon: String(selectedFood.icon),
      weight: Number(foodWeight), calories: Math.round(selectedFood.calories * factor),
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
    showToast(`${selectedFood.name} ${foodWeight}g이 식단에 추가되었습니다.`);
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
    const lastDate = pastWorkoutDates[0];
    const last_routine = lastDate ? {
      date: lastDate,
      items: safeWorkouts[lastDate].slice(0, 12).map(ex => ({
        id: String(getExId(ex)), name: getExName(ex), target: getExTarget(ex), tool: String(ex.exercise?.tool || ex.tool || ''),
        sets: (ex.sets || []).slice(0, 10).map(st => ({ weight: String(st.weight || ''), reps: String(st.reps || '') })),
      })),
    } : null;
    return {
      nickname: String(currentUser?.profile?.nickname || '짐스피릿 유저').slice(0, 20),
      avatar: currentUser?.profile || {},
      week_start: cloud.mondayKey(), weekly_volume: Math.round(vol || 0), lift3: getTotalLift3() || 0, fav, last_routine,
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

  // 랭킹 탭을 열 때마다 최신 순위와 이번 주 응원 수를 불러온다
  useEffect(() => {
    if (activeTab !== 'ranking') return undefined;
    let alive = true;
    setRankLoading(true);
    Promise.all([cloud.fetchRanking(), cloud.fetchCheerCounts()])
      .then(([profs, cheers]) => { if (!alive) return; setRankProfiles(profs.map(p => cloud.toRankUser(p))); setCheersData(cheers); })
      .catch(() => { if (alive) showToast('랭킹을 불러오지 못했어요. 인터넷 연결을 확인해 주세요.'); })
      .finally(() => { if (alive) setRankLoading(false); });
    return () => { alive = false; };
  }, [activeTab, cloudUser]);

  const profilesById = { ...Object.fromEntries(rankProfiles.map(u => [u.id, u])), ...extraProfiles };

  const globalOverlays = (
    <>
      {guideExerciseId && (() => {
        const ex = EXERCISE_OPTIONS.find(e => e.id === guideExerciseId);
        const guide = EXERCISE_GUIDES[guideExerciseId];
        if (!ex || !guide) return null;
        const muscles = getExerciseMuscles(ex);
        const pattern = { ...PATTERNS[guide.pt], ...(guide.eq ? { equip: guide.eq } : {}) };
        const pickFromList = isAddExerciseModalOpen;
        return (
          <div className="fixed inset-0 bg-black/70 z-[96] flex flex-col justify-end animate-fade-in" onClick={() => setGuideExerciseId(null)}>
            <div className="bg-white text-neutral-900 w-full max-w-lg mx-auto h-[92vh] rounded-t-[36px] flex flex-col shadow-[0_-20px_50px_rgba(0,0,0,0.5)] animate-slide-up overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-neutral-100">
                <SmartExerciseThumbnail exerciseId={ex.id} size="w-14 h-14" showShadow={false} motion={false} />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-black text-[#4768ff] mb-0.5">운동 설명서</p>
                  <h2 className="text-xl font-black tracking-tight truncate">{ex.name}</h2>
                  <p className="text-xs font-bold text-neutral-400">{ex.target} · {ex.tool}</p>
                </div>
                <button onClick={() => setGuideExerciseId(null)} className="p-2 bg-neutral-100 rounded-full hover:bg-neutral-200 transition-colors active:scale-90 self-start"><X className="w-5 h-5 text-neutral-500"/></button>
              </div>

              <div className="flex-1 overflow-y-auto bg-neutral-50 px-5 py-5 space-y-5">
                <p className="text-sm font-bold text-neutral-600 leading-relaxed">{guide.sum}</p>

                <div className="flex flex-wrap gap-1.5">
                  {muscles.p.map(id => <span key={`p-${id}`} className="text-[11px] font-black text-white bg-[#e5484d] px-2 py-1 rounded-lg">{MUSCLE_LABELS[id]}</span>)}
                  {muscles.s.map(id => <span key={`s-${id}`} className="text-[11px] font-black text-[#c2373b] bg-[#fde3e1] px-2 py-1 rounded-lg">{MUSCLE_LABELS[id]}</span>)}
                </div>

                <div>
                  <h3 className="text-sm font-black text-neutral-900 mb-3">운동 방법</h3>
                  <ol className="space-y-3">
                    {guide.steps.map(([frame, title, desc, ghost], i) => (
                      <li key={i} className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
                        <div className="relative bg-[#f6f7f9] border-b border-neutral-100">
                          <span className="absolute top-2.5 left-2.5 text-[11px] font-black text-white bg-neutral-900 px-2 py-0.5 rounded-md">{i + 1}단계</span>
                          <PoseFigure pattern={pattern} frame={frame} ghost={ghost} p={muscles.p} s={muscles.s} className="w-full h-auto max-h-56 mx-auto block" />
                        </div>
                        <div className="p-4">
                          <h4 className="font-black text-neutral-900 mb-1">{title}</h4>
                          <p className="text-sm font-medium text-neutral-600 leading-relaxed">{desc}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>

                {guide.tips?.length > 0 && (
                  <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                    <h3 className="text-sm font-black text-[#3550d6] mb-2 flex items-center gap-1.5"><Lightbulb className="w-4 h-4"/> 잘하는 요령</h3>
                    <ul className="space-y-1.5">
                      {guide.tips.map((tip, i) => <li key={i} className="text-sm font-medium text-neutral-700 leading-relaxed">• {tip}</li>)}
                    </ul>
                  </div>
                )}
                {guide.warn && (
                  <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4">
                    <h3 className="text-sm font-black text-rose-600 mb-1.5 flex items-center gap-1.5"><AlertTriangle className="w-4 h-4"/> 주의</h3>
                    <p className="text-sm font-medium text-neutral-700 leading-relaxed">{guide.warn}</p>
                  </div>
                )}
                <p className="text-[11px] font-bold text-neutral-400 text-center pb-2">빨간색은 주로 쓰는 근육, 연한 빨간색은 함께 쓰는 근육입니다. 파란 화살표는 움직이는 방향입니다.</p>
              </div>

              <div className="p-4 bg-white border-t border-neutral-100 flex gap-2">
                <button onClick={() => setGuideExerciseId(null)} className="flex-1 py-3.5 bg-neutral-100 text-neutral-600 font-black rounded-xl hover:bg-neutral-200 transition-colors active:scale-95">닫기</button>
                {pickFromList && (
                  <button onClick={() => { setGuideExerciseId(null); swapTargetExerciseId ? swapExercise(ex) : addExerciseFromModal(ex); }} className="flex-[2] py-3.5 bg-[#4768ff] text-white font-black rounded-xl shadow-[0_10px_25px_rgba(71,104,255,0.3)] hover:bg-blue-600 transition-colors active:scale-95">{swapTargetExerciseId ? '이 종목으로 변경' : '이 종목 추가하기'}</button>
                )}
              </div>
            </div>
          </div>
        );
      })()}
        <FriendCenter open={isFriendSearchModalOpen} onClose={() => setIsFriendSearchModalOpen(false)} isCloud={!!cloudUser} onLogin={goToSignup}
          friends={friendState.friends} sent={friendState.sent} incoming={friendState.incoming} profilesById={profilesById}
          onSearch={async (q) => (await cloud.searchProfiles(q, cloudUser?.id)).map(p => cloud.toRankUser(p))}
          onRequest={sendFriendRequest} onAccept={acceptFriend} onDecline={declineFriend} onRemove={removeFriendship} onInvite={inviteFriends} Avatar3={FullBodyAvatar} />
        {alarmRinging && (
          <button onClick={stopAlarm} className="fixed left-1/2 -translate-x-1/2 bottom-36 z-[95] px-5 py-3 rounded-full bg-rose-500 text-white font-black text-sm shadow-[0_10px_30px_rgba(244,63,94,0.5)] flex items-center gap-2 animate-bounce">
            <Bell className="w-4 h-4" /> 알람 끄기
          </button>
        )}
        {isAlarmSettingsOpen && (
          <div className="fixed inset-0 bg-black/70 z-[90] flex flex-col justify-end animate-fade-in" onClick={() => { stopAlarm(); setIsAlarmSettingsOpen(false); }}>
            <div className="bg-neutral-900 text-white w-full max-w-md mx-auto rounded-t-[32px] p-6 pb-10 border-t border-neutral-800 animate-slide-up max-h-[88vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex justify-center mb-4"><div className="w-12 h-1.5 bg-neutral-700 rounded-full"></div></div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-xl font-black flex items-center gap-2"><Bell className="w-5 h-5 text-emerald-400" /> 휴식 알람 설정</h3>
                <button onClick={() => { stopAlarm(); setIsAlarmSettingsOpen(false); }} className="p-2 bg-neutral-800 rounded-full text-neutral-400"><X className="w-5 h-5" /></button>
              </div>
              <p className="text-xs font-bold text-neutral-500 mb-5">소리를 누르면 미리 들어볼 수 있어요.</p>

              <p className="text-xs font-black text-neutral-400 mb-2">알람 소리</p>
              <div className="grid grid-cols-2 gap-2 mb-2">
                {ALARM_SOUNDS.map(a => (
                  <button key={a.id} onClick={() => { updateTimerSettings({ sound: a.id }); previewAlarm({ sound: a.id }); }}
                    className={`text-left p-3 rounded-2xl border transition-all active:scale-[0.97] ${timerSettings.sound === a.id ? 'bg-emerald-500/15 border-emerald-500' : 'bg-neutral-950 border-neutral-800 hover:border-neutral-600'}`}>
                    <div className="text-lg mb-0.5">{a.emoji}</div>
                    <div className="text-sm font-black">{a.label}</div>
                    <div className="text-[10px] font-bold text-neutral-500 leading-snug">{a.desc}</div>
                  </button>
                ))}
              </div>
              <p className="text-[10px] font-bold text-neutral-500 mb-5 leading-relaxed">음성 멘트는 기기에 내장된 음성으로 읽어 줘요. 실제 인물의 목소리는 아니에요. 아이폰은 무음 모드를 끄면 들려요.</p>

              <p className="text-xs font-black text-neutral-400 mb-2">울리는 길이</p>
              <div className="grid grid-cols-4 gap-2 mb-5">
                {REPEAT_OPTIONS.map(o => (
                  <button key={o.value} onClick={() => updateTimerSettings({ repeat: o.value })} className={`py-2.5 rounded-xl border text-center transition-all ${timerSettings.repeat === o.value ? 'bg-emerald-500 text-neutral-950 border-emerald-500' : 'bg-neutral-950 border-neutral-800 text-neutral-300'}`}>
                    <div className="text-xs font-black">{o.label}</div>
                    <div className={`text-[10px] font-bold ${timerSettings.repeat === o.value ? 'text-neutral-800' : 'text-neutral-500'}`}>{o.desc}</div>
                  </button>
                ))}
              </div>

              <p className="text-xs font-black text-neutral-400 mb-2">소리 크기 <span className="text-neutral-500">{Math.round(timerSettings.volume * 100)}%</span></p>
              <input type="range" min="0.1" max="1" step="0.1" value={timerSettings.volume} onChange={e => updateTimerSettings({ volume: parseFloat(e.target.value) })} className="w-full accent-emerald-500 mb-5" />

              <p className="text-xs font-black text-neutral-400 mb-2">세트 완료 후 기본 휴식 시간</p>
              <div className="grid grid-cols-4 gap-2 mb-5">
                {REST_OPTIONS.map(sec => (
                  <button key={sec} onClick={() => updateTimerSettings({ defaultRest: sec })} className={`py-2.5 rounded-xl border text-xs font-black transition-all ${timerSettings.defaultRest === sec ? 'bg-emerald-500 text-neutral-950 border-emerald-500' : 'bg-neutral-950 border-neutral-800 text-neutral-300'}`}>{sec >= 60 ? `${sec / 60}분` : `${sec}초`}</button>
                ))}
              </div>

              {[['countdown', '끝나기 3초 전 카운트다운', '3·2·1 짧은 신호음'], ['vibrate', '진동', '안드로이드 휴대폰에서 지원돼요']].map(([key, label, desc]) => (
                <button key={key} onClick={() => updateTimerSettings({ [key]: !timerSettings[key] })} className="w-full flex items-center justify-between py-3 border-t border-neutral-800">
                  <span className="text-left"><span className="block text-sm font-black">{label}</span><span className="block text-[11px] font-bold text-neutral-500">{desc}</span></span>
                  <span className={`w-12 h-7 rounded-full p-1 transition-colors ${timerSettings[key] ? 'bg-emerald-500' : 'bg-neutral-700'}`}><span className={`block w-5 h-5 rounded-full bg-white transition-transform ${timerSettings[key] ? 'translate-x-5' : ''}`} /></span>
                </button>
              ))}
            </div>
          </div>
        )}
        {isExitConfirmOpen && (() => {
          const doneSets = session.reduce((n, ex) => n + (ex.sets || []).filter(st => st.completed).length, 0);
          return (
          <div className="fixed inset-0 bg-black/80 z-[85] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in" onClick={() => setIsExitConfirmOpen(false)}>
            <div className="bg-[#060b10] border border-rose-500/40 rounded-[32px] p-6 max-w-sm w-full text-white shadow-[0_0_30px_rgba(244,63,94,0.2)] animate-scale-up" onClick={e => e.stopPropagation()}>
              <div className="text-3xl mb-2">🏳️</div>
              <h3 className="text-xl font-black mb-2">오늘 운동은 여기까지 할까요?</h3>
              <p className="text-sm font-bold text-neutral-400 mb-6 leading-relaxed">{doneSets > 0 ? `지금까지 완료한 ${doneSets}세트는 기록으로 남길 수 있어요.` : '아직 완료한 세트가 없어서 남길 기록이 없어요.'}</p>
              <div className="flex flex-col gap-2">
                {doneSets > 0 && <button onClick={quitAndSaveDone} className="w-full py-3.5 bg-emerald-400 text-black font-black rounded-xl active:scale-95 transition-transform shadow-[0_0_18px_rgba(16,185,129,0.5)]">완료한 {doneSets}세트만 저장하고 끝내기</button>}
                <button onClick={exitWorkout} className="w-full py-3.5 bg-black border border-rose-500/50 text-rose-400 font-black rounded-xl active:scale-95 transition-transform">기록 버리고 끝내기</button>
                <button onClick={() => setIsExitConfirmOpen(false)} className="w-full py-3 text-neutral-400 font-black text-sm">계속 운동하기</button>
              </div>
            </div>
          </div>
          );
        })()}

        {workoutMinimized && currentScreen !== 'workout' && (() => {
          const allSets = session.reduce((n, ex) => n + (ex.sets || []).length, 0);
          const doneSets = session.reduce((n, ex) => n + (ex.sets || []).filter(st => st.completed).length, 0);
          const curEx = session.find(ex => (ex.sets || []).some(st => !st.completed)) || session[session.length - 1];
          const mm = `${Math.floor(workoutDurationSec / 60)}:${(workoutDurationSec % 60).toString().padStart(2, '0')}`;
          return (
            <div className={`fixed left-3 right-3 z-[45] max-w-md mx-auto ${currentScreen === 'home' ? 'bottom-[92px]' : 'bottom-4'} animate-slide-up`}>
              <style>{`@keyframes miniFlash { 0%,100% { color: #fb7185; } 50% { color: #fde047; } } .mini-ot { animation: miniFlash .7s ease-in-out infinite; }`}</style>
              <div className="flex items-center gap-2 bg-[#03060a]/95 backdrop-blur-md border border-emerald-400/50 rounded-2xl pl-2.5 pr-1.5 py-2 shadow-[0_0_24px_rgba(16,185,129,0.35)]">
                <button onClick={resumeWorkout} className="flex-1 min-w-0 flex items-center gap-2.5 text-left active:scale-[0.98] transition-transform">
                  <span className="relative w-10 h-10 flex-shrink-0 rounded-xl bg-black border border-emerald-400/50 flex items-center justify-center"><Dumbbell className="w-5 h-5 text-emerald-300" /><span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" /><span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400" /></span>
                  <span className="min-w-0">
                    <span className="block text-[10px] font-black text-emerald-400 tracking-widest">운동 중 · {mm}</span>
                    <span className="block text-sm font-black text-white truncate">{curEx ? getExName(curEx) : '운동'} <span className="text-neutral-400 font-bold">· {doneSets}/{allSets}세트</span></span>
                  </span>
                </button>
                {overtimeOn ? (
                  <span className="text-xs font-black font-mono mini-ot flex-shrink-0">+{Math.floor(overtimeSec / 60)}:{(overtimeSec % 60).toString().padStart(2, '0')}</span>
                ) : (isTimerActive || timeLeft > 0) ? (
                  <span className="text-xs font-black font-mono text-yellow-300 flex-shrink-0">휴식 {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
                ) : null}
                <button onClick={resumeWorkout} className="px-3 py-2 rounded-xl bg-emerald-400 text-black font-black text-xs flex-shrink-0 shadow-[0_0_14px_rgba(16,185,129,0.6)] active:scale-95 transition-transform">복귀</button>
                <button onClick={() => setIsExitConfirmOpen(true)} aria-label="운동 끝내기" className="p-1.5 text-neutral-500 hover:text-white flex-shrink-0"><X className="w-4 h-4" /></button>
              </div>
            </div>
          );
        })()}
        {pendingWorkoutStart && (
          <div className="fixed inset-0 bg-black/70 z-[86] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in" onClick={() => setPendingWorkoutStart(null)}>
            <div className="bg-[#060b10] border border-emerald-500/40 rounded-[32px] p-6 max-w-sm w-full text-white shadow-[0_0_30px_rgba(16,185,129,0.25)] animate-scale-up" onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-black mb-2">진행 중인 운동이 있어요</h3>
              <p className="text-sm font-bold text-neutral-400 mb-6 leading-relaxed">새 운동을 시작하면 지금 기록 중인 운동({session.length}종목)은 저장되지 않고 사라져요.</p>
              <div className="flex flex-col gap-2">
                <button onClick={() => { setPendingWorkoutStart(null); resumeWorkout(); }} className="w-full py-3.5 bg-emerald-400 text-black font-black rounded-xl active:scale-95 transition-transform shadow-[0_0_18px_rgba(16,185,129,0.5)]">진행 중인 운동으로 돌아가기</button>
                <button onClick={discardAndStart} className="w-full py-3.5 bg-black border border-rose-500/50 text-rose-400 font-black rounded-xl active:scale-95 transition-transform">지금 운동 버리고 새로 시작</button>
              </div>
            </div>
          </div>
        )}
        {toastMessage && (
          <div className="fixed top-16 left-0 right-0 z-[100] flex justify-center pointer-events-none animate-slide-down">
            <div className="bg-emerald-500 text-neutral-950 font-black px-6 py-3 rounded-full shadow-[0_10px_20px_rgba(16,185,129,0.3)] flex items-center gap-2 text-sm border border-emerald-400"><CheckCircle2 className="w-5 h-5"/> {toastMessage}</div>
          </div>
        )}

        {showCelebration && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md transition-opacity duration-300">
            <div className="text-center flex flex-col items-center">
              <CheckCircle2 className="w-28 h-28 text-emerald-500 mx-auto mb-5 drop-shadow-[0_0_20px_rgba(16,185,129,0.5)] animate-bounce" />
              <h2 className="text-5xl font-black text-white drop-shadow-lg tracking-tight">오운완!</h2>
              <p className="text-emerald-400 font-bold mt-3 text-lg bg-emerald-950/50 px-4 py-2 rounded-full border border-emerald-900/50 mb-6">기록이 성공적으로 저장되었습니다.</p>
              <button onClick={() => { openPhotoCard(currentDate); finishCelebration(); }} className="bg-gradient-to-r from-emerald-400 to-blue-500 text-neutral-950 font-black px-6 py-3.5 rounded-2xl shadow-xl hover:scale-105 transition-all flex items-center gap-2 text-base active:scale-95 pointer-events-auto"><Camera className="w-5 h-5"/> 오운완 SNS 인증카드 만들기</button>
              <button onClick={finishCelebration} className="mt-3 text-sm font-bold text-neutral-400 hover:text-white px-4 py-2 transition-colors">홈으로 가기</button>
            </div>
          </div>
        )}

        {substituteModalEx && (() => {
          const altList = getAlternativeExercises(substituteModalEx);
          return (
            <div className="fixed inset-0 bg-black/80 z-[80] flex items-center justify-center p-4 backdrop-blur-sm animate-scale-up" onClick={() => setSubstituteModalEx(null)}>
              <div className="bg-neutral-900 border border-neutral-800 rounded-[32px] p-6 max-w-sm w-full text-white relative shadow-2xl" onClick={e => e.stopPropagation()}>
                <button onClick={() => setSubstituteModalEx(null)} className="absolute top-4 right-4 p-2 bg-neutral-800 rounded-full text-neutral-400"><X className="w-5 h-5"/></button>
                <div className="flex items-center gap-2 mb-2 text-amber-400 font-black text-sm"><Zap className="w-5 h-5 fill-amber-400"/><span>기구 대기시간 절약</span></div>
                <h3 className="text-xl font-black mb-1">[{getExName(substituteModalEx)}] 대체 운동</h3>
                <p className="text-xs text-neutral-400 font-bold mb-5">동일한 타겟 자극 부위를 훈련할 수 있는 다른 기구/도구 추천</p>
                <div className="space-y-3 mb-6">
                  {altList.length > 0 ? altList.map((altEx) => (
                      <div key={`alt-${altEx.id}`} className="bg-neutral-950 p-3.5 rounded-2xl border border-neutral-800 flex justify-between items-center hover:border-amber-500/50 transition-all">
                        <div className="flex items-center gap-3">
                          <SmartExerciseThumbnail exerciseId={altEx.id} target={altEx.target} tool={altEx.tool} size="w-12 h-12" showShadow={false}/>
                          <div><div className="font-black text-base text-white">{altEx.name}</div><div className="text-[10px] font-bold text-neutral-400">{altEx.target} · {altEx.tool}</div></div>
                        </div>
                        <button onClick={() => swapExercise(altEx, substituteModalEx.id)} className="px-3 py-2 bg-amber-500/20 text-amber-400 hover:bg-amber-500 hover:text-neutral-950 font-black text-xs rounded-xl border border-amber-500/40 transition-all active:scale-95">교체하기</button>
                      </div>
                    )) : (<div className="text-center py-8 text-neutral-500 font-bold text-sm">추천할 대체 운동이 없습니다.</div>)}
                </div>
                <button onClick={() => setSubstituteModalEx(null)} className="w-full bg-neutral-800 text-neutral-300 font-black py-3.5 rounded-xl text-sm hover:bg-neutral-700 transition-colors">닫기</button>
              </div>
            </div>
          );
        })()}

        {isPhotoCardModalOpen && photoCardData && (
          <div className="fixed inset-0 bg-black/85 z-[95] flex items-center justify-center p-4 backdrop-blur-md animate-fade-in" onClick={() => setIsPhotoCardModalOpen(false)}>
            <div className="max-w-xs w-full flex flex-col items-center" onClick={e => e.stopPropagation()}>
               <div className="flex gap-2 bg-neutral-900/90 p-1.5 rounded-2xl border border-neutral-800 mb-4 shadow-lg">
                  <button onClick={() => setPhotoCardTheme('neon')} className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${photoCardTheme === 'neon' ? 'bg-emerald-500 text-neutral-950 shadow' : 'text-neutral-400'}`}>다크 네온</button>
                  <button onClick={() => setPhotoCardTheme('clean')} className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${photoCardTheme === 'clean' ? 'bg-white text-neutral-950 shadow' : 'text-neutral-400'}`}>클린 화이트</button>
                  <button onClick={() => setPhotoCardTheme('cyber')} className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${photoCardTheme === 'cyber' ? 'bg-purple-500 text-white shadow' : 'text-neutral-400'}`}>사이버 보라</button>
               </div>
               <div className={`w-full aspect-[9/14] rounded-[36px] p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden border transition-all ${photoCardTheme === 'neon' ? 'bg-neutral-950 text-white border-emerald-500/30' : photoCardTheme === 'clean' ? 'bg-white text-neutral-900 border-neutral-200' : 'bg-gradient-to-br from-neutral-950 via-purple-950 to-neutral-900 text-white border-purple-500/40'}`}>
                  <div className={`absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl pointer-events-none ${photoCardTheme === 'neon' ? 'bg-emerald-500/20' : photoCardTheme === 'clean' ? 'bg-blue-500/10' : 'bg-purple-500/30'}`}></div>
                  <div className="flex justify-between items-start relative z-10">
                     <div>
                       <div className="text-[11px] font-black uppercase tracking-widest opacity-60">GYM SPIRIT</div>
                       <h3 className="text-2xl font-black tracking-tight mt-0.5">오운완 인증🔥</h3>
                       <p className="text-xs font-bold opacity-70">{photoCardData.date}</p>
                     </div>
                     <div className="w-9 h-9 bg-neutral-900/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10"><Dumbbell className={`w-5 h-5 ${photoCardTheme === 'neon' ? 'text-emerald-400' : photoCardTheme === 'cyber' ? 'text-purple-400' : 'text-blue-600'}`}/></div>
                  </div>
                  <div className="relative z-10 flex justify-center my-2"><div className="w-36 h-48 drop-shadow-2xl"><FullBodyAvatar profile={activeUser?.profile} bodyStats={activeUser?.bodyStats} size="w-full h-full" pose="flex" /></div></div>
                  <div className="relative z-10 space-y-3">
                     <div className={`grid grid-cols-2 gap-2 p-3 rounded-2xl border backdrop-blur-md ${photoCardTheme === 'clean' ? 'bg-neutral-50 border-neutral-200' : 'bg-neutral-900/60 border-white/10'}`}>
                        <div className="text-center"><span className="text-[9px] font-bold opacity-60 block">총 운동 볼륨</span><span className="text-lg font-black">{photoCardData.totalVolume.toLocaleString()}kg</span></div>
                        <div className="text-center"><span className="text-[9px] font-bold opacity-60 block">수행 종목</span><span className="text-lg font-black">{photoCardData.workoutCount}개 종목</span></div>
                     </div>
                     <div className="flex flex-wrap gap-1">
                        {photoCardData.exercises.slice(0, 4).map((exName, idx) => (
                          <span key={`card-ex-${idx}`} className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${photoCardTheme === 'clean' ? 'bg-neutral-100 border-neutral-200 text-neutral-700' : 'bg-white/10 border-white/10 text-neutral-200'}`}>{exName}</span>
                        ))}
                     </div>
                  </div>
               </div>
               <div className="flex gap-2 w-full mt-4">
                 <button onClick={() => { showToast("📸 오운완 카드가 이미지로 저장되었습니다!"); setIsPhotoCardModalOpen(false); }} className="flex-1 bg-emerald-500 text-neutral-950 font-black py-3.5 rounded-2xl shadow-lg hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 active:scale-95 text-sm"><Share2 className="w-4 h-4"/> 카드 공유/저장</button>
                 <button onClick={() => setIsPhotoCardModalOpen(false)} className="p-3.5 bg-neutral-900 text-neutral-400 hover:text-white rounded-2xl border border-neutral-800 transition-colors"><X className="w-5 h-5"/></button>
               </div>
            </div>
          </div>
        )}

        <style dangerouslySetInnerHTML={{__html: `
          .hide-scrollbar::-webkit-scrollbar { display: none; }
          .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
          @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
          .animate-slide-up { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
          @keyframes scaleUp { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
          .animate-scale-up { animation: scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
          @keyframes slideDown { from { transform: translateY(-100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
          .animate-slide-down { animation: slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        `}} />
    </>
  );

  if (currentScreen === 'auth') {
    return (
      <div className="min-h-screen bg-[#111111] flex items-center justify-center p-4 relative overflow-hidden">
        {globalOverlays}
        <div className="absolute top-10 left-10 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl"></div>
        <div className="bg-neutral-900 p-8 rounded-[32px] w-full max-w-sm border border-neutral-800 shadow-2xl relative animate-scale-up z-10">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-400 to-blue-500 rounded-t-[32px]"></div>
          <div className="text-center mb-8 mt-4">
             <div className="w-16 h-16 bg-neutral-950 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-neutral-800 shadow-inner"><Dumbbell className="w-8 h-8 text-emerald-400" /></div>
             <h1 className="text-3xl font-black text-white tracking-tight">GYM <span className="text-emerald-400">SPIRIT</span></h1>
             <p className="text-neutral-500 font-bold mt-2 text-sm">가장 완벽한 운동 일지</p>
          </div>
          {authChecking ? (
            <div className="py-10 flex flex-col items-center gap-3">
              <div className="w-7 h-7 rounded-full border-2 border-neutral-700 border-t-emerald-400 animate-spin" />
              <p className="text-xs font-bold text-neutral-500">로그인 정보를 확인하고 있어요</p>
            </div>
          ) : (<>
          <form onSubmit={handleAuth} className="space-y-5">
            {recoveryMode ? (
              <p className="text-sm font-bold text-neutral-300 bg-neutral-950 border border-neutral-800 rounded-xl p-3">새로 사용할 비밀번호를 입력해 주세요.</p>
            ) : (
              <div>
                <label className="text-sm font-bold text-neutral-400 mb-1.5 block">이메일 (아이디)</label>
                <input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-white focus:border-emerald-500 outline-none transition-colors" placeholder="you@example.com" />
              </div>
            )}
            {!isLoginMode && !recoveryMode && (
              <div>
                <label className="text-sm font-bold text-neutral-400 mb-1.5 block">닉네임 (랭킹에 보여요)</label>
                <input type="text" required maxLength={12} value={signupNickname} onChange={e => setSignupNickname(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-white focus:border-emerald-500 outline-none transition-colors" placeholder="예: 3대500가즈아" />
              </div>
            )}
            <div>
              <label className="text-sm font-bold text-neutral-400 mb-1.5 block">{recoveryMode ? '새 비밀번호 (6자리 이상)' : '비밀번호 (6자리 이상)'}</label>
              <input type="password" required minLength={6} autoComplete={isLoginMode && !recoveryMode ? 'current-password' : 'new-password'} value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-white focus:border-emerald-500 outline-none transition-colors" placeholder="••••••••" />
            </div>
            {authError && <p className="text-rose-400 text-sm font-bold bg-rose-950/30 p-3 rounded-lg border border-rose-900/50 flex items-center gap-2"><Info className="w-4 h-4 flex-shrink-0"/> {authError}</p>}
            {authNotice && <p className="text-emerald-300 text-sm font-bold bg-emerald-950/30 p-3 rounded-lg border border-emerald-900/50 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 flex-shrink-0"/> {authNotice}</p>}
            <button type="submit" disabled={authBusy} className="w-full bg-emerald-500 text-neutral-950 font-black py-4 rounded-xl mt-4 shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:bg-emerald-400 active:scale-95 transition-all text-lg disabled:opacity-60 disabled:active:scale-100">{authBusy ? '잠시만요…' : recoveryMode ? '비밀번호 바꾸기' : isLoginMode ? '로그인하기' : '가입하고 시작하기'}</button>
            {isLoginMode && !recoveryMode && <button type="button" onClick={handlePasswordReset} disabled={authBusy} className="w-full text-xs font-bold text-neutral-500 hover:text-neutral-300 transition-colors">비밀번호를 잊으셨나요?</button>}
          </form>
          {!recoveryMode && (
          <div className="mt-6 text-center space-y-4">
            <button onClick={() => {setIsLoginMode(!isLoginMode); setAuthError(''); setAuthNotice('');}} className="text-sm font-bold text-neutral-500 hover:text-white transition-colors underline underline-offset-4">{isLoginMode ? '아직 계정이 없으신가요? 회원가입' : '이미 계정이 있으신가요? 로그인'}</button>
            <div className="flex items-center gap-4"><div className="h-[1px] flex-1 bg-neutral-800"></div><span className="text-xs text-neutral-600 font-bold">또는</span><div className="h-[1px] flex-1 bg-neutral-800"></div></div>
            <button onClick={handleGuestLogin} className="text-sm font-bold text-neutral-400 hover:text-emerald-400 transition-colors w-full p-3 rounded-xl border border-neutral-800 hover:bg-neutral-800/50">로그인 없이 게스트로 체험하기</button>
            {currentUser?.email === 'guest@gymwork.com' && !isLoginMode && <p className="text-[11px] font-bold text-neutral-500">게스트로 쌓은 기록은 가입한 계정으로 그대로 옮겨져요.</p>}
          </div>
          )}
          </>)}
        </div>
      </div>
    );
  }

  if (currentScreen === 'diet') {
    return (
      <div className="min-h-screen bg-neutral-50 text-neutral-900 pb-32 flex flex-col relative animate-fade-in">
        {globalOverlays}
        <header className="bg-white border-b border-neutral-100 px-5 py-4 sticky top-0 z-20 flex justify-between items-center shadow-sm">
          <button onClick={() => setCurrentScreen('home')} className="p-2 -ml-2 text-neutral-500 hover:bg-neutral-50 rounded-full transition-colors"><ChevronLeft className="w-6 h-6"/></button>
          <h1 className="font-black text-xl tracking-tight text-neutral-900">식단 플래너</h1>
          <div className="w-10"></div>
        </header>
        <main className="p-5 space-y-6">
          <div className="bg-white p-6 rounded-[32px] shadow-sm border border-neutral-100">
             <div className="flex justify-between items-end mb-6">
               <div>
                 <p className="text-xs font-black text-neutral-400 mb-1">{currentDate.split('-')[1]}월 {currentDate.split('-')[2]}일</p>
                 <h2 className="text-2xl font-black text-neutral-900">오늘의 섭취량</h2>
               </div>
               <div className="text-right"><div className="text-3xl font-black text-[#4768ff]">{todayMacros.cal.toLocaleString()} <span className="text-base text-neutral-400 font-bold">kcal</span></div></div>
             </div>
             <div className="grid grid-cols-3 gap-3">
               <div className="bg-neutral-50 p-3 rounded-2xl border border-neutral-100 text-center">
                 <div className="text-[10px] font-black text-neutral-500 mb-1">탄수화물</div>
                 <div className="text-lg font-black text-neutral-900">{todayMacros.c.toFixed(0)}g</div>
                 <div className="w-full bg-neutral-200 h-1.5 rounded-full mt-2 overflow-hidden"><div className="bg-amber-500 h-full" style={{width: `${Math.min((todayMacros.c/300)*100, 100)}%`}}></div></div>
               </div>
               <div className="bg-neutral-50 p-3 rounded-2xl border border-neutral-100 text-center">
                 <div className="text-[10px] font-black text-neutral-500 mb-1">단백질</div>
                 <div className="text-lg font-black text-[#4768ff]">{todayMacros.p.toFixed(0)}g</div>
                 <div className="w-full bg-neutral-200 h-1.5 rounded-full mt-2 overflow-hidden"><div className="bg-[#4768ff] h-full" style={{width: `${Math.min((todayMacros.p/150)*100, 100)}%`}}></div></div>
               </div>
               <div className="bg-neutral-50 p-3 rounded-2xl border border-neutral-100 text-center">
                 <div className="text-[10px] font-black text-neutral-500 mb-1">지방</div>
                 <div className="text-lg font-black text-neutral-900">{todayMacros.f.toFixed(0)}g</div>
                 <div className="w-full bg-neutral-200 h-1.5 rounded-full mt-2 overflow-hidden"><div className="bg-rose-500 h-full" style={{width: `${Math.min((todayMacros.f/70)*100, 100)}%`}}></div></div>
               </div>
             </div>
          </div>
          <div className="space-y-4">
            {todayDiet.meals.map(meal => (
              <div key={meal.id} className="bg-white p-5 rounded-[28px] shadow-sm border border-neutral-100">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-black text-neutral-900 flex items-center gap-2"><Utensils className="w-4 h-4 text-neutral-400"/> {String(meal.name)}</h3>
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-black text-neutral-500">{meal.items.reduce((sum, item) => sum + item.calories, 0)} kcal</div>
                    <button onClick={() => removeDietMeal(meal.id)} className="p-2 text-neutral-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors active:scale-90" title="끼니 삭제"><Trash2 className="w-4 h-4"/></button>
                  </div>
                </div>
                {meal.items.length > 0 ? (
                  <div className="space-y-3 mb-4">
                    {meal.items.map(item => (
                      <div key={item.id} className="flex justify-between items-center bg-neutral-50 p-3 rounded-2xl border border-neutral-100 group hover:border-rose-100 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-xl shadow-sm">{String(item.icon)}</div>
                          <div>
                            <div className="font-black text-sm text-neutral-900">{String(item.name)}</div>
                            <div className="text-[10px] font-bold text-neutral-500">{item.weight}g · 단백질 {item.protein}g</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-sm font-black text-neutral-700">{item.calories} kcal</div>
                          <button onClick={() => removeFoodFromMeal(meal.id, item.id)} className="p-2 text-neutral-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors active:scale-90"><Trash2 className="w-4 h-4"/></button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
                <button onClick={() => { setSelectedMealId(meal.id); setIsAddFoodModalOpen(true); }} className="w-full py-3.5 rounded-xl border-2 border-dashed border-neutral-200 text-neutral-400 font-black hover:text-[#4768ff] hover:border-[#4768ff]/30 hover:bg-[#e8edff] transition-all active:scale-[0.98] flex items-center justify-center gap-1"><Plus className="w-4 h-4 stroke-[3]"/> 음식 추가하기</button>
              </div>
            ))}
          </div>
          <button onClick={addDietMeal} className="w-full py-4 rounded-2xl border border-neutral-200 bg-white text-neutral-600 font-black hover:bg-neutral-50 transition-colors shadow-sm flex items-center justify-center gap-2 active:scale-95"><Plus className="w-5 h-5"/> 끼니 추가하기</button>
        </main>

        {isAddFoodModalOpen && (
          <div className="fixed inset-0 bg-black/60 z-[70] flex flex-col justify-end animate-fade-in" onClick={() => {setIsAddFoodModalOpen(false); setSelectedFood(null); setFoodCategoryFilter('전체');}}>
            <div className="bg-white w-full h-[90vh] rounded-t-[40px] shadow-[0_-20px_50px_rgba(0,0,0,0.5)] flex flex-col animate-slide-up text-neutral-900 overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="px-5 py-4 flex justify-between items-center bg-white sticky top-0 z-10 border-b border-neutral-100">
                <button onClick={() => showToast("스마트 사진 분석은 준비 중입니다.")} className="text-neutral-500 hover:bg-neutral-100 p-2 rounded-full transition-colors"><Camera className="w-6 h-6"/></button>
                <h2 className="text-xl font-black">{selectedFood ? '중량 입력' : '식재료 검색'}</h2>
                <button onClick={() => {setIsAddFoodModalOpen(false); setSelectedFood(null); setFoodCategoryFilter('전체');}} className="text-neutral-900 p-2 rounded-full hover:bg-neutral-100 transition-colors"><X className="w-6 h-6"/></button>
              </div>
              {!selectedFood ? (
                <>
                  <div className="p-4 bg-white sticky top-[65px] z-10 border-b border-neutral-50 shadow-[0_5px_10px_rgba(0,0,0,0.02)]">
                    <div className="bg-neutral-100 rounded-xl p-3 mb-3 flex items-center gap-2">
                      <Search className="w-5 h-5 text-neutral-400" />
                      <input type="text" placeholder="음식 이름을 검색하세요 (ex. 닭가슴살)" value={foodSearchQuery} onChange={e => setFoodSearchQuery(e.target.value)} className="bg-transparent border-none outline-none w-full text-sm font-bold text-neutral-900 placeholder:text-neutral-400" />
                    </div>
                    <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                      {['전체', '단백질', '탄수화물', '지방', '채소'].map(cat => (
                        <button key={cat} onClick={() => setFoodCategoryFilter(cat)} className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${foodCategoryFilter === cat ? 'bg-neutral-800 text-white border-neutral-800' : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'}`}>{cat}</button>
                      ))}
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-neutral-50">
                    {FOOD_DB.filter(f => (foodCategoryFilter === '전체' || String(f.category).includes(foodCategoryFilter)) && String(f.name).includes(foodSearchQuery)).map(food => (
                      <div key={food.id} onClick={() => {setSelectedFood(food); setFoodWeight(100);}} className="flex items-center gap-4 bg-white p-3.5 rounded-2xl border border-neutral-100 hover:border-[#4768ff] hover:shadow-md transition-all cursor-pointer group active:scale-95">
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl shadow-inner border border-white/50 ${food.bgColor}`}>{String(food.icon)}</div>
                        <div className="flex-1">
                          <h3 className="font-black text-neutral-900 text-base">{String(food.name)}</h3>
                          <div className="text-[10px] font-bold text-neutral-400 mt-0.5">{String(food.unit)} 기준 · {food.calories}kcal</div>
                        </div>
                        <div className={`text-xs font-black bg-neutral-50 px-2 py-1 rounded-md ${food.txColor}`}>{String(food.category)}</div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex-1 bg-neutral-50 p-6 flex flex-col items-center">
                   <div className={`w-24 h-24 rounded-3xl flex items-center justify-center text-6xl shadow-md border-4 border-white mb-6 mt-4 ${selectedFood.bgColor}`}>{String(selectedFood.icon)}</div>
                   <h3 className="text-2xl font-black text-neutral-900 mb-2">{String(selectedFood.name)}</h3>
                   <p className="text-sm font-bold text-neutral-500 mb-10">얼마나 드셨나요?</p>
                   <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm w-full max-w-xs mb-8 flex justify-between items-center">
                     <button onClick={() => setFoodWeight(Math.max(10, foodWeight - 50))} className="p-3 bg-neutral-100 rounded-2xl active:scale-90 transition-transform"><Minus className="w-5 h-5 text-neutral-600"/></button>
                     <div className="text-center">
                       <input type="number" value={foodWeight} onChange={e=>setFoodWeight(Number(e.target.value))} className="w-20 text-center font-black text-4xl text-[#4768ff] bg-transparent outline-none"/>
                       <span className="text-lg font-black text-neutral-400 ml-1">g</span>
                     </div>
                     <button onClick={() => setFoodWeight(foodWeight + 50)} className="p-3 bg-neutral-100 rounded-2xl active:scale-90 transition-transform"><Plus className="w-5 h-5 text-neutral-600"/></button>
                   </div>
                   <div className="w-full bg-white p-5 rounded-2xl border border-neutral-100 shadow-sm flex justify-between items-center mt-auto mb-6">
                     <div className="text-center"><div className="text-[10px] font-bold text-neutral-400">칼로리</div><div className="font-black text-lg text-neutral-900">{Math.round(selectedFood.calories * (foodWeight/100))}</div></div>
                     <div className="w-[1px] h-8 bg-neutral-100"></div>
                     <div className="text-center"><div className="text-[10px] font-bold text-neutral-400">탄수화물</div><div className="font-black text-lg text-amber-500">{(selectedFood.carbs * (foodWeight/100)).toFixed(1)}</div></div>
                     <div className="w-[1px] h-8 bg-neutral-100"></div>
                     <div className="text-center"><div className="text-[10px] font-bold text-neutral-400">단백질</div><div className="font-black text-lg text-[#4768ff]">{(selectedFood.protein * (foodWeight/100)).toFixed(1)}</div></div>
                     <div className="w-[1px] h-8 bg-neutral-100"></div>
                     <div className="text-center"><div className="text-[10px] font-bold text-neutral-400">지방</div><div className="font-black text-lg text-rose-500">{(selectedFood.fat * (foodWeight/100)).toFixed(1)}</div></div>
                   </div>
                   <button onClick={addFoodToMeal} className="w-full bg-[#4768ff] text-white font-black py-4 rounded-xl shadow-[0_10px_25px_rgba(71,104,255,0.3)] hover:bg-blue-600 active:scale-95 transition-all text-lg">식단에 추가하기</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (currentScreen === 'workout') {
    const formattedWorkoutTime = `${Math.floor(workoutDurationSec / 3600).toString().padStart(2, '0')}:${Math.floor((workoutDurationSec % 3600) / 60).toString().padStart(2, '0')}:${(workoutDurationSec % 60).toString().padStart(2, '0')}`;
    const currentSessionVolume = session.reduce((total, ex) => total + (ex.sets || []).reduce((sum, s) => {
        if (s.completed && s.reps) return sum + setVolume(ex, s);
        return sum;
      }, 0), 0);
    const getRpeColor = (rpeStr) => {
      const r = parseInt(rpeStr, 10);
      if (isNaN(r)) return 'bg-neutral-900/50 text-neutral-400 focus:border-neutral-500 border-neutral-800';
      if (r >= 9) return 'bg-rose-950/40 text-rose-400 focus:border-rose-500 border-rose-900/50 shadow-[0_0_10px_rgba(225,29,72,0.2)]';
      if (r >= 7) return 'bg-amber-950/40 text-amber-400 focus:border-amber-500 border-amber-900/50 shadow-[0_0_10px_rgba(217,119,6,0.2)]';
      return 'bg-emerald-950/40 text-emerald-400 focus:border-emerald-500 border-emerald-900/50 shadow-[0_0_10px_rgba(16,185,129,0.2)]';
    };

    return (
      <div className="min-h-screen bg-[#03060a] text-neutral-100 pb-32 flex flex-col relative animate-fade-in">
        {globalOverlays}
        {/* 트론 테마: 에메랄드 격자 + 위쪽 에메랄드·아래쪽 노란 광원 */}
        <div className="fixed inset-0 pointer-events-none z-0" style={{ backgroundImage: 'radial-gradient(ellipse 80% 40% at 50% 0%, rgba(16,185,129,0.14), transparent 70%), radial-gradient(ellipse 70% 30% at 50% 100%, rgba(250,204,21,0.08), transparent 70%), linear-gradient(rgba(16,185,129,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.07) 1px, transparent 1px)', backgroundSize: '100% 100%, 100% 100%, 32px 32px, 32px 32px' }} />
        <header className="bg-[#03060a]/85 backdrop-blur-md px-4 py-4 sticky top-0 z-20 flex justify-between items-center">
          <div className="absolute left-0 right-0 -bottom-px h-[2px] bg-gradient-to-r from-emerald-400 via-yellow-300 to-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.9)]" />
          <button onClick={minimizeWorkout} aria-label="운동 잠깐 나가기 (최소화)" title="잠깐 나가기 · 운동은 계속 기록돼요" className="p-1 rounded-xl bg-emerald-500/5 border border-emerald-500/30 hover:bg-emerald-500/15 active:scale-90 transition-all shadow-[0_0_12px_rgba(16,185,129,0.35)]"><EmergencyExitIcon className="w-9 h-9" /></button>
          <div className="flex items-center gap-3">
            {currentSessionVolume > 0 && (<div className="text-sm font-black text-yellow-300 tracking-tight bg-yellow-400/10 px-2 py-1 rounded-lg border border-yellow-400/40 shadow-[0_0_12px_rgba(250,204,21,0.35)] animate-fade-in">{currentSessionVolume.toLocaleString()} <span className="text-[10px]">kg</span></div>)}
            <div className="font-black text-base text-emerald-300 tracking-wider flex items-center gap-1.5 bg-black px-3 py-1 rounded-xl border border-emerald-400/50 shadow-[0_0_14px_rgba(16,185,129,0.45)] [text-shadow:0_0_8px_rgba(16,185,129,0.8)]"><Clock className="w-4 h-4 animate-pulse"/> {formattedWorkoutTime}</div>
          </div>
          <button onClick={() => { navigator.clipboard?.writeText(window.location.href)?.catch(() => {}); showToast("운동 루틴 링크가 클립보드에 복사되었습니다!"); }} className="text-xs font-bold text-yellow-300 bg-yellow-400/10 px-3 py-1.5 rounded-lg border border-yellow-400/40 active:scale-95">공유</button>
        </header>

        <main className="max-w-md mx-auto w-full p-4 space-y-6 flex-1 mt-2 relative z-10">
          {session.length === 0 ? (
            <div className="text-center py-24 opacity-60 flex flex-col items-center">
              <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center mb-5 border border-emerald-400/50 shadow-[0_0_24px_rgba(16,185,129,0.4)]"><Dumbbell className="w-10 h-10 text-emerald-400" /></div>
              <p className="font-black text-neutral-300 text-xl mb-2">운동을 시작해볼까요?</p>
              <p className="font-medium text-neutral-500 text-sm">하단의 버튼을 눌러 종목을 추가하세요.</p>
            </div>
          ) : (
            session.map((ex) => {
              const max1RM = (ex.sets || []).filter(s => s.completed && s.type === '-' && s.weight && s.reps).reduce((max, s) => Math.max(max, calculate1RM(s.weight, s.reps)), 0);
              const exNameStr = getExName(ex);
              const exTargetStr = getExTarget(ex);
              const exIdStr = getExId(ex);
              const exToolStr = ex.exercise && ex.exercise.tool ? String(ex.exercise.tool) : '바벨';
              const exRule = ruleOfEx(ex);
              const exRM = exOneRM(ex);
              return (
                <div key={ex.id} className="bg-[#060b10]/95 rounded-[28px] p-5 border border-emerald-500/30 shadow-[0_0_28px_rgba(16,185,129,0.12),inset_0_0_24px_rgba(16,185,129,0.05)] relative overflow-hidden">
                  <div className="absolute top-0 left-8 right-8 h-[2px] bg-gradient-to-r from-transparent via-emerald-300 to-transparent shadow-[0_0_14px_rgba(16,185,129,1)]" />
                  <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-yellow-300/80 rounded-tl-md shadow-[0_0_8px_rgba(250,204,21,0.6)]" />
                  <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-yellow-300/80 rounded-br-md shadow-[0_0_8px_rgba(250,204,21,0.6)]" />
                  <div className="flex justify-between items-start gap-2 mb-5 border-b border-emerald-500/15 pb-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                       <SmartExerciseThumbnail exerciseId={exIdStr} target={exTargetStr} tool={exToolStr} showShadow={false} size="w-14 h-14" />
                       <div className="min-w-0">
                         <button onClick={() => { setSwapTargetExerciseId(ex.id); setIsAddExerciseModalOpen(true); }} className="text-left active:scale-95 transition-transform group flex items-center gap-1.5 max-w-full">
                           <h2 className="text-lg leading-tight font-black text-white break-keep group-hover:text-emerald-300 transition-colors [text-shadow:0_0_10px_rgba(16,185,129,0.35)]">{exNameStr}</h2>
                           <Settings className="w-4 h-4 text-neutral-500 group-hover:text-emerald-400 transition-colors" />
                         </button>
                         <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                           <span className="text-[11px] font-bold text-emerald-300 bg-emerald-400/10 px-2 py-0.5 rounded-md border border-emerald-400/40 shadow-[0_0_8px_rgba(16,185,129,0.25)]">{exTargetStr}</span>
                           <span className="text-[11px] font-bold text-yellow-200/90 bg-yellow-400/5 px-2 py-0.5 rounded-md border border-yellow-400/30 whitespace-nowrap">⚖️ {exRule.hint}</span>
                           <button onClick={() => setGuideExerciseId(exIdStr)} className="text-[11px] font-black text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-900/60 hover:bg-blue-500/20 transition-all flex items-center gap-1 active:scale-95 whitespace-nowrap"><BookOpen className="w-3 h-3"/> 설명</button>
                           <button onClick={() => setSubstituteModalEx(ex)} className="text-[11px] font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-900/60 hover:bg-amber-500/20 transition-all flex items-center gap-1 active:scale-95 whitespace-nowrap" title="기구 대기 시 대체 운동 추천"><Zap className="w-3 h-3 fill-amber-400"/> 대체</button>
                           {max1RM > 0 && <span className="text-[11px] font-bold text-neutral-400 flex items-center gap-1"><Target className="w-3 h-3"/> 1RM <span className="text-white bg-neutral-800 px-1.5 py-0.5 rounded">{max1RM}kg</span></span>}
                           {checkOverloadRecommendation(exIdStr) && (
                             <button onClick={() => applyProgressiveOverload(ex.id)} className="text-[10px] font-black text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-md border border-amber-500/50 hover:bg-amber-500/30 transition-all flex items-center gap-1 active:scale-95"><Flame className="w-3 h-3 text-amber-400 animate-bounce"/> 지난주 완수! +2.5kg 증량</button>
                           )}
                         </div>
                       </div>
                    </div>
                    <div className="flex items-center flex-shrink-0">
                      <button onClick={() => setExerciseOptionsModal(ex.id)} className="text-neutral-500 hover:text-white transition-colors p-2 rounded-full hover:bg-neutral-800 active:scale-90"><MoreVertical className="w-6 h-6"/></button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-12 gap-2 text-center text-[10px] font-black text-emerald-400/60 tracking-widest mb-1 px-1">
                      <div className="col-span-2">세트 ↻</div><div className="col-span-3">{exRule.label}</div><div className="col-span-3">REPS</div><div className="col-span-2">RPE</div><div className="col-span-2">DONE</div>
                    </div>
                    {ex.sets.map((set, setIndex) => {
                      const plateCalc = platesFor(exRule, set.weight);
                      const realLoad = (exRule.key === 'bodyweight' || exRule.key === 'assist') && bodyWeightKg > 0 ? setLoad(exIdStr, toolOfEx(ex), set.weight, bodyWeightKg) : null;
                      const isDropSet = set.type === 'D';
                      const prevSet = getPreviousRecord(exIdStr, setIndex);
                      return (
                        <div key={set.id} className="relative group/set">
                          <div className={`grid grid-cols-12 gap-2 items-center transition-all duration-300 ${set.completed ? 'opacity-50' : 'opacity-100'} ${isDropSet ? 'bg-rose-950/20 border border-rose-900/50 p-2 -mx-2 rounded-xl' : ''}`}>
                            <button onClick={() => cycleSetType(ex.id, set.id)} title="누르면 워밍업 → 메인 → 드랍으로 바뀌어요" className={`col-span-2 h-[50px] rounded-xl flex flex-col items-center justify-center leading-none transition-colors active:scale-95 border ${SET_TYPE_STYLE[set.type] || SET_TYPE_STYLE['-']}`}>
                              <span className="text-lg font-black tabular-nums">{ex.sets.slice(0, setIndex + 1).filter(st => (st.type || '-') === (set.type || '-')).length}</span>
                              <span className="text-[9px] font-black mt-1 tracking-tight">{SET_TYPE_LABEL[set.type] || '메인'}</span>
                            </button>
                            <div className="col-span-3"><input type="number" inputMode="decimal" placeholder={exRule.placeholder} value={set.weight} onChange={(e) => updateSet(ex.id, set.id, 'weight', e.target.value)} className="w-full bg-black text-white text-center font-black rounded-xl py-3 outline-none border border-emerald-500/25 focus:border-emerald-300 focus:shadow-[0_0_16px_rgba(16,185,129,0.5)] transition-all text-lg placeholder:text-neutral-700" /></div>
                            <div className="col-span-3"><input type="number" placeholder="0" value={set.reps} onChange={(e) => updateSet(ex.id, set.id, 'reps', e.target.value)} className="w-full bg-black text-white text-center font-black rounded-xl py-3 outline-none border border-emerald-500/25 focus:border-emerald-300 focus:shadow-[0_0_16px_rgba(16,185,129,0.5)] transition-all text-lg placeholder:text-neutral-700" /></div>
                            <div className="col-span-2"><input type="number" inputMode="decimal" step="0.5" placeholder={suggestRpe(ex, set, exRM) !== null ? `≈${suggestRpe(ex, set, exRM)}` : '-'} min="1" max="10" value={set.rpe} onChange={(e) => updateSet(ex.id, set.id, 'rpe', e.target.value)} className={`w-full text-center font-bold text-sm rounded-xl py-3 outline-none border transition-colors ${getRpeColor(set.rpe)}`} /></div>
                            <div className="col-span-2 flex justify-center relative">
                               <button onClick={() => toggleSetComplete(ex.id, set.id)} className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all active:scale-75 z-10 relative ${set.completed ? 'bg-emerald-400 text-black shadow-[0_0_20px_rgba(16,185,129,0.8)]' : 'bg-black text-emerald-500/40 hover:text-emerald-300 hover:shadow-[0_0_12px_rgba(16,185,129,0.4)] border border-emerald-500/30'}`}><Check className="w-6 h-6 stroke-[3]" /></button>
                               <button onClick={() => removeSet(ex.id, set.id)} className="absolute -right-8 top-1/2 -translate-y-1/2 p-2 text-neutral-500 hover:text-rose-500 transition-all opacity-0 group-hover/set:opacity-100 bg-neutral-900 rounded-full shadow-md"><X className="w-4 h-4"/></button>
                            </div>
                          </div>
                          <div className="flex justify-between items-start gap-2 px-2 mt-2 mb-4 min-h-[16px]">
                            <span className="flex-1 min-w-0 text-[10px] text-neutral-500 font-bold leading-snug">{prevSet ? `이전: ${prevSet.weight}kg x ${prevSet.reps}회` : ''}{(set.rpeAuto || !String(set.rpe || '').trim()) && suggestRpe(ex, set, exRM) !== null && <span className="ml-1.5 text-emerald-400/80">· RPE {set.rpeAuto ? '자동' : '추천'} {suggestRpe(ex, set, exRM)} (1RM {exRM}kg 기준)</span>}
                              {!(parseInt(set.reps, 10) > 0) && parseFloat(set.weight) > 0 && exRM > 0 && exRule.key !== 'bodyweight' && exRule.key !== 'assist' && (() => {
                                const max = parseFloat(set.weight) >= exRM ? 1 : Math.floor(30 * (exRM / parseFloat(set.weight) - 1));
                                return <span className="ml-1.5 text-emerald-400/80">· 이 무게 최대 약 {max}회 (RPE 8 ≈ {Math.max(1, max - 2)}회) · 횟수를 넣으면 RPE 자동</span>;
                              })()}</span>
                            {realLoad !== null && realLoad !== (parseFloat(set.weight) || 0) && (
                              <span className="text-[10px] font-bold text-sky-300">실제 부하 {realLoad}kg {exRule.key === 'assist' ? '(체중 − 보조)' : '(체중 포함)'}</span>
                            )}
                            {plateCalc.length > 0 && (
                              <button onClick={() => setPlateVisualizerModal({ weight: set.weight, plates: plateCalc, rule: exRule })} className="flex gap-1 justify-end items-center opacity-70 hover:opacity-100 transition-opacity">
                                <span className="text-[10px] font-bold text-yellow-300">{exRule.plates === 'both' ? `한쪽 ${sideWeight(plateCalc)}kg` : `원판 ${sideWeight(plateCalc)}kg`}</span>
                                <span className="text-[10px] font-black bg-yellow-400/10 text-yellow-200 border border-yellow-400/40 px-1.5 py-0.5 rounded shadow-[0_0_8px_rgba(250,204,21,0.3)]">{formatPlates(plateCalc)}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <button onClick={() => addSet(ex.id)} className="w-full py-3.5 rounded-xl border-2 border-dashed border-emerald-500/30 text-emerald-400 font-black hover:text-emerald-200 hover:border-emerald-300 hover:bg-emerald-400/5 transition-all active:scale-[0.98] mt-2">+ 세트 추가</button>
                </div>
              );
            })
          )}
        </main>

        <div className="max-w-md mx-auto w-full px-4 mb-6 relative z-10">
          <button onClick={() => { setSwapTargetExerciseId(null); setIsAddExerciseModalOpen(true); }} className="w-full bg-black text-yellow-300 font-black py-4 rounded-2xl mb-4 h-14 hover:bg-yellow-400/5 transition-colors active:scale-[0.98] shadow-[0_0_18px_rgba(250,204,21,0.25)] flex items-center justify-center gap-2 border border-yellow-400/50"><Plus className="w-5 h-5"/> 종목 추가하기</button>
          <button onClick={triggerSaveWorkout} className={`w-full font-black py-4 rounded-2xl flex items-center justify-center gap-2 h-14 transition-all active:scale-[0.98] text-lg ${session.length > 0 ? 'bg-emerald-400 text-black hover:bg-emerald-300 shadow-[0_0_28px_rgba(16,185,129,0.6)]' : 'bg-neutral-900 text-neutral-600 border border-neutral-800 cursor-not-allowed'}`}><Save className="w-5 h-5 stroke-[3]"/> 훈련 완료 및 저장</button>
          {session.length > 0 && <button onClick={() => setIsExitConfirmOpen(true)} className="w-full mt-3 py-3 text-sm font-black text-rose-400/80 hover:text-rose-300 transition-colors">🏳️ 운동 그만두기</button>}
        </div>

        <div className={`fixed bottom-0 left-0 right-0 bg-[#03060a]/95 backdrop-blur-xl border-t p-5 rounded-t-[32px] transform transition-transform duration-500 z-40 ${overtimeOn ? 'ot-border' : 'border-emerald-400/40 shadow-[0_-10px_40px_rgba(16,185,129,0.18)]'} ${isTimerActive || timeLeft > 0 || overtimeOn ? 'translate-y-0' : 'translate-y-full'}`}>
          <style>{`
            @keyframes otFlash { 0%,100% { color: #fb7185; text-shadow: 0 0 14px rgba(251,113,133,.95); } 50% { color: #fde047; text-shadow: 0 0 20px rgba(250,204,21,1); } }
            @keyframes otBorder { 0%,100% { border-color: rgba(251,113,133,.95); box-shadow: 0 -10px 44px rgba(251,113,133,.4); } 50% { border-color: rgba(250,204,21,.95); box-shadow: 0 -10px 44px rgba(250,204,21,.4); } }
            @keyframes otFill { 0%,100% { background: rgba(251,113,133,.16); border-color: rgba(251,113,133,.7); } 50% { background: rgba(250,204,21,.16); border-color: rgba(250,204,21,.7); } }
            .ot-text { animation: otFlash .7s ease-in-out infinite; }
            .ot-border { animation: otBorder .7s ease-in-out infinite; }
            .ot-fill { animation: otFill .7s ease-in-out infinite; }
          `}</style>
          <div className="max-w-md mx-auto relative">
            <div className="absolute -top-5 left-0 right-0 h-1.5 bg-neutral-800 rounded-t-3xl overflow-hidden">
              {overtimeOn
                ? <div className="h-full w-full ot-fill" />
                : <div className="h-full bg-gradient-to-r from-emerald-400 to-yellow-300 transition-all duration-1000 ease-linear shadow-[0_0_15px_rgba(250,204,21,0.8)]" style={{ width: `${(timeLeft / maxTime) * 100}%` }} />}
            </div>
            {overtimeOn ? (
              <div className="ot-fill border rounded-xl px-3 py-2 mb-3 flex items-center justify-between">
                <span className="text-sm font-black ot-text">⚡ 휴식 끝! 얼른 다음 세트 시작하세요</span>
                <span className="text-[11px] font-bold text-neutral-400">세트 ✓ 하면 꺼져요</span>
              </div>
            ) : (
            <div className="flex gap-2 overflow-x-auto hide-scrollbar mb-3">
              <button onClick={() => setIsAlarmSettingsOpen(true)} className="px-3 py-1.5 bg-yellow-400/10 hover:bg-yellow-400/20 text-xs font-black text-yellow-300 rounded-lg flex-shrink-0 transition-colors border border-yellow-400/40 flex items-center gap-1"><Bell className="w-3.5 h-3.5" /> {(ALARM_SOUNDS.find(a => a.id === timerSettings.sound) || ALARM_SOUNDS[0]).label}</button>
              {[30, 60, 90, 120, 180].map(sec => (
                <button key={`preset-${sec}`} onClick={() => startRest(sec)} className="px-3 py-1.5 bg-black hover:bg-emerald-400/10 text-xs font-bold text-emerald-300 rounded-lg flex-shrink-0 transition-colors border border-emerald-500/30">{sec >= 60 ? `${sec/60}분` : `${sec}초`}</button>
              ))}
            </div>
            )}
            {/* 옆으로 밀면 숫자 ↔ 스톱워치 시계 보기 */}
            <div ref={timerPagerRef} onScroll={onTimerPagerScroll} className="flex overflow-x-auto overflow-y-hidden snap-x snap-mandatory hide-scrollbar transition-[height] duration-300" style={{ height: timerPage === 1 ? 128 : 60 }}>
              <div className="w-full flex-shrink-0 snap-center">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 bg-black rounded-2xl flex items-center justify-center border ${overtimeOn ? 'ot-fill' : isTimerActive ? 'border-yellow-300/60 shadow-[0_0_18px_rgba(250,204,21,0.45)]' : 'border-emerald-500/20'}`}><Flame className={`w-7 h-7 ${overtimeOn ? 'text-rose-400 animate-pulse' : isTimerActive ? 'text-yellow-300 animate-pulse' : 'text-neutral-600'}`} /></div>
                <div>
                  {overtimeOn ? (
                    <>
                      <div className="text-xs font-black mb-0.5 tracking-widest ot-text">휴식 초과</div>
                      <div className="text-3xl font-black font-mono tracking-tight ot-text">+{Math.floor(overtimeSec / 60)}:{(overtimeSec % 60).toString().padStart(2, '0')}</div>
                    </>
                  ) : (
                    <>
                      <div className="text-xs text-emerald-400/70 font-bold mb-0.5 tracking-widest">REST TIMER</div>
                      <div className="text-3xl font-black font-mono text-yellow-300 tracking-tight [text-shadow:0_0_12px_rgba(250,204,21,0.8)]">{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</div>
                    </>
                  )}
                </div>
              </div>
              {overtimeOn ? (
                <div className="flex gap-2">
                  <button onClick={() => startRest(30)} className="h-12 px-3 rounded-2xl bg-black border border-emerald-500/30 font-black text-emerald-300 text-sm hover:bg-emerald-400/10 active:scale-95 transition-all">+30초 더 쉬기</button>
                  <button onClick={() => { stopAlarm(); setOvertimeSec(null); }} aria-label="초과 타이머 닫기" className="w-12 h-12 rounded-2xl bg-black border border-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center active:scale-95 transition-all"><X className="w-5 h-5" /></button>
                </div>
              ) : (
              <div className="flex gap-2">
                <button onClick={() => adjustTimer(-10)} className="w-12 h-12 rounded-2xl bg-black border border-emerald-500/30 font-black text-emerald-300 hover:bg-emerald-400/10 active:scale-95 transition-all">-10</button>
                <button onClick={() => adjustTimer(30)} className="w-12 h-12 rounded-2xl bg-black border border-emerald-500/30 font-black text-emerald-300 hover:bg-emerald-400/10 active:scale-95 transition-all">+30</button>
                <button onClick={() => { unlockAudio(); setIsTimerActive(!isTimerActive); }} className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-all ${isTimerActive ? 'bg-yellow-300 text-black shadow-[0_0_20px_rgba(250,204,21,0.7)]' : 'bg-emerald-400 text-black shadow-[0_0_20px_rgba(16,185,129,0.7)]'}`}>{isTimerActive ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}</button>
              </div>
              )}
            </div>
              </div>
              <div className="w-full flex-shrink-0 snap-center flex items-center justify-between gap-2">
                <StopwatchDial timeLeft={timeLeft} maxTime={maxTime} overtimeSec={overtimeSec} className="w-[116px] h-[120px] flex-shrink-0" />
                <div className="flex flex-col items-end gap-2">
                  <div className={`text-xs font-black tracking-widest ${overtimeOn ? 'ot-text' : 'text-emerald-400/70'}`}>{overtimeOn ? '휴식 초과' : isTimerActive ? 'REST TIMER' : '일시정지'}</div>
                  {overtimeOn ? (
                    <div className="flex gap-2">
                      <button onClick={() => startRest(30)} className="h-12 px-3 rounded-2xl bg-black border border-emerald-500/30 font-black text-emerald-300 text-sm hover:bg-emerald-400/10 active:scale-95 transition-all">+30초 더 쉬기</button>
                      <button onClick={() => { stopAlarm(); setOvertimeSec(null); }} aria-label="초과 타이머 닫기" className="w-12 h-12 rounded-2xl bg-black border border-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center active:scale-95 transition-all"><X className="w-5 h-5" /></button>
                    </div>
                  ) : (
                  <div className="flex gap-2">
                    <button onClick={() => adjustTimer(-10)} className="w-12 h-12 rounded-2xl bg-black border border-emerald-500/30 font-black text-emerald-300 hover:bg-emerald-400/10 active:scale-95 transition-all">-10</button>
                    <button onClick={() => adjustTimer(30)} className="w-12 h-12 rounded-2xl bg-black border border-emerald-500/30 font-black text-emerald-300 hover:bg-emerald-400/10 active:scale-95 transition-all">+30</button>
                    <button onClick={() => { unlockAudio(); setIsTimerActive(!isTimerActive); }} className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-all ${isTimerActive ? 'bg-yellow-300 text-black shadow-[0_0_20px_rgba(250,204,21,0.7)]' : 'bg-emerald-400 text-black shadow-[0_0_20px_rgba(16,185,129,0.7)]'}`}>{isTimerActive ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}</button>
                  </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-center gap-1.5 mt-2">
              {[0, 1].map(i => (
                <button key={i} onClick={() => scrollTimerPage(i)} aria-label={i ? '스톱워치 보기' : '숫자 보기'} className={`h-1.5 rounded-full transition-all ${timerPage === i ? 'w-5 bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.8)]' : 'w-1.5 bg-neutral-600'}`} />
              ))}
            </div>
          </div>
        </div>

        {exerciseOptionsModal && (
          <div className="fixed inset-0 bg-black/80 z-[60] flex items-end justify-center backdrop-blur-sm transition-opacity" onClick={() => setExerciseOptionsModal(null)}>
            <div className="bg-neutral-900 w-full max-w-md rounded-t-[32px] pb-10 pt-3 px-6 shadow-[0_-20px_50px_rgba(0,0,0,0.8)] border-t border-neutral-800 animate-slide-up" onClick={e => e.stopPropagation()}>
              <div className="flex justify-center mb-6"><div className="w-12 h-1.5 bg-neutral-700 rounded-full"></div></div>
              <div className="space-y-3">
                <button onClick={() => { setSwapTargetExerciseId(exerciseOptionsModal); setExerciseOptionsModal(null); setIsAddExerciseModalOpen(true); }} className="w-full flex items-center gap-3 p-4 bg-neutral-800 hover:bg-neutral-700 rounded-2xl transition-colors text-left active:scale-95">
                  <div className="bg-neutral-900 p-2.5 rounded-xl"><RotateCw className="w-5 h-5 text-neutral-400"/></div>
                  <div><div className="font-black text-white">종목 변경하기</div><div className="text-xs font-bold text-neutral-400">다른 운동으로 대체합니다.</div></div>
                </button>
                <button onClick={() => { const targetEx = session.find(s => s.id === exerciseOptionsModal); setExerciseHistoryModal(targetEx ? targetEx.exercise : null); setExerciseOptionsModal(null); }} className="w-full flex items-center gap-3 p-4 bg-neutral-800 hover:bg-neutral-700 rounded-2xl transition-colors text-left active:scale-95">
                  <div className="bg-neutral-900 p-2.5 rounded-xl"><History className="w-5 h-5 text-neutral-400"/></div>
                  <div><div className="font-black text-white">이 종목 기록 보기</div><div className="text-xs font-bold text-neutral-400">과거 최고 기록 및 수행 로그를 확인합니다.</div></div>
                </button>
                <button onClick={() => removeExercise(exerciseOptionsModal)} className="w-full flex items-center gap-3 p-4 bg-rose-950/30 hover:bg-rose-900/40 border border-rose-900/50 rounded-2xl transition-colors text-left active:scale-95">
                  <div className="bg-rose-950 p-2.5 rounded-xl"><Trash2 className="w-5 h-5 text-rose-400"/></div>
                  <div><div className="font-black text-rose-400">루틴에서 삭제</div></div>
                </button>
              </div>
            </div>
          </div>
        )}

        {exerciseHistoryModal && (() => {
          const logs = getExerciseLogsHistory(exerciseHistoryModal.id);
          const maxWeight = logs.reduce((m, l) => Math.max(m, ...l.sets.map(s=>parseFloat(s.weight)||0)), 0);
          return (
            <div className="fixed inset-0 bg-black/80 z-[75] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in" onClick={() => setExerciseHistoryModal(null)}>
              <div className="bg-neutral-900 border border-neutral-800 rounded-[32px] p-6 max-w-sm w-full max-h-[80vh] flex flex-col text-white shadow-2xl relative" onClick={e=>e.stopPropagation()}>
                <button onClick={() => setExerciseHistoryModal(null)} className="absolute top-4 right-4 p-2 bg-neutral-800 rounded-full text-neutral-400"><X className="w-5 h-5"/></button>
                <div className="flex items-center gap-3 mb-4">
                  <SmartExerciseThumbnail exerciseId={exerciseHistoryModal.id} target={exerciseHistoryModal.target} tool={exerciseHistoryModal.tool} size="w-12 h-12" showShadow={false}/>
                  <div><h3 className="font-black text-xl">{exerciseHistoryModal.name}</h3><p className="text-xs text-emerald-400 font-bold">역대 최고: {maxWeight}kg</p></div>
                </div>
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 hide-scrollbar">
                  {logs.length > 0 ? logs.map((log, i) => (
                      <div key={`hist-log-${i}`} className="bg-neutral-950 p-3.5 rounded-2xl border border-neutral-800">
                        <div className="text-xs font-black text-neutral-400 mb-2 flex justify-between"><span>{log.date}</span><span className="text-emerald-500 font-bold">{log.sets.length}세트</span></div>
                        <div className="space-y-1">
                          {log.sets.map((s, j) => (
                            <div key={`s-${j}`} className="text-xs text-neutral-300 font-mono flex justify-between"><span>세트 {j+1}: {s.weight}kg x {s.reps}회</span><span className="text-neutral-500">1RM {calculate1RM(s.weight, s.reps)}kg</span></div>
                          ))}
                        </div>
                      </div>
                    )) : (<div className="text-center py-12 text-neutral-500 font-bold text-sm">과거 수행 기록이 없습니다.</div>)}
                </div>
              </div>
            </div>
          );
        })()}

        {plateVisualizerModal && (
          <div className="fixed inset-0 bg-black/80 z-[80] flex items-center justify-center p-4 backdrop-blur-sm animate-scale-up" onClick={() => setPlateVisualizerModal(null)}>
            <div className="bg-neutral-900 border border-neutral-800 rounded-[32px] p-6 max-w-sm w-full text-center text-white relative shadow-2xl" onClick={e=>e.stopPropagation()}>
              <button onClick={() => setPlateVisualizerModal(null)} className="absolute top-4 right-4 p-2 bg-neutral-800 rounded-full text-neutral-400"><X className="w-5 h-5"/></button>
              <h3 className="text-2xl font-black mb-1">{plateVisualizerModal.weight} kg</h3>
              <p className="text-xs font-bold text-neutral-400 mb-6">{(() => {
                const r = plateVisualizerModal.rule || { plates: 'both', bar: 20 };
                if (r.plates === 'one') return '한쪽 끝에만 꽂을 원판';
                return r.bar ? `${r.bar}kg 봉 + 양쪽에 똑같이 꽂을 원판` : '양쪽에 똑같이 꽂을 원판 (기구 무게 제외)';
              })()}</p>
              <div className="bg-neutral-950 p-6 rounded-2xl border border-neutral-800 flex items-center justify-center min-h-[120px] mb-6 relative overflow-x-auto">
                <div className="w-full h-3 bg-neutral-600 rounded-full absolute"></div>
                {(() => {
                  const r = plateVisualizerModal.rule || { plates: 'both' };
                  const Plate = ({ p }) => {
                    let h = "h-20"; let col = "bg-rose-500";
                    if (p === 20) { h = "h-20"; col = "bg-blue-500"; }
                    if (p === 15) { h = "h-16"; col = "bg-amber-500"; }
                    if (p === 10) { h = "h-14"; col = "bg-emerald-500"; }
                    if (p === 5) { h = "h-12"; col = "bg-purple-500"; }
                    if (p < 5) { h = "h-10"; col = "bg-neutral-400"; }
                    return <div className={`w-5 ${h} ${col} rounded-sm shadow-md flex items-center justify-center text-[9px] font-black text-white`}>{p}</div>;
                  };
                  const side = plateVisualizerModal.plates;
                  return (
                    <div className="flex items-center justify-between w-full z-10">
                      <div className="flex gap-1 items-center flex-row-reverse">{r.plates === 'both' && side.map((p, i) => <Plate key={`l-${i}`} p={p} />)}</div>
                      <span className="text-[10px] font-black text-neutral-300 bg-neutral-800 px-2 py-0.5 rounded">{r.bar ? `봉 ${r.bar}kg` : r.plates === 'one' ? '고정 축' : '기구'}</span>
                      <div className="flex gap-1 items-center">{side.map((p, i) => <Plate key={`r-${i}`} p={p} />)}</div>
                    </div>
                  );
                })()}
              </div>
              <p className="text-sm font-black text-emerald-400 mb-1">{(plateVisualizerModal.rule || { plates: 'both' }).plates === 'both' ? '한쪽' : '원판'} {sideWeight(plateVisualizerModal.plates)}kg = {formatPlates(plateVisualizerModal.plates)}</p>
              <p className="text-[11px] font-bold text-neutral-500 mb-3">{(plateVisualizerModal.rule || { plates: 'both' }).plates === 'both' ? '반대쪽에도 똑같이 꽂아요' : '한쪽 끝에만 꽂아요'}</p>
              <div className="flex gap-2 justify-center flex-wrap">
                {plateVisualizerModal.plates.map((p, idx) => (<span key={`txt-p-${idx}`} className="text-xs font-black bg-neutral-800 px-3 py-1 rounded-lg border border-neutral-700">{p}kg</span>))}
              </div>
            </div>
          </div>
        )}

        {isAddExerciseModalOpen && (
          <div className="fixed inset-0 bg-black/60 z-[70] flex flex-col justify-end animate-fade-in" onClick={() => setIsAddExerciseModalOpen(false)}>
            <div className="bg-white w-full h-[90vh] rounded-t-[40px] shadow-[0_-20px_50px_rgba(0,0,0,0.5)] flex flex-col animate-slide-up text-neutral-900 overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="px-5 py-4 flex justify-between items-center bg-white sticky top-0 z-10 border-b border-neutral-100">
                <button onClick={() => { showToast("운동 사진 분석 기능은 준비 중입니다."); }} className="text-neutral-500 hover:bg-neutral-100 p-2 rounded-full transition-colors"><Camera className="w-6 h-6"/></button>
                <h2 className="text-xl font-black">{swapTargetExerciseId ? '종목 변경' : '종목 추가'}</h2>
                <button onClick={() => {setIsAddExerciseModalOpen(false); setSwapTargetExerciseId(null);}} className="text-neutral-900 p-2 rounded-full hover:bg-neutral-100 transition-colors"><X className="w-6 h-6"/></button>
              </div>
              <div className="p-4 bg-white sticky top-[65px] z-10 border-b border-neutral-50 shadow-[0_5px_10px_rgba(0,0,0,0.02)]">
                <div className="bg-neutral-100 rounded-xl p-3 mb-3 flex items-center gap-2">
                  <Search className="w-5 h-5 text-neutral-400" />
                  <input type="text" placeholder="종목 이름을 검색하세요. (ex. 스쿼트)" value={exSearchQuery} onChange={e => setExSearchQuery(e.target.value)} className="bg-transparent border-none outline-none w-full text-sm font-bold text-neutral-900 placeholder:text-neutral-400" />
                </div>
                <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                  {['전체', '가슴', '등', '하체', '어깨', '팔', '복근'].map(cat => (
                    <button key={cat} onClick={() => setExCategoryFilter(cat)} className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${exCategoryFilter === cat ? 'bg-neutral-800 text-white border-neutral-800' : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'}`}>{cat}</button>
                  ))}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-neutral-50">
                {EXERCISE_OPTIONS.filter(ex => (exCategoryFilter === '전체' || String(ex.target).includes(exCategoryFilter)) && String(ex.name).includes(exSearchQuery)).map((ex) => (
                  <div key={ex.id} onClick={() => swapTargetExerciseId ? swapExercise(ex) : addExerciseFromModal(ex)} className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-neutral-100 hover:border-[#4768ff] hover:shadow-md transition-all cursor-pointer group active:scale-95">
                    <SmartExerciseThumbnail exerciseId={ex.id} target={String(ex.target)} tool={String(ex.tool)} size="w-14 h-14" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-black text-neutral-900 text-base leading-snug break-keep group-hover:text-[#4768ff] transition-colors">{String(ex.name)}</h3>
                      <p className="text-[11px] font-bold text-neutral-400 mt-0.5 break-keep">{String(ex.target)} · {String(ex.tool)}</p>
                      <button onClick={(e) => { e.stopPropagation(); setGuideExerciseId(ex.id); }} className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-black text-[#4768ff] bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-lg transition-colors active:scale-95"><BookOpen className="w-3 h-3"/> 설명</button>
                    </div>
                    <button className="p-2 bg-neutral-50 rounded-full group-hover:bg-blue-100 text-neutral-400 group-hover:text-blue-600 transition-colors flex-shrink-0"><Plus className="w-5 h-5"/></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-neutral-900 pb-[80px] flex flex-col relative overflow-hidden">
      {globalOverlays}
      <header className="px-5 pt-5 pb-3 flex justify-between items-center sticky top-0 z-10 bg-white/95 backdrop-blur-md">
        {(() => {
          const d = new Date(currentDate);
          const isToday = currentDate === formatDate(new Date());
          return (
            <button onClick={() => setIsFullCalendarOpen(true)} className="flex items-center gap-1.5 active:scale-[0.98] transition-transform text-left">
              <span className="text-[22px] font-black tracking-tight text-neutral-900">{d.getMonth() + 1}월 {d.getDate()}일 {['일', '월', '화', '수', '목', '금', '토'][d.getDay()]}요일</span>
              {isToday && <span className="text-[11px] font-black text-white bg-neutral-900 px-2 py-0.5 rounded-full">오늘</span>}
              <ChevronRight className="w-5 h-5 rotate-90 text-neutral-400" />
            </button>
          );
        })()}
        <div className="flex gap-2 items-center relative">
          <button onClick={() => setIsFullCalendarOpen(true)} aria-label="달력" className="w-10 h-10 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center active:scale-90 transition-all">
            <CalendarDays className="w-5 h-5 text-neutral-700" />
          </button>
          <div className="relative">
            <button onClick={() => setIsNotiOpen(!isNotiOpen)} aria-label="알림" className={`relative w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition-all ${isNotiOpen ? 'bg-neutral-900' : 'bg-neutral-100 hover:bg-neutral-200'}`}>
              <Bell className={`w-5 h-5 ${isNotiOpen ? 'text-white' : 'text-neutral-700'}`} />
              {unreadCount > 0 && <div className="absolute -top-0.5 -right-0.5 bg-rose-500 text-white text-[10px] font-black min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center ring-2 ring-white">{unreadCount}</div>}
            </button>
            {isNotiOpen && (
              <div className="absolute right-0 top-full mt-3 w-80 bg-white rounded-[24px] shadow-[0_16px_48px_rgba(0,0,0,0.16)] border border-neutral-100 overflow-hidden z-50 animate-fade-in origin-top-right text-left">
                <div className="p-4 border-b border-neutral-100 flex justify-between items-center">
                  <span className="font-black text-neutral-900 text-sm">알림</span>
                  {cloudUser && <button onClick={() => { setIsNotiOpen(false); setIsFriendSearchModalOpen(true); }} className="text-[11px] font-black text-[#4768ff] bg-[#eef2ff] px-2.5 py-1 rounded-lg hover:bg-[#e0e7ff] transition-colors">친구 관리</button>}
                </div>
                <div className="max-h-80 overflow-y-auto hide-scrollbar">
                  {friendState.incoming.map(r => (
                    <div key={`req-${r.requestId}`} className="p-4 border-b border-neutral-100">
                      <div className="text-xs font-black text-[#4768ff] mb-1.5 flex items-center gap-1.5"><Users className="w-3.5 h-3.5"/> 친구 요청</div>
                      <div className="text-sm font-bold text-neutral-600 leading-relaxed mb-3"><span className="text-neutral-900 font-black">{profilesById[r.from]?.name || '짐스피릿 유저'}</span>님이 친구를 맺고 싶어해요.</div>
                      <div className="flex gap-2">
                        <button onClick={() => declineFriend(r.requestId)} className="flex-1 bg-neutral-100 text-neutral-600 text-xs font-black py-2 rounded-lg hover:bg-neutral-200 transition-colors">거절</button>
                        <button onClick={() => acceptFriend(r.requestId)} className="flex-[2] bg-[#4768ff] text-white text-xs font-black py-2 rounded-lg hover:bg-[#3b5bdb] transition-colors">수락하기</button>
                      </div>
                    </div>
                  ))}
                  {!cloudUser && (
                    <button onClick={() => { setIsNotiOpen(false); goToSignup(); }} className="w-full p-4 text-left border-b border-neutral-100 hover:bg-neutral-50 transition-colors">
                      <div className="text-xs font-black text-[#4768ff] mb-1">게스트 모드</div>
                      <div className="text-xs font-bold text-neutral-500 leading-relaxed">회원가입하면 친구 요청과 응원 알림을 받을 수 있어요.</div>
                    </button>
                  )}
                  {cloudUser && unreadCount === 0 && (<div className="p-8 text-center text-neutral-400 font-bold text-sm">새로운 알림이 없어요</div>)}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto hide-scrollbar">
        {activeTab === 'workout' && (
          <div className="flex flex-col h-full animate-fade-in">
            <div className="flex justify-between px-4 pb-4 pt-1 border-b border-neutral-100">
              {weekDays.map((d, index) => {
                const dateStr = formatDate(d);
                const isSelected = dateStr === currentDate;
                const hasWorkout = Array.isArray(safeWorkouts[dateStr]) && safeWorkouts[dateStr].length > 0;
                const dayNames = ['일','월','화','수','목','금','토'];
                return (
                  <button key={`wd-${index}`} onClick={() => setCurrentDate(dateStr)} className="flex flex-col items-center gap-1.5 w-11 active:scale-90 transition-transform">
                    <span className={`text-[11px] font-bold ${d.getDay()===0 ? 'text-rose-400' : d.getDay()===6 ? 'text-blue-400' : 'text-neutral-400'}`}>{dayNames[d.getDay()]}</span>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[17px] font-black transition-all ${isSelected ? 'bg-neutral-900 text-white' : dateStr === formatDate(new Date()) ? 'text-[#4768ff] bg-[#eef2ff]' : 'text-neutral-800 hover:bg-neutral-100'}`}>
                      {d.getDate()}
                    </div>
                    <div className={`w-1 h-1 rounded-full -mt-1 ${hasWorkout ? 'bg-[#4768ff]' : 'bg-transparent'}`} />
                  </button>
                );
              })}
            </div>

            <div className="flex-1 bg-neutral-50 text-neutral-900 p-5 pb-32 min-h-[60vh]">
              <div className="flex gap-3 mb-8 mt-2">
                <div onClick={() => setCurrentScreen('diet')} className="flex-1 bg-white p-4 rounded-[24px] border border-neutral-100 flex items-center gap-3 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all cursor-pointer active:scale-95 group">
                  <div className="bg-neutral-50 p-2.5 rounded-xl shadow-inner border border-neutral-100 group-hover:scale-110 group-hover:bg-emerald-50 transition-all"><Utensils className="w-5 h-5 text-emerald-600" /></div>
                  <div><div className="font-black text-sm text-neutral-900">식단 플래너</div><div className="text-[11px] font-bold text-neutral-400 mt-0.5">매크로 계산</div></div>
                </div>
                <div onClick={() => setActiveTab('analysis')} className="flex-1 bg-white p-4 rounded-[24px] border border-neutral-100 flex items-center gap-3 shadow-sm hover:shadow-md hover:border-[#4768ff] transition-all cursor-pointer active:scale-95 group">
                  <div className="bg-neutral-50 p-2.5 rounded-xl shadow-inner border border-neutral-100 group-hover:scale-110 group-hover:bg-[#e8edff] transition-all"><Zap className="w-5 h-5 text-[#4768ff]" /></div>
                  <div><div className="font-black text-sm text-neutral-900">근육 회복도</div><div className="text-[11px] font-black text-[#4768ff] bg-blue-50 px-1.5 py-0.5 rounded mt-0.5 w-max">상세 보기</div></div>
                </div>
              </div>

              <div className="flex justify-between items-end mb-5">
                <h2 className="text-2xl font-black text-neutral-900 tracking-tight">내 루틴</h2>
                <button onClick={() => guardNewWorkout(() => { setSession([]); setWorkoutDurationSec(0); setCurrentDate(formatDate(new Date())); setCurrentScreen('workout'); })} className="text-sm font-bold text-neutral-500 hover:text-neutral-900 transition-colors flex items-center gap-1 active:scale-95"><Plus className="w-4 h-4 stroke-[3]"/> 새 루틴</button>
              </div>

              <div className="space-y-4">
                {(() => {
                  const todayWorkout = safeWorkouts[currentDate] || [];
                  const otherPastDates = pastWorkoutDates.filter(d => d !== currentDate).slice(0, 3);
                  return (
                    <>
                      {todayWorkout.length > 0 ? (
                        <div onClick={() => setSelectedDayDetailModal(currentDate)} className="bg-white border-2 border-emerald-400 p-5 rounded-[28px] shadow-md relative hover:shadow-lg hover:border-emerald-500 transition-all cursor-pointer group mt-2">
                          <div className="absolute -top-3 left-5 bg-emerald-500 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-sm flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> 오운완 완료</div>
                          <div className="flex justify-between items-start mb-2 mt-2">
                            <h3 className="font-black text-xl text-neutral-900 group-hover:text-emerald-600 transition-colors">{currentDate === formatDate(new Date()) ? '오늘의 훈련' : `${currentDate.split('-')[1]}월 ${currentDate.split('-')[2]}일 훈련`}</h3>
                            <div className="relative"><button onClick={(e) => { e.stopPropagation(); setSelectedPastDate(currentDate); setIsRoutineLoaderOpen(true); }} className="text-neutral-400 p-1.5 hover:bg-neutral-100 rounded-full transition-colors active:scale-90"><MoreVertical className="w-5 h-5"/></button></div>
                          </div>
                          <p className="text-sm text-neutral-500 mb-4 font-bold">{[...new Set(todayWorkout.map(ex => getExTarget(ex).split('(')[0]))].join(', ') || '전신'}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-neutral-500 bg-neutral-50 px-2 py-1 rounded-md border border-neutral-100">{todayWorkout.length}개 종목</span>
                            <span className="text-xs font-bold text-neutral-400">{todayWorkout[0] ? getExName(todayWorkout[0]) : ''} {todayWorkout.length > 1 ? '외' : ''}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-neutral-50 border border-neutral-100 p-8 rounded-[28px] text-center shadow-inner mt-4 flex flex-col items-center">
                          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-neutral-100"><Dumbbell className="w-8 h-8 text-neutral-300" /></div>
                          <p className="text-sm font-bold text-neutral-500 mb-1">이 날짜에 기록된 루틴이 없습니다.</p>
                          <p className="text-xs font-bold text-neutral-400 mb-6">하단의 버튼을 눌러 바로 훈련을 시작해보세요!</p>
                          <button onClick={() => guardNewWorkout(() => { setSession([]); setWorkoutDurationSec(0); setCurrentScreen('workout'); })} className="bg-[#4768ff] text-white font-black px-6 py-3 rounded-xl shadow-[0_5px_15px_rgba(71,104,255,0.3)] hover:bg-blue-600 active:scale-95 transition-all">빈 운동 시작하기</button>
                        </div>
                      )}

                      {otherPastDates.length > 0 && (
                        <div className="pt-6 border-t border-neutral-100 mt-6">
                          <h3 className="text-sm font-black text-neutral-400 mb-4 ml-1">최근 기록된 다른 훈련</h3>
                          <div className="space-y-3">
                            {otherPastDates.map((date, idx) => {
                              const sessionData = safeWorkouts[date] || [];
                              const firstExName = sessionData[0] ? getExName(sessionData[0]) : '';
                              const targets = [...new Set(sessionData.map(ex => getExTarget(ex).split('(')[0]))].join(', ') || '전신';
                              return (
                                <div key={`hist-${idx}`} onClick={() => setSelectedDayDetailModal(date)} className="bg-white border border-neutral-100 p-4 rounded-[24px] shadow-sm relative hover:shadow-md hover:border-[#4768ff] transition-all cursor-pointer group">
                                  <div className="flex justify-between items-start mb-1.5">
                                    <h3 className="font-black text-lg text-neutral-900 group-hover:text-[#4768ff] transition-colors">{date.split('-')[1]}월 {date.split('-')[2]}일</h3>
                                    <div className="relative"><button onClick={(e) => { e.stopPropagation(); setSelectedPastDate(date); setIsRoutineLoaderOpen(true); }} className="text-neutral-400 p-1.5 hover:bg-neutral-100 rounded-full transition-colors active:scale-90"><MoreVertical className="w-5 h-5"/></button></div>
                                  </div>
                                  <p className="text-xs text-neutral-500 mb-3 font-bold">{targets}</p>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-bold text-neutral-500 bg-neutral-50 px-2 py-1 rounded-md border border-neutral-100">{sessionData.length}개 종목</span>
                                    <span className="text-[11px] font-bold text-neutral-400">{firstExName} {sessionData.length > 1 ? '외' : ''}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>

            <div className="fixed bottom-[96px] left-0 right-0 px-6 flex gap-3 pointer-events-none z-10">
              <button onClick={() => { setIsRoutineLoaderOpen(true); }} className="flex-1 bg-[#4b4e54] text-white font-black py-4 rounded-2xl text-center shadow-xl hover:bg-neutral-700 transition-colors active:scale-95 pointer-events-auto text-lg">이전 기록 불러오기</button>
              <button onClick={() => setActiveTab('program')} className="flex-1 bg-[#4768ff] text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-[0_10px_25px_rgba(71,104,255,0.4)] hover:bg-blue-600 transition-colors active:scale-95 pointer-events-auto text-lg"><Sparkles className="w-5 h-5" /> 추천 프로그램</button>
            </div>
          </div>
        )}

        {activeTab === 'analysis' && (() => {
          const weekInfo = getAnalysisWeekInfo(analysisDate);
          const volData = getWeeklyVolumeData(weekInfo.monday);
          const recoveryData = getMuscleRecoveryStatus();
          let volumeChangePercent = 0;
          if(volData.prevTotal > 0) volumeChangePercent = Math.round(((volData.total - volData.prevTotal) / volData.prevTotal) * 100);
          else if(volData.total > 0) volumeChangePercent = 100;
          const sq1RM = getEffective1RM('sq');
          const bp1RM = getEffective1RM('bp');
          const dl1RM = getEffective1RM('dl');
          const userGender = activeUser?.profile?.gender || 'male';
          const sqTier = getLiftPercentile('sq', sq1RM, userGender);
          const bpTier = getLiftPercentile('bp', bp1RM, userGender);
          const dlTier = getLiftPercentile('dl', dl1RM, userGender);
          const load = getWeeklyLoadReport(weekInfo.monday);
          const LEVEL_UI = {
            empty: { label: '기록 없음', chip: 'text-neutral-500 bg-neutral-100 border-neutral-200' },
            low: { label: '훈련량 부족', chip: 'text-sky-600 bg-sky-50 border-sky-200' },
            collecting: { label: '기준 데이터 수집 중', chip: 'text-neutral-600 bg-neutral-100 border-neutral-200' },
            good: { label: '적정 부하 · 성장 구간', chip: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
            caution: { label: '주의 · 피로 누적', chip: 'text-amber-600 bg-amber-50 border-amber-200' },
            danger: { label: '위험 · 휴식 필요', chip: 'text-rose-600 bg-rose-50 border-rose-200' },
          };
          const SET_STATUS_UI = {
            none: { label: '안 함', color: 'text-neutral-400', bar: 'bg-neutral-300' },
            low: { label: '부족', color: 'text-sky-600', bar: 'bg-sky-400' },
            good: { label: '적정', color: 'text-emerald-600', bar: 'bg-emerald-500' },
            high: { label: '과다', color: 'text-rose-600', bar: 'bg-rose-500' },
          };
          const ADVICE_UI = {
            danger: 'bg-rose-50 border-rose-100 text-rose-700',
            caution: 'bg-amber-50 border-amber-100 text-amber-800',
            good: 'bg-emerald-50 border-emerald-100 text-emerald-800',
            info: 'bg-neutral-50 border-neutral-100 text-neutral-700',
          };
          const acwrPos = load.acwr === null ? null : Math.min(load.acwr, 2) / 2 * 100;
          const trendWeeks = [...load.history.map((h, i) => ({ label: `${4 - i}주 전`, sets: h.sets })), { label: load.isCurrentWeek ? '이번 주' : '이 주', sets: load.current.sets, current: true }];
          const trendMax = Math.max(...trendWeeks.map(w => w.sets), load.chronicSets, 10);

          return (
            <div className="flex-1 bg-neutral-50 text-neutral-900 pb-28 overflow-y-auto animate-fade-in">
              <div className="bg-white px-6 py-6 shadow-sm mb-4 sticky top-0 z-20 border-b border-neutral-100 flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-black text-neutral-900 tracking-tight">{String(weekInfo.title)}</h2>
                  <p className="text-sm font-bold text-neutral-400 mt-1">{String(weekInfo.subtitle)}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { const d = new Date(analysisDate); d.setDate(d.getDate()-7); setAnalysisDate(d); }} className="p-2.5 bg-neutral-50 rounded-xl hover:bg-neutral-100 border border-neutral-100 transition-colors active:scale-90"><ChevronLeft className="w-5 h-5 text-neutral-600"/></button>
                  <button onClick={() => { const d = new Date(analysisDate); d.setDate(d.getDate()+7); setAnalysisDate(d); }} className="p-2.5 bg-neutral-50 rounded-xl hover:bg-neutral-100 border border-neutral-100 transition-colors active:scale-90"><ChevronRight className="w-5 h-5 text-neutral-600"/></button>
                </div>
              </div>

              <div className="px-5 space-y-6">
                <div className="bg-white p-6 rounded-[32px] shadow-sm border border-neutral-100">
                  <div className="flex flex-wrap justify-between items-center gap-2 mb-1">
                    <h3 className="text-xl font-black text-neutral-900 tracking-tight flex items-center gap-2"><Activity className="w-5 h-5 text-[#4768ff]"/> 주간 신체 피로도 및 부하 분석</h3>
                    <span className={`text-xs font-black px-3 py-1 rounded-xl border ${LEVEL_UI[load.level].chip}`}>{LEVEL_UI[load.level].label}</span>
                  </div>
                  <p className="text-xs font-bold text-neutral-500 mb-5">완료한 본세트(워밍업 제외)를 기준으로 훈련량, 강도, 휴식을 함께 분석합니다.</p>

                  {/* 핵심 지표 */}
                  <div className="grid grid-cols-4 gap-2 text-center mb-5">
                    {[
                      { label: '운동일', value: `${load.current.days}일` },
                      { label: '본세트', value: `${load.current.sets}` },
                      { label: '평균 RPE', value: load.current.avgRpe !== null ? load.current.avgRpe.toFixed(1) : '-' },
                      { label: '연속 운동', value: `${load.streak}일`, warn: load.streak >= 4 },
                    ].map(m => (
                      <div key={m.label} className="bg-neutral-50 py-3 px-1 rounded-xl border border-neutral-100">
                        <div className="text-[10px] font-bold text-neutral-400 mb-0.5">{m.label}</div>
                        <div className={`text-lg font-black tabular-nums ${m.warn ? 'text-rose-500' : 'text-neutral-900'}`}>{m.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* 부하 비율 게이지 */}
                  <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-100 mb-5">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="text-xs font-black text-neutral-700">평소 대비 훈련량 (부하 비율)</span>
                      <span className="text-lg font-black text-neutral-900 tabular-nums">{load.acwr !== null ? `${load.acwr.toFixed(2)}배` : '-'}</span>
                    </div>
                    <p className="text-[11px] font-bold text-neutral-400 mb-3">이 주 본세트 ÷ 최근 4주 평균({load.chronicSets ? Math.round(load.chronicSets) : 0}세트)</p>
                    <div className="relative h-3 rounded-full overflow-hidden flex">
                      <div className="bg-sky-200" style={{ width: '40%' }} />
                      <div className="bg-emerald-300" style={{ width: '25%' }} />
                      <div className="bg-amber-300" style={{ width: '10%' }} />
                      <div className="bg-rose-300" style={{ width: '25%' }} />
                    </div>
                    <div className="relative h-4">
                      {acwrPos !== null && <div className="absolute -top-[15px] w-1.5 h-5 bg-neutral-900 rounded-full border-2 border-white shadow" style={{ left: `calc(${acwrPos}% - 3px)` }} />}
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-black">
                      <span className="text-sky-600 flex items-center gap-1"><i className="w-2 h-2 rounded-full bg-sky-300 inline-block" />부족 0.8 미만</span>
                      <span className="text-emerald-600 flex items-center gap-1"><i className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />적정 0.8~1.3</span>
                      <span className="text-amber-600 flex items-center gap-1"><i className="w-2 h-2 rounded-full bg-amber-400 inline-block" />주의 1.3~1.5</span>
                      <span className="text-rose-600 flex items-center gap-1"><i className="w-2 h-2 rounded-full bg-rose-400 inline-block" />급증 1.5 이상</span>
                    </div>
                    {load.acwr === null && <p className="text-[11px] font-bold text-neutral-500 mt-2">2주 이상 기록이 쌓이면 계산됩니다.</p>}
                  </div>

                  {/* 5주 추이 */}
                  <div className="mb-5">
                    <div className="flex justify-between items-baseline mb-3">
                      <h4 className="text-xs font-black text-neutral-700">최근 5주 본세트 추이</h4>
                      {load.chronicSets > 0 && <span className="text-[10px] font-bold text-neutral-400">점선 = 4주 평균 {Math.round(load.chronicSets)}세트</span>}
                    </div>
                    <div className="relative flex items-end justify-between gap-2 h-24 border-b border-neutral-200">
                      {load.chronicSets > 0 && (
                        <div className="absolute left-0 right-0 border-t border-dashed border-neutral-400 pointer-events-none" style={{ bottom: `${(load.chronicSets / trendMax) * 100}%` }}>
                        </div>
                      )}
                      {trendWeeks.map(w => (
                        <div key={w.label} className="flex-1 flex flex-col items-center justify-end h-full">
                          <span className="text-[10px] font-black text-neutral-500 tabular-nums mb-0.5">{w.sets || ''}</span>
                          <div className={`w-full max-w-[34px] rounded-t-md ${w.current ? 'bg-[#4768ff]' : 'bg-neutral-300'}`} style={{ height: `${Math.max((w.sets / trendMax) * 100, w.sets ? 4 : 0)}%` }} />
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between gap-2 mt-1.5">
                      {trendWeeks.map(w => <span key={w.label} className={`flex-1 text-center text-[10px] font-bold ${w.current ? 'text-[#4768ff]' : 'text-neutral-400'}`}>{w.label}</span>)}
                    </div>
                  </div>

                  {/* 부위별 주간 세트 */}
                  <div className="mb-5">
                    <div className="flex justify-between items-baseline mb-3">
                      <h4 className="text-xs font-black text-neutral-700">부위별 주간 세트</h4>
                      <span className="text-[10px] font-bold text-neutral-400">권장 10~20세트</span>
                    </div>
                    <div className="space-y-2.5">
                      {load.groupStatus.map(gs => {
                        const ui = SET_STATUS_UI[gs.status];
                        return (
                          <div key={gs.group} className="flex items-center gap-3">
                            <span className="w-9 text-xs font-black text-neutral-700">{gs.group}</span>
                            <div className="relative flex-1 h-2.5 bg-neutral-100 rounded-full overflow-hidden">
                              <div className="absolute inset-y-0 bg-emerald-100" style={{ left: `${10 / 25 * 100}%`, width: `${10 / 25 * 100}%` }} />
                              <div className={`absolute inset-y-0 left-0 rounded-full ${ui.bar}`} style={{ width: `${Math.min(gs.sets / 25, 1) * 100}%` }} />
                            </div>
                            <span className="w-8 text-right text-xs font-black text-neutral-900 tabular-nums">{gs.sets}</span>
                            <span className={`w-8 text-[10px] font-black ${ui.color}`}>{ui.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 코치 제안 */}
                  <div>
                    <h4 className="text-xs font-black text-neutral-700 mb-2.5 flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5 text-[#4768ff]"/> 이번 주 코치 제안</h4>
                    <ul className="space-y-2">
                      {load.advice.map((a, i) => (
                        <li key={i} className={`text-xs font-bold leading-relaxed p-3 rounded-xl border ${ADVICE_UI[a.tone]}`}>{a.text}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-[32px] shadow-sm border border-neutral-100">
                   <div className="flex justify-between items-center mb-4">
                     <div>
                       <h3 className="text-xs font-black text-neutral-400 uppercase tracking-wider mb-1">3대 운동 Peak 1RM Total</h3>
                       <p className="text-[10px] font-bold text-emerald-600 mb-1">입력한 1RM으로 운동 기록 때 RPE(힘든 정도)를 자동 추천해요</p>
                       <div className="text-3xl font-black text-neutral-900">{getTotalLift3()} <span className="text-base text-neutral-400 font-bold">kg</span></div>
                     </div>
                     <div className="flex flex-col gap-2">
                       <button onClick={() => { setManualRmInputs(Object.fromEntries(['sq', 'bp', 'dl'].map(k => { const v = parseFloat((activeUser?.manual1RM || {})[k]) || getTop1RM(k); return [k, v > 0 ? String(v) : '']; }))); setIsManualRmModalOpen(true); }} className="flex items-center gap-1.5 justify-center text-xs font-black text-neutral-600 bg-neutral-100 px-3 py-1.5 rounded-xl border border-neutral-200 hover:bg-neutral-200 transition-colors"><Edit3 className="w-3 h-3"/> 수동 기록</button>
                       <button onClick={() => setIsOneRmCalculatorOpen(true)} className="flex items-center justify-center gap-1.5 text-[11px] font-black text-[#4768ff] bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100 hover:bg-blue-100 transition-colors"><Calculator className="w-3 h-3"/> 계산기</button>
                     </div>
                   </div>
                   <div className="grid grid-cols-3 gap-3">
                     <div className="bg-neutral-50 p-3 rounded-2xl border border-neutral-100 text-center relative overflow-hidden">
                       <div className="text-[10px] font-black text-rose-500 mb-1">스쿼트</div>
                       <div className="text-lg font-black text-neutral-900 mb-1">{sq1RM > 0 ? `${sq1RM}kg` : '-'}</div>
                       {sq1RM > 0 && <div className={`text-[9px] font-black px-1.5 py-0.5 rounded border inline-block ${sqTier.color}`}>{sqTier.tier} {sqTier.label}</div>}
                     </div>
                     <div className="bg-neutral-50 p-3 rounded-2xl border border-neutral-100 text-center relative overflow-hidden">
                       <div className="text-[10px] font-black text-blue-500 mb-1">벤치프레스</div>
                       <div className="text-lg font-black text-neutral-900 mb-1">{bp1RM > 0 ? `${bp1RM}kg` : '-'}</div>
                       {bp1RM > 0 && <div className={`text-[9px] font-black px-1.5 py-0.5 rounded border inline-block ${bpTier.color}`}>{bpTier.tier} {bpTier.label}</div>}
                     </div>
                     <div className="bg-neutral-50 p-3 rounded-2xl border border-neutral-100 text-center relative overflow-hidden">
                       <div className="text-[10px] font-black text-emerald-600 mb-1">데드리프트</div>
                       <div className="text-lg font-black text-neutral-900 mb-1">{dl1RM > 0 ? `${dl1RM}kg` : '-'}</div>
                       {dl1RM > 0 && <div className={`text-[9px] font-black px-1.5 py-0.5 rounded border inline-block ${dlTier.color}`}>{dlTier.tier} {dlTier.label}</div>}
                     </div>
                   </div>
                </div>

                <div className="bg-white p-6 rounded-[32px] shadow-sm border border-neutral-100">
                  <h3 className="text-sm font-black text-neutral-400 mb-2 tracking-wider">주간 총 볼륨</h3>
                  <div className="text-4xl font-black text-neutral-900 mb-3 tracking-tighter">{volData.total.toLocaleString()}<span className="text-xl text-neutral-400 ml-1">kg</span></div>
                  <div className={`flex items-center text-sm font-bold w-max px-3 py-1.5 rounded-lg mb-8 ${volumeChangePercent >= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-rose-500 bg-rose-50'}`}>
                    {volumeChangePercent >= 0 ? <TrendingUp className="w-4 h-4 mr-1.5"/> : <TrendingDown className="w-4 h-4 mr-1.5"/>}
                    지난주 대비 {Math.abs(volumeChangePercent)}% {volumeChangePercent >= 0 ? '증가했어요' : '감소했어요'}
                  </div>
                  <div className="flex items-end justify-between h-48 border-b border-dashed border-neutral-200 pb-2 relative mt-8">
                    {volData.volumes.map((vol, i) => {
                      const dayDateStr = formatDate(volData.dayDates[i]);
                      const dayName = ['월','화','수','목','금','토','일'][i];
                      const daySession = safeWorkouts[dayDateStr] || [];
                      let bestEx = "휴식";
                      let maxExVol = 0;
                      daySession.forEach(ex => {
                          let exVol = 0;
                          if(ex.sets) ex.sets.forEach(s => { if(s.completed && s.reps) exVol += setVolume(ex, s); });
                          if(exVol > maxExVol) { maxExVol = exVol; bestEx = getExName(ex); }
                      });
                      return (
                        <div key={`vol-${i}`} onClick={() => setSelectedDayDetailModal(dayDateStr)} className="w-[12%] flex flex-col items-center justify-end h-full cursor-pointer group active:scale-90 transition-transform relative z-10">
                          <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-neutral-800 text-white text-[10px] p-2 rounded-lg pointer-events-none whitespace-nowrap shadow-lg z-20 flex flex-col items-center">
                             <span className="font-black text-emerald-400">{vol.toLocaleString()}kg</span>
                             <span className="text-neutral-300 font-bold max-w-[60px] truncate">{bestEx}</span>
                             <div className="absolute -bottom-1 w-2 h-2 bg-neutral-800 rotate-45"></div>
                          </div>
                          <div className="w-full bg-neutral-50 rounded-lg relative overflow-hidden group-hover:bg-neutral-100 transition-colors shadow-inner" style={{ height: '140px' }}>
                            <div className={`absolute bottom-0 w-full rounded-lg transition-all duration-1000 ease-out shadow-md ${i%2===0 ? 'bg-[#4768ff]' : 'bg-[#ff6b6b]'}`} style={{ height: `${Math.max((vol/volData.maxVolume)*100, vol > 0 ? 6 : 0)}%` }}></div>
                          </div>
                          <div className={`mt-3 text-[11px] font-bold transition-colors group-hover:text-emerald-600 px-2 py-1 rounded-md ${vol > 0 ? 'text-neutral-900 bg-neutral-100' : 'text-neutral-400'}`}>{dayName}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {(() => {
                  const radarLabels = ['하체', '가슴', '팔', '복근', '어깨', '등'];
                  const maxShare = Math.max(...radarLabels.map(l => volData.muscleShare[l] || 0), 1);
                  const getPoint = (index, ratio) => {
                    const angle = (Math.PI / 3) * index - (Math.PI / 2);
                    const r = ratio * 70;
                    return `${100 + r * Math.cos(angle)},${100 + r * Math.sin(angle)}`;
                  };
                  const bgPoints = radarLabels.map((_, i) => getPoint(i, 1)).join(' ');
                  const midPoints = radarLabels.map((_, i) => getPoint(i, 0.5)).join(' ');
                  const dataPoints = radarLabels.map((l, i) => getPoint(i, (volData.muscleShare[l] || 0) / maxShare)).join(' ');
                  return (
                    <div className="bg-white p-6 rounded-[32px] shadow-sm border border-neutral-100">
                      <div className="flex justify-between items-center mb-6">
                         <h3 className="text-xl font-black text-neutral-900 tracking-tight">나의 운동 육각 스탯</h3>
                         <span className="text-[10px] font-bold bg-[#e8edff] text-[#4768ff] px-2 py-1 rounded-md">주간 볼륨</span>
                      </div>
                      <div className="flex items-center justify-center relative h-56 mb-2">
                        <svg viewBox="0 0 200 200" className="w-full h-full max-w-[220px] drop-shadow-md overflow-visible">
                          <polygon points={bgPoints} fill="#f8fafc" stroke="#e2e8f0" strokeWidth="2"/>
                          <polygon points={midPoints} fill="none" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 4"/>
                          {radarLabels.map((_, i) => (<line key={`axis-${i}`} x1="100" y1="100" x2={getPoint(i, 1).split(',')[0]} y2={getPoint(i, 1).split(',')[1]} stroke="#e2e8f0" strokeWidth="1"/>))}
                          <polygon points={dataPoints} fill="rgba(16, 185, 129, 0.2)" stroke="#10b981" strokeWidth="3" className="transition-all duration-1000 ease-out origin-center hover:fill-[rgba(16,185,129,0.4)] cursor-pointer" style={{ filter: "drop-shadow(0 0 10px rgba(16, 185, 129, 0.4))" }} />
                          {radarLabels.map((l, i) => {
                             const p = getPoint(i, (volData.muscleShare[l] || 0) / maxShare).split(',');
                             return (<circle key={`dot-${i}`} cx={p[0]} cy={p[1]} r="4" fill="#10b981" stroke="#fff" strokeWidth="1.5" className="hover:r-[6px] hover:fill-rose-500 transition-all cursor-pointer"/>);
                          })}
                          {radarLabels.map((l, i) => {
                             const p = getPoint(i, 1.25).split(',');
                             return (<text key={`label-${i}`} x={p[0]} y={p[1]} fill="#64748b" fontSize="10" fontWeight="900" textAnchor="middle" dominantBaseline="middle">{l}</text>);
                          })}
                        </svg>
                      </div>
                      <div className="flex flex-wrap gap-2 justify-center mt-2">
                        {radarLabels.map(l => (
                          <div key={`legend-${l}`} className="bg-neutral-50 border border-neutral-100 px-3 py-1.5 rounded-xl flex items-center gap-2 hover:bg-emerald-50 hover:border-emerald-200 hover:-translate-y-1 transition-all cursor-pointer shadow-sm">
                             <span className="text-[10px] font-black text-neutral-500">{l}</span>
                             <span className="text-xs font-black text-neutral-900">{(volData.muscleShare[l] || 0).toLocaleString()}kg</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                <div className="bg-white p-6 rounded-[32px] shadow-sm border border-neutral-100 overflow-hidden relative">
                  <div className="relative z-10 mb-6">
                    <h3 className="text-xl font-black text-neutral-900 mb-1 tracking-tight">회복된 근육으로 운동을 시작해보세요</h3>
                    <p className="text-sm text-neutral-500 font-bold">지시선 모서리나 근육을 터치하면 부위별 맞춤 훈련이 생성됩니다!</p>
                  </div>
                  <div className="flex justify-between items-center relative py-6 bg-neutral-50 rounded-2xl border border-neutral-100 min-h-[480px] px-2 shadow-inner">
                    <div className="absolute inset-0 flex justify-center items-center pointer-events-auto p-2 opacity-100 z-20">
                      <AnimeMuscleBodySVG recoveryData={recoveryData} onMuscleClick={handleMuscleClick} />
                    </div>
                  </div>
                  {(() => {
                    const tired = Object.entries(recoveryData).filter(([, v]) => v.percent < 100).sort((x, y) => x[1].percent - y[1].percent);
                    return (
                      <div className="mt-4 space-y-2">
                        {tired.length === 0 ? (
                          <p className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2.5">모든 부위가 완전히 회복됐어요. 어떤 운동이든 좋아요!</p>
                        ) : tired.map(([g, v]) => (
                          <button key={g} onClick={() => handleMuscleClick(g)} className="w-full flex items-center gap-3 bg-neutral-50 border border-neutral-100 rounded-xl px-3 py-2.5 text-left active:scale-[0.99] transition-transform">
                            <span className="w-10 text-sm font-black text-neutral-900">{g}</span>
                            <span className="flex-1 h-2 rounded-full bg-neutral-200 overflow-hidden"><span className={`block h-full rounded-full ${v.percent < 50 ? 'bg-rose-500' : v.percent < 90 ? 'bg-amber-400' : 'bg-emerald-500'}`} style={{ width: `${v.percent}%` }} /></span>
                            <span className="text-right">
                              <span className={`block text-xs font-black ${v.color}`}>{v.percent}%{v.hoursLeft > 0 ? ` · ${v.hoursLeft}시간 남음` : ''}</span>
                              {v.lastAt && <span className="block text-[10px] font-bold text-neutral-400">{v.text.split(' 운동')[0]} 운동</span>}
                            </span>
                          </button>
                        ))}
                        <p className="text-[10px] font-bold text-neutral-400 leading-relaxed px-1">운동을 마친 시각부터 지난 시간과, 그날의 세트 수·무게 강도(내 최고 기록 대비)·RPE로 계산해요. 큰 근육(하체·등·가슴)일수록 회복이 오래 걸려요.</p>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          );
        })()}

        {activeTab === 'program' && (
          <div className="flex-1 bg-white pb-28 overflow-y-auto animate-fade-in text-neutral-900">
            <div className="sticky top-0 bg-white/95 backdrop-blur-md z-20 px-5 pt-5 pb-3 border-b border-neutral-100">
               <div className="bg-neutral-100 rounded-xl p-3.5 flex items-center gap-2 mb-4 shadow-inner">
                  <Search className="w-5 h-5 text-neutral-400" />
                  <input type="text" placeholder="루틴 또는 코치 이름을 검색하세요" className="bg-transparent border-none outline-none w-full text-sm font-bold text-neutral-900 placeholder:text-neutral-400" />
               </div>
               <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
                 {['전체', '추천', '근비대', '스트렝스', '맨몸운동', '전신', '상체', '하체', '어깨', '등'].map((tag) => (
                   <button key={tag} onClick={() => setProgramFilter(tag)} className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-black transition-all ${programFilter === tag ? 'bg-neutral-900 text-white shadow-sm' : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'}`}>{tag}</button>
                 ))}
               </div>
            </div>

            <div className="px-5 mt-5 mb-2">
              <div onClick={() => setIsAiCoachOpen(true)} className="bg-gradient-to-r from-[#4768ff] to-[#8b5cf6] p-5 rounded-[24px] shadow-lg text-white flex items-center justify-between cursor-pointer active:scale-95 transition-transform overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                <div className="relative z-10">
                  <h3 className="font-black text-lg mb-1 flex items-center gap-2"><MessageSquare className="w-5 h-5 fill-white/20"/> 스마트 AI 코치 상담소</h3>
                  <p className="text-[11px] font-bold text-blue-100">선택형 질문으로 나만의 맞춤 솔루션 찾기</p>
                </div>
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm relative z-10"><ChevronRight className="w-6 h-6 text-white" /></div>
              </div>
            </div>

            <div className="px-5 mt-6 mb-2">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-black text-lg text-neutral-900 flex items-center gap-1.5">👑 전설의 올림피아 루틴</h3>
              </div>
              <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-4">
                {OLYMPIA_LEGENDS.map((legend, idx) => {
                  const [nameKo, nameEn] = legend.name.split(' (');
                  return (
                  <div key={`legend-${idx}`} onClick={() => setSelectedLegendModal(legend)} className="w-72 h-52 flex-shrink-0 text-white rounded-[28px] shadow-lg hover:scale-[1.02] transition-transform cursor-pointer relative overflow-hidden bg-neutral-900">
                    <LegendArt id={legend.id} />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/35 to-transparent" />
                    <div className="relative z-10 h-full w-[64%] p-5 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-black bg-white/15 text-white px-2 py-0.5 rounded-md uppercase tracking-wider mb-2 inline-block border border-white/25 backdrop-blur-sm">{legend.nickname}</span>
                        <h4 className="font-black text-xl leading-tight drop-shadow">{nameKo}</h4>
                        {nameEn && <p className="text-[11px] font-bold text-white/70 mt-0.5">{nameEn.replace(')', '')}</p>}
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-white/80 line-clamp-2 leading-relaxed">{legend.desc}</p>
                        <span className="inline-block mt-2 text-[10px] bg-white/15 px-2 py-1 rounded text-white font-bold backdrop-blur-sm">{legend.routines.length}개의 부위별 루틴</span>
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>

            <div className="px-5 mt-6 mb-2">
              <h3 className="font-black text-lg text-neutral-900 mb-3 flex items-center gap-1.5">🇰🇷 대한민국 피트니스 4대장</h3>
              <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-4">
                {KOREAN_LEGENDS.map((legend, idx) => {
                  const [nameKo, nameEn] = legend.name.split(' (');
                  return (
                  <div key={`k-legend-${idx}`} onClick={() => setSelectedLegendModal(legend)} className="w-72 h-52 flex-shrink-0 text-white rounded-[28px] shadow-lg hover:scale-[1.02] transition-transform cursor-pointer relative overflow-hidden bg-neutral-900">
                    <LegendArt id={legend.id} />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/35 to-transparent" />
                    <div className="relative z-10 h-full w-[64%] p-5 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-black bg-white/15 text-white px-2 py-0.5 rounded-md uppercase tracking-wider mb-2 inline-block border border-white/25 backdrop-blur-sm">{legend.era}</span>
                        <h4 className="font-black text-xl leading-tight drop-shadow">{nameKo}</h4>
                        {nameEn && <p className="text-[11px] font-bold text-white/70 mt-0.5">{nameEn.replace(')', '')}</p>}
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-white/80 line-clamp-2 leading-relaxed">{legend.desc}</p>
                        <span className="inline-block mt-2 text-[10px] bg-white/15 px-2 py-1 rounded text-white font-bold backdrop-blur-sm">{legend.routines.length}개의 부위별 루틴</span>
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>

            <div className="px-5 mt-5">
              <h3 className="font-black text-lg text-neutral-900 mb-3 flex items-center gap-1.5">🔥 최근 인기 프로그램</h3>
              <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-4">
                {PROGRAMS.slice(0, 4).map((p, idx) => (
                  <div key={`feat-${idx}`} onClick={() => setSelectedProgramModal(p)} className="w-60 flex-shrink-0 bg-gradient-to-br from-neutral-900 to-neutral-800 text-white p-5 rounded-[28px] shadow-lg hover:scale-[1.02] transition-transform cursor-pointer relative overflow-hidden flex flex-col justify-between h-48">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl"></div>
                    <div>
                      <span className="text-[10px] font-black bg-emerald-500 text-neutral-950 px-2 py-0.5 rounded-md uppercase tracking-wider mb-2 inline-block">{p.level}</span>
                      <h4 className="font-black text-lg leading-tight line-clamp-2">{p.title}</h4>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-neutral-400">{p.author}</p>
                      <p className="text-[10px] text-emerald-400 font-bold mt-0.5">{p.duration}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-5 mt-6 space-y-4">
              <h3 className="font-black text-lg text-neutral-900 mb-1">나에게 맞는 프로그램 찾기</h3>
              {PROGRAMS.filter(p => programFilter === '전체' || (p.tags && p.tags.includes(programFilter))).map((prog, idx) => (
                <div key={`list-${idx}`} onClick={() => setSelectedProgramModal(prog)} className="flex items-center gap-4 cursor-pointer group bg-neutral-50 p-4 rounded-[24px] border border-neutral-100 hover:border-blue-200 hover:shadow-md transition-all active:scale-[0.98]">
                  <div className="w-16 h-16 rounded-xl bg-white overflow-hidden shadow-sm flex-shrink-0 border border-neutral-100 flex items-center justify-center relative"><Sparkles className="w-6 h-6 text-[#4768ff] group-hover:scale-110 transition-transform" /></div>
                  <div className="flex-1 min-w-0">
                     <h3 className="font-black text-neutral-900 text-base group-hover:text-[#4768ff] transition-colors truncate">{String(prog.title)}</h3>
                     <p className="text-xs text-neutral-500 font-bold mt-0.5">{String(prog.author)}</p>
                     <p className="text-[10px] text-neutral-400 mt-1">{String(prog.level)} · {String(prog.duration)}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-neutral-300 flex-shrink-0 group-hover:translate-x-1 transition-transform"/>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'ranking' && (() => {
          const weekInfo = getAnalysisWeekInfo(new Date());
          const mon = new Date(weekInfo.monday), sun = new Date(mon); sun.setDate(sun.getDate() + 6);
          const left = Math.ceil((new Date(sun.getFullYear(), sun.getMonth(), sun.getDate() + 1) - new Date()) / 86400000);
          const me = {
            id: cloudUser?.id || 'guest', name: currentUser?.profile?.nickname || '나',
            volume: getWeeklyVolumeData(weekInfo.monday).total, lift: getTotalLift3(), avatarColor: 'bg-neutral-800', fav: '전신', isMe: true, profile: currentUser?.profile,
          };
          return (
            <RankingTab
              users={rankProfiles.filter(u => u.id !== cloudUser?.id)}
              me={me}
              friends={friendState.friends}
              sentRequests={friendState.sent}
              cheers={cheersData}
              weekLabel={`${mon.getMonth() + 1}.${mon.getDate()} – ${sun.getMonth() + 1}.${sun.getDate()}`}
              daysLeft={left <= 1 ? '오늘 자정' : `${left}일`}
              onCheer={handleCheer}
              onSteal={stealRoutine}
              onFriend={sendFriendRequest}
              onFindFriends={() => setIsFriendSearchModalOpen(true)}
              onInvite={inviteFriends}
              guest={!cloudUser}
              onLogin={goToSignup}
              loading={rankLoading}
              Avatar3={FullBodyAvatar}
            />
          );
        })()}

        {activeTab === 'profile' && (
          <div className="flex-1 bg-neutral-50 pb-28 overflow-y-auto animate-fade-in text-neutral-900">
            <div className="bg-white p-6 pt-8 rounded-b-[40px] shadow-sm border-b border-neutral-100 mb-6 relative">
               <button onClick={handleLogout} className="absolute top-6 right-6 p-2 text-neutral-400 hover:bg-neutral-100 rounded-full transition-colors z-20"><LogOut className="w-5 h-5"/></button>
               <div className="flex flex-col items-center mb-6 relative">
                 <div className="relative cursor-pointer group mb-4" onClick={() => setIsAvatarStudioOpen(true)}>
                    <div className="bg-gradient-to-b from-neutral-100 to-neutral-50 rounded-3xl p-4 shadow-inner border border-neutral-100 relative">
                       <FullBodyAvatar profile={activeUser?.profile} bodyStats={activeUser?.bodyStats} size="w-40 h-72" pose={avatarPose} />
                       <div className="absolute bottom-2 right-2 bg-neutral-800 text-white p-2.5 rounded-full border-2 border-white shadow-md group-hover:bg-[#4768ff] transition-colors"><Settings className="w-4 h-4"/></div>
                    </div>
                 </div>
                 <div className="text-center">
                    {editingNick !== null ? (
                      <form onSubmit={e => { e.preventDefault(); const n = editingNick.trim().slice(0, 12); if (n) { updateProfile({ nickname: n }); showToast('닉네임을 바꿨어요.'); } setEditingNick(null); }} className="flex items-center justify-center gap-2">
                        <input autoFocus value={editingNick} maxLength={12} onChange={e => setEditingNick(e.target.value)} className="w-40 text-center text-lg font-black text-neutral-900 bg-neutral-100 rounded-xl px-3 py-1.5 outline-none focus:ring-2 focus:ring-[#4768ff]" />
                        <button type="submit" className="px-3 py-2 rounded-xl bg-[#4768ff] text-white text-xs font-black">저장</button>
                        <button type="button" onClick={() => setEditingNick(null)} className="px-3 py-2 rounded-xl bg-neutral-100 text-neutral-500 text-xs font-black">취소</button>
                      </form>
                    ) : (
                      <h2 className="text-2xl font-black text-neutral-900 flex items-center justify-center gap-2">{String(activeUser?.profile?.nickname || '짐스피릿 유저')}
                        <button onClick={() => setEditingNick(String(activeUser?.profile?.nickname || ''))} aria-label="닉네임 수정" className="p-1 rounded-lg text-neutral-300 hover:text-[#4768ff] hover:bg-neutral-100 transition-colors"><Edit3 className="w-4 h-4" /></button>
                        <div className="bg-[#e8edff] text-[#4768ff] text-[10px] font-black px-2 py-0.5 rounded-md">{getUserLevel()}</div></h2>
                    )}
                    {!cloudUser && <button onClick={goToSignup} className="mt-2 text-[11px] font-black text-[#4768ff] bg-[#eef2ff] px-3 py-1.5 rounded-lg">게스트 모드 · 회원가입하면 기록이 안전하게 저장돼요</button>}
                    <p className="text-sm font-bold text-neutral-500 mt-1 flex items-center justify-center gap-1.5"><Activity className="w-4 h-4 text-emerald-500"/> 3대 운동 <span className="text-neutral-900 text-base font-black">{getTotalLift3()}kg</span></p>
                 </div>
               </div>
               <div className="grid grid-cols-3 gap-3 mb-6">
                 <div onClick={openBodyStatsModal} className="bg-neutral-50 rounded-2xl p-4 text-center border border-neutral-100 cursor-pointer hover:bg-neutral-100 hover:shadow-md transition-all shadow-inner group">
                    <div className="text-[11px] font-bold text-neutral-500 mb-1 group-hover:text-neutral-700">몸무게</div>
                    <div className="font-black text-xl text-neutral-900">{activeUser?.bodyStats?.weight || '-'}<span className="text-xs text-neutral-400 ml-0.5">kg</span></div>
                 </div>
                 <div onClick={openBodyStatsModal} className="bg-neutral-50 rounded-2xl p-4 text-center border border-neutral-100 cursor-pointer hover:bg-neutral-100 hover:shadow-md transition-all shadow-inner group">
                    <div className="text-[11px] font-bold text-neutral-500 mb-1 group-hover:text-neutral-700">골격근량</div>
                    <div className="font-black text-xl text-neutral-900">{activeUser?.bodyStats?.muscle || '-'}<span className="text-xs text-neutral-400 ml-0.5">kg</span></div>
                 </div>
                 <div onClick={openBodyStatsModal} className="bg-neutral-50 rounded-2xl p-4 text-center border border-neutral-100 cursor-pointer hover:bg-neutral-100 hover:shadow-md transition-all shadow-inner group">
                    <div className="text-[11px] font-bold text-neutral-500 mb-1 group-hover:text-neutral-700">체지방률</div>
                    <div className="font-black text-xl text-neutral-900">{activeUser?.bodyStats?.fat || '-'}<span className="text-xs text-neutral-400 ml-0.5">%</span></div>
                 </div>
               </div>
               <button onClick={openBodyStatsModal} className="w-full bg-neutral-100 text-neutral-600 font-black py-4 rounded-2xl text-sm hover:bg-neutral-200 transition-colors active:scale-[0.98] mb-6">스탯 입력 및 수정하기</button>

               <QuestCenter
                 workouts={safeWorkouts}
                 diet={safeDiet}
                 bodyStats={activeUser?.bodyStats}
                 total3={getTotalLift3()}
                 questState={activeUser?.questState}
                 onClaim={claimQuestRewards}
                 onAwaken={awakenLevel}
               />

               <PosingGuideSection profile={activeUser?.profile} />

               <BodyTransform
                 history={activeUser?.bodyHistory || []}
                 goal={activeUser?.bodyGoal || {}}
                 gender={activeUser?.profile?.gender}
                 currentStats={activeUser?.bodyStats}
                 onSaveEntry={upsertBodyEntry}
                 onDeleteEntry={deleteBodyEntry}
                 onSaveGoal={saveBodyGoal}
               />
            </div>
          </div>
        )}
      </div>

      {selectedDayDetailModal && (() => {
        const sessionData = safeWorkouts[selectedDayDetailModal] || [];
        let totalVol = 0;
        let totalSets = 0;
        sessionData.forEach(ex => { if (ex.sets) ex.sets.forEach(s => { if (s.completed && s.reps) { totalVol += setVolume(ex, s); totalSets++; } }); });
        return (
          <div className="fixed inset-0 bg-black/70 z-[70] flex flex-col justify-end animate-fade-in" onClick={() => setSelectedDayDetailModal(null)}>
            <div className="bg-white text-neutral-900 w-full h-[85vh] rounded-t-[40px] flex flex-col shadow-[0_-20px_50px_rgba(0,0,0,0.5)] animate-slide-up relative overflow-hidden" onClick={e => e.stopPropagation()}>
               <div className="flex justify-center pt-3 pb-2 bg-white"><div className="w-12 h-1.5 bg-neutral-200 rounded-full"></div></div>
               <div className="px-6 flex justify-between items-start mb-4 border-b border-neutral-100 pb-5 bg-white">
                 <div>
                   <h2 className="text-2xl font-black tracking-tight">{(() => { const d = new Date(selectedDayDetailModal); return `${d.getMonth() + 1}월 ${d.getDate()}일 (${['일','월','화','수','목','금','토'][d.getDay()]})`; })()}</h2>
                   <p className="text-sm font-bold text-neutral-400 mt-1">{sessionData.length > 0 ? `운동 기록 · ${sessionData.length}개 종목` : '운동 기록 없음'}</p>
                 </div>
                 <button onClick={() => setSelectedDayDetailModal(null)} className="p-2 bg-neutral-100 rounded-full hover:bg-neutral-200 transition-colors active:scale-90"><X className="w-5 h-5 text-neutral-500"/></button>
               </div>
               <div className="flex-1 overflow-y-auto px-6 space-y-4 pb-4 bg-neutral-50 pt-4">
                 <div className="bg-white p-5 rounded-2xl border border-neutral-100 shadow-sm flex justify-between items-center mb-4">
                   <div className="text-center"><div className="text-xs text-neutral-400 font-bold mb-1">총 볼륨</div><div className="text-2xl font-black text-neutral-900">{totalVol.toLocaleString()}<span className="text-sm text-neutral-400 ml-1">kg</span></div></div>
                   <div className="w-[1px] h-12 bg-neutral-100"></div>
                   <div className="text-center"><div className="text-xs text-neutral-400 font-bold mb-1">완료 세트</div><div className="text-2xl font-black text-[#4768ff]">{totalSets}<span className="text-sm text-neutral-400 ml-1">세트</span></div></div>
                 </div>
                 <div className="space-y-4">
                    {sessionData.length === 0 ? (
                      <div className="text-center py-20 text-neutral-400 font-bold flex flex-col items-center"><Dumbbell className="w-12 h-12 mb-3 opacity-50"/>이 날은 기록된 운동이 없어요</div>
                    ) : (
                      sessionData.map((ex, idx) => (
                        <div key={`d-ex-${idx}`} className="bg-white p-4 rounded-2xl border border-neutral-100 flex justify-between items-center shadow-sm hover:border-[#4768ff] hover:shadow-md transition-all cursor-pointer group">
                          <div className="flex items-center gap-4">
                            <SmartExerciseThumbnail exerciseId={getExId(ex)} target={getExTarget(ex)} tool={ex.exercise && ex.exercise.tool ? String(ex.exercise.tool) : '바벨'} size="w-14 h-14" showShadow={false}/>
                            <div>
                              <div className="font-black text-neutral-900 text-base mb-1 group-hover:text-[#4768ff] transition-colors">{getExName(ex)}</div>
                              <div className="text-xs font-bold text-neutral-400">{(ex.sets||[]).filter(s=>s.completed).length}세트 완료</div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                 </div>
               </div>
               {sessionData.length > 0 && (
                 <div className="p-5 bg-white border-t border-neutral-100 shadow-[0_-5px_15px_rgba(0,0,0,0.02)] flex gap-2">
                   <button onClick={() => openPhotoCard(selectedDayDetailModal)} className="flex-1 bg-neutral-900 text-white font-black py-4 rounded-xl shadow-md hover:bg-neutral-800 active:scale-95 transition-all text-base flex items-center justify-center gap-2"><Camera className="w-5 h-5"/> 인증카드</button>
                   <button onClick={() => { loadSpecificWorkout(selectedDayDetailModal); setSelectedDayDetailModal(null); }} className="flex-[2] bg-[#4768ff] text-white font-black py-4 rounded-xl shadow-[0_10px_25px_rgba(71,104,255,0.3)] hover:bg-blue-600 active:scale-95 transition-all text-base">이 루틴 불러와서 운동하기</button>
                 </div>
               )}
             </div>
          </div>
        );
      })()}

      {isRoutineLoaderOpen && (
        <div className="fixed inset-0 bg-black/70 z-[70] flex justify-end flex-col animate-fade-in" onClick={() => setIsRoutineLoaderOpen(false)}>
          <div className="bg-white text-neutral-900 w-full h-[85vh] rounded-t-[40px] flex flex-col shadow-[0_-20px_50px_rgba(0,0,0,0.5)] animate-slide-up relative overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex justify-center pt-3 pb-2 bg-white"><div className="w-12 h-1.5 bg-neutral-200 rounded-full"></div></div>
            <h2 className="text-2xl font-black tracking-tight text-center mb-4 bg-white pb-2">이전 기록 불러오기</h2>
            {pastWorkoutDates.length > 0 ? (
              <div className="flex-1 overflow-y-auto px-5 pt-5 bg-neutral-50 space-y-3">
                {pastWorkoutDates.map((date, idx) => (
                  <button key={`ld-${idx}`} onClick={() => setSelectedPastDate(date)} className={`w-full text-left p-5 rounded-[24px] border-2 transition-all active:scale-[0.98] ${selectedPastDate === date ? 'bg-neutral-800 text-white border-neutral-800 shadow-md' : 'bg-white text-neutral-800 border-neutral-200 hover:border-neutral-300 shadow-sm'}`}>
                    <div className="font-black text-lg">{date} 루틴</div>
                    <div className="text-sm font-bold text-neutral-400 mt-1">{(safeWorkouts[date]||[]).length}개 종목 수행</div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-10 opacity-50 bg-neutral-50"><History className="w-16 h-16 mb-4 text-neutral-400"/><p className="font-bold text-neutral-500 text-center">아직 저장된 과거 기록이 없습니다.</p></div>
            )}
            <div className="px-5 pt-4 pb-6 bg-white mt-auto border-t border-neutral-100 flex gap-3">
              <button onClick={() => { setIsRoutineLoaderOpen(false); guardNewWorkout(() => { setSession([]); setWorkoutDurationSec(0); setCurrentScreen('workout'); }); }} className="flex-1 bg-[#4b4e54] text-white font-black py-4 rounded-xl hover:bg-neutral-700 transition-colors text-lg active:scale-95">빈 운동 시작</button>
              <button onClick={() => { if(selectedPastDate){ loadSpecificWorkout(selectedPastDate); setIsRoutineLoaderOpen(false); }}} className={`flex-1 font-black py-4 rounded-xl transition-all text-lg active:scale-95 ${selectedPastDate ? 'bg-[#4768ff] text-white shadow-[0_10px_25px_rgba(71,104,255,0.3)]' : 'bg-neutral-100 text-neutral-400'}`} disabled={!selectedPastDate}>불러오기</button>
            </div>
          </div>
        </div>
      )}

      {isAvatarStudioOpen && (
        <div className="fixed inset-0 bg-[#111111] z-[90] flex flex-col items-center pt-8 p-4 animate-fade-in" onClick={e=>e.stopPropagation()}>
          <div className="w-full max-w-md bg-neutral-900 rounded-[40px] border border-neutral-800 shadow-2xl animate-slide-up flex flex-col h-[90vh] overflow-hidden">
            <div className="px-6 py-5 flex justify-between items-center border-b border-neutral-800 bg-neutral-900 z-10">
              <button onClick={() => setIsAvatarStudioOpen(false)} className="text-neutral-400 hover:text-white flex items-center gap-1 font-bold transition-colors"><ChevronLeft className="w-5 h-5"/> 닫기</button>
              <h2 className="text-xl font-black text-white tracking-tight">아바타 스튜디오 2.0</h2>
              <button onClick={() => { setIsAvatarStudioOpen(false); showToast("아바타가 성공적으로 저장되었습니다!"); }} className="text-[#4768ff] font-black text-sm bg-blue-500/10 px-3 py-1.5 rounded-lg active:scale-95">저장</button>
            </div>
            <div className="flex-1 overflow-y-auto hide-scrollbar pb-6 bg-neutral-950">
              <div className="flex flex-col items-center my-8 relative">
                <div className="absolute inset-0 bg-gradient-to-b from-neutral-800/20 to-transparent pointer-events-none"></div>
                <div className="relative mb-6 drop-shadow-[0_20px_30px_rgba(0,0,0,0.5)]"><FullBodyAvatar profile={currentUser?.profile} bodyStats={currentUser?.bodyStats} size="w-56 h-[380px]" pose={avatarPose} /></div>
                <div className="flex gap-2 bg-neutral-900 p-1.5 rounded-xl border border-neutral-800 shadow-inner z-10">
                  <button onClick={() => setAvatarPose("standard")} className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${avatarPose === "standard" ? "bg-emerald-500 text-neutral-950 shadow-md" : "text-neutral-400 hover:text-white"}`}>스탠다드</button>
                  <button onClick={() => setAvatarPose("hip")} className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${avatarPose === "hip" ? "bg-emerald-500 text-neutral-950 shadow-md" : "text-neutral-400 hover:text-white"}`}>당당함 😤</button>
                  <button onClick={() => setAvatarPose("flex")} className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${avatarPose === "flex" ? "bg-emerald-500 text-neutral-950 shadow-md" : "text-neutral-400 hover:text-white"}`}>포징 🏋️‍♂️</button>
                </div>
              </div>
              <div className="px-6 space-y-8">
                <div>
                  <span className="text-xs font-black text-neutral-500 mb-3 block tracking-widest uppercase">성별 베이스</span>
                  <div className="flex gap-3">
                     <button onClick={() => updateProfile({ gender: 'male' })} className={`flex-1 py-4 rounded-2xl font-black text-sm transition-all border-2 ${currentUser?.profile?.gender === 'male' ? 'bg-[#4768ff] text-white border-[#4768ff] shadow-[0_5px_15px_rgba(71,104,255,0.3)]' : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:bg-neutral-800'}`}>남자 (근육형)</button>
                     <button onClick={() => updateProfile({ gender: 'female' })} className={`flex-1 py-4 rounded-2xl font-black text-sm transition-all border-2 ${currentUser?.profile?.gender === 'female' ? 'bg-[#4768ff] text-white border-[#4768ff] shadow-[0_5px_15px_rgba(71,104,255,0.3)]' : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:bg-neutral-800'}`}>여자 (슬림형)</button>
                  </div>
                </div>
                <div>
                  <span className="text-xs font-black text-neutral-500 mb-3 block tracking-widest uppercase">얼굴 표정</span>
                  <div className="flex gap-3">
                     <button onClick={() => updateProfile({ faceExpression: 'normal' })} className={`flex-1 py-4 rounded-2xl font-black text-sm transition-all border-2 ${currentUser?.profile?.faceExpression === 'normal' ? 'bg-[#4768ff] text-white border-[#4768ff]' : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:bg-neutral-800'}`}>기본</button>
                     <button onClick={() => updateProfile({ faceExpression: 'smile' })} className={`flex-1 py-4 rounded-2xl font-black text-sm transition-all border-2 ${currentUser?.profile?.faceExpression === 'smile' ? 'bg-[#4768ff] text-white border-[#4768ff]' : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:bg-neutral-800'}`}>미소</button>
                     <button onClick={() => updateProfile({ faceExpression: 'angry' })} className={`flex-1 py-4 rounded-2xl font-black text-sm transition-all border-2 ${currentUser?.profile?.faceExpression === 'angry' ? 'bg-[#4768ff] text-white border-[#4768ff]' : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:bg-neutral-800'}`}>진지</button>
                  </div>
                </div>
                <div>
                  <span className="text-xs font-black text-neutral-500 mb-3 block tracking-widest uppercase">피부 톤</span>
                  <div className="flex bg-neutral-900 p-4 rounded-[20px] border border-neutral-800 shadow-inner gap-3 overflow-x-auto hide-scrollbar">
                    {AVATAR_SKIN_TONES.map(color => (<button key={`skinColor-${color}`} onClick={() => updateProfile({ skinColor: color })} style={{ backgroundColor: color }} aria-label="피부 톤 선택" className={`w-10 h-10 flex-shrink-0 rounded-full border-2 transition-all ${(currentUser?.profile?.skinColor || AVATAR_SKIN_TONES[1]) === color ? 'border-white scale-110 shadow-md ring-2 ring-white/20' : 'border-neutral-700 opacity-60 hover:opacity-100'}`} />))}
                  </div>
                </div>
                <div>
                  <span className="text-xs font-black text-neutral-500 mb-3 block tracking-widest uppercase">눈동자 색</span>
                  <div className="flex bg-neutral-900 p-4 rounded-[20px] border border-neutral-800 shadow-inner gap-3 overflow-x-auto hide-scrollbar">
                    {AVATAR_EYE_COLORS.map(color => (<button key={`eyeColor-${color}`} onClick={() => updateProfile({ eyeColor: color })} style={{ backgroundColor: color }} aria-label="눈동자 색 선택" className={`w-10 h-10 flex-shrink-0 rounded-full border-2 transition-all ${(currentUser?.profile?.eyeColor || AVATAR_EYE_COLORS[0]) === color ? 'border-white scale-110 shadow-md ring-2 ring-white/20' : 'border-neutral-700 opacity-60 hover:opacity-100'}`} />))}
                  </div>
                </div>
                {renderAccessoryCategory("상의", "topStyle", "shirtColor", [{ label: "티셔츠", value: "tshirt" }, { label: "민소매", value: "tank" }, { label: currentUser?.profile?.gender === 'female' ? "스포츠 브라" : "상의 탈의", value: "none" }], SHIRT_COLORS, 'tshirt', currentUser?.profile?.gender === 'female')}
                {renderAccessoryCategory("하의", "bottomStyle", "bottomColor", [{ label: "반바지", value: "shorts" }, { label: "조거 팬츠", value: "joggers" }, { label: "레깅스", value: "leggings" }], BOTTOM_COLORS, 'shorts')}
                {renderAccessoryCategory("운동화", "shoeStyle", "shoeColor", [{ label: "러닝화", value: "runner" }], AVATAR_SHOE_COLORS, 'runner')}
                {renderAccessoryCategory("머리 장식 (모자/밴드)", "hat", "hatColor", [{ label: "없음", value: "none" }, { label: "헤어밴드", value: "headband" }, { label: "스냅백", value: "cap" }, { label: "비니", value: "beanie" }, { label: "반다나", value: "bandana" }])}
                {renderAccessoryCategory("얼굴 장식 (안경/마스크)", "faceAcc", "faceAccColor", [{ label: "없음", value: "none" }, { label: "뿔테안경", value: "glasses" }, { label: "선글라스", value: "sunglasses" }, { label: "마스크", value: "mask" }])}
                {renderAccessoryCategory("목 장식 (목걸이/헤드폰)", "neckAcc", "neckAccColor", [{ label: "없음", value: "none" }, { label: "체인 목걸이", value: "chain" }, { label: "스포츠 수건", value: "towel" }, { label: "헤드폰", value: "headphones" }])}
                {renderAccessoryCategory("바디 장식 (가방/장비)", "bodyAcc", "bodyAccColor", [{ label: "없음", value: "none" }, { label: "리프팅벨트", value: "belt" }, { label: "중량조끼", value: "vest" }, { label: "크로스백", value: "bag" }])}
                {renderAccessoryCategory("헤어 스타일", "hairStyle", "hairColor", [{ label: "민머리", value: "none" }, { label: "짧은머리", value: "short" }, { label: "투블럭", value: "classic" }, { label: "스파이키", value: "spiky" }, { label: "긴머리", value: "long" }, { label: "포니테일", value: "ponytail" }, { label: "단발", value: "bob" }, { label: "올림머리", value: "bun" }], HAIR_COLORS)}
                {renderAccessoryCategory("수염 (Facial Hair)", "facialHair", "hairColor", [{ label: "없음", value: "none" }, { label: "콧수염", value: "mustache" }, { label: "턱수염", value: "goatee" }, { label: "풀 비어드", value: "beard" }], HAIR_COLORS)}
                {renderAccessoryCategory("타투 & 흉터 (Tattoo)", "tattoo", "tattooColor", [{ label: "없음", value: "none" }, { label: "상처", value: "scar" }, { label: "눈밑 십자가", value: "cross" }, { label: "가슴 트라이벌", value: "chest_tribal" }], ["#171717", "#ef4444", "#3b82f6", "#10b981", "#f59e0b"])}
                {renderAccessoryCategory("특수 오라 (Aura & Effects)", "aura", "auraColor", [{ label: "없음", value: "none" }, { label: "은은한 빛", value: "glow" }, { label: "타오르는 불꽃", value: "fire" }, { label: "강력한 번개", value: "lightning" }, { label: "땀방울", value: "sweat" }], ACC_COLORS)}
                <div className="pb-8"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isFullCalendarOpen && (() => {
        const todayStr = formatDate(new Date());
        const monthPrefix = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-`;
        const monthWorkoutDays = Object.keys(safeWorkouts).filter(k => k.startsWith(monthPrefix) && Array.isArray(safeWorkouts[k]) && safeWorkouts[k].length > 0).length;
        const moveMonth = (delta) => {
          const m = calendarMonth + delta;
          if (m < 0) { setCalendarMonth(11); setCalendarYear(prev => prev - 1); }
          else if (m > 11) { setCalendarMonth(0); setCalendarYear(prev => prev + 1); }
          else setCalendarMonth(m);
        };
        return (
          <div className="fixed inset-0 bg-black/40 z-[80] flex items-center justify-center p-4 backdrop-blur-[2px] animate-fade-in" onClick={() => setIsFullCalendarOpen(false)}>
            <div className="bg-white rounded-[28px] p-5 max-w-sm w-full shadow-[0_20px_60px_rgba(0,0,0,0.2)] text-neutral-900 relative" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-1">
                  <button onClick={() => moveMonth(-1)} aria-label="이전 달" className="w-9 h-9 rounded-full hover:bg-neutral-100 flex items-center justify-center text-neutral-500 active:scale-90 transition-all"><ChevronLeft className="w-5 h-5"/></button>
                  <span className="text-lg font-black tracking-tight min-w-[104px] text-center">{calendarYear}년 {calendarMonth + 1}월</span>
                  <button onClick={() => moveMonth(1)} aria-label="다음 달" className="w-9 h-9 rounded-full hover:bg-neutral-100 flex items-center justify-center text-neutral-500 active:scale-90 transition-all"><ChevronRight className="w-5 h-5"/></button>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => { const today = new Date(); setCalendarYear(today.getFullYear()); setCalendarMonth(today.getMonth()); setCurrentDate(todayStr); setIsFullCalendarOpen(false); }} className="text-xs font-black text-neutral-700 bg-neutral-100 px-3 h-8 rounded-full hover:bg-neutral-200 transition-colors">오늘</button>
                  <button onClick={() => setIsFullCalendarOpen(false)} aria-label="닫기" className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center active:scale-90 transition-all"><X className="w-4 h-4 text-neutral-500"/></button>
                </div>
              </div>
              <div className="text-xs font-bold text-neutral-400 px-2 mb-4">이번 달 <span className="text-[#4768ff] font-black">{monthWorkoutDays}일</span> 운동했어요</div>
              <div className="grid grid-cols-7 gap-y-1 text-center">
                {['일','월','화','수','목','금','토'].map((d,i) => <div key={`dw-${d}`} className={`text-[11px] font-bold pb-2 ${i===0 ? 'text-rose-400' : i===6 ? 'text-blue-400' : 'text-neutral-400'}`}>{d}</div>)}
                {getMonthDays(calendarYear, calendarMonth).map((d, i) => {
                  if (!d) return <div key={`empty-${i}`} />;
                  const dateStr = formatDate(d);
                  const isSelected = dateStr === currentDate;
                  const isToday = dateStr === todayStr;
                  const hasWorkout = Array.isArray(safeWorkouts[dateStr]) && safeWorkouts[dateStr].length > 0;
                  return (
                    <button key={`day-${i}`} onClick={() => { setCurrentDate(dateStr); setIsFullCalendarOpen(false); }} className="flex flex-col items-center gap-0.5 py-0.5 active:scale-90 transition-transform">
                      <span className={`w-10 h-10 rounded-full flex items-center justify-center text-[15px] font-bold transition-colors ${isSelected ? 'bg-neutral-900 text-white font-black' : isToday ? 'bg-[#eef2ff] text-[#4768ff] font-black' : d.getDay() === 0 ? 'text-rose-400 hover:bg-neutral-100' : 'text-neutral-800 hover:bg-neutral-100'}`}>{d.getDate()}</span>
                      <span className={`w-1 h-1 rounded-full ${hasWorkout ? 'bg-[#4768ff]' : 'bg-transparent'}`} />
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-3 mt-3 pt-3 border-t border-neutral-100 px-1 text-[11px] font-bold text-neutral-400">
                <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#4768ff]" />운동한 날</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#eef2ff] ring-1 ring-[#c7d2fe]" />오늘</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-neutral-900" />선택한 날</span>
              </div>
            </div>
          </div>
        );
      })()}

      {selectedProgramModal && (
        <div className="fixed inset-0 bg-black/70 z-[70] flex flex-col justify-end animate-fade-in" onClick={() => setSelectedProgramModal(null)}>
          <div className="bg-white text-neutral-900 w-full h-[85vh] rounded-t-[40px] flex flex-col shadow-[0_-20px_50px_rgba(0,0,0,0.5)] animate-slide-up relative overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex justify-center pt-3 pb-2 bg-white"><div className="w-12 h-1.5 bg-neutral-200 rounded-full"></div></div>
            <div className="px-6 flex justify-between items-start mb-4 border-b border-neutral-100 pb-5 bg-white">
              <div>
                <div className={`${selectedProgramModal.badgeColor} text-[10px] font-black px-2.5 py-1 rounded-md w-max mb-2`}>{String(selectedProgramModal.level)} · {String(selectedProgramModal.duration)}</div>
                <h2 className="text-2xl font-black tracking-tight">{String(selectedProgramModal.title)}</h2>
                <p className="text-sm font-bold text-neutral-500 mt-2">{String(selectedProgramModal.desc)}</p>
              </div>
              <button onClick={() => setSelectedProgramModal(null)} className="p-2 bg-neutral-100 rounded-full hover:bg-neutral-200 transition-colors active:scale-90"><X className="w-5 h-5 text-neutral-500"/></button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 space-y-4 pb-4 bg-neutral-50 pt-4">
              {selectedProgramModal.workouts.map((w, idx) => {
                const ex = EXERCISE_OPTIONS.find(e => e.id === w.exerciseId);
                return (
                  <div key={`prm-${idx}`} className="flex gap-4 items-center bg-white p-5 rounded-2xl border border-neutral-100 shadow-sm hover:border-[#4768ff] transition-colors group">
                    <SmartExerciseThumbnail exerciseId={ex?.id} target={ex ? ex.target : '전신'} tool={ex ? ex.tool : '바벨'} size="w-14 h-14" showShadow={false}/>
                    <div className="flex-1">
                      <div className="font-black text-neutral-900 text-lg group-hover:text-[#4768ff] transition-colors">{ex ? ex.name : '운동'}</div>
                      <div className="text-xs text-neutral-500 font-bold mt-1 bg-neutral-50 px-2 py-1 rounded w-max">{w.sets}세트 · {w.reps}회 · {w.weight}kg</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="px-6 pt-4 pb-6 bg-white mt-auto border-t border-neutral-100 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
              <button onClick={() => { loadProgramWorkout(selectedProgramModal.id); setSelectedProgramModal(null); }} className="w-full bg-[#4768ff] text-white font-black py-4 rounded-2xl shadow-[0_10px_30px_rgba(71,104,255,0.3)] text-lg active:scale-95 transition-transform hover:bg-blue-600">이 프로그램 시작하기</button>
            </div>
          </div>
        </div>
      )}

      {selectedLegendModal && (
        <div className="fixed inset-0 bg-black/80 z-[75] flex flex-col justify-end animate-fade-in" onClick={() => setSelectedLegendModal(null)}>
          <div className="bg-white text-neutral-900 w-full h-[90vh] rounded-t-[40px] flex flex-col shadow-[0_-20px_50px_rgba(0,0,0,0.5)] animate-slide-up relative overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="relative text-white h-64 flex-shrink-0 bg-neutral-900 overflow-hidden">
              <LegendArt id={selectedLegendModal.id} />
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
              <button onClick={() => setSelectedLegendModal(null)} className="absolute top-5 right-5 z-10 p-2 bg-black/40 rounded-full hover:bg-black/60 transition-colors active:scale-90 backdrop-blur-sm"><X className="w-5 h-5"/></button>
              <div className="relative z-10 h-full w-[66%] px-6 py-6 flex flex-col justify-end">
                <div className="text-[10px] font-black bg-white/15 px-2.5 py-1 rounded-md w-max mb-2 border border-white/25 backdrop-blur-sm">{selectedLegendModal.era}</div>
                <h2 className="text-2xl font-black tracking-tight leading-tight mb-2 drop-shadow">{selectedLegendModal.name.split(' (')[0]}</h2>
                <p className="text-xs font-bold text-white/85 leading-relaxed line-clamp-3">{selectedLegendModal.desc}</p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-6 bg-neutral-50 space-y-4">
              {selectedLegendModal.split && (
                <div className="bg-white rounded-2xl border border-neutral-200 p-4 space-y-3">
                  <div className="flex items-start gap-2">
                    <CalendarDays className="w-4 h-4 text-[#4768ff] mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[11px] font-black text-neutral-400">주간 분할</p>
                      <p className="text-sm font-black text-neutral-900 leading-snug">{selectedLegendModal.split}</p>
                    </div>
                  </div>
                  {selectedLegendModal.basis && <p className="text-[11px] font-bold text-neutral-500 leading-relaxed bg-neutral-50 rounded-xl p-3 flex gap-1.5"><Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-neutral-400" />{selectedLegendModal.basis}</p>}
                </div>
              )}
              <h3 className="text-sm font-black text-neutral-500 mb-2">🔥 부위별 훈련 프로그램</h3>
              {selectedLegendModal.routines.map((routine, idx) => (
                <div key={`leg-r-${idx}`} className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden group">
                  <div className="p-5 border-b border-neutral-100">
                    <div className="flex justify-between items-center mb-1">
                       <h4 className="font-black text-lg text-neutral-900 group-hover:text-[#4768ff] transition-colors">{routine.title}</h4>
                       <span className="text-[10px] font-bold bg-blue-50 text-[#4768ff] px-2 py-1 rounded">총 {routine.workouts.length}종목</span>
                    </div>
                    <p className="text-xs text-neutral-500 font-bold">{routine.desc}</p>
                  </div>
                  <div className="bg-neutral-50 p-4 space-y-3">
                    {routine.workouts.map((w, wIdx) => {
                      const ex = EXERCISE_OPTIONS.find(e => e.id === w.exerciseId);
                      return (
                        <div key={`wrk-${wIdx}`} className="flex justify-between items-center bg-white p-3 rounded-xl border border-neutral-100">
                           <div className="flex items-center gap-3">
                              <SmartExerciseThumbnail exerciseId={ex?.id} target={ex ? ex.target : '전신'} tool={ex ? ex.tool : '바벨'} size="w-10 h-10" showShadow={false}/>
                              <span className="font-black text-sm text-neutral-800">{ex ? ex.name : '운동'}</span>
                           </div>
                           <div className="flex flex-col items-end gap-1 flex-shrink-0">
                             <span className="text-xs font-black text-neutral-400 bg-neutral-100 px-2 py-1 rounded">{w.sets}세트 x {w.reps}회</span>
                             {w.note && <span className="text-[10px] font-black text-[#4768ff]">{w.note}</span>}
                           </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="p-4 bg-white border-t border-neutral-100"><button onClick={() => loadLegendRoutine(routine)} className="w-full bg-neutral-900 text-white font-black py-3 rounded-xl hover:bg-neutral-800 transition-colors text-sm">선택한 루틴 시작하기</button></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {isBodyStatsModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[90] flex flex-col justify-end backdrop-blur-sm transition-opacity" onClick={() => setIsBodyStatsModalOpen(false)}>
          <div className="bg-white text-neutral-900 rounded-t-[40px] p-6 w-full shadow-2xl border-t border-neutral-100 animate-slide-up pb-10" onClick={e => e.stopPropagation()}>
            <div className="flex justify-center mb-6"><div className="w-12 h-1.5 bg-neutral-200 rounded-full"></div></div>
            <h3 className="text-2xl font-black mb-6 tracking-tight text-center">신체 정보 업데이트</h3>
            <div className="space-y-4 mb-8">
              <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-100 flex justify-between items-center shadow-inner">
                <span className="font-black text-neutral-600 text-sm">몸무게 (kg)</span>
                <input type="number" value={tempStats.weight} onChange={e=>setTempStats({...tempStats, weight: e.target.value})} className="w-24 text-right font-black text-2xl bg-transparent border-b-2 border-neutral-300 focus:border-[#4768ff] outline-none transition-colors text-neutral-900 placeholder:text-neutral-300" placeholder="-"/>
              </div>
              <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-100 flex justify-between items-center shadow-inner">
                <span className="font-black text-neutral-600 text-sm">골격근량 (kg)</span>
                <input type="number" value={tempStats.muscle} onChange={e=>setTempStats({...tempStats, muscle: e.target.value})} className="w-24 text-right font-black text-2xl bg-transparent border-b-2 border-neutral-300 focus:border-[#4768ff] outline-none transition-colors text-neutral-900 placeholder:text-neutral-300" placeholder="-"/>
              </div>
              <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-100 flex justify-between items-center shadow-inner">
                <span className="font-black text-neutral-600 text-sm">체지방률 (%)</span>
                <input type="number" value={tempStats.fat} onChange={e=>setTempStats({...tempStats, fat: e.target.value})} className="w-24 text-right font-black text-2xl bg-transparent border-b-2 border-neutral-300 focus:border-[#4768ff] outline-none transition-colors text-neutral-900 placeholder:text-neutral-300" placeholder="-"/>
              </div>
            </div>
            <button onClick={saveBodyStats} className="w-full bg-[#4768ff] text-white font-black py-4 rounded-2xl shadow-[0_10px_25px_rgba(71,104,255,0.3)] text-lg hover:bg-blue-600 active:scale-95 transition-all">저장하기</button>
          </div>
        </div>
      )}

      {isOneRmCalculatorOpen && (
        <div className="fixed inset-0 bg-black/80 z-[95] flex items-center justify-center p-4 backdrop-blur-sm animate-scale-up" onClick={() => setIsOneRmCalculatorOpen(false)}>
          <div className="bg-neutral-900 text-white rounded-[32px] p-6 max-w-sm w-full border border-neutral-800 shadow-2xl relative" onClick={e=>e.stopPropagation()}>
            <button onClick={() => setIsOneRmCalculatorOpen(false)} className="absolute top-4 right-4 p-2 bg-neutral-800 rounded-full text-neutral-400"><X className="w-5 h-5"/></button>
            <div className="flex items-center gap-2 mb-6"><Calculator className="w-6 h-6 text-emerald-400"/><h3 className="text-xl font-black">1RM 추정 계산기</h3></div>
            <div className="space-y-4 mb-6">
              <div><label className="text-xs font-bold text-neutral-400 mb-1 block">수행 중량 (kg)</label><input type="number" value={calcInputs.weight} onChange={e => setCalcInputs({...calcInputs, weight: parseFloat(e.target.value)||0})} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-lg font-black text-white text-center outline-none focus:border-emerald-500"/></div>
              <div><label className="text-xs font-bold text-neutral-400 mb-1 block">반복 횟수 (Reps)</label><input type="number" value={calcInputs.reps} onChange={e => setCalcInputs({...calcInputs, reps: parseInt(e.target.value, 10)||0})} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-lg font-black text-white text-center outline-none focus:border-emerald-500"/></div>
            </div>
            <div className="bg-neutral-950 p-5 rounded-2xl border border-neutral-800 text-center mb-6">
              <span className="text-xs font-bold text-neutral-400 block mb-1">추정 1RM (최대 1회 무게)</span>
              <span className="text-4xl font-black text-emerald-400 font-mono">{calculate1RM(calcInputs.weight, calcInputs.reps)} <span className="text-base text-neutral-400 font-bold">kg</span></span>
              <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-neutral-800 text-xs">
                 <div className="text-left"><span className="text-neutral-500 block">85% (근력/스트렝스)</span><span className="font-bold text-white">{Math.round(calculate1RM(calcInputs.weight, calcInputs.reps)*0.85)}kg</span></div>
                 <div className="text-right"><span className="text-neutral-500 block">75% (근비대 타겟)</span><span className="font-bold text-white">{Math.round(calculate1RM(calcInputs.weight, calcInputs.reps)*0.75)}kg</span></div>
              </div>
            </div>
            <button onClick={() => setIsOneRmCalculatorOpen(false)} className="w-full bg-emerald-500 text-neutral-950 font-black py-3.5 rounded-xl text-base shadow-[0_0_15px_rgba(16,185,129,0.3)]">확인 완료</button>
          </div>
        </div>
      )}

      {isManualRmModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-[95] flex items-center justify-center p-4 backdrop-blur-sm animate-scale-up" onClick={() => setIsManualRmModalOpen(false)}>
          <div className="bg-neutral-900 text-white rounded-[32px] p-6 max-w-sm w-full border border-neutral-800 shadow-2xl relative" onClick={e=>e.stopPropagation()}>
            <button onClick={() => setIsManualRmModalOpen(false)} className="absolute top-4 right-4 p-2 bg-neutral-800 rounded-full text-neutral-400"><X className="w-5 h-5"/></button>
            <div className="flex items-center gap-2 mb-2"><Edit3 className="w-6 h-6 text-[#4768ff]"/><h3 className="text-xl font-black">수동 1RM 기록</h3></div>
            <p className="text-xs font-bold text-neutral-400 mb-6">헬스장에서 측정한 기록을 직접 입력하면 앱 기록을 덮어씁니다. (비워두면 앱 기록 사용)</p>
            <div className="space-y-3 mb-6">
              {[['sq', '스쿼트', 'text-rose-400'], ['bp', '벤치프레스', 'text-blue-400'], ['dl', '데드리프트', 'text-emerald-500']].map(([key, label, color]) => (
                <div key={key} className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800 flex justify-between items-center">
                  <span className={`font-black ${color} text-sm`}>{label}</span>
                  <div className="flex items-center gap-1">
                    <input type="number" inputMode="decimal" placeholder="0" value={manualRmInputs[key]} onFocus={e => e.target.select()} onChange={e=>setManualRmInputs({...manualRmInputs, [key]: e.target.value})} className="w-20 text-right font-black text-xl bg-transparent border-b border-neutral-700 focus:border-[#4768ff] outline-none transition-colors" placeholder="-"/>
                    <span className="text-neutral-500 font-bold text-sm">kg</span>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={saveManualRm} className="w-full bg-[#4768ff] text-white font-black py-4 rounded-xl text-base shadow-[0_10px_25px_rgba(71,104,255,0.3)] hover:bg-blue-600 transition-colors">저장하기</button>
          </div>
        </div>
      )}

      {muscleSubPicker && (
        <div className="fixed inset-0 bg-black/70 z-[80] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in" onClick={() => setMuscleSubPicker(null)}>
          <div className="bg-white text-neutral-900 rounded-[32px] p-6 w-full max-w-sm shadow-2xl border border-neutral-100 animate-scale-up relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setMuscleSubPicker(null)} className="absolute top-4 right-4 p-2 bg-neutral-100 rounded-full text-neutral-400 hover:bg-neutral-200 transition-colors"><X className="w-5 h-5"/></button>
            <p className="text-xs font-black text-[#4768ff] mb-1">세부 부위 선택</p>
            <h3 className="text-2xl font-black tracking-tight mb-1">{muscleSubPicker}</h3>
            <p className="text-sm font-bold text-neutral-500 mb-5">어느 부위를 집중해서 훈련할까요?</p>
            <div className="space-y-2.5">
              {MUSCLE_SUBGROUPS[muscleSubPicker].map(sub => {
                const count = getMuscleExercises({ group: muscleSubPicker, sub }).length;
                return (
                  <button key={sub.key} onClick={() => pickMuscleSub(muscleSubPicker, sub)} className="w-full text-left bg-neutral-50 hover:bg-[#e8edff] border border-neutral-100 hover:border-[#4768ff] rounded-2xl p-4 flex items-center gap-3 transition-all active:scale-[0.98] group">
                    <span className="text-[11px] font-black text-white bg-neutral-900 group-hover:bg-[#4768ff] px-2.5 py-1 rounded-lg transition-colors">{sub.key}</span>
                    <span className="flex-1 min-w-0">
                      <span className="block font-black text-neutral-900">{sub.label}</span>
                      <span className="block text-[11px] font-bold text-neutral-400 truncate">{sub.desc}</span>
                    </span>
                    <span className="text-[10px] font-black text-neutral-400 whitespace-nowrap">{count}종목</span>
                    <ChevronRight className="w-4 h-4 text-neutral-300 group-hover:text-[#4768ff]" />
                  </button>
                );
              })}
            </div>
            <button onClick={() => pickMuscleSub(muscleSubPicker, null)} className="w-full mt-4 text-xs font-bold text-neutral-400 hover:text-neutral-700 py-2 transition-colors">{muscleSubPicker} 전체 골고루 하기</button>
          </div>
        </div>
      )}

      {muscleConfirmModal && (() => {
        const muscleStatus = getMuscleRecoveryStatus()[muscleConfirmModal.group];
        const isRecovered = !muscleStatus || muscleStatus.percent >= 90;
        const confirmTitle = muscleConfirmModal.sub ? `${muscleConfirmModal.group} · ${muscleConfirmModal.sub.key}` : muscleConfirmModal.group;
        const previewExercises = getMuscleExercises(muscleConfirmModal).slice(0, 4);
        return (
        <div className="fixed inset-0 bg-black/70 z-[80] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in" onClick={() => setMuscleConfirmModal(null)}>
          <div className="bg-white text-neutral-900 rounded-[40px] p-8 w-full max-w-sm shadow-2xl border border-neutral-100 animate-scale-up text-center relative" onClick={e=>e.stopPropagation()}>
             <button onClick={() => setMuscleConfirmModal(null)} className="absolute top-4 right-4 p-2 bg-neutral-100 rounded-full text-neutral-400 hover:bg-neutral-200 transition-colors"><X className="w-5 h-5"/></button>
             {isRecovered ? (
               <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5 border border-emerald-100 shadow-sm"><Zap className="w-10 h-10 text-emerald-500 fill-emerald-500/20" /></div>
             ) : (
               <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-5 border border-amber-100 shadow-sm"><Clock className="w-10 h-10 text-amber-500" /></div>
             )}
             <h3 className="text-2xl font-black mb-2 tracking-tight">[{confirmTitle}] {isRecovered ? '회복 완료!' : '아직 회복 중'}</h3>
             {isRecovered ? (
               <p className="text-sm font-bold text-neutral-500 mb-5 leading-relaxed">근육이 충분히 쉬었습니다.<br/>바로 추천 루틴으로 훈련을 시작할까요?</p>
             ) : (
               <p className="text-sm font-bold text-neutral-500 mb-5 leading-relaxed">{muscleStatus.text}<br/>회복 전에 훈련하면 부상 위험이 있어요. 그래도 시작할까요?</p>
             )}
             <div className="flex flex-wrap justify-center gap-1.5 mb-7">
               {previewExercises.map(ex => (
                 <span key={ex.id} className="text-[11px] font-black text-neutral-600 bg-neutral-100 border border-neutral-200 px-2 py-1 rounded-lg">{ex.name}</span>
               ))}
             </div>
             <div className="flex gap-3">
               <button onClick={() => setMuscleConfirmModal(null)} className="flex-1 py-4 bg-neutral-100 text-neutral-500 font-black rounded-2xl hover:bg-neutral-200 transition-colors active:scale-95">닫기</button>
               <button onClick={startMuscleRoutine} className="flex-[2] py-4 bg-emerald-500 text-white font-black rounded-2xl shadow-[0_10px_25px_rgba(16,185,129,0.3)] hover:bg-emerald-400 transition-all active:scale-95 text-lg">{isRecovered ? '훈련 시작하기' : '그래도 시작하기'}</button>
             </div>
          </div>
        </div>
        );
      })()}

      {isAiCoachOpen && (
        <AiCoach
          onClose={() => setIsAiCoachOpen(false)}
          profile={activeUser?.profile}
          bodyStats={activeUser?.bodyStats}
          report={getWeeklyLoadReport(getAnalysisWeekInfo(new Date()).monday)}
          bestLifts={getBestLifts()}
          programs={PROGRAMS}
          exercises={EXERCISE_OPTIONS}
          onOpenProgram={(id) => { const prog = PROGRAMS.find(p => p.id === id); if (prog) { setIsAiCoachOpen(false); setSelectedProgramModal(prog); } }}
          onOpenGuide={(id) => { if (EXERCISE_GUIDES[id]) setGuideExerciseId(id); }}
        />
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-neutral-100 flex justify-around items-center pt-2 px-2 z-30 text-neutral-400 h-[80px] shadow-[0_-10px_30px_rgba(0,0,0,0.05)] pb-safe">
        <button onClick={() => setActiveTab('workout')} className={`flex flex-col items-center gap-1.5 p-2 transition-all active:scale-90 w-16 ${activeTab==='workout' ? 'text-neutral-900 -translate-y-1' : 'hover:text-neutral-500'}`}><Dumbbell className={`w-6 h-6 ${activeTab==='workout' ? 'fill-neutral-900 stroke-neutral-900 drop-shadow-md' : ''}`} /><span className="text-[10px] font-black tracking-wider">운동</span></button>
        <button onClick={() => setActiveTab('analysis')} className={`flex flex-col items-center gap-1.5 p-2 transition-all active:scale-90 w-16 ${activeTab==='analysis' ? 'text-neutral-900 -translate-y-1' : 'hover:text-neutral-500'}`}><BarChart2 className={`w-6 h-6 ${activeTab==='analysis' ? 'fill-neutral-900 stroke-neutral-900 drop-shadow-md' : ''}`} /><span className="text-[10px] font-black tracking-wider">분석</span></button>
        <button onClick={() => setActiveTab('program')} className={`flex flex-col items-center gap-1.5 p-2 transition-all active:scale-90 w-16 ${activeTab==='program' ? 'text-neutral-900 -translate-y-1' : 'hover:text-neutral-500'}`}><LayoutGrid className={`w-6 h-6 ${activeTab==='program' ? 'fill-neutral-900 stroke-neutral-900 drop-shadow-md' : ''}`} /><span className="text-[10px] font-black tracking-wider">프로그램</span></button>
        <button onClick={() => setActiveTab('ranking')} className={`flex flex-col items-center gap-1.5 p-2 transition-all active:scale-90 w-16 ${activeTab==='ranking' ? 'text-neutral-900 -translate-y-1' : 'hover:text-neutral-500'}`}><Trophy className={`w-6 h-6 ${activeTab==='ranking' ? 'fill-neutral-900 stroke-neutral-900 drop-shadow-md' : ''}`} /><span className="text-[10px] font-black tracking-wider">랭킹</span></button>
        <button onClick={() => setActiveTab('profile')} className="flex flex-col items-center gap-1.5 p-2 transition-all active:scale-90 w-16">
          {activeUser ? <div className={`border-2 rounded-full p-0.5 ${activeTab==='profile' ? 'border-[#4768ff] shadow-md scale-110' : 'border-transparent'}`}><FullBodyAvatar profile={activeUser.profile} bodyStats={activeUser.bodyStats} size="w-6 h-6" crop={true} /></div> : <User className={`w-6 h-6 ${activeTab==='profile' ? 'text-neutral-900 drop-shadow-md' : ''}`} />}
          <span className={`text-[10px] font-black tracking-wider ${activeTab==='profile' ? 'text-neutral-900' : 'text-neutral-500'}`}>프로필</span>
        </button>
      </div>
    </div>
  );
}
