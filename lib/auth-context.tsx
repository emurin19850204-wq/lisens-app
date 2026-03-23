/**
 * LISENS - 認証コンテキスト
 * 
 * MVPではダミーデータを使ったシンプルな認証を提供する。
 * 将来はSupabase Authに差し替える。
 * 
 * なぜContextを使うか：
 * 認証状態はアプリ全体で共有する必要があり、
 * Server Componentではauthチェックをせず、
 * Client Componentでの表示制御にのみ使用する（MVP方針）。
 */
'use client';

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { User, AuthContextType } from './types';
import { users } from './dummy-data';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** ローカルストレージのキー */
const AUTH_STORAGE_KEY = 'lisens_auth_user_id';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 初期化: ローカルストレージからユーザーを復元
  useEffect(() => {
    const savedUserId = localStorage.getItem(AUTH_STORAGE_KEY);
    if (savedUserId) {
      const foundUser = users.find(u => u.id === savedUserId);
      if (foundUser) {
        setUser(foundUser);
      }
    }
    setIsLoading(false);
  }, []);

  // ログイン処理（ダミー: メールが一致すればパスワード不問）
  const login = useCallback(async (email: string, _password: string): Promise<boolean> => {
    const foundUser = users.find(u => u.email === email);
    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem(AUTH_STORAGE_KEY, foundUser.id);
      return true;
    }
    return false;
  }, []);

  // ログアウト処理
  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/** 認証状態を取得するフック */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth は AuthProvider 内で使用してください');
  }
  return context;
}
