import React from 'react';
import { CheckCircle2, Dumbbell, Info } from 'lucide-react';
import { GlobalOverlays } from './GlobalOverlays.jsx';
import { useApp } from '../appContext.js';

// 로그인·회원가입·비밀번호 재설정 화면
export function AuthScreen() {
  const {
    authBusy,
    authChecking,
    authError,
    authNotice,
    currentUser,
    email,
    handleAuth,
    handleGuestLogin,
    handlePasswordReset,
    isLoginMode,
    password,
    recoveryMode,
    setAuthError,
    setAuthNotice,
    setEmail,
    setIsLoginMode,
    setPassword,
    setSignupNickname,
    signupNickname,
  } = useApp();
  return (
    <div className="min-h-screen bg-[#111111] flex items-center justify-center p-4 relative overflow-hidden">
      <GlobalOverlays />
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
