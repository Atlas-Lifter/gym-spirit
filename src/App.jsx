import React from 'react';
import { AppContext } from './appContext.js';
import { AuthScreen } from './screens/AuthScreen.jsx';
import { DietScreen } from './screens/DietScreen.jsx';
import { MainScreen } from './screens/MainScreen.jsx';
import { WorkoutScreen } from './screens/WorkoutScreen.jsx';
import { Onboarding } from './screens/Onboarding.jsx';
import { useGymApp } from './useGymApp.jsx';

// GYM SPIRIT 앱의 시작점: 상태는 useGymApp(), 화면은 screens/ 폴더에 나뉘어 있다
export default function App() {
  const app = useGymApp();
  const { currentScreen, currentUser, cloudUser, cloudReady } = app;
  let screen = <MainScreen />;
  // 처음 쓰는 사람 안내: 기록이 하나도 없고 아직 안내를 마치지 않았을 때 기본 화면 위에 한 번
  const hasWorkout = Object.values(currentUser?.workouts || {}).some(w => Array.isArray(w) && w.length > 0);
  const showOnboarding = !!currentUser && !currentUser.onboarded && !hasWorkout && (!cloudUser || cloudReady)
    && !['auth', 'diet', 'workout'].includes(currentScreen);
  if (currentScreen === 'auth') screen = <AuthScreen />;
  if (currentScreen === 'diet') screen = <DietScreen />;
  if (currentScreen === 'workout') screen = <WorkoutScreen />;
  return <AppContext.Provider value={app}>{screen}{showOnboarding && <Onboarding />}</AppContext.Provider>;
}
