import React from 'react';
import { AppContext } from './appContext.js';
import { AuthScreen } from './screens/AuthScreen.jsx';
import { DietScreen } from './screens/DietScreen.jsx';
import { MainScreen } from './screens/MainScreen.jsx';
import { WorkoutScreen } from './screens/WorkoutScreen.jsx';
import { useGymApp } from './useGymApp.jsx';

// GYM SPIRIT 앱의 시작점: 상태는 useGymApp(), 화면은 screens/ 폴더에 나뉘어 있다
export default function App() {
  const app = useGymApp();
  const { currentScreen } = app;
  let screen = <MainScreen />;
  if (currentScreen === 'auth') screen = <AuthScreen />;
  if (currentScreen === 'diet') screen = <DietScreen />;
  if (currentScreen === 'workout') screen = <WorkoutScreen />;
  return <AppContext.Provider value={app}>{screen}</AppContext.Provider>;
}
