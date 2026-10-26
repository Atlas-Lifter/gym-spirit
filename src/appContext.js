import { createContext, useContext } from 'react';

// 화면 파일들이 앱 상태(useGymApp 결과)를 꺼내 쓰는 통로
export const AppContext = createContext(null);
export const useApp = () => useContext(AppContext);
